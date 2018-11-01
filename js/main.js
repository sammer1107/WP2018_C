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
    scene: {
        preload: preload,
        create: create,
    }
};

var game = new Phaser.Game(config=config)

function preload(){
    this.load.image('muzi', '/assets/muzi.png');
    this.load.tilemapTiledJSON('map', '/assets/map.json');
    this.load.image('google_tile', '/assets/tileset.png')
}

function create(){
    var map = this.make.tilemap({ key: 'map'});
    google_tile = map.addTilesetImage('google_tile');      // name as specified in map.json
    layer = map.createStaticLayer('map_layer_0', google_tile);
}