export default class Phonograph extends Phaser.Physics.Arcade.Image {

    constructor(scene, x, y){
        super(scene, x, y, "phonograph");
        this.volume = 0;
        this.music_sheet = [];
    }
    
    changeVol(vol) {
        this.volume = vol;
    }
    
    
    
}