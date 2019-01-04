"use strict";
//import Phaser from './lib/phaser.js'
import PreloadScene from './Scenes/PreloadScene.js'
import LobbyScene from './Scenes/LobbyScene.js'
import ComposeScene from './Scenes/ComposeScene.js'
import ComposeUI from './Scenes/ComposeUI.js'
import MuziKuro from './Scenes/Muzikuro.js'
import Game from './Game.js'

var config = {
    type: Phaser.AUTO, // renderer setting
    width: window.innerWidth*window.devicePixelRatio,
    height: window.innerHeight*window.devicePixelRatio,
    canvas: document.getElementById('game'),
    callbacks: {postBoot: resize},
    physics: {
        default: 'arcade',
        arcade: {debug: true}
    },
    scene: [PreloadScene, LobbyScene, ComposeScene, ComposeUI, MuziKuro],
};

var game;

$("#player-name input").focus();
$("#join-game").click( function(){
    var name = $("#player-name input").val().substring(0,20);
    var login = function(){
        $("#login").animate({bottom: "100vh"}, { complete: ()=> $("#login").css("display", "none") });
        game.socket.emit("login", { name: name });
    };
    if(!game) game = new Game(config);    
    if(name){
        window.game = game;
        
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
    if(!canvas) return;
    var windowRatio = window.innerWidth / window.innerHeight;
    var gameRatio = config.width / config.height;

    
    if(windowRatio < gameRatio){
        canvas.style.width = window.innerWidth + "px";
        canvas.style.height = (window.innerWidth / gameRatio) + "px";
    }
    else {
        canvas.style.width = (window.innerHeight * gameRatio) + "px";
        canvas.style.height = window.innerHeight + "px";
    }
}    
