/*
This class is the base class for a server side scene
The constructor will be called in the game constructor
*/

var Abstract = new Error("\n\t Do not call this method in BaseScene,\
                          \n\tt his is a abstract method to be implemented by inherited Scenes.");


class BaseScene{
    constructor(game, key){
        this.key = key;
        this.game = game;
        this.io = game.io;
    }
    
    start(){
        /*
        This function should be responsible for setting up the scene
        and get it running.
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
    
    getInitData(){
        /*
        This function should return the necessary scene state so that 
        the client just connected can sync the game state.
        */
        throw Abstract;
    }
}

module.exports = BaseScene;