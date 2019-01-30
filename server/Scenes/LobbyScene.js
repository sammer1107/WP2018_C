var BaseScene = require('./BaseScene')
var Group = require('../Group.js')
var utils = require('../utils')
var map = utils.loadMap('muzikuro.json')
var REQUIRE_PLAYERS = require('../constants.js').REQUIRE_PLAYERS

// const CHECK_INTERVAL = 10*1000

class LobbyScene extends BaseScene{
    constructor(GameManager){
        super(GameManager, 'Lobby')
        this.log = utils.log
    }
    
    init(){
        for(let group of this.game.groups){
            group.destroy()
        }
        this.game.groups.length = 0
    }
    
    start(){
    }
    
    stop(){
        let players = this.game.players.getAvailable()
        utils.shuffle(players)
        for(let i=0; i<players.length; i+=2){
            this.game.groups.push(new Group(players[i], players[i+1], ...this.getRandomSpawnPoint()))   
        }
        this.log('stopped scene.')
        return
    }
    
    getInitData(){
        return null
    }
    
    getSceneState(){
        return {
            message: this.getPlayerNumberMessage(this.game.players.getAvailable().length)
        }
    }
    
    onLogin(socket, new_player){ // this will be called from GameManager.onLogin
        this.log(`Player joined: name:${new_player.name}`)
        socket.broadcast.emit('newPlayer', new_player.info())
        socket.broadcast.emit('message', this.getPlayerNumberMessage(this.game.players.getAvailable().length))
        this.checkPlayerNumber()
    }
    
    onReturn(socket, player) {
        this.log(`Player returned: name:${player.name}`)
        socket.broadcast.emit('message', this.getPlayerNumberMessage(this.game.players.getAvailable().length))
        this.checkPlayerNumber()
    }

    checkPlayerNumber(){
        var num_player = this.game.players.getAvailable().length
        if(num_player === REQUIRE_PLAYERS){
            // broadcast message
            this.stop()
            this.game.startScene('Compose')
        }
    }

    getPlayerNumberMessage(current_number){
        return `玩家數針 ${current_number} / ${REQUIRE_PLAYERS}`
    }

    onDisconnect(socket){
        var player = this.game.players.get(socket.id)
        if(player.available){
            socket.broadcast.emit('message', 
                this.getPlayerNumberMessage(this.game.players.getAvailable().length-1)
            )
        }
    }

    getRandomSpawnPoint(){
        var radius = 5*map.tilewidth*map.scale
        return [utils.randint(map.centerX-radius, map.centerX+radius), utils.randint(map.centerY-radius, map.centerY+radius)]
    }
}


module.exports = LobbyScene