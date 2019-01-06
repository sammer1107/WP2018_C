const BaseScene = require('./BaseScene');
const utils = require('../utils')
const constants = require('../constants.js')
const GAME_DURATION = 5*60*1000;
const CHECK_INTERVAL = 10*1000;

const BackupComposition = constants.BackupComposition;
const ThemeSongs = constants.ThemeSongs;

var map = utils.loadMap('map_muzikuro.json');

function Note(note_id, x, y, melody) {
    this.x = x;
    this.y = y;
    this.id = note_id;
    this.melody = melody;
}

function NotesList(theme){
    this.list = {};
    this.num = 0;
    this.MAX_NOTES = 30;
    this.create = function(){
        let note, x, y;
        do {
            x = utils.randint(0, map.realWidth);
            y = utils.randint(0, map.realHeight);
        } while (typeof this.list[`${x}_${y}`] !== 'undefined');
        note = new Note(`${x}_${y}`, x, y, utils.randomSelect(theme));
        this.list[note.id] = note;
        this.num += 1;
        return note;
    };
    this.removeById = function(id) {
        this.num -= 1;
        delete this.list[id];
    }
}

class MuziKuro extends BaseScene{
    constructor(GameManager){
        super(GameManager, "MuziKuro");
        this.notes;
        this.timer;
        this.check_interval;
        this.theme_song;
    }
    
    init(){
        //this.theme_song = utils.randomSelect(ThemeSongs);
        this.theme_song = ThemeSongs.LittleBee;
        this.notes = new NotesList(this.theme_song);
        this.timer = 0;
        // exchange composition
        var groups = this.game.groups;
        if(groups.length >= 2){
            utils.shuffle(groups);
            var tmp = groups[0].composition;
            for(let i=0;i<groups.length-1;i++){
                groups[i].composition = groups[i+1].composition;
                if(groups[i].composition == null){
                    groups[i].composition == BackupComposition[i%BackupComposition.length].split("");
                }
            }
            groups[groups.length-1].composition = tmp;
        }
        
    }
    
    start(){
        this.noteLasting = 60/115*1000; // the drumbeat is 115 BPM
        
        for(let p of this.game.players.values()){
            if(p.group) p.socket.emit('setCompose', p.group.composition);
        }
        this.io.emit("notesUpdate", this.notesUpdate());
        this.noteUpdater = setInterval(() => {
            this.io.emit("notesUpdate", this.notesUpdate());
        }, 30000);

        this.tempo = setInterval(() => {
            this.io.emit("tempoMeasurePast", this.noteLasting);
        }, this.noteLasting*8); //=noteLasting*4 *2(pause for 4 notes)
        
        this.check_interval = setInterval(()=>{
            this.timer += CHECK_INTERVAL;
            if( this.timer >= GAME_DURATION || this.game.players.size < 2){
                this.stop();
                this.game.startScene("Lobby");
            }
        }, CHECK_INTERVAL);
    }
    
    stop(){
        clearInterval(this.noteUpdater);
        clearInterval(this.tempo);
        clearInterval(this.check_interval);
        return;
    }
    
    getSceneState(){
        return {
            notes: Object.values(this.notes.list)
        };
    }
    
    getInitData(){
        return null;
    }
    
    notesUpdate() {
        let new_notes_tmp = [];
        while(this.notes.num < this.notes.MAX_NOTES) {
            let tmp = this.notes.create()
            new_notes_tmp.push(tmp);
            //console.log(`New Note at (${tmp.x}, ${tmp.y})`);
        }
        return new_notes_tmp;
    }
    
    getRandomSpawnPoint(){
        var radius = 5*map.tilewidth*map.scale;
        return [utils.randint(map.centerX-radius, map.centerX+radius), utils.randint(map.centerY-radius, map.centerY+radius)];
    }
}

module.exports = MuziKuro;
