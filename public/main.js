$(document).ready(function(){
    var piano = Synth.createInstrument("piano");
    $(".key").mousedown(function (e) { 
        e.preventDefault();
        piano.play($(this).data("note"), 4, 2);
    });
	
	$("#left").click(function() {
		var left = $("#team-container #slider").css( "left" );
			$("#team-container #slider").animate({left: '-=100vh'});
	});
	
	$("#right").click(function() {
		var left = $("#team-container #slider").css( "left" );
			$("#team-container #slider").animate({left: '+=100vh'});
	});
});
