import BaseGameScene from './BaseGameScene.js'
import Phonograph from '../GameObjects/Phonograph.js'
import {getValueByName} from '../utils.js'
import {MUZI, KURO, PIANO_CONFIG} from '../constants.js'

export default class ComposeScene extends BaseGameScene{
    constructor(){
        super({ key: 'Compose'})
        this.UI             // ComposeUI Scene
        this.phonograph     // Class Phonograph
    }

    init(){
        this.scene.launch('ComposeUI')
        this.UI = this.scene.get('ComposeUI')
        super.init()
    }

    create(){
        var collide_objects, collide_layers, map_scale
        this.socket.listenTo([
            'disconnect', 'playerMove', 'destroyPlayer', 'updatePartner',
            'playInstrument'
        ])

        collide_layers = this.createTileMap('muzikuro')
        collide_objects = this.createMapObjects()
        this.physics.world.setBounds(0, 0, this.map.realWidth, this.map.realHeight)
        
        
        this.createSpritePlayers()
        map_scale = getValueByName('scale', this.map.properties) || 1
        // set phonograph
        this.phonograph = new Phonograph(this, (this.map.widthInPixels+128)*map_scale/2, (this.map.heightInPixels+128)*map_scale/2)
        this.phonograph.startAnim()

        if(this.local_player.role === MUZI){
            let message = this.add.boxMessage('點擊唱片機創作!')
            setTimeout(()=>{
                message.show()
                this.phonograph.setInteractive({
                    cursor: 'pointer',
                    pixelPrefect: true
                })
                .on('pointerdown', this.onPhonoClicked, this)
                .once('pointerdown', ()=>message.remove())
            }, 1000)
        }
        else if(this.local_player.role === KURO){
            let message = this.add.boxMessage('帶領Muzi到唱片機')
            setTimeout(()=>{
                message.show()
                setTimeout(()=>{
                    message.remove()
                }, 5000)
            }, 1000)
        }

        this.partnerPiano = this.sound.add('piano', {volume: 0.6})
        for(const [key, note_name, st] of PIANO_CONFIG) {
            this.partnerPiano.addMarker({name: note_name, start: st, duration: 1.5})
        }
        
        if(this.local_player.group){
            this.physics.add.collider(this.local_player.group, this.phonograph)     
            this.physics.add.collider(this.local_player.group, collide_layers)
            this.physics.add.collider(this.local_player.group, collide_objects)
        }

        this.scene.sleep('ComposeUI')
    }
    
    onUpdatePartner(data){
        // only when player is set lonely will this be called
        // no new groups will be made in this scene
        let lonely_player = this.players.get(data.lonely)
        this.groups = this.groups.filter( g => g !== lonely_player.group )
        lonely_player.group.destroy()
        lonely_player.partner_id = null

    }
    
    onPhonoClicked(pointer/*, local_x, local_y, event_container */){
        if(!pointer.leftButtonDown()) return
        
        if(!this.UI) this.UI = this.scene.get('ComposeUI')
        this.UI.events.once('composeClose', (composeDone)=>{
            if(composeDone){
                this.input.clear(this.phonograph)
            }
        })
        this.UI.sys.wake()
    }
    
    finish(){
        this.UI.finish()
        this.UI.sys.shutdown()
        this.socket.detachAll()
        try {
            this.partnerPiano.destroy()
        } catch(e) {
            console.warn(e)
        }
    }

    onPlayInstrument(data){
        this.partnerPiano.play(data.pitch)
    }
}