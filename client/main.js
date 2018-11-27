"use strict";
import {LocalPlayer, RemotePlayer} from './player.js'

const KURO_SPEED = 300;
var KURO_HEIGHT, MUZI_HEIGHT;

var socket;
var local_player;
var players = new Players();
var notes_list = {};

$("#player-name input").focus();
$("#join-game").click( function(){
    var name = $("#player-name input").val().substring(0,20);
    if(name){
        $("#login").animate({bottom: "100vh"}, { complete: ()=> $("#login").css("display", "none") });
        socket.emit("requestPlayer", { name: name });
    }
});

// class for player list
function Players(){
    this.array = [];
    this.id = {}; 
    this.add = function(player){
        this.array.push(player);
        this.id[player.id] = player;
    };
    this.removeById = function(del_id){
        delete this.id[del_id];
        this.array = players.array.filter(function(elem){
            return elem.id != del_id
        });  
    };
}

function onSocketConnected(){
    console.log("Socket connected.");
    socket.emit("requestNotes");
    MuziKuro.physics.resume()
}

function onSocketDisconnected(){
    MuziKuro.physics.pause();
    local_player.destroy();
    players.array.forEach(function(elem){
        elem.destroy() 
    });
    players = new Players();

}

function onCreateLocalPlayer(data){
    local_player = new LocalPlayer(MuziKuro, data.x, data.y, data.name, socket.id, data.role, data.partner_id);
    
    // camera setup
    MuziKuro.cameras.main.startFollow(local_player);
    MuziKuro.cameras.main.setLerp(0.15,0.15);
    // MuziKuro.input.on("pointerdown", pointerDown, MuziKuro);
}

function onNewPlayer(data){
    var new_player = new RemotePlayer(MuziKuro, data.x, data.y, data.name, data.id, data.role, data.partner_id);
    players.add(new_player);
}

function onUpdatePartner(data){
    var updated = players.id[data[0]] || (local_player.id == data[0] ? local_player : null);
    
    if(!updated) return;
    
    updated.partner_id = data[1];
    if(data[1] == null){ // partner is null in the case of player disconnected
        updated.setInGame(false);
    }
    else{
        updated.setInGame(true);
    }
    
}

function onNotesUpdate(data) {
    for(const note of data) {
        notes_list[`${note.x}${note.y}`] = MuziKuro.music_notes.create(note.x, note.y, 'music_note');
        //console.log(`Create Note at (${note.x}, ${note.y})`);
    }
}

function onNotesRemove(data) {
    console.log(data);
    MuziKuro.music_notes.remove(notes_list[data], true, true);
}

function onPlayerMove(data){
    var moved = players.id[data.id];
    moved.x = data.x;
    moved.y = data.y;
    
    if(players.id[moved.partner_id]){
        players.id[moved.partner_id].setPosition(data.x, data.y)        
    }
    else if(local_player.id == moved.partner_id){
        local_player.setPosition(data.x, data.y);
    }
}

function onDestroyPlayer(data){
    if(players.id[data.id]){
        players.id[data.id].destroy();        
        players.removeById(data.id)
    }
}


function pointerDown(pointer){
    // console.log(pointer.x, pointer.y)
    var dest = this.cameras.main.getWorldPoint(pointer.x, pointer.y);
    local_player.pointerDest = dest;
    local_player.pointerVect = new Phaser.Math.Vector2(dest).subtract(local_player.getPosition());
    if(local_player.pointerVect.length() > 10){
        this.physics.moveToObject(local_player, dest, KURO_SPEED); // This will not stop when reached destination
    }
}


function resize() {
    var canvas = document.querySelector("canvas");
    var windowRatio = window.innerWidth / window.innerHeight;
    var gameRatio = game.config.width / game.config.height;

    
    if(windowRatio < gameRatio){
        canvas.style.width = window.innerWidth + "px";
        canvas.style.height = (window.innerWidth / gameRatio) + "px";
    }
    else {
        canvas.style.width = (window.innerHeight * gameRatio) + "px";
        canvas.style.height = window.innerHeight + "px";
    }
    
}


var MuziKuro = {
    key: 'MuziKuro',
    preload: function() {
        this.load.image('Kuro', '/assets/Kuro.png');
        this.load.image('Muzi', '/assets/Muzi.png');
        this.load.tilemapTiledJSON('map', '/assets/map.json');
        this.load.image('google_tile', '/assets/tileset.png');
        this.load.image('music_note','/assets/musical-note.png');
    },
    
    create: function(){
        socket = io.connect();
        socket.on("connect", onSocketConnected);
        socket.on("disconnect", onSocketDisconnected);
        socket.on("createLocalPlayer", onCreateLocalPlayer);
        socket.on("newPlayer", onNewPlayer);
        socket.on("playerMove", onPlayerMove);
        socket.on("destroyPlayer", onDestroyPlayer);
        socket.on("updatePartner", onUpdatePartner);
        socket.on("notesUpdate", onNotesUpdate);
        socket.on("notesRemove", onNotesRemove);
        
        KURO_HEIGHT = this.textures.get('Kuro').frames.__BASE.height;
        MUZI_HEIGHT = this.textures.get('Muzi').frames.__BASE.height;
        // create map
        
        var map = this.make.tilemap({ key: 'map'});
        var google_tile = map.addTilesetImage('google_tile');      // name as specified in map.json
        var layer = map.createStaticLayer('map_layer_0', google_tile);
        this.physics.world.setBounds(0,0,5000,5000);
        
        // create a music note randomly
        this.music_notes = this.physics.add.group();
        /*for (var i = 0; i < 11; i++)
        {
            this.music_note.create(2525 + Math.random() * 400, 2525 + Math.random() * 400, 'music_note');
        }*/
        
        // controlls
        /*
        var KEY_W = this.input.keyboard.addKey("w");
        var KEY_A = this.input.keyboard.addKey("a");
        var KEY_S = this.input.keyboard.addKey("s");
        var KEY_D = this.input.keyboard.addKey("d");
        console.log(this.input.eventNames())*/
        MuziKuro = this;
    },
    
    update: function(time, delta){     
        
        if(local_player && local_player.role == 'Kuro' && local_player.in_game ){
            
            if(this.input.mousePointer.isDown){
                pointerDown.call(this, {x: this.input.mousePointer.x, y: this.input.mousePointer.y});
            }
            
            if(local_player.pointerDest != null){
                // stop movement when kuro reached pointer movement's destination
                var dest_vec = new Phaser.Math.Vector2(local_player.pointerDest).subtract(local_player.getPosition());
                if( local_player.pointerVect.dot(dest_vec) <= 0){
                    local_player.body.velocity.set(0,0);
                    local_player.pointerDest = null;
                }
            }
            
            socket.emit("playerMove", local_player.getPosition());
            
            players.id[local_player.partner_id].setPosition(local_player.x, local_player.y);
        }
        
        /*
        if(KEY_W.isDown){
            kuro.y -= KURO_SPEED;
            
        }
        if(KEY_A.isDown){
            kuro.x -= KURO_SPEED;
            
        }
        if(KEY_S.isDown){
            kuro.y += KURO_SPEED;
            
        }
        if(KEY_D.isDown){
            kuro.x += KURO_SPEED;
            
        }
        */
    },
    
}

class HUD extends Phaser.Scene {
  
  constructor()
  {
    super({ key: 'HUD', active: true});
    this.score = 0; // ??
  }
  create(data)
  { 
    //scoreBar
    var scoreBox = this.add.graphics();
    var scoreBar = this.add.graphics();
    scoreBox.fillStyle(0x222222, 0.8);
    scoreBox.fillRoundedRect(10+110,
                             window.innerHeight/80,
                             window.innerWidth/4,
                             window.innerHeight/20,
                             window.innerHeight/40);
    scoreBar.fillStyle(0xffff37, 1);
    scoreBar.fillRoundedRect(10+10+110,
                             window.innerHeight/80+10,
                             window.innerWidth/4-20,
                             window.innerHeight/20-20,
                             (window.innerHeight/20-20)/2);
    var scoreText = this.add.text(10, 10, 'Score:',{ fontSize: window.innerHeight/25, fill: '0x000'});
    var playerText = this.add.text(10, 10+scoreText.y+scoreText.height, 'player:', {fontSize: window.innerHeight/25, fill: '0x000'});
    var partnerText = this.add.text(10, 10+playerText.y+playerText.height, 'partner:', {fontSize: window.innerHeight/25, fill: '0x000'});

    //
  }
  update(time, delta)
  {
  }
}

function collectMusicNote (player, music_note)
{
    music_note.disableBody(true, true);
    socket.emit("noteCollected", `${music_note.x}${music_note.y}`);
    MuziKuro.music_notes.remove(music_note, true, true);
}

var config = {
    type: Phaser.AUTO, // renderer setting
    width: window.innerWidth,
    height: window.innerHeight,
    parent: "game-container",
    render: {roundPixels: false},
    physics: {
        default: 'arcade',
    },
    scene: [MuziKuro, HUD],
};

var game = new Phaser.Game(config=config);
window.addEventListener("resize", resize, false);
