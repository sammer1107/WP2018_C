var BaseScene = require('./BaseScene');
var Group = require('../Group.js');
var randint = require('../utils').randint;
var shuffle = require('../utils').shuffle;
var constants = require('../constants');
var MUZI = constants.MUZI;
var KURO = constants.KURO;

const CHECK_INTERVAL = 10*1000;
const MAX_PLAYERS = 2;

class LobbyScene extends BaseScene{
    constructor(GameManager){
        super(GameManager, "Lobby");
        this.timer;
        this.check_interval;
    }
    
    init(){
        for(let group of this.game.groups){
            group.destroy();
        }
        this.game.groups= [];
        var players = [...this.game.players.values()];
        shuffle(players);
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
        return [randint(2525+100, 2525-100), randint(2525+100, 2525-100)];
    }
}

var Log = require('../utils').log_func(LobbyScene)

module.exports = LobbyScene;