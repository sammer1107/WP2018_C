import Phaser from 'phaser'
import io from 'socket.io-client'
import boxMessageFactory from './GameObjects/BoxMessage'
import {log} from './utils.js'


export default class Game extends Phaser.Game {
    constructor(config){
        super(config)
        this.log = log
        this.socket = io.connect()
        this.players = new Map()
        this.local_player = null
        this.preload_complete = false
        this.setup()
    }
    
    onPreloadComplete(){
        this.log('preload complete.')
        this.preload_complete = true
        this.scene.remove('Preload')
    }
    
    setup(){
        this.plugins.registerGameObject('boxMessage', boxMessageFactory)
        this.events.once('preloadComplete', this.onPreloadComplete, this)
        // socket events
        this.socket.on('connect', ()=>{this.log('socket connected.')})
        this.listenToSocket('gameInit')
        // other settings
        this.sound.pauseOnBlur = false
        this.input.mouse.disableContextMenu()        
    }
    
    onGameInit(data){
        // players
        for(let player of data.players){
            this.players.set(player.id, player)
        }
        // local_player
        this.local_player = this.players.get(this.socket.id)
        this.scene.start(data.scene, data.scene_state)
        this.current_scene = this.scene.getScene(data.scene)

        this.listenToSocket('newPlayer')
        this.listenToSocket('sceneTransition')
        this.listenToSocket('updatePartner')
        this.listenToSocket('destroyPlayer')
    }
    
    onSceneTransition(data){
        // players
        var local_player_id = this.socket.id
        this.players.clear()
        for(let player of data.players){
            this.players.set(player.id, player)
        }
        // local_player
        this.local_player = this.players.get(local_player_id)
        
        this.current_scene.finish()
        this.current_scene.sys.shutdown()
        
        this.scene.start(data.scene, data.scene_data)
        this.current_scene = this.scene.getScene(data.scene)
        this.log(`scene switched to ${data.scene}`)
    }
    
    onNewPlayer(data){
        this.players.set(data.id, data)
    }
    
    onDestroyPlayer(data){
        this.players.delete(data.id)
    }
    
    onUpdatePartner(data){
        if(data.lonely){ // this is a lonely update
            let p = this.players.get(data.lonely)
            if(p){
                p.partner_id = null
            }
            else{
                console.warn(`${data.lonely} is set to be lonely but no such player exist.`)
            }
        } else { // this is a grouping update
            let kuro, muzi
            kuro = this.players.get(data.Kuro)
            if(kuro){
                kuro.parnter_id = data.Muzi
            }
            else{
                console.warn(`${data.Kuro} is set to be Kuro but no such player exist.`)
            }
            muzi = this.players.get(data.Muzi)
            if(muzi){
                muzi.parnter_id = data.Kuro
            }
            else{
                console.warn(`${data.Muzi} is set to be Muzi but no such player exist.`)
            }
        }
    }

    listenToSocket(event){
        var func = `on${event[0].toUpperCase()}${event.substring(1)}`
        this.socket.on(event, this[func].bind(this))
    }
}