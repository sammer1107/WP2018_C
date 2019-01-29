import Phaser from 'phaser'
import { PIANO_CONFIG } from '../constants.js'

export default class Phonograph extends Phaser.Physics.Arcade.Sprite {

    constructor(scene, x, y){
        super(scene, x, y, 'phonograph')
        this.depth = y / this.scene.map.realHeight
        this.volume = 1
        this.music_sheet = new Array()
        this.piano = null
        this.setDisplayOrigin(193,327)
        scene.add.existing(this)
        scene.physics.world.enable(this, 1)
        this.body.setSize(200,100).setOffset(90,270)
    }
    
    setSheet(sheet) {
        this.music_sheet = sheet
    }
    
    changeVol(vol) {
        this.volume = vol
    }
    
    playSheet(index) {
        if(this.piano){
            if(this.music_sheet[index] !== '_'){
                this.piano.play(this.music_sheet[index], { volume: this.volume })
            }
        }
    }
    
    createSound(){
        this.piano = this.scene.sound.add('piano')
        for(let [key, note_name, st] of PIANO_CONFIG) {
            this.piano.addMarker({name: note_name, start: st, duration: 1.5})
        }
    }
    
    startAnim(){
        this.play('phonograph_play')
    }

    createParticle(){
        this.scene.add.particles('mininotes')
            .setDepth(1)
            .createEmitter({
                x: this.x-43,
                y: this.y-182,
                frequency: 1500,
                lifespan: 5000,
                frame: { frames: [0,1,2,3,4,5,6,7,8], cycle: false},
                scale: { start: 0.4, end: 0.35 },
                speed: { min: 30, max: 50 },
                angle: { min: 180, max: 250 },
                alpha: (particle, key, t) => 1-Math.max(0,t-0.9)/0.1 ,
                rotate: (particle, key, t) => 25*Math.sin(8*t),
                accelerationY: { min: -5, max: 10},
            })
    }

    destroy(scene_shutdown){
        if(this.piano){
            try{
                this.scene.sound.remove(this.piano)
            } catch(e) {
                console.warn(e)
            }
        }
        super.destroy(scene_shutdown)
    }
}