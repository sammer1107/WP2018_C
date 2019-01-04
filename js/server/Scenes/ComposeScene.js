var BaseScene = require('./BaseScene.js');
var BUFFER_TIME = require('../constants.js').SCENE_TRANSITION_BUFFER_TIME;

const GAME_DURATION = 300*1000;
const CHECK_INTERVAL = 5*1000;

class ComposeScene extends BaseScene{
    constructor(GameManager){
        super(GameManager, "Compose")
        this.timer;
    }
        
    init(){
        this.timer = 0;
        for(let g of this.game.groups){
            g.composition = null;
        }
    }
    
    start(){
        this.socketOn('composeSet', this.onComposeSet);
        
        this.check_interval = setInterval(()=>{
            this.timer += CHECK_INTERVAL;
            if( this.timer >= GAME_DURATION ){
                this.stop();
                this.game.startScene("MuziKuro");
            }
            if(this.game.players.size < 2){
                this.stop();
                this.game.startScene("Lobby");
            }
        }, CHECK_INTERVAL);
        
        
    }
    
    stop(){
        /*
        + stop looping intervals
        + stop listening to events
        */
        Log('scene stopped.')
        clearInterval(this.check_interval);
        this.socketOff('composeSet');
        return;
    }
    
    getSceneState(){
        /*
        This function should return the necessary scene state (does not including the players) so that 
        the client just connected can sync the game state.
        */
        return null;
    }
    
    getInitData(){
        /*
        This function should return the data needed for the client side to start one scene.
        Ex. regrouped players, new positions

        */
        return null;
    }
    
    onComposeSet(socket, data){
        var player = this.game.players.get(socket.id);
        player.group.composition = data;
        var done = true;
        for(let g of this.game.groups){
            if(!g.composition){
                done = false;
                break;
            } 
        }
        if(done){
            this.stop();
            this.game.startScene("MuziKuro");
        }
    }
}

module.exports = ComposeScene;
const Log = require('../utils.js').log_func(ComposeScene);
