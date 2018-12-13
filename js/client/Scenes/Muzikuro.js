import {LocalPlayer, RemotePlayer} from '../GameObjects/Player.js'
import {Group} from '../GameObjects/Group.js'
import {MOVE_SPEED, WALK_ANIM_DURATION, MOVE_UPDATE_PER_SEC, 
        FRONT, LEFT, RIGHT, BACK, MUZI, KURO, NOTE_THRESHOLD_DIST} from '../constants.js'
import {Note} from '../GameObjects/Note.js'
import {getDirection} from '../utils.js'
import {HUD} from '../HUD.js'

export default class MuziKuro extends Phaser.Scene {
    constructor(){
        super({ key: 'MuziKuro'});
        this.notes_list = new Map();
        this.local_player = null;
        this.players = new Map();
        this.groups = [];
        this.hud = new HUD();
        this.music_notes = null;
        this.on_beats_user = false;
        this.on_beats_index = 0;
        
        this.move_send_interval = 1000/MOVE_UPDATE_PER_SEC;
        this.delta_last_send_move = 0;
    }
    
    create(data){
        var socket = this.game.socket;
        socket.on("disconnect", this.onSocketDisconnected.bind(this));
        socket.on("newPlayer", this.onNewPlayer.bind(this));
        socket.on("playerMove", this.onPlayerMove.bind(this));
        socket.on("destroyPlayer", this.onDestroyPlayer.bind(this));
        socket.on("updatePartner", this.onUpdatePartner.bind(this));
        socket.on("notesUpdate", this.onNotesUpdate.bind(this));
        socket.on("notesRemove", this.onNotesRemove.bind(this));
        socket.on("tempoMeasurePast", this.onTempoMeasurePast.bind(this));

        // create map
        var map = this.make.tilemap({ key: 'map'});
        var google_tile = map.addTilesetImage('google_tile');      // name as specified in map.json
        var layer = map.createStaticLayer('map_layer_0', google_tile);
        layer.setDepth(-1);
        this.physics.world.setBounds(0,0,5000,5000);
        
        // yeah musics
        this.sound.pauseOnBlur = false;
        this.music_notes = this.physics.add.group();
        this.playerPiano = this.sound.add('piano');
        this.drumbeat = this.sound.add('drumbeat');
        this.drumbeat.addMarker({name:'0', start:0, duration:60/115*1000*8})
        
        // animations
        var anim_keys = ['front_walk_Kuro','front_walk_Muzi','side_walk_Kuro','side_walk_Muzi','back_walk_Kuro','back_walk_Muzi'];
        for(let key of anim_keys){
            this.anims.create({key: key,
                frames: this.anims.generateFrameNames('character', {prefix: `${key}_`, end:5}),
                repeat: -1,
                duration: WALK_ANIM_DURATION});
        }
        
        // create sprite players
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
        }
        
        if(this.local_player.role == KURO){
            this.input.on('pointerdown', this.pointerDown.bind(this));
        }
        
        this.onNotesUpdate(data.notes)
        
        // setup piano
                
        //pianoKey consists of ['Key to Press', 'Note to Play', 'Start Time in Audio']
        //ertyuio -> Second Row of Keyboard
        let pianoKeyIndi = [['E','C',0], ['R','D',1.5], ['T','E',3], ['Y','F',4.5], ['U','G',6], ['I','A',7.5], ['O','B',9]];
        Note.setSoundPool(this, 'piano', pianoKeyIndi, 5);
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
                                    props: { scaleX: 0.7, scaleY: 0.7, angle: (Math.random()-0.5)*40 },
                                    yoyo: true,
                                    repeat: 0,
                                    duration: 150,
                                    ease: "Sine",
                                });
                            }
                        }
                    }
                }
            })
        }

        //leaderBoard controll
        var keyTAB = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.TAB);
        this.hud.UpdatePlayerState(this.players, this.local_player);
        
        // console.log("muzikuro: ", this)
    }
    
    update(time, delta){
        var pointer = this.input.activePointer;
        this.delta_last_send_move += delta;
        if(this.local_player && this.local_player.role == 'Kuro' && this.local_player.in_game ){
            
            if(pointer.isDown && (time - pointer.downTime > 250)){
                if( Math.pow( Math.pow(pointer.x/this.cameras.main.height-0.5, 2) + Math.pow(pointer.y/this.cameras.main.height-0.5, 2), 0.5) > 0.1){
                    this.pointerDown({x: this.input.mousePointer.x, y: this.input.mousePointer.y});
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
                }else if(this.delta_last_send_move > this.move_send_interval){ // keep moving
                    this.game.socket.emit("playerMove", { pos: pos,
                                                          v: { x: this.local_player.pointerVect.x,
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
/*   
    onSocketConnected(){
        console.log("Socket connected.");
        if(this.physics){
            this.physics.resume();        
        }
    }    
*/  
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
        this.hud.resetBoard(this.groups);
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
                for(const [id, note] of this.notes_list) {
                    this.physics.add.overlap(this.local_player.group, note, (pl, n) => {
                        n.changeVol((NOTE_THRESHOLD_DIST-Phaser.Math.Distance.Between(pl.x, pl.y, n.x, n.y))/NOTE_THRESHOLD_DIST);
                    }, null, this)
                }
            }
        }
        else if(data.lonely){
            let lonely_player = this.players.get(data.lonely);
            this.groups = this.groups.filter( g => g !== lonely_player.group );
            lonely_player.group.destroy();
            lonely_player.partner_id = null;
        }
        
        this.hud.resetBoard(this.groups);
        this.hud.UpdatePlayerState(this.players, this.local_player);
        //console.log("groups: ", this.groups)
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
        if(!this.local_player.in_game) return; // temporary fix?
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
        if(!group){
            console.warn(`Player(${this.players.get(data.id).name}) moved while not grouped.`)
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
