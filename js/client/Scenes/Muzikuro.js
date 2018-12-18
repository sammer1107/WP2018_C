import {MUZI, KURO, NOTE_THRESHOLD_DIST} from '../constants.js'
import BaseGameScene from './BaseGameScene.js'
import {LocalPlayer, RemotePlayer} from '../GameObjects/Player.js'
import Group from '../GameObjects/Group.js'
import Note from '../GameObjects/Note.js'

export default class MuziKuro extends BaseGameScene {
    constructor(){
        super({ key: 'MuziKuro'});
        this.notes_list = new Map();
        this.music_notes = null;
        this.on_beats_user = false;
        this.on_beats_index = 0;
    }
    
    create(data){
        var socket = this.game.socket;
        socket.on("disconnect", this.onSocketDisconnected.bind(this));
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
        
        this.createSpritePlayers();
        
        //this.onNotesUpdate(data.notes)
        
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

        // create hud
        this.game.hud.bind(this);
        this.game.hud.updatePlayerState();
        this.game.hud.resetBoard();
        console.log("muzikuro: ", this)
    }
    
    update(time, delta){
        super.update(time, delta);
    }
    
    collectMusicNote(player, music_note){
        music_note.disableBody(true, true);
        // maybe just call destroy()
        // may also need to destroy the tweens associated with this note
        this.game.socket.emit("noteCollected", `${music_note.x}_${music_note.y}`);
        this.notes_list.delete(`${music_note.x}_${music_note.y}`);
        this.music_notes.remove(music_note, true, true);
    }
    
    onUpdatePartner(data){
        console.log(`updatePartner: `, data);
        
        let lonely_player = this.players.get(data.lonely);
        this.groups = this.groups.filter( g => g !== lonely_player.group );
        lonely_player.group.destroy();
        lonely_player.partner_id = null;

        
        this.game.hud.resetBoard();
        this.game.hud.updatePlayerState();
        
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

    finish(){
        var socket = this.game.socket;
        socket.off("disconnect", this.onSocketDisconnected.bind(this));
        socket.off("newPlayer", this.onNewPlayer.bind(this));
        socket.off("playerMove", this.onPlayerMove.bind(this));
        socket.off("destroyPlayer", this.onDestroyPlayer.bind(this));
        socket.off("updatePartner", this.onUpdatePartner.bind(this));
        socket.off("notesUpdate", this.onNotesUpdate.bind(this));
        socket.off("notesRemove", this.onNotesRemove.bind(this));
        socket.off("tempoMeasurePast", this.onTempoMeasurePast.bind(this));
    }
}
