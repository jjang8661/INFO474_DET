// Display the slide bar for the years
function showValue(newValue) {
	document.getElementById("showYear").innerHTML= "In "+newValue;
}

// After the page is loaded
$(function() {

	// Read in data file
	d3.csv('data/data.csv', function(error, allData) {

		// If there is an error while reading the data file
		if (error) throw error;

		// Variables that should be accesible within the namespace
		var xScale, yScale, currentData, groupedData;

		// Track the year (2003~2013) and region type (New York City, New York State,Rest of State) in variables
		var year = '2008';
		var region = 'New York State';

		// Margin: how much space to put in the SVG for axes/titles
		var margin = {
			left:100,
			bottom:200,
			top:70,
			right:80,
		}

		// Height/width of the drawing area for data symbols
		var height = 600 - margin.bottom - margin.top;
		var width = 1200 - margin.left - margin.right;

	 	// Select SVG to work with, setting width and height
		var svg = d3.select('#vis')
			.append('svg')
   		    .attr("width", width + margin.left + margin.right)
            .attr("height", height + margin.top + margin.bottom)
        
	 	// Append g for the graph
        var g = svg.append("g")
            .attr("transform", "translate(" + margin.left + "," + margin.top + ")")
            .attr("width", width)
            .attr("height", height);
		
		// Color of the graph
		// Total : Purple
		// Male : Blue
		// Female : Pink
		var color = d3.scale.ordinal()
                      .range(["#800080", "#4682B4","#FFC0CB"]);

		// Append an x-axis label 
		var xAxisLabel = svg.append('g')
							.attr('class', 'axis')
							.attr("transform", 'translate(' + margin.left + ',' + (margin.top + height) + ')');

		// Append a y-axis label
		var yAxisLabel = svg.append('g')
							.attr('class', 'axis')
							.attr("transform", 'translate(' + margin.left + ',' + (margin.top) + ')');

		// Append text to label the y axis
		var xAxisText = svg.append('text')
						   .attr('transform', 'translate(' + (margin.left+width/2) + ',' + (margin.top + height + margin.bottom - 45) + ')')
						   .attr('class', 'title');

		// Append text to label the y axis
		var yAxisText = svg.append('text')
						   .attr('transform', 'translate(' + (margin.left - 70) + ',' + (margin.top+height/2) + ') rotate(-90)')
						   .attr('class', 'title');
		
		var tip = d3.tip()
			.attr('class', 'd3-tip')
	    	.offset([-10,-3])
			.html(function(d) {
		    	return "<span style='color:white'>" + d.value + "</span>";
  		    })


		// Write a function for setting scales.
		var setScales = function(data) {

			// Get the unique values of selected causes of death for the domain of your x scale
			var causes = data.map(function(d) {return d.Cause});

			// Define an ordinal xScale for overall graph
			xScale  = d3.scale.ordinal()
						.rangeBands([0, width], .1)

			// Define an ordinal xScale1 for grouped bars
			xScale1 = d3.scale.ordinal()

			// Define the yScale
			yScale = d3.scale.linear()
					   .range([height, 0])
		}

		// Function for setting axes
		var setAxes = function() {

			// Define x axis, assigning the scale as the xScale
			var xAxis = d3.svg.axis()
						.scale(xScale)
						.orient('bottom');

			// Define y axis, assigning the scale as the yScale
			var yAxis = d3.svg.axis()
						.scale(yScale)
						.orient('left')
						// .tickFormat(d3.format('.2s'));

			// Call xAxis
			xAxisLabel.transition().duration(1500)
				.call(xAxis)
				.selectAll("text")
				.attr("transform", "rotate(45)")
				.attr("y", 0)
				.attr("x", 9)
				.attr("dy", ".35em")
				.style("text-anchor", "start");

			// Call yAxis
			yAxisLabel.transition().duration(1500)
				      .call(yAxis);

			// Update labels
			yAxisText.text('Number of Deaths')
			xAxisText.text('Cause of Deaths (' + year + ', '+ region + ')')
		}

		// Function to filter down the data to the current sex and type
		var filterData = function() {
			currentData = allData.filter(function(d) {
				return d.Region == region && d.Year == year
			})
			// Sort the data alphabetically
			// Hint: http://stackoverflow.com/questions/6712034/sort-array-by-firstname-alphabetically-in-javascript
			.sort(function(a,b){
				if(a.Cause_Code < b.Cause_Code) return -1;
				if(a.Cause_Code > b.Cause_Code) return 1;
				return 0;
			})
		}

		// Function to rearrange the data into grouped data
		var groupData = function(data) {
			var tempData;
			var text = '[';

			// Parse each data object as string.
			// Reaarange the data and convert it back JSON object
			for(i = 1; i <= 9; i++) {
				if(i != 1) {
					text += ","
				}

				// Filter out data for each Cause of death
				tempData = data.filter(function(d) {
					return d.Cause_Code == i;
				})

				text += '{ "Cause": "' + tempData[0].Cause + '"';
				tempData.forEach(function(d) {	
					text += ','
					text += '"'+ d.Gender + '": "' + d.Deaths + '"'
				})

				text += "}";

				if(i ==9){
					text += "]"
				}
			}

			return JSON.parse(text)
		}

		// Store the data-join in a function: make sure to set the scales and update the axes in your function.
		var draw = function(data) {

			// Store the grouped data into a variable
			groupedData = groupData(data)
 
			// Parse the data into three gender types (total, male or female)
			var genderName = d3.keys(groupedData[0]).filter(function(key) { return key !== "Cause"; });
			groupedData.forEach(function(d) {
				d.genders = genderName.map(function(name) { return {name: name, value: +d[name]}; });
			});

			// Set scales
			setScales(groupedData);
			
			//Define domain for all three scales
			xScale.domain(groupedData.map(function(d) {return d.Cause;}));
			xScale1.domain(genderName).rangeRoundBands([0, xScale.rangeBand()]);
			yScale.domain([0, d3.max(groupedData, function(d) {return d3.max(d.genders, function(d) {return d.value;})})]);

			// Set axes
			setAxes()

			// Select all g and bind data. Call tooltip function
			// Check and update g based on the data
  			var cause = g.selectAll("g")
     					   .data(groupedData)
     		cause.enter().append("g");
     		cause.call(tip);
    		cause.exit().remove();

      		cause.attr("transform", function(d) { return "translate(" + xScale(d.Cause) + ",0)"; })
      			.attr('class', ".Cause");			      	

      		// Select all rect and bind data.
			var bars =  cause.selectAll("rect")
      			.data(function(d) { return d.genders },
      			      function(d) { return d.name});

      		// Assing initial positions for the bars
     		bars.enter().append("rect")
      			 .attr("width", xScale1.rangeBand())
                 .attr("x", function(d) { return xScale1(d.name); })
     			 .attr("y", height)
      			 .attr("height", 0)
      			 .style("fill", function(d) { return color(d.name); })
 				 .attr("title", function(d) {return d.genders})
 				 .on('mouseover', tip.show)
                 .on('mouseout', tip.hide);
 			
 			// Check and update rect based on teh data
 			bars.exit().remove();

 			// Actual positioins for the bars based on the current data
 			bars.transition()
				.duration(1500)
				.delay(function(d,i){return i*50})
				.attr("width", xScale1.rangeBand())
     			.attr("y", function(d) { return yScale(d.value); })
      			.attr("height", function(d) { return height - yScale(d.value); })
      			.style("fill", function(d) { return color(d.name); })
 				.attr("title", function(d) {return d.genders});

 			// Legend for the graph
			var legend = svg.selectAll(".legend")
		    	.data(genderName.slice().reverse())
			    .enter().append("g")
			    .attr("class", "legend")
			    .attr("transform", function(d, i) { return "translate(50," + i * 20 + ")"; });

			legend.append("rect")
			      .attr("x", width - 18)
			      .attr("width", 18)
			      .attr("height", 18)
     			  .style("fill", color);

			legend.append("text")
			      .attr("x", width - 24)
			      .attr("y", 9)
			      .attr("dy", ".35em")
			      .style("text-anchor", "end")
			      .text(function(d) { return d; })	
		}

		// Assign a change event to input elements to set the sex/type values, then filter and update the data
		$("input").on('change', function() {
			// Get value, determine if it is the sex or type controller
			var val = $(this).val();
			var whichYear = $(this).hasClass('years');
			if(whichYear) year = val;
			else region = val;

			// Filter data, update chart
			filterData();
			draw(currentData);
		});

		// Filter data to the current settings then draw
		filterData()
		draw(currentData)


	});
});
