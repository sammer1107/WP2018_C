/*
This is the GameManager class definition
GameManager is responsible for holding a global game state(players, current scene)
and make transition between game scenes.
*/

var constants = require('./constants')
var MUZI = constants.MUZI
var utils = require('./utils')
var Players = require('./Players')
var Player = Players.Player

class GameManager{
    constructor(io){
        this.io = io
        this.current_scene
        this.scenes = require('./Scenes')(this)
        this.players = new Players.PlayerList()
        this.groups = [] // the id of each group is the index in the array
        this.log = utils.log
    }
    
    start(){
        this.io.sockets.on('connection', function(socket){
            this.log(`socket ID: ${socket.id} connected.`)
            this.bindSocket(socket, 'login')
            this.bindSocket(socket, 'return')
            this.bindSocket(socket, 'disconnect')
            this.bindSocket(socket, 'playerMove')
            // other events will be handled in the scene level
        }.bind(this))
        this.startScene('Lobby')
    }
    
    onLogin(socket, data){
        var name = utils.escapeHTML(data.name)
        var new_player = new Player(name, socket)
        new_player.setAvailable(true)
        this.players.add(new_player)
        
        if(this.current_scene.onLogin){
            this.current_scene.onLogin(socket, new_player)
        }
        
        socket.emit('gameInit',{
            scene: this.current_scene.key,
            scene_state: this.current_scene.getSceneState(),
            players: this.players.info()
        })

    }

    onReturn(socket){
        let player = this.players.get(socket.id)
        try {
            player.setAvailable(true)
        } catch(e) {
            console.log(e)
            return
        }
        socket.emit('sceneTransition', {
            scene: this.current_scene.key,
            scene_data: this.current_scene.getSceneState(),
            players: this.players.info(),
        })
        
        if(this.current_scene.onReturn) {
            this.current_scene.onReturn(socket, player)
        }


    }
        
    onDisconnect(socket, reason){
        this.log(`socket ID: ${socket.id} disconnected. (${reason})`)
        if(!this.players.has(socket.id)) return // player disconnected before creating a player
        
        var lonely_player = this.players.get(this.players.get(socket.id).partner_id)
        if(lonely_player){
            var index = this.groups.indexOf(lonely_player.group)
            if (index !== -1){
                this.groups.splice(index, 1)
                lonely_player.group.destroy()
            }
            this.log(`${lonely_player.name} is now lonely.`)
            socket.broadcast.emit('updatePartner', {lonely: lonely_player.id})
        }
            
        socket.broadcast.emit('destroyPlayer', {id: socket.id})
        
        if(this.current_scene.onDisconnect){
            this.current_scene.onDisconnect(socket)
        }
        
        this.players.removeById(socket.id)
    }
    
    onPlayerMove(socket, data){
        var player = this.players.get(socket.id)
        if(!player){
            socket.disconnect()
            this.log(`Disconnected ${socket.id} : player doesn't exist.`)
            return
        }
        else if(player.role === MUZI || !player.group){
            this.log(`player ${player?player.name:player} moved but it shouldn't.`)
            player.warning += 1
            if(player.warning > 100){
                socket.disconnect()
                this.log(`Disconnected ${socket.id} (${player.name}) : too much warning.`)
            }
            return
        }
        
        player.group.setPosition(data.pos.x, data.pos.y)
        data.id = socket.id
        socket.broadcast.emit('playerMove', data)

    }
    
    startScene(key){
        this.log(`Starting scene: ${key}`)
        var next = this.scenes.get(key)
        next.init()

        this.io.to('available').emit('sceneTransition', {
            scene: next.key,
            scene_data: next.getInitData(),
            players: this.players.info(),
        })

        next.start()
        this.current_scene = next
    }
    
    bindSocket(socket, event){
        /*
        Wrote this function so I don't have to write .bind(...) so many times.
        Using this restrict the function name of the event handler to be the same
        as the event except an "on" added and the first character is capitalized
        */
        var func = `on${event[0].toUpperCase()}${event.substring(1)}`
        socket.on(event, this[func].bind(this, socket))
    }
}

module.exports = function(io){
    return new GameManager(io)
}