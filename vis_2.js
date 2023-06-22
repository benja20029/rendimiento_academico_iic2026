var margin = {top: 20, right: 20, bottom: 30, left: 70},
    width_1 = 580 - margin.left - margin.right,
    height_1 = 580 - margin.top - margin.bottom;

// Parse the date / time
var parseYear = d3.timeParse("%Y");

// Set the ranges
var x = d3.scaleTime().range([0, width_1]);
var y = d3.scaleLinear().range([height_1, 0]);

// Define the line
var valueline = d3.line()
    .x(function(d) { return x(d.year); })
    .y(function(d) { return y(d.grade); });

var SVG2 = d3.select("#vis_puntos").append("svg");

SVG2.attr("width", 600).attr("height", 600);
// put a border on the rect
SVG2.append("rect")
    .attr("width", 600)
    .attr("height", 600)
    .attr("fill", "rgba(173, 216, 230, 0.4)") // Adjust the opacity value (0.8 in this example)
    // Add border radius
    .attr("rx", 5)


var svg = SVG2.append("g")
    .attr("transform", "translate(" + margin.left + "," + margin.top + ")");


// Get the data
d3.csv("promedio_general_por_tipo_institucion_2010-2022.csv").then(function(data) {
    // format the data
    data = data.map(function(d) {
        return {
            year: parseYear(d.AGNO),
            grade: +d.PROM_GRAL_COMB,
            type: d.COD_DEPE
        }
    });

    // Group data by 'type'
    var dataByType = d3.group(data, d => d.type);

    var yearExtent = d3.extent(data, function(d) { return d.year; });
    var yearRange = yearExtent[1].getFullYear() - yearExtent[0].getFullYear();
    var padding = yearRange * 0.05; // Adjust padding if needed
    x.domain([new Date(yearExtent[0].getFullYear() - padding, 1), new Date(yearExtent[1].getFullYear() + padding, 9)]);
    y.domain([4, 7]);

    // Add the valueline path
    var typePaths = svg.selectAll(".typePath")
        .data(Array.from(dataByType.entries())) // convert Map to Array
        .enter()
        .append("path")
        .attr("class", "typePath")
        .attr("fill", "none")
        .attr("stroke", function(d) {
            switch (d[0]) {
                case "Municipal":
                    return "red";
                case "Particular Subvencionado":
                    return "green";
                case "Particular Pagado":
                    return "purple";
                default:
                    return "black";
            }
        })
        .attr("stroke-width", 1.5);
    typePaths.attr("d", function(d) { return valueline(d[1]); }) // set 'd' attribute for each path

   // Create a tooltip element
    var tooltip = d3.select("body").append("div")
    .attr("class", "tooltip")
    .style("opacity", 0);

    // In the part where you define the scatter plot:
    svg.selectAll("dot")
    .data(data)
    .enter().append("circle")
    .attr("r", 5)
    .attr("cx", function(d) { return x(d.year); })
    .attr("cy", function(d) { return y(d.grade); })
    .style("fill", function(d) {
        switch (d.type) {
            case "Municipal":
                return "red";
            case "Particular Subvencionado":
                return "green";
            case "Particular Pagado":
                return "purple";
            default:
                return "black";
        }
    })
    .on("mouseover", function(event, d) {
        // Show the tooltip
        tooltip.transition()
            .duration(200)
            .style("opacity", 0.9);
            
        var sameYearData = data.filter(function(e) {
            return e.year.getTime() === d.year.getTime();
        });
        
        var diffGrades = sameYearData.map(function(e) {
            return {
                diff: Math.abs(e.grade - d.grade),
                type: e.type
            };
        });

        tooltip.html("<br>" + "<strong>Tipo de establecimiento:</strong> " + d.type + "<br>" + "<br>" + "Diferencia de promedio general con establecimientos de tipo " + "</br>" +
             diffGrades.map(function(e) {
                if (e.type !== d.type){
                return  "<strong>"+ e.type + "</strong>"+ ": " + d3.format(".3f")(e.diff)}
                
             }).join("<p>"))
            .style("left", (event.pageX + 10) + "px")
            .style("top", (event.pageY - 28) + "px");
    })
    .on("mouseout", function() {
        // Hide the tooltip
        tooltip.transition()
            .duration(500)
            .style("opacity", 0);
    });

// Create a legend
var legend = SVG2.append("g")
    .attr("class", "legend")
    .attr("transform", "translate(350, 400)")

var legendBackground = legend.append("rect")
    .attr("width", 220) // Adjust the width as needed
    .attr("height", 100) // Adjust the height as needed

// Define the legend data with establishment types and colors
var legendData = [
    { type: "Municipal", color: "red" },
    { type: "Particular Subvencionado", color: "green" },
    { type: "Particular Pagado", color: "purple" }
];

// Add color-coded rectangles and labels to the legend
var legendItems = legend.selectAll(".legend-item")
    .data(legendData)
    .enter()
    .append("g")
    .attr("class", "legend-item")
    .attr("transform", function(d, i) {
        return "translate(20, " + (i * 20 + 20) + ")";
    });

legendItems.append("rect")
    .attr("x", -10)
    .attr("y", 0)
    .attr("width", 14)
    .attr("height", 14)
    .style("fill", function(d) {
        return d.color;
    });

legendItems.append("text")
    .attr("x", 10)
    .attr("y", 9)
    .attr("dy", ".35em")
    .text(function(d) {
        return d.type;
    })
    .style("font-size", "14px");


    // Add the X Axis
    svg.append("g")
    .attr("transform", "translate(0," + height_1 + ")")
    .call(d3.axisBottom(x)
        .ticks(d3.timeYear.every(1)) // Increase the tick frequency to every 2 years
        .tickFormat(d3.timeFormat("%Y")) // Format the tick values as 4-digit years
    )
    .selectAll("text")
    .style("font-size", "12px") ;// Increase the font size of the axis labels
    

    svg.append("g")
    .append("text")
    .attr("fill", "#000")
    .attr("x", width_1 / 2 - 10)
    .attr("y", 570)
    .text("Año")
    .style("font-size", "15px")
    .style("font-weight", "bold");


    // Add the Y Axis
    svg.append("g")
    .call(d3.axisLeft(y))
    .selectAll("text")
    .style("font-size", "12px"); // Increase the font size of the axis labels
    

    svg.append("g")
    .append("text")
    .attr("fill", "#000")
    .attr("x", -height_1 / 2)
    .attr("y", -40)
    .text("Promedio general")
    .style("font-size", "15px")
    .attr("transform", "rotate(-90)")
    .attr("text-anchor", "middle")
    .style("font-weight", "bold")

        // rotate text
});
