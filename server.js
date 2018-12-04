var express = require("express");
var app = express();
var server = require('http').Server(app);

const port = process.env.PORT || 11070;

app.use(express.static(__dirname + '/public'));
app.use('/client', express.static(__dirname + '/client'));
app.use('/lib', express.static(__dirname + '/client/lib'))
app.use('/assets', express.static(__dirname + '/assets'));
app.get('/', function(req, res){
   res.redirect('/about_us') 
});
server.listen(port);
console.log(`listening on port ${port}`);


var io = require('socket.io')(server, {});

var players = {
    array: [],
    id: {},
    num_muzi: 0,
    num_kuro: 0,
    add: function(player){
        this.array.push(player);
        this.id[player.id] = player;
    },
    removeById: function(del_id){
        this.array = this.array.filter( p =>{
            return p.id != del_id
        });
        if(this.id[del_id].role == "Muzi"){
            this.num_muzi -= 1;
        }
        else{
            this.num_kuro -= 1;
        }
        delete this.id[del_id];  
    },
};

function randint(min, max) {
    return Math.floor(Math.random() * (max - min) + min);
}

var Melody = ['C D E G', 'A E G A', 'G A G F', 'D C E C', 'C C G G', 'F E D C', 'C D E C', 'B G A G'];

var Note = function (note_id, x, y, melody) {
    this.x = x;
    this.y = y;
    this.id = note_id;
    this.melody = melody;
}

var notes = {
    list: {},
    num: 0,
    MAX_NOTES: 30,
    create: function() {
        let note, x, y;
        do {
            x = randint(0, 5000);
            y = randint(0, 5000);
        } while (typeof this.list[`${x}_${y}`] !== 'undefined');
        note = new Note(`${x}_${y}`, x, y, Melody[Math.floor(Math.random()*Melody.length)]);
        this.list[note.id] = note;
        this.num += 1;
        return note;
    },
    removeById: function(id) {
        this.num -= 1;
        delete this.list[id];
    }
};

function Player(init_x, init_y, name, socket_id, role, partner_id){
    this.x = init_x;
    this.y = init_y;
    this.id = socket_id;
    this.role = role;
    this.partner_id = partner_id; 
    this.name = name;
}

function onRequestPlayer(data){
    var role, new_player, lonely_player, connected_socket;
    
    if(players.num_kuro > players.num_muzi){
        role = "Muzi";
        players.num_muzi += 1;
    }
    else{
        role = "Kuro";
        players.num_kuro += 1;
    }

    lonely_player = players.array.find( function(elem){
        return elem.partner_id == null && elem.role == (role == "Muzi" ? "Kuro" : "Muzi")
    });

    if(!lonely_player){
        let init_x = randint(2525+100, 2525-100);
        let init_y = randint(2525+100, 2525-100);
        new_player = new Player(init_x, init_y, data.name, this.id, role, null);
    }
    else{
        new_player = new Player(lonely_player.x, lonely_player.y, data.name, this.id, role, lonely_player.id);
    }
    
    console.log(`Created new player: name:${new_player.name}, role:${new_player.role}, partner:${lonely_player ? lonely_player.name : null}`);
    
    // send existing player information to the player connected
    this.emit("createLocalPlayer", {
        x: new_player.x,
        y: new_player.y,
        name: new_player.name,
        role: new_player.role,
        partner_id: new_player.partner_id
    });
    connected_socket = this;
    players.array.forEach( function(p){
        connected_socket.emit("newPlayer", p);
    });
    
    // send to everyone else except for the new connected player
    this.broadcast.emit("newPlayer", new_player); 
    
    if(lonely_player){
        io.emit("updatePartner", [lonely_player.id, new_player.id]);
        lonely_player.partner_id = this.id;
    }
    
    players.add(new_player);
}

function onPlayerMove(data){
    var player = players.id[this.id];
        
    if(!player){
        return;
    }
    var partner = players.id[player.partner_id];
    
    player.x = data.pos.x;
    player.y = data.pos.y;
    if(partner){
        partner.x = data.pos.x;
        partner.y = data.pos.y;        
    }
    
    data.id = this.id;
    this.broadcast.emit("playerMove", data);

}

function notesUpdate() {
    let new_notes_tmp = [];
    while(notes.num < notes.MAX_NOTES) {
        let tmp = notes.create()
        new_notes_tmp.push(tmp);
        //console.log(`New Note at (${tmp.x}, ${tmp.y})`);
    }
    return new_notes_tmp;
}

function onRequestNotes() {
    this.emit("notesUpdate", Object.values(notes.list));
}

function onNoteCollected(data) {
    notes.removeById(data);
    this.broadcast.emit("notesRemove", data);
}

function onDisconnect(){
    console.log(`socket ID: ${this.id} disconnected.`);
    if(!players.id[this.id]) return; // player disconnected before creating a player
    
    var lonely_player;
    
    lonely_player = players.array.find( p =>{
       return p.partner_id == this.id 
    });
    if(lonely_player){
        lonely_player.partner_id = null;
        this.broadcast.emit("updatePartner", [lonely_player.id, null]);
    }
        
    this.broadcast.emit("destroyPlayer", {id: this.id});
    
    players.removeById(this.id);

}

notesUpdate();
setInterval(function() {
    io.emit("notesUpdate", notesUpdate());
}, 30000);

const noteLasting = 60/115*1000; // the drumbeat is 115 BPM
setInterval(() => {
    io.emit("tempoMeasurePast", noteLasting);
}, noteLasting<<3); //=noteLasting*4 *2(pause for 4 notes)

io.sockets.on('connection', function(socket){
    console.log(`socket ID: ${socket.id} connected.`);
    socket.on("requestPlayer", onRequestPlayer);
    socket.on("requestNotes", onRequestNotes);
    socket.on("playerMove", onPlayerMove);
    socket.on("noteCollected", onNoteCollected);
    socket.on("disconnect", onDisconnect);
});
