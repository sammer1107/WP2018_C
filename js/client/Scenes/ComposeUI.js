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
        
        this.buttonClick = this.sound.add('buttonClick');
        var button_config = {
            cursor: 'pointer',
            pixelPrefect: true
        };
        var button_effect = (button)=>{
            return ()=>{
                this.buttonClick.play();
                // button animation
            }
        }
        // close button
        this.window.setSize(window.width, window.height);
        this.close_btn = this.add.image(CLOSE_POS.x, CLOSE_POS.y, 'ComposeUI.close');
        this.close_btn.setOrigin(0,0).setInteractive(button_config)
            .on('pointerdown', button_effect(this.close_btn))
            .on('pointerup', this.close, this);
        this.window.add(this.close_btn);
        
        // submit button
        this.submit_btn = this.add.image(SUBMIT_POS.x, SUBMIT_POS.y, 'ComposeUI.submit');
        this.submit_btn.setOrigin(0,0).setInteractive(button_config)
            .on('pointerdown', button_effect(this.submit_btn))
            .on('pointerup', this.composeDone, this);
        this.window.add(this.submit_btn);
        // reset button
        this.reset_btn = this.add.image(RESET_POS.x, RESET_POS.y, 'ComposeUI.reset');
        this.reset_btn.setOrigin(0,0).setInteractive(button_config)
            .on('pointerdown', button_effect(this.reset_btn))
            .on('pointerup', this.reset, this);
        this.window.add(this.reset_btn);
        
        // play button
        this.play_btn = this.add.image(PLAY_POS.x, PLAY_POS.y, 'ComposeUI.play');
        this.play_btn.setOrigin(0,0).setInteractive(button_config)
            .on('pointerdown', button_effect(this.play_btn))
            .on('pointerup', this.playCompose, this);
        this.window.add(this.play_btn);
        
        // **calculate note positions** //
        var grid_size;
        grid_size = (NOTE_INPUT_END-NOTE_INPUT_START)/COMPOSE_LEN;
        for(let i=0; i<COMPOSE_LEN; i++){
            this.notes_pos[i] = NOTE_INPUT_START + grid_size*(i+0.5);
        }
        var pitches = ["C","D","E","F","G","A","B"]
        for(let i=0; i<pitches.length; i++){
            this.pitch_pos[pitches[i]] =  SHEET_BOTTOM-i*SHEET_SPACING_HALF;
        }
        
        // initialize all input notes
        for(let i=0; i<COMPOSE_LEN; i++){
            let note = this.add.image(this.notes_pos[i], 0, 'ComposeUI.note').setDisplayOrigin(...NOTE_PIVOT);
            note.pitch = '_';
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
        this.input.keyboard.on(`keydown_SPACE`, () => {
            this.buttonClick.play()
            this.setNote(this.current_note, '_');
        })
        
        // note index
        this.note_index = this.add.image(this.notes_pos[0], NOTE_INDEX_Y, 'ComposeUI.note_index');
        this.window.add(this.note_index);
        this.tweens.add({
            targets: this.note_index,
            props: { y: NOTE_INDEX_Y+8},
            yoyo: true,
            repeat: -1,
            duration: 600,
            ease: x => 1-x*x,
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
        this.buttonClick.destroy();
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
        
        if(pitch == '_'){
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
        this.note_index.setVisible(true);
        this.note_index.setX(this.notes_pos[i]);
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
        var note_len = 1000/(PLAY_BPM/60)/2;
        var count = 0;
        var play = ()=>{
            this.moveCurrentNote(count);
            if(this.input_notes[count].pitch &&
            this.input_notes[count].pitch != '_'){
               this.playerPiano.play(this.input_notes[count].pitch);
            }
            count++;
        }
        play();
        var interval_id = setInterval(()=>{
            play();
            if(count==COMPOSE_LEN){
                this.input.enabled = true;
                clearInterval(interval_id);
                setTimeout(()=>{ this.moveCurrentNote(0) }, note_len);
            }
        }, note_len);
        
    }
}

const CLOSE_POS = { // relative to top right
    x: 1141,
    y: 116,
}

const SUBMIT_POS = { // relative to bottom right
    x: 1055,
    y: 576,
}

const RESET_POS = { // relative to bottom left of submit_btn
    x: 951,
    y: 576,
}

const PLAY_POS = { // relative to bottom left
    x: 185,
    y: 576,
}


const NOTE_INPUT_START = 326;
const NOTE_INPUT_END = 1087;

const COMPOSE_LEN = 8;

const SHEET_BOTTOM = 467;
const SHEET_SPACING_HALF = 21.5;

const NOTE_PIVOT = [28,95];

const NOTE_INDEX_Y = 510;

var Log = log_func(ComposeUI);