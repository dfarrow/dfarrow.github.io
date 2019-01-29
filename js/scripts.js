// Functions for jan31.html  :: START
var wasRun = false;

function start() {

    // Get a reference to the triangle
    var elTriangle = $("#yellowTriangle"); 
        
    if(!wasRun) {
        wasRun = true;
        var elTriangle = $("#yellowTriangle"); 
        
        // Animate the SVG properties
        $("#yellowTriangle").animate({svgWidth: 200, svgHeight: '30%', 
            svgStroke: 'aqua', 
            svgStrokeWidth: '+=7', 
            svgFill: 'red',
            svgTransform: 'translate(400, 100) rotate(360, 50, 50)'}, 2000);
    } else {
        console.log("You already ran this function!"); 
        wasRun = false; 
        // Return the SVG properties to initial state
        $("#yellowTriangle").animate({svgWidth: 200, svgHeight: '30%', 
            svgStroke: 'aqua', 
            svgStrokeWidth: '0', 
            svgFill: 'lemonchiffon',
            svgTransform: 'translate(10, 100) rotate(0, 50, 50)'}, 2000);
        
    }

} 

$("#yellowTriangle").click(function() { 
     start(); 
});

// Functions for jan31.html  :: END
