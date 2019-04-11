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
var myLine, myBar, myStateline;
var fnCreateLine, fnCreateBar;

var svg2, svg3, svg4;

d3.queue()
    .defer(d3.csv, "data/vHoneyNeonic_v03.csv")
    .defer(d3.json, "data/usa.json")
    .awaitAll(function (error, dataArray) {

        data = dataArray[0];
        usTopoJSON = dataArray[1];
        //console.log(data);   

        data.forEach(function (d) {
            d.year = parseInt(d.year);
            if (d.nAllNeonic == NaN || d.nAllNeonic == "") {
                d.nAllNeonic = 0;
            }
            d.nAllNeonic = parseFloat(d.nAllNeonic);

            if (d.numcol == NaN) {
                d.numcol = 0;
            }
            d.numcol = parseFloat(d.numcol);

            if (d.totalprod == NaN) {
                d.totalprod = 0;
            }
            d.totalprod = parseFloat(d.totalprod);

            if (d.yieldpercol == NaN) {
                d.yieldpercol = 0;
            }
            d.yieldpercol = parseFloat(d.yieldpercol);
        });

        totalProdExtent = d3.extent(data.map(function (d) { return parseFloat(d.totalprod); }));
        //console.log("totalProdExtent " , totalProdExtent);

        totalProdColors = d3.scaleLinear()
            .domain(totalProdExtent)
            .range(['#FFF9CC', '#bc8600'])
            .interpolate(d3.interpolateHcl);

        totalNeoExtent = d3.extent(data.map(function (d) { return parseFloat(d.nAllNeonic); }));
        console.log("totalNeoExtent ", totalNeoExtent);

        totalNeoColors = d3.scaleLinear()
            .domain(totalNeoExtent)
            .range(['#FFFFFF', '#07bf13'])
            .interpolate(d3.interpolateHcl);

        // d3.nest() groups data
        var groupByYear = d3.nest()
            .key(function (d) {
                return d.year;
            })
            .entries(data);

        
        groupByYear.sort(function (x, y) {
            return d3.ascending(x.key, y.key);
        })

        groupByYear.forEach(function (d) {
            d.totalYearProd = d3.sum(d.values, function (d2) {
                return d2.totalprod;
            });

            d.totalAllNeonic = d3.sum(d.values, function (d4) {
                return d4.nAllNeonic;
            });

            d.averageYearProd = d3.mean(d.values, function (d3) {
                return d3.totalprod;
            });

            d.averageAllNeonic = d3.mean(d.values, function (d5) {
                return d5.nAllNeonic;
            });

            d.averageYearYieldPerCol = d3.mean(d.values, function (d6) {
                return d6.yieldpercol;
            });

            d.totalYearNumCol = d3.sum(d.values, function (d7) {
                return d7.numcol;
            });

        });

        d3.select("#rangeYear")
            .attr("min", groupByYear[0].key) 
            .attr("max", groupByYear[groupByYear.length-1].key )

        myTicks = d3.select("#tickmarks");
        groupByYear.forEach(function(d, i) {
            myTicks.append("option")
            .attr("value", d.key)
            .html( d.key)
        });


        var groupByStateYear = d3.nest()
            .key(function (d) {
                return d.state;
            })
            .key(function (d) {
                return d.year;
            })
            .entries(data);

        var groupByState = d3.nest()
            .key(function (d) {
                return d.state;
            })
            .entries(data);

        groupByState.forEach(function (d) {
            d.totalStateProd = d3.sum(d.values, function (d2) {
                return d2.totalprod;
            });

            d.totalStateNeonic = d3.sum(d.values, function (d4) {
                return d4.nAllNeonic;
            });
        });

        groupByState.sort(function (x, y) {
            return d3.descending(x.totalStateProd, y.totalStateProd);
        });

    

        ////////////////////////////////////////////////
        ///// updateMapData() - Updates map on year change
        ////////////////////////////////////////////////

        var mapTab = document.getElementById("map-tab");
        mapTab.addEventListener("click", function () {
            //if(!isLineCreated) {
            //isLineCreated = true;

            setTimeout("fnUpdateMapData()", 300); // Call after slight delay to render before height/width
            //}        
        });

        function updateMapData(year, showProp) {
            console.log("Year is ", year);
            if (year == undefined) {
                year = currentYear;
            }
            if (showProp == undefined) {
                showProp = currentMapProp;
            }
            d3.select("#yearInfo").text(year);
            featureValues = []; // Reset array to hold current year data

            //console.log("updateMapData() " + year)
            var latestData = data.filter(function (d) {
                //console.log("d=", d);
                return d.year == year;
            });

            var yearData = groupByYear.filter(obj => {
                return obj.key == year.toString();
            });

            // SET MAP PROPERTY DISPLAY  
            if (showProp == "varHoneyProd") {
                d3.select(".propLabel1").text("Total Production (lbs)");
                d3.select(".propLabel2").text("Avg Production (lbs)");
                d3.select("#totalProdInfo").text(ctFormat(yearData[0].totalYearProd));
                d3.select("#avgProdInfo").text(ctFormat(yearData[0].averageYearProd));

                mapExtent = totalProdExtent;
                mapColors = totalProdColors;
            }

            if (showProp == "varNeonic") {
                d3.select(".propLabel1").text("Total Neonicotinoids (kg)");
                d3.select(".propLabel2").text("Avg Neonicotinoids (kg)");
                d3.select("#totalProdInfo").text(ctFormat(yearData[0].totalAllNeonic));
                d3.select("#avgProdInfo").text(ctFormat(yearData[0].averageAllNeonic));
                mapExtent = totalNeoExtent;
                mapColors = totalNeoColors;
            }

            // First time setup code only runs once
            if (!isSetup) {

                // Convert topoJSON to geoJSON
                geoJSON = topojson.feature(usTopoJSON, usTopoJSON.objects.states);

                // Remove Alaska and Hawaii
                geoJSON.features = geoJSON.features.filter(function (d) {
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
            $.each(geoJSON.features, function (key, value) {
                //console.log("value = ", value);
                var stateAbbr = value.id;

                var myDataRow = latestData.filter(obj => {
                    return obj.state == stateAbbr;
                })

                var totalProdValue = 0;
                if (myDataRow[0] != undefined) {
                    totalProdValue = myDataRow[0].totalprod; // Get total honey production
                }

                var totalAllNeonic = 0;
                if (myDataRow[0] != undefined) {
                    totalAllNeonic = myDataRow[0].nAllNeonic; // Get total honey production
                }

                var dataObj = { "name": stateAbbr, "totalprod": totalProdValue, "totalAllNeonic": totalAllNeonic, "state": stateAbbr };
                featureValues.push(dataObj);
            });

            // Create the map 
            states.selectAll("path")
                .each(function (d, i) {
                    // Add information for display 
                    var area = d.id.toLowerCase();

                    // Find the matching key in the list and get the value
                    var found = featureValues.find(function (element) {
                        return element.name.toLowerCase() == area.toLowerCase();
                    });
                    var infoString = "";
                    var showVal = 0;
                    var myPath = d3.select(this);
                    //console.log(found);
                    if (showProp == "varHoneyProd") {
                        // Color the shape and store the value in an attribute
                        showVal = found.totalprod;
                        //console.log("varHoneyProd showVal " + showVal);
                        var myColor = mapColors(showVal);

                        if (showVal == 0) {
                            myColor = "#EEEEEE"; // Show gray if no data
                        }
                    }
                    if (showProp == "varNeonic") {
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

                    myPath.text(function (d, infoString) { return infoString; })
                        .on("mouseenter", function (d) {

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
                            if (currentMapProp == "varHoneyProd") {
                                var infoString = area + "<br>Total Honey Production: " + ctFormat(myVal);
                            }

                            if (currentMapProp == "varNeonic") {
                                var infoString = area + "<br>Total Neonicotinoid Use: " + ctFormat(myVal);
                            }

                            tooltip.html(infoString);
                            return tooltip.style("display", "block");

                        })
                        .on("mousemove", function () {
                            return tooltip.style("top", (d3.event.pageY - 45) + "px").style("left", (d3.event.pageX + 30) + "px");
                        })
                        .on("mouseout", function () {
                            // This "mouseout" event doesn't fire in IE 11 from the <path> element in the map for some reason
                            $(this).removeClass("highLight");
                            return tooltip.style("display", "none"); v
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
        var radioButtons = d3.selectAll("input[name='mapProp']").on("change", function () {

            currentMapProp = this.id;

            if (d3.select("#map").style("display") == "block") {
                // bar chart shown
                updateMapData(currentYear, currentMapProp);
            }

            if (d3.select("#bar").style("display") == "block") {
                // bar chart shown
                createBarChart();
            }

            if (d3.select("#line").style("display") == "block") {
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
                .attr("class", "legendContainer")
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
                .range([0, 300])
                .domain(mapExtent);

            var yAxis = d3.axisBottom()
                .scale(y)
                .ticks(5)
                .tickFormat(function (d) {
                    return ctFormat(d)
                });

            var keyLabel = "Honey Production (lbs)";
            if (currentMapProp == "varNeonic") {
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
        lineTab.addEventListener("click", function () {
            //if(!isLineCreated) {
            //isLineCreated = true;
            //d3.select("#bar").style("visibility", "hidden");
            setTimeout("fnCreateLine()", 300); // Call after slight delay to render before height/width
            //}        
        });

        function createLineChart() {


            var valueline, valueFunc;
            var lineColor, yLabel, dotFuncX, dotFuncY;

            var lineContainer = d3.select("#line-container");
            var wLine = lineContainer.node().getClientRects()[0].width;
            var hLine = lineContainer.node().getClientRects()[0].height;


            // set the dimensions and margins of the graph
            var marginBar = { top: 20, right: 20, bottom: 60, left: 65 };
            var width = wLine - marginBar.left - marginBar.right;
            var height = hLine - marginBar.top - marginBar.bottom;

            // set the ranges
            var x = d3.scaleLinear().range([0, width]);
            var y = d3.scaleLinear().range([height, 0]);


            var parseTime = d3.timeParse("%yyyy");


            var lineData = groupByYear;

            lineData.forEach(function (d) {
                d.year = parseInt(d.key);
                d.displayYear = parseTime(d.key);
            });

            lineData.sort(function (x, y) {
                return d3.ascending(x.year, y.year);
            })
            console.log("lineData", lineData);
            if (!isLineCreated) {
                isLineCreated = true;

                //var wLine = 920;
                //var hLine = 500; 


                // append the svg obgect to the body of the page
                // appends a 'group' element to 'svg'
                // moves the 'group' element to the top left margin
                svg2 = lineContainer.append("svg")
                    .attr("width", width + marginBar.left + marginBar.right)
                    .attr("height", height + marginBar.top + marginBar.bottom)
                    .append("g")
                    .attr("transform",
                        "translate(" + marginBar.left + "," + marginBar.top + ")"); 

            }

            if (currentMapProp == "varHoneyProd") {
                // define the line
                valueline = d3.line()
                    .x(function (d) { return x(d.year); })
                    .y(function (d) { return y(d.totalYearProd); });

                y.domain([0, d3.max(lineData, function (d) { return d.totalYearProd; })]);
                lineColor = "#bc8600";
                yLabel = "Total Honey Production (lbs)";
                dotFuncY = function(d) { return y(d.totalYearProd); }

                valueFunc = function(d) { return ctFormat(d.totalYearProd); }
            }

            if (currentMapProp == "varNeonic") {
                valueline = d3.line()
                    .x(function (d) { return x(d.year); })
                    .y(function (d) { return y(d.totalAllNeonic); });

                y.domain([0, d3.max(lineData, function (d) { return d.totalAllNeonic; })]);
                lineColor = "#00FF00";
                yLabel = "Total Neonic Use (lbs)";
                dotFuncY = function(d) { return y(d.totalAllNeonic); }

                valueFunc = function(d) { return ctFormat(d.totalAllNeonic); }
            }

            // Scale the range of the data
            x.domain(d3.extent(lineData, function (d) { return d.year; }));
 
             /*
            // Create the chart!
            myLine = svg2.selectAll("path")
                .data([lineData])
                .attr("d", valueline)
                .attr("class", "line")
                .attr("stroke", lineColor)
                .attr("fill", "none");

            myLine.enter()
                .append("path")
                .attr("class", "line")
                .attr("stroke", lineColor)
                .attr("fill", "none")
                .attr("d", valueline);

            myLine.exit().transition().remove();
            */

            myLine = svg2.selectAll(".line")
                .data([lineData]);
            
            var myLineEnter = myLine.enter().append("path")
            .attr("fill", "none")
            .attr("class", "line");
            
            var myLineUpdates = myLine.merge(myLineEnter);
            
            myLineUpdates.transition().duration(1500)
            .attr("stroke", lineColor)
            .attr("d", valueline);
            
            myLine.exit().remove();
 
            // Add dots on line
            var myDots = svg2.selectAll(".data-circle")
                .data(lineData);

            var myDotsEnter = myDots
                .enter().append("circle")
                .attr("class", "data-circle") 
                .on("mouseover", function() {
                    d3.select(this)
                        .classed("barHover", true);
                })
                .on("mouseout", function(d){ 
                        barTooltip.style("display", "none");
                        d3.select(this)
                        .classed("barHover", false);
                    });;
            
            var myDotUpdates = myDots.merge(myDotsEnter);

            myDotUpdates            
            .on("mousemove", function(d){
                barTooltip
                .style("left", d3.event.pageX - 40 + "px")
                .style("top", d3.event.pageY - 80 + "px")
                .style("display", "inline-block")
                .attr("r", "8")
                .html((d.year) + "<br>" + valueFunc(d));
            })
            .transition().duration(1500) 
                .attr("fill",lineColor)
                .attr("r", 3)
                .attr("cx", function(d) { return x(d.year); })
                .attr("cy", dotFuncY);
                
            myDots.exit().remove();
                
            // X Axis
            svg2.selectAll(".xAxis").remove();
            // Add the X Axis
            svg2.append("g")
                .attr("class", "xAxis")
                .attr("transform", "translate(0," + height + ")")
                .call(d3.axisBottom(x)
                    .tickFormat(d3.format("d"))
                );

            // Y Axis 
            if (svg2.select(".yAxis")._groups[0][0] != undefined) {
                // Update Y Axis
                svg2.selectAll(".yAxis").transition().duration(1500)
                    .call(d3.axisLeft(y)
                        .tickFormat(ctFormat)
                    );
            } else {
                // Add the Y Axis
                svg2.append("g")
                    .attr("class", "yAxis")
                    .call(d3.axisLeft(y)
                        .tickFormat(ctFormat)
                    );

            }

            svg2.selectAll(".yAxisLabel").remove();
            // now add titles to the axes
            svg2.append("text")
                .attr("class", "yAxisLabel")
                .attr("text-anchor", "middle")  // this makes it easy to centre the text as the transform is applied to the anchor
                .attr("transform", "translate(-45," + (height / 2) + ")rotate(-90)")  // text is drawn off the screen top left, move down and out and rotate
                .text(yLabel);

            svg2.selectAll(".xAxisLabel").remove();
            svg2.append("text")
                .attr("class", "xAxisLabel")
                .attr("text-anchor", "middle")  // this makes it easy to centre the text as the transform is applied to the anchor
                .attr("transform", "translate(" + (width / 2) + "," + (height + (45)) + ")")  // centre below axis
                .text("Year");
        }
 
        fnCreateLine = createLineChart; // store this function in a global var for calling via settimeout
 
        /////////////////////////////////////////////
        /////////////////////////////////////////////
        /////////////////////////////////////////////
        // Bar Chart 

        var isBarCreated = false;
        var barTab = document.getElementById("bar-tab");
        barTab.addEventListener("click", function () {
            //if(!isBarCreated) {
            // isBarCreated = true;
            //d3.select("#bar").style("visibility", "hidden");
            setTimeout("fnCreateBar()", 300); // Call after slight delay to render before height/width
            //}        
        });

        var barTooltip = d3.select("body").append("div").attr("class", "barToolTip");

        function createBarChart() {
           // d3.select("#bar").style("visibility", "visible");
            
            var barContainer = d3.select("#bar-container");
            var width = barContainer.node().getClientRects()[0].width;
            var height = barContainer.node().getClientRects()[0].height;
            // set the dimensions and margins of the graph
            var margin = { top: 20, right: 20, bottom: 60, left: 65 },
                width = width - margin.left - margin.right,
                height = height - margin.top - margin.bottom;

            // set the ranges
            var x = d3.scaleBand()
                .range([0, width])
                .padding(0.1);
            var y = d3.scaleLinear()
                .range([height, 0]);

            if (!isBarCreated) {
                isBarCreated = true;
            // append the svg object to the body of the page
            // append a 'group' element to 'svg'
            // moves the 'group' element to the top left margin
            svg3 = barContainer.append("svg")
                .attr("width", width + margin.left + margin.right)
                .attr("height", height + margin.top + margin.bottom)
                .append("g")
                .attr("transform",
                    "translate(" + margin.left + "," + margin.top + ")");
            }

            var barData = groupByYear;
            // format the data
            barData.forEach(function (d) {
                d.year = parseInt(d.key);
                //d.displayYear = parseTime(d.key); 
                d.totalYearProd = d.totalYearProd;
                d.totalAllNeonic = d.totalAllNeonic;
            });


            barData.sort(function (x, y) {
                return d3.ascending(x.year, y.year);
            })

            console.log("barData = ", barData);

            var valueBar;
            var barColor;
            var yVal, yFunc, heightFunc, valueFunc;
            if (currentMapProp == "varHoneyProd") {
                // define the line
                valueBar = d3.line()
                    .x(function (d) { return x(d.year); })
                    .y(function (d) { return y(d.totalYearProd); });

                y.domain([0, d3.max(barData, function (d) { return d.totalYearProd; })]);
                barColor = "#bc8600";

                yFunc = function(d) {
                    return y(d.totalYearProd);
                }

                heightFunc = function(d) {
                    return height - y(d.totalYearProd);
                }

                valueFunc = function(d) { return ctFormat(d.totalYearProd); }

                yLabel = "Total Honey Production (lbs)";
            }

            if (currentMapProp == "varNeonic") {
                valueBar = d3.line()
                    .x(function (d) { return x(d.year); })
                    .y(function (d) { return y(d.totalAllNeonic); });

                y.domain([0, d3.max(barData, function (d) { return d.totalAllNeonic; })]);
                barColor = "#00FF00";

                yFunc = function(d) {
                    return y(d.totalAllNeonic);
                }

                heightFunc = function(d) {
                    return height - y(d.totalAllNeonic);
                }

                valueFunc = function(d) { return ctFormat(d.totalAllNeonic); }

                yLabel = "Total Neonic Use (lbs)";
            }

            // Scale the range of the data in the domains
            x.domain(barData.map(function (d) { return d.year; }));
            
            
            // append the rectangles for the bar chart
            /*
            myBar = svg3.selectAll(".bar")
                .data(barData) 
                .attr("class", "bar")
                .attr("fill", barColor)
                .attr("x", function (d) { return x(d.year); })
                .attr("width", x.bandwidth())
                .attr("y", yFunc)
                .attr("height", heightFunc);

            myBar.enter()
                .append("rect")
                .transition()
                .attr("class", "bar")
                .attr("fill", barColor)
                .attr("x", function (d) { return x(d.year); })
                .attr("width", x.bandwidth())
                .attr("y", yFunc)
                .attr("height", heightFunc);    

            myBar.exit().transition().remove();
            */

            myBar = svg3.selectAll(".bar")
            .data(barData);
        
            var myBarEnter = myBar.enter().append("rect")
            .attr("fill", barColor)
            .attr("class", "bar")
            .on("mouseover", function() {
                d3.select(this)
                    .classed("barHover", true);
            })
            .on("mouseout", function(d){ 
                    barTooltip.style("display", "none");
                    d3.select(this)
                     .classed("barHover", false);
                });
            
            var myBarUpdates = myBar.merge(myBarEnter);
            
            myBarUpdates
            .on("mousemove", function(d){
                barTooltip
                  .style("left", d3.event.pageX - 40 + "px")
                  .style("top", d3.event.pageY - 70 + "px")
                  .style("display", "inline-block")
                  .html((d.year) + "<br>" + valueFunc(d));
            })
            .transition().duration(1500)
            .attr("fill", barColor)
            .attr("x", function (d) { return x(d.year); })
            .attr("width", x.bandwidth())
            .attr("y", yFunc)
            .attr("height", heightFunc);
            
            myBar.exit().remove();

            svg3.selectAll(".xAxis").remove();
            // add the x Axis
            svg3.append("g")
                .attr("class", "xAxis")
                .attr("transform", "translate(0," + height + ")")
                .call(d3.axisBottom(x) 
                    .tickFormat(d3.format("d"))
                );

            if (svg3.select(".yAxis")._groups[0][0] != undefined) {
                svg3.selectAll(".yAxis").transition().duration(1500)
                    .call(d3.axisLeft(y)
                        .tickFormat(ctFormat)
                    );
            } else {
                // Add the Y Axis
                svg3.append("g")
                    .attr("class", "yAxis")
                    .call(d3.axisLeft(y)
                        .tickFormat(ctFormat)
                    );

            }
            
            svg3.selectAll(".yAxisLabel").remove();
            // now add titles to the axes
            svg3.append("text")
                .attr("class", "yAxisLabel")
                .attr("text-anchor", "middle")  // this makes it easy to centre the text as the transform is applied to the anchor
                .attr("transform", "translate(-45," + (height / 2) + ")rotate(-90)")  // text is drawn off the screen top left, move down and out and rotate
                .text(yLabel);

            svg3.selectAll(".xAxisLabel").remove();
            svg3.append("text")
                .attr("class", "xAxisLabel")
                .attr("text-anchor", "middle")  // this makes it easy to centre the text as the transform is applied to the anchor
                .attr("transform", "translate(" + (width / 2) + "," + (height + (45)) + ")")  // centre below axis
                .text("Year");
        }

        fnCreateBar = createBarChart; // store this function in a global var for calling via settimeout



        // END OF BAR CHART CODE

        ///////////////////////////////////////////
        ///////////////////////////////////////////
        ///////////////////////////////////////////
        // START OF STATE CHART CODE
        var isStateCreated = false;
        var stateTab = document.getElementById("state-tab");
        stateTab.addEventListener("click", function () {
            if (!isStateCreated) {
                isStateCreated = true;
                setTimeout("fnCreateState()", 300); // Call after slight delay to render before height/width
            }
        });

        function createStateChart() {

            var stateContainer = d3.select("#state-container");
            var wLine = stateContainer.node().getClientRects()[0].width;
            var hLine = stateContainer.node().getClientRects()[0].height;
 
            //var wLine = 920;
            //var hLine = 500;  

            //////////////////////////////////////
            //////////////////////////////////////

            // set the dimensions and margins of the graph
            var marginBar = { top: 20, right: 20, bottom: 60, left: 65 },
                width = wLine - marginBar.left - marginBar.right,
                height = hLine - marginBar.top - marginBar.bottom;

            var parseTime = d3.timeParse("%yyyy");

            // set the ranges
            var xState = d3.scaleLinear().range([0, width]);
            var yState = d3.scaleLinear().range([height, 0]);

            groupByState.sort(function (x, y) {
                    return d3.descending(x.totalStateProd, y.totalStateProd);
                });

            
                console.log("groupByState = ", groupByState);
            
            /*
        groupByStateYear.values.sort(function(x, y){
            return d3.ascending(x.year, y.year);
         }) */

            var stateLineData = [];
            var valueLineData = [];
            console.log("==================================");
            console.log("STATE DATA -----------------------");
            console.log("==================================");
            var topStateObjs = groupByState.slice(0, 5);

            var topStatesArray = [];
            for (var s = 0; s < topStateObjs.length; s++) {
                topStatesArray.push(topStateObjs[s].key);
            } 

            var topStates = groupByStateYear.filter(function (v) {
                return topStatesArray.includes(v.key);

            });

            console.log("topStates ", topStates);

            var stateColors1 = d3.schemeCategory10;
            //var stateColors2 = d3.schemeCategory20b;
            //var stateColors3 = d3.schemeCategory20c;
            //stateColors1=  stateColors1.concat(stateColors2, stateColors3)

            var stateColors = d3.scaleOrdinal(stateColors1);

            topStates.forEach(function (d) {
                //console.log("-----------------------------");
             
                var lineData = d.values;

                var myColor = stateColors(d.key);

                var graphData = [];
                for (var c = 0; c < lineData.length; c++) {
                    var tp = lineData[c].values[0].totalprod;
                    if (parseFloat(tp) == NaN) {
                        tp = 0;
                    }
                    var yearData = { year: parseInt(lineData[c].key), state: lineData[c].values[0].state, totalprod: tp, color: myColor };

                    //if(topTenStates.includes( lineData[c].values[0].state )) {
                    graphData.push(yearData);
                    //}

                }

                // Sort by year
                graphData.sort(function (x, y) {
                    return d3.ascending(x.year, y.year);
                });

                stateLineData.push(graphData);
                // console.log("++++++++++++++++++++++++++++++++++++++");
                // console.log("--- " + d.key);
                //console.log(lineData);
                var valueLine = d3.line()
                    .x(function (d) { return xState(d.year); })
                    .y(function (d) { if (parseFloat(d.totalprod) == NaN) d.totalprod = 0; return yState(d.totalprod); });
                //  console.log("---");
                // console.log(valueLine);
                valueLineData.push(valueLine);
            });
 

            console.log("valueLineData", valueLineData);

            // append the svg obgect to the body of the page
            // appends a 'group' element to 'svg'
            // moves the 'group' element to the top left margin
            svg4 = stateContainer.append("svg")
                .attr("width", width + marginBar.left + marginBar.right)
                .attr("height", height + marginBar.top + marginBar.bottom)
                .append("g")
                .attr("transform",
                    "translate(" + marginBar.left + "," + marginBar.top + ")");

            var prodDomain = [
                d3.min(stateLineData, function (c) { return d3.min(c, function (v) { return v.totalprod; }); }),
                d3.max(stateLineData, function (c) { return d3.max(c, function (v) { return v.totalprod; }); })
            ];
            console.log("MAX OF ALL STATE TOTALPROD = ", prodDomain);

            // Scale the range of the data
            xState.domain(d3.extent(stateLineData[0], function (d) { return d.year; }));
            yState.domain(prodDomain);

            // Add the valueline path.
  
            stateLineData.forEach(function (d, i) {

                if (d.length == 0) return;
                var lineData = d;
                var infoString = "State: " + d[0].state;

                svg4.append("path")
                    .data([lineData])
                    .attr("class", "lineState")
                    .style("stroke", function (d) { // Add dynamically
                   
                        return d[0].color;
                    })
                    .attr("fill", "none")

                    .attr("d", valueLineData[i]);     

            });

            console.log("add X axis");
            // Add the X Axis
            svg4.append("g")
                .attr("transform", "translate(0," + height + ")")
                .call(d3.axisBottom(xState)
                    .tickFormat(d3.format("d"))
                );

            console.log("add Y axis");
            // Add the Y Axis
            svg4.append("g")
                .call(d3.axisLeft(yState)
                    .tickFormat(ctFormat)
                );

            // now add titles to the axes
            svg4.append("text")
                .attr("text-anchor", "middle")  // this makes it easy to centre the text as the transform is applied to the anchor
                .attr("transform", "translate(-45," + (height / 2) + ")rotate(-90)")  // text is drawn off the screen top left, move down and out and rotate
                .text("Honey (lbs)");

            svg4.append("text")
                .attr("text-anchor", "middle")  // this makes it easy to centre the text as the transform is applied to the anchor
                .attr("transform", "translate(" + (width / 2) + "," + (height + (45)) + ")")  // centre below axis
                .text("Year");

            /////////////
            var newCont = svg4.append('g').attr('class', 'legendContainerState')
                .attr("transform", "translate(" + (width -40) + "," + (0) + ")")  // centre below axis;
 

            // Add one dot in the legend for each name.
            var size = 10;
            newCont.selectAll("mydots")
            .data(stateLineData)
            .enter()
            .append("rect")
                .attr("x", 20)
                .attr("y", function(d,i){ return 10 + i*(size+5)}) // 100 is where the first dot appears. 25 is the distance between dots
                .attr("width", size)
                .attr("height", size)
                .style("fill", function(d){ return  d[0].color})

            // Add one dot in the legend for each name.
            newCont.selectAll("mylabels")
            .data(stateLineData)
            .enter()
            .append("text")
                .attr("x", 20 + size*1.2)
                .attr("y", function(d,i){ return 10 + i*(size+5) + (size/2)}) // 100 is where the first dot appears. 25 is the distance between dots
                .style("fill", function(d){ return  d[0].color})
                .text(function(d){ return d[0].state})
                .attr("text-anchor", "left")
                .attr("font-size", "10px")
                .style("alignment-baseline", "middle")
           

            ////////

            var mouseG = svg4.append("g")
                .attr("class", "mouse-over-effects");

            mouseG.append("path") // this is the black vertical line to follow mouse
                .attr("class", "mouse-line")
                .style("stroke", "black")
                .style("stroke-width", "1px")
                .style("opacity", "0");

            var lines = document.getElementsByClassName('lineState');

            var mousePerLine = mouseG.selectAll('.mouse-per-line')
                .data(stateLineData)
                .enter()
                .append("g")
                .attr("class", "mouse-per-line");

            mousePerLine.append("circle")
                .attr("r", 7)
                .style("stroke", function (d) {
                
                    return d[0].color;
                })
                .style("fill", "none")
                .style("stroke-width", "1.5px")
                .style("opacity", "0");

            mousePerLine.append("text")
                .attr("transform", "translate(10,3)")

            //// 
            mouseG.append('svg:rect') // append a rect to catch mouse movements on canvas
                .attr('width', width) // can't catch mouse events on a g element
                .attr('height', height)
                .attr('fill', 'none')
                .attr('pointer-events', 'all')
                .on('mouseout', function () { // on mouse out hide line, circles and text
                    d3.select(".mouse-line")
                        .style("opacity", "0");
                    d3.selectAll(".mouse-per-line circle")
                        .style("opacity", "0");
                    d3.selectAll(".mouse-per-line text")
                        .style("opacity", "0");
                })
                .on('mouseover', function () { // on mouse in show line, circles and text
                    d3.select(".mouse-line")
                        .style("opacity", "1");
                    d3.selectAll(".mouse-per-line circle")
                        .style("opacity", "1");
                    d3.selectAll(".mouse-per-line text")
                        .style("opacity", "1");
                })
                .on('mousemove', function () { // mouse moving over canvas
                    var mouse = d3.mouse(this);
                    d3.select(".mouse-line")
                        .attr("d", function () {
                            var d = "M" + mouse[0] + "," + height;
                            d += " " + mouse[0] + "," + 0;
                            return d;
                        });

                    d3.selectAll(".mouse-per-line")
                        .attr("transform", function (d, i) {
                            var xDate = xState.invert(mouse[0]),
                                bisect = d3.bisector(function (d) { return d.date; }).right;
                            idx = bisect(d.values, xDate);

                            var beginning = 0,
                                end = lines[i].getTotalLength(),
                                target = null;

                            while (true) {
                                target = Math.floor((beginning + end) / 2);
                                pos = lines[i].getPointAtLength(target);
                                if ((target === end || target === beginning) && pos.x !== mouse[0]) {
                                    break;
                                }
                                if (pos.x > mouse[0]) end = target;
                                else if (pos.x < mouse[0]) beginning = target;
                                else break; //position found
                            }

                            // Contents of text label
                            d3.select(this).select('text')
                                .attr("fill", function (d) {
                                    return d[0].color;
                                })
                                .text(function (d) { 
                                    return d[0].state + " " + ctFormat(yState.invert(pos.y));
                                });

                            return "translate(" + mouse[0] + "," + pos.y + ")";
                        });
                });


        }

        fnCreateState = createStateChart; // store this function in a global var for calling via settimeout

        // END OF STATE CHART CODE

    });