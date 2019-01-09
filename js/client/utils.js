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

export function log_func(ctx){
    if(__DEBUG){ 
        return function(...message){
            console.log(`[${ctx.name}] `, ...message);
        }
    }
    else{
        return () => null ;
    }
}

export function randint(min, max){
    return Math.floor(Math.random() * (max - min) + min);
}

export class Animation{
    constructor(update, duration, callback){
        this.duration = duration;
        this.update = update;
        this.callback = callback;
        this.start_t;
        this.progress;        
    }
    
    next(t){
        if (!this.start_t) this.start_t = t;
        this.progress = Math.min((t - this.start_t)/this.duration, 1);
        this.update(this.progress);
        if (this.progress < 1) {
            requestAnimationFrame(this.next.bind(this));
        }
        else if(this.callback){
            this.callback();
        }
    }
    
    start(delay){
        if(delay) setTimeout( () => requestAnimationFrame(this.next.bind(this)) , delay);
        else requestAnimationFrame(this.next.bind(this))
        return this;
    }
}