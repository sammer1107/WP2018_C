export default class HUD extends Phaser.Scene {
  
    constructor()
    {
        super({ key: 'HUD', active: false });
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
        var ULinitX = 0;
        var ULinitY = 0;
        var ULspacing = (sNumber*0.025 > 8) ? 8 : sNumber*0.025;
        var ULposX = ULinitX + ULspacing;
        var ULposY = ULinitY + ULspacing;
        
        var infoContainer = this.add.graphics();
        infoContainer.fillStyle(0x222222, 0.5);
        infoContainer.fillRoundedRect(ULposX, ULposY, bNumber/4, winH/6.5, winH/80);
            ULposX = ULposX + ULspacing;
        
        //first row : playerInfo
        var playerName = this.add.text(ULposX, ULposY, '', {fontSize: sNumber/25, fill: '#ffffff'});
            ULposX = ULposX + sNumber/5 + ULspacing;
        var partnerName = this.add.text(ULposX, ULposY, '', {fontSize: sNumber/25, fill: '#999999'});
            ULposX = ULinitX + ULspacing;
            ULposY = ULposY + winH/16;
            
        //second and third row : scoreInfo
        var scoreContainer = this.add.graphics();
        var scoreBar = this.add.graphics();
        scoreContainer.fillStyle(0xce0000, 0.8);
        scoreContainer.fillRoundedRect(ULposX, ULposY, sNumber/4, sNumber/25,  sNumber/50);
        scoreBar.fillStyle(0xffff37, 1);
        scoreBar.fillRoundedRect(ULposX+ULspacing, ULposY+ULspacing, sNumber/4-2*ULspacing, sNumber/25-2*ULspacing, (sNumber/25-2*ULspacing)/2);
            ULposX = ULinitX;
            ULposY = ULinitY + ULspacing;
                    
        muzikuro.events.on('playerStateChange', function() {
            //Set player name
            playerName.setText(muzikuro.local_player.name);
            //Set partner name
            if (muzikuro.local_player.partner_id && 
                (muzikuro.local_player.partner_id != muzikuro.local_player.id)) {
                partnerName.setText(muzikuro.players.get(muzikuro.local_player.partner_id).name);
            } else {
                partnerName.setText('No partner');
            }
        })
        //Upper left corner part end
        
        //Upper right corner part start
        var URinitX = winW - bNumber/6;
        var URinitY = 0;
        var URspacing = winH/100;
        var URposX = URinitX - URspacing;
        var URposY = URinitY + URspacing;
        
        var groupNumber = muzikuro.groups.length;
        var listContainer = this.add.graphics();
        var groupContainer = this.add.graphics();
        var lCtext = this.add.text(URposX+bNumber/18, URposY+URspacing, 'Players', { fontSize: winH*3/100, fill: '#ffff37'});
        
        var lCwidth = bNumber/6;
        var lCheight = winH/2;
        
        listContainer.fillStyle(0x222222, 0.5);
        listContainer.fillRoundedRect(URposX, URposY, lCwidth, lCheight, winH/80);
            URposX = URposX + URspacing;
            URposY = URposY + lCtext.height + 2*URspacing;
            
        for (var i=0; i<4; i++){
            groupContainer.fillStyle(0x111111, 0.5);
            groupContainer.fillRoundedRect(URposX, URposY, lCwidth-2*URspacing, lCheight/5, winH/80);
            URposY = URposY + lCheight/5 + URspacing;
        }
        URposX = URposX + URspacing;
        URposY = lCtext.height + URinitY + 3*URspacing;
        
        var groupOneMuzi = this.add.text(URposX, URposY, 'Muzi:', {fontSize: sNumber/32, fill: '#000000'});
            URposY =  URposY + winH*7/200 + URspacing;
            
        var groupOneKuro = this.add.text(URposX, URposY, 'Kuro:', {fontSize: sNumber/32, fill: '#000000'}) ;
            URposY =  URposY + winH*7/200 + 3*URspacing;
            
        var groupTwoMuzi = this.add.text(URposX, URposY, 'Muzi:', {fontSize: sNumber/32, fill: '#000000'});
            URposY =  URposY + winH*7/200 + URspacing;
            
        var groupTwoKuro = this.add.text(URposX, URposY, 'Kuro:', {fontSize: sNumber/32, fill: '#000000'});
            URposY =  URposY + winH*7/200 + 3*URspacing;
            
        var groupThreeMuzi = this.add.text(URposX, URposY, 'Muzi:', {fontSize: sNumber/32, fill: '#000000'});
            URposY =  URposY + winH*7/200 + URspacing;
            
        var groupThreeKuro = this.add.text(URposX, URposY, 'Kuro:', {fontSize: sNumber/32, fill: '#000000'});
            URposY =  URposY + winH*7/200 + 3*URspacing;
            
        var groupFourMuzi = this.add.text(URposX, URposY, 'Muzi:', {fontSize: sNumber/32, fill: '#000000'});
            URposY =  URposY + winH*7/200 + URspacing;
            
        var groupFourKuro = this.add.text(URposX, URposY, 'Kuro:', {fontSize: sNumber/32, fill: '#000000'});
            URposX = URposX + lCwidth*0.7
            URposY = lCtext.height + URinitY + 4*URspacing;
        
        var gOneS = this.add.text(URposX, URposY, '', {fontSize: sNumber*2/25, fill: '#000000'});
            URposY = URposY + lCheight/5 + URspacing;
            
        var gTwoS = this.add.text(URposX, URposY, '', {fontSize: sNumber*2/25, fill: '#000000'});
            URposY = URposY + lCheight/5 + URspacing;
            
        var gThreeS = this.add.text(URposX, URposY, '', {fontSize: sNumber*2/25, fill: '#000000'});
            URposY = URposY + lCheight/5 + URspacing;
            
        var gFourS = this.add.text(URposX, URposY, '', {fontSize: sNumber*2/25, fill: '#000000'});
        
        muzikuro.events.on('groupStateChange', function() {
            if (muzikuro.groups[0]) {
                groupOneMuzi.setText('Muzi:' + muzikuro.groups[0].muzi.name);
                groupOneKuro.setText('Kuro:' + muzikuro.groups[0].kuro.name);
                gOneS.setText(muzikuro.groups[0].muzi.score);
                if ( (muzikuro.local_player.role == 'Muzi' && muzikuro.local_player.name == muzikuro.groups[0].muzi.name) || 
                      (muzikuro.local_player.role == 'Kuro' && muzikuro.local_player.name == muzikuro.groups[0].kuro.name)) {
                    groupOneMuzi.setFill('#00bb00');
                    groupOneKuro.setFill('#93ff93');
                }
            } else {
                groupOneMuzi.setText('Muzi:');
                groupOneKuro.setText('Kuro:');
                groupOneMuzi.setFill('#000000');
                groupOneKuro.setFill('#000000');
            }
            if (muzikuro.groups[1]) {
                groupTwoMuzi.setText('Muzi:' + muzikuro.groups[1].muzi.name);
                groupTwoKuro.setText('Kuro:' + muzikuro.groups[1].kuro.name);
                gTwoS.setText(muzikuro.groups[1].muzi.score);
                if ( (muzikuro.local_player.role == 'Muzi' && muzikuro.local_player.name == muzikuro.groups[1].muzi.name) || 
                      (muzikuro.local_player.role == 'Kuro' && muzikuro.local_player.name == muzikuro.groups[1].kuro.name)) {
                    groupTwoMuzi.setFill('#00bb00');
                    groupTwoKuro.setFill('#93ff93');
                }
            } else {
                groupTwoMuzi.setText('Muzi:');
                groupTwoKuro.setText('Kuro:');
                groupTwoMuzi.setFill('#000000');
                groupTwoKuro.setFill('#000000');
            }
            if (muzikuro.groups[2]) {
                groupThreeMuzi.setText('Muzi:' + muzikuro.groups[2].muzi.name);
                groupThreeKuro.setText('Kuro:' + muzikuro.groups[2].kuro.name);
                gThreeS.setText(muzikuro.groups[2].muzi.score);
                if ( (muzikuro.local_player.role == 'Muzi' && muzikuro.local_player.name == muzikuro.groups[2].muzi.name) || 
                      (muzikuro.local_player.role == 'Kuro' && muzikuro.local_player.name == muzikuro.groups[2].kuro.name)) {
                    groupThreeMuzi.setFill('#00bb00');
                    groupThreeKuro.setFill('#93ff93');
                }
            } else {
                groupThreeMuzi.setText('Muzi:');
                groupThreeKuro.setText('Kuro:');
                groupThreeMuzi.setFill('#000000');
                groupThreeKuro.setFill('#000000');
            }
            if (muzikuro.groups[3]) {
                groupFourMuzi.setText('Muzi:' + muzikuro.groups[3].muzi.name);
                groupFourKuro.setText('Kuro:' + muzikuro.groups[3].kuro.name);
                gFourS.setText(muzikuro.groups[3].muzi.score);
                if ( (muzikuro.local_player.role == 'Muzi' && muzikuro.local_player.name == muzikuro.groups[3].muzi.name) || 
                      (muzikuro.local_player.role == 'Kuro' && muzikuro.local_player.name == muzikuro.groups[3].kuro.name)) {
                    groupFourMuzi.setFill('#00bb00');
                    groupFourKuro.setFill('#93ff93');
                }
            } else {
                groupFourMuzi.setText('Muzi:');
                groupFourKuro.setText('Kuro:');
                groupFourMuzi.setFill('#000000');
                groupFourKuro.setFill('#000000');
            }
            //console.log(muzikuro.groups);
        })
        //Upper right corner part end
        
    }
    
}