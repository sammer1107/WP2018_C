import {FRONT, LEFT, RIGHT, BACK} from './constants.js'

class Player extends Phaser.Physics.Arcade.Sprite {
    constructor(scene, init_x, init_y, name, id, role, partner_id){
        console.log("create player: ", id)
        super(scene, 0, 0, 'character');
        this.name = name;
        this.role = role;
        this.score = 0;
        this.id = id;
        this.partner_id = null;
        this.facing = FRONT;
        this.walking = false;
        this.in_game = true;
        
        if(role == "Muzi"){
            this.setDepth(1)
        }
        else if(role == "Kuro"){
            this.container = this.scene.add.container(init_x, init_y);
            this.container.setSize(this.width, this.height/3);
            this.scene.physics.world.enable(this.container);
            this.container.body.setOffset(0, -this.container.height/2)
            this.container.add(this);
            this.container.body.setCollideWorldBounds(true)
            // need this so when frames are flipped using scaleX
            this.container.body.transform = new Phaser.GameObjects.Components.TransformMatrix(1,0,0,1,0,0); 
        }

        this.setOrigin(0.5,0.95).setFrame(`front_${role}`);
        
        // this.scene.physics.add.overlap(this, this.scene.music_notes, collectMusicNote, null, MuziKuro);
        this.setupPartner(partner_id);
        if(partner_id == null){
            this.setInGame(false);
        }

    }
    
    getPosition(){
        return {x: this.container.x, y: this.container.y};
    }

    setInGame(bool){
        // this.setActive(bool);
        // this.setVisible(bool);
        // this.body.setEnable(bool)
        this.in_game = bool;
    }
    
    setupPartner(id){
        this.partner_id = id;
        var partner = this.scene.players.get(id);
        if(!partner) return;
        
        if(this.role == "Muzi"){
            partner.container.add(this);
            this.container = partner.container;
        }
        else{
            this.container.add(partner);
            partner.container = this.container;
        }
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
