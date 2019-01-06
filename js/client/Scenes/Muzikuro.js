import {MUZI, KURO, NOTE_THRESHOLD_DIST, PHONO_RADIUS, NOTES_ITEM_NAME, PIANO_CONFIG} from '../constants.js'
import BaseGameScene from './BaseGameScene.js'
import {LocalPlayer, RemotePlayer} from '../GameObjects/Player.js'
import Group from '../GameObjects/Group.js'
import Note from '../GameObjects/Note.js'
import Phonograph from '../GameObjects/Phonograph.js'
import {log_func} from '../utils.js'
        
const COMPOSE_LEN = 8;
const NOTE_SCALE = 0.6;

export default class MuziKuro extends BaseGameScene {
    constructor(){
        super({ key: 'MuziKuro'});
        this.notes_list = new Map();
        this.music_notes = null;
        this.on_beats_frame = 0;
        this.user_keyin = new Array(8).fill('_');
        this.composition = Array(8).fill('_');
        this.score = 0;
        this.notes_collect_tmp = new Array();
        this.notes_item = new Map();
        NOTES_ITEM_NAME.forEach((name) => { this.notes_item.set(name, 0) });
    }
    
    create(data){
        var socket = this.game.socket;
        this.listenToSocket(["disconnect", "playerMove", "destroyPlayer", "updatePartner",
                                "notesUpdate", "notesRemove", "tempoMeasurePast", 'setCompose',
                                "scoreUpdate"])

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
        //this.cameras.main.roundPixels = true;
        this.physics.world.setBounds(0,0,this.layer_floor.width*scale,this.layer_floor.height*scale);
        
        // yeah musics
        this.sound.pauseOnBlur = false;
        this.music_notes = this.physics.add.group();
        this.playerPiano = this.sound.add('piano');
        this.drumbeat = this.sound.add('drumbeat');
        this.drumbeat.addMarker({name:'0', start:0, duration:60/115*1000*8});
        
        
        this.createSpritePlayers();
        
        //this.onNotesUpdate(data.notes)
        
        // setup piano
        Note.setSoundPool(this, 'piano', PIANO_CONFIG, 5);
        for(const [key, note_name, st] of PIANO_CONFIG) {
            this.playerPiano.addMarker({name: note_name, start: st, duration: 1.5});
            this.input.keyboard.on(`keydown_${key}`, () => {
                this.playerPiano.play(note_name);
                if(this.beats_frame > 8) {
                    let frame_index = this.beats_frame - 8 - 1;
                    this.user_keyin[frame_index] = note_name;
                    for(let [id, note] of this.notes_list) {
                        if(this.physics.overlap(this.local_player.group, note)) {
                            if(note.melody[frame_index] == note_name) {
                                this.tweens.add({
                                    targets: note,
                                    props: { scaleX: note.scaleX*1.05, scaleY: note.scaleX*1.05, angle: (Math.random()-0.5)*40 },
                                    yoyo: false,
                                    repeat: 0,
                                    duration: 200,
                                    ease: "Sine",
                                });
                            }
                        }
                    }
                }
            })
        }
        
        // create hud
        this.game.hud.bind(this);
        this.game.hud.updatePlayerState();
        this.game.hud.resetBoard();
        
        //set phonograph and phonoPiano
        this.phonograph = new Phonograph(this, (this.layer_floor.width+128)*scale/2, (this.layer_floor.height+128)*scale/2).setDepth(-1);
        this.phonograph.addPhonoSoundMarker();
        this.add.existing(this.phonograph);
        this.phonograph.setSheet(this.composition);
        this.physics.world.enable(this.phonograph, 1);
        if(this.local_player.group){
            this.physics.world.addCollider(this.local_player.group, this.phonograph);            
        }
        
        this.sound.context.resume();
    }
    
    update(time, delta){
        super.update(time, delta);
    }
    
    onSetCompose(data){
        var i;
        for(i=0;i<COMPOSE_LEN;i++){
            this.composition[i] = data[i];            
        }
        Log(`received composition`, this.composition);
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

    onNotesUpdate(data) {
        for(const note_d of data) {
            let note = new Note(this, note_d.x, note_d.y, note_d.melody).setScale(NOTE_SCALE);
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
            let th_wo_scale = NOTE_THRESHOLD_DIST/NOTE_SCALE;
            note.body.setCircle(th_wo_scale, -th_wo_scale+(note.displayWidth>>1), -th_wo_scale+(note.displayHeight>>1));
            if(this.local_player && this.local_player.group) {
                this.physics.add.overlap(this.local_player.group, note, (pl, n) => {
                    n.changeVol((NOTE_THRESHOLD_DIST-Phaser.Math.Distance.Between(pl.x, pl.y, note.x, note.y))/NOTE_THRESHOLD_DIST);
                }, null, this)
            }
            //console.log(`Create Note at (${note_d.x}, ${note_d.y})`);
        }
    }

    onScoreUpdate(reward) {
        this.score = reward.score;
        this.notes_item.set(reward.note_get, this.notes_item.get(reward.note_get)+1);
        Log(`Score Update to ${reward.score}`);
        Log(`Note Get: [${reward.note_get}]`);
    }
        
    onNotesRemove(data) {
        Log("notes remove:", data);
        for(const note of data) {
            let index;
            if(index = this.notes_collect_tmp.indexOf(note) > -1) {
                this.notes_collect_tmp.splice(index, 1);
            }
            else {
                this.music_notes.remove(this.notes_list.get(note), true, true);
                this.notes_list.delete(note);
            }
        }
    }

    onTempoMeasurePast(beat_d) {
        Log("Beats!");
        //Log(`Prev Keyin: ${this.user_keyin}`);
        let ms_per_frame = beat_d>>1;
        this.beats_frame = 0;
        this.drumbeat.play('0');
        let tolerance = 100;
        this.user_keyin.fill('_');
        this.playNoteCheck(0, ms_per_frame);
        this.phonoPlayCheck(0);
        setTimeout(() => { this.beats_frame += 1 }, (ms_per_frame*8)-tolerance);
        for(let i = 1; i < 8; i += 1) {
            setTimeout(() => { this.playNoteCheck(i, ms_per_frame) }, ms_per_frame*i);
            setTimeout(() => { this.phonoPlayCheck(i) }, ms_per_frame*i);
            setTimeout(() => { this.beats_frame += 1 }, ms_per_frame*(8+i)-tolerance);
        }
        setTimeout(() => { this.collectNoteCheck() }, ms_per_frame*(8+8)-tolerance);
    }

    playNoteCheck(index, ms_per_frame) {
        if(!this.sys.isActive()) return;
        this.beats_frame += 1;
        for(const [id, note] of this.notes_list) {
            if(this.physics.overlap(this.local_player.group, note)) {
                note.requestSoundInInterval(ms_per_frame<<1); //=ms_per_frame*2
                note.playSpecificNote(index);
            }
        }
    }
    
    phonoPlayCheck(index){
        if(!this.sys.isActive()) return;
        let dist = Phaser.Math.Distance.Between(this.local_player.group.x, this.local_player.group.y, this.phonograph.x, this.phonograph.y);
        if( dist < PHONO_RADIUS ){
            this.phonograph.changeVol( Math.pow(10, (PHONO_RADIUS-dist)/PHONO_RADIUS-1 ));
            this.phonograph.playSheet(index);
        }
    }

    collectNoteCheck() {
        if(!this.sys.isActive()) return;
        for(const [id, note] of this.notes_list) {
            if( this.physics.overlap(this.local_player.group, note) &&
                note.melody.every((value, index) => value === this.user_keyin[index]) ) {
                this.collectMusicNote(id);
            }
            else{
                this.tweens.add({
                    targets: note,
                    props: { scaleX: NOTE_SCALE, scaleY: NOTE_SCALE, angle: 0 },
                    yoyo: false,
                    repeat: 0,
                    duration: 400,
                    ease: "Sine",
                });
            }
        }
    }

    collectMusicNote(id){
        //music_note.disableBody(true, true);
        // maybe just call destroy()
        // may also need to destroy the tweens associated with this note
        Log(`Collected Note ID: ${id}`);
        this.notes_collect_tmp.push(id);
        this.game.socket.emit("noteCollect", id);
        this.music_notes.remove(this.notes_list.get(id), true, true);
        this.notes_list.delete(id);
    }
    
    finish(){
        if(this.phonograph.piano) this.phonograph.piano.destroy()
        this.music_notes.destroy(true);
        Note.clearSoundPool(this);
        this.playerPiano.destroy();
        this.drumbeat.destroy();
        this.detachSocket();
    }
}

var Log = log_func(MuziKuro);