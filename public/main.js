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
    
	$("#left").click(function() {
		var left = $("#team-container #slider").css( "left" );
			$("#team-container #slider").animate({left: '-=100vh'});
	});
	
	$("#right").click(function() {
		var left = $("#team-container #slider").css( "left" );
			$("#team-container #slider").animate({left: '+=100vh'});
	});
});
