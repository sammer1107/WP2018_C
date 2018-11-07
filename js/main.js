// "use strict";
var kuro_speed = 300;


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
        this.music_note = this.physics.add.group();
        for (var i = 0; i < 11; i++)
        {
            this.music_note.create(2525 + Math.random() * 400, 2525 + Math.random() * 400, 'music_note');
        }

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
        console.log(this)
        this.input.on("pointerdown", pointerDown, this);

    },
    
    update: function(time, delta){     
        var kuro = this.kuro;
        var music_note=this.music_note;
        /*
        if(KEY_W.isDown){
            kuro.y -= kuro_speed;
            
        }
        if(KEY_A.isDown){
            kuro.x -= kuro_speed;
            
        }
        if(KEY_S.isDown){
            kuro.y += kuro_speed;
            
        }
        if(KEY_D.isDown){
            kuro.x += kuro_speed;
            
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



var config = {
    type: Phaser.AUTO, // renderer setting
    width: 800,
    height: 600,
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
    this.physics.moveToObject(this.kuro, dest, kuro_speed);
}