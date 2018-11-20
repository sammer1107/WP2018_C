var express = require("express");
var app = express();
var server = require('http').Server(app);

const port = 11070;

app.use(express.static(__dirname + '/public'));
app.use('/js', express.static(__dirname + '/js'));
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

function getRandomArbitrary(min, max) {
    return Math.random() * (max - min) + min;
}

var Player = function (init_x, init_y, socket_id, role, partner_id){
    this.x = init_x;
    this.y = init_y;
    this.id = socket_id;
    this.role = role;
    this.partner_id = partner_id;    
}

function onRequestPlayer(){
    var role, new_player, lonely_player, connected_socket, init_x, init_y;
    
    init_x = getRandomArbitrary(2525+100, 2525-100);
    init_y = getRandomArbitrary(2525+100, 2525-100);
    
    if(players.num_kuro > players.num_muzi){
        role = "Muzi";
        players.num_muzi += 1;
    }
    else{
        role = "Kuro";
        players.num_kuro += 1;
    }

    lonely_player = players.array.filter( function(elem){
        return elem.partner_id == null && elem.role == (role == "Muzi" ? "Kuro" : "Muzi")
    })[0];
    console.log("lonely_player", lonely_player)
    if(!lonely_player){
        new_player = new Player(init_x, init_y, this.id, role, null);
    }
    else{
        new_player = new Player(init_x, init_y, this.id, role, lonely_player.id);
        lonely_player.partner_id = this.id;
    }
    
    console.log("Created new player: \n", new_player);
    
    // send existing player information to the player connected
    this.emit("createLocalPlayer", {
        x: new_player.x,
        y: new_player.y,
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
    }
    
    players.add(new_player);
}

function onPlayerMove(data){
    if(!players.id[this.id]){
        return;
    }
    players.id[this.id].x = data.x;
    players.id[this.id].y = data.y;
    this.broadcast.volatile.emit("playerMove", {
       id: this.id,
       x : data.x,
       y : data.y,
    });
}

function onDisconnect(){
    var remove_player, lonely_player;
    remove_player = players.array.find( p =>{
       return p.id == this.id 
    });
    lonely_player = players.array.find( p =>{
       return p.partner_id == this.id 
    });
    if(lonely_player){
        lonely_player.partner_id = null;
        this.broadcast.emit("updatePartner", [lonely_player.id, null]);
    }
    
    console.log(`player ${remove_player.id} disconnected.`);
    
    players.removeById(this.id);
    
    this.broadcast.emit("destroyPlayer", {id: this.id});
}

io.sockets.on('connection', function(socket){
    console.log(`socket ID: ${socket.id} connected.`)
    socket.on("requestPlayer", onRequestPlayer);
    socket.on("playerMove", onPlayerMove);
    socket.on("disconnect", onDisconnect);
});
