// Functions for jan31.html  :: START

var svg = d3.select("svg");

function start() {

    d3.select("#title")
        .attr("class","fun")
        .text("YO DAWG")
        .style("color", "red");

    

}
// Functions for jan31.html  :: END

function dance() {

    var circles = d3.selectAll(".dot");
    circles.data([32, 57, 112])
    var colorVal = randomColor();
    circles.attr("fill", colorVal)
        .attr("cx", function(d) { return Math.random() * 500; }) 
        .attr("cy", function(d) { return Math.random() * 100; }) 
        .attr("r", function(d) { return d; }) 
    
}

 
function randomColor() {
    var r = parseInt(Math.random() * 255);
    var g = parseInt(Math.random() * 255);
    var b = parseInt(Math.random() * 255);
    return "rgb(" + r +", " + g +", " + b +")"; 
}  
//setInterval("dance()", 400);

function radius() { 
    var circles = svg.selectAll("circle")
        .data([21, 33, 51, 34, 48, 34]);
    
    circles.attr("cx", function(d) { return Math.random() * 500; }) 
        .attr("cy", function(d) { return Math.random() * 100; }) 
        .attr("r", function(d) { return d; }) 

    var circleEnter = circles.enter().append("circle");
    circleEnter.attr("fill", function() { return randomColor()})
        .attr("cy", 60)
        .attr("cx", function(d, i) { return i * 100 + 30; })
        .attr("r", function(d) { return (d); });
}

radius();

var dataSet1 = [21, 33, 51, 34, 48, 34];
var dataSet2 = [34, 23, 65, 32, 21];

function createBar(data) { 
    var svg2 = d3.select("#svg2");

  
    var bars = svg2.selectAll("rect")
        .data(data);
    
    bars.exit().remove();
    

    var rectEnter = bars.enter().append("rect");
    rectEnter.attr("fill", function() { return randomColor()})
        .attr("y", 100)
        .attr("x", function(d, i) { return i * 100 + 30; })
        .attr("height", function(d) { return (d); })
        .attr("width", 30);

     
}

