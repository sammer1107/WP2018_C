var BaseScene = require('./BaseScene');
var randint = require('../../shared/utils').randint;

const Melody = ['C D E G', 'A E G A', 'G A G F', 'D C E C', 'C C G G', 'F E D C', 'C D E C', 'B G A G'];

function Note(note_id, x, y, melody) {
    this.x = x;
    this.y = y;
    this.id = note_id;
    this.melody = melody;
}

class MuziKuro extends BaseScene{
    constructor(game){
        super(game, "MuziKuro");
        this.notes = {
            list: {},
            num: 0,
            MAX_NOTES: 30,
            create: function() {
                let note, x, y;
                do {
                    x = randint(0, 5000);
                    y = randint(0, 5000);
                } while (typeof this.list[`${x}_${y}`] !== 'undefined');
                note = new Note(`${x}_${y}`, x, y, Melody[randint(0, Melody.length)]);
                this.list[note.id] = note;
                this.num += 1;
                return note;
            },
            removeById: function(id) {
                this.num -= 1;
                delete this.list[id];
            }
        };
    }
    
    start(){
        this.noteLasting = 60/115*1000; // the drumbeat is 115 BPM
            
        this.notesUpdate();
        this.noteUpdater = setInterval(() => {
            this.io.emit("notesUpdate", this.notesUpdate());
        }, 30000);

        this.tempo = setInterval(() => {
            this.io.emit("tempoMeasurePast", this.noteLasting);
        }, this.noteLasting*8); //=noteLasting*4 *2(pause for 4 notes)
    }
    
    stop(){
        clearInterval(this.noteUpdater);
        clearInterval(this.tempo);
    }
    
    getInitData(){
        return {
            notes: Object.values(this.notes.list)
        };
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
}



module.exports = MuziKuro;