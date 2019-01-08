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

//$("#player-name input").focus();

function Animation(update, duration){
    this.duration = duration;
    this.update = update;
    this.start_t;
    this.progress;
    
    return this
}

$(document).ready(function(){
    var start_t,
    logo=$("#welcome .logo"),
    notes=$("#welcome #notes"),
    light=$("#welcome #light");
    
    var logo_anim = new Animation(function(t){
            if (!this.start_t) this.start_t = t;
            this.progress = (t - this.start_t)/this.duration;
            t = this.progress;
            if(this.progress<=0.8){
                logo.css("transform", `translate(-50%, -50%) scale(${2.625*t-1.6406*t*t})`);            
            }else{
                logo.css("transform", `translate(-50%, -50%) scale(${0.05*Math.cos(15/2*Math.PI*(t-0.8))*Math.exp(-12*(t-0.8))+1})`);
            }
            if (this.progress < 1) {
                requestAnimationFrame(this.update.bind(this));
            }
        }, 300);
        
    var light_anim = new Animation(function(t) {
            if (!this.start_t) this.start_t = t;
            this.progress = (t - this.start_t)/this.duration;
            t = this.progress
            light.css("clip-path", `circle(${1000*t}px at 48% 39%)`)
            if (this.progress < 1) {
                requestAnimationFrame(this.update.bind(this));
            }
            else{
                light.css("clip-path", "unset");
            }
        }, 250);
    setTimeout(()=>requestAnimationFrame(logo_anim.update.bind(logo_anim)) , 500);
    setTimeout(()=>requestAnimationFrame(light_anim.update.bind(light_anim)), 600);
    setTimeout(()=>notes.css("transform", "scale(1)"), 800);
    setTimeout(()=>$("#welcome #start-button").css("top", "80%"), 1800);
    
    notes.one('webkitTransitionEnd otransitionend oTransitionEnd msTransitionEnd transitionend', function(e) {
        notes.addClass("float_anim");
    });
    
    $("#start-button").click(function(){
        game = new Game(config);
        window.game = game;
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
