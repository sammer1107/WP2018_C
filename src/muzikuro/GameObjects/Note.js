import Phaser from 'phaser'

export default class Note extends Phaser.Physics.Arcade.Sprite {
    constructor(scene, x, y, melody) {
        super(scene, x, y, 'music_notes', `${Math.floor(Math.random()*20)}`)
        this.melody = new Array()
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
        //console.log(this.melody.length);
        this.volume = 0
        this.setDepth(y/scene.map.realHeight).setOrigin(0.5,1)
    }

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
    
    static clearSoundPool(scene){
        for(let sound of Note.soundPool){
            scene.sound.remove(sound)
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
                // FIXTHIS: what if notes with '#' are played
                this.soundTmp.play(note, { volume: this.volume })
            }
        }
    }

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
}
