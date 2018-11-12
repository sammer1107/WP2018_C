var express = require("express");
var app = express();
var server = require('http').Server(app);

const port = 11070;

app.use(express.static(__dirname + '/public'));
app.use('/js', express.static(__dirname + '/js'));
app.use('/assets', express.static(__dirname + '/assets'));

server.listen(port);
console.log(`listening on port ${port}`);


var io = require('socket.io')(server, {});

var players = {
    array: [],
    id: {},
};

var Player = function (init_x, init_y, socket_id){
    this.x = init_x;
    this.y = init_y;
    this.id = socket_id;
}

function onNewPlayer(data){
    var newPlayer = new Player(data.x, data.y, this.id);
    console.log(`Created new player at ${data.x},${data.y}.`);
    
    var connected_socket = this;
    // send existing player information to the player connected
    players.array.forEach( function(p){
        connected_socket.emit("newPlayer", p);
    });
    
    // send to everyone else except for the new connected player
    this.broadcast.emit("newPlayer", newPlayer); 
    
    players.array.push(newPlayer);
    players.id[newPlayer.id] = newPlayer;
}

function onPlayerMove(data){
    players.id[this.id].x = data.x;
    players.id[this.id].y = data.y;
    this.broadcast.volatile.emit("playerMove", {
       id: this.id,
       x : data.x,
       y : data.y,
    });
}

function onDisconnect(){
    var removePlayer = players.array.find( p =>{
       return p.id == this.id 
    });
    console.log(`player ${removePlayer.id} disconnected.`)
    players.array = players.array.filter( p =>{
        return p.id != this.id
    });
    delete players.id[this.id];
    this.broadcast.emit("destroyPlayer", {id: this.id})
    console.log("remaining players: \n", players.array);
}

io.sockets.on('connection', function(socket){
    console.log(`socket ID: ${socket.id} connected.`)
    socket.on("newPlayer", onNewPlayer);
    socket.on("playerMove", onPlayerMove);
    socket.on("disconnect", onDisconnect);
});
