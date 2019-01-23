import Phaser from 'phaser'
import {FRONT, BACK, RIGHT, LEFT} from '../constants.js'

export default class Group extends Phaser.GameObjects.Container{
    constructor(scene, muzi, kuro, x, y){
        if(x === undefined || y === undefined){
            super(scene, kuro.x, kuro.y)            
        }
        else{
            super(scene, x, y)
        }
        this.facing = FRONT
        this.walking = false
        
        this.muzi = muzi
        this.kuro = kuro
        this.add(kuro)
        this.add(muzi)
        this.iterate(child => {
            child.setPosition(0,0)
            child.setInGame(true)
            child.group = this 
            child.setFrame(`front_${child.role}`)
        })
        
        this.setSize(90,55)
        this.scene.add.existing(this)
        this.scene.physics.world.enable(this)
        this.body.setSize(45,45).setOffset(22.5,-15)
        this.body.setCollideWorldBounds(true)
        /*  need this so when frames are flipped using scaleX
            the body stays in place */
        this.body.transform = new Phaser.GameObjects.Components.TransformMatrix(1,0,0,1,0,0) 
        
    }
    
    playWalkAnimation(facing){
        if(facing === FRONT || facing === BACK){
            this.scaleX = 1
            this.muzi.play(`${facing}_walk_Muzi`)
            this.kuro.play(`${facing}_walk_Kuro`)
        }
        else{
            this.scaleX = (facing === LEFT ? -1: 1)
            this.muzi.play('side_walk_Muzi')
            this.kuro.play('side_walk_Kuro')
        }
        
        if(facing === BACK){
            this.moveTo(this.muzi, 0)
        }
        else{
            this.moveTo(this.muzi, 1)
        }
    }
    
    stopWalkAnimation(){
        this.iterate(child => {
            child.anims.stop()
            if(this.facing === FRONT || this.facing === BACK){
                child.setFrame(`${this.facing}_${child.role}`)
            }
            else{
                child.setFrame(`side_${child.role}`)
            }
        })
    }
    
    destroy(){
        this.iterate(child => {
            child.setPosition(this.x, this.y)
            child.setInGame(false)
            child.group = null      
        })
        this.removeAll()
        super.destroy()
    }
    
    update(time, delta){
        this.muzi.anims.update(time, delta)
        this.kuro.anims.update(time, delta)
        this.depth = this.y / this.scene.map.realHeight
    }
}