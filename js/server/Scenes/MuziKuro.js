const BaseScene = require('./BaseScene');
const NotesList = require('../Notes');
const utils = require('../utils');
const constants = require('../constants.js');
const GAME_DURATION = 5*60*1000;
const CHECK_INTERVAL = 10*1000;
const NOTE_SCORE_BASE = 50;
const NOTE_SCORE_BONUS = 10;

const BackupComposition = constants.BackupComposition;
const ThemeSongs = constants.ThemeSongs;

var map = utils.loadMap('map_muzikuro.json');

class MuziKuro extends BaseScene{
    constructor(GameManager){
        super(GameManager, "MuziKuro");
        this.notes;
        this.timer;
        this.check_interval;
        this.theme_song;
        this.collect_waiting = false;
        this.collect_wait_list = new Map();
        this.answered_group = new Array();
    }
    
    init(){
        //this.theme_song = utils.randomSelect(ThemeSongs);
        this.theme_song = ThemeSongs.LittleBee;
        this.notes = new NotesList(this.theme_song, map);
        this.timer = 0;
        this.answered_group.length = 0;
        // exchange composition
        var groups = this.game.groups;
        if(groups.length >= 2){
            utils.shuffle(groups);
            var tmp = groups[0].composition;
            for(let i=0;i<groups.length-1;i++){
                let comp = groups[i].composition;
                if(comp == null || comp.every( note => note == "_" ) ){
                    groups[i].composition = BackupComposition[i%BackupComposition.length].split("");
                }
                else{
                    groups[i].composition = groups[i+1].composition;
                }
            }
            if(tmp == null || tmp.every( note => note == "_" )){
                groups[groups.length-1].composition = BackupComposition[utils.randint(0, BackupComposition.length)];
            }
            else{
                groups[groups.length-1].composition = tmp;
            }
            
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

        this.socketOn('noteCollect', this.onCollectWaiting.bind(this));
        this.socketOn('answerSubmit', this.onClientAnswerSubmit.bind(this));
        
        this.check_interval = setInterval(()=>{
            this.timer += CHECK_INTERVAL;
            if( this.timer >= GAME_DURATION || this.game.players.size < 2){ // check active players
                this.gameFinish();
            }
        }, CHECK_INTERVAL);

        this.collect_waiting = false;
        this.collect_wait_list.clear();
    }
    
    stop(){
        clearInterval(this.noteUpdater);
        clearInterval(this.tempo);
        clearInterval(this.check_interval);
        this.socketOff('noteCollect');
        this.socketOff('answerSubmit');
        return;
    }
    
    getSceneState(){
        return {
            notes: Array.from(this.notes.values())
        };
    }
    
    getInitData(){
        return null;
    }

    onCollectWaiting(socket, note_id){
        if(!this.collect_waiting) {
            this.collect_waiting = true;
            setTimeout(() => { this.collectHandle() }, 250);
        }
        if(this.notes.has(note_id)) {
            let collected_pl;
            if(this.collect_wait_list.has(note_id)) {
                collected_pl = this.collect_wait_list.get(note_id);
                collected_pl.push(socket.id);
            }
            else {
                collected_pl = new Array();
                collected_pl.push(socket.id);
            }
            this.collect_wait_list.set(note_id, collected_pl);
        }
    }

    collectHandle() {
        let collect_notes = new Array();
        for(const [note_id, pl_list] of this.collect_wait_list) {
            Log(`Notes Collected: ${note_id}, by ${pl_list}`);
            collect_notes.push(note_id);
            this.notes.removeById(note_id);
            for(const id of pl_list) {
                let player = this.game.players.get(id);
                let pl_grp = player.group;
                let score = utils.randint(NOTE_SCORE_BASE, NOTE_SCORE_BASE+NOTE_SCORE_BONUS+1);
                pl_grp.score += score;
                let note_get = constants.NOTES_ITEM_NAME[utils.randint(0, constants.NOTES_ITEM_NAME.length)];
                pl_grp.notes_item.set(note_get, pl_grp.notes_item.get(note_get)+1);
                let reward = {
                    score: score,
                    note_get: note_get
                }
                this.io.to(id).emit('scoreUpdate', reward);
                this.io.to(player.partner_id).emit('scoreUpdate', reward);
            }
        }
        this.collect_waiting = false;
        this.collect_wait_list.clear();
        this.io.emit('notesRemove', collect_notes);
    }

    onClientAnswerSubmit(socket, answer) {
        Log(`Submit from: ${socket.id}`);
        let player = this.game.players.get(socket.id);
        let pl_grp = player.group;
        if(!this.answered_group.includes(pl_grp)) {
            let ques = pl_grp.composition;
            Log(`${answer.filter((v, i) => ques[i] == v )}`);
            let match_num = answer.filter((v, i) => ques[i] == v ).length;
            let score = match_num*60;
            if(match_num == answer.length) {
                score *= 2;
            }
            pl_grp.score += score;
            let reward = {
                score: score,
                note_get: null
            };
            socket.emit('scoreUpdate', reward);
            this.io.to(player.partner_id).emit('scoreUpdate', reward);
            this.answered_group.push(pl_grp);
        }
        if(this.answered_group.length == this.game.groups.length) {
            this.gameFinish();
        }
    }
    
    notesUpdate() {
        let new_notes_tmp = [];
        while(this.notes.size < this.notes.MAX_NOTES) {
            let tmp = this.notes.create()
            new_notes_tmp.push(tmp);
            //console.log(`New Note at (${tmp.x}, ${tmp.y})`);
        }
        return new_notes_tmp;
    }

    gameFinish() {
        this.io.emit('gameFinish');
        for(let grp of this.game.groups) {
            for(let pl of grp.players) {
                pl.setAvailable(false);
            }
        }
        this.stop();
        this.game.startScene("Lobby");
    }
    
    getRandomSpawnPoint(){
        var radius = 5*map.tilewidth*map.scale;
        return [utils.randint(map.centerX-radius, map.centerX+radius), utils.randint(map.centerY-radius, map.centerY+radius)];
    }
}

var Log = require('../utils').log_func(MuziKuro);

module.exports = MuziKuro;
