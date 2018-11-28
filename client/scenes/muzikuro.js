import {LocalPlayer, RemotePlayer} from '../player.js'
import {KURO_SPEED} from '../constants.js'

export default class MuziKuro extends Phaser.Scene {
    constructor(){
        super({ key: 'MuziKuro'});
        this.notes_list = {};
        // local_player and players will be a reference to the Game Object's corresponding property
        this.local_player = null;
        this.players = null;
    }
    
    preload() {
        this.load.image('Kuro', '/assets/Kuro.png');
        this.load.image('Muzi', '/assets/Muzi.png');
        this.load.tilemapTiledJSON('map', '/assets/map.json');
        this.load.image('google_tile', '/assets/tileset.png');
        this.load.image('music_note','/assets/musical-note.png');
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
        
        // create a music note randomly
        this.music_notes = this.physics.add.group();
        
        // controlls
        /*
        var KEY_W = this.input.keyboard.addKey("w");
        var KEY_A = this.input.keyboard.addKey("a");
        var KEY_S = this.input.keyboard.addKey("s");
        var KEY_D = this.input.keyboard.addKey("d");
        console.log(this.input.eventNames())
        */
    }
    
    update(time, delta){     
        if(this.local_player && this.local_player.role == 'Kuro' && this.local_player.in_game ){
            
            if(this.input.mousePointer.isDown){
                this.pointerDown({x: this.input.mousePointer.x, y: this.input.mousePointer.y});
            }
            
            if(this.local_player.pointerDest != null){
                // stop movement when kuro reached pointer movement's destination
                var dest_vec = new Phaser.Math.Vector2(this.local_player.pointerDest).subtract(this.local_player.getPosition());
                if( this.local_player.pointerVect.dot(dest_vec) <= 0){
                    this.local_player.body.velocity.set(0,0);
                    this.local_player.pointerDest = null;
                }
            }
            
            this.game.socket.emit("playerMove", this.local_player.getPosition());
            this.players.get(this.local_player.partner_id).setPosition(this.local_player.x, this.local_player.y);
        }
        
        /*
        if(KEY_W.isDown){
            kuro.y -= KURO_SPEED;
            
        }
        if(KEY_A.isDown){
            kuro.x -= KURO_SPEED;
            
        }
        if(KEY_S.isDown){
            kuro.y += KURO_SPEED;
            
        }
        if(KEY_D.isDown){
            kuro.x += KURO_SPEED;
            
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
        // camera setup
        this.cameras.main.startFollow(this.local_player);
        this.cameras.main.setLerp(0.15,0.15);
        // MuziKuro.input.on("pointerdown", pointerDown, MuziKuro);
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
        var new_player = new RemotePlayer(this, data.x, data.y, data.name, data.id, data.role, data.partner_id);
        this.players.set(new_player.id, new_player);
    }

    onUpdatePartner(data){
        var updated = this.players.get(data[0]) || (this.local_player.id == data[0] ? this.local_player : null);
        
        if(!updated) return;
        
        updated.partner_id = data[1];
        if(data[1] == null){ // partner is null in the case of player disconnected
            updated.setInGame(false);
        }
        else{
            updated.setInGame(true);
        }
        
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
        var moved = this.players.get(data.id);
        moved.x = data.x;
        moved.y = data.y;
        
        if(this.players.has(moved.partner_id)){
            this.players.get(moved.partner_id).setPosition(data.x, data.y);
        }
        else if(this.local_player.id == moved.partner_id){
            this.local_player.setPosition(data.x, data.y);
        }
    }

    onDestroyPlayer(data){
        if(this.players.has(data.id)){
            this.players.get(data.id).destroy();        
            this.players.delete(data.id)
        }
    }

    pointerDown(pointer){
        // console.log(pointer.x, pointer.y)
        var dest = this.cameras.main.getWorldPoint(pointer.x, pointer.y);
        this.local_player.pointerDest = dest;
        this.local_player.pointerVect = new Phaser.Math.Vector2(dest).subtract(this.local_player.getPosition());
        if(this.local_player.pointerVect.length() > 10){
            this.physics.moveToObject(this.local_player, dest, KURO_SPEED); // This will not stop when reached destination
        }
    }
}










