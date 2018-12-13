/*
This is the GameManager class definition
GameManager is responsible for holding a global game state(players, current scene)
and make transition between game scenes.
*/
var constants = require('./constants');
var MUZI = constants.MUZI;
var KURO = constants.KURO;
var randint = require('../shared/utils').randint;
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
            console.log(`socket ID: ${socket.id} connected.`);
            //console.log(socket.request.connection.remoteAddress);
            this.bindSocket(socket, "login");
            this.bindSocket(socket, "disconnect");
            this.bindSocket(socket, "playerMove");
            // other events will be handled in the scene level
        }.bind(this));
        this.startScene("MuziKuro");
    }
    
    onLogin(socket, data){
        var new_player, lonely_player, init_x, init_y, partner_config={};
        new_player = new Player(data.name, socket.id);

        // pair player
        for(let player of this.players.values()){
            if(player.partner_id == null){
                lonely_player = player;
                // decide player role
                let roles = [MUZI, KURO];
                let rand = randint(0,1);
                lonely_player.role = roles[rand];
                new_player.role = roles[1-rand];
                new_player.partner_id = lonely_player.id;
                lonely_player.partner_id = new_player.id;
                partner_config[lonely_player.role] = lonely_player.id;
                partner_config[new_player.role] = new_player.id;
                break;
            }
        }
        
        init_x = randint(2525+100, 2525-100);
        init_y = randint(2525+100, 2525-100);
        new_player.setPosition(init_x, init_y);
        socket.broadcast.emit("newPlayer", new_player);
        if(lonely_player){
            lonely_player.setPosition(init_x, init_y);
            socket.broadcast.emit("updatePartner", partner_config);
        }
        
        console.log(`Created new player: name:${new_player.name}, role:${new_player.role}, partner:${lonely_player ? lonely_player.name : null}`);

        
        socket.emit("gameInit",{
            scene: this.current_scene.key,
            scene_state: this.current_scene.getInitData(),
            players: [...this.players.values()],
            local_player: new_player,
        })

        this.players.add(new_player);
    }
        
    onDisconnect(socket){
        console.log(`socket ID: ${socket.id} disconnected.`);
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
            console.log(`${lonely_player.name} is now lonely.`)
            socket.broadcast.emit("updatePartner", {lonely: lonely_player.id});
        }
            
        socket.broadcast.emit("destroyPlayer", {id: socket.id});
        
        this.players.removeById(socket.id);
    }
    
    onPlayerMove(socket, data){
        var player = this.players.get(socket.id);
            
        if(!player){
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
        if(this.current_scene){
            this.current_scene.stop();
        }
        var next = this.scenes.get(key);
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

module.exports = function(io){
    return new GameManager(io);
};