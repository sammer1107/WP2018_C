"use strict";
const KURO_SPEED = 300;

var socket;
var players = new Players();

function onSocketConnected(){
    console.log("Socket connected.");
    MuziKuro = game.scene.getScene('muziKuro');
    console.log(MuziKuro)
    createPlayer(2525, 2525);
    socket.emit("newPlayer", {x:2525,y:2525})
}

function onSocketDisconnected(){
    MuziKuro.destroy();
    players.array.forEach(function(elem){
        elem.sprite.destroy() 
    });
    players = new Players();
}

function onNewPlayer(data){
    var new_player = new RemotePlayer(data.id, data.x, data.y);
    players.array.push(new_player);
    players.id[data.id] = new_player;
}

function onPlayerMove(data){
    console.log("move")
    var moved_player = players.id[data.id];
    moved_player.sprite.x = data.x;
    moved_player.sprite.y = data.y;
}

function onDestroyPlayer(data){
    players.id[data.id].sprite.destroy();
    delete players.id[data.id];
    players.array = players.array.filter(function(elem){
        return elem.id != data.id
    });
    console.log("destroyed player:\n", players)
}

// class for player list
function Players(){
    this.array = [];
    this.id = {};
}


function Player(init_x, init_y){
    this.sprite = MuziKuro.physics.add.sprite(init_x, init_y, 'Kuro');
    this.sprite.setScale(0.3);
    this.sprite.setOrigin(0.5,1);
    this.sprite.setCollideWorldBounds(true);
}

Player.prototype.getPosition = function(){
    return {x: this.sprite.x, y: this.sprite.y};
};

function RemotePlayer(id, init_x, init_y){
    Player.call(this, init_x, init_y);
    this.id = id;
}
RemotePlayer.prototype = Object.create(Player.prototype)
RemotePlayer.prototype.contructor = RemotePlayer;

function LocalPlayer(init_x, init_y){
    Player.call(this, init_x, init_y);
    // for storing pointer movement destination
    this.pointerDest = null;
    // for storing the vector from the position when pointer clicked to the destination
    // so that the dot product can be calculated and stop the movement when the dot product is smaller than 0
    this.pointerVect = null; 
}
LocalPlayer.prototype = Object.create(Player.prototype)
LocalPlayer.prototype.contructor = LocalPlayer;

function pointerDown(pointer){
    // console.log(pointer.x, pointer.y)
    var dest = this.cameras.main.getWorldPoint(pointer.x, pointer.y);
    this.player.pointerDest = dest;
    this.player.pointerVect = new Phaser.Math.Vector2(dest).subtract(this.player.getPosition());
    if(this.player.pointerVect.length() > 30){
        this.physics.moveToObject(this.player.sprite, dest, KURO_SPEED); // This will not stop when reached destination
    }
}

function createPlayer(x,y){
    MuziKuro.player = new LocalPlayer(x,y);
    
    // camera setup
    MuziKuro.cameras.main.startFollow(MuziKuro.player.sprite);
    MuziKuro.cameras.main.setLerp(0.15,0.15);
    
    MuziKuro.input.on("pointerdown", pointerDown, MuziKuro);
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
    key: 'muziKuro',
    preload: function() {
        this.load.image('Kuro', '/assets/Kuro.png');
        this.load.tilemapTiledJSON('map', '/assets/map.json');
        this.load.image('google_tile', '/assets/tileset.png');
        this.load.image('music_note','/assets/musical-note.png');
    },
    
    create: function(){
        socket = io.connect();
        socket.on("connect", onSocketConnected);
        socket.on("disconnect", onSocketDisconnected);
        socket.on("newPlayer", onNewPlayer);
        socket.on("playerMove", onPlayerMove);
        socket.on("destroyPlayer", onDestroyPlayer)
        
        // create map

        var map = this.make.tilemap({ key: 'map'});
        var google_tile = map.addTilesetImage('google_tile');      // name as specified in map.json
        var layer = map.createStaticLayer('map_layer_0', google_tile);
        this.physics.world.setBounds(0,0,5000,5000);
        
        // create a music note randomly
        this.music_note = this.physics.add.group();
        for (var i = 0; i < 11; i++)
        {
            this.music_note.create(2525 + Math.random() * 400, 2525 + Math.random() * 400, 'music_note');
        }
        
        // controlls
        /*
        KEY_W = this.input.keyboard.addKey("w");
        KEY_A = this.input.keyboard.addKey("a");
        KEY_S = this.input.keyboard.addKey("s");
        KEY_D = this.input.keyboard.addKey("d");
        */
    },
    
    update: function(time, delta){     
        var player = this.player;
        
        if(player){
            if(this.input.mousePointer.isDown){
                pointerDown.call(this, {x: this.input.mousePointer.x, y: this.input.mousePointer.y});
            }
            
            if(player.pointerDest != null){
                // stop movement when kuro reached pointer movement's destination
                var dest_vec = new Phaser.Math.Vector2(player.pointerDest).subtract(player.getPosition());
                if( player.pointerVect.dot(dest_vec) <= 0){
                    player.sprite.body.velocity.set(0,0);
                    console.log(player.getPosition(), player.pointerDest);
                    player.pointerDest = null;
                }
            }
            
            socket.emit("playerMove", {
                x: player.sprite.x,
                y: player.sprite.y,
            });    
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

function collectMusicNote (player, music_note)
{
    music_note.disableBody(true, true);
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
    scene: [MuziKuro],
};

var game = new Phaser.Game(config=config);
window.addEventListener("resize", resize, false);
