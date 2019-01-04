/*
This class is the base class for a server side scene
The constructor will be called in the game constructor
*/

var Abstract = new Error("\n\t Do not call this method in BaseScene,\
                          \n\t this is a abstract method to be implemented by inherited Scenes.");


class BaseScene{
    constructor(GameManager, key){
        this.key = key;
        this.game = GameManager;
        this.io = GameManager.io;
    }
    
    init(){
        /*
        This function is responsible for setting things up before the scene actually start.
        */
        throw Abstract;
    }
    
    start(){
        /*
        This function should be responsible for really get the scene start working.
        */
        throw Abstract;
    }
    
    stop(){
        /*
        This function should stop the scene, then the GameManager will launch
        the next scene.
        Things to be done in this function:
            1. stop looping intervals
            2. stop listening to events
        */
        throw Abstract;
    }
    
    getSceneState(){
        /*
        This function should return the necessary scene state (does not including the players) so that 
        the client just connected can sync the game state.
        */
        throw Abstract;
    }
    
    getInitData(){
        /*
        This function should return the data needed for the client side to start one scene.
        Ex. regrouped players, new positions

        */
        throw Abstract
    }
    
    socketOn(event, callback, in_game_only=false){
        for(let p of this.game.players.values()){
            if(p.group) p.socket.on(event, callback.bind(this, p.socket));
        }
    }
    
    socketOff(event){
        for(let p of this.game.players.values()){
            p.socket.removeAllListeners(event);
        }
    }
}

module.exports = BaseScene;