"use strict";
import MuziKuro from './Scenes/Muzikuro.js'
import HUD from './Scenes/HUD.js'
import PreloadScene from './Scenes/PreloadScene.js'
import {RemotePlayer, LocalPlayer} from './GameObjects/Player.js'

var config = {
    type: Phaser.AUTO, // renderer setting
    width: window.innerWidth,
    height: window.innerHeight,
    parent: "game-container",
    physics: {
        default: 'arcade',
        arcade: {debug: false}
    },
    scene: [PreloadScene, MuziKuro],
};


class Game extends Phaser.Game {
    constructor(config){
        super(config);
        this.socket = io.connect();
        this.players = new Map();
        this.local_player = null;
        this.preload_complete = false;
        this.events.once('preloadComplete', this.onPreloadComplete, this);
        this.socket.on('connect', ()=>{console.log("socket connected.")})
        this.socket.on('gameInit', this.onInit.bind(this));
    }
    
    onPreloadComplete(){
        console.log('preload complete.');
        this.preload_complete = true;
        this.scene.remove('Preload');
    }
    
    onInit(data){
        // players
        for(let player of data.players){
            this.players.set(player.id, player);
        }
        // local_player
        this.local_player = data.local_player;
        this.players.set(this.local_player.id, this.local_player);
        switch(data.scene){
            case "MuziKuro":
                this.scene.start('MuziKuro', data.scene_state);
                break;
        }
    }
}

var game = new Game(config);
//console.log("Game: ", game);

$("#player-name input").focus();
$("#join-game").click( function(){
    var name = $("#player-name input").val().substring(0,20);
    var login = function(){
        $("#login").animate({bottom: "100vh"}, { complete: ()=> $("#login").css("display", "none") });
        game.socket.emit("login", { name: name });
    };
    
    if(name){
        $("#join-game").off('click');
        if(game.preload_complete){
            login();
        }
        else{
            $("#join-game").html("Loading...");
            game.events.once("preloadComplete", login)
        }
    }
});

$(document).on("keypress", function(press){
    if(press.which == 13){ // enter
        $("#join-game").click();
        $(document).off("keypress");
    } 
})

window.addEventListener("resize", resize, false);
function resize() {
    var canvas = document.querySelector("canvas");
    var windowRatio = window.innerWidth / window.innerHeight;
    var gameRatio = game.config.width / game.config.height;

    
    if(windowRatio < gameRatio){
        canvas.style.width = window.innerWidth + "px";
        canvas.style.height = (window.innerWidth / gameRatio) + "px";
    }
    else {
        canvas.style.width = (window.innerHeight * gameRatio) + "px";
        canvas.style.height = window.innerHeight + "px";
    }
}    
