import {RIGHT, LEFT, FRONT, BACK} from './constants.js'

export function getDirection(vec){
    var angle = new Phaser.Math.Vector2(vec).angle() * Phaser.Math.RAD_TO_DEG;
    switch(true){
        case (angle <= 45 || angle > 315):
            return RIGHT;
            break;

        case (angle <= 135):
            return FRONT;
            break;

        case (angle <= 225):
            return LEFT;
            break;

        case (angle <= 315):
            return BACK;
            break
    }
}