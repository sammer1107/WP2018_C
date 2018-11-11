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

var players = [];

var Player = function (init_x, init_y, socket_id){
    this.x = init_x;
    this.y = init_y;
    this.id = socket_id;
}

function onNewPlayer(data){
    var newPlayer = new Player(data.x, data.y, this.id);
    console.log(`Created new player at ${data.x},${data.y}.`);
    players.push(newPlayer);
}

function onDisconnect(){
    console.log(players)
    var removePlayer = players.find( p =>{
       return p.id == this.id 
    });
    console.log(`player ${removePlayer.id} disconnected.`)
    players = players.filter( p =>{
        return p.id != this.id
    });
    console.log(players)
}

io.sockets.on('connection', function(socket){
    console.log(`socket ID: ${socket.id} connected.`)
    socket.on("new_player", onNewPlayer);
    socket.on("disconnect", onDisconnect)
});
