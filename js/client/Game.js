import io from 'socket.io-client'
import HUD from './HUD.js'
import {log_func} from './utils.js'
import {RemotePlayer, LocalPlayer} from './GameObjects/Player.js'


export default class Game extends Phaser.Game {
    constructor(config){
        super(config);
        this.socket = io.connect();
        this.players = new Map();
        this.local_player = null;
        this.preload_complete = false;
        this.events.once('preloadComplete', this.onPreloadComplete, this);
        this.socket.on('connect', ()=>{Log("socket connected.")})
        var events = ['gameInit', 'newPlayer', 'sceneTransition', 'updatePartner', 'destroyPlayer'];
        for(let e of events){
            this.socket.on(e, this[`on${e[0].toUpperCase()}${e.substring(1)}`].bind(this));
        }
        
        this.hud = new HUD();
    }
    
    onPreloadComplete(){
        Log('preload complete.');
        this.preload_complete = true;
        this.scene.remove('Preload');
    }
    
    onGameInit(data){
        // players
        for(let player of data.players){
            this.players.set(player.id, player);
        }
        // local_player
        this.local_player = data.local_player;
        this.players.set(this.local_player.id, this.local_player);
        this.scene.start(data.scene, data.scene_state);
        this.current_scene = this.scene.getScene(data.scene);
    }
    
    onSceneTransition(data){
        // players
        for(let player of data.players){
            this.players.set(player.id, player);
        }
        // local_player
        this.local_player = this.players.get(this.local_player.id);
        this.current_scene.finish();
        this.current_scene.sys.shutdown();
        this.scene.start(data.scene, data.scene_data);
        this.current_scene = this.scene.getScene(data.scene);
        Log(`scene switched to ${data.scene}`);
    }
    
    onNewPlayer(data){
        this.players.set(data.id, data);
    }
    
    onDestroyPlayer(data){
        this.players.delete(data.id);
    }
    
    onUpdatePartner(data){
        if(data.lonely){
            this.players.get(data.lonely).partner_id = null;
        }else{
            this.players.get(data.Kuro).partner_id = data.Muzi;
            this.players.get(data.Muzi).partner_id = data.Kuro; 
        }
    }
}

var Log = log_func(Game);