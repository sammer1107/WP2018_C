var BaseScene = require('./BaseScene.js');

const GAME_DURATION = 300*1000;
const CHECK_INTERVAL = 6*1000;

class ComposeScene extends BaseScene{
    constructor(GameManager){
        super(GameManager, "Compose")
        this.timer;
    }
        
    init(){
        /*
        + make sure every players's melody is cleaned
        + decide who's composition will be sent to whom
        + maybe reset player's position
        */
        this.timer = 0;
    }
    
    start(){
        /*
        + listen on composition set
        */
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
        clearInterval(this.check_interval);
        return;
    }
    
    getInitData(){
        /*
        This function should return the necessary scene state (does not including the players) so that 
        the client just connected can sync the game state.
        */
        return null;
    }
    
    getStartData(){
        /*
        This function should return the data needed for the client side to start one scene.
        Ex. regrouped players, new positions

        */
        return null;
    }
}

module.exports = ComposeScene;

