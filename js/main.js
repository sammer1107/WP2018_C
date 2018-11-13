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
    MuziKuro.player.destroy();
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

var RemotePlayer = function (id, init_x, init_y){
    this.id = id;
    
    this.sprite = MuziKuro.physics.add.sprite(init_x, init_y, 'Kuro');
    this.sprite.setScale(0.3);
    this.sprite.setOrigin(0.5,1);
    this.sprite.setCollideWorldBounds(true);
}

function createPlayer(x,y){
    MuziKuro.player = MuziKuro.physics.add.sprite(x,y, 'Kuro')
    MuziKuro.player.pointerDest = null;
    MuziKuro.player.setScale(0.3);
    MuziKuro.player.setOrigin(0.5,1);
    MuziKuro.player.setCollideWorldBounds(true);
    // camera setup
    MuziKuro.cameras.main.startFollow(MuziKuro.player);
    MuziKuro.cameras.main.setLerp(0.1,0.1);
    
    MuziKuro.input.on("pointerdown", function(pointer){
        console.log(pointer.x, pointer.y)
        var dest = this.cameras.main.getWorldPoint(pointer.x, pointer.y);
        this.player.pointerDest = dest
        this.physics.moveToObject(this.player, dest, KURO_SPEED); // This will not stop when reached destination
    }, MuziKuro);
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

window.addEventListener("resize", resize, false);

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
        if(player.pointerDest != null){
            // stop movement when kuro reached pointer movement's destination
            if( Phaser.Math.Distance.Between(player.x, player.y, player.pointerDest.x, player.pointerDest.y) < 3){
                player.body.velocity.set(0,0);
                player.pointerDest = null;
            }
        }
        
        socket.emit("playerMove", {
            x: player.x,
            y: player.y,
        });
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
