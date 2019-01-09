var BaseScene = require('./BaseScene');
var Group = require('../Group.js');
var utils = require('../utils');
var map = utils.loadMap('map_muzikuro.json');

const CHECK_INTERVAL = 10*1000;
const MAX_PLAYERS = 4;

class LobbyScene extends BaseScene{
    constructor(GameManager){
        super(GameManager, "Lobby");
        this.timer;
        this.check_interval;
        this.process_pairing;
    }
    
    init(){
        this.timer = 0;
        for(let group of this.game.groups){
            group.destroy();
        }
        this.game.groups.length = 0;
        var players = this.game.players.getAvailable();
        Log(players);
        utils.shuffle(players);
        for(let i=0; i<Math.floor(players.length/2)*2; i+=2){
            this.game.groups.push(new Group(players[i], players[i+1], ...this.getRandomSpawnPoint()));
        }
        this.process_pairing = true;
    }
    
    start(){
        this.timer=0;
        this.check_interval = setInterval(()=>{ // check for early start
            // if paired player > MAX_PLAYERS
            this.timer += CHECK_INTERVAL;
            var num_player = this.game.players.getAvailable().length;
            if(num_player >= MAX_PLAYERS && num_player%2 == 0){
                // broadcast message
                this.stop();
                this.game.startScene("Compose");;
            }
        }, CHECK_INTERVAL);
        
    }
    
    stop(){
        Log('stopped scene.')
        clearInterval(this.check_interval);
        this.process_pairing = false;
        return;
    }
    
    getInitData(){
        return null;
    }
    
    getSceneState(){
        return null;
    }
    
    onLogin(socket, new_player){ // this will be called from GameManager.onLogin
        if(!this.process_pairing) return;
        socket.broadcast.emit("newPlayer", new_player.info());
        let partner = this.pairNewPlayer(socket, new_player);
        Log(`Created new player: name:${new_player.name}, role:${new_player.role}, partner:${partner ? partner.name : null}`);
    }

    onReturn(socket, player) {
        if(!this.process_pairing) return;
        let partner = this.pairNewPlayer(socket, player);
        Log(`Pairing returned player: name:${player.name}, role:${player.role}, partner:${partner ? partner.name : null}`);
    }

    pairNewPlayer(socket, new_pl) {
        for(let player of this.game.players.getAvailable()){
            if((player != new_pl) && (player.partner_id == null)){
                let new_group = new Group(player, new_pl, ...this.getRandomSpawnPoint());
                this.game.groups.push(new_group);
                socket.broadcast.emit("updatePartner", new_group.info());
                return player;
            }
        }
        return null;
    }
    
    onDisconnect(socket){ // this will be called on GameManager's on Disconnect
        var lonely_players;
        lonely_players = this.game.players.getAvailable().filter(p => p.partner_id == null);
        for(let i=0; i<Math.floor(lonely_players.length/2)*2; i+=2){
            let new_group = new Group(lonely_players[i], lonely_players[i+1], ...this.getRandomSpawnPoint())
            this.game.groups.push(new_group);
            socket.broadcast.emit("updatePartner", new_group.info());
        }
    } 
    
    getRandomSpawnPoint(){
        var radius = 5*map.tilewidth*map.scale;
        return [utils.randint(map.centerX-radius, map.centerX+radius), utils.randint(map.centerY-radius, map.centerY+radius)];
    }
}

var Log = require('../utils').log_func(LobbyScene)

module.exports = LobbyScene;