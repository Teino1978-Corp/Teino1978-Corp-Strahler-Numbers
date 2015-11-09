// noprotect
var diameter = 960;

var cluster = d3.layout.cluster()
    .size([diameter, diameter - 550]);

var tree = d3.layout.tree()
    .size([360, diameter / 2])
    .separation(function(a, b) { return (a.parent == b.parent ? 1 : 2) / a.depth; });

var svg = d3.select("body").append("svg")
    .attr("width", diameter)
    .attr("height", diameter)
  .append("g")
    .attr("transform", "translate(" + (diameter / 2 - 50) + "," + (diameter / 2 - 50) + ")")
    .call(d3.behavior.zoom().scaleExtent([0, 5]).on("zoom", zoom))
  .append("g");

function zoom() {
  svg.attr("transform", "translate(" + d3.event.translate + ")scale(" + d3.event.scale + ")");
}

var diagonal = d3.svg.diagonal.radial()
    .projection(function(d) { return [d.y, d.x / 180 * Math.PI]; });

d3.json("http://wafi.iit.cnr.it/webvis/tmp/dbpedia/dbpClassesOntWeight.json", function(error, root) {
  
  d3.json("http://wafi.iit.cnr.it/webvis/tmp/dbpedia/dbpClassesD3.json", function(error, graph) {
    
    var nodes = tree.nodes(root),
        links = tree.links(nodes);
    
    nodeID2Label = {};
    graph.nodes.forEach(function(d) {
      nodeID2Label[d.id] = d.name;
    });
    
    for (i = 0; i < graph.links.length; i++) {
      for (j = 0; j < nodes.length; j++) {
        
        if (nodeID2Label[graph.links[i].source] == nodes[j].name.replace("http://dbpedia.org/ontology/", "")) {
          graph.links[i].source = nodes[j];
        }
          
        if (nodeID2Label[graph.links[i].target] == nodes[j].name.replace("http://dbpedia.org/ontology/", ""))
          graph.links[i].target = nodes[j];
      }
    }
    
    for (i = 0; i < links.length; i++) {
      links[i].weightIn = 0;
      links[i].weightOut = 0;
      links[i].target.linkToParent = links[i];
    }
    
    graph.links.forEach(function(d) {
      fw(d.source, d.target, d.value);
    });
    
    var thickness = d3.scale.linear()
      .domain([1, d3.max([d3.max(links, function(d) {return d.weightIn;}), d3.max(links, function(d) {return d.weightOut;})])])
      .range([0.1, 20]);
    
    var largeness = d3.scale.sqrt()
      .domain([0, d3.max(nodes, function(d) {return d.size;})])
      .range([0,15]);
    
    var linkSelector = svg.selectAll(".link")
        .data(links);

    var enter_g = linkSelector.enter().append("g");

    enter_g.append("path")
      .attr("class", "link in")
      .attr("stroke-width", function(d) {return thickness(d.weightIn);})
      .attr("stroke", "steelblue")
      .attr("d", diagonal);

    enter_g.append("path")
      .attr("class", "link out")
      .attr("stroke-width", function(d) {return thickness(d.weightOut);})
      .attr("stroke", "red")
      .attr("d", diagonal);

    /*link.append("title")
    .text(function(d) {return d.source.name.replace("http://dbpedia.org/ontology/", "") + " - " + d.target.name.replace("http://dbpedia.org/ontology/", "") + " = " + d.value/2;});*/

    var node = svg.selectAll(".node")
        .data(nodes)
      .enter().append("g")
        .attr("class", "node")
        .attr("transform", function(d) { return "rotate(" + (d.x - 90) + ")translate(" + d.y + ")"; });
    
    node.append("circle")
      .attr("r", function(d) {return largeness(d.size);});

    node.append("title")
    .text(function(d) { return d.name.replace("http://dbpedia.org/ontology/", "");});
  });
});

function ul(x, w, direction) {
  if (direction)
    x.linkToParent.weightIn += w;
  else
    x.linkToParent.weightOut += w;
}

function fw(x, y, w) {  
  if (x === y) {
    //console.log(1);
    ul(x, w, false);
  }    
  else if (x.depth == y.depth && x.parent === y.parent) {
    //console.log(2);
    ul(x, w, false);
    ul(y, w, true);
  }
  else if (x.depth == y.depth) {
    //console.log(3);
    fw(x.parent, y.parent, w);
  }    
  else if (x.depth > y.depth && y.parent === x) {
    //console.log(4);
    ul(y, w, true);
  }    
  else if (x.depth < y.depth && x.parent === y) {
    //console.log(5);
    ul(x, w, false);
  }    
  else if (x.depth > y.depth) {
    //console.log(6);
    fw(x.parent, y, w);
    ul(x, w, false);
  }    
  else if (x.depth < y.depth) {
    //console.log(7);
    fw(x, y.parent, w);
    ul(y, w, true);
  }    
}