import {MUZI, KURO} from '../constants.js'
import BaseGameScene from './BaseGameScene.js'
import {LocalPlayer, RemotePlayer} from '../GameObjects/Player.js'
import Group from '../GameObjects/Group.js'

export default class LobbyScene extends BaseGameScene{
    constructor(){
        super({key: "Lobby"})
    }
    
    create(){
        var socket = this.game.socket;
        socket.on("disconnect", this.onSocketDisconnected.bind(this));
        socket.on("newPlayer", this.onNewPlayer.bind(this));
        socket.on("updatePartner", this.onUpdatePartner.bind(this));
        socket.on("playerMove", this.onPlayerMove.bind(this));
        socket.on("destroyPlayer", this.onDestroyPlayer.bind(this));
        
        // create map
        var map = this.make.tilemap({ key: 'map'});
        var google_tile = map.addTilesetImage('google_tile');      // name as specified in map.json
        var layer = map.createStaticLayer('map_layer_0', google_tile);
        layer.setDepth(-1);
        this.physics.world.setBounds(0,0,5000,5000);
        
        this.createSpritePlayers();
        
        this.game.hud.bind(this);
        this.game.hud.updatePlayerState();
        this.game.hud.resetBoard();

    }
    
    update(time, delta){
        super.update(time, delta);
    }
    
    onNewPlayer(data){
        // Before LocalPlayer created, there might be already some players sent to this client
        if(this.players.has(data.id)) return;
        
        var new_player = new RemotePlayer(this, data.x, data.y, data.name, data.id, data.role, data.partner_id);
        this.players.set(new_player.id, new_player);
        var partner = this.players.get(new_player.partner_id);
        
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
            group = new Group(this, muzi, kuro);
            this.groups.push(group);
            
            if(muzi == this.local_player || kuro == this.local_player){
                group.setDepth(1);
                this.cameras.main.startFollow(group);
                this.cameras.main.setLerp(0.15,0.15);
                
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
            this.groups = this.groups.filter( g => g !== lonely_player.group );
            lonely_player.group.destroy();
            lonely_player.partner_id = null;
        }
        
        this.game.hud.resetBoard();
        this.game.hud.updatePlayerState();
        
        //console.log("groups: ", this.groups)
    }
    
    finish(){
        var socket = this.game.socket;
        socket.off("disconnect", this.onSocketDisconnected.bind(this));
        socket.off("newPlayer", this.onNewPlayer.bind(this));
        socket.off("updatePartner", this.onUpdatePartner.bind(this));
        socket.off("playerMove", this.onPlayerMove.bind(this));
        socket.off("destroyPlayer", this.onDestroyPlayer.bind(this));
    }
}