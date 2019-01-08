import BaseGameScene from './BaseGameScene.js'
import Phonograph from '../GameObjects/Phonograph.js'
import {log_func} from '../utils.js'
import {MUZI, KURO} from '../constants.js'

export default class ComposeScene extends BaseGameScene{
    constructor(){
        super({ key: 'Compose'});
        this.UI;
    }
    
    init(){
        super.init();
    }
    
    create(){
        this.scene.launch('ComposeUI');
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
        this.layer_floor.setCollisionBetween(106,176)
                        .setCollisionBetween(78,81);
        this.layer_wall.setCollisionBetween(22,29)
                        .setCollisionBetween(33,36)
                        .setCollisionBetween(40,41)
                        .setCollisionBetween(43,52)
                        .setCollisionBetween(78,81)
                        .setCollision(69)
                        .setCollisionBetween(106,176);
                        
        this.physics.world.setBounds(0,0,this.layer_floor.width*scale,this.layer_floor.height*scale);
        //this.cameras.main.roundPixels = true;
        
        // yeah musics
        this.sound.pauseOnBlur = false;
        
        this.createSpritePlayers();
        //set phonograph and phonoPiano
        this.phonograph = new Phonograph(this, (this.layer_floor.width+128)*scale/2, (this.layer_floor.height+128)*scale/2);
        this.phonograph.play('phonograph_play');
        if(this.local_player.role == MUZI){
            this.phonograph.setInteractive({
                cursor: 'pointer',
                pixelPrefect: true
            }).on('pointerdown', this.onPhonoClicked, this)
        }
        if(this.local_player.group){
            this.physics.world.addCollider(this.local_player.group, this.phonograph);            
        }

        this.game.hud.bind(this);
        this.game.hud.updatePlayerState();
        this.game.hud.resetBoard();
        this.UI = this.scene.get('ComposeUI');
        this.scene.sleep('ComposeUI');
        
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
    
    onPhonoClicked(pointer, local_x, local_y, stop){
        if(!pointer.leftButtonDown()) return;
        
        if(!this.UI) this.UI = this.scene.get('ComposeUI');
        //this.input.enabled = false;
        this.UI.events.once('composeClose', (done)=>{
            //this.input.enabled = true;
            if(done){
                this.input.clear(this.phonograph);
            }
        });
        this.UI.sys.wake();
    }
    
    finish(){
        this.UI.finish();
        this.UI.sys.shutdown();
        this.detachSocket();
    }
}

var Log = log_func(ComposeScene);