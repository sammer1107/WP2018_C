$(document).ready(function(){
    var piano = Synth.createInstrument("piano");
    $(".key").mousedown(function (e) { 
        e.preventDefault();
        piano.play($(this).data("note"), 4, 2);
    });
});
