import Phaser from 'phaser'
import {MUZI, KURO, NOTE_RADIUS, PHONO_RADIUS, PIANO_CONFIG} from '../constants.js'
import BaseGameScene from './BaseGameScene.js'
import Note from '../GameObjects/Note.js'
import Phonograph from '../GameObjects/Phonograph.js'
import {getValueByName, log} from '../utils.js'
import Animation from '../lib/Animation.js'
/* global $ */
        
const BPM = 115
const ARROW_RADIUS = 200
var phono_radius, phono_inner_radius

export default class MuziKuro extends BaseGameScene {
    constructor(){
        super({ key: 'MuziKuro'})
        this.log = log
        this.notes_list     // Map id => Note
        this.user_keyin     // Array => string , user input in current tempo loop
        this.score          // number      
        this.notes_collect_tmp  // Array => Note, notes waiting to be collected
        this.first_collect      // bool, whether current note collected is the first one
        this.beats_frame        // number
        this.show_direction     // number, how much time left to show the direction arrow
        this.last_activated_note    // Note, as named
    }
    
    init(){
        super.init()
        this.notes_list = new Map()
        this.user_keyin = new Array(8).fill('_')
        this.score = 0
        this.notes_collect_tmp = new Array()
        this.first_collect = true
        this.show_direction = 0
    }

    create(data){
        var collide_layers, collide_objects, map_scale
        this.socket.listenTo([
            'disconnect', 'playerMove', 'destroyPlayer', 'updatePartner',
            'notesUpdate', 'notesRemove', 'tempoMeasurePast', 'setCompose',
            'scoreUpdate', 'gameFinish', 'playInstrument'
        ])
        
        // start MuzikuroUI
        this.scene.launch('MuzikuroUI')
        this.UI = this.scene.get('MuzikuroUI')
        this.UI.startCountdown(data.duration)

        collide_layers = this.createTileMap('muzikuro')
        collide_objects = this.createMapObjects()
        this.physics.world.setBounds(0, 0, this.map.realWidth, this.map.realHeight)
        
        // sounds
        this.playerPiano = this.sound.add('piano').setVolume(0.8)
        this.remotePiano = this.sound.add('piano').setVolume(0.6)
        this.note_get_sfx = this.sound.add('note_get')
        this.drumbeat = this.sound.add('drumbeat').setVolume(0.8)
        this.drumbeat.addMarker({name:'0', start:0, duration:60/BPM*1000*8})
        // setup piano
        Note.setSoundPool(this, 'piano', PIANO_CONFIG, 5)
        for(const [key, note_name, st] of PIANO_CONFIG) {
            this.playerPiano.addMarker({name: note_name, start: st, duration: 1.5})
            this.remotePiano.addMarker({name: note_name, start: st, duration: 1.5})
            this.input.keyboard.addKey(key)
            this.input.keyboard.on(`keydown_${key}`, this.onPlayerPlayNote.bind(this, note_name))
        }

        this.createSpritePlayers()
        
        this.direction_arrow = this.add.image(0 ,0, 'direction_arrow').setVisible(false).setScale(0.5)
        map_scale = getValueByName('scale', this.map.properties) || 1
        // set phonograph and phonoPiano
        this.phonograph = new Phonograph(this, (this.map.widthInPixels+128)*map_scale/2, (this.map.heightInPixels+128)*map_scale/2)

        if(this.local_player.group){
            this.physics.add.collider(this.local_player.group, this.phonograph)     
            this.physics.add.collider(this.local_player.group, collide_objects)
            this.physics.add.collider(this.local_player.group, collide_layers)            
            if(this.local_player.role === KURO){
                this.phonograph.setInteractive({
                    cursor: 'pointer',
                    pixelPrefect: true
                }).on('pointerdown', this.onPhonoClicked, this)         
            }
        }

        phono_radius = PHONO_RADIUS * this.map.tileWidth * map_scale
        phono_inner_radius = this.phonograph.body.width/2
        if(data.notes) this.onNotesUpdate(data.notes)
    }

    
    update(time, delta){
        super.update(time, delta)

        if(this.direction_arrow.visible){
            let player, radius, angle
            player = this.local_player.group
            angle = Phaser.Math.Angle.BetweenPointsY(player, this.last_activated_note)
            radius = Math.min(
                ARROW_RADIUS,
                Phaser.Math.Distance.Between(player.x, player.y, this.last_activated_note.x, this.last_activated_note.y)/2
            )
            this.direction_arrow.setPosition(
                player.x + Math.sin(angle)*radius,
                player.y + Math.cos(angle)*radius
            ).setRotation(-angle).setDepth(this.direction_arrow.y/this.map.realHeight)
            this.show_direction -= delta
            if(this.show_direction <= 0){
                this.show_direction = 0
                this.tweens.add({
                    targets: this.direction_arrow,
                    props:{
                        alpha: 0
                    },
                    duration: 100,
                    onComplete: ()=>{
                        this.direction_arrow.setVisible(false).setAlpha(1)
                    }
                })
            }
        }
    }
    

    onSetCompose(data){
        this.log('received composition', data)
        this.phonograph.setSheet(data)
        this.phonograph.createSound()
        this.phonograph.startAnim()
        this.phonograph.createParticle()
    }
    
    onUpdatePartner(data){
        // only when player is set lonely will this be called
        // no new groups will be made in this scene
        let lonely_player = this.players.get(data.lonely)
        try{
            this.groups = this.groups.filter( g => g !== lonely_player.group )
            lonely_player.group.destroy()
            lonely_player.partner_id = null
        } catch(e) {
            console.error(e)
        }
    }

    onNotesUpdate(data) {
        for(const note_d of data) {
            let note = new Note(this, note_d.x, note_d.y, note_d.melody)
            this.notes_list.set(`${note_d.x}_${note_d.y}`, note)

            if(this.local_player.role === KURO){
                note.setVisible(false).setupBody(NOTE_RADIUS*2.5)
            }
            else{
                note.setupBody(NOTE_RADIUS)
            }
            //console.log(`Create Note at (${note_d.x}, ${note_d.y})`);
        }
    }
    
    onNotesRemove(data) {
        this.log('notes remove:', data)
        for(const note_id of data) {
            let index = this.notes_collect_tmp.indexOf(note_id)
            if(index !== -1) {
                this.notes_collect_tmp.splice(index, 1)
            }
            else {
                let note_object = this.notes_list.get(note_id)
                note_object.destroy()
                this.notes_list.delete(note_id)
            }
        }
    }

    onScoreUpdate(reward) {
        this.score += reward.score
        this.UI.updateScore(this.score)
        this.log(`Score Update to ${this.score}`)
        if(reward.note_get !== null) {
            this.log(`Note Get: [${reward.note_get}]`)
            this.UI.addItem(reward.note_get)
        }
    }

    onTempoMeasurePast(beat_d) {
        //this.log("Beats!");
        //this.log(`Prev Keyin: ${this.user_keyin}`);
        let ms_per_frame = beat_d>>1
        this.beats_frame = 0
        this.drumbeat.play('0')
        let tolerance = 60*1000/BPM/5
        this.user_keyin.fill('_')
        this.playNoteCheck(0, ms_per_frame)
        this.phonoPlayCheck(0)
        setTimeout(() => { this.beats_frame += 1 }, (ms_per_frame*8)-tolerance)
        for(let i = 1; i < 8; i += 1) {
            setTimeout(() => { this.playNoteCheck(i, ms_per_frame) }, ms_per_frame*i)
            setTimeout(() => { this.phonoPlayCheck(i) }, ms_per_frame*i)
            setTimeout(() => { this.beats_frame += 1 }, ms_per_frame*(8+i)-tolerance)
        }

        if(this.local_player.role === MUZI){
            setTimeout(() => { this.collectNoteCheck() }, ms_per_frame*(8+8)-tolerance)
        }
    }

    onPlayerPlayNote(note_name){
        this.playerPiano.play(note_name)
        this.game.socket.emit('playInstrument', {
            pitch: note_name
        })
        if(this.beats_frame > 8) {
            let frame_index = this.beats_frame - 8 - 1
            this.user_keyin[frame_index] = note_name
            for(let [id, note] of this.notes_list) {
                if(this.physics.overlap(this.local_player.group, note)) {
                    if(note.melody[frame_index] === note_name) {
                        if(this.local_player.role === MUZI){
                            note.activate()
                        }
                        else if(this.local_player.role === KURO){
                            let eighth = 60*1000/BPM/2
                            this.show_direction += this.show_direction > eighth*8 ? eighth:eighth*2 // 1 eighth note
                            this.direction_arrow.setVisible(true)
                            this.last_activated_note = note
                        }
                    }
                }
            }
        }
    }

    onPlayInstrument(data){
        this.remotePiano.play(data.pitch)
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
        if( dist < phono_radius ){
            //this.phonograph.changeVol( Math.pow(10, (phono_radius-dist)/phono_radius-1 ))
            this.phonograph.changeVol(Math.min((phono_radius-dist) / (phono_radius-phono_inner_radius), 1) * 0.8)
            this.phonograph.playSheet(index)
        }
    }

    collectNoteCheck() {
        if(!this.sys.isActive()) return
        for(const [id, note] of this.notes_list) {
            if( note.activated ){
                if(note.melody.every((value, index) => value === this.user_keyin[index]) ) {
                    this.collectMusicNote(id)
                }
                else{
                    note.deactivate()
                }
            }
        }
    }

    collectMusicNote(id){
        this.log(`Collected Note ID: ${id}`)
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
                note.destroy()
                this.notes_list.delete(id)
            }
        })
        if(this.first_collect){
            this.first_collect = false
            let message = this.add.boxMessage('將音符填進唱片機\n來完成題目旋律!').show()
            setTimeout(()=>message.remove(), 5000)
        }
    }
    
    onPhonoClicked(pointer, _loc_x, _loc_y, event_container){
        if(!pointer.leftButtonDown()) return
        
        if(!this.UI) this.UI = this.scene.get('MuzikuroUI')

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

        this.socket.detachAll()
        this.sys.sleep()
    }
    
    finish(){
        Note.clearSoundPool(this)
        try{
            this.playerPiano.destroy()
            this.remotePiano.destroy()
            this.drumbeat.destroy()
        } catch(e) {
            console.warn(e)
        }
        this.UI.finish()
        this.UI.sys.shutdown()
    }
}