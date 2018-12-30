var BaseScene = require('./BaseScene');
var randint = require('../utils').randint;

const Melody = ['C D E G', 'A E G A', 'G A G F', 'D C E C', 'C C G G', 'F E D C', 'C D E C', 'B G A G'];
const GAME_DURATION = 5*60*1000;
const CHECK_INTERVAL = 10*1000;

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
        this.timer=0;
        this.check_interval;
    }
    
    init(){
        var init = {};
        for(let key of this.game.players.keys()){
            if(init[key] == true){
                continue;
            }
            let init_x, init_y, player, partner;
            player = this.game.players.get(key);
            partner = this.game.players.get(player.partner_id);
            [init_x, init_y] = this.getRandomSpawnPoint();
            player.setPosition(init_x, init_y);
            partner.setPosition(init_x, init_y);
            init[player.id] = true;
            init[partner.id] = true;
        }
    }
    
    start(){
        this.noteLasting = 60/115*1000; // the drumbeat is 115 BPM
            
        this.io.emit("notesUpdate", this.notesUpdate());
        this.noteUpdater = setInterval(() => {
            this.io.emit("notesUpdate", this.notesUpdate());
        }, 30000);

        this.tempo = setInterval(() => {
            this.io.emit("tempoMeasurePast", this.noteLasting);
        }, this.noteLasting*8); //=noteLasting*4 *2(pause for 4 notes)
        
        this.check_interval = setInterval(()=>{
            this.timer += CHECK_INTERVAL;
            if( this.timer >= GAME_DURATION ){
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
    
    getInitData(){
        return {
            notes: Object.values(this.notes.list)
        };
    }
    
    getStartData(){
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
        return [randint(2525+100, 2525-100), randint(2525+100, 2525-100)];
    }
}

module.exports = MuziKuro;
