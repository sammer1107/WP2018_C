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

    getAvailable() {
        return Array.from(this.values()).filter(p => p.available);
    }
    
    removeById(del_id){
        this.delete(del_id);
    }
}

exports.Player = class Player{
    constructor(name, socket){
        this.name = name;
        this.socket = socket;
        this.id = socket.id;
        this.x;
        this.y;
        this.partner_id;
        this.role;
        this.group;
        this.available = false;
        this.warning=0;
    }

    setAvailable(available) {
        this.available = available;
        if(available) {
            this.socket.join('available');
        }
        else {
            this.socket.leave('available');
        }
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