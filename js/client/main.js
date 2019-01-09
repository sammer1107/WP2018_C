"use strict";
//import Phaser from './lib/phaser.js'
import PreloadScene from './Scenes/PreloadScene.js'
import LobbyScene from './Scenes/LobbyScene.js'
import ComposeScene from './Scenes/ComposeScene.js'
import FillSheetScene from './Scenes/FillSheetScene.js'
import ComposeUI from './Scenes/ComposeUI.js'
import MuziKuro from './Scenes/Muzikuro.js'
import Game from './Game.js'
import {Animation} from './utils.js'

var config = {
    type: Phaser.AUTO, // renderer setting
    width: window.innerWidth*window.devicePixelRatio,
    height: window.innerHeight*window.devicePixelRatio,
    canvas: document.getElementById('game'),
    callbacks: {postBoot: resize},
    physics: {
        default: 'arcade',
        arcade: {debug: __DEBUG}
    },
    scene: [PreloadScene, LobbyScene, ComposeScene, ComposeUI, MuziKuro, FillSheetScene],
};

var game;

$(document).ready(function(){
    var start_t,
    logo=$("#welcome .logo"),
    notes=$("#welcome #notes"),
    light=$("#welcome #light");
    
    var logo_anim = new Animation(function(t){
            if(t<=0.8){
                logo.css("transform", `translate(-50%, -50%) scale(${2.625*t-1.6406*t*t})`);            
            }else{
                logo.css("transform", `translate(-50%, -50%) scale(${0.05*Math.cos(15/2*Math.PI*(t-0.8))*Math.exp(-12*(t-0.8))+1})`);
            }
        }, 300);
        
    var light_anim = new Animation(function(t) {
            light.css("clip-path", `circle(${1000*t}px at 48% 39%)`)
        }, 250, ()=>light.css("clip-path", "unset") );
    setTimeout( ()=> logo_anim.start() , 500);
    setTimeout( ()=> light_anim.start() , 600);
    setTimeout( ()=> notes.css("transform", "scale(1)"), 800);
    setTimeout( ()=> $("#welcome #start-button").css("top", "80%"), 1800);
    
    notes.one('transitionend', function(e) {
        notes.addClass("float_anim");
    });
    
    $("#start-button").click(function(){
        game = new Game(config);
        if(__DEBUG) window.game = game;
        $("#welcome").addClass("darken");
        $("#nickname").css("top",'0px');
        $("#nickname #enter").click(joinGame)
        $(document).on("keypress", function(press){
            if(press.which == 13){ // enter
                $("#nickname #enter").click();
                $(document).off("keypress");
            } 
        })
    })
})

function joinGame(){
    var name = $("#nickname input").val().substring(0,20);
    var login = function(){
        $("#welcome").animate({"opacity": "0"}, { complete: ()=> $("#welcome").css("display", "none") });
        game.socket.emit("login", { name: name });
    };
   
    if(name){
        $("#start-button").off('click');
        $("#nickname #enter").off('click')
        if(game.preload_complete){
            login();
        }
        else{
            $("#welcome .text").text("Loading...");
            game.events.once("preloadComplete", login);
        }
    }
}

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
