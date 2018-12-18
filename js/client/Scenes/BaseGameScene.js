/*
This is a BaseGameScene that allow players to be created, moving with animation and toggling UI using Q.
*/
import {MOVE_SPEED, WALK_ANIM_DURATION, MOVE_UPDATE_PER_SEC, 
        FRONT, LEFT, RIGHT, BACK, MUZI, KURO} from '../constants.js'
import {LocalPlayer, RemotePlayer} from '../GameObjects/Player.js'
import Group from '../GameObjects/Group.js'
import {getDirection} from '../utils.js'

const MOVE_SEND_INTERVAL = 1000/MOVE_UPDATE_PER_SEC;

export default class BaseGameScene extends Phaser.Scene{
    constructor(config){
        super(config);
        this.local_player = null;
        this.players = new Map();
        this.groups = [];
        this.delta_last_send_move = 0;
    }
    
    
    onSocketDisconnected(){
        /*
        this.groups.forEach((group)=>{group.destroy()})
        this.players.forEach(function(elem){
            elem.destroy() 
        });
        this.players.clear();
        */
        this.physics.pause();
    }
    
    createSpritePlayers(){
        /*
        This function creates player sprites from the existing value in Game object
        */
        for(let player of this.game.players.values()){
            if(player.id == this.game.local_player.id){
                player = new LocalPlayer(this, player.x, player.y, player.name, player.id, player.role, player.partner_id);
                this.local_player = player;
            }
            else{
                player = new RemotePlayer(this, player.x, player.y, player.name, player.id, player.role, player.partner_id);
            }
            this.players.set(player.id, player);
        }
        // create groups
        for(let player of this.players.values()){
            var partner = this.players.get(player.partner_id);
            if(player.role == MUZI && partner){
                this.groups.push(new Group(this, player, partner));
            }
        }
        if(this.local_player.group){
            this.local_player.group.setDepth(1);
            this.cameras.main.startFollow(this.local_player.group);
            this.cameras.main.setLerp(0.15,0.15);
            if(this.local_player.role == KURO){
                this.input.on('pointerdown', this.moveToPointer, this);
            }
        }
        
    }
    
    update(time, delta){
        var pointer = this.input.activePointer;
        this.delta_last_send_move += delta;
        if(this.local_player && this.local_player.role == 'Kuro' && this.local_player.in_game ){
            
            if(pointer.isDown && (time - pointer.downTime > 250)){
                if( Math.pow( Math.pow(pointer.x/this.cameras.main.height-0.5, 2) + Math.pow(pointer.y/this.cameras.main.height-0.5, 2), 0.5) > 0.1){
                    this.moveToPointer({x: this.input.mousePointer.x, y: this.input.mousePointer.y});
                 }
            }
            
            if(this.local_player.group.walking){
                // stop smovement when kuro reached pointer movement's destination
                let pos = this.local_player.getPosition();
                let dest_vec = new Phaser.Math.Vector2(this.local_player.pointerDest).subtract(pos);
                if( this.local_player.pointerVect.dot(dest_vec) <= 0){ // reached destination
                    let partner = this.players.get(this.local_player.partner_id);
                    
                    this.local_player.group.body.velocity.set(0,0);
                    this.game.socket.emit("playerMove", { pos: pos,
                                                          v: {x:0, y:0}})
                    
                    this.local_player.pointerDest = null;
                    this.local_player.group.walking = false;
                    this.local_player.group.stopWalkAnimation();
                }else if(this.delta_last_send_move > MOVE_SEND_INTERVAL){ // keep moving
                    this.game.socket.emit("playerMove", { pos: pos,
                                                          v: { x: this.local_player.pointerVect.x,
                                                                  y: this.local_player.pointerVect.y, }});
                    this.delta_last_send_move = 0;
                }
            }
            
        }
        
        var keyQ = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.Q);
        if(Phaser.Input.Keyboard.JustDown(keyQ)) {
            this.game.hud.showLeaderBoard();
        }
        if(Phaser.Input.Keyboard.JustUp(keyQ)) {
            this.game.hud.hideLeaderBoard();
        }
        
        this.players.forEach(function(player){
            if(player.in_game) player.anims.update(time, delta);
        })
    }
      
    onPlayerMove(data){
        var group = this.players.get(data.id).group;
        if(!group){
            console.warn(`Player ${data.id}(${this.players.get(data.id).name}) moved while not grouped.`)
            console.log(this.players.get(data.id))
            return;
        }
        group.x = data.pos.x;
        group.y = data.pos.y;
        
        if(data.v.x == 0 && data.v.y == 0){
            group.body.velocity.set(0,0);
            group.walking = false;
            group.stopWalkAnimation();
        }
        else{
            let facing = getDirection(data.v);
            let dest = new Phaser.Math.Vector2(data.pos).add(data.v)
            this.physics.moveToObject(group, dest, MOVE_SPEED)
            
            if(facing != group.facing || !group.walking){
                group.playWalkAnimation(facing);
            }
            group.walking = true;
            group.facing = facing;
        }
        
    }
    
    onDestroyPlayer(data){
        if(this.players.has(data.id)){
            let player = this.players.get(data.id);
            player.destroy(); 
            this.players.delete(data.id)
            console.log("deleted player: ", this.players)
            this.game.hud.resetBoard();
            this.game.hud.updatePlayerState();
        }
    }
    
    moveToPointer(pointer){
        var dest, pos;

        pos = this.local_player.getPosition();
        dest = this.cameras.main.getWorldPoint(pointer.x, pointer.y);
        this.local_player.pointerDest = dest;
        this.local_player.pointerVect = new Phaser.Math.Vector2(dest).subtract(pos);
        if(this.local_player.pointerVect.length() > 10){
            this.physics.moveToObject(this.local_player.group, dest, MOVE_SPEED); // This will not stop when reached destination

            let facing, partner;
            facing = getDirection(this.local_player.pointerVect);
            partner = this.players.get(this.local_player.partner_id);
            
            if(facing != this.local_player.group.facing || !this.local_player.group.walking){
                this.local_player.group.playWalkAnimation(facing);
            }
            
            this.local_player.group.facing = facing;
            this.local_player.group.walking = true;            
        }
    }
}