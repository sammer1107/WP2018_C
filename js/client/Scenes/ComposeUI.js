import {PIANO_CONFIG} from '../constants.js'
import {log_func, randint} from '../utils.js'

const PLAY_BPM = 80;

export default class ComposeUI extends Phaser.Scene {
    constructor(){
        super({key: 'ComposeUI'})
        this.notes_pos = []; // note's x positions corresponding to the 8 notes
        this.pitch_pos = {}; // note's y position corresponding to each pitch
        this.input_notes = [];
        this.current_note = 0;
    }
    
    create(){
        //  ** UI objects** //
        var cam;
        cam = this.cameras.main;
        var window = this.add.image(0, 0, 'ComposeUI.window');
        window.setOrigin(0,0);
        this.window = this.add.container((cam.width-window.width)/2, (cam.height-window.height)/2, window);
        
        var button_config = {
            cursor: 'pointer',
            pixelPrefect: true
        };
        // close button
        this.window.setSize(window.width, window.height);
        this.close_btn = this.add.image(this.window.width-PAD.right+CLOSE_POS.x, PAD.top+CLOSE_POS.y, 'ComposeUI.close');
        this.close_btn.setOrigin(1,0).setInteractive(button_config)
            .on('pointerdown', ()=>Log('click!'), this)
            .on('pointerup', this.close, this);
        this.window.add(this.close_btn);
        
        // go button
        this.go_btn = this.add.image(this.window.width-PAD.right+GO_POS.x, this.window.height-PAD.bottom+GO_POS.y, 'ComposeUI.go');
        this.go_btn.setOrigin(1,1).setInteractive(button_config)
            .on('pointerdown', ()=> Log('click!'), this)
            .on('pointerup', this.composeDone, this);
        this.window.add(this.go_btn);
        // reset button
        this.reset_btn = this.add.image(this.go_btn.x-this.go_btn.width+RESET_POS.x, this.go_btn.y, 'ComposeUI.reset');
        this.reset_btn.setOrigin(1,1).setInteractive(button_config)
            .on('pointerdown', ()=>{Log('click!')})
            .on('pointerup', this.reset, this);
        this.window.add(this.reset_btn);
        
        // play button
        this.play_btn = this.add.image(PAD.left+PLAY_POS.x, this.window.height-PAD.bottom+PLAY_POS.y, 'ComposeUI.play');
        this.play_btn.setOrigin(0,1).setInteractive(button_config)
            .on('pointerdown', ()=>{Log('click!')})
            .on('pointerup', this.playCompose, this);
        this.window.add(this.play_btn);
        
        // **calculate note positions** //
        var zone_start, zone_end, grid_size, rect;
        zone_start = PAD.left + NOTE_INPUT_START;
        zone_end = this.window.width - PAD.right + NOTE_INPUT_END;
        grid_size = (zone_end-zone_start)/COMPOSE_LEN;
        for(let i=0; i<COMPOSE_LEN; i++){
            this.notes_pos[i] = zone_start + grid_size*(i+0.5);
        }
        var pitches = ["C","D","E","F","G","A","B"]
        for(let i=0; i<pitches.length; i++){
            this.pitch_pos[pitches[i]] =  this.window.height-SHEET_BOTTOM-i*SHEET_SPACING_HALF;
        }
        
        // initialize all input notes
        for(let i=0; i<COMPOSE_LEN; i++){
            let note = this.add.image(this.notes_pos[i], 0, 'ComposeUI.note');
            note.pitch = null;
            note.setVisible(false);
            this.input_notes[i] = note;
            this.window.add(note);
        }
        
        // setup piano
        this.playerPiano = this.sound.add('piano');
        for(const [key, note_name, st] of PIANO_CONFIG) {
            this.playerPiano.addMarker({name: note_name, start: st, duration: 1.5});
            this.input.keyboard.on(`keydown_${key}`, () => {
                this.playerPiano.play(note_name);
                this.setNote(this.current_note, note_name);
            })
        }
        
        this.note_indicator = this.add.circle(this.notes_pos[0], this.window.height-SHEET_BOTTOM-10*SHEET_SPACING_HALF, 5, 0x9c7f71);
        this.window.add(this.note_indicator);
        this.tweens.add({
            targets: this.note_indicator,
            props: { fillAlpha: 0.5},
            yoyo: true,
            repeat: -1,
            duration: 600,
            ease: x => x*x,
        })
        
        this.cursor_keys = this.input.keyboard.createCursorKeys();
        //this.events.on('wake', this.onWake, this);
    }
    
    update(){
        var justDown = Phaser.Input.Keyboard.JustDown;
        if(justDown(this.cursor_keys.right)){
            this.moveCurrentNote( (this.current_note+1) % COMPOSE_LEN );
        }
        else if(justDown(this.cursor_keys.left)){
            this.moveCurrentNote( (this.current_note+COMPOSE_LEN-1) % COMPOSE_LEN );
        }
    }
    
    finish(){
        this.playerPiano.destroy();
    }
    
    /*
    onWake(){
        
        // reset state:
        // compositions
        // indicator position
        
        return;
    }*/
    
    setNote(idx, pitch){
        var note = this.input_notes[idx];
        note.pitch = pitch;
        
        if(pitch == null){
            note.setVisible(false);
        }
        else{
            note.setVisible(true);
            note.setY(this.pitch_pos[pitch]);
        }
        // select next note
        this.current_note = (this.current_note+1)%COMPOSE_LEN;
        this.moveCurrentNote(this.current_note)
    }
    
    reset(){
        for(let i=0;i<COMPOSE_LEN;i++){
            this.input_notes[i].pitch = null;
            this.input_notes[i].setVisible(false);
        }
        this.moveCurrentNote(0);
    }

    moveCurrentNote(i){
        this.current_note = i;
        this.note_indicator.setVisible(true);
        this.note_indicator.setX(this.notes_pos[i]);
    }
    
    composeDone(){
        var compose = [];
        for(let note of this.input_notes){
            compose.push(note.pitch || "_");
        }
        this.game.socket.emit('composeSet', compose);
        this.events.emit("composeClose", true);
        this.sys.sleep();
    }
    
    close(pointer){
        if(!pointer.leftButtonDown()) return;
        this.events.emit("composeClose", false);
        this.sys.sleep();
    }
    
    playCompose(){
        this.input.enabled = false;
        var count = 0;
        var play = ()=>{
            this.moveCurrentNote(count);
            if(this.input_notes[count].pitch) this.playerPiano.play(this.input_notes[count].pitch);
        }
        play(); count++;
        var interval_id = setInterval(()=>{
            play();
            if(++count==COMPOSE_LEN){
                console.log(this);
                this.input.enabled = true;
                this.moveCurrentNote(0);
                clearInterval(interval_id);
            }
        }, 1000/(PLAY_BPM/60)/2)
    }
}


const PAD = { // transparency region in the window image
    right: 31,
    top: 25,
    left: 22,
    bottom: 36,
}

const CLOSE_POS = { // relative to top right
    x: -30.3,
    y: 33.2,
}

const GO_POS = { // relative to bottom right
    x: -74.1,
    y: -56.2,
}

const RESET_POS = { // relative to bottom left of go_btn
    x: -9.1,
    y: 0,
}

const PLAY_POS = { // relative to bottom left
    x: 73,
    y: -53,
}


const NOTE_INPUT_START = 137.4;
const NOTE_INPUT_END = -95.1;

const COMPOSE_LEN = 8;

const SHEET_BOTTOM = 159;
const SHEET_SPACING_HALF = 10;

const NOTE_PIVOT = [10,33];

var Log = log_func(ComposeUI);