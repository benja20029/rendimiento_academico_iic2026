const SVG3 = d3.select("#vis_cajas").append("svg");

SVG3.attr("width", 600).attr("height", 600);
SVG3.append("rect").attr("width", 600).attr("height", 600).attr("fill", "rgba(173, 216, 230, 0.4)");

// Source: https://d3-graph-gallery.com/graph/boxplot_several_groups.html


function loadBoxplotData(startYear, endYear) {
  d3.csv("promedio_general_por_tipo_institucion_2010-2022.csv",
    d => {
      if (d.AGNO >= startYear && d.AGNO <= endYear) {
        return {
          year: parseYear(d.AGNO),
          grade: +d.PROM_GRAL_COMB,
          type: d.COD_DEPE
        }
      }
  }).then(
    data => {
      updateBoxplot(data);
    }
  )
}

function updateBoxplot(data) {
    // Set the dimensions and margins of the graph
    const margin = { top: 20, right: 10, bottom: 60, left: 60 };
    const height = 600 - margin.top - margin.bottom;
    const width = 600 - margin.left - margin.right;

  // Compute quartiles, median, inter quantile range min and max --> these info are then used to draw the box.
    var sumstat = Array.from(d3.rollup(data,
      function(d) {
        q1 = d3.quantile(d.map(function(g) { return g.grade;}).sort(d3.ascending),.25)
        median = d3.quantile(d.map(function(g) { return g.grade;}).sort(d3.ascending),.5)
        q3 = d3.quantile(d.map(function(g) { return g.grade;}).sort(d3.ascending),.75)
        interQuantileRange = q3 - q1
        min = q1 - 1.5 * interQuantileRange
        max = q1 + 1.5 * interQuantileRange
        return({q1: q1, median: median, q3: q3, interQuantileRange: interQuantileRange, min: min, max: max})
      },
      d => d.type), ([key, value]) => ({key, value}));

    var x = d3
      .scaleBand()
      .range([margin.left, width])
      .domain(["Municipal", "Particular Subvencionado", "Particular Pagado"])
      .paddingInner(1)
      .paddingOuter(0.3);


    var y = d3
      .scaleLinear()
      .domain([4, 7])
      .range([height + margin.top, margin.top]);

    // Show the X scale
    if (SVG3.selectAll(".x-axis").empty()) {
      SVG3.append("g")
        .attr("class", "x-axis")
        .attr("transform", "translate(0," + (height + margin.top) + ")")
        .call(d3.axisBottom(x));
      SVG3.append("text")
        .attr("class", "x label")
        .attr("text-anchor", "middle")
        .attr("x", width/2 + margin.left)
        .attr("y", height + margin.top + 40)
        .text("Tipo de establecimiento")
        .style("font-size", "15px")
        .style("font-weight", "bold");

    }
    // Show the Y scale
    if (SVG3.selectAll(".y-axis").empty()) {
      SVG3.append("g")
        .attr("class", "y-axis")
        .attr("transform", "translate(" + margin.left + "," + 0 + ")")
        .call(d3.axisLeft(y));
      SVG3.append("text")
        .attr("class", "y label")
        .attr("text-anchor", "middle")
        .attr("x", -height/2 - margin.left)
        .attr("y", margin.left - 40)
        .attr("transform", "rotate(-90)")
        .text("Promedio general")
        .style("font-size", "15px")
        .style("font-weight", "bold");
    }

    // rectangle for the main box
    const boxWidth = 100
    SVG3
      .selectAll(".boxPlotItem")
      .data(sumstat, d => d.key)
      .join(
        enter => {
          const G = enter.append("g").attr("class", "boxPlotItem")

          // Show the main vertical line
          G.append("line")
              .attr("class", "verticalLine")
              .attr("x1", function(d){return(x(d.key))})
              .attr("x2", function(d){return(x(d.key))})
              .attr("y1", function(d){return(y(d.value.min))})
              .attr("y2", function(d){return(y(d.value.max))})
              .attr("stroke", "black")


          G.append("rect")
                .attr("class", "box")
                .attr("x", function(d){return(x(d.key)-boxWidth/2)})
                .attr("y", function(d){return(y(d.value.q3))})
                .attr("height", function(d){return(y(d.value.q1)-y(d.value.q3))})
                .attr("width", boxWidth )
                .attr("stroke", "black")
                .style("fill", "#69b3a2")

          // Show the median
          G.append("line")
              .attr("class", "medianLine")
              .attr("x1", function(d){return(x(d.key)-boxWidth/2) })
              .attr("x2", function(d){return(x(d.key)+boxWidth/2) })
              .attr("y1", function(d){return(y(d.value.median))})
              .attr("y2", function(d){return(y(d.value.median))})
              .attr("stroke", "black")

          // Add the min horizontal line
          G.append("line")
            .attr("class", "minLine")
            .attr("x1", function(d){return(x(d.key)-boxWidth/2) + 25 })
            .attr("x2", function(d){return(x(d.key)+boxWidth/2) - 25})
            .attr("y1", function(d){return(y(d.value.min))})
            .attr("y2", function(d){return(y(d.value.min))})
            .attr("stroke", "black")

          // Add the max horizontal line
          G.append("line")
            .attr("class", "maxLine")
            .attr("x1", function(d){return(x(d.key)-boxWidth/2) + 25 })
            .attr("x2", function(d){return(x(d.key)+boxWidth/2) - 25 })
            .attr("y1", function(d){return(y(d.value.max))})
            .attr("y2", function(d){return(y(d.value.max))})
            .attr("stroke", "black")
        },
        update => {
          update.select(".verticalLine")
            .transition()
            .duration(1000)
            .attr("x1", function(d){return(x(d.key))})
            .attr("x2", function(d){return(x(d.key))})
            .attr("y1", function(d){return(y(d.value.min))})
            .attr("y2", function(d){return(y(d.value.max))})

          update.select(".box")
            .transition()
            .duration(1000)
            .attr("x", function(d){return(x(d.key)-boxWidth/2)})
            .attr("y", function(d){return(y(d.value.q3))})
            .attr("height", function(d){return(y(d.value.q1)-y(d.value.q3))})

          update.select(".medianLine")
            .transition()
            .duration(1000)
            .attr("x1", function(d){return(x(d.key)-boxWidth/2) })
            .attr("x2", function(d){return(x(d.key)+boxWidth/2) })
            .attr("y1", function(d){return(y(d.value.median))})
            .attr("y2", function(d){return(y(d.value.median))})

          update.select(".minLine")
            .transition()
            .duration(1000)
            .attr("x1", function(d){return(x(d.key)-boxWidth/2) + 25 })
            .attr("x2", function(d){return(x(d.key)+boxWidth/2) - 25})
            .attr("y1", function(d){return(y(d.value.min))})
            .attr("y2", function(d){return(y(d.value.min))})

          update.select(".maxLine")
            .transition()
            .duration(1000)
            .attr("x1", function(d){return(x(d.key)-boxWidth/2) + 25 })
            .attr("x2", function(d){return(x(d.key)+boxWidth/2) - 25 })
            .attr("y1", function(d){return(y(d.value.max))})
            .attr("y2", function(d){return(y(d.value.max))})
        },
        exit => {
            exit.remove()
        }
      )
}

// Update the chart when the user changes the years
setTimeout(function() {
  d3.select("#yearStart").on("change.boxplot", function(d) {
    loadBoxplotData(this.value, d3.select("#yearEnd").property("value"));
  });
}, 1000);

setTimeout(function() {
  d3.select("#yearEnd").on("change.boxplot", function(d) {
    loadBoxplotData(d3.select("#yearStart").property("value"), this.value);
  });
}, 1000);

// Initialize the chart
loadBoxplotData(-Infinity, Infinity);
