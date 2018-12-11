export class HUD {
  
    UpdatePlayerState(players, local_player){
        
        if(local_player.id){
            $("#hud #player #playerName").html( local_player.name );
            /*if(local_player.role == 'MUZI'){
                $("#hud #player .playerRoleImage").addClass('MuziFace');
            } else {
                $("#hud #player .playerRoleImage").addClass('KuroFace');
            }*/
        }
        if(local_player.partner_id){
            $("#hud #partner #partnerName").html( players.get(local_player.partner_id).name );
            /*if(players[local_player.partner_id].role == 'MUZI'){
                $("#hud #partner .playerRoleImage").addClass('MuziFace');
            } else {
                $("#hud #partner .playerRoleImage").addClass('KuroFace');
            }*/
        } else {
            $("#hud #partner #partnerName p").html( "No partner" );
        }
        
        $("#hud #scorebar").css("width", 50 + '%');
        $("#hud").css("display", "block" );
        
    }
    
    resetBoard(groups) {
        //clear the groupContainer
        $("#leaderBoard #groupsContainer").find("div.group").remove();
        
        console.log(groups);
        //create the group div depend on group numbers
        for(var i=0; i < groups.length; i++){
            var $item = $(
                    "<div class='group'>" +
                        "<div id='groupInfo'>" +
                            "<div id='rank'>" + ( i + 1 ) + "</div>" +
                            "<div id='playerInfo'>" +
                                "<div id='player'>" +
                                    "<div class='imageContainer'>" +
                                        "<div class='playerRoleImage' class='MuziFace'></div>" +
                                    "</div>" +
                                    "<div class='nameContainer'>" +
                                        "<p id='playerName'>" + groups[i].muzi.name + "</p>" +
                                    "</div>" +
                                "</div>" +
                                "<div id='player'>" +
                                    "<div class='imageContainer'>" +
                                        "<div class='playerRoleImage' class='KuzoFace'></div>" +
                                    "</div>" +
                                    "<div class='nameContainer'>" +
                                        "<p id='playerName'>" + groups[i].kuro.name + "</p>" +
                                    "</div>" +
                                "</div>" +
                            "</div>" +
                            "<div id='score'>" + groups[i].muzi.score + "</div>" +
                        "</div>" +
                    "</div>");
            console.log(groups[i].muzi.name);
            console.log(groups[i].kuro.name);
            /*groups[i].$item = $item;*/
            $("#leaderBoard #groupsContainer").append($item);
        }
    }
    
    showLeaderBoard(){
        $("#leaderBoard").css("display", "block" );
    }
    
    hideLeaderBoard(){
        $("#leaderBoard").css("display", "none" );
    }
}