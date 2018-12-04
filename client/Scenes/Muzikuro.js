import {LocalPlayer, RemotePlayer} from '../GameObjects/Player.js'
import {Group} from '../GameObjects/Group.js'
import {MOVE_SPEED, WALK_ANIM_DURATION, MOVE_UPDATE_PER_SEC, 
        FRONT, LEFT, RIGHT, BACK, MUZI, KURO, NOTE_THRESHOLD_DIST} from '../constants.js'
import {Note} from '../GameObjects/Note.js'
import {getDirection} from '../utils.js'

export default class MuziKuro extends Phaser.Scene {
    constructor(){
        super({ key: 'MuziKuro'});
        this.notes_list = new Map();
        // local_player and players will be a reference to the Game Object's corresponding property
        this.local_player = null;
        this.players = null;
        this.groups = [];
        this.music_notes = null;
        
        this.move_send_interval = 1000/MOVE_UPDATE_PER_SEC;
        this.delta_last_send_move = 0;
    }
    
    preload() {
        this.load.setPath('/assets/')
        this.load.atlas('character', 'character.png', 'character.json')
        this.load.tilemapTiledJSON('map', 'map.json');
        this.load.image('google_tile', 'tileset.png');
        this.load.atlas('music_notes','music_notes.png', 'music_notes.json');
        this.load.audio('piano', 'piano_pitch4.ogg');
        this.load.audio('drumbeat', 'beat_0_115.mp3')
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
        socket.on("tempoMeasurePast", this.onTempoMeasurePast.bind(this));

        this.players = this.game.players;
        
        // create map
        var map = this.make.tilemap({ key: 'map'});
        var google_tile = map.addTilesetImage('google_tile');      // name as specified in map.json
        var layer = map.createStaticLayer('map_layer_0', google_tile);
        this.physics.world.setBounds(0,0,5000,5000);
        
        // yeah musics
        this.sound.pauseOnBlur = false;
        this.music_notes = this.physics.add.group();
        this.playerPiano = this.sound.add('piano');
        this.drumbeat = this.sound.add('drumbeat');
        this.drumbeat.addMarker({name:'0', start:0, duration:115/60*1000*8})
        
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

        console.log("muzikuro: ", this)
    }
    
    update(time, delta){
        this.delta_last_send_move += delta;
        if(this.local_player && this.local_player.role == 'Kuro' && this.local_player.in_game ){

            if(this.input.mousePointer.isDown){
                this.pointerDown({x: this.input.mousePointer.x, y: this.input.mousePointer.y});
            }
            
            if(this.local_player.group.walking){
                // stop smovement when kuro reached pointer movement's destination
                let pos = this.local_player.getPosition();
                let dest_vec = new Phaser.Math.Vector2(this.local_player.pointerDest).subtract(pos);
                if( this.local_player.pointerVect.dot(dest_vec) <= 0){ // reached destination
                    let partner = this.players.get(this.local_player.partner_id);
                    
                    this.local_player.group.body.velocity.set(0,0);
                    this.game.socket.emit("playerMove", { pos: pos,
                                                          vect: {x:0, y:0}})
                    
                    this.local_player.pointerDest = null;
                    this.local_player.group.walking = false;
                    this.local_player.group.stopWalkAnimation();
                }else if(this.delta_last_send_move > this.move_send_interval){ // keep moving
                    this.game.socket.emit("playerMove", { pos: pos,
                                                          vect: { x: this.local_player.pointerVect.x,
                                                                  y: this.local_player.pointerVect.y, }});
                    this.delta_last_send_move = 0;
                }
            }
            
        }
        
        this.players.forEach(function(player){
            if(player.in_game) player.anims.update(time, delta);
        })
        
    }
    
    collectMusicNote(player, music_note){
        music_note.disableBody(true, true);
        // maybe just call destroy()
        // may also need to destroy the tweens associated with this note
        this.game.socket.emit("noteCollected", `${music_note.x}_${music_note.y}`);
        this.notes_list.delete(`${music_note.x}_${music_note.y}`);
        this.music_notes.remove(music_note, true, true);
    }
    
    onSocketConnected(){
        console.log("Socket connected.");
        if(this.physics){
            this.physics.resume();        
        }
    }
    
    onCreateLocalPlayer(data){
        this.game.local_player = new LocalPlayer(this, data.x, data.y, data.name, this.game.socket.id, data.role, data.partner_id);
        this.local_player = this.game.local_player;
        this.players.set(this.local_player.id, this.local_player);
        this.game.socket.emit("requestNotes");
        
        //pianoKey consists of ['Key to Press', 'Note to Play', 'Start Time in Audio']
        //ertyuio -> Second Row of Keyboard
        let pianoKeyIndi = [['E','C',0], ['R','D',1.5], ['T','E',3], ['Y','F',4.5], ['U','G',6], ['I','A',7.5], ['O','B',9]];
        Note.setSoundPool(this, 'piano', pianoKeyIndi, 5);
        this.on_beats_user = false;
        this.on_beats_index = 0;
        for(const [key, note_name, st] of pianoKeyIndi) {
            this.playerPiano.addMarker({name: note_name, start: st, duration: 1.5});
            this.input.keyboard.on(`keydown_${key}`, () => {
                this.playerPiano.play(note_name);
                if(this.on_beats_user) {
                    this.on_beats_user = false;
                    for(let [id, note] of this.notes_list) {
                        if(this.physics.overlap(this.local_player.group, note)) {
                            if(note.melody[this.on_beats_index] == note_name) {
                                this.tweens.add({
                                    targets: note,
                                    props: { scaleX: 0.65, scaleY: 0.65 },
                                    yoyo: true,
                                    repeat: 0,
                                    duration: 100,
                                    ease: t => Math.sin(Math.PI*(t-0.5))/2 + 0.5,
                                });
                            }
                        }
                    }
                }
            })
        }
        
        this.events.emit('playerStateChange');
    }
    
    onSocketDisconnected(){
        this.players.forEach(function(elem){
            elem.destroy() 
        });
        this.players.clear();
        this.groups.forEach((group)=>{group.destroy()})
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
                for(const [id, note] of this.notes_list) {
                    this.physics.add.overlap(this.local_player.group, note, (pl, n) => {
                        n.changeVol((NOTE_THRESHOLD_DIST-Phaser.Math.Distance.Between(pl.x, pl.y, n.x, n.y))/NOTE_THRESHOLD_DIST);
                    }, null, this)
                }
            }
            this.events.emit('playerStateChange');
        }
        else{
            updated.group.destroy();
            this.groups = this.groups.filter(g => !(g === g));
            this.events.emit('playerStateChange');
        }
        
        console.log("groups: ", this.groups)
    }

    onNotesUpdate(data) {
        for(const note_d of data) {
            let note = new Note(this, note_d.x, note_d.y, note_d.melody).setScale(0.6);
            this.notes_list.set(`${note_d.x}_${note_d.y}`, note);
            this.music_notes.add(note, true);
            this.tweens.add({
                targets: note,
                props: {
                    y: note.y + 15
                },
                yoyo: true,
                repeat: -1,
                duration: 1000 + (Math.random()-0.5)*600,
                ease: t => Math.sin(Math.PI*(t-0.5))/2 + 0.5,
            });
            let th_wo_scale = NOTE_THRESHOLD_DIST/0.6;
            note.body.setCircle(th_wo_scale, -th_wo_scale+(note.displayWidth>>1), -th_wo_scale+(note.displayHeight>>1));
            if(this.local_player && this.local_player.group) {
                this.physics.add.overlap(this.local_player.group, note, (pl, n) => {
                    n.changeVol((NOTE_THRESHOLD_DIST-Phaser.Math.Distance.Between(pl.x, pl.y, note.x, note.y))/NOTE_THRESHOLD_DIST);
                }, null, this)
            }
            //console.log(`Create Note at (${note_d.x}, ${note_d.y})`);
        }
    }
        
    onNotesRemove(data) {
        console.log("notes remove:", data);
        this.music_notes.remove(notes_list.get(data), true, true);
        this.notes_list.delete(data);
    }

    onTempoMeasurePast(beat_d) {
        console.log("Beats!");
        let ms_per_note = beat_d;
        this.drumbeat.play('0')
        this.playNoteCheck(0);
        setTimeout(() => { this.playNoteCheck(1, ms_per_note); }, ms_per_note);
        setTimeout(() => { this.playNoteCheck(2, ms_per_note); }, ms_per_note*2);
        setTimeout(() => { this.playNoteCheck(3, ms_per_note); }, ms_per_note*3);
        let tolerance = 100;
        for(let i = 0; i < 4; i += 1) {
            setTimeout(() => { this.triggerOnBeatsUser(i, tolerance<<1) }, ms_per_note*(4+i)-tolerance);
        }
    }

    triggerOnBeatsUser(index, tolerance) {
        this.on_beats_index = index;
        this.on_beats_user = true;
        setTimeout(() => { this.on_beats_user = false }, tolerance);
    }

    playNoteCheck(index, ms_per_note) {
        let pl = this.local_player.getPosition();
        for(const [id, note] of this.notes_list) {
            let dis = Phaser.Math.Distance.Between(pl.x, pl.y, note.x, note.y);
            if(dis <= NOTE_THRESHOLD_DIST) {
                note.requestSoundInInterval((ms_per_note*7)>>1); //=ms_per_note/3.5
                note.playSpecificNote(index);
            }
        }
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
