var margin = { top: 20, right: 20, bottom: 30, left: 70 },
  width_1 = 580 - margin.left - margin.right,
  height_1 = 580 - margin.top - margin.bottom;

// Parse the date / time
var parseYear = d3.timeParse("%Y");

// Set the ranges
var x = d3.scaleTime().range([0, width_1]);
var y = d3.scaleLinear().range([height_1, 0]);

// Define the line
var valueline = d3
  .line()
  .x(function (d) {
    return x(d.year);
  })
  .y(function (d) {
    return y(d.grade);
  });

var SVG2 = d3.select("#vis_puntos").append("svg");

SVG2.attr("width", 600).attr("height", 600);
// put a border on the rect
SVG2.append("rect")
  .attr("width", 600)
  .attr("height", 600)
  .attr("fill", "rgba(173, 216, 230, 0.4)") // Adjust the opacity value (0.8 in this example)
  // Add border radius
  .attr("rx", 5);

var G = SVG2.append("g").attr(
  "transform",
  "translate(" + margin.left + "," + margin.top + ")"
);

function loadLinegraphData(startYear, endYear) {
  d3.csv("resumen_rendimiento_2010-2022.csv").then( (data) => {
    // If selectedRegions is not empty, filter the data
    console.log(data)
    if (selectedRegions.length > 0) {
      data = data.filter(d => selectedRegions.includes(d.COD_REG_RBD));
    }

    // Group the data by AGNO and COD_DEPE
    var groupedData = d3.group(data, d => d.AGNO, d => d.COD_DEPE);

    // Convert Map to Array and calculate the average of PROM_GRAL for each group
    var result = Array.from(groupedData, ([year, depeMap]) =>
      Array.from(depeMap, ([depe, values]) => ({
        "AGNO": year,
        "COD_DEPE": depe,
        "PROM_GRAL_COMB": d3.mean(values, d => +d.PROM_GRAL).toFixed(9) // Limit to 9 decimal places
      }))
    ).flat(); // Flatten the array

    console.log(result); // Output the result

  }).then((data) => {
    updateLineGraph(data);
  });
}

function updateLineGraph(data) {
  // Group data by 'type'
  var dataByTypeArray = Array.from(d3.group(data, (d) => d.type).entries());

  var yearExtent = d3.extent(data, function (d) {
    return d.year;
  });
  var yearRange = yearExtent[1].getFullYear() - yearExtent[0].getFullYear();
  var padding = yearRange * 0.05; // Adjust padding if needed
  x.domain([
    new Date(yearExtent[0].getFullYear() - padding, 1),
    new Date(yearExtent[1].getFullYear() + padding, 9),
  ]);
  y.domain([4, 7]);

  // Add the X Axis
  if (G.select(".x-axis").empty()) {
    G.append("g")
      .attr("class", "x-axis")
      .attr("transform", "translate(0," + height_1 + ")")
      .call(
        d3
          .axisBottom(x)
          .ticks(d3.timeYear.every(1)) // Increase the tick frequency to every 2 years
          .tickFormat(d3.timeFormat("%Y")) // Format the tick values as 4-digit years
      )
      .selectAll("text")
      .style("font-size", "12px"); // Increase the font size of the axis labels
    G.append("g")
      .append("text")
      .attr("fill", "#000")
      .attr("x", width_1 / 2 - 10)
      .attr("y", 570)
      .text("Año")
      .style("font-size", "15px")
      .style("font-weight", "bold");
  } else {
    G.select(".x-axis")
      .transition()
      .duration(1000)
      .call(
        d3
          .axisBottom(x)
          .ticks(d3.timeYear.every(1)) // Increase the tick frequency to every 2 years
          .tickFormat(d3.timeFormat("%Y")) // Format the tick values as 4-digit years
      )
      .selectAll("text")
      .style("font-size", "12px"); // Increase the font size of the axis labels
  }

  // Add the Y Axis
    if (G.select(".y-axis").empty()) {
    G.append("g")
      .attr("class", "y-axis")
      .call(d3.axisLeft(y))
      .selectAll("text")
      .style("font-size", "12px"); // Increase the font size of the axis labels
    G.append("g")
      .append("text")
      .attr("fill", "#000")
      .attr("x", -height_1 / 2)
      .attr("y", -40)
      .text("Promedio general")
      .style("font-size", "15px")
      .attr("transform", "rotate(-90)")
      .attr("text-anchor", "middle")
      .style("font-weight", "bold");
    } else {
    G.select(".y-axis")
      .transition()
      .duration(1000)
      .call(d3.axisLeft(y))
      .selectAll("text")
      .style("font-size", "12px"); // Increase the font size of the axis labels
    }

  // Add the points
  G.selectAll(".dataPoint")
    .data(data)
    .join(
      (enter) => {
        const G_g = enter.append("g").attr("class", "dataPoint");

        // Create a tooltip element
        var tooltip = d3
          .select("body")
          .append("div")
          .attr("class", "tooltip")
          .style("opacity", 0);

        // Add the points
        G_g.append("circle")
          .attr("class", "dot")
          .attr("r", 5)
          .attr("cx", function (d) {
            return x(d.year);
          })
          .attr("cy", function (d) {
            return y(d.grade);
          })
          .style("fill", function (d) {
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
          .on("mouseover", function (event, d) {
            // Show the tooltip
            tooltip.transition().duration(200).style("opacity", 0.9);

            var sameYearData = data.filter(function (e) {
              return e.year.getTime() === d.year.getTime();
            });

            var diffGrades = sameYearData.map(function (e) {
              return {
                diff: Math.abs(e.grade - d.grade),
                type: e.type,
              };
            });
            tooltip
              .html(
                "<p>Tipo de establecimiento: <strong>" +
                  d.type +
                  "</strong></p>" +
                  "<p>Diferencia de promedio general con establecimientos de tipo:</p>" +
                  diffGrades
                    .map(function (e) {
                      if (e.type !== d.type) {
                        return (
                          "<p><strong>" +
                          e.type +
                          "</strong>" +
                          ": " +
                          d3.format(".3f")(e.diff) +
                          "</p>"
                        );
                      }
                    })
                    .filter(Boolean)
                    .join("")
              )
              .style("left", event.pageX + 10 + "px")
              .style("top", event.pageY - 28 + "px");
          })
          .on("mouseout", function () {
            // Hide the tooltip
            tooltip.transition().duration(500).style("opacity", 0);
          });
      },
      (update) => {
        update
          .select(".dot")
          .transition()
          .duration(1000)
          .attr("cx", function (d) {
            return x(d.year);
          })
          .attr("cy", function (d) {
            return y(d.grade);
          });
      },
      (exit) => exit.remove()
    );

  // Add the valueline path
  G.selectAll(".averageLine")
    .data(dataByTypeArray)
    .join(
      (enter) => {
        const G_g = enter.append("g").attr("class", "averageLine");

        G_g
          .append("path")
          .attr("class", "typePath")
          .attr("fill", "none")
          .attr("stroke", function (d) {
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
          .attr("stroke-width", 1.5)
          .attr("d", function (d) {
          return valueline(d[1]);
        });
      },
      (update) => {
        update
          .select(".typePath")
          .transition()
          .duration(1000)
          .attr("d", function (d) {
            return valueline(d[1]);
          });

        update
          .select(".averageLine")
          .transition()
          .duration(1000)
          .attr("transform", function (d) {
            return (
              "translate(" +
              x(d[1][d[1].length - 1].year) +
              "," +
              y(d[1][d[1].length - 1].grade) +
              ")"
            );
          }
        );
      },
      (exit) => exit.remove()
    );

  // Create a legend
  var legend = SVG2.append("g")
    .attr("class", "legend")
    .attr("transform", "translate(350, 400)");

  var legendBackground = legend
    .append("rect")
    .attr("width", 220) // Adjust the width as needed
    .attr("height", 100); // Adjust the height as needed

  // Define the legend data with pre-established types and colors
  var legendData = [
    { type: "Municipal", color: "red" },
    { type: "Particular Subvencionado", color: "green" },
    { type: "Particular Pagado", color: "purple" },
  ];

  // Add color-coded rectangles and labels to the legend
  var legendItems = legend
    .selectAll(".legend-item")
    .data(legendData)
    .enter()
    .append("g")
    .attr("class", "legend-item")
    .attr("transform", function (d, i) {
      return "translate(20, " + (i * 20 + 20) + ")";
    });

  legendItems
    .append("rect")
    .attr("x", -10)
    .attr("y", 0)
    .attr("width", 14)
    .attr("height", 14)
    .style("fill", function (d) {
      return d.color;
    });

  legendItems
    .append("text")
    .attr("x", 10)
    .attr("y", 9)
    .attr("dy", ".35em")
    .text(function (d) {
      return d.type;
    })
    .style("font-size", "14px");
}

// Update the chart when the user changes the years
setTimeout(function () {
  d3.select("#yearStart").on("change.linegraph", function (d) {
    loadLinegraphData(this.value, d3.select("#yearEnd").property("value"));
  });
}, 1000);

setTimeout(function () {
  d3.select("#yearEnd").on("change.linegraph", function (d) {
    loadLinegraphData(d3.select("#yearStart").property("value"), this.value);
  });
}, 1000);

// Initialize the chart
loadLinegraphData(-Infinity, Infinity);
