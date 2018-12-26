/*
This is the GameManager class definition
GameManager is responsible for holding a global game state(players, current scene)
and make transition between game scenes.
*/

var constants = require('./constants');
var MUZI = constants.MUZI;
var KURO = constants.KURO;
var escapeHTML = require('./utils').escapeHTML;
var Players = require('./Players');
var Player = Players.Player;

class GameManager{
    constructor(io){
        this.io = io;
        this.current_scene;
        this.scenes = require('./Scenes')(this);
        this.players = new Players.PlayerList();
    }
    
    start(){
        this.io.sockets.on('connection', function(socket){
            Log(`socket ID: ${socket.id} connected.`);
            //console.log(socket.request.connection.remoteAddress);
            this.bindSocket(socket, "login");
            this.bindSocket(socket, "disconnect");
            this.bindSocket(socket, "playerMove");
            // other events will be handled in the scene level
        }.bind(this));
        this.startScene("Lobby");
    }
    
    onLogin(socket, data){
        var name = escapeHTML(data.name);
        var new_player = new Player(name, socket.id);
        
        if(this.current_scene.onLogin){
            this.current_scene.onLogin(socket, new_player);
        }
        
        socket.emit("gameInit",{
            scene: this.current_scene.key,
            scene_state: this.current_scene.getInitData(),
            players: [...this.players.values()],
            local_player: new_player,
        })

        this.players.add(new_player);

    }
        
    onDisconnect(socket){
        Log(`socket ID: ${socket.id} disconnected.`);
        if(!this.players.has(socket.id)) return; // player disconnected before creating a player
        
        var lonely_player;
        
        for(let player of this.players.values()){
            if(player.partner_id == socket.id){
                lonely_player = player;
                break;
            }
        }
        if(lonely_player){
            lonely_player.partner_id = null;
            Log(`${lonely_player.name} is now lonely.`)
            socket.broadcast.emit("updatePartner", {lonely: lonely_player.id});
        }
            
        socket.broadcast.emit("destroyPlayer", {id: socket.id});
        
        this.players.removeById(socket.id);
    }
    
    onPlayerMove(socket, data){
        var player = this.players.get(socket.id);
            
        if(!player || player.role == MUZI){
            return;
        }
        var partner = this.players.get(player.partner_id);
        
        player.setPosition(data.pos.x, data.pos.y);
        //console.log(`${player.name} moved to `, data.pos);
        if(partner){
            partner.setPosition(data.pos.x, data.pos.y);
        }
        
        data.id = socket.id;
        socket.broadcast.emit("playerMove", data);

    }
    
    startScene(key){
        Log(`Starting scene: ${key}`);
        var next = this.scenes.get(key);
        next.init();
        this.io.emit('sceneTransition', {
            scene: next.key,
            scene_data: next.getStartData(),
            players: [...this.players.values()],
        });
        next.start();
        this.current_scene = next;
    }
    
    bindSocket(socket, event){
        /*
        Wrote this function so I don't have to write .bind(...) so many times.
        Using this restrict the function name of the event handler to be the same
        as the event except an "on" added and the first character is capitalized
        */
        var func = `on${event[0].toUpperCase()}${event.substring(1)}`;
        socket.on(event, this[func].bind(this, socket));
    }
}

var Log = require('./utils').log_func(GameManager)

module.exports = function(io){
    return new GameManager(io);
};