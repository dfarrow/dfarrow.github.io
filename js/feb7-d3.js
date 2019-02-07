var svg = d3.select("svg"); 

// Create the bar chart
function createBar(newData) {  

    var bars = svg.selectAll("rect").data([]); // Make selection
    bars.exit().remove(); // Remove existing rects

    var rectEnter = bars.data(newData).enter().append("rect");
    rectEnter.attr("fill", function() { return randomColor()})
        .attr("y",  function(d, i) { return 300-d; })
        .attr("x", function(d, i) { return i * 100 + 10; })
        .attr("height", function(d) { return (d); })
        .attr("width", function(d) { return (d); }); 
}

// Data
var dataSet1 = [21, 63, 51, 34, 54, 74];
var dataSet2 = [76, 21, 65, 13, 54, 20];

// Button handlers
d3.select("#button1")
    .on("click", function(d, i) { 
        console.log("buttonOneClick() handler ", dataSet1); 
        createBar(dataSet1); 
    });

d3.select("#button2")
    .on("click", function(d, i) { 
        console.log("buttonTwoClick() handler ", dataSet2);
        createBar(dataSet2); 
    });

// Utility functions
    
function randomColor() {
    var r = getRandomInt(255);
    var g = getRandomInt(255);
    var b = getRandomInt(255);
    return "rgb(" + r +", " + g +", " + b +")"; 
}  

function getRandomInt(max) {
    return Math.floor(Math.random() * Math.floor(max));
} 