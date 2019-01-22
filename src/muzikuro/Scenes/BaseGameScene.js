/*
This is a BaseGameScene that does:
+ creating player
+ creating map
*/
import Phaser from 'phaser'
import {MOVE_SPEED, MOVE_UPDATE_PER_SEC, MUZI, KURO} from '../constants.js'
import {LocalPlayer, RemotePlayer} from '../GameObjects/Player.js'
import Group from '../GameObjects/Group.js'
import {getDirection, getValueByName} from '../utils.js'

const MOVE_SEND_INTERVAL = 1000/MOVE_UPDATE_PER_SEC

export default class BaseGameScene extends Phaser.Scene{
    constructor(config){
        super(config)
        this.local_player = null
        this.players = new Map()
        this.groups = []
        this.delta_last_send_move = 0
        this.callbacks = new Map()
        this.allowHoldPointer = true
    }
    
    init(){
        this.local_player = null
        this.players = new Map()
        this.groups = []
        this.delta_last_send_move = 0
        this.callbacks = new Map()
    }
    
    onDisconnect(){
        /*
        this.groups.forEach((group)=>{group.destroy()})
        this.players.forEach(function(elem){
            elem.destroy() 
        });
        this.players.clear();
        */
        this.physics.pause()
    }
    
    createSpritePlayers(){
        /*
        This function creates player sprites from the existing value in Game object
        */
        for(let player of this.game.players.values()){
            if(player.id === this.game.local_player.id){
                player = new LocalPlayer(this, player.x, player.y, player.name, player.id, player.role, player.partner_id)
                this.local_player = player
            }
            else{
                player = new RemotePlayer(this, player.x, player.y, player.name, player.id, player.role, player.partner_id)
            }
            this.players.set(player.id, player)
        }
        // create groups
        for(let player of this.players.values()){
            var partner = this.players.get(player.partner_id)
            if(player.role === MUZI && partner){
                this.groups.push(new Group(this, player, partner))
            }
        }
        if(this.local_player.group){
            this.cameras.main.startFollow(this.local_player.group)
            this.cameras.main.setLerp(0.15,0.15)
            if(this.local_player.role === KURO){
                this.input.on('pointerdown', this.moveToPointer, this)
            }
        }
        
    }
    
    update(time, delta){
        var pointer = this.input.activePointer
        var player = this.local_player
        this.delta_last_send_move += delta
        
        if(player && player.role === KURO && player.in_game){
            
            if(pointer.isDown && (time - pointer.downTime > 250) && this.allowHoldPointer){
                if( Math.pow( Math.pow(pointer.x/this.cameras.main.height-0.5, 2) + Math.pow(pointer.y/this.cameras.main.height-0.5, 2), 0.5) > 0.1){
                    this.moveToPointer(pointer)
                }
            }
            
            if(player.group.walking){
                // stop smovement when kuro reached pointer movement's destination
                let pos = player.getPosition()
                let dest_vec = new Phaser.Math.Vector2(player.pointerDest).subtract(pos)
                if( dest_vec.dot(player.group.body.velocity) <= 0 || player.group.body.velocity.length() === 0){
                    // reached destination or hit the wall
                    
                    player.group.body.velocity.set(0,0)
                    this.game.socket.emit('playerMove', { pos: pos,
                        v: {x:0, y:0}})
                    
                    player.pointerDest = null
                    player.group.walking = false
                    player.group.stopWalkAnimation()
                }else if(this.delta_last_send_move > MOVE_SEND_INTERVAL){ // keep moving
                    this.game.socket.emit('playerMove', { pos: pos,
                        v: { x: player.group.body.velocity.x,
                            y: player.group.body.velocity.y, }})
                    this.delta_last_send_move = 0
                }
            }
            
        }
        
        this.groups.forEach( g => g.update(time, delta))        
    }
      
    onPlayerMove(data){
        var group = this.players.get(data.id).group
        // var p = this.players.get(data.id)
        // console.log(`Player ${p.id} ${p.name} ${p.role} ${p.group}`);
        if(!group){
            console.warn(`Player ${data.id}(${this.players.get(data.id).name}) moved while not grouped.`)
            //console.log(this.players.get(data.id))
            return
        }
        group.x = data.pos.x
        group.y = data.pos.y
        
        if(data.v.x === 0 && data.v.y === 0){
            group.body.velocity.set(0,0)
            group.walking = false
            group.stopWalkAnimation()
        }
        else{
            let facing = getDirection(data.v)
            let dest = new Phaser.Math.Vector2(data.pos).add(data.v)
            this.physics.moveToObject(group, dest, MOVE_SPEED)
            
            if(facing !== group.facing || !group.walking){
                group.playWalkAnimation(facing)
            }
            group.walking = true
            group.facing = facing
        }
        
    }
    
    onDestroyPlayer(data){
        if(this.players.has(data.id)){
            let player = this.players.get(data.id)
            player.destroy() 
            this.players.delete(data.id)
        }
    }
    
    moveToPointer(pointer){
        var dest, pos, vect
        if(!pointer.leftButtonDown()) return

        pos = this.local_player.getPosition()
        dest = this.cameras.main.getWorldPoint(pointer.x, pointer.y)
        this.local_player.pointerDest = dest
        vect = new Phaser.Math.Vector2(dest).subtract(pos)
        if(vect.length() > 10){
            this.physics.moveToObject(this.local_player.group, dest, MOVE_SPEED) // This will not stop when reached destination

            let facing, partner
            facing = getDirection(this.local_player.group.body.velocity)
            partner = this.players.get(this.local_player.partner_id)
            
            if(facing !== this.local_player.group.facing || !this.local_player.group.walking){
                this.local_player.group.playWalkAnimation(facing)
            }
            
            this.local_player.group.facing = facing
            this.local_player.group.walking = true            
        }
    }
    
    listenToSocket(events){
        // bind all event to its corresponding function by name
        // we need to keep the binded functions in callbacks in order to remove them
        if(events instanceof Array){
            for(let e of events){
                let func = this[`on${e[0].toUpperCase()}${e.substring(1)}`].bind(this)
                this.game.socket.on(e, func)
                this.callbacks.set(e, func)
            }
        }
        else{
            let e = events;
            let func = this[`on${e[0].toUpperCase()}${e.substring(1)}`].bind(this)
            this.game.socket.on(e, func)
            this.callbacks.set(e, func)
        }
        
    }
    
    detachSocket(){
        // this function drops all listeners in this.callbacks
        for(let c of this.callbacks.keys()){
            this.game.socket.off(c, this.callbacks.get(c))
            this.callbacks.delete(c)
        }
    }
    
    setEdgeCollisionByProperty(tile){
        /*
        tile.properties.collides is define in the map
        It is a binary number consists of four bit
        each bit represent whether the direction has collisions
        The value is the decimal form of the four bits
        decimal values for each direction:
            left  right  up  down
            8     4      2   1
        */
        var collides = tile.properties.collides,
            layer = tile.tilemapLayer,
            left, right, up, down
            
        if(collides === 15 || !collides){
            return
        }
        
        collides = collides.toString(2).padStart(4, '0')
        left = collides[0]
        right = collides[1]
        up = collides[2]
        down = collides[3]
            
        if(left === '1'){
            let neighbor = layer.getTileAt(tile.x-1, tile.y, true)
            tile.collideLeft = true
            tile.faceLeft = true
            neighbor.collideRight = true
            neighbor.faceRight = true
        }
        if(right === '1'){
            let neighbor = layer.getTileAt(tile.x+1, tile.y, true)
            tile.collideRight = true
            tile.faceRight = true
            neighbor.collideLeft = true
            neighbor.faceLeft = true
        }
        if(up === '1'){
            let neighbor = layer.getTileAt(tile.x, tile.y-1, true)
            tile.collideUp = true
            tile.faceTop = true
            neighbor.collideDown = true
            neighbor.faceBottom = true
        }
        if(down === '1'){
            let neighbor = layer.getTileAt(tile.x, tile.y+1, true)
            tile.collideDown = true
            tile.faceBottom = true
            neighbor.collideUp = true
            neighbor.faceTop = true
        }
    }
    
    createMapObjects(){
        let obj_config = this.cache.json.get('map.objects.config'),
            map_scale = getValueByName('scale', this.map.properties) || 1,
            collide_objects = []
        for(let obj_layer of this.map.objects){
            for(let obj of obj_layer.objects){
                let obj_scale = map_scale
                if(obj.properties){
                    obj_scale *= (getValueByName('scale', obj.properties) || 1)
                }
                obj = this.add.image(obj.x*map_scale, obj.y*map_scale,'map.objects', obj.name).setName(obj.name)
                obj.setOrigin(0.5,1).setScale(obj_scale)
                obj.depth = obj.y/this.map.realHeight
                if(obj_config[obj.name].collides){
                    this.physics.add.existing(obj, true)
                    let collide_w = obj_config[obj.name].collide_w,
                        collide_h = obj_config[obj.name].collide_h,
                        offset_x = obj_config[obj.name].collide_offset_x,
                        offset_y = obj_config[obj.name].collide_offset_y
                        
                    obj.body.setSize(collide_w*obj_scale, collide_h*obj_scale)
                        .setOffset( (offset_x - obj.width * 0.5) * obj_scale + obj.width * 0.5,
                            (offset_y - obj.height) * obj_scale + obj.height)                    
                    collide_objects.push(obj)
                }
            }
        }
        
        return collide_objects
    }
    
    createTileMap(key){
        var map, tileset, map_scale, collide_layers = [] 
        
        this.map = map = this.make.tilemap({ key: `map.${key}`})
        tileset = map.addTilesetImage('tileset_0', 'map.tileset_0')
        
        map_scale = getValueByName('scale', map.properties) || 1
        map.realHeight = map.heightInPixels*map_scale
        map.realWidth = map.widthInPixels*map_scale
        for(let i=0; i<map.layers.length; i++){
            let layer = map.createDynamicLayer(i, tileset)
                .setDepth(-map.layers.length+i)
                .setScale(map_scale)
                .setCollisionByProperty({ collides: 15 })
            // advanced collision setting
            layer.forEachTile(this.setEdgeCollisionByProperty)
            collide_layers.push(layer)
        }
        
        return collide_layers
    }
}