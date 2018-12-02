import {LocalPlayer, RemotePlayer} from '../player.js'
import {Group} from '../group.js'
import {MOVE_SPEED, WALK_ANIM_DURATION, FRONT, LEFT, RIGHT, BACK, MUZI, KURO} from '../constants.js'
import {getDirection} from '../utils.js'

export default class MuziKuro extends Phaser.Scene {
    constructor(){
        super({ key: 'MuziKuro'});
        this.notes_list = {};
        // local_player and players will be a reference to the Game Object's corresponding property
        this.local_player = null;
        this.players = null;
        this.groups = [];
    }
    
    preload() {
        this.load.setPath('/assets/')
        this.load.atlas('character', 'character.png', 'character.json')
        this.load.tilemapTiledJSON('map', 'map.json');
        this.load.image('google_tile', 'tileset.png');
        this.load.image('music_note','musical-note.png');
    }
    
    create(){
        var socket = this.game.socket;
        if(socket.connected) this.onSocketConnected();
        socket.on("connect", this.onSocketConnected.bind(this));
        socket.on("disconnect", this.onSocketDisconnected.bind(this));
        socket.on("createLocalPlayer", this.onCreateLocalPlayer.bind(this));
        socket.on("newPlayer", this.onNewPlayer.bind(this));
        socket.on("playerMove", this.onPlayerMove.bind(this));
        socket.on("destroyPlayer", this.onDestroyPlayer.bind(this));
        socket.on("updatePartner", this.onUpdatePartner.bind(this));
        socket.on("notesUpdate", this.onNotesUpdate.bind(this));
        socket.on("notesRemove", this.onNotesRemove.bind(this));

        this.players = this.game.players;
        
        // create map
        var map = this.make.tilemap({ key: 'map'});
        var google_tile = map.addTilesetImage('google_tile');      // name as specified in map.json
        var layer = map.createStaticLayer('map_layer_0', google_tile);
        this.physics.world.setBounds(0,0,5000,5000);
        
        this.music_notes = this.physics.add.group();
        
        // animations
        this.anims.create({key:'front_walk_Kuro',
            frames: this.anims.generateFrameNames('character', {prefix: 'front_walk_Kuro_', end:5}),
            repeat: -1,
            duration: WALK_ANIM_DURATION});
        this.anims.create({key:'front_walk_Muzi',
            frames: this.anims.generateFrameNames('character', {prefix: 'front_walk_Muzi_', end:5}),
            repeat: -1,
            duration: WALK_ANIM_DURATION});
        this.anims.create({key:'side_walk_Kuro',
            frames: this.anims.generateFrameNames('character', {prefix: 'side_walk_Kuro_', end:5}),
            repeat: -1,
            duration: WALK_ANIM_DURATION});
        this.anims.create({key:'side_walk_Muzi',
            frames: this.anims.generateFrameNames('character', {prefix: 'side_walk_Muzi_', end:5}),
            repeat: -1,
            duration: WALK_ANIM_DURATION});
        this.anims.create({key:'back_walk_Kuro',
            frames: this.anims.generateFrameNames('character', {prefix: 'back_walk_Kuro_', end:5}),
            repeat: -1,
            duration: WALK_ANIM_DURATION});
        this.anims.create({key:'back_walk_Muzi',
            frames: this.anims.generateFrameNames('character', {prefix: 'back_walk_Muzi_', end:5}),
            repeat: -1,
            duration: WALK_ANIM_DURATION});
            
        // controlls
        /*
        var KEY_W = this.input.keyboard.addKey("w");
        var KEY_A = this.input.keyboard.addKey("a");
        var KEY_S = this.input.keyboard.addKey("s");
        var KEY_D = this.input.keyboard.addKey("d");
        */

        console.log("muzikuro: ", this)
    }
    
    update(time, delta){
        if(this.local_player && this.local_player.role == 'Kuro' && this.local_player.in_game ){

            if(this.input.mousePointer.isDown){
                this.pointerDown({x: this.input.mousePointer.x, y: this.input.mousePointer.y});
            }
            
            if(this.local_player.group.walking){
                // stop smovement when kuro reached pointer movement's destination
                let pos = this.local_player.getPosition();
                let dest_vec = new Phaser.Math.Vector2(this.local_player.pointerDest).subtract(pos);
                if( this.local_player.pointerVect.dot(dest_vec) <= 0){
                    let partner = this.players.get(this.local_player.partner_id);
                    
                    this.local_player.group.body.velocity.set(0,0);
                    this.game.socket.emit("playerMove", { pos: pos,
                                                          vect: {x:0, y:0}})
                    
                    this.local_player.pointerDest = null;
                    this.local_player.group.walking = false;
                    this.local_player.group.stopWalkAnimation();
                }
            }
            
        }
        
        this.players.forEach(function(player){
            if(player.in_game) player.anims.update(time, delta);
        })
        /*
        if(KEY_W.isDown){
            kuro.y -= MOVE_SPEED;
            
        }
        if(KEY_A.isDown){
            kuro.x -= MOVE_SPEED;
            
        }
        if(KEY_S.isDown){
            kuro.y += MOVE_SPEED;
            
        }
        if(KEY_D.isDown){
            kuro.x += MOVE_SPEED;
            
        }
        */
    }
    
    collectMusicNote(player, music_note){
        music_note.disableBody(true, true);
        this.game.socket.emit("noteCollected", `${music_note.x}${music_note.y}`);
        this.music_notes.remove(music_note, true, true);
    }
    
    onSocketConnected(){
        console.log("Socket connected.");
        this.game.socket.emit("requestNotes");
        if(this.physics){
            this.physics.resume();        
        }
    }
    
    onCreateLocalPlayer(data){
        this.game.local_player = new LocalPlayer(this, data.x, data.y, data.name, this.game.socket.id, data.role, data.partner_id);
        this.local_player = this.game.local_player;
        this.players.set(this.local_player.id, this.local_player)
    }
    
    onSocketDisconnected(){
        this.local_player.destroy();
        this.players.forEach(function(elem){
            elem.destroy() 
        });
        this.players.clear();
        this.physics.pause();
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
        }
    }

    onUpdatePartner(data){
        console.log("updatePartner", data)
        var updated = this.players.get(data[0])
        var partner = this.players.get(data[1])
        
        if(!updated) return;
        updated.partner_id = data[1];
        
        if(partner){
            let group;
            if(updated.role == MUZI){
                group = new Group(this, updated, partner);
            }
            else{
                group = new Group(this, partner, updated);
            }
            this.groups.push(group);
            
            if(updated == this.local_player || partner == this.local_player){
                group.setDepth(1);
                this.cameras.main.startFollow(group);
                this.cameras.main.setLerp(0.15,0.15);
            }
        }
        if(data[1] == null){
            updated.group.destroy();
            this.groups = this.groups.filter(g => !(g === g));
        }
        
        console.log(this.groups)
    }

    onNotesUpdate(data) {
        for(const note of data) {
            this.notes_list[`${note.x}${note.y}`] = this.music_notes.create(note.x, note.y, 'music_note');
            //console.log(`Create Note at (${note.x}, ${note.y})`);
        }
    }
        
    onNotesRemove(data) {
        console.log("notes remove:", data);
        this.music_notes.remove(notes_list[data], true, true);
    }
    
    onPlayerMove(data){
        var group = this.players.get(data.id).group;
        
        group.x = data.pos.x;
        group.y = data.pos.y;
        
        if(data.vect.x == 0 && data.vect.y == 0){
            group.body.velocity.set(0,0);
            group.walking = false;
            group.stopWalkAnimation();
        }
        else{
            let facing = getDirection(data.vect);
            let dest = new Phaser.Math.Vector2(data.pos).add(data.vect)
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
        }
    }

    pointerDown(pointer){
        var dest, pos;
        
        pos = this.local_player.getPosition();
        dest = this.cameras.main.getWorldPoint(pointer.x, pointer.y);
        this.local_player.pointerDest = dest;
        this.local_player.pointerVect = new Phaser.Math.Vector2(dest).subtract(pos);
        if(this.local_player.pointerVect.length() > 10){
            this.physics.moveToObject(this.local_player.group, dest, MOVE_SPEED); // This will not stop when reached destination
            this.game.socket.emit("playerMove", { pos: pos,
                                                  vect: { x: this.local_player.pointerVect.x,
                                                          y: this.local_player.pointerVect.y, }});

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










