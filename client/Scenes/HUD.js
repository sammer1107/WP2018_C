export default class HUD extends Phaser.Scene {
  
    constructor()
    {
        super({ key: 'HUD', active: true });
    }

    create()
    { 
        //Take scene reference
        var muzikuro = this.scene.get('MuziKuro');
        
        var winW = window.innerWidth;
        var winH = window.innerHeight;
        var sNumber = (window.innerWidth > window.innerHeight) ? window.innerHeight : window.innerWidth;
        var bNumber = (window.innerWidth < window.innerHeight) ? window.innerHeight : window.innerWidth;
        
        //Upper left corner part start
        var ULinitX = (winW*0.025 > 10) ? 10 : winW*0.025;
        var ULinitY = (winH*0.025 > 10) ? 10 : winH*0.025;
        var ULposX = ULinitX;
        var ULposY = ULinitY;
        var spacing = (sNumber*0.025 > 10) ? 10 : sNumber*0.025;
        
        //first row : scoreInfo
        var scoreText = this.add.text(ULinitX, ULinitY, 'Score:',{ fontSize: sNumber/25, fill: '0x000'});
            ULposX = ULposX + scoreText.width + spacing;
        var scoreContainer = this.add.graphics();
        var scoreBar = this.add.graphics();
        scoreContainer.fillStyle(0x222222, 0.8);
        scoreContainer.fillRoundedRect(ULposX, ULposY, sNumber/4, scoreText.height, scoreText.height/2);
        scoreBar.fillStyle(0xffff37, 1);
        scoreBar.fillRoundedRect(ULposX+spacing, ULposY+spacing, sNumber/4-2*spacing, scoreText.height-2*spacing, (scoreText.height-2*spacing)/2);
            ULposX = ULinitX;
            ULposY = ULinitY + scoreText.height + spacing;
            
        //second and third row : playerInfo
        var playerName = this.add.text(ULposX, ULposY, '', {fontSize: sNumber/25, fill: '0x000'});
            ULposY = ULposY+scoreText.height+spacing;
        var partnerName = this.add.text(ULposX, ULposY, '', {fontSize: sNumber/25, fill: '0x000'});
                    
        muzikuro.events.on('playerStateChange', function() {
            //Set player name
            playerName.setText(muzikuro.local_player.name);
            //Set partner name
            if (muzikuro.local_player.partner_id && 
                (muzikuro.local_player.partner_id != muzikuro.local_player.id)) {
                partnerName.setText(muzikuro.players.get(muzikuro.local_player.partner_id).name);
            } else {
                partnerName.setText('');
            }
        })
        //Upper left corner part end
        
        
        //Upper right corner part start
        //Global player list
        var groupNumber = muzikuro.groups.length;
        var listContainer = this.add.graphics();
        
        listContainer.fillStyle(0x222222, 1);
        listContainer.fillRoundedRect(winW - bNumber/6, 0, bNumber/6, winH/3, winH/80);
        
    }
}