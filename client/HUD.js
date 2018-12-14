export class HUD {
  
    UpdatePlayerState(players, local_player){
        
        if(local_player.id){
            $("#game-container .local_playerName").html( local_player.name );
            /*if(local_player.role == 'MUZI'){
                $("#game-container .imageContainer").addClass('MuziFace');
            } else {
                $("#game-container .imageContainer").addClass('KuroFace');
            }*/
        }
        if(local_player.partner_id){
            $("#game-container .partnerName").html( players.get(local_player.partner_id).name );
            /*if(players[local_player.partner_id].role == 'MUZI'){
                $("#game-container .imageContainer").addClass('MuziFace');
            } else {
                $("#game-container .imageContainer").addClass('KuroFace');
            }*/
        } else {
            $("#game-container .partnerName").html( "No partner" );
        }
        
        $("#game-container #scorebar").css("width", 50 + '%');
        $("#game-container #local_playerInfo").css("display", "block" );
        
    }
    
    resetBoard(groups) {
        //clear the groupContainer
        $("#leaderBoard #groupsTable").find("div.groupContainer").remove();
        
        //create the group div depend on group numbers
        for(var i=0; i < groups.length; i++){
            
            var muzi = groups[i].muzi.name;
            var kuro = groups[i].kuro.name;
            
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
                                <div class="score"> ${groups[i].muzi.score} </div>
                            </div>
                        </div`;
            /*groups[i].item = item;*/
            $("#leaderBoard #groupsTable").append($(item));
        }
    }
    
    showLeaderBoard(){
        $("#leaderBoard").css("display", "block" );
    }
    
    hideLeaderBoard(){
        $("#leaderBoard").css("display", "none" );
    }
}