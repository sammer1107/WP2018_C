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

    $.scrollify({
		section: ".page",
		setHeights: false,
		scrollbars: false
    });
	
	$("#piano-page .desc h2").delay(1000).fadeTo(500, 1);
	$("#piano-page .desc p").delay(2000).fadeTo(500, 1);
	
    // Oh Susanna in D Major
    noteIndicate("D E F# A A B A F# D E F# F# E D E", () => { $.scrollify.next(); });
    
	$(".button#left").click( slideCard );	
	$(".button#right").click( slideCard );
});

function slideCard(){
	clicked_button = $(this)
	
	if(clicked_button.attr("id") == 'left'){
		current_slide -= 1;
		var left = $("#team-container #slider").css( "left" );
		$("#team-container #slider").animate({left: -current_slide*100 + 'vh'}, 400);
	}else if(clicked_button.attr("id") == 'right'){
		current_slide += 1;
		var left = $("#team-container #slider").css( "left" );
		$("#team-container #slider").animate({left: -current_slide*100 + 'vh'}, 400);
	}
	
	// update button visibility
	if(current_slide == 0){
		$(".button#left").css("visibility", "hidden");
	} else if (current_slide == 4){
		$(".button#right").css("visibility", "hidden");
	} else {
		$(".button#left").css("visibility", "visible");
		$(".button#right").css("visibility", "visible");
	}
}