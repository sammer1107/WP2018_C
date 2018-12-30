import {MUZI, KURO} from '../constants.js'
import BaseGameScene from './BaseGameScene.js'
import {LocalPlayer, RemotePlayer} from '../GameObjects/Player.js'
import Group from '../GameObjects/Group.js'

export default class LobbyScene extends BaseGameScene{
    constructor(){
        super({key: "Lobby"})
    }
    
    create(){
        this.listenToSocket(["disconnect", "newPlayer", "updatePartner", "playerMove", "destroyPlayer"]);
        
        // create map
        var scale = this.cache.tilemap.get("map").data.scale;
        var map = this.make.tilemap({ key: 'map'});
        var tileset = map.addTilesetImage('tileset_0');
        this.layer_floor = map.createDynamicLayer('floor', tileset);
        this.layer_floor.setDepth(-2);
        this.layer_floor.setScale(scale);
        this.layer_wall = map.createDynamicLayer('wall', tileset);
        this.layer_wall.setDepth(-1);
        this.layer_wall.setScale(scale);
        this.layer_wall.setCollisionBetween(112,146);
        this.cameras.main.roundPixels = true;
        this.physics.world.setBounds(0,0,this.layer_floor.width*scale,this.layer_floor.height*scale);
        
        this.createSpritePlayers();
        
        this.game.hud.bind(this);
        this.game.hud.updatePlayerState();
        this.game.hud.resetBoard();
        
        this.sound.context.resume();
    }
    
    update(time, delta){
        super.update(time, delta);
    }
    
    onNewPlayer(data){
        
        var new_player = new RemotePlayer(this, data.x, data.y, data.name, data.id, data.role, data.partner_id);
        this.players.set(new_player.id, new_player);
        var partner = this.players.get(new_player.partner_id);
        
        // TODO: maybe remove this in the future
        // because now the server only sends the new_player with no partner or position set
        if(partner && partner.partner_id == new_player.id){
            let group;
            if (new_player.role == MUZI){
                group = new Group(this, new_player, partner);                
            }
            else{
                group = new Group(this, partner, new_player);
            }
            this.groups.push(group);
            if(partner == this.local_player){
                this.cameras.main.startFollow(group);
                this.cameras.main.setLerp(0.15,0.15);
                group.setDepth(1);
                this.physics.add.collider(group, this.layer_wall);
            }
            this.game.hud.resetBoard();
        }
        this.game.hud.updatePlayerState();
    }
    
    onUpdatePartner(data){
        var muzi = this.players.get(data.Muzi);
        var kuro = this.players.get(data.Kuro);
        //console.log(`updatePartner: `, data);
        
        if(muzi && kuro){
            muzi.partner_id = kuro.id;
            kuro.partner_id = muzi.id;
            muzi.role = MUZI;
            kuro.role = KURO;
            let group;
            group = new Group(this, muzi, kuro, data.x, data.y);
            this.groups.push(group);
            
            if(muzi == this.local_player || kuro == this.local_player){
                group.setDepth(1);
                this.cameras.main.startFollow(group);
                this.cameras.main.setLerp(0.15,0.15);
                this.physics.add.collider(group, this.layer_wall);
                if(this.local_player.role == KURO){
                    this.input.on('pointerdown', this.moveToPointer, this);
                }
                else{
                    this.input.off('pointerdown', this.moveToPointer, this);
                }
            }
        }
        else if(data.lonely){
            let lonely_player = this.players.get(data.lonely);
            if(lonely_player.group){
                // not sure if this is needed because it should have been destroyed in player.destroy
                this.groups = this.groups.filter( g => g !== lonely_player.group );
                lonely_player.group.destroy();
            }
            lonely_player.partner_id = null;
        }
        
        this.game.hud.resetBoard();
        this.game.hud.updatePlayerState();
        
        //console.log("groups: ", this.groups)
    }
    
    finish(){
        this.detachSocket();
    }
}