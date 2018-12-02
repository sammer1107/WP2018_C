import {RIGHT, LEFT, FRONT, BACK} from './constants.js'

export function getDirection(vec){
    var angle = new Phaser.Math.Vector2(vec).angle() * Phaser.Math.RAD_TO_DEG;
    switch(true){
        case (angle <= 30 || angle > 330):
            return RIGHT;
            break;

        case (angle <= 150):
            return FRONT;
            break;

        case (angle <= 210):
            return LEFT;
            break;

        case (angle <= 330):
            return BACK;
            break
    }
}