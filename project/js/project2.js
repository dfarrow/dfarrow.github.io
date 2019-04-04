var myTemp;
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

var fnUpdateMapData;
 
var ctFormat = d3.format(".2s"); 
var mapContainerRect = d3.select("#my-map").node().parentNode.getBoundingClientRect();
var w = mapContainerRect.width - 50;
var h = mapContainerRect.height - 10;
var data, usTopoJSON, geoJSON, container, featureValues;
var mapExtent, mapColors;
var currentMapProp = "varHoneyProd"; // Selected radio button to show map data property values (should be ID of radiobutton)

var mapSvg = d3.select("#my-map");
 
var fnCreateLine, fnCreateBar;

d3.queue()
    .defer(d3.csv, "data/vHoneyNeonic_v03.csv") 
    .defer(d3.json, "data/usa.json")
    .awaitAll(function(error,dataArray) {
 
    data = dataArray[0]; 
    usTopoJSON = dataArray[1];
    //console.log(data);   
       
    data.forEach(function(d) {
        d.year = parseInt(d.year);
        if(d.nAllNeonic == NaN || d.nAllNeonic == "") {
            d.nAllNeonic = 0;
        }
        d.nAllNeonic = parseFloat(d.nAllNeonic); 

        if(d.numcol == NaN) {
            d.numcol = 0;
        }
        d.numcol = parseFloat(d.numcol);

        if(d.totalprod == NaN) {
            d.totalprod = 0;
        } 
        d.totalprod = parseFloat(d.totalprod);

        if(d.yieldpercol == NaN) {
            d.yieldpercol = 0;
        } 
        d.yieldpercol = parseFloat(d.yieldpercol);
    });

    totalProdExtent = d3.extent(data.map(function(d){return parseFloat(d.totalprod);}));
    //console.log("totalProdExtent " , totalProdExtent);

    totalProdColors = d3.scaleLinear()
        .domain(totalProdExtent)
        .range(['#FFF9CC', '#bc8600'])
        .interpolate(d3.interpolateHcl); 

    totalNeoExtent = d3.extent(data.map(function(d){return parseFloat(d.nAllNeonic);}));
       console.log("totalNeoExtent " , totalNeoExtent);
    
    totalNeoColors = d3.scaleLinear()
        .domain(totalNeoExtent)
        .range(['#FFFFFF', '#07bf13'])
        .interpolate(d3.interpolateHcl); 
  
    // d3.nest() groups data
    var groupByYear = d3.nest()
        .key(function(d) {
            return d.year;
        })
        .entries(data); 
    
    groupByYear.forEach(function(d) {
        d.totalYearProd = d3.sum(d.values, function(d2) {
            return d2.totalprod;
        });

        d.totalAllNeonic = d3.sum(d.values, function(d4) {
            return d4.nAllNeonic;
        });
        
        d.averageYearProd = d3.mean(d.values, function(d3) {
            return d3.totalprod;
        });

        d.averageAllNeonic = d3.mean(d.values, function(d5) {
            return d5.nAllNeonic;
        });

        d.averageYearYieldPerCol = d3.mean(d.values, function(d6) {
            return d6.yieldpercol;
        });

        d.totalYearNumCol = d3.sum(d.values, function(d7) {
            return d7.numcol;
        });
 

    }); 
  
  

    var groupByStateYear = d3.nest()
        .key(function(d) {
            return d.state;
        })
        .key(function(d) {
            return d.year;
        })
        .entries(data); 
 

    ////////////////////////////////////////////////
    ///// updateMapData() - Updates map on year change
    ////////////////////////////////////////////////

    var mapTab = document.getElementById("map-tab");
    mapTab.addEventListener("click", function() {
        //if(!isLineCreated) {
            //isLineCreated = true;
            
            setTimeout("fnUpdateMapData()", 300); // Call after slight delay to render before height/width
        //}        
    });

    function updateMapData(year, showProp) {
        console.log("Year is " , year);
        if(year == undefined) {
            year = currentYear;
        }
        if(showProp == undefined) {
            showProp = currentMapProp;
        }
        d3.select("#yearInfo").text(year);  
        featureValues = []; // Reset array to hold current year data

        //console.log("updateMapData() " + year)
        var latestData = data.filter(function(d) {
            //console.log("d=", d);
            return d.year == year;
        }); 

        var yearData = groupByYear.filter(obj => {
            return obj.key == year.toString();
          });
     
  
        // SET MAP PROPERTY DISPLAY  
        if(showProp == "varHoneyProd") {
            d3.select(".propLabel1").text("Total Production (lbs)");
            d3.select(".propLabel2").text("Avg Production (lbs)");
            d3.select("#totalProdInfo").text(ctFormat(yearData[0].totalYearProd));   
            d3.select("#avgProdInfo").text(ctFormat(yearData[0].averageYearProd));
            
            mapExtent = totalProdExtent;
            mapColors = totalProdColors;
        }

        if(showProp == "varNeonic") {
            d3.select(".propLabel1").text("Total Neonicotinoids (kg)");
            d3.select(".propLabel2").text("Avg Neonicotinoids (kg)");
            d3.select("#totalProdInfo").text(ctFormat(yearData[0].totalAllNeonic));   
            d3.select("#avgProdInfo").text(ctFormat(yearData[0].averageAllNeonic));
            mapExtent = totalNeoExtent;
            mapColors = totalNeoColors;
        }
 
        // First time setup code only runs once
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
         
            mapSvg = d3.select("#my-map")
                .attr("width", w + "px")
                .attr("height", h + "px")
            /*
            var states = svg.selectAll("path")
                .data(geoJSON.features);
            */
           
                
            // Create a container for the map
            states = mapSvg.append("g")
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
        
        
        createLegend(mapSvg);

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

            var totalAllNeonic = 0;
            if(myDataRow[0] != undefined) {
                totalAllNeonic = myDataRow[0].nAllNeonic; // Get total honey production
            }
            
            var dataObj = {"name": stateAbbr, "totalprod": totalProdValue, "totalAllNeonic": totalAllNeonic, "state": stateAbbr}; 
            featureValues.push(dataObj); 
        }); 
        
        // Create the map 
        states.selectAll("path") 
            .each(function (d, i) { 
                // Add information for display 
                var area = d.id.toLowerCase();
                 
                // Find the matching key in the list and get the value
                var found = featureValues.find(function(element) {
                    return element.name.toLowerCase() == area.toLowerCase();
                });
                var infoString = "";
                var showVal = 0;
                var myPath = d3.select(this); 
                //console.log(found);
                if(showProp == "varHoneyProd") {
                    // Color the shape and store the value in an attribute
                    showVal = found.totalprod;
                    //console.log("varHoneyProd showVal " + showVal);
                    var myColor = mapColors(showVal); 
                    
                    if(showVal == 0) {
                        myColor = "#EEEEEE"; // Show gray if no data
                    } 
                }
                if(showProp == "varNeonic") {
                    // Color the shape and store the value in an attribute
                    showVal = found.totalAllNeonic;
                    //console.log("varNeonic showVal " + showVal);
                    var myColor = mapColors(showVal);  
                }
                
                
                myPath.style("fill", myColor);
                myPath.attr("feature-value", showVal);  
                infoString = area + "<br>Value: " + showVal;

                // Set title for displaying info on hover
                myPath.attr("title", infoString);
                
                myPath.text(function(d, infoString) { return infoString; })
                .on("mouseenter", function(d){
                    
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

                    // CHANGE BASED ON PROPERTY
                    if(currentMapProp == "varHoneyProd") {
                        var infoString = area + "<br>Total Honey Production: " + ctFormat(myVal); 
                    }

                    if(currentMapProp == "varNeonic") {
                        var infoString = area + "<br>Total Neonicotinoid Use: " + ctFormat(myVal); 
                    }

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
        
    } // End "updateMapData()"...
    
    updateMapData(currentYear, currentMapProp);

    fnUpdateMapData = updateMapData;

    // Set up Year Slider
    var rngYear = document.getElementById("rangeYear");
    rngYear.addEventListener("change", handleSlider, false);
    rngYear.addEventListener("input", handleSlider, false);

    function handleSlider() { 
            currentYear = rngYear.value; 
            updateMapData(currentYear, currentMapProp); 
    }

    // Set up property radio buttons
    var radioButtons = d3.selectAll("input[name='mapProp']").on("change", function(){
      
        currentMapProp = this.id;
        
        if(d3.select("#map").style("display") == "block") {
            // bar chart shown
            updateMapData(currentYear, currentMapProp); 
        }

        if(d3.select("#bar").style("display") == "block") {
            // bar chart shown
            createBarChart();
        }

        if(d3.select("#line").style("display") == "block") {
            // bar chart shown
            createLineChart();
        }
        /*
        if(d3.select("#stateline").style("display") == "block") {
            // bar chart shown
            createStateLineChart();
        }*/
        
    });

    function createLegend(mySvg) {
        
        // TODO : Check for existing legend
        var wKey = 300, hKey = 50;
        d3.select(".legendContainer").remove();

        var myKey = mySvg.append("g")  
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
            .attr("stop-color", mapColors.range()[0])
            .attr("stop-opacity", 1);
  
          legend.append("stop")
            .attr("offset", "100%")
            .attr("stop-color", mapColors.range()[1])
            .attr("stop-opacity", 1);
      
          myKey.append("rect")
            .attr("width", wKey)
            .attr("height", hKey - 30)
            .style("fill", "url(#gradient)")
            .attr("transform", "translate(10,10)"); 
          var y = d3.scaleLinear()
            .range([0,300])
            .domain(mapExtent);
      
          var yAxis = d3.axisBottom()
            .scale(y)
            .ticks(5)
            .tickFormat(function(d) {
                return ctFormat(d)
            });

          var keyLabel = "Honey Production (lbs)";
          if(currentMapProp == "varNeonic") {
            keyLabel = "Neonicotinoid Use (kg)";
          }

          myKey.append("g")
            .attr("class", "y axis")
            .attr("transform", "translate(10,30)")
            .call(yAxis)
            .append("g")
            .attr("transform", "translate(50,-28)")
            .append("text")
            //.attr("transform", "rotate(-90)")
            //.attr("y", 0)
            //.attr("dy", ".71em")
            //.style("text-anchor", "left")
            .text(keyLabel);
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

    // END OF MAP

    ///////////////////////////////////////////////////////////////////
    ///////////////////////////////////////////////////////////////////
    // LINE CHART   
    
    var isLineCreated = false;
    var lineTab = document.getElementById("line-tab");
    lineTab.addEventListener("click", function() {
        //if(!isLineCreated) {
            //isLineCreated = true;
            d3.select("#bar").style("visibility","hidden");
            setTimeout("fnCreateLine()", 300); // Call after slight delay to render before height/width
        //}        
    });

    function createLineChart() {
        
        d3.select("#line-container").html("");
        d3.select("#bar").style("visibility","visible");
        var lineContainer = d3.select("#line-container");
        var wLine = lineContainer.node().getClientRects()[0].width;
        var hLine = lineContainer.node().getClientRects()[0].height;
 
        //var wLine = 920;
        //var hLine = 500; 


        // set the dimensions and margins of the graph
        var marginBar = {top: 20, right: 20, bottom: 60, left: 45},
        width = wLine - marginBar.left - marginBar.right,
        height = hLine - marginBar.top - marginBar.bottom;

        var parseTime = d3.timeParse("%yyyy");
 
        // set the ranges
        var x = d3.scaleLinear().range([0, width]);
        var y = d3.scaleLinear().range([height, 0]);

        var lineData = groupByYear;

        lineData.forEach(function(d) {
            d.year = parseInt(d.key);
            d.displayYear = parseTime(d.key); 
        });

        lineData.sort(function(x, y){
            return d3.ascending(x.year, y.year);
         })
        console.log("lineData", lineData);

        var valueline;
        var lineColor;
        if(currentMapProp == "varHoneyProd") {
        // define the line
            valueline = d3.line()
            .x(function(d) { return x(d.year); })
            .y(function(d) { return y(d.totalYearProd); });

             y.domain([0, d3.max(lineData, function(d) { return d.totalYearProd; })]);
             lineColor = "#bc8600";
        }

        if(currentMapProp == "varNeonic") {
            valueline = d3.line()
            .x(function(d) { return x(d.year); })
            .y(function(d) { return y(d.totalAllNeonic); });

            y.domain([0, d3.max(lineData, function(d) { return d.totalAllNeonic; })]);
            lineColor = "#00FF00";
        }
        // append the svg obgect to the body of the page
        // appends a 'group' element to 'svg'
        // moves the 'group' element to the top left margin
        var svg2 = lineContainer.append("svg")
        .attr("width", width + marginBar.left + marginBar.right)
        .attr("height", height + marginBar.top + marginBar.bottom)
        .append("g")
        .attr("transform",
            "translate(" + marginBar.left + "," + marginBar.top + ")");
        // Scale the range of the data
        x.domain(d3.extent(lineData, function(d) { return d.year; }));
       
        console.log("+++++++++++++++++++++++++++");
        console.log("LINE CHART passing this data to line function" , lineData)
        console.log("+++++++++++++++++++++++++++");
        // Add the valueline path.
        svg2.append("path")
        .data([lineData])
        .attr("class", "line")
        .attr('stroke', lineColor) 
        .attr("fill", "none")
        .attr("d", valueline);
 

        console.log("=========================================== LINE CHART");
        console.log("Graphing 'lineData' ", lineData);
        console.log("LINE valueline = " , valueline);

        console.log("add X axis");
        // Add the X Axis
        svg2.append("g")
        .attr("transform", "translate(0," + height + ")") 
        .call(d3.axisBottom(x)
            .tickFormat(d3.format("d"))
            ) ;

        console.log("add Y axis");
        // Add the Y Axis
        svg2.append("g")
        .call(d3.axisLeft(y)
            .tickFormat(ctFormat)
        );
    }
    
    
    fnCreateLine = createLineChart; // store this function in a global var for calling via settimeout

    /////////////////////////////////////////////
    /////////////////////////////////////////////
    /////////////////////////////////////////////
    // Bar Chart 

    var isBarCreated = false;
    var barTab = document.getElementById("bar-tab");
    barTab.addEventListener("click", function() {
        //if(!isBarCreated) {
           // isBarCreated = true;
           d3.select("#bar").style("visibility","hidden");
            setTimeout("fnCreateBar()", 300); // Call after slight delay to render before height/width
        //}        
    });


    function createBarChart() {
        d3.select("#bar").style("visibility", "visible");
        d3.select("#bar-container").html("");
        var barContainer = d3.select("#bar-container");
        var width = barContainer.node().getClientRects()[0].width;
        var height = barContainer.node().getClientRects()[0].height;
        // set the dimensions and margins of the graph
        var margin = {top: 20, right: 20, bottom: 60, left: 45},
        width = width - margin.left - margin.right,
        height = height - margin.top - margin.bottom;

        // set the ranges
        var x = d3.scaleBand()
            .range([0, width])
            .padding(0.1);
        var y = d3.scaleLinear()
            .range([height, 0]);
            
        // append the svg object to the body of the page
        // append a 'group' element to 'svg'
        // moves the 'group' element to the top left margin
        var svg3 = barContainer.append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .append("g")
        .attr("transform", 
            "translate(" + margin.left + "," + margin.top + ")");

        var barData = groupByYear;
        // format the data
        barData.forEach(function(d) {            
            d.year = parseInt(d.key);
            //d.displayYear = parseTime(d.key); 
            d.totalYearProd = d.totalYearProd;
            d.totalAllNeonic = d.totalAllNeonic;
        });

         
        barData.sort(function(x, y){
            return d3.ascending(x.year, y.year);
        })

        console.log("barData = ", barData);

        var valueBar;
        var barColor;
        var yVal;
        if(currentMapProp == "varHoneyProd") {
        // define the line
            valueBar = d3.line()
            .x(function(d) { return x(d.year); })
            .y(function(d) { return y(d.totalYearProd); });

            y.domain([0, d3.max(barData, function(d) { return d.totalYearProd; })]);
            barColor = "#bc8600";
            
        
        }

        if(currentMapProp == "varNeonic") {
            valueBar = d3.line()
            .x(function(d) { return x(d.year); })
            .y(function(d) { return y(d.totalAllNeonic); });

            y.domain([0, d3.max(barData, function(d) { return d.totalAllNeonic; })]);
            barColor = "#00FF00";
        }

        // Scale the range of the data in the domains
        x.domain(barData.map(function(d) { return d.year; }));
        
        
        // append the rectangles for the bar chart
        svg3.selectAll(".bar")
        .data(barData)
        .enter().append("rect")
        .attr("class", "bar")
        .attr("fill", barColor)
        .attr("x", function(d) { return x(d.year); })
        .attr("width", x.bandwidth())
        .attr("y", function(d) { 
                if(currentMapProp == "varHoneyProd") {
                    return y(d.totalYearProd); 
                }
                if(currentMapProp == "varNeonic") {
                    return y(d.totalAllNeonic); 
                }
            })
        .attr("height", function(d) { 
                if(currentMapProp == "varHoneyProd") {
                    return height - y(d.totalYearProd); 
                }
                if(currentMapProp == "varNeonic") {
                    return height - y(d.totalAllNeonic); 
                }
        });

        // add the x Axis
        svg3.append("g")
        .attr("transform", "translate(0," + height + ")")
        .call(d3.axisBottom(x)
        
            .tickFormat(d3.format("d"))
            );

        // add the y Axis
        svg3.append("g")
        .call(d3.axisLeft(y)
            .tickFormat(ctFormat)
        );
 

    }

    fnCreateBar = createBarChart; // store this function in a global var for calling via settimeout



    // END OF BAR CHART CODE

    ///////////////////////////////////////////
    ///////////////////////////////////////////
    ///////////////////////////////////////////
    // START OF STATE CHART CODE
    var isStateCreated = false;
    var stateTab = document.getElementById("state-tab");
    stateTab.addEventListener("click", function() {
        if(!isStateCreated) {
            isStateCreated = true;
            setTimeout("fnCreateState()", 300); // Call after slight delay to render before height/width
        }        
    });

    function createStateChart() {
        
        var stateContainer = d3.select("#state-container");
        var wLine = stateContainer.node().getClientRects()[0].width;
        var hLine = stateContainer.node().getClientRects()[0].height;

        console.log("wLine = " + wLine);
        //var wLine = 920;
        //var hLine = 500; 


        // set the dimensions and margins of the graph
        var marginBar = {top: 20, right: 20, bottom: 60, left: 45},
        width = wLine - marginBar.left - marginBar.right,
        height = hLine - marginBar.top - marginBar.bottom;

        var parseTime = d3.timeParse("%yyyy");
 
        // set the ranges
        var x = d3.scaleLinear().range([0, width]);
        var y = d3.scaleLinear().range([height, 0]);

        console.log("groupByStateYear = ", groupByStateYear);/*
        groupByStateYear.values.sort(function(x, y){
            return d3.ascending(x.year, y.year);
         }) */

         var stateLineData = [];
         var valueLineData = [];
         console.log("==================================");
         console.log("STATE DATA -----------------------"); 
         console.log("==================================");
         
        groupByStateYear.forEach(function(d)  {
            //console.log("-----------------------------");
            //console.log("d data", d);
            var lineData = d.values;
           
           /* console.log("---");
            console.log("lineData = ", lineData);
            console.log("--year " + lineData.key);
            console.log("--state " + lineData.values[0].state);
            console.log("--totalprod " + lineData.values[0].totalprod); */
            //console.log("!!!!!!!!!!!!!!!!!!!!!!!! lineData length ", lineData.length);
            var graphData = [];
            for(var c=0; c<lineData.length; c++) {
                var tp = lineData[c].values[0].totalprod;
                if(parseFloat(tp) == NaN) {
                    tp = 0;
                }
                var yearData = {year: parseInt(lineData[c].key), state: lineData[c].values[0].state, totalprod: tp};
                
                graphData.push(yearData);
            }

            // Sort by year
            graphData.sort(function(x, y){
                return d3.ascending(x.year, y.year);
             });

            stateLineData.push(graphData);
           // console.log("++++++++++++++++++++++++++++++++++++++");
           // console.log("--- " + d.key);
            //console.log(lineData);
            var valueLine = d3.line()
                .x(function(d) { return x(d.year); })
                .y(function(d) { if(parseFloat(d.totalprod) == NaN) d.totalprod = 0;   return y(d.totalprod); });
          //  console.log("---");
           // console.log(valueLine);
            valueLineData.push(valueLine);
        });

        //console.log("stateLineData " , stateLineData);
         
        /*
        var lineData = groupByYear;

        lineData.forEach(function(d) {
            d.year = parseInt(d.key);
            d.displayYear = parseTime(d.key); 
        });

        lineData.sort(function(x, y){
            return d3.ascending(x.year, y.year);
         })
        console.log("lineData", lineData);

        
        
        lineData.forEach(function(d) {
            console.log("d=", d.values); 
        });
        */
        

      

        // append the svg obgect to the body of the page
        // appends a 'group' element to 'svg'
        // moves the 'group' element to the top left margin
        var svg4 = stateContainer.append("svg")
        .attr("width", width + marginBar.left + marginBar.right)
        .attr("height", height + marginBar.top + marginBar.bottom)
        .append("g")
        .attr("transform",
            "translate(" + marginBar.left + "," + marginBar.top + ")");

        var prodDomain = [
            d3.min(stateLineData, function(c) { return d3.min(c, function(v) { return v.totalprod; }); }),
            d3.max(stateLineData, function(c) { return d3.max(c, function(v) { return v.totalprod; }); })
            ];
        console.log("MAX OF ALL STATE TOTALPROD = ", prodDomain);
        
        // Scale the range of the data
        x.domain(d3.extent(stateLineData[0], function(d) { return d.year; }));
        y.domain(prodDomain);
      
        // Add the valueline path.
        
        svg4.append("path")
        .data([stateLineData[0]])
        .attr("class", "line")
        .attr('stroke', "#bc8600") 
        .attr("fill", "none")
        .attr("d", valueLineData[0]);  

        //console.log("=========================================== STATE LINE CHART");
        //console.log("Graphing 'stateLineData[0]' ", stateLineData[0]);
       // console.log("LINE valueline = " , valueLineData[0]);

        var colorScale = d3.scaleSequential(d3["interpolateRainbow"])
            .domain([0, width]);

        var stateColors1 = d3.schemeCategory20;
        var stateColors2 = d3.schemeCategory20b;
        var stateColors3 = d3.schemeCategory20c;
        stateColors1=  stateColors1.concat(stateColors2, stateColors3)
        console.log("stateColors length " + stateColors1.length);

        var stateColors = d3.scaleOrdinal(stateColors1);

        stateLineData.forEach(function(d, i)  {
            var lineData = d;
           // console.log(lineData);
            var infoString = "State: " + d[0].state;
            svg4.append("path")
            .data([lineData])
            .attr("class", "line")
            .style("stroke", function(d) { // Add dynamically
               // console.log("d", d);
                return d.color = stateColors(d[0].state); })
            .attr("fill", "none")
            .on("mouseenter", function(d){
                var infoString = "State: " + d[0].state;; 
                tooltip.html(infoString); 
                return tooltip.style("display", "block");
            })
            .on("movemove", function(d){
                var infoString = "State: " + d[0].state;; 
                tooltip.html(infoString); 
                return tooltip.style("display", "block");
            })
            .on("mousemove", function(){
                return tooltip.style("top", (d3.event.pageY-45)+"px").style("left",(d3.event.pageX+30)+"px");
            })
            .on("mouseout", function(){ 
                    return tooltip.style("display", "none");v
            })
            .attr("d", valueLineData[i]); 
        });
        
        console.log("add X axis");
        // Add the X Axis
        svg4.append("g")
        .attr("transform", "translate(0," + height + ")") 
        .call(d3.axisBottom(x)
             .tickFormat(d3.format("d"))
            ) ;

        console.log("add Y axis");
        // Add the Y Axis
        svg4.append("g")
        .call(d3.axisLeft(y)
            .tickFormat(ctFormat)
        );
    }

    fnCreateState = createStateChart; // store this function in a global var for calling via settimeout



    // END OF STATE CHART CODE

});