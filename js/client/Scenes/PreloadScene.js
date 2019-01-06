import {WALK_ANIM_DURATION, PHONO_ANIM_DURATION} from '../constants.js'

export default class PreloadScene extends Phaser.Scene{
    constructor(){
        super({key: "Preload"});
    }
    
    create(){
        this.load.setPath('/assets/')
        this.load.atlas('character', 'character.png', 'character.json')
        this.load.spritesheet('mininotes', 'mininotes.png', {frameWidth: 132, frameHeight:190})
        this.load.tilemapTiledJSON('map', 'map_muzikuro.json');
        this.load.image('tileset_0', 'tileset_0.png');
        this.load.atlas('music_notes','music_notes.png', 'music_notes.json');
        this.load.audio('piano', 'piano_pitch4.ogg');
        this.load.audio('drumbeat', 'beat_0_115.mp3');
        this.load.audio('buttonClick', 'button.wav');
        this.load.audio('note_get', 'note_get.ogg');
        this.load.spritesheet('phonograph', 'phonograph.png', {frameWidth: 293, frameHeight:381})
        
        this.load.setPath('/assets/ComposeUI/');
        this.load.setPrefix('ComposeUI.');
        this.load.image('window', 'window.png');
        this.load.spritesheet('close'   , 'close.png'   , {frameWidth: 69, frameHeight: 66});
        this.load.spritesheet('submit'  , 'submit.png'  , {frameWidth: 74, frameHeight: 71});
        this.load.spritesheet('reset'   , 'reset.png'   , {frameWidth: 74, frameHeight: 71});
        this.load.spritesheet('play'    , 'play.png'    , {frameWidth: 74, frameHeight: 71});
        this.load.image('note_index', 'note_index.png')
        this.load.image('note', 'note.png');
        
        this.load.start();
        this.load.once('complete', function(){
            this.createAnims();
            this.game.events.emit("preloadComplete");
        }, this);
    }
    
        
    createAnims(){
        // animations
        var anim_keys = ['front_walk_Kuro','front_walk_Muzi','side_walk_Kuro','side_walk_Muzi','back_walk_Kuro','back_walk_Muzi'];
        for(let key of anim_keys){
            this.anims.create({key: key,
                frames: this.anims.generateFrameNames('character', {prefix: `${key}_`, end:5}),
                repeat: -1,
                duration: WALK_ANIM_DURATION
            });
        }
        this.anims.create({
            key: 'phonograph_play',
            frames: this.anims.generateFrameNumbers('phonograph', {start: 0, end: 2}),
            repeat: -1,
            duration: PHONO_ANIM_DURATION
        });
    }
}