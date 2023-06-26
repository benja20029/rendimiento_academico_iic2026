const SVG3 = d3.select("#vis_cajas").append("svg");



SVG3.attr("width", 600).attr("height", 600);
SVG3.append("rect").attr("width", 600).attr("height", 600).attr("fill", "rgba(173, 216, 230, 0.4)");

// Source: https://d3-graph-gallery.com/graph/boxplot_several_groups.html

d3.csv("promedio_general_por_tipo_institucion_2010-2022.csv",
  d => {
    return {
      year: parseYear(d.AGNO),
      grade: +d.PROM_GRAL_COMB,
      type: d.COD_DEPE
    }
  }).then(
    data => {
      // Set the dimensions and margins of the graph
      const margin = { top: 20, right: 10, bottom: 30, left: 40 };
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

      const minimumGrade = d3.min(data, d => d.grade);

      // Show the X scale
      var x = d3.scaleBand()
        .range([ margin.left, width ])
        .domain(["Municipal", "Particular Subvencionado", "Particular Pagado"])
        .paddingInner(1)
        .paddingOuter(.3)
        SVG3.append("g")
        .attr("transform", "translate(0," + (height + margin.top) + ")")
        .call(d3.axisBottom(x))


      // Show the Y scale
      var y = d3.scaleLinear()
        .domain([4, 7])
        .range([height + margin.top, margin.bottom])
      SVG3.append("g").attr("transform", "translate(" + margin.left + "," + 0 + ")")
      .call(d3.axisLeft(y))

      // Show the main vertical line
      SVG3
        .selectAll("vertLines")
        .data(sumstat)
        .enter()
        .append("line")
          .attr("x1", function(d){return(x(d.key))})
          .attr("x2", function(d){return(x(d.key))})
          .attr("y1", function(d){return(y(d.value.min))})
          .attr("y2", function(d){return(y(d.value.max))})
          .attr("stroke", "black")

      // rectangle for the main box
      var boxWidth = 100
      SVG3
        .selectAll("boxes")
        .data(sumstat)
        .enter()
        .append("rect")
            .attr("x", function(d){return(x(d.key)-boxWidth/2)})
            .attr("y", function(d){return(y(d.value.q3))})
            .attr("height", function(d){return(y(d.value.q1)-y(d.value.q3))})
            .attr("width", boxWidth )
            .attr("stroke", "black")
            .style("fill", "#69b3a2")

      // Add the min horizontal line
      SVG3
        .selectAll("lineMin")
        .data(sumstat)
        .enter()
        .append("line")
        .attr("x1", function(d){return(x(d.key)-boxWidth/2) + 25 })
        .attr("x2", function(d){return(x(d.key)+boxWidth/2) - 25})
        .attr("y1", function(d){return(y(d.value.min))})
        .attr("y2", function(d){return(y(d.value.min))})
        .attr("stroke", "black")

      // Add the max horizontal line
      SVG3
        .selectAll("lineMax")
        .data(sumstat)
        .enter()
        .append("line")
        .attr("x1", function(d){return(x(d.key)-boxWidth/2) + 25 })
        .attr("x2", function(d){return(x(d.key)+boxWidth/2) - 25 })
        .attr("y1", function(d){return(y(d.value.max))})
        .attr("y2", function(d){return(y(d.value.max))})
        .attr("stroke", "black")

      // Show the median
      SVG3
        .selectAll("medianLines")
        .data(sumstat)
        .enter()
        .append("line")
          .attr("x1", function(d){return(x(d.key)-boxWidth/2) })
          .attr("x2", function(d){return(x(d.key)+boxWidth/2) })
          .attr("y1", function(d){return(y(d.value.median))})
          .attr("y2", function(d){return(y(d.value.median))})
          .attr("stroke", "black")
    }
  )
