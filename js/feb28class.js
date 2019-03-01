
d3.queue()
    .defer(d3.csv, "data/testdata2.csv")
    .defer(d3.json, "data/countries.json")
    .defer(d3.json, "data/usa.json")
    .awaitAll(function(error,dataArray) {
 
    var data = dataArray[0];
    var lookup = dataArray[1];
    var usTopoJSON = dataArray[2];

    data.forEach(function(d) {
        d.export = parseFloat(d.export);
    })
    var latestData = data.filter(function(d) {
        return d.year = "2018";
    });
    var domain = d3.extent(latestData, function(d){
        return d.export;
    })
    var colorScale = d3.scaleLinear()
        .domain(domain)
        .range(["green", "red"])

    console.log("CSV Data loaded: ", data);
    console.log("lookup = ", lookup);
    console.log("usTopoJSON = ", usTopoJSON);
 
    // Convert topoJSON to geoJSON
    var geoJSON = topojson.feature(usTopoJSON, usTopoJSON.objects.states);

    // Remove Alaska
    geoJSON.features = geoJSON.features.filter(function(d) { 
        return d.id != "AK" && d.id != "HI";
    })

    console.log(geoJSON);
    
    var w = window.innerWidth;
    var h = 600;

    // Create a map projection from the geoJSON
    var proj = d3.geoMercator()
        .fitSize([w, h], geoJSON);

    // Create a path from the projection!
    var path = d3.geoPath()
        .projection(proj);
    
    var svg = d3.select("#my-map")
        .attr("width", w + "px")
        .attr("height", h + "px")

    var countries = svg.selectAll("path")
        .data(geoJSON.features);

    countries.enter().append("path")
        .attr("d", function(d) {
            return path(d);
        })
        .attr("stroke", "#FFF")
        .attr("fill", function(feature) {
            var matches = latestData.filter(function(d) {
                return d.state == feature.id.toLowerCase();
            });
            if(matches.length > 0) {
                return colorScale(matches[0].export);
            } else {
                return "rgb(200, 200, 200)";
            }
        });

    // Points drawn on map
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
});