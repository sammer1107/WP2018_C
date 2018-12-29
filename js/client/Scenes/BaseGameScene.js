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
        this.callbacks = new Map();
    }
    
    init(){
        this.local_player = null;
        this.players = new Map();
        this.groups = [];
        this.delta_last_send_move = 0;
        this.callbacks = new Map();
    }
    
    onDisconnect(){
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
            this.physics.add.collider(this.local_player.group, this.layer_wall)
        }
        
    }
    
    update(time, delta){
        var pointer = this.input.activePointer;
        var player = this.local_player;
        this.delta_last_send_move += delta;
        
        if(player && player.role == 'Kuro' && player.in_game ){
            
            if(pointer.isDown && (time - pointer.downTime > 250)){
                if( Math.pow( Math.pow(pointer.x/this.cameras.main.height-0.5, 2) + Math.pow(pointer.y/this.cameras.main.height-0.5, 2), 0.5) > 0.1){
                    this.moveToPointer({x: this.input.mousePointer.x, y: this.input.mousePointer.y});
                 }
            }
            
            if(player.group.walking){
                // stop smovement when kuro reached pointer movement's destination
                let pos = player.getPosition();
                let dest_vec = new Phaser.Math.Vector2(player.pointerDest).subtract(pos);
                if( dest_vec.dot(player.group.body.velocity) <= 0 || player.group.body.velocity.length() == 0){
                    // reached destination or hit the wall
                    
                    player.group.body.velocity.set(0,0);
                    this.game.socket.emit("playerMove", { pos: pos,
                                                          v: {x:0, y:0}})
                    
                    player.pointerDest = null;
                    player.group.walking = false;
                    player.group.stopWalkAnimation();
                }else if(this.delta_last_send_move > MOVE_SEND_INTERVAL){ // keep moving
                    this.game.socket.emit("playerMove", { pos: pos,
                                                          v: { x: player.group.body.velocity.x,
                                                               y: player.group.body.velocity.y, }});
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
        var p = this.players.get(data.id);
        //console.log(`Player ${p.id} ${p.name} ${p.role} ${p.group}`);
        if(!group){
            console.warn(`Player ${data.id}(${this.players.get(data.id).name}) moved while not grouped.`)
            //console.log(this.players.get(data.id))
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
            //console.log("deleted player: ", this.players)
            this.game.hud.resetBoard();
            this.game.hud.updatePlayerState();
        }
    }
    
    moveToPointer(pointer){
        var dest, pos, vect;

        pos = this.local_player.getPosition();
        dest = this.cameras.main.getWorldPoint(pointer.x, pointer.y);
        this.local_player.pointerDest = dest;
        vect = new Phaser.Math.Vector2(dest).subtract(pos);
        if(vect.length() > 10){
            this.physics.moveToObject(this.local_player.group, dest, MOVE_SPEED); // This will not stop when reached destination

            let facing, partner;
            facing = getDirection(this.local_player.group.body.velocity);
            partner = this.players.get(this.local_player.partner_id);
            
            if(facing != this.local_player.group.facing || !this.local_player.group.walking){
                this.local_player.group.playWalkAnimation(facing);
            }
            
            this.local_player.group.facing = facing;
            this.local_player.group.walking = true;            
        }
    }
    
    listenToSocket(events){
        // bind all event to its corresponding function by name
        // we need to keep the binded functions in callbacks in order to remove them
        if(events instanceof Array){
            for(let e of events){
                let func = this[`on${e[0].toUpperCase()}${e.substring(1)}`].bind(this);
                this.game.socket.on(e, func);
                this.callbacks.set(e, func);
            }
        }
        else{
            let func = this[`on${e[0].toUpperCase()}${e.substring(1)}`].bind(this);
            this.game.socket.on(e, func);
            this.callbacks.set(e, func);
        }
        
    }
    
    detachSocket(){
        // this function drops all listeners in this.callbacks
        for(let c of this.callbacks.keys()){
            this.game.socket.off(c, this.callbacks.get(c));
            this.callbacks.delete(c);
        }
    }
}