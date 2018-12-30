import {MUZI, KURO, NOTE_THRESHOLD_DIST, PHONO_RADIUS} from '../constants.js'
import BaseGameScene from './BaseGameScene.js'
import {LocalPlayer, RemotePlayer} from '../GameObjects/Player.js'
import Group from '../GameObjects/Group.js'
import Note from '../GameObjects/Note.js'
import Phonograph from '../GameObjects/Phonograph.js'
import {log_func} from '../utils.js'
        
// pianoKey consists of ['Key to Press', 'Note to Play', 'Start Time in Audio']
// ertyuio -> Second Row of Keyboard
const PIANO_CONFIG = [['E','C',0], ['R','D',1.5], ['T','E',3], ['Y','F',4.5], ['U','G',6], ['I','A',7.5], ['O','B',9]];

export default class MuziKuro extends BaseGameScene {
    constructor(){
        super({ key: 'MuziKuro'});
        this.notes_list = new Map();
        this.music_notes = null;
        this.on_beats_frame = 0;
        this.user_keyin = new Array(8).fill('_');
    }
    
    create(data){
        var socket = this.game.socket;
        this.listenToSocket(["disconnect", "playerMove", "destroyPlayer", "updatePartner",
                                "notesUpdate", "notesRemove", "tempoMeasurePast"])

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
        this.cameras.main.roundPixels = true;
        this.physics.world.setBounds(0,0,this.layer_floor.width*scale,this.layer_floor.height*scale);
        
        // yeah musics
        this.sound.pauseOnBlur = false;
        this.music_notes = this.physics.add.group();
        this.playerPiano = this.sound.add('piano');
        this.drumbeat = this.sound.add('drumbeat');
        this.drumbeat.addMarker({name:'0', start:0, duration:60/115*1000*8})
        
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
                                    props: { scaleX: 0.8, scaleY: 0.8, angle: (Math.random()-0.5)*40 },
                                    yoyo: true,
                                    repeat: 0,
                                    duration: 80,
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
        

        //set record_player
        this.phonograph = new Phonograph(this, 2500, 2500);
        this.add.existing(this.phonograph);
        this.phonograph.music_sheet = ["A","A","A","A","A","A","A","A"];
        this.physics.world.enable(this.phonograph, 0);
        
        this.phonograph.body.setCircle(PHONO_RADIUS, -PHONO_RADIUS+(this.phonograph.displayWidth>>1), -PHONO_RADIUS+(this.phonograph.displayHeight>>1));
        if(this.local_player && this.local_player.group) {
            this.physics.add.overlap(this.local_player.group, this.phonograph, (pl, ph) => {
                ph.changeVol((PHONOGRAPH_THRESHOLD_DIST-Phaser.Math.Distance.Between(pl.x, pl.y, ph.x, ph.y))/PHONOGRAPH_THRESHOLD_DIST);
            }, null, this)
        }
        
        this.sound.context.resume();
    }
    
    update(time, delta){
        super.update(time, delta);
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
        Log("notes remove:", data);
        this.music_notes.remove(notes_list.get(data), true, true);
        this.notes_list.delete(data);
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
        setTimeout(() => { this.beats_frame += 1 }, (ms_per_frame*8)-tolerance);
        for(let i = 1; i < 8; i += 1) {
            setTimeout(() => { this.playNoteCheck(i, ms_per_frame) }, ms_per_frame*i);
            setTimeout(() => { this.beats_frame += 1 }, ms_per_frame*(8+i)-tolerance);
        }
        setTimeout(() => { this.collectNoteCheck() }, ms_per_frame*(8+8)-tolerance);
    }

    playNoteCheck(index, ms_per_frame) {
        this.beats_frame += 1;
        for(const [id, note] of this.notes_list) {
            if(this.physics.overlap(this.local_player.group, note)) {
                note.requestSoundInInterval(ms_per_frame<<1); //=ms_per_frame*2
                note.playSpecificNote(index);
            }
        }
    }

    collectNoteCheck() {
        if(!this.sys.isActive()) return;
        for(const [id, note] of this.notes_list) {
            if(this.physics.overlap(this.local_player.group, note)) {
                if(note.melody.every((value, index) => value === this.user_keyin[index])) {
                    console.log(`Collected Note ID: ${id}`);
                    this.collectMusicNote(id);
                }
            }
        }
    }

    collectMusicNote(id){
        //music_note.disableBody(true, true);
        // maybe just call destroy()
        // may also need to destroy the tweens associated with this note
        this.game.socket.emit("noteCollected", id);
        this.music_notes.remove(this.notes_list.get(id), true, true);
        this.notes_list.delete(id);
    }

    finish(){
        this.music_notes.destroy(true);
        Note.clearSoundPool(this);
        this.playerPiano.destroy();
        this.drumbeat.destroy();
        this.detachSocket();
    }
}

var Log = log_func(MuziKuro);