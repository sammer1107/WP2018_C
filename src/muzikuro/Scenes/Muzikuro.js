import Phaser from 'phaser'
import {MUZI, KURO, NOTE_THRESHOLD_DIST, PHONO_RADIUS, NOTES_ITEM_NAME, PIANO_CONFIG} from '../constants.js'
import BaseGameScene from './BaseGameScene.js'
import Note from '../GameObjects/Note.js'
import Phonograph from '../GameObjects/Phonograph.js'
import {log_func, getValueByName} from '../utils.js'
import Animation from '../lib/Animation.js'
/* global $ */
        
const COMPOSE_LEN = 8
const NOTE_SCALE = 0.6
const BPM = 115

export default class MuziKuro extends BaseGameScene {
    constructor(){
        super({ key: 'MuziKuro'})
        this.notes_list = new Map()
        this.music_notes = null
        this.on_beats_frame = 0
        this.user_keyin = new Array(8).fill('_')
        this.score = 0
        this.notes_collect_tmp = new Array()
    }
    
    create(data){
        var collide_layers, collide_objects, map_scale
        this.listenToSocket(['disconnect', 'playerMove', 'destroyPlayer', 'updatePartner',
            'notesUpdate', 'notesRemove', 'tempoMeasurePast', 'setCompose',
            'scoreUpdate', 'gameFinish'])

        collide_layers = this.createTileMap('muzikuro')
        collide_objects = this.createMapObjects()
        this.physics.world.setBounds(0, 0, this.map.realWidth, this.map.realHeight)
        
        // sounds
        this.music_notes = this.physics.add.group()
        this.playerPiano = this.sound.add('piano')
        this.note_get_sfx = this.sound.add('note_get')
        this.drumbeat = this.sound.add('drumbeat')
        this.drumbeat.addMarker({name:'0', start:0, duration:60/BPM*1000*8})
        
        this.createSpritePlayers()
        
        // setup piano
        Note.setSoundPool(this, 'piano', PIANO_CONFIG, 5)
        for(const [key, note_name, st] of PIANO_CONFIG) {
            this.playerPiano.addMarker({name: note_name, start: st, duration: 1.5})
            this.input.keyboard.addKey(key)
            this.input.keyboard.on(`keydown_${key}`, this.onPlayerPlayNote.bind(this, note_name))
        }
        
        // start FillSheetScene
        this.scene.launch('FillSheetScene')
        this.UI = this.scene.get('FillSheetScene')
        
        map_scale = getValueByName('scale', this.map.properties) || 1
        // set phonograph and phonoPiano
        this.phonograph = new Phonograph(this, (this.map.widthInPixels+128)*map_scale/2, (this.map.heightInPixels+128)*map_scale/2)

        if(this.local_player.group){
            this.physics.add.collider(this.local_player.group, this.phonograph)     
            this.physics.add.collider(this.local_player.group, collide_objects)
            this.physics.add.collider(this.local_player.group, collide_layers)            
        }

        if(this.local_player.role === KURO){
            this.phonograph.setInteractive({
                cursor: 'pointer',
                pixelPrefect: true
            }).on('pointerdown', this.onPhonoClicked, this)         
        }
        
        //this.input.topOnly = false;
        if(data.notes) this.onNotesUpdate(data.notes)
    }

    /*
    update(time, delta){
        super.update(time, delta)
    }
    */

    onSetCompose(data){
        Log('received composition', data)
        this.phonograph.setSheet(data)
        this.phonograph.createSound()
        this.phonograph.startAnim()
        this.phonograph.createParticle()
    }
    
    onUpdatePartner(data){
        // only when player is set lonely will this be called
        // no new groups will be made in this scene
        let lonely_player = this.players.get(data.lonely)
        this.groups = this.groups.filter( g => g !== lonely_player.group )
        lonely_player.group.destroy()
        lonely_player.partner_id = null
    }

    onNotesUpdate(data) {
        for(const note_d of data) {
            let note = new Note(this, note_d.x, note_d.y, note_d.melody).setScale(NOTE_SCALE)
            this.notes_list.set(`${note_d.x}_${note_d.y}`, note)
            this.music_notes.add(note, true)
            this.tweens.add({
                targets: note,
                props: {
                    y: note.y + 15
                },
                yoyo: true,
                repeat: -1,
                duration: 1000 + (Math.random()-0.5)*600,
                ease: t => Math.sin(Math.PI*(t-0.5))/2 + 0.5,
            })
            let th_wo_scale = NOTE_THRESHOLD_DIST/NOTE_SCALE
            note.body.setCircle(th_wo_scale, -th_wo_scale+(note.displayWidth>>1), -th_wo_scale+(note.displayHeight>>1))
            if(this.local_player && this.local_player.group) {
                this.physics.add.overlap(this.local_player.group, note, (pl, n) => {
                    n.changeVol((NOTE_THRESHOLD_DIST - Phaser.Math.Distance.Between(pl.x, pl.y, note.x, note.y)) / NOTE_THRESHOLD_DIST)
                }, null, this)
            }
            //console.log(`Create Note at (${note_d.x}, ${note_d.y})`);
        }
    }
    
    onNotesRemove(data) {
        // may also need to destroy the tweens associated with this note
        Log('notes remove:', data)
        for(const note_id of data) {
            let index = this.notes_collect_tmp.indexOf(note_id)
            if(index !== -1) {
                this.notes_collect_tmp.splice(index, 1)
            }
            else {
                let note_object = this.notes_list.get(note_id)
                this.tweens.killTweensOf(note_object)
                this.music_notes.remove(note_object, true, true)
                this.notes_list.delete(note_id)
            }
        }
    }

    onScoreUpdate(reward) {
        this.score += reward.score
        Log(`Score Update to ${this.score}`)
        if(reward.note_get !== null) {
            Log(`Note Get: [${reward.note_get}]`)
            this.UI.addItem(reward.note_get)
        }
    }

    onTempoMeasurePast(beat_d) {
        //Log("Beats!");
        //Log(`Prev Keyin: ${this.user_keyin}`);
        let ms_per_frame = beat_d>>1
        this.beats_frame = 0
        this.drumbeat.play('0')
        let tolerance = 100
        this.user_keyin.fill('_')
        this.playNoteCheck(0, ms_per_frame)
        this.phonoPlayCheck(0)
        setTimeout(() => { this.beats_frame += 1 }, (ms_per_frame*8)-tolerance)
        for(let i = 1; i < 8; i += 1) {
            setTimeout(() => { this.playNoteCheck(i, ms_per_frame) }, ms_per_frame*i)
            setTimeout(() => { this.phonoPlayCheck(i) }, ms_per_frame*i)
            setTimeout(() => { this.beats_frame += 1 }, ms_per_frame*(8+i)-tolerance)
        }
        setTimeout(() => { this.collectNoteCheck() }, ms_per_frame*(8+8)-tolerance)
    }

    onPlayerPlayNote(note_name){
        this.playerPiano.play(note_name)
        if(this.beats_frame > 8) {
            let frame_index = this.beats_frame - 8 - 1
            this.user_keyin[frame_index] = note_name
            for(let [id, note] of this.notes_list) {
                if(this.physics.overlap(this.local_player.group, note)) {
                    if(note.melody[frame_index] === note_name) {
                        this.tweens.add({
                            targets: note,
                            props: { scaleX: note.scaleX*1.05, scaleY: note.scaleX*1.05, angle: (Math.random()-0.5)*40 },
                            yoyo: false,
                            repeat: 0,
                            duration: 200,
                            ease: 'Sine',
                        })
                    }
                }
            }
        }
    }

    playNoteCheck(index, ms_per_frame) {
        if(!this.sys.isActive() || !this.local_player.group) return
        this.beats_frame += 1
        for(const [id, note] of this.notes_list) {
            if(this.physics.overlap(this.local_player.group, note)) {
                if(!this.notes_collect_tmp.includes(id)) {
                    note.requestSoundInInterval(ms_per_frame<<1) //=ms_per_frame*2
                    note.playSpecificNote(index)
                }
            }
        }
    }
    
    phonoPlayCheck(index){
        if(!this.sys.isActive() || !this.local_player.group) return
        let dist = Phaser.Math.Distance.Between(this.local_player.group.x, this.local_player.group.y, this.phonograph.x, this.phonograph.y)
        if( dist < PHONO_RADIUS ){
            this.phonograph.changeVol( Math.pow(10, (PHONO_RADIUS-dist)/PHONO_RADIUS-1 ))
            this.phonograph.playSheet(index)
        }
    }

    collectNoteCheck() {
        if(!this.sys.isActive()) return
        for(const [id, note] of this.notes_list) {
             // FIXTHIS: what if the player leaves the note 
             // right after he answered the melody
             // maybe add an active state to the note when it has been activated
            if( this.physics.overlap(this.local_player.group, note) &&
                note.melody.every((value, index) => value === this.user_keyin[index]) ) {
                this.collectMusicNote(id)
            }
            else{
                this.tweens.add({
                    targets: note,
                    props: { scaleX: NOTE_SCALE, scaleY: NOTE_SCALE, angle: 0 },
                    yoyo: false,
                    repeat: 0,
                    duration: 400,
                    ease: 'Sine',
                })
            }
        }
    }

    collectMusicNote(id){
        Log(`Collected Note ID: ${id}`)
        this.notes_collect_tmp.push(id)
        let note = this.notes_list.get(id)
        this.note_get_sfx.play()
        this.tweens.add({
            targets: note,
            props: {y: note.y-20},
            yoyo: true,
            repeat: 0,
            duration: 200,
            ease: 'CPower3',
            onComplete: () => {
                this.game.socket.emit('noteCollect', id)
                this.music_notes.remove(note, true, true)
                this.notes_list.delete(id)
            }
        })
    }
    
    onPhonoClicked(pointer, _loc_x, _loc_y, event_container){
        if(!pointer.leftButtonDown()) return
        
        if(!this.UI) this.UI = this.scene.get('FillSheetScene')

        this.input.enabled = false
        this.allowMoveToPointer = false
        event_container.stopPropagation()
        this.UI.events.once('windowClose', (submitted)=>{
            this.allowMoveToPointer = true
            this.input.enabled = true
            if(submitted){
                this.input.clear(this.phonograph)
            }
        })
        this.UI.events.emit('windowOn')
    }

    onGameFinish() {
        var light = $('#end-screen #end-light'),
            end_screen = $('#end-screen'),
            light_anim
            
        end_screen.css({
            'visibility': 'visible',
            'opacity': 1
        })
        
        $('#score').text(`${this.score}`)
        
        light_anim = new Animation({
            duration: 600,
            delay: 200,
            update: (t)=>{
                light.css('transform', `scale(${t*2.5})`)
            },
            callback: () => light.addClass('light-rotate')
        })
        light_anim.start()

        $('#end-button-ok').one('click', ()=>{
            this.game.socket.emit('return')
            end_screen.css({
                'opacity': 0,
            }).one('transitionend', ()=>{
                end_screen.css('visibility', 'hidden')                
                light.removeClass('light-rotate').css('transform', 'scale(0)')
                $('#score').text('0')
            })
        })
    }
    
    finish(){
        if(this.phonograph.piano) this.phonograph.piano.destroy()
        this.music_notes.destroy(true)
        Note.clearSoundPool(this)
        this.playerPiano.destroy()
        this.drumbeat.destroy()
        this.detachSocket()
        this.UI.finish()
        this.UI.sys.shutdown()
    }
}

var Log = log_func(MuziKuro)