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
        this.group;
        this.warning=0;
    }
    
    setPosition(x,y){
        this.x = x;
        this.y = y;
    }
    
    info(){
        return {
            name: this.name,
            id: this.id,
            x: this.x,
            y: this.y,
            partner_id: this.partner_id,
            role: this.role,
        }
    }
}