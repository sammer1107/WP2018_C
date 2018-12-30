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
        this.groups = []; // the id of each group is the index in the array
    }
    
    start(){
        this.io.sockets.on('connection', function(socket){
            Log(`socket ID: ${socket.id} connected.`);
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
        
        // remove group info
        var players_info = [];
        for(let p of this.players.values()){
            players_info.push(p.info());
        }
        
        socket.emit("gameInit",{
            scene: this.current_scene.key,
            scene_state: this.current_scene.getInitData(),
            players: players_info,
            local_player: new_player.info(),
        })

        this.players.add(new_player);

    }
        
    onDisconnect(socket, reason){
        Log(`socket ID: ${socket.id} disconnected.\t(${reason})`);
        if(!this.players.has(socket.id)) return; // player disconnected before creating a player
        
        var lonely_player = this.players.get(this.players.get(socket.id).partner_id);
        if(lonely_player){
            var index = this.groups.indexOf(lonely_player.group);
            if (index !== -1){
                this.groups.splice(index, 1);
                lonely_player.group.destroy();
            }
            Log(`${lonely_player.name} is now lonely.`)
            socket.broadcast.emit("updatePartner", {lonely: lonely_player.id});
        }
            
        socket.broadcast.emit("destroyPlayer", {id: socket.id});
        
        if(this.current_scene.onDisconnect){
            this.current_scene.onDisconnect(socket);
        }
        
        this.players.removeById(socket.id);
    }
    
    onPlayerMove(socket, data){
        var player = this.players.get(socket.id);
        if(!player){
            socket.disconnect(true);
            Log(`Disconnected ${socket.id} : player doesn't exist.`)
            return;
        }
        else if(player.role == MUZI || !player.group){
            Log(`player ${player?player.name:player} moved but it shouldn't.`)
            player.warning += 1;
            if(player.warning > 100){
                socket.disconnect(true);
                Log('Disconnected ${socket.id} (${player.name}) : too much warning.');
            }
            return;
        }
        
        player.group.setPosition(data.pos.x, data.pos.y);
        data.id = socket.id;
        socket.broadcast.emit("playerMove", data);

    }
    
    startScene(key){
        Log(`Starting scene: ${key}`);
        var next = this.scenes.get(key);
        next.init();
        var players_info = [];
        for(let p of this.players.values()){
            players_info.push(p.info());
        }
        this.io.emit('sceneTransition', {
            scene: next.key,
            scene_data: next.getStartData(),
            players: players_info,
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