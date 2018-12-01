import {FRONT, LEFT, RIGHT, BACK} from './constants.js'

class Player extends Phaser.Physics.Arcade.Sprite {
    constructor(scene, init_x, init_y, name, id, role, partner_id){
        super(scene, init_x, init_y, 'character');
        this.scene.add.existing(this);
        this.name = name;
        this.role = role;
        this.score = 0;
        this.id = id;
        this.partner_id = partner_id;
        this.facing = FRONT;
        this.walking = false;
        this.in_game = true;
        
        
        if(role == "Muzi"){
            this.setDepth(1)
        }
        else if(role == "Kuro"){
            this.scene.physics.world.enable(this);
            this.setCollideWorldBounds(true)
            // need this so when frames are flipped using scaleX, the physics body stays in place, not sure why
            this.body.transform = new Phaser.GameObjects.Components.TransformMatrix(1,0,0,1,0,0); 
        }

        this.setOrigin(0.5,0.95).setFrame(`front_${role}`);
        
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
        this.body.setEnable(bool)
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
