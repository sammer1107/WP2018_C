var BaseScene = require('./BaseScene.js');

const GAME_DURATION = 2*60*1000;

class ComposeScene extends BaseScene{
    constructor(GameManager){
        super(GameManager, "Compose")
    }
        
    init(){
        /*
        + make sure every players's melody is cleaned
        + decide who's composition will be sent to whom
        + maybe reset player's position
        */
    }
    
    start(){
        /*
        + listen on composition set
        */
        setTimeout(()=>{
            this.stop();
            this.game.startScene("MuziKuro");
        }, GAME_DURATION)
        return;
    }
    
    stop(){
        /*
        + stop looping intervals
        + stop listening to events
        */
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

