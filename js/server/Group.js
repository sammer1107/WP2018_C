var constants = require('./constants.js')
var roles = [constants.MUZI, constants.KURO];

class Group{
    constructor(p1, p2, x, y){
        this.players = [p1, p2];
        var rand = Math.floor(Math.random()*2);

        p1.partner_id = p2.id; 
        p2.partner_id = p1.id; 
        [p1.role, p2.role] = [roles[rand], roles[1-rand]];
        p1.group = this;
        p2.group = this;
        this.setPosition(x, y);
    }
    
    info(){
        var info = {};
        var p = this.players;
        info[p[0].role] = p[0].id;
        info[p[1].role] = p[1].id;
        info.x = p[0].x;
        info.y = p[0].y;
        return info;
    }
    
    setPosition(x, y){
        for(let p of this.players){
            p.x = x;
            p.y = y;
        }
    }
    
    destroy(){
        for(let p of this.players){
            p.x = null;
            p.y = null;
            p.partner_id = null;
            p.role = null;
        }
    }
}

module.exports = Group;