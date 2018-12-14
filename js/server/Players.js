var constants = require('./constants');
var MUZI = constants.MUZI;
var KURO = constants.KURO;

exports.PlayerList = class PlayerList extends Map{
    constructor(){
        super();
        this.num_muzi= 0;
        this.num_kuro= 0;
    }
    
    add(player){
        this.set(player.id, player);
        if(player.role == MUZI){
            this.num_muzi += 1;
        }
        else{
            this.num_kuro += 1;
        }
    }
    
    removeById(del_id){
        if(this.get(del_id).role == MUZI){
            this.num_muzi -= 1;
        }
        else{
            this.num_kuro -= 1;
        }
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