"use strict";
const KURO_SPEED = 300;

var socket;

function onSocketConnected(){
    console.log("Socket connected.");
    var scene = game.scene.getScene('muziKuro');
    createPlayer(scene, 2525, 2525);
    socket.emit("new_player", {x:2525,y:2525})
}

function onSocketDisconnected(){
    var scene = game.scene.getScene('muziKuro');
    scene.player.destroy();
}

function createPlayer(scene,x,y){
    scene.player = scene.physics.add.sprite(x,y, 'Kuro')
    scene.player.pointerDest = null;
    scene.player.setScale(0.3);
    scene.player.setOrigin(0.5,1);
    scene.player.setCollideWorldBounds(true);
    // camera setup
    scene.cameras.main.startFollow(scene.player);
    scene.cameras.main.setLerp(0.1,0.1);
    
    scene.input.on("pointerdown", function(pointer){
        console.log(pointer.x, pointer.y)
        var dest = this.cameras.main.getWorldPoint(pointer.x, pointer.y);
        this.player.pointerDest = dest
        this.physics.moveToObject(this.player, dest, KURO_SPEED); // This will not stop when reached destination
    }, scene);
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
        socket.on("disconnect", onSocketDisconnected)
        
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
    },
    
}

function collectMusicNote (player, music_note)
{
    music_note.disableBody(true, true);
}

console.log(`window hieght: ${window.innerHeight}`)
console.log(`window width: ${window.innerWidth}`)

var config = {
    type: Phaser.AUTO, // renderer setting
    width: window.innerWidth,
    height: window.innerHeight,
    parent: "game-container",
    render: {roundPixels: false},
    physics: {
        default: 'arcade',
    },
    scene: [MuziKuro, MuziKuro],
};

var game = new Phaser.Game(config=config);

