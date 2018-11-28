export default class HUD extends Phaser.Scene {
  
  constructor()
  {
    super({ key: 'HUD', active: true});
  }
  
  create(data)
  { 
    //scoreBar
    var scoreBox = this.add.graphics();
    var scoreBar = this.add.graphics();
    scoreBox.fillStyle(0x222222, 0.8);
    scoreBox.fillRoundedRect(10+110,
                             window.innerHeight/80,
                             window.innerWidth/4,
                             window.innerHeight/20,
                             window.innerHeight/40);
    scoreBar.fillStyle(0xffff37, 1);
    scoreBar.fillRoundedRect(10+10+110,
                             window.innerHeight/80+10,
                             window.innerWidth/4-20,
                             window.innerHeight/20-20,
                             (window.innerHeight/20-20)/2);
    var scoreText = this.add.text(10, 10, 'Score:',{ fontSize: window.innerHeight/25, fill: '0x000'});
    var playerText = this.add.text(10, 10+scoreText.y+scoreText.height, 'player:', {fontSize: window.innerHeight/25, fill: '0x000'});
    var partnerText = this.add.text(10, 10+playerText.y+playerText.height, 'partner:', {fontSize: window.innerHeight/25, fill: '0x000'});

    //
  }
  
  update(time, delta)
  {
  }
}