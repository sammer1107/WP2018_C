export class Note extends Phaser.Physics.Arcade.Sprite {
    constructor(scene, x, y, melody) {
        super(scene, x, y, "music_notes", `${Math.floor(Math.random()*20)}`);
        this.melody = melody.split(" ");
        this.volume = 0;
    }

    static setSoundPool(scene, asset_key, markers, amount) {
        Note.soundPool = new Array();
        for(let i = 0; i < amount; i += 1) {
            let sound = scene.sound.add(asset_key);
            for(const [key, note, st] of markers) {
                sound.addMarker({name: note, start: st, duration: 1.5});
            }
            sound.beOcupied = false;
            Note.soundPool.push(sound);
        }
        console.log(Note.soundPool);
    }
    static getSoundFromPool() {
        for(let sound of Note.soundPool) {
            if(!sound.beOcupied) {
                sound.beOcupied = true;
                return sound;
            }
        }
        return null;
    }
    static returnSoundToPool(sound) {
        sound.beOcupied = false;
    }

    static noteLasting (t) {
        return new Promise((resolve) => {
            setTimeout(resolve, t);
        });
    };

    changeVol(vol) {
        this.volume = vol;
    }

    requestSoundInInterval(interval) {
        if(this.soundTmp) {
            return;
        }
        this.soundTmp = Note.getSoundFromPool();
        setTimeout(() => {
            Note.returnSoundToPool(this.soundTmp);
            this.soundTmp = null;
        }, interval);
    }
    playSpecificNote(index) {
        if(this.soundTmp) {
            let note = this.melody[index];
            let note_name = note.slice(0, 1+(note.includes("#") | 0));
            this.soundTmp.play(note_name, { volume: this.volume });
        }
    }

    async playMelody(ms_per_note) {
        let sound = Note.getSoundFromPool();
        if(sound) {
            for (const note of this.melody) {
                //Use includes("#") to decide should the 2nd pos be preserved. Ex: C#
                let note_name = note.slice(0, 1+(note.includes("#") | 0));
                let time_param = ms_per_note;
                /* '-' means twice the time and '^' means half the time */
                //time_param *= 2**(note.split("-").length - note.split("^").length);
                //time_param *= (note.includes("."))? 1.5 : 1;
                sound.play(note_name, { volume: this.volume });
                await Note.noteLasting(time_param);
            };
            Note.returnSoundToPool(sound);
        }
    }
}
