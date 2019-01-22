import Phaser from 'phaser'
const DOT_INTERVAL = 800

export default class LobbyScene extends Phaser.Scene{
    constructor(){
        super({key: 'Lobby'})
        this.dot_timer
        this.num_dot  
    }
    
    init(){
        this.dot_timer = 0
        this.num_dot = 1
    }
    
    create(){
        var cam, graphic, pad, text
        cam = this.cameras.main
        cam.setBackgroundColor('rgba(236, 146, 29, 1)')
        this.add.sprite(cam.width/2, cam.height/3, 'waiting').play('waiting_lick')
        graphic = this.add.graphics()
        pad = cam.height*0.02
        graphic.lineStyle(9, 'rgba(8,4,4)')
        graphic.strokeRoundedRect(pad, pad, cam.width-pad*2, cam.height-pad*2)
        this.loading_text = text = this.add.text(cam.width/2, cam.height*2/3, 
            `配對中${' .'.repeat(this.num_dot)}`, {
                fontFamily: 'Gen Jyuu Gothic P',
                fontStyle: 'bold',
                fontSize: 48,
                color: '#fefefe'
            }).setOrigin(0,0)
        text.setPosition(Math.round(text.x-text.width/2), Math.round(text.y-text.height/2))
    }
    
    update(time, delta){
        this.dot_timer+=delta
        if(this.dot_timer > DOT_INTERVAL){
            this.dot_timer -= DOT_INTERVAL
            this.num_dot = (this.num_dot + 1) % 4
            this.loading_text.setText(`配對中${' .'.repeat(this.num_dot)}`)
        }
    }
    
    finish(){
        return
    }
}