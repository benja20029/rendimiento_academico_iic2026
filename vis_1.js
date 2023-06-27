// The existing SVG
const SVG1 = createSvg("#vis_mapa", 600, 1500);
// Background rectangle
createRectangle(SVG1, 550, 1250, "rgba(173, 216, 230, 0.4)");

// Define projection
const width = 600;
const height = 1500;

const projection = d3.geoMercator()
  .center([-63, -43])
  .scale(1330)
  .translate([width / 2 + 20, height / 2 + 20]);

// Define path generator
const path = definePath(projection);

// Define color scale
const colorScale = defineColorScale(["red", "yellow", "green", "#006400"], [4.9, 5.5, 6.2, 6.5]);

// Create tooltip
const tooltip = createTooltip("body", "tooltip", 0);

createTitle("#vis_mapa", "selectTitle", "Filtrar por tipo de establecimiento:", "absolute", "200px", "680px");
createTitle("#vis_mapa", "startYear", "Año de inicio:", "absolute", "200px", "740px");
createTitle("#vis_mapa", "endYear", "Año de término:", "absolute", "200px", "800px");


// Create dropdown
const dropdown = createDropdown(
  "#vis_mapa",
  "select",
  "svg",
  "typeSelect",
  "absolute",
  "270px",
  "700px",
  ["Predeterminado", "Municipal", "Particular Subvencionado", "Particular Pagado"],
  "200px",
  "30px"
);

// Create year start dropdown
const yearStartDropdown = createDropdown(
  "#vis_mapa",
  "select",
  "svg",
  "yearStart",
  "absolute",
  "270px",
  "760px",
  [],
  "200px",
  "30px"
);

// Create year end dropdown
const yearEndDropdown = createDropdown(
  "#vis_mapa",
  "select",
  "svg",
  "yearEnd",
  "absolute",
  "270px",
  "820px",
  [],
  "200px",
  "30px"
);

yearEndDropdown.property("value", "2022");

// Load grade data
d3.csv("resumen_rendimiento_2010-2022.csv").then(function (gradeData) {
  var years = getUniqueYears(gradeData);
  years.sort(); // Sort the years in ascending order


  // Add the rest of the years as options
  yearStartDropdown
    .selectAll("option")
    .data(years)
    .enter()
    .append("option")
    .attr("value", function (d) {
      return d;
    })
    .text(function (d) {
      return d;
    });

    yearEndDropdown
    .selectAll("option")
    .data(years)
    .enter()
    .append("option")
    .attr("value", function (d) {
      return d;
    })
    .text(function (d) {
      return d;
    })
    .attr("selected", function(d) {
      return d === "2022" ? "selected" : null;
    });
  

  var selectedType = dropdown.node().value;
  var selectedStartYear = yearStartDropdown.node().value;
  var selectedEndYear = yearEndDropdown.node().value;
  var averageGrades = calculateAverages(gradeData, selectedType, selectedStartYear, selectedEndYear);

  // Load and draw map
  d3.json("chile.json").then(function (topo) {
    topology = topo;
    drawMap(averageGrades, topo, SVG1, path, colorScale, tooltip, selectedType);
    dropdown.on("change", function () {
      SVG1.selectAll(".region").remove();
      selectedType = d3.select(this).node().value;
      var averages = calculateAverages(gradeData, selectedType, selectedStartYear, selectedEndYear);
      drawMap(averages, topo, SVG1, path, colorScale, tooltip, selectedType);
    });
    yearStartDropdown.on("change", function () {
      SVG1.selectAll(".region").remove();
      selectedStartYear = d3.select(this).node().value;
      var averages = calculateAverages(gradeData, selectedType, selectedStartYear, selectedEndYear);
      drawMap(averages, topo, SVG1, path, colorScale, tooltip, selectedType);
    });
    yearEndDropdown.on("change", function () {
      SVG1.selectAll(".region").remove();
      selectedEndYear = d3.select(this).node().value;
      var averages = calculateAverages(gradeData, selectedType, selectedStartYear, selectedEndYear);
      drawMap(averages, topo, SVG1, path, colorScale, tooltip, selectedType);
    });

    // Initial map display
    drawMap(averageGrades, topo, SVG1, path, colorScale, tooltip, selectedType);
  });

  // Legend
  const legend = createLegend(SVG1, "g", "legend", "translate(20,30)", "Promedio general", "15px", "bold");
  SVG1.select(".legend").call(createLegendLinear(colorScale));
});
  function getUniqueYears(data) {
    var years = [];
    data.forEach(function (d) {
      if (!years.includes(d.AGNO)) {
        years.push(d.AGNO);
      }
    });
    return years;
  }

function createSvg(selector, width, height) {
  return d3.select(selector).append("svg")
    .attr("width", width)
    .attr("height", height);
}

function createRectangle(svg, width, height, fill) {
  return svg.append("rect")
    .attr("width", width)
    .attr("height", height)
    .attr("fill", fill);
}

function defineProjection(center, scale, rotate) {
  return d3.geoMercator()
    .center(center)
    .scale(scale)
    .rotate(rotate);
}

function definePath(projection) {
  return d3.geoPath().projection(projection);
}

function defineColorScale(range, domain) {
  return d3.scaleLinear().range(range).domain(domain);
}

function createTooltip(selector, className, opacity) {
  return d3.select(selector).append("div")
    .attr("class", className)
    .style("opacity", opacity);
}

function createDropdown(selector, element, insertBefore, id, position, left, top, data, width, height) {
  var dropdown = d3.select(selector)
    .insert(element, insertBefore)
    .attr("id", id)
    .style("position", position)
    .style("left", left)
    .style("top", top)
    .style("width", width)   // new
    .style("height", height) // new
    .style("font-size", "15px")
    // Align to the right
    .style("text-align", "left");

  dropdown.selectAll("option")
    .data(data)
    .enter()
    .append("option")
    .attr("value", function (d) { return d; })
    .text(function (d) { return d; });

  return dropdown;
}

function calculateAverages(gradeData, selectedType, selectedStartYear, selectedEndYear) {
    const averages = gradeData.reduce((acc, curr) => {
      if (
        (selectedStartYear === "2010" || curr.AGNO >= selectedStartYear) &&
        (selectedEndYear === "2022" || curr.AGNO <= selectedEndYear) &&
        (selectedType === "Predeterminado" || curr.COD_DEPE === selectedType)
      ) {
        let region = curr.COD_REG_RBD;
        let grade = Number(curr.PROM_GRAL);
        if (!acc[region]) {
          acc[region] = { total: grade, count: 1 };
        } else {
          acc[region].total += grade;
          acc[region].count += 1;
        }
      }
      return acc;
    }, {});
  
    return Object.keys(averages).reduce((acc, region) => {
      acc[region] = averages[region].total / averages[region].count;
      return acc;
    }, {});
  }  

function drawMap(averages, topo, svg, path, colorScale, tooltip, selectedType) {
  const regions = svg.selectAll(".region")
    .data(topojson.feature(topo, topo.objects.regiones).features)
    .enter()
    .append("g")
    .attr("class", "region");

  regions.append("path")
    .attr("d", path)
    .style("fill", function (d) {
      const regionName = d.properties.NOM_REG;
      const averageGrade = averages[regionName];
      return averageGrade ? colorScale(averageGrade) : "grey";
    })
    .on("mouseover", (event, d) => {
      const regionName = d.properties.NOM_REG;
      const averageGrade = averages[regionName];
      tooltip.transition()
        .duration(200)
        .style("opacity", .9);
      tooltip.html(regionName + (averageGrade ? ("<br/>Promedio general: " + averageGrade.toFixed(2)) : ""))
        .style("left", (event.pageX) + "px")
        .style("top", (event.pageY - 28) + "px");
    })
    .on("mouseout", (event, d) => {
      tooltip.transition()
        .duration(500)
        .style("opacity", 0);
    });

  regions.append("text")
    .attr("text-anchor", "middle")
    .style("fill", "black")
    .style("font-size", "10px")
    .style("font-weight", "bold")
    .attr("transform", function (d) {
      let centroid = path.centroid(d);
      if (isNaN(centroid[0]) || isNaN(centroid[1])) {
        centroid = [svg.attr("width") / 2, svg.attr("height") / 2];
      }
      centroid = adjustCentroid(centroid, d.properties.NOM_REG);
      return "translate(" + centroid + ")";
    })
    .text(function (d) {
      const regionName = d.properties.NOM_REG;
      const averageGrade = averages[regionName];
      return averageGrade ? averageGrade.toFixed(2) : "";
    });
}

function adjustCentroid(centroid, regionName) {
  const adjustments = {
    "Región de Los Lagos": [0, -20],
    "Región de Arica y Parinacota": [0, 5],
    "Región de Valparaíso": [3, 0],
    "Región del Libertador Bernardo O'Higgins": [0, 5],
    "Región de Aysén del Gral. Ibañez del Campo": [10, 0],
    "Región de Magallanes y Antártica Chilena": [10, -5],
  };

  const adjustment = adjustments[regionName];

  if (adjustment) {
    centroid[0] += adjustment[0];
    centroid[1] += adjustment[1];
  }

  return centroid;
}

function createLegend(svg, element, className, transform, text, fontSize, fontWeight) {
  const legend = svg.append(element)
    .attr("class", className)
    .attr("transform", transform);
  legend.append("text")
    .attr("class", "legendTitle")
    .attr("x", 85)
    .attr("y", -10)
    .text(text)
    .style("font-size", fontSize)
    .style("font-weight", fontWeight);
  return legend;
}

function createTitle(selector, id, text, position, left, top) {
  d3.select(selector)
    .append("div")
    .attr("id", id)
    .style("position", position)
    .style("left", left)
    .style("top", top)
    .text(text);
}

function createLegendLinear(colorScale) {
  return d3.legendColor()
    .shapeWidth(30)
    .cells(10)
    .orient('horizontal')
    .scale(colorScale);
}
