    var dataFileName = "data/vHoneyNeonic_v02.csv";
    var geoFileName = "geojson/usa-states.json"; // GeoJSON data file
    var w = 800; // SVG Container width
    var h = 800; // SVG Container height
    var lWidth = 30; // Legend item width
    var lHeight = 20; // Legend item height
    var lPadding = 10; // Legend item padding
    
    // These variables are loaded in from the GeoJSON from data.properties...
    var mapProp = "mapProp";
    var scaleValue = 100;
    var xOffset = 0;
    var yOffset = 0;
    
    // Threshold shading and legend info    
    var shadeValues = [ 
      {"value": 1, "color": "#98fb2d" }, // green
      {"value": 2, "color": "#fbf92d" }, // Yellow
      {"value": 3, "color": "#fb892d" }, // Orange
      {"value": 4, "color": "#ed3840" } // Red 
    ];
    
    var isSetup = false;
    var zoom, drag, projection, path, svg, container;
    var totalProdColors;

    var geoJsonData, chartData = undefined; // GeoJSON and charting data objects  
    var featureValues = []; // List of values for each named feature (should come from API)
    
    function renderMap() {
    
        if(!isSetup) {
          // Zoom      
          zoom = d3.zoom()
            .scaleExtent([.4, 25])
            .on("zoom", zoomed);
          
          // Drag
          drag = d3.drag()
                .subject(subject)
                .on("start", function () {
                  console.log("drag");
                  console.log(d);
                  return d; 
                })
          //.on("dragstart", dragstarted)
          // .on("drag", dragged)
          //  .on("dragend", dragended);
          
          // Required for drag functionality
          function subject(d) {return { x: 0, y: d3.event.y }};

          //Define map projection
          projection = d3.geoMercator()
                        .translate([w/1, h/1]) // Move this map into view
                        .scale([scaleValue]); 

          //Define path generator
          path = d3.geoPath()
                        .projection(projection);

          var calcHeight = parseInt(window.innerHeight * .8);
          //Create SVG element
          svg = d3.select("svg") 
                      .attr("width", "100%")
                      .attr("height", calcHeight)                        
                      .attr("class", "choro-container")
                      .call(zoom);

          
          // Create a container for the map
          container = svg.append("g")
              .style("pointer-events", "all");


          
          var wKey = 300, hKey = 50;

          var myKey = svg.append("g")  
              .attr("class","legendContainer")
              .attr("fill", "blue")
              .attr("stroke", "gray")
              .style("pointer-events", "all")
              .attr("width", wKey)
              .attr("height", hKey);
      
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
            .attr("transform", "translate(0,10)");
      
          var y = d3.scaleLinear()
            .range([300, 0])
            .domain([68, 12]);
      
          var yAxis = d3.axisBottom()
            .scale(y)
            .ticks(5);
      
          myKey.append("g")
            .attr("class", "y axis")
            .attr("transform", "translate(0,30)")
            .call(yAxis)
            .append("text")
            .attr("transform", "rotate(-90)")
            .attr("y", 0)
            .attr("dy", ".71em")
            .style("text-anchor", "end")
            .text("axis title");

          // Hover info panel
          var tooltip = d3.select("body")
            .append("div")
            .style("position", "absolute")
            .style("z-index", "10")
            .style("visibility", "hidden") 
            .attr("class", " arrow_box shadow")
            .style("background", "#FFF")
            .text("a simple tooltip");
        
          $(".choro-container").on("mousedown", function() {        
            $(this).addClass("mouseMove"); 
            return false;        
          });
      
          $(".choro-container").on("mouseup", function() {
            $(this).removeClass("mouseMove");
          });

          isSetup = true;
        } // End if(!isSetup)...

        //Display in GeoJSON data
        function displayChart(json) {
        
            //Bind data and create one path per GeoJSON feature
            container.selectAll("path")
               .data(json.features)                   
               .call(drag)   
               .enter()
               .append("path")
               .attr("d", path) 
               .attr("class", "feature") 
               .attr("transform", "translate(" + xOffset + ", " + yOffset + ")"); // Move this map into view because the projection is centered on US to start
                
            container.selectAll("path") 
                  .each(function (d, i) { 
                      // Add information for display
                      var area = d.properties[mapProp];
                      
                      // Find the matching key in the list and get the value
                      var found = featureValues.find(function(element) {
                        return element.name.toLowerCase() == area.toLowerCase();
                      });
                      
                      // Color the shape and store the value in an attribute
                      var myVal = found.value;
                      var myColor = totalProdColors(myVal);  
                      if(myVal == 0) {
                        myColor = "#CCCCCC";
                      }
                      var myPath = d3.select(this); 
                      myPath.style("fill", myColor);
                      myPath.attr("feature-value", myVal);
                      
                      var infoString = area + "<br>Value: " + myVal;
                      // Set title for displaying info on hover
                      myPath.attr("title", infoString);
                      
                      myPath.text(function(d, infoString) { return infoString; })
                        .on("mouseenter", function(d, infoString){
                           
                            var area = d.properties[mapProp]; 
                                                       
                            // Highglight this bad boy
                            $(this).addClass("highLight");
                                                            
                            if(!isIE11) {
                                    // Move the path to the front so the stroke in on top...
                                    // But if it is IE 11 don't do this because it messes up the "mouseout" event
                                    myPath.moveToFront();
                            }
                  
                            var myVal = myPath.attr("feature-value");
                            var infoString = area + "<br>Value: " + myVal;
                            tooltip.html(infoString); 
                            return tooltip.style("visibility", "visible");
                            
                            })
                      .on("mousemove", function(){
                              return tooltip.style("top", (d3.event.pageY-45)+"px").style("left",(d3.event.pageX+30)+"px");
                              })
                      .on("mouseout", function(){
                              // This "mouseout" event doesn't fire in IE 11 from the <path> element in the map for some reason
                              $(this).removeClass("highLight");
                                return tooltip.style("visibility", "hidden");
                              
                              });
                        });
               
        } // End displayChart()...
        
        displayChart(geoJsonData); // Run the displayChart() function...
        
        /*
        // Create legend display     
        var legendContainer = svg.append("g")  
             .attr("class","legendContainer")
             .attr("fill", "blue")
             .attr("stroke", "gray")
             .style("pointer-events", "all");
        
        // Add legend color rect
        var legendBoxes = legendContainer.selectAll("g")
             .data(shadeValues)  
             .enter()
             .append("g")
             .attr("class","legendBox")
             .append("rect")
             .attr("width", lWidth)
             .attr("height", lHeight)
             .each(function (d, i) { 
                var myRect = d3.select(this);  
                myRect.style("fill", d.color) 
                var lx = lPadding;
                var ly = lPadding + (i * (lHeight + lPadding));
                myRect.attr("transform", "translate(" + lx + ", " + ly + ")");
            });    
        
        // Add legend text label
        var legendBoxes = legendContainer.selectAll("g")
             .append("text")
             .attr("class","legendText")
             .text("Legend Value")
             .attr("height", lHeight)
             .each(function (d, i) { 
                var myText = d3.select(this);  
                var lx = (2 * lPadding) + lWidth;
                var ly = 16 + lPadding + (i * (lHeight + lPadding));
                myText.attr("transform", "translate(" + lx + ", " + ly + ")"); 
                myText.text(d.value);
            });
          */
        
    
    } // End renderMap()...
    
    // Helper functions
    
    // Move a shape to the front so the stroke appears on top
    d3.selection.prototype.moveToFront = function() { return this.each(function() { this.parentNode.appendChild(this); }); }
    
    // Flag for IE 11
    var isIE11 = !!navigator.userAgent.match(/Trident.*rv\:11\./);
    
    function search(key, myArray){
        for (var i=0; i < myArray.length; i++) {
            if (myArray[i].value >= key) {
                return myArray[i];
            }
        }
    }
    
    function getRandomValue() {
      return Math.floor(Math.random() * 5)
    }
    
    // Zoom and pan functions
    function zoomed() {
      container.attr("transform", "translate(" + d3.event.translate + ")scale(" + d3.event.scale + ")");
    }

    function dragstarted(d) {
       console.log("Drag start");
       d3.event.sourceEvent.stopPropagation();
       d3.select(this).classed("dragging", true);
    }

    function dragged(d) {
       console.log("Dragged ", d);
       d3.event.sourceEvent.stopPropagation();
       // d3.select(this).attr("cx", d.x = d3.event.x).attr("cy", d.y = d3.event.y);
    }

    function dragended(d) {
      console.log("Drag end");
      d3.event.sourceEvent.stopPropagation();
      d3.select(this).classed("dragging", false);
    }
    
    // Polylfill for supporting Array "find()" in IE
    Array.prototype.find = Array.prototype.find || function(callback) {
      if (this === null) {
        throw new TypeError('Array.prototype.find called on null or undefined');
      } else if (typeof callback !== 'function') {
        throw new TypeError('callback must be a function');
      }
      var list = Object(this);
      // Makes sures is always has an positive integer as length.
      var length = list.length >>> 0;
      var thisArg = arguments[1];
      for (var i = 0; i < length; i++) {
        var element = list[i];
        if ( callback.call(thisArg, element, i, list) ) {
          return element;
        }
      }
    };
 

    // Load GeoJSON and Chart data
    //d3.json(geoFileName, function( data ) { 
    d3.queue()
      .defer(d3.json, geoFileName)
      .defer(d3.csv, dataFileName)
      .await(function(error, file1, file2) { 
         
      geoJsonData = file1; // GeoJSON map data
      chartData = file2;  // Data for charting on the map
      
      var groupByYear = d3.nest()
        .key(function(d) {
              return parseInt(d.year);
          })
          .entries(chartData);

      var listYears = groupByYear.map(function(d) { return parseInt(d.key)});

      listYears= listYears.sort(function(a, b){return a - b});
 
      // Create Year select dropdown 
      var select = d3.select("body")
        .append("div")
        .append("select")

      select
      .on("change", function(d) {
        var value = d3.select(this).property("value");
        featureValues = [];
        updateDisplay(value);
      });

    select.selectAll("option")
      .data(listYears)
      .enter()
        .append("option")
        .attr("value", function (d) { return d; })
        .text(function (d) { return d; });


      updateDisplay(listYears[0]); // Call function to update display
      
   });

   // Update the map display
   function updateDisplay(year) {
      
      //console.log("geoJsonData", geoJsonData);
      //console.log("chartData", chartData);

      var totalProdExtent = d3.extent(chartData.map(function(d){return parseFloat(d.totalprod);}));
        console.log("totalProdExtent " , totalProdExtent);

      totalProdColors = d3.scaleLinear()
          .domain(totalProdExtent)
          .range(['#FFF9CC', '#bc8600'])
          .interpolate(d3.interpolateHcl); 
          
      mapProp = geoJsonData.properties.mapProp; // Propery name to map to on each geoJSON feature object
      scaleValue = geoJsonData.properties.scaleValue; // Map scaling
      xOffset = geoJsonData.properties.xOffset; // Map xoffset
      yOffset = geoJsonData.properties.yOffset; // Map yoffset
      

      // d3.nest() groups data
      var groupByYear = d3.nest()
        .key(function(d) {
              return d.year;
          })
          .entries(chartData);
      //console.log(groupByYear);

      var currentData = groupByYear.filter(obj => {
        return obj.key == year.toString();
      })
      console.log("Current Data", currentData[0].values);
      var currentYearData = currentData[0].values;
      // Assign state abbreviations to each shape
      $.each(geoJsonData.features, function(key, value) { 
          var featureName = value.properties[mapProp];
          var stateAbbr = value.properties["HASC_1"].split(".")[1]; 

          var myDataRow = currentYearData.filter(obj => {
            return obj.state == stateAbbr;
          })

          var myVal = 0;
          if(myDataRow[0] != undefined) {
            myVal = myDataRow[0].totalprod; // For testing;
          }
          
          if(featureValues.value == undefined) {
            var dataObj = {"name": featureName, "value": myVal, "state": stateAbbr}; 
            featureValues.push(dataObj);
          } else { 
            featureValues.value = myVal; 
          }
 
      });

      renderMap(); // Render the map

   }