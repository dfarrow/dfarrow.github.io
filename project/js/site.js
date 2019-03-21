    var dataFileName = "data/vHoneyNeonic_v03.csv";
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
   
    var isSetup = false;
    var zoom, drag, projection, path, svg, container;
    var totalProdColors, totalProdExtent;

    var geoJsonData, chartData = undefined; // GeoJSON and charting data objects  
    var featureValues = []; // List of values for each named feature (should come from API)
    var tooltip;

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

          var calcHeight = parseInt(window.innerHeight * .7);
          //Create SVG element
          svg1 = d3.select("#choropleth") 
                      .attr("width", "100%")
                      .attr("height", calcHeight)                        
                      .attr("class", "choro-container")
                      .call(zoom);

          
          // Create a container for the map
          container = svg1.append("g")
              .style("pointer-events", "all");


          
          var wKey = 300, hKey = 50;

          var myKey = svg1.append("g")  
              .attr("class","legendContainer")
              .attr("fill", "blue")
              .attr("stroke", "gray")
              .style("pointer-events", "all")
              .attr("x", 20)
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
            .attr("transform", "translate(10,10)"); 
          var y = d3.scaleLinear()
            .range([0,300])
            .domain(totalProdExtent);
      
          var yAxis = d3.axisBottom()
            .scale(y)
            .ticks(5);
      
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
            

          // Hover info panel
          tooltip = d3.select("body")
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
 
          //Bind data and create one path per GeoJSON feature
          container.selectAll("path")
              .data(geoJsonData.features)                   
              .call(drag)   
              .enter()
              .append("path")
              .attr("d", path) 
              .attr("class", "feature") 
              .attr("transform", "translate(" + xOffset + ", " + yOffset + ")"); // Move this map into view because the projection is centered on US to start
              

          isSetup = true;
        } // End if(!isSetup)...

        //Display in GeoJSON data
        function displayChart(json) {
        
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
      var select = d3.select("#sliderColumn")
        .append("div")
        .append("select")

      select
      .on("change", function(d) {
        var value = d3.select(this).property("value"); 
 

        updateDisplay(value);
      });

    select.selectAll("option")
      .data(listYears)
      .enter()
        .append("option")
        .attr("value", function (d) { return d; })
        .text(function (d) { return d; }); 

      updateDisplay(listYears[0]); // Call function to update display
      
      createBarChart();
   });

   

   // Update the map display
   function updateDisplay(year) {
      featureValues = []; 

      d3.select("#yearInfo").text(year); 
          
      mapProp = geoJsonData.properties.mapProp; // Propery name to map to on each geoJSON feature object
      scaleValue = geoJsonData.properties.scaleValue; // Map scaling
      xOffset = geoJsonData.properties.xOffset; // Map xoffset
      yOffset = geoJsonData.properties.yOffset; // Map yoffset
      
      // DON'T NEED TO DO THESE EVERY TIME!! TODO: MOVE THEM
      totalProdExtent = d3.extent(chartData.map(function(d){return parseFloat(d.totalprod);}));
      console.log("totalProdExtent " , totalProdExtent);

      totalProdColors = d3.scaleLinear()
        .domain(totalProdExtent)
        .range(['#FFF9CC', '#bc8600'])
        .interpolate(d3.interpolateHcl); 

        
      // d3.nest() groups data
      var groupByYear = d3.nest()
        .key(function(d) {
              return d.year;
          })
          .entries(chartData);
      //console.log(groupByYear);
       
      groupByYear.forEach(function(d) {
          d.total = d3.sum(d.values, function(d2) {
              return d2.totalprod;
          });
          d.average = d3.mean(d.values, function(d3) {
              return d3.totalprod;
          });
      }); 

      var currentData = groupByYear.filter(obj => {
        return obj.key == year.toString();
      }) 
      console.log("currentData ", currentData);
      var ctFormat = d3.format(".2s");
      d3.select("#totalProdInfo").text(ctFormat(currentData[0].total));  

      d3.select("#avgProdInfo").text(ctFormat(currentData[0].average));  

      console.log("Current Year Data", currentData[0].values);
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
            myVal = myDataRow[0].totalprod; // Get total honey production
          }
          
          var dataObj = {"name": featureName, "value": myVal, "state": stateAbbr}; 
          featureValues.push(dataObj); 
      });

      renderMap(); // Render the map


   }

   

   function createBarChart() { 
    //////////////////////////////////////////////////////////////
    //////////////////////////////////////////////////////////////
    // Create bar chart
    // set the dimensions and margins of the graph
    var margin = {top: 20, right: 20, bottom: 30, left: 40},
    width = 960 - margin.left - margin.right,
    height = 500 - margin.top - margin.bottom;

      // set the ranges
      var x = d3.scaleBand()
            .range([0, width])
            .padding(0.1);
      var y = d3.scaleLinear()
            .range([height, 0]);
            
      // append the svg object to the body of the page
      // append a 'group' element to 'svg'
      // moves the 'group' element to the top left margin
      var svg = d3.select("#bar-container").append("svg")
      .attr("width", width + margin.left + margin.right)
      .attr("height", height + margin.top + margin.bottom)
      .append("g")
      .attr("transform", 
            "translate(" + margin.left + "," + margin.top + ")");
 
            // format the data
            chartData.forEach(function(d) {
              d.totalprod = + d.totalprod;
            });
          
            // Scale the range of the data in the domains
            x.domain(chartData.map(function(d) { return d.year; }));
            y.domain([0, d3.max(chartData, function(d) { return d.totalProd; })]);
          
            // append the rectangles for the bar chart
            svg.selectAll(".bar")
                .data(chartData)
              .enter().append("rect")
                .attr("class", "bar")
                .attr("x", function(d) { return x(d.totalprod); })
                .attr("width", x.bandwidth())
                .attr("y", function(d) { return y(d.year); })
                .attr("height", function(d) { return height - y(d.totalprod); });
          
            // add the x Axis
            svg.append("g")
                .attr("transform", "translate(0," + height + ")")
                .call(d3.axisBottom(x));
          
            // add the y Axis
            svg.append("g")
                .call(d3.axisLeft(y));

  }
