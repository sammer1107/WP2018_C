const webpack = require('webpack');
const middleware = require('webpack-dev-middleware');
const express = require("express");
const app = express();
const port = process.env.PORT || 11070;

// *** http/https server *** //
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

// *** webpack build *** //
var config;
if(process.env.NODE_ENV == 'production'){
    console.log("Lauching in mode Production...");
    config = require("./webpack.prod.js");
    webpack(config).run( (err, stats)=>{
        if (err || stats.hasErrors()) {
             console.log(err);
             process.exit();
        }
        console.log(stats.toString({
            context: process.cwd(),
            modules: false,
            chunks: false,
            colors: true
        }));
    });
}
else{
    console.log("Lauching in mode Development...");
    config = require("./webpack.dev.js");
    var compiler = webpack(config);
    app.use(middleware(compiler, {
        publicPath: '/client',
        stats:{
            colors: true,
            cached: false
        }
    }));
}

// *** routes *** //
app.use(express.static(__dirname + '/public'));
app.use('/client', express.static(__dirname + '/js/dist'));
app.use('/lib', express.static(__dirname + '/js/client/lib'))
app.use('/assets', express.static(__dirname + '/assets'));
app.get('/', function(req, res){
   res.redirect('/about_us') 
});

server.listen(port, ()=>{
    console.log(`listening on port ${port}`);
});


const io = require('socket.io')(server, {});
const GameManager = require('./js/server/GameManager')(io);
GameManager.start();
