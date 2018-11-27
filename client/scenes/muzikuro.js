var MuziKuro = {
    key: 'MuziKuro',
    preload: function() {
        this.load.image('Kuro', '/assets/Kuro.png');
        this.load.image('Muzi', '/assets/Muzi.png');
        this.load.tilemapTiledJSON('map', '/assets/map.json');
        this.load.image('google_tile', '/assets/tileset.png');
        this.load.image('music_note','/assets/musical-note.png');
    },
    
    create: function(){
        socket = io.connect();
        socket.on("connect", onSocketConnected);
        socket.on("disconnect", onSocketDisconnected);
        socket.on("createLocalPlayer", onCreateLocalPlayer);
        socket.on("newPlayer", onNewPlayer);
        socket.on("playerMove", onPlayerMove);
        socket.on("destroyPlayer", onDestroyPlayer);
        socket.on("updatePartner", onUpdatePartner);
        socket.on("notesUpdate", onNotesUpdate);
        socket.on("notesRemove", onNotesRemove);
        
        KURO_HEIGHT = this.textures.get('Kuro').frames.__BASE.height;
        MUZI_HEIGHT = this.textures.get('Muzi').frames.__BASE.height;
        // create map
        
        var map = this.make.tilemap({ key: 'map'});
        var google_tile = map.addTilesetImage('google_tile');      // name as specified in map.json
        var layer = map.createStaticLayer('map_layer_0', google_tile);
        this.physics.world.setBounds(0,0,5000,5000);
        
        // create a music note randomly
        this.music_notes = this.physics.add.group();
        /*for (var i = 0; i < 11; i++)
        {
            this.music_note.create(2525 + Math.random() * 400, 2525 + Math.random() * 400, 'music_note');
        }*/
        
        // controlls
        /*
        var KEY_W = this.input.keyboard.addKey("w");
        var KEY_A = this.input.keyboard.addKey("a");
        var KEY_S = this.input.keyboard.addKey("s");
        var KEY_D = this.input.keyboard.addKey("d");
        console.log(this.input.eventNames())*/
        MuziKuro = this;
    },
    
    update: function(time, delta){     
        
        if(local_player && local_player.role == 'Kuro' && local_player.in_game ){
            
            if(this.input.mousePointer.isDown){
                pointerDown.call(this, {x: this.input.mousePointer.x, y: this.input.mousePointer.y});
            }
            
            if(local_player.pointerDest != null){
                // stop movement when kuro reached pointer movement's destination
                var dest_vec = new Phaser.Math.Vector2(local_player.pointerDest).subtract(local_player.getPosition());
                if( local_player.pointerVect.dot(dest_vec) <= 0){
                    local_player.sprite.body.velocity.set(0,0);
                    local_player.pointerDest = null;
                }
            }
            
            socket.emit("playerMove", local_player.getPosition());
            
            players.id[local_player.partner_id].sprite.setPosition(local_player.sprite.x, local_player.sprite.y);
        }
        
        /*
        if(KEY_W.isDown){
            kuro.y -= KURO_SPEED;
            
        }
        if(KEY_A.isDown){
            kuro.x -= KURO_SPEED;
            
        }
        if(KEY_S.isDown){
            kuro.y += KURO_SPEED;
            
        }
        if(KEY_D.isDown){
            kuro.x += KURO_SPEED;
            
        }
        */
    },
    
}
