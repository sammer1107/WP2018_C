current_slide = 0

$(document).ready(function(){
    var piano = Synth.createInstrument("piano");
    $(".key").mousedown(function (e) { 
        e.preventDefault();
        piano.play($(this).data("note"), 4, 2);
    });

    /* Usage: noteIndicate("Note names with space: C C# D D# E F F# G G# A A# B", callback) */
    var noteIndicate = function(n, callback = ()=>{}) {
        var notes = n.replace(/[\-\^\.]/g, "").split(" ");
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
	
	/* Usage: notePlay("Note names with Tempo", BPM, callback)
	   Tempo symbol: Default is quarter note, '-':*2, '^':/2, '.':*1.5(once only) */
    var notesPlay = async function(n, bpm, callback = ()=>{}) {
        let notes = n.split(" ");
        let ms_per_note = 60000/bpm;
        const noteLasting = (t) => {
            return new Promise((resolve) => {
                setTimeout(resolve, t);
            });
        };
        for (const note of notes) {
            //Use includes("#") to decide should the 2nd pos be preserved. Ex: C#
            let note_name = note.slice(0, 1+(note.includes("#") | 0));
            let time_param = ms_per_note;
            /* (split.length-1) counts the char, but here we make two
                nums do substraction, so (-1)-(-1)=0, no need for (-1).
                Here '-' means twice the time and '^' means half the time */
            time_param *= 2**(note.split("-").length - note.split("^").length);
            time_param *= (note.includes("."))? 1.5 : 1;
            piano.play(note_name, 4, 2);
            await noteLasting(time_param);
        };
		callback();
    };

    $.scrollify({
		section: ".page",
		setHeights: false,
		scrollbars: false
    });
	
	$("#piano-page .desc h2").delay(1000).fadeTo(500, 1);
	$("#piano-page .desc p").delay(2000).fadeTo(500, 1);
	
	// Oh Susanna in D Major
	var song = "D^^ E^^ F#^ A^ A^. B^^ A^ F#^ D^. E^^ F#^ F#^ E^ D^ E.";
	noteIndicate(song, () => { $.scrollify.next(); });
    
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