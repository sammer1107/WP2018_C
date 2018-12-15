export class HUD {
    
    constructor() {
        this.currentScene = null;
    }
    
    setScene(SceneManager, sceneData) {
        this.currentScene = SceneManager.keys[sceneData.scene];
        /*console.log(sceneData.local_player);
        console.log(this.currentScene);
        console.log(this.currentScene.local_player);*/
    }
  
    UpdatePlayerState(){
        if(this.currentScene){
            /*console.log(this.currentScene);*/
            if(this.currentScene.local_player.id){
                $("#game-container .local_playerName").html( this.currentScene.local_player.name );
                /*if(this.currentScene.local_player.role == 'MUZI'){
                    $("#game-container .imageContainer").addClass('MuziFace');
                } else {
                    $("#game-container .imageContainer").addClass('KuroFace');
                }*/
            }
            if(this.currentScene.local_player.partner_id){
                $("#game-container .partnerName").html( this.currentScene.players.get(this.currentScene.local_player.partner_id).name );
                /*if(this.currentScene.players[local_player.partner_id].role == 'MUZI'){
                    $("#game-container .imageContainer").addClass('MuziFace');
                } else {
                    $("#game-container .imageContainer").addClass('KuroFace');
                }*/
            } else {
                $("#game-container .partnerName").html( "No partner" );
            }
        }
        $("#game-container #scorebar").css("width", 50 + '%');
        $("#game-container #local_playerInfo").css("display", "block" );
    }
    
    resetBoard() {
        if(this.currentScene){
            /*console.log(this.currentScene);*/
            //clear the groupContainer
            $("#leaderBoard #groupsTable").find("div.groupContainer").remove();
            
            //create the group div depend on group numbers
            for(var i=0; i < this.currentScene.groups.length; i++){
                
                var muzi = this.currentScene.groups[i].muzi.name;
                var kuro = this.currentScene.groups[i].kuro.name;
                
                console.log(`${muzi}_${kuro}`);
                var item = `<div class="groupContainer">
                                <div class="group">
                                    <div class="rank"> ${i+1} </div>
                                    <div class="playerInfo">
                                        <div class="player">
                                            <div class="imageContainer class="MuziFace"></div>
                                            <div class="nameContainer">
                                                <p class="playerName"> ${muzi} </p>
                                            </div>
                                        </div>
                                        <div class="player">
                                            <div class="imageContainer" class="KuroFace"></div>
                                            <div class="nameContainer">
                                                <p class="playerName"> ${kuro} </p>
                                            </div>
                                        </div>
                                    </div>
                                    <div class="score"> ${this.currentScene.groups[i].muzi.score} </div>
                                </div>
                            </div`;
                /*groups[i].item = item;*/
                $("#leaderBoard #groupsTable").append($(item));
            }
        }
    }
    
    showLeaderBoard(){
        $("#leaderBoard").css("display", "block" );
    }
    
    hideLeaderBoard(){
        $("#leaderBoard").css("display", "none" );
    }
}