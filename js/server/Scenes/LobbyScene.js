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
        //regroup players and give them initial position here 重新分組與配對(第一場玩muzi的第二場也能玩muzi) 沒配到的玩家資料要設為NULL
        var players = this.game.players;
        var player_id = [];
        var init_x, init_y;
        for(let player of players.values()){
            let id = player.id;
            players.get(id).role = null;
            players.get(id).partner_id = null;
            player_id.push(id);
        }
        if( player_id[0] ){
            //shuffle the player_id array
            for (let i = player_id.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [player_id[i], player_id[j]] = [player_id[j], player_id[i]];
            }
            for(let i=0; i<player_id.length; i+=2){
                if( i+1 == player_id.length ){ //if player number is odd. make him lonely.
                    break;
                } else {
                    [init_x, init_y] = this.getRandomSpawnPoint();
                    players.get(player_id[i]).role = "Muzi";
                    players.get(player_id[i+1]).role = "Kuro";
                    players.get(player_id[i]).partner_id = player_id[i+1];
                    players.get(player_id[i+1]).partner_id = player_id[i];
                    Log(players.get(player_id[i]).partner_id);
                    Log(players.get(player_id[i+1]).partner_id);
                    players.get(player_id[i]).setPosition(init_x, init_y);
                    players.get(player_id[i+1]).setPosition(init_x, init_y);
                }
            } 
        }

    }
    
    start(){
        
        this.check_interval = setInterval(()=>{ // check for early start
            // if paired player > MAX_PLAYERS
            this.timer += CHECK_INTERVAL;
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