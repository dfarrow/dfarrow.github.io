var data = [0.2, 2.4, 4.7, 3.1];

var xScale = d3.scaleLinear()
            .domain([0,5])
            .range([0, window.innerWidth]);

var firstX = xScale(data[0]);

console.log("firstX",firstX);

var cScale = d3.scaleLinear()
    .domain([0,5])
    .range(["green", "red"]);

console.log("cScale ", cScale);

var svg = d3.select("svg");

var circles = svg.selectAll("circle")
            .data(data);

circles.enter().append("circle")
    .attr("r", 10)
    .attr("fill", function(d) {
        return cScale(d);
    })
    .attr("cx", function(d) {
        return xScale(d);
    })
    .attr("cy", 50);
    
d3.selectAll("circle")
    .on("click", function(d){
        console.log("DATA is " + d);
    })
    .on("mousemove", function(d) {
        var m = d3.mouse(this);
         
        d3.select("#tooltip")
            .html("<h3>" + d + "</h3>")
            .style("display", "block") 
            .style("left", m[0] +"px")
            .style("top", m[1] +"px")
    })
    .on("mouseout", function(d) { 
        d3.select("#tooltip") 
            .style("display", "none") 
    });

    var axis = d3.axisBottom(xScale);
    d3.select("#xAxis").call(axis);