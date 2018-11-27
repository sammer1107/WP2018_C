var KURO_HEIGHT = 499;
var MUZI_HEIGHT = 264;

class Player extends Phaser.Physics.Arcade.Sprite {
    constructor(scene, init_x, init_y, name, id, role, partner_id){
        super(scene, init_x, init_y, role);
        this.scene.physics.world.enable(this);
        this.scene.add.existing(this);
        this.name = name;
        this.role = role;
        this.score = 0;
        this.id = id;
        this.partner_id = partner_id;
        this.in_game = true;
        
        if(role == "Muzi"){
            this.setDepth(1).setDisplayOrigin(0.5*this.width, KURO_HEIGHT + MUZI_HEIGHT);
        }
        else if(role == "Kuro"){
            this.setOrigin(0.5,1);
        }
        this.setScale(0.3).setCollideWorldBounds(true);
        
        // this.scene.physics.add.overlap(this, this.scene.music_notes, collectMusicNote, null, MuziKuro);
        
        if(partner_id == null){
            this.setInGame(false);
        }
        
    }
    
    getPosition(){
        return {x: this.x, y: this.y};
    }

    setInGame(bool){
        this.setActive(bool);
        this.setVisible(bool);
        this.in_game = bool;
    }
    
}


export class RemotePlayer extends Player{
    constructor(scene, init_x, init_y, name, id, role, partner_id){
        super(scene, init_x, init_y, name, id, role, partner_id)
    }    
}

export class LocalPlayer extends Player{
    constructor(scene, init_x, init_y, name, id, role, partner_id){
        super(scene, init_x, init_y, name, id, role, partner_id);
        // for storing pointer movement destination
        this.pointerDest = null;
        // for storing the vector from the position when pointer clicked to the destination
        // so that the dot product can be calculated and stop the movement when the dot product is smaller than 0
        this.pointerVect = null;
    }
}
