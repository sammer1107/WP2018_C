current_slide = 0

$(document).ready(function(){
    var piano = Synth.createInstrument("piano");
    $(".key").mousedown(function (e) { 
        e.preventDefault();
        piano.play($(this).data("note"), 4, 2);
    });

    /* Usage: noteIndicate("Note names with space: C C# D D# E F F# G G# A A# B", callback) */
    var noteIndicate = function(n, callback) {
        var notes = n.split(" ");
        $("[data-note='"+notes.shift()+"']").addClass("indicate");
        $(".keys").on("click", ".indicate", function(){
            $(this).removeClass("indicate");
            if(notes.length != 0) {
                $("[data-note='"+notes.shift()+"']").addClass("indicate");
            }
            else {
                callback();
            }
        });
    };

    //noteIndicate("C D E F G", () => { alert("Well Played!") });
    
	$(".button#left").click(function() {
		current_slide -= 1;
		var left = $("#team-container #slider").css( "left" );
			$("#team-container #slider").animate({left: -current_slide*100 + 'vh'}, 400);
		updateButtonDisplay();
	});
	
	$(".button#right").click(function() {
		current_slide += 1;
		var left = $("#team-container #slider").css( "left" );
			$("#team-container #slider").animate({left: -current_slide*100 + 'vh'}, 400);
		updateButtonDisplay();
	});
});

function updateButtonDisplay(){
	if(current_slide == 0){
		$(".button#left").css("visibility", "hidden");
	} else if (current_slide == 4){
		$(".button#right").css("visibility", "hidden");
	} else {
		$(".button#left").css("visibility", "visible");
		$(".button#right").css("visibility", "visible");
	}
}