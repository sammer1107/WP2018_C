import Phaser from 'phaser'
import BoxMessage from '../GameObjects/BoxMessage'
import SocketCallbackManager from './components/SocketCallbackManager'

const DOT_INTERVAL = 800

var text_style = {
    fontFamily: 'Gen Jyuu Gothic P',
    fontStyle: 'bold',
    fontSize: 48,
    color: '#fefefe'
}
export default class LobbyScene extends Phaser.Scene{
    constructor(){
        super({key: 'Lobby'})
        this.dot_timer
        this.num_dot
        this.socket
    }
    
    init(){
        this.socket = new SocketCallbackManager(this, this.game.socket)
        this.dot_timer = 0
        this.num_dot = 1
    }
    
    create(data){
        this.socket.listenTo(['message', 'disconnect'])

        var cam, graphic, pad, text
        cam = this.cameras.main
        cam.setBackgroundColor('rgba(236, 146, 29, 1)')
        this.add.sprite(cam.width/2, cam.height/3, 'waiting').play('waiting_lick')
        graphic = this.add.graphics()
        pad = cam.height*0.02
        graphic.lineStyle(9, 'rgba(8,4,4)')
        graphic.strokeRoundedRect(pad, pad, cam.width-pad*2, cam.height-pad*2)
        
        this.loading_text = text = this.add.text(
            cam.width/2,
            cam.height*2/3, 
            `配對中${' .'.repeat(this.num_dot)}`,
            text_style)
            text.setPosition(text.x-text.width/2, text.y-text.height/2)
            
        this.message_text = this.add.text(
            cam.width/2,
            this.loading_text.y + this.loading_text.height*1.5,
            data.message, text_style).setOrigin(0.5,0)
    }
            
    update(time, delta){
        this.dot_timer+=delta
        if(this.dot_timer > DOT_INTERVAL){
            this.dot_timer -= DOT_INTERVAL
            this.num_dot = (this.num_dot + 1) % 4
            this.loading_text.setText(`配對中${' .'.repeat(this.num_dot)}`)
        }
    }

    onMessage(text){
        this.message_text.setText(text)
    }

    onDisconnect(){
        this.sys.setActive(false)
        this.message_text.setText('與伺服器連線中斷 :(')
    }
    
    finish(){
        this.socket.detachAll()
    }
}