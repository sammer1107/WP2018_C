var current_slide = 0

$(document).ready(function(){
    var piano = Synth.createInstrument("piano");
    $(".key").mousedown(function (e) { 
        // e.preventDefault();
        piano.play($(this).data("note"), 4, 2);
    });

    /* Usage: noteIndicate("Note names with space: C C# D D# E F F# G G# A A# B", callback) */
    var noteIndicate = function(n, callback = ()=>{}) {
        var notes = n.replace(/[\-\^\.]/g, "").split(" ");
        $(`[data-note='${notes.shift()}']`).addClass("indicate");
        $(".keys").on("mousedown", ".indicate", function(){
            $(this).removeClass("indicate");
            if(notes.length != 0) {
                $(`[data-note='${notes.shift()}']`).addClass("indicate");
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
			$(`.key[data-note="${note_name}"]`).toggleClass("pressed").delay(300).queue(function(){
				$(this).toggleClass("pressed").dequeue();
			});
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
	
	$("#piano-page .description #first h2").delay(1000).fadeTo(500, 1);
	$("#piano-page .description #first p").delay(2000).fadeTo(500, 1);
	
	// Oh Susanna in D Major
	var song = "D^^ E^^ F#^ A^ A^. B^^ A^ F#^ D^. E^^ F#^ F#^ E^ D^ E";
	setTimeout(function(){
		noteIndicate(song, () => {
			setTimeout(function(){
				// play the song again and show messages simultaneously
				notesPlay(song, 60, ()=>{ $.scrollify.move(1) });
				$("#piano-page .description #first > *").css("opacity", 0);
				$("#piano-page .description #second h2").fadeTo(500, 1);
				$("#piano-page .description #second p").delay(2500).fadeTo(500, 1);
				}, 1000);}) // delay for autoplay after player finished
	}, 3000); // delay for indication to appear
    
	$(".button#left").click( slideCard );	
	$(".button#right").click( slideCard );
	
	$('.icon').mouseenter(function(){ 
			$(this).shake({
				interval: 100,
				distance: 2,
				times: 3 })});
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


// shake function
(function($){
    $.fn.shake = function(settings) {
        if(typeof settings.interval == 'undefined'){
            settings.interval = 100;
        }

        if(typeof settings.distance == 'undefined'){
            settings.distance = 10;
        }

        if(typeof settings.times == 'undefined'){
            settings.times = 4;
        }

        if(typeof settings.complete == 'undefined'){
            settings.complete = function(){};
        }

        $(this).css('position','relative');

        for(var iter=0; iter<(settings.times+1); iter++){
            $(this).animate({ left:((iter%2 == 0 ? settings.distance : settings.distance * -1)) }, settings.interval);
        }

        $(this).animate({ left: 0}, settings.interval, settings.complete);  
    }; 
    $.fn.bounce = function(settings) {
        if(typeof settings.interval == 'undefined'){
            settings.interval = 100;
        }

        if(typeof settings.distance == 'undefined'){
            settings.distance = 10;
        }

        if(typeof settings.times == 'undefined'){
            settings.times = 4;
        }

        if(typeof settings.complete == 'undefined'){
            settings.complete = function(){};
        }

        $(this).css('position','relative');

        for(var iter=0; iter<(settings.times+1); iter++){
            $(this).animate({ top:((iter%2 == 0 ? settings.distance : settings.distance * -1)) }, settings.interval);
        }

        $(this).animate({ top: 0}, settings.interval, settings.complete);  
    };
})(jQuery);