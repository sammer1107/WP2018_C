import Phaser from 'phaser'
import {getValueByName} from '../utils.js'
import {NOTE_SCALE, NOTE_RADIUS} from '../constants.js'

export default class Note extends Phaser.Physics.Arcade.Sprite {
    static setSoundPool(scene, asset_key, markers, amount) {
        Note.soundPool = new Array()
        for(let i = 0; i < amount; i += 1) {
            let sound = scene.sound.add(asset_key)
            for(const [key, note, st] of markers) {
                sound.addMarker({name: note, start: st, duration: 1.5})
            }
            sound.beOcupied = false
            Note.soundPool.push(sound)
        }
        //console.log(Note.soundPool);
    }
    
    static clearSoundPool(){
        try{
            for(let sound of Note.soundPool){
                sound.destroy()
            }
        } catch(e) {
            console.warn(e)
        }
    }
    
    static getSoundFromPool() {
        for(let sound of Note.soundPool) {
            if(!sound.beOcupied) {
                sound.beOcupied = true
                return sound
            }
        }
        return null
    }

    static returnSoundToPool(sound) {
        sound.beOcupied = false
    }

    static noteLasting (t) {
        return new Promise((resolve) => {
            setTimeout(resolve, t)
        })
    }

    constructor(scene, x, y, melody) {
        super(scene, x, y, 'music_notes', `${(x+y)%20}`)
        this.volume = 0
        this.melody = new Array()
        // whether the player had resonanced with the note recently
        this.activated = false

        let melody_temp = melody.split(' ')
        for(const note of melody_temp) {
            // Use includes("#") to decide whether the 2nd pos should be preserved. Ex: C#
            let note_name = note.slice(0, 1+(note.includes('#') | 0))
            /* '-' means twice the time and '^' means half the time */
            let note_space = (2**(note.split('-').length - note.split('^').length)) * 2
            this.melody.push(note_name)
            for(let i = 1; i < note_space; i += 1) {
                this.melody.push('_')
            }
        }
        this.setScale(NOTE_SCALE)
            .setDepth(y/scene.map.realHeight)
        
        this.scene.add.existing(this)
        this.scene.physics.world.enable(this)
        this.setupBody()
        this.playFloatAnim()
    }

    changeVol(vol) {
        this.volume = vol
    }

    requestSoundInInterval(interval) {
        if(this.soundTmp) {
            return
        }
        this.soundTmp = Note.getSoundFromPool()
        setTimeout(() => {
            Note.returnSoundToPool(this.soundTmp)
            this.soundTmp = null
        }, interval)
    }

    playSpecificNote(index) {
        if(this.soundTmp) {
            let note = this.melody[index]
            if(note !== '_') {
                this.soundTmp.play(note, { volume: this.volume })
            }
        }
    }

    setupBody(){
        var map_scale = getValueByName('scale', this.scene.map.properties) || 1
        var radius = NOTE_RADIUS * this.scene.map.tileWidth * map_scale
        
        this.body.setCircle(radius, -radius+(this.displayWidth/2), -radius+(this.displayHeight/2))
        // prevent body from scaling with Sprite.setScale
        this.body.transform = new Phaser.GameObjects.Components.TransformMatrix(1,0,0,1,0,0)
        
        if(this.scene.local_player && this.scene.local_player.group) {
            this.scene.physics.add.overlap(this.scene.local_player.group, this, (pl, note) => {
                let volume = (radius - Phaser.Math.Distance.Between(pl.x, pl.y, note.x, note.y)) / radius
                note.changeVol( Phaser.Math.Clamp(volume, 0, 1)) // to prevent negative values
            }, null, this)
        }
    }
    
    playFloatAnim(){
        this.scene.tweens.add({
            targets: this,
            props: {
                y: this.y + 15
            },
            yoyo: true,
            repeat: -1,
            duration: 1000 + (Math.random()-0.5)*600,
            ease: t => Math.sin(Math.PI*(t-0.5))/2 + 0.5,
        })
    }
    
    activate(){
        this.activated = true
        this.scene.tweens.add({
            targets: this,
            props: { scaleX: this.scaleX*1.05, scaleY: this.scaleX*1.05, angle: (Math.random()-0.5)*40 },
            yoyo: false,
            repeat: 0,
            duration: 200,
            ease: 'Sine',
        })
    }
    
    deactivate(){
        this.activated = false
        this.scene.tweens.add({
            targets: this,
            props: { scaleX: NOTE_SCALE, scaleY: NOTE_SCALE, angle: 0 },
            yoyo: false,
            repeat: 0,
            duration: 400,
            ease: 'Sine',
        })  
    }
    
    destroy(scene_shutdown){
        if(!scene_shutdown){
            this.scene.tweens.killTweensOf(this)
        }
        super.destroy(scene_shutdown)
    }
    
    /*
    async playMelody(ms_per_note) {
        let sound = Note.getSoundFromPool()
        if(sound) {
            let time_param = ms_per_note>>1
            for (const note of this.melody) {
                if(note !== '_') {
                    sound.play(note, { volume: this.volume })
                }
                await Note.noteLasting(time_param)
            }
            Note.returnSoundToPool(sound)
        }
    }
    */
}
