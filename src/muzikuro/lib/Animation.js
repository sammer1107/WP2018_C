export default class Animation{
    constructor(config){
        this.update = config.update
        this.duration = config.duration
        this.callback = config.callback
        this.delay = config.delay

        if(typeof this.update !== 'function'){
            console.warn(`Type of update function is ${typeof this.update} instead of function`)
        }
        
        if(!this.duration){
            console.warn('Duration of the Animation is not valid.')
        }

        this.start_t
        this.progress        
    }
    
    next(t){
        if (!this.start_t) this.start_t = t
        this.progress = Math.min((t - this.start_t)/this.duration, 1)
        this.update(this.progress)
        if (this.progress < 1) {
            requestAnimationFrame(this.next.bind(this))
        }
        else if(this.callback){
            this.callback()
        }
    }
    
    start(){
        if(this.delay) setTimeout( () => requestAnimationFrame(this.next.bind(this)), this.delay)
        else requestAnimationFrame(this.next.bind(this))
        return this
    }
}