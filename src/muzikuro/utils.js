import Phaser from 'phaser'
import {RIGHT, LEFT, FRONT, BACK} from './constants.js'
/* global __DEBUG */

export function getDirection(vec){
    var angle = new Phaser.Math.Vector2(vec).angle() * Phaser.Math.RAD_TO_DEG
    switch(true){
    case (angle <= 45 || angle > 315):
        return RIGHT
    case (angle <= 135):
        return FRONT
    case (angle <= 225):
        return LEFT
    case (angle <= 315):
        return BACK
    }
}

export function log_func(ctx){
    if(__DEBUG){ 
        return function(...message){
            console.log(`[${ctx.name}] `, ...message)
        }
    }
    else{
        return () => null 
    }
}

export function randint(min, max){
    return Math.floor(Math.random() * (max - min) + min)
}

export function getValueByName(name, properties){
    // this function is used to retrieve value from Tiled's format of custom properties
    var prop = properties.find(prop => prop.name === name)
    return prop ? prop.value : undefined
}
