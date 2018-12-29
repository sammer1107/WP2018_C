var BaseScene = require('./BaseScene');
var randint = require('../utils').randint;
var shuffle = require('../utils').shuffle;
var constants = require('../constants');
var MUZI = constants.MUZI;
var KURO = constants.KURO;
//const LOBBY_WAIT_TIME = 2*60*1000;
const CHECK_INTERVAL = 10*1000;
const MAX_PLAYERS = 2;

class LobbyScene extends BaseScene{
    constructor(GameManager){
        super(GameManager, "Lobby");
        this.timer;
        this.check_interval;
    }
    
    init(){
        //regroup players and give them initial position here 重新分組與配對(第一場玩muzi的第二場也能玩muzi) 沒配到的玩家資料要設為NULL
        var players = [...this.game.players.values()];
        shuffle(players);
        var init_x, init_y;
        for(let player of players){
            player.role = null;
            player.partner_id = null;
        }
        for(let i=0; i<Math.floor(players.length/2)*2; i+=2){
            this.group(players[i], players[i+1]);
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
                this.game.startScene("MuziKuro");
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
        var lonely_player, init_x, init_y, partner_config={};

        socket.broadcast.emit("newPlayer", new_player);
        // pair player
        for(let player of this.game.players.values()){
            if(player.partner_id == null){
                lonely_player = player;
                socket.broadcast.emit("updatePartner", this.group(lonely_player, new_player));
                break;
            }
        }
        
        
        Log(`Created new player: name:${new_player.name}, role:${new_player.role}, partner:${lonely_player ? lonely_player.name : null}`);
    }
    
    onDisconnect(socket){ // this will be called on GameManager's on Disconnect
        var lonely_players;
        lonely_players = [ ...this.game.players.values() ].filter( (p)=>{return p.partner_id==null} );
        for(let i=0; i<Math.floor(lonely_players.length/2)*2; i+=2){
            socket.broadcast.emit("updatePartner", this.group(lonely_players[i], lonely_players[i+1]));
        }
    } 
    
    getRandomSpawnPoint(){
        return [randint(2525+100, 2525-100), randint(2525+100, 2525-100)];
    }
    
    group(p1, p2){
        // this function set the partner_id and roles for p1 and p2 and return
        // the config for updatePartner event.
        var roles = [MUZI, KURO];
        var init_x, init_y;
        var rand = Math.floor(Math.random()*2);
        var partner_config = {};

        p1.partner_id = p2.id; 
        p2.partner_id = p1.id; 
        [p1.role, p2.role] = [roles[rand], roles[1-rand]];
        partner_config[p1.role] = p1.id;
        partner_config[p2.role] = p2.id;
        [init_x, init_y] = this.getRandomSpawnPoint();
        p1.setPosition(init_x, init_y);
        p2.setPosition(init_x, init_y);
        partner_config.x = init_x;
        partner_config.y = init_y;
        
        return partner_config
    }
}

var Log = require('../utils').log_func(LobbyScene)

module.exports = LobbyScene;