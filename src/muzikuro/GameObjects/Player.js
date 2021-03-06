import Phaser from 'phaser'

class Player extends Phaser.Physics.Arcade.Sprite {
    constructor(scene, init_x, init_y, name, id, role, partner_id){
        //console.log(`Created ${new.target.name}: ${name}(${role})`);
        super(scene, init_x, init_y, 'character')
        this.name = name
        this.role = role
        this.id = id
        this.partner_id = partner_id
        this.in_game = false
        this.group = null

        this.setOrigin(0.5,0.95)
        this.setInGame(false)

    }
    
    getPosition(){
        return {x: this.group.x, y: this.group.y}
    }

    setInGame(bool){
        this.setActive(bool)
        this.setVisible(bool)
        this.in_game = bool
    }
    
    destroy(scene_shutdown){
        if(this.group){
            this.group.destroy()
        }
        super.destroy()
    }
}


export class RemotePlayer extends Player{
    constructor(scene, init_x, init_y, name, id, role, partner_id){
        super(scene, init_x, init_y, name, id, role, partner_id)
    }
}

export class LocalPlayer extends Player{
    constructor(scene, init_x, init_y, name, id, role, partner_id){
        super(scene, init_x, init_y, name, id, role, partner_id)
        // for storing pointer movement destination
        this.pointerDest = null
    }
}
