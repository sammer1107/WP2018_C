export default class PreloadScene extends Phaser.Scene{
    constructor(){
        super({key: "Preload"});
    }
    
    create(){
        this.load.setPath('/assets/')
        this.load.atlas('character', 'character.png', 'character.json')
        this.load.tilemapTiledJSON('map', 'map.json');
        this.load.image('google_tile', 'tileset.png');
        this.load.atlas('music_notes','music_notes.png', 'music_notes.json');
        this.load.audio('piano', 'piano_pitch4.ogg');
        this.load.audio('drumbeat', 'beat_0_115.mp3');
        
        this.load.start();
        this.load.once('complete', function(){
            this.game.events.emit("preloadComplete");
        }, this);
    }
}