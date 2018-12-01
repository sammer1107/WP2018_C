"use strict";
import MuziKuro from './scenes/muzikuro.js'
import HUD from './scenes/HUD.js'

var config = {
    type: Phaser.AUTO, // renderer setting
    width: window.innerWidth,
    height: window.innerHeight,
    parent: "game-container",
    physics: {
        default: 'arcade',
        arcade: {debug: true}
    },
    scene: [MuziKuro, HUD],
};


class Game extends Phaser.Game {
    constructor(config){
        super(config);
        this.socket = io.connect();
        this.players = new Map();
        this.local_player = null;
    }
}

var game = new Game(config);
console.log("Game:", game);

$("#player-name input").focus();
$("#join-game").click( function(){
    var name = $("#player-name input").val().substring(0,20);
    if(name){
        $("#login").animate({bottom: "100vh"}, { complete: ()=> $("#login").css("display", "none") });
        game.socket.emit("requestPlayer", { name: name });
    }
});

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
