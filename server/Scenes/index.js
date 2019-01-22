var Scenes = [
    require('./LobbyScene'),
    require('./ComposeScene'),
    require('./MuziKuro')
]

module.exports = function(game){
    // returns a map of [scene.key => scene]
    var scenes = new Map()
    for(var Scene of Scenes){
        let scene = new Scene(game)
        scenes.set(scene.key, scene)
    }
    return scenes
}