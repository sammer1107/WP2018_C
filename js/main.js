"use strict";
const KURO_SPEED = 300;

var socket = io.connect();
socket.on("connect", onSocketConnected); 

function onSocketConnected(){
    console.log("Socket connected.");
}

var MuziKuro = {
    preload: function() {
        this.load.image('Kuro', '/assets/Kuro.png');
        this.load.tilemapTiledJSON('map', '/assets/map.json');
        this.load.image('google_tile', '/assets/tileset.png');
        this.load.image('music_note','/assets/musical-note.png');
    },
    
    create: function(){
        // create map

        var map = this.make.tilemap({ key: 'map'});
        var google_tile = map.addTilesetImage('google_tile');      // name as specified in map.json
        var layer = map.createStaticLayer('map_layer_0', google_tile);
        layer.setScale(1);

        // create a music note randomly
        // var music_pos_y = Phaser.Math.Between(2500, 2699);
        // var music_pos_x = Phaser.Math.Between(2500, 2699);
        // this.music_note = this.physics.add.sprite(music_pos_x,music_pos_y,'music_note');
        
        // create 11 music notes that Kuro can eat
        this.music_note = this.physics.add.group({
            key: 'music_note',
            repeat: 11,
            setXY: { x: 2525, y: 2525, stepX: 70 }
        });
        
        this.music_note.children.iterate(function (child) {
        
            child.setBounceY(Phaser.Math.FloatBetween(0.4, 0.8));
        
        });

        // add player
        this.kuro = this.physics.add.sprite(2525,2525, 'Kuro');
        this.kuro.pointerDest = null;
        this.kuro.setScale(0.3);
        this.kuro.setOrigin(0.5,1);

        this.physics.add.overlap(this.kuro, this.music_note, collectMusicNote, null, this);

        // camera setup
        this.cameras.main.startFollow(this.kuro);
        this.cameras.main.setDeadzone(100, 100);
        
        // controlls
        /*
        KEY_W = this.input.keyboard.addKey("w");
        KEY_A = this.input.keyboard.addKey("a");
        KEY_S = this.input.keyboard.addKey("s");
        KEY_D = this.input.keyboard.addKey("d");
        */    
        this.input.on("pointerdown", pointerDown, this);

    },
    
    update: function(time, delta){     
        var kuro = this.kuro;
        var music_note=this.music_note;
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
        if(kuro.pointerDest != null){
            // stop movement when kuro reached pointer movement's destination
            if( Phaser.Math.Distance.Between(kuro.x, kuro.y, kuro.pointerDest.x, kuro.pointerDest.y) < 3){
                kuro.body.velocity.set(0,0);
                kuro.pointerDest = null;
            }
        }
    },
    
}

function collectMusicNote (player, music_note)
{
    music_note.disableBody(true, true);
}

var canvas_h = window.innerHeight * window.devicePixelRatio;
var canvas_w = window.innerWidth * window.devicePixelRatio;

var config = {
    type: Phaser.AUTO, // renderer setting
    width: canvas_w,
    height: canvas_h,
    parent: document.getElementById("game-container"),
    physics: {
        default: 'arcade',
    },
    scene: [MuziKuro]
};

var game = new Phaser.Game(config=config)


function pointerDown(pointer){
    var dest = this.cameras.main.getWorldPoint(pointer.x, pointer.y);
    this.kuro.pointerDest = dest
    this.physics.moveToObject(this.kuro, dest, KURO_SPEED); // This will not stop when reached destination
}
