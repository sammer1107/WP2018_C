var BaseScene = require('./BaseScene');
var Group = require('../Group.js');
var utils = require('../utils');
var constants = require('../constants');
var MUZI = constants.MUZI;
var KURO = constants.KURO;
var map = utils.loadMap('map_muzikuro.json');

const CHECK_INTERVAL = 10*1000;
const MAX_PLAYERS = 2;

class LobbyScene extends BaseScene{
    constructor(GameManager){
        super(GameManager, "Lobby");
        this.timer;
        this.check_interval;
    }
    
    init(){
        this.timer = 0;
        for(let group of this.game.groups){
            group.destroy();
        }
        this.game.groups= [];
        var players = [...this.game.players.values()];
        utils.shuffle(players);
        var init_x, init_y;
        for(let i=0; i<Math.floor(players.length/2)*2; i+=2){
            this.game.groups.push(new Group(players[i], players[i+1], ...this.getRandomSpawnPoint()));
        }

    }
    
    start(){
        this.timer=0;
        this.check_interval = setInterval(()=>{ // check for early start
            // if paired player > MAX_PLAYERS
            this.timer += CHECK_INTERVAL;
            var num_player = this.game.players.size;
            if(num_player >= MAX_PLAYERS && num_player%2 == 0){
                this.stop();
                this.game.startScene("Compose");
            }
        }, CHECK_INTERVAL);
        
    }
    
    stop(){
        clearInterval(this.check_interval);
        return;
    }
    
    getInitData(){
        return null;
    }
    
    getStartData(){
        return null;
    }
    
    onLogin(socket, new_player){ // this will be called from GameManager.onLogin
        var partner;
        socket.broadcast.emit("newPlayer", new_player.info());
        // pair player
        for(let player of this.game.players.values()){
            if(player.partner_id == null){
                partner = player;
                let new_group = new Group(player, new_player, ...this.getRandomSpawnPoint());
                this.game.groups.push(new_group);
                socket.broadcast.emit("updatePartner", new_group.info());
                break;
            }
        }
        
        
        Log(`Created new player: name:${new_player.name}, role:${new_player.role}, partner:${partner ? partner.name : null}`);
    }
    
    onDisconnect(socket){ // this will be called on GameManager's on Disconnect
        var lonely_players;
        lonely_players = [ ...this.game.players.values() ].filter( (p)=>{return p.partner_id==null} );
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