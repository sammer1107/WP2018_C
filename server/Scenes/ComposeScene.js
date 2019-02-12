var BaseScene = require('./BaseScene.js')

const GAME_DURATION = 5*60*1000
const CHECK_INTERVAL = 5*1000

class ComposeScene extends BaseScene{
    constructor(GameManager){
        super(GameManager, 'Compose')
        this.timer
        this.log = require('../utils').log
    }
        
    init(){
        this.timer = 0
        for(let g of this.game.groups){
            g.composition = null
        }
    }
    
    start(){
        this.socketOn('composeSet', this.onComposeSet)
        this.socketOn('playInstrument', this.onPlayInstrument)
        
        this.check_interval = setInterval(()=>{
            this.timer += CHECK_INTERVAL
            if( this.timer >= GAME_DURATION ){
                this.stop()
                this.game.startScene('MuziKuro')
            }
            if(this.game.players.size < 2){
                this.stop()
                this.game.startScene('Lobby')
            }
        }, CHECK_INTERVAL)
        
        
    }
    
    stop(){
        this.log('scene stopped.')
        clearInterval(this.check_interval)
        this.socketOff('composeSet')
        return
    }
    
    getSceneState(){
        return null
    }
    
    getInitData(){
        return null
    }
    
    onComposeSet(socket, data){
        var player = this.game.players.get(socket.id)
        player.group.composition = data
        var done = true
        for(let g of this.game.groups){
            if(!g.composition){
                done = false
                break
            } 
        }
        if(done){
            this.stop()
            this.game.startScene('MuziKuro')
        }
    }

    onPlayInstrument(socket, data){
        let partner_id = this.game.players.get(socket.id).partner_id
        data['player'] = socket.id
        this.io.sockets.to(partner_id).emit('playInstrument', data)
    }
}

module.exports = ComposeScene
