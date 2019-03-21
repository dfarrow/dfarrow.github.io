
var currentYear = 1991;
var isSetup = false;
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
var w = mapContainerRect.width - 50;
var h = mapContainerRect.height - 10;
var data, usTopoJSON, geoJSON, container, featureValues;

d3.queue()
    .defer(d3.csv, "data/vHoneyNeonic_v03.csv") 
    .defer(d3.json, "data/usa.json")
    .awaitAll(function(error,dataArray) {
 
    data = dataArray[0]; 
    usTopoJSON = dataArray[1];
    //console.log(data);   
       
    data.forEach(function(d) {
        d.year = parseInt(d.year);
        d.nAllNeonic = parseFloat(d.nAllNeonic);
        d.numcol = parseFloat(d.numcol);
        d.totalprod = parseFloat(d.totalprod);
        d.yieldpercol = parseFloat(d.yieldpercol);
    });

    totalProdExtent = d3.extent(data.map(function(d){return parseFloat(d.totalprod);}));
    //console.log("totalProdExtent " , totalProdExtent);

    totalProdColors = d3.scaleLinear()
        .domain(totalProdExtent)
        .range(['#FFF9CC', '#bc8600'])
        .interpolate(d3.interpolateHcl); 

    // d3.nest() groups data
    var groupByYear = d3.nest()
        .key(function(d) {
            return d.year;
        })
        .entries(data);
    //console.log(groupByYear);
    
    groupByYear.forEach(function(d) {
        d.totalYearProd = d3.sum(d.values, function(d2) {
            return d2.totalprod;
        });
        d.averageYearProd = d3.mean(d.values, function(d3) {
            return d3.totalprod;
        });
    }); 
  
 
////////////////////////////////////////////////
////////////////////////////////////////////////
////////////////////////////////////////////////
    function updateMapData(year) {
        d3.select("#yearInfo").text(year); 

        featureValues = []; // Reset array to hold current year data

        //console.log("updateMapData() " + year)
        var latestData = data.filter(function(d) {
            //console.log("d=", d);
            return d.year == year;
        }); 

        var yearData = groupByYear.filter(obj => {
            return obj.key == year.toString();
          }) 
        
        var ctFormat = d3.format(".2s");
        d3.select("#totalProdInfo").text(ctFormat(yearData[0].totalYearProd));   
        d3.select("#avgProdInfo").text(ctFormat(yearData[0].averageYearProd));
 
        // First time setup code
        if(!isSetup) { 
 
            // Convert topoJSON to geoJSON
            geoJSON = topojson.feature(usTopoJSON, usTopoJSON.objects.states);
        
            // Remove Alaska and Hawaii
            geoJSON.features = geoJSON.features.filter(function(d) { 
                return d.id != "AK" && d.id != "HI" && d.id != "PR";
            });
 
            // Create a map projection from the geoJSON
            var proj = d3.geoMercator()
            .fitSize([w, h], geoJSON);

            // Create a path from the projection!
            var path = d3.geoPath()
                .projection(proj);
        
        
            var svg = d3.select("#my-map")
                .attr("width", w + "px")
                .attr("height", h + "px")
            /*
            var states = svg.selectAll("path")
                .data(geoJSON.features);
            */
           var wKey = 300, hKey = 50;

           var myKey = svg.append("g")  
            .attr("class","legendContainer")
            .attr("fill", "blue")
            .attr("stroke", "gray")
            .style("pointer-events", "all") 
            .attr("width", wKey)
            .attr("height", hKey)
            .attr("transform", "translate(0," + (h - hKey) + ")");

            var legend = myKey.append("defs")
            .append("svg:linearGradient")
            .attr("id", "gradient")
            .attr("x1", "0%")
            .attr("y1", "100%")
            .attr("x2", "100%")
            .attr("y2", "100%")
            .attr("spreadMethod", "pad");
      
          legend.append("stop")
            .attr("offset", "0%")
            .attr("stop-color", "#FFF9CC")
            .attr("stop-opacity", 1);
  
          legend.append("stop")
            .attr("offset", "100%")
            .attr("stop-color", "#bc8600")
            .attr("stop-opacity", 1);
      
          myKey.append("rect")
            .attr("width", wKey)
            .attr("height", hKey - 30)
            .style("fill", "url(#gradient)")
            .attr("transform", "translate(10,10)"); 
          var y = d3.scaleLinear()
            .range([0,300])
            .domain(totalProdExtent);
      
          var yAxis = d3.axisBottom()
            .scale(y)
            .ticks(5)
            .tickFormat(function(d) {
                return d3.format(".2s")(d)
            });
      
          myKey.append("g")
            .attr("class", "y axis")
            .attr("transform", "translate(10,30)")
            .call(yAxis)
            .append("g")
            .attr("transform", "translate(50,40)")
            .append("text")
            //.attr("transform", "rotate(-90)")
            //.attr("y", 0)
            //.attr("dy", ".71em")
            //.style("text-anchor", "left")
            .text("Honey Production (lbs)");
                
            // Create a container for the map
            states = svg.append("g")
                .style("pointer-events", "all");

            //Bind data and create one path per GeoJSON feature
            states.selectAll("path")
                .data(geoJSON.features)                   
                // .call(drag)   
                .enter()
                .append("path")
                .attr("d", path) 
                .attr("class", "feature");
            
            
            isSetup = true;
        } // End if(!isSetup) {...
      
        // Get the featureValues collection of data for the current year 
        $.each(geoJSON.features, function(key, value) { 
            //console.log("value = ", value);
            var stateAbbr = value.id;
            
            var myDataRow = latestData.filter(obj => {
                return obj.state == stateAbbr;
            })

            var totalProdValue = 0;
            if(myDataRow[0] != undefined) {
                totalProdValue = myDataRow[0].totalprod; // Get total honey production
            }
            
            var dataObj = {"name": stateAbbr, "totalprod": totalProdValue, "state": stateAbbr}; 
            featureValues.push(dataObj); 
        });
        //console.log("featureValues ", featureValues);
    
        // Create the map

        states.selectAll("path") 
                  .each(function (d, i) { 
                      // Add information for display
                      //console.log(d);
                      var area = d.id.toLowerCase();
                      
                      //console.log("AREA = " + area);
                       
                      // Find the matching key in the list and get the value
                      var found = featureValues.find(function(element) {
                        return element.name.toLowerCase() == area.toLowerCase();
                      });
                       
                      // Color the shape and store the value in an attribute
                      var totalprod = found.totalprod;
                      var myColor = totalProdColors(totalprod);  
                      if(totalprod == 0) {
                        myColor = "#CCCCCC";
                      }

                      //console.log("AREA = " + area + " color " + myColor);
                      var myPath = d3.select(this); 
                      myPath.style("fill", myColor);
                      myPath.attr("feature-value", totalprod);
                       
                      var infoString = area + "<br>Value: " + totalprod;
                      // Set title for displaying info on hover
                      myPath.attr("title", infoString);
                      
                      myPath.text(function(d, infoString) { return infoString; })
                        .on("mouseenter", function(d, infoString){
                           
                            var area = d.id; 
                                                       
                            // Highglight this bad boy
                            $(this).addClass("highLight");
                            /*                                
                            if(!isIE11) {
                                    // Move the path to the front so the stroke in on top...
                                    // But if it is IE 11 don't do this because it messes up the "mouseout" event
                                    myPath.moveToFront();
                            }
                            */
                            var myVal = myPath.attr("feature-value");
                            var infoString = area + "<br>Total Honey Production: " + d3.format(".2s")(myVal); ;
                            tooltip.html(infoString); 
                            return tooltip.style("display", "block");
                            
                            })
                        .on("mousemove", function(){
                            return tooltip.style("top", (d3.event.pageY-45)+"px").style("left",(d3.event.pageX+30)+"px");
                            })
                        .on("mouseout", function(){
                                // This "mouseout" event doesn't fire in IE 11 from the <path> element in the map for some reason
                                $(this).removeClass("highLight");
                                return tooltip.style("display", "none");v
                            }); 
                        });
               

        /*
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
            }); */
        
    }
    
    updateMapData(currentYear);

    // Set up Year Slider
    var rngYear = document.getElementById("rangeYear");
    rngYear.addEventListener("change", handleSlider, false);
    rngYear.addEventListener("input", handleSlider, false);
    function handleSlider() {
        
            currentYear = rngYear.value; 
            updateMapData(currentYear);
    
         
    }
            
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