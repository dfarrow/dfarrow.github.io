 

d3.queue()
    .defer(d3.csv, "data/testdata.csv")
    .defer(d3.json, "data/countries.json")
    .awaitAll(function(error,dataArray) {
 
    var data = dataArray[0];
    var lookup = dataArray[1];
  
    console.log("CSV Data loaded: ", data);
    console.log("lookup = ", lookup);
    data.forEach(function(d, i) {
        d.index = i;
        d.export = parseInt(d.export);
        d.exportNum = parseInt(d.export);
        d.rank = i+1;
        d.fullName = lookup[d.country];
        console.log(d);
    })

    console.log("New data: ", data);

    var currentYearData = data.filter(function(d) {
        return d.year==2017;
    })
    console.log("currentYearData ", currentYearData);

    // d3.extent() the min/max values...(can also use d3.min and d3.max)
    var dataExtent = d3.extent(data, function(d) {
        return d.export;
    })
    console.log("dataExtent ", dataExtent);

    // d3.nest() groups data
    var groupedData = d3.nest()
        .key(function(d) {
            return d.country;
        })
        .entries(data);

    console.log("Grouped data by country" , groupedData);
    
    // d3.sum() to add all
    groupedData.forEach(function(d) {
        d.total = d3.sum(d.values, function(d2) {
            return d2.export;
        });
        d.average = d3.mean(d.values, function(d3) {
            return d3.export;
        });
    });

    console.log("Grouped data by country, summed" , groupedData);
    

    // d3.nest() groups data
    var groupedData2 = d3.nest()
        .key(function(d) {
            return d.year;
        })
        .entries(data);

    console.log("Grouped data by year" , groupedData2);

    // d3.sum() to add all
    groupedData.forEach(function(d) {
        d.total = d3.sum(d.values, function(d2) {
            return d2.export;
        });
    });

    
});