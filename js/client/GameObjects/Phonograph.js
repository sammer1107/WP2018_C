import { PIANO_CONFIG } from '../constants.js'

export default class Phonograph extends Phaser.Physics.Arcade.Sprite {

    constructor(scene, x, y){
        super(scene, x, y, "phonograph");
        this.volume = 0;
        this.music_sheet = new Array();
        this.piano = null;
        this.setDisplayOrigin(193,327);
        this.setDepth(-1);
        scene.add.existing(this);
        scene.physics.world.enable(this, 1);
    }
    
    setSheet(sheet) {
        this.music_sheet = sheet;
    }
    
    changeVol(vol) {
        this.volume = vol;
    }
    
    playSheet(index) {
        if(this.piano){
            if(this.music_sheet[index] != '_'){
                this.piano.play(this.music_sheet[index], { volume: this.volume });
            }
        }
    }
    
    addPhonoSoundMarker(){
        this.piano = this.scene.sound.add('piano');
        for(let [key, note_name, st] of PIANO_CONFIG) {
            this.piano.addMarker({name: note_name, start: st, duration: 1.5});
        }
    }
    
}