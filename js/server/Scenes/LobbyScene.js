var BaseScene = require('./BaseScene');
var randint = require('../utils').randint;
var shuffle = require('../utils').shuffle;
var constants = require('../constants');
var MUZI = constants.MUZI;
var KURO = constants.KURO;
const LOBBY_WAIT_TIME = 2*60*1000;
const CHECK_INTERVAL = 10*1000;
const MAX_PLAYERS = 4;

class LobbyScene extends BaseScene{
    constructor(GameManager){
        super(GameManager, "Lobby");
        this.timer=0;
        this.check_interval;
    }
    
    init(){
        var players = this.game.players;
        /*
        TODO: regroup players and give them initial position here
        */
    }
    
    start(){
        
        this.check_interval = setInterval(()=>{ // check for early start
            // if paired player > MAX_PLAYERS
            this.time += CHECK_INTERVAL;
            var num_player = this.game.players.size;
            if(num_player >= MAX_PLAYERS || (this.timer >= LOBBY_WAIT_TIME && num_player >= 2 )){
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

        // pair player
        for(let player of this.game.players.values()){
            if(player.partner_id == null){
                lonely_player = player;
                // decide player role
                let roles = [MUZI, KURO];
                let rand = randint(0,2);
                lonely_player.role = roles[rand];
                new_player.role = roles[1-rand];
                new_player.partner_id = lonely_player.id;
                lonely_player.partner_id = new_player.id;
                partner_config[lonely_player.role] = lonely_player.id;
                partner_config[new_player.role] = new_player.id;
                break;
            }
        }
        
        [init_x, init_y] = this.getRandomSpawnPoint();
        new_player.setPosition(init_x, init_y);
        socket.broadcast.emit("newPlayer", new_player);
        if(lonely_player){
            lonely_player.setPosition(init_x, init_y);
            socket.broadcast.emit("updatePartner", partner_config);
        }
        
        Log(`Created new player: name:${new_player.name}, role:${new_player.role}, partner:${lonely_player ? lonely_player.name : null}`);
    }
    
    getRandomSpawnPoint(){
        return [randint(2525+100, 2525-100), randint(2525+100, 2525-100)];
    }
}

var Log = require('../utils').log_func(LobbyScene)

module.exports = LobbyScene;