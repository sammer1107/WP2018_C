$(document).ready(function(){
    var piano = Synth.createInstrument("piano");
    $(".key").click(function (e) { 
        e.preventDefault();
        piano.play($(this).data("note"), 4, 2);
    });
});
