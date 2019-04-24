
var currentYear = 1995;
// Hover info panel
var tooltip = d3.select("body")
.append("div")
.style("position", "absolute")
.style("z-index", "10")
.style("display", "none") 
.attr("class", " arrow_box shadow")
.style("background", "#FFF")
.text("a simple tooltip");
 
var mapContainerRect = d3.select("#my-map").node().parentNode.getBoundingClientRect();
var w = mapContainerRect.width - 10;
var h = mapContainerRect.height - 10;
var data, usTopoJSON;

d3.queue()
    .defer(d3.csv, "data/vHoneyNeonic_v03.csv") 
    .defer(d3.json, "data/usa.json")
    .awaitAll(function(error,dataArray) {
 
    data = dataArray[0]; 
    usTopoJSON = dataArray[1];
    console.log(data);   
       
    data.forEach(function(d) {
        d.year = parseInt(d.year);
        d.nAllNeonic = parseFloat(d.nAllNeonic);
        d.numcol = parseFloat(d.numcol);
        d.totalprod = parseFloat(d.totalprod);
        d.yieldpercol = parseFloat(d.yieldpercol);
    })  

    function updateMapData(year) {
        console.log("updateMapData() " + year)
        var latestData = data.filter(function(d) {
            //console.log("d=", d);
            return d.year == year;
        });

        console.log("updateMapData() ", latestData)
        var domain = d3.extent(latestData, function(d){
            return d.totalprod;
        })
        var colorScale = d3.scaleLinear()
            .domain(domain)
            .range(["#f9e2a2", "#d3ad44"])
      
        // Convert topoJSON to geoJSON
        var geoJSON = topojson.feature(usTopoJSON, usTopoJSON.objects.states);
    
        // Remove Alaska and Hawaii
        geoJSON.features = geoJSON.features.filter(function(d) { 
            return d.id != "AK" && d.id != "HI" && d.id != "PR";
        })
      
        // Create a map projection from the geoJSON
        var proj = d3.geoMercator()
            .fitSize([w, h], geoJSON);
    
        // Create a path from the projection!
        var path = d3.geoPath()
            .projection(proj);
     
        var svg = d3.select("#my-map")
            .attr("width", w + "px")
            .attr("height", h + "px")
    
        var states = svg.selectAll("path")
            .data(geoJSON.features);
    
        // Create the map
        states.enter().append("path")
            .attr("d", function(d) {
                return path(d);
            })
            .attr("stroke", "#FFF")
            .attr("fill", function(feature) {
                var matches = latestData.filter(function(d) { 
                    return d.state.toLowerCase() == feature.id.toLowerCase();
                });
                if(matches.length > 0) {
                    return colorScale(matches[0].totalprod);
                } else {
                    return "rgb(200, 200, 200)";
                }
            })
            .on("mouseenter", function(feature, infoString){
                var matches = latestData.filter(function(d) { 
                    return d.state.toLowerCase() == feature.id.toLowerCase();
                });
                var infoString = "";
                if(matches.length > 0) {
                    infoString = matches[0].state + ": " + matches[0].totalprod; 
                } 
                tooltip.html(infoString); 
                return tooltip.style("display", "block");
            })
            .on("mousemove", function(){
                return tooltip.style("top", (d3.event.pageY-45)+"px").style("left",(d3.event.pageX+30)+"px");
                })
            .on("mouseout", function(){
                    // This "mouseout" event doesn't fire in IE 11 from the <path> element in the map for some reason
                    return tooltip.style("display", "none");v
            });
        
    }
    
    updateMapData(currentYear);

    // Set up Year Slider
    var rngYear = document.getElementById("rangeYear");
    rngYear.addEventListener("change", function() {
        
        currentYear = rngYear.value;
        document.getElementById("yearInfo").textContent = currentYear;
        updateMapData(currentYear);

    }, false);
            
    // Points drawn on map
    /*
    var pointData = [
        {name: "Boston", "coords": [-71.0589, 42.3601]},
        {name: "NY", "coords": [-74.0060, 40.7128]},
        {name: "LA", "coords": [-118.2437, 34.0522]}
    ]

    var cities = svg.selectAll("circle")
        .data(pointData);
    
    cities.enter().append("circle")
        .attr("transform", function(d) {
            return "translate(" + proj(d.coords) + ")";
        })
        .attr("r", 7)
        .attr("fill", "blue");
        */
});