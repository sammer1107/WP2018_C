'use strict'
import Phaser from 'phaser'
import {Plugin as NineSlicePlugin} from 'phaser3-nineslice'
import Game from './Game.js'
import PreloadScene from './Scenes/PreloadScene.js'
import LobbyScene from './Scenes/LobbyScene.js'
import ComposeScene from './Scenes/ComposeScene.js'
import ComposeUI from './Scenes/ComposeUI.js'
import MuziKuro from './Scenes/Muzikuro.js'
import FillSheetScene from './Scenes/MuzikuroUI.js'
import Animation from './lib/Animation.js'
/* global __DEBUG, $ */

var config = {
    type: Phaser.AUTO, // renderer setting
    width: window.innerWidth * window.devicePixelRatio,
    height: window.innerHeight * window.devicePixelRatio,
    canvas: document.getElementById('game'),
    callbacks: {postBoot: resize},
    physics: {
        default: 'arcade',
        arcade: {debug: __DEBUG}
    },
    plugins: {
        global: [ NineSlicePlugin.DefaultCfg ],
    },
    scene: [PreloadScene, LobbyScene, ComposeScene, ComposeUI, MuziKuro, FillSheetScene],
}

var game

$(document).ready( function(){
    var logo=$('#welcome #logo img'),
        notes=$('#welcome #notes'),
        light=$('#welcome #light')
        
    var lightAnim = new Animation({
        duration: 300,
        delay: 600,
        update: (t)=>{
            light.css('clip-path', `circle(${1000*t}px at 48% 39%)`)
        },
        callback: () => light.css('clip-path', 'unset') 
    })
    
    lightAnim.start() 
    setTimeout( ()=> logo.addClass('fly-in'), 500)
    setTimeout( ()=> notes.css('transform', 'scale(1)'), 900)
    setTimeout( ()=> $('#welcome #start-button').css('top', '80%'), 1800)
    
    notes.one('transitionend', function() {
        notes.addClass('float-anim')
    })
    
    $('#start-button').click( function(){
        game = new Game(config)
        if(__DEBUG) window.game = game
        
        $('#welcome').addClass('darken')
        $('#nickname').css('top','0px')
        $('#nickname #enter').click(joinGame)
        $(document).on('keypress', function(press){
            if(press.which === 13){ // enter
                $('#nickname #enter').click()
            } 
        })
    })
})

function joinGame(){
    var name = $('#nickname input').val().substring(0,20)
    var login = function(){
        $('#welcome').animate({'opacity': '0'}, {
            complete: ()=> $('#welcome').css('display', 'none')
        })
        game.socket.emit('login', { name: name })
    }
   
    if(name){
        $('#start-button').off('click')
        $('#nickname #enter').off('click')
        $(document).off('keypress')
        if(game.preload_complete){
            login()
        }
        else{
            $('#welcome .text').text('Loading...')
            game.events.once('preloadComplete', login)
        }
    }
}

window.addEventListener('resize', resize, false)
function resize() {
    var canvas = document.querySelector('canvas')
    if(!canvas) return
    var windowRatio = window.innerWidth / window.innerHeight
    var gameRatio = config.width / config.height

    
    if(windowRatio < gameRatio){
        canvas.style.width = window.innerWidth + 'px'
        canvas.style.height = (window.innerWidth / gameRatio) + 'px'
    }
    else {
        canvas.style.width = (window.innerHeight * gameRatio) + 'px'
        canvas.style.height = window.innerHeight + 'px'
    }
}    
