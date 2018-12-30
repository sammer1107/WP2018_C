import BaseGameScene from './BaseGameScene.js'

const PIANO_CONFIG = [['E','C',0], ['R','D',1.5], ['T','E',3], ['Y','F',4.5], ['U','G',6], ['I','A',7.5], ['O','B',9]];

export default class ComposeScene extends BaseGameScene{
    constructor(){
        super({ key: 'Compose'});
        this.is_composing;
    }
    
    init(){
        super.init()
        this.is_composing = false;
    }
    
    create(){
        var socket = this.game.socket;
        this.listenToSocket(["disconnect", "playerMove", "destroyPlayer", "updatePartner"])

        // create map
        var scale = this.cache.tilemap.get("map").data.scale;
        var map = this.make.tilemap({ key: 'map'});
        var tileset = map.addTilesetImage('tileset_0');      // name as specified in map.json
        this.layer_floor = map.createDynamicLayer('floor', tileset);
        this.layer_floor.setDepth(-2);
        this.layer_floor.setScale(scale);
        this.layer_wall = map.createDynamicLayer('wall', tileset);
        this.layer_wall.setDepth(-1);
        this.layer_wall.setScale(scale);
        this.layer_wall.setCollisionBetween(112,146);
        this.physics.world.setBounds(0,0,this.layer_floor.width*scale,this.layer_floor.height*scale);
        this.cameras.main.roundPixels = true;
        
        // yeah musics
        this.sound.pauseOnBlur = false;
        this.playerPiano = this.sound.add('piano');
        
        this.createSpritePlayers();
        
        // setup piano
        for(const [key, note_name, st] of PIANO_CONFIG) {
            this.playerPiano.addMarker({name: note_name, start: st, duration: 1.5});
            this.input.keyboard.on(`keydown_${key}`, () => {
                this.playerPiano.play(note_name);
                // TODO: put a note
            })
        }

        this.game.hud.bind(this);
        this.game.hud.updatePlayerState();
        this.game.hud.resetBoard();
        
        this.sound.context.resume();
    }
    
    onUpdatePartner(data){
        // only when player is set lonely will this be called
        // no new groups will be made in this scene
        let lonely_player = this.players.get(data.lonely);
        this.groups = this.groups.filter( g => g !== lonely_player.group );
        lonely_player.group.destroy();
        lonely_player.partner_id = null;

        
        this.game.hud.resetBoard();
        this.game.hud.updatePlayerState();

    }
    
    finish(){
        this.playerPiano.destroy();
        this.detachSocket();
    }
}