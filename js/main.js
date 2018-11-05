// "use strict";
var kuro_speed = 5;


var MuziKuro = {
    preload: function() {
        this.load.image('Kuro', '/assets/Kuro.png');
        this.load.tilemapTiledJSON('map', '/assets/map.json');
        this.load.image('google_tile', '/assets/tileset.png');
    },
    
    create: function create(){
        var map = this.make.tilemap({ key: 'map'});
        var google_tile = map.addTilesetImage('google_tile');      // name as specified in map.json
        var layer = map.createStaticLayer('map_layer_0', google_tile);
        layer.setScale(1);
        
        kuro = this.add.sprite(2500,2500, 'Kuro');
        kuro.setScale(0.3);
        
        this.cameras.main.startFollow(kuro);
        this.cameras.main.setDeadzone(100, 100)
        
        key_w = this.input.keyboard.addKey("w");
        key_a = this.input.keyboard.addKey("a");
        key_s = this.input.keyboard.addKey("s");
        key_d = this.input.keyboard.addKey("d");
    },
    
    update: function(){     
        if(key_w.isDown){
            kuro.y -= kuro_speed;
        }
        if(key_a.isDown){
            kuro.x -= kuro_speed;
        }
        if(key_s.isDown){
            kuro.y += kuro_speed;
        }
        if(key_d.isDown){
            kuro.x += kuro_speed;
        }
    }
}

var config = {
    type: Phaser.AUTO, // renderer setting
    width: 800,
    height: 600,
    parent: document.getElementById("game-container"),/*
    physics: {
        default: 'arcade',
        arcade: {
            gravity: {y: 200}
        }
    },*/
    scene: [MuziKuro]
};

var game = new Phaser.Game(config=config)

