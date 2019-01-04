const BaseScene = require('./BaseScene');
const utils = require('../utils')
const Melody = ['C D E G', 'A E G A', 'G A G F', 'D C E C', 'C C G G', 'F E D C', 'C D E C', 'B G A G'];
const BACKUP_MELODIES = require('../constants.js').BACKUP_MELODIES;
const GAME_DURATION = 30*1000;
const CHECK_INTERVAL = 10*1000;

var map = utils.loadMap('map_muzikuro.json');

function Note(note_id, x, y, melody) {
    this.x = x;
    this.y = y;
    this.id = note_id;
    this.melody = melody;
}

class MuziKuro extends BaseScene{
    constructor(GameManager){
        super(GameManager, "MuziKuro");
        this.notes = {
            list: {},
            num: 0,
            MAX_NOTES: 30,
            create: function() {
                let note, x, y;
                do {
                    x = utils.randint(0, map.realWidth);
                    y = utils.randint(0, map.realHeight);
                } while (typeof this.list[`${x}_${y}`] !== 'undefined');
                note = new Note(`${x}_${y}`, x, y, Melody[utils.randint(0, Melody.length)]);
                this.list[note.id] = note;
                this.num += 1;
                return note;
            },
            removeById: function(id) {
                this.num -= 1;
                delete this.list[id];
            }
        };
        this.timer = 0;
        this.check_interval;
    }
    
    init(){
        this.notes.list = {};
        this.notes.num = 0;
        this.timer = 0;
        // exchange composition
        var groups = this.game.groups;
        if(groups.length >= 2){
            utils.shuffle(groups);
            var tmp = groups[0].composition;
            for(let i=0;i<groups.length-1;i++){
                groups[i].composition = groups[i+1].composition;
                if(groups[i].composition == null){
                    groups[i].composition == BACKUP_MELODIES[i%BACKUP_MELODIES.length].split("");
                }
            }
            groups[groups.length-1].composition = tmp;
        }
        //TODO: give composition to those dont have one
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
