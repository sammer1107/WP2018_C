var Scenes = [
    require('./MuziKuro'),
    require('./LobbyScene'),
]

module.exports = function(game){
    // returns a map of [scene.key => scene]
    scenes = new Map();
    for(var Scene of Scenes){
        let scene = new Scene(game);
        scenes.set(scene.key, scene);
    }
    return scenes;
}