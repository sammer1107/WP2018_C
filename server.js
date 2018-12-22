var express = require("express");
var app = express();
var server;
if(process.env.npm_config_usehttps) {
   console.log('Using https for server');
   var fs = require("fs");
   var options = {
      key: fs.readFileSync('/home/wp2018/ssl/private.key'),
      cert: fs.readFileSync('/home/wp2018/ssl/certificate.crt')
    };
   server = require("https").createServer(options, app);
}
else {
   console.log('Using http for server');
   server = require("http").Server(app);
}

const port = process.env.PORT || 11070;

app.use(express.static(__dirname + '/public'));
app.use('/client', express.static(__dirname + '/js/dist'));
app.use('/lib', express.static(__dirname + '/js/client/lib'))
app.use('/assets', express.static(__dirname + '/assets'));
app.get('/', function(req, res){
   res.redirect('/about_us') 
});
server.listen(port);
console.log(`listening on port ${port}`);


var io = require('socket.io')(server, {});
var GameManager = require('./js/server/GameManager')(io);
GameManager.start();
