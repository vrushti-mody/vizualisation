var states = [
      ['Arizona', 'AZ'],
      ['Alabama', 'AL'],
      ['Alaska', 'AK'],
      ['Arkansas', 'AR'],
      ['California', 'CA'],
      ['Colorado', 'CO'],
      ['Connecticut', 'CT'],
      ['Delaware', 'DE'],
      ['Florida', 'FL'],
      ['Georgia', 'GA'],
      ['Hawaii', 'HI'],
      ['Idaho', 'ID'],
      ['Illinois', 'IL'],
      ['Indiana', 'IN'],
      ['Iowa', 'IA'],
      ['Kansas', 'KS'],
      ['Kentucky', 'KY'],
      ['Louisiana', 'LA'],
      ['Maine', 'ME'],
      ['Maryland', 'MD'],
      ['Massachusetts', 'MA'],
      ['Michigan', 'MI'],
      ['Minnesota', 'MN'],
      ['Mississippi', 'MS'],
      ['Missouri', 'MO'],
      ['Montana', 'MT'],
      ['Nebraska', 'NE'],
      ['Nevada', 'NV'],
      ['New Hampshire', 'NH'],
      ['New Jersey', 'NJ'],
      ['New Mexico', 'NM'],
      ['New York', 'NY'],
      ['North Carolina', 'NC'],
      ['North Dakota', 'ND'],
      ['Ohio', 'OH'],
      ['Oklahoma', 'OK'],
      ['Oregon', 'OR'],
      ['Pennsylvania', 'PA'],
      ['Rhode Island', 'RI'],
      ['South Carolina', 'SC'],
      ['South Dakota', 'SD'],
      ['Tennessee', 'TN'],
      ['Texas', 'TX'],
      ['Utah', 'UT'],
      ['Vermont', 'VT'],
      ['Virginia', 'VA'],
      ['Washington', 'WA'],
      ['West Virginia', 'WV'],
      ['Wisconsin', 'WI'],
      ['Wyoming', 'WY'],
];

//Found online -> abbreviations to full name and vice versa
function abbrState(input, to){
    if (to == 'abbr'){
        input = input.replace(/\w\S*/g, function(txt){return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();});
        for(i = 0; i < states.length; i++){
            if(states[i][0] == input){
                return(states[i][1]);
            }
        }    
    } else if (to == 'name'){
        input = input.toUpperCase();
        for(i = 0; i < states.length; i++){
            if(states[i][1] == input){
                return(states[i][0]);
            }
        }    
    }
}

//formatting dates
var formatDateIntoYear = d3.timeFormat("%Y");
var formatDate = d3.timeFormat("%b %Y");
var getDate = d3.timeFormat("%x");
var parseDate = d3.timeParse("%m/%d/%y");

function mouseOverHandler(d, i) {
  d3.select(this).attr("fill", "#d36f80")
}

function mouseOutHandler(d, i) {
  d3.select(this).attr("fill", color(i))
}

function clickHandler(d, i) {
  d3.select(this).attr("fill", "#d86e35")
}

d3.csv("mentalHealth.csv", function(data) {
  var covidData = data
  var width = 1200, height = 500;

  var path = d3.geo.path();
  var svg = d3.select("#canvas-svg").append("svg")
      .attr("width", width)
      .attr("height", height);

  var mycolor = d3.scaleLinear()
    .domain([0, 5000])
    .range(['green','red']);

  function accessDateData(data, date){
    var temp = data.filter(a => {
      var dataDate = a.submission_date;
      return (dataDate == date);
    })
    return temp
  }

  d3.json("https://cdn.jsdelivr.net/npm/us-atlas@3/states-10m.json", function(us) {
    var features = topojson.feature(us, us.objects.states).features

    updateMap(getDate(new Date("1/22/2020")))

    function updateMap(date) {
      var temp = accessDateData(covidData,date)
      for (var i = 0; i < temp.length; i++) {
        var dataState = abbrState(temp[i].state, 'name');
        var dataValue = temp[i].new_case;
        for (var j = 0; j < features.length; j++){
          if (dataState == features[j].properties.name) {
            features[j].properties.newCases = dataValue; 
            break;
          }
        }
      }
      console.log(features)
    
      const map = svg.select('g').selectAll("path").data(features);
      map.style("fill", function(d) {
        var value = d.properties.newCases;
        if (value) {
          return mycolor(value);
        } else {
          return "rgb(180,180,180)";
        }
      })
    }
    svg.append("g")
      .attr("class", "states-choropleth")
      .selectAll("path")
      .data(features)
      .enter()
      .append("path")
      .style("fill", function(d) {
      	var value = d.properties.newCases;
        if (value) {
          return mycolor(value);
        } else {
          return "rgb(180,180,180)";
        }
      })
      .attr("d", path)
      .on("mouseover", mouseOverHandler)
      .on("mouseout", mouseOutHandler)
      .on("click", clickHandler);

    svg.append('g').attr('class', 'labels')
    .selectAll('.label').data(features).enter().append('text')
        .attr("class", "halo")
        .attr('transform', function(d) {
            return "translate(" + path.centroid(d) + ")";
        })
        .attr("font-weight", 300)
        .style('text-anchor', 'middle')
        .style("font", "12px times")
        .text(function(d) {
            return abbrState(d.properties.name, 'abbr')
        });
    
    svg.append("path")
      .datum(topojson.mesh(us, us.objects.states, function(a, b) { return a !== b; }))
      .attr("class", "states")
      .attr("d", path)

    var moving = false;
    var currentValue = 0;
    var targetValue = 800;
    var svgSlider = d3.select("#slider")
      .append("svg")
      .attr("width", width )
      .attr("height", 80);
    
    var x = d3.scaleTime()
      .domain([new Date("1/22/2020"), new Date("2/28/2022")])
      .range([0, targetValue])
      .clamp(true);

    var slider = svgSlider.append("g")
      .attr("class", "slider")
      .attr("transform", "translate(" + 50+ "," + 50 + ")");


    slider.append("line")
      .attr("class", "track")
      .attr("x1", x.range()[0])
      .attr("x2", x.range()[1])
    .select(function() { return this.parentNode.appendChild(this.cloneNode(true)); })
      .attr("class", "track-inset")
    .select(function() { return this.parentNode.appendChild(this.cloneNode(true)); })
      .attr("class", "track-overlay")
      .call(d3.drag()
        .on("start.interrupt", function() { slider.interrupt(); })
        .on("drag", function() { update(x.invert(d3.event.x));}));

    slider.insert("g", ".track-overlay")
      .attr("class", "ticks")
      .attr("transform", "translate(0," + 18 + ")")
    .selectAll("text")
      .data(x.ticks(10))
      .enter()
      .append("text")
      .attr("x", x)
      .attr("y", 10)
      .attr("text-anchor", "middle")
      .text(function(d) { return formatDateIntoYear(d); });

    var handle = slider.insert("circle", ".track-overlay")
        .attr("class", "handle")
        .attr("r", 9);
    
    var label = slider.append("text")  
        .attr("class", "label")
        .attr("text-anchor", "middle")
        .text(formatDate(new Date("1/22/2020")))
        .attr("transform", "translate(0," + (-25) + ")")

    function update(h) {
      console.log(getDate(h))
      handle.attr("cx", x(h));
      label.attr("x", x(h)).text(formatDate(h));
      updateMap(getDate(h));
    }
  })
});