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

io.sockets.on('connection', function(socket){
    console.log(`socket ID: ${socket.id} connected.`)
});