import Phaser from 'phaser'
import {PIANO_CONFIG} from '../constants.js'


export default class FillSheetScene extends Phaser.Scene{
    constructor(){
        super({ key: 'FillSheetScene'})
        this.space_info   // Array => Object, store the x, y position, center x,y position, note name
        this.bar_items    // Map string => Object, store the x, y position, frame and number of specific pitch on bar
        this.space_notes  // store the note image created on space
    }
    
    init(){
        this.space_info = []
        this.bar_items = new Map() 
        this.space_notes = [] 
    }

    create(){
        //  ** Fill Sheet UI objects ** //
        var cam, game, start_collect
        cam = this.cameras.main
        game = this.game
        var window = this.add.image(0, 0, 'UI.windowFill')
        window.setOrigin(0,0)
        this.window = this.add.container((cam.width-window.width)/2, (cam.height-window.height)/2, window)
        this.window.fit = function(){
            var scale = game.config.width/1920
            scale = (scale>1) ? 1 : scale
            this.setScale(scale)
            this.setPosition((cam.width-window.width*scale)/2, (cam.height-window.height*scale)/2)
            PLACE_NOTE_THRESHHOLD *= scale
        }
        this.window.fit()
        this.window.setVisible(false)
        
        this.buttonClick = this.sound.add('buttonClick')
        var button_config = {
            cursor: 'pointer',
        }
        var button_down = (button)=>{
            return ()=>{
                this.buttonClick.play()
                button.setFrame(1)
            }
        }
        var button_action = (button, action)=>{
            return (pointer)=>{
                button.setFrame(0)
                action.call(this, pointer)
            }
        }
        
        // close button
        this.window.setSize(window.width, window.height)
        this.close_btn = this.add.image(CLOSE_POS.x, CLOSE_POS.y, 'UI.close')
        this.close_btn.setOrigin(0,0).setInteractive(button_config)
        .on('pointerdown', button_down(this.close_btn))
        .on('pointerup', button_action(this.close_btn, this.close))
        this.window.add(this.close_btn)
        
        // submit button
        this.submit_btn = this.add.image(SUBMIT_POS.x, SUBMIT_POS.y, 'UI.submit')
        this.submit_btn.setOrigin(0,0).setInteractive(button_config)
        .on('pointerdown', button_down(this.submit_btn))
        .on('pointerup', button_action(this.submit_btn, this.submit))
        this.window.add(this.submit_btn)
        
        // reset button
        this.reset_btn = this.add.image(RESET_POS.x, RESET_POS.y, 'UI.reset')
        this.reset_btn.setOrigin(0,0).setInteractive(button_config)
        .on('pointerdown', button_down(this.reset_btn))
        .on('pointerup', button_action(this.reset_btn, this.reset))
        this.window.add(this.reset_btn)
        
        //set up space note grid
        for(let i=0, 
            start_pos_x=SHEET_POS.x+NOTE_OFFEST_WIDTH,
            start_pos_y=SHEET_POS.y+NOTE_OFFEST_HEIGHT;
            i<SPACE_NUMBER; i++){
                let note = {
                    x: start_pos_x + SPACE_NOTE_WIDTH/2 + SHEET_SPACING*i -7,
                    y: start_pos_y + SPACE_NOTE_HEIGHT,
                    index: i,
                }
                
                this.space_info[i] = note
            }
            
            this.input.topOnly = false
            this.input.on('drag', this.onDrag, this)
            this.input.on('dragend', this.onDragEnd, this)
            
            // ** Items UI ** //
            //create item bar
            var bar = this.add.image(0, 0, 'UI.item_bar')
            bar.setOrigin(0,0)
            this.bar = this.add.container(cam.width-bar.width, (cam.height-bar.height)/2, bar)
            this.bar.fit = function(){
                var scale = game.config.height/1080
                scale = (scale>1) ? 1 : scale
                this.setScale(scale)
                    .setPosition(cam.width-bar.width*scale, (cam.height-bar.height*scale)/2)
                return this
            }
            this.bar.fit()
            bar.setInteractive().on('pointerdown',
            (_p,_x,_y, event_container) => {
                event_container.stopPropagation()
            })
            
            //set up piano
            this.itemPiano = this.sound.add('piano')
            for(const [key, note_name, st] of PIANO_CONFIG) {
                this.itemPiano.addMarker({name: note_name, start: st, duration: 1.5})
            }
        
        // set up bar items
        var grid_height = (BAR_HEIGHT-2*BAR_PADDING)/PITCHES.length
        for(let i=0; i<PITCHES.length; i++){
            let pos = {
                x: BAR_WIDTH/2,
                y: BAR_PADDING + (i+0.5)*grid_height,
            }
            let new_item = new BarItem(this, pos, i, PITCHES[i], this.itemPiano)
            new_item.addToContainer(this.bar)
            this.bar_items.set(PITCHES[i], new_item)
        }
        
        // set up space notes
        for(let i=0;i<SPACE_NUMBER;i++){
            let note = this.add.image(this.space_info[i].x, this.space_info[i].y, 'UI.item_notes').setVisible(false)
            note.pitch = '_'
            this.window.add(note)
            this.space_notes[i] = note
        }
        
        this.events.addListener('windowOn', this.windowOn, this)
        
        start_collect = this.add.image(cam.width/2, cam.height/2, 'start_collect').setAlpha(0)
        this.tweens.add({
            targets: start_collect,
            props:{
                alpha: 1
            },
            duration: 300
        })
        this.tweens.add({
            targets: start_collect,
            props:{
                alpha: 0
            },
            duration: 300,
            delay: 2000,
            onComplete: ()=> start_collect.destroy()
        })
    }
    
    update(){
        
        var pointer = this.input.activePointer
        for(let button of [this.reset_btn, this.submit_btn, this.close_btn]){
            // reset the button if it was pressed and the pointer leaves the button
            if(button.frame.name === 1 && !button.getBounds().contains(pointer.x, pointer.y)){
                button.setFrame(0)
            }
        }
    }
    
    finish(){
        try{
            if(this.buttonClick) this.buttonClick.destroy()
            if(this.itemPiano) this.itemPiano.destroy()
        } catch(e) {
            console.warn(e)
        }
    }
    
    close(pointer){
        if(!pointer.leftButtonDown()) return
        this.window.setVisible(false)
        this.input.topOnly = false
        this.events.emit('windowClose', false)
    }
    
    reset(){
        for( let i=0; i<SPACE_NUMBER; i++){
            if(this.space_notes[i].pitch !== '_'){
                this.bar_items.get(this.space_notes[i].pitch).increaseItem()
                this.space_notes[i].setVisible(false)
                this.space_notes[i].pitch = '_'
                this.space_notes[i].off('pointerdown')
                this.input.clear(this.space_notes[i])
            }
        }
    }
    
    submit(pointer){
        if(!pointer.leftButtonDown()) return
        let answer = []
        for( let i=0; i<SPACE_NUMBER; i++){
            answer[i] = this.space_notes[i].pitch
        }
        this.window.setVisible(false)
        this.window.setActive(false)
        this.input.topOnly = false
        this.game.socket.emit('answerSubmit', answer)
        this.events.emit('windowClose', true)
    }
    
    windowOn() {
        this.window.setVisible(true)
        this.input.topOnly = true
    }
    
    addItem(pitch){
        this.bar_items.get(pitch).increaseItem()
    }
    
    onDrag(pointer, gameObject/*, dragX, dragY*/){
        if(!this.window.visible) return
        gameObject.x = (pointer.x - this.bar.x)/this.bar.scaleX
        gameObject.y = (pointer.y - this.bar.y)/this.bar.scaleY
    }
    
    onDragEnd(pointer, gameObject){
        pointer = this.window.pointToContainer(pointer)
        for(let space of this.space_info){
            if(Phaser.Math.Distance.Between(pointer.x, pointer.y, space.x, space.y) < PLACE_NOTE_THRESHHOLD
            && this.space_notes[space.index].pitch === '_'){
                this.putNoteToSpace(this.space_notes[space.index], gameObject)
                break
            }
        }
        gameObject.x = this.bar_items.get(gameObject.pitch).pos.x
        gameObject.y = this.bar_items.get(gameObject.pitch).pos.y
    }
    
    putNoteToSpace(spaceNote, item) {
        spaceNote.pitch = item.pitch
        this.setSpaceNoteInteractive(spaceNote)
        spaceNote.setFrame(item.frameNumber)
        spaceNote.setVisible(true)
        this.bar_items.get(item.pitch).decreaseItem()
    }
    
    setSpaceNoteInteractive(note){
        note.setInteractive({
            cursor: 'pointer',
        }).on('pointerdown', (pointer) => {
            if (pointer.leftButtonDown()){
                this.itemPiano.play(note.pitch, { volume: volume })
                // TODO: pick space note up
            } else {
                note.setVisible(false)
                this.bar_items.get(note.pitch).increaseItem()
                note.pitch = '_'
                note.off('pointerdown')
                this.input.clear(note)
            }
        })
    }
    
}

class BarItem {
    constructor(scene, pos, frame, pitch, piano){
        this.scene = scene
        this.number = 0
        this.piano = piano
        this.pos = pos
        this.display_image = scene.add.image(pos.x, pos.y, 'UI.item_notes')
            .setFrame(frame).setScale(ITEM_SCALE).setVisible(false)
        this.drag_image = scene.add.image(pos.x, pos.y, 'UI.item_notes')
            .setFrame(frame).setScale(ITEM_SCALE).setDepth(1).setVisible(false)
        this.drag_image.setInteractive({
            cursor: 'pointer',
        }).on('pointerdown', (pointer) => {
            if (pointer.leftButtonDown()){
                this.piano.play(pitch)
            }
        })
        scene.input.setDraggable(this.drag_image)
        this.drag_image.frameNumber = frame
        this.drag_image.pitch = pitch
        this.text = scene.add.text(
            ITEM_WIDTH*ITEM_SCALE/2 + 3 + pos.x,
            pos.y,
            `x${this.number}`,
            {
                fontSize: 30,
                fontFamily: 'Gen Jyuu Gothic P',
                fontStyle: 'bold',
                color: '#533618',
            }
        ).setOrigin(0,0).setVisible(false)
        
    }
    
    addToContainer(container){
        container.add(this.display_image)
        container.add(this.drag_image)
        container.add(this.text)
    }
    
    increaseItem(){
        if( this.number === 0 ){
            this.text.setVisible(true)
            this.display_image.setVisible(true)
            this.drag_image.setVisible(true)
            this.drag_image.setInteractive({
                cursor: 'pointer',
            })
            this.scene.input.setDraggable(this.drag_image)
        }
        this.number++
        this.text.setText(`x${this.number}`)
    }
    
    decreaseItem(){
        if( this.number === 1 ){
            this.text.setVisible(false)
            this.display_image.setVisible(false)
            this.drag_image.setVisible(false)
            this.scene.input.clear(this.drag_image)
        }
        this.number--
        this.text.setText(`x${this.number}`)
    }
    
}

const SHEET_POS = {
    x: 178,
    y: 209,
}

const CLOSE_POS = { // relative to top right
    x: 1141,
    y: 116,
}

const SUBMIT_POS = { // relative to bottom right
    x: 1053,
    y: 561,
}

const RESET_POS = { // relative to bottom left of go_btn
    x: 949,
    y: 561,
}

const NOTE_OFFEST_WIDTH = 58
const NOTE_OFFEST_HEIGHT = 74

const SPACE_NOTE_WIDTH = 54
const SPACE_NOTE_HEIGHT = 105
var PLACE_NOTE_THRESHHOLD = 50

const PITCHES = ['C','D','E','F','G','A','B']
const SPACE_NUMBER = 8

// const SHEET_WIDTH = 990
const SHEET_SPACING = 115

const BAR_WIDTH = 139
const BAR_HEIGHT = 708
const BAR_PADDING = 35

// bar items
const ITEM_WIDTH = 58
// const ITEM_HEIGHT = 108
const ITEM_SCALE = 0.6

// const ITEM_OFFEST_HEIGHT = 54
// const BAR_SPACING = 89
const volume = 1