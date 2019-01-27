export default class SocketCallbackManager{
    constructor(ctx, socket){
        this._callbacks = new Map()
        this.ctx = ctx
        this.socket = socket
    }
    
    listenTo(events){
        // bind all event to its corresponding function by name
        // we need to keep the binded functions in callbacks in order to remove them
        if(events instanceof Array){
            for(let e of events){
                let func = this.ctx[`on${e[0].toUpperCase()}${e.substring(1)}`].bind(this.ctx)
                this.socket.on(e, func)
                this._callbacks.set(e, func)
            }
        }
        else{
            let e = events;
            let func = this.ctx[`on${e[0].toUpperCase()}${e.substring(1)}`].bind(this.ctx)
            this.socket.on(e, func)
            this._callbacks.set(e, func)
        }
        
    }

    detachAll(){
        // this function drops all listeners in this.callbacks
        for(let [event, callback] of this._callbacks){
            this.socket.off(event, callback)
            this._callbacks.delete(event)
        }
    }
}