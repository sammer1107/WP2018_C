var constants = require('./constants');
var MUZI = constants.MUZI;
var KURO = constants.KURO;

exports.PlayerList = class PlayerList extends Map{
    constructor(){
        super();
    }
    
    add(player){
        this.set(player.id, player);
    }
    
    removeById(del_id){
        this.delete(del_id);
    }
}

exports.Player = class Player{
    constructor(name, socket_id){
        this.name = name;
        this.id = socket_id;
        this.x;
        this.y;
        this.partner_id;
        this.role;
    }
    
    setPosition(x,y){
        this.x = x;
        this.y = y;
    }
}