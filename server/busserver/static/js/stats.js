let stops, services = {}, serviceType = {};
let buses = {};

init();

function init() {
  fetch('/static/js/bus-stops.min.json')
    .then((r) => r.json())
    .then((s) => {
      stops = s;

      fetch('/static/js/bus-stops-services.json')
        .then((r) => r.json())
        .then((d) => {
          Object.keys(d).forEach((s_no) => {
            if ( s_no in stops ) {
              stops[s_no].buses = d[s_no];
            }
          });

          showStops();
        });
    });

  fetch('/static/js/bus-services.min.json')
    .then((r) => r.json())
    .then((s) => {
      services = s.services;
      serviceType = s.types;

      showServices();
    });
}

function animate(delay) {
  if ( delay === false ) return;

  setTimeout(animate, time);
}

function showStops() {
  const colors = {
    1: '#3388ff',
    2: '#d8b365',
    3: '#af8dc3',
    7: '#7fbf7b',
    8: '#5ab4ac',
    9: '#ff8833'
  };

  let stopRoutes = [];

  Object.keys(stops).forEach((s_no) => {
    let s = stops[s_no];
    let color = colors[s.side];
    let tooltip = `${s_no}: ${s.name}`;
    stopRoutes.push(s.buses.length);
    s.display = null;
  });

  createHist('#stoproutes', stopRoutes, [1, 40]);
}

function showServices() {
  const colors = {
    0: '#d8b365',
    1: '#3388ff',
    2: '#ff8833'
  };

	let routeStops = [];
	let routeLengths = [];

  Object.keys(services).forEach((s_no) => {
    let s = services[s_no];
    s.routes.forEach((r) => {
      let color = colors[r.loop ? 0 : r.direction];
      routeStops.push(r.stops.length);
      routeLengths.push(r.route_length);

      let bin = Math.floor(r.route_length / 2) * 2;

      /*
      if (bin in routeLengths) {
        routeLengths[bin][s.type] += 1;
      } else {
        routeLengths[bin] = { 0: 0, 1: 0, 2: 0, 'undefined': 0 };
      }
      */

      r.display = null;
    });
  });

  //Object.keys(routeLengths).forEach((b) => { });

  createHist('#routestops', routeStops, [1, 105]);
  createHist('#routelength', routeLengths, [0, 75]);
  // createStackedBar('#routelength', routeLengths, ['trunk' 'feeder', 'nite']);
}

function createHist(selector, data, domain, numBins = 30) {
  let formatCount = d3.format(',.0f');

	let svg = d3.select(selector)
    margin = {top: 10, right: 20, bottom: 20, left: 20}
    width = +svg.attr('width') - margin.left - margin.right
    height = +svg.attr('height') - margin.top - margin.bottom
    g = svg.append('g').attr('transform', `translate(${margin.left}, ${margin.top})`);

  let x = d3.scaleLinear().domain(domain).rangeRound([0, width]);
  let bins = d3.histogram().domain(x.domain()).thresholds(x.ticks(numBins))(data);
  let y = d3.scaleLinear().domain([0, d3.max(bins, (d) => d.length)]).range([height, 0]);

  let bar = g.selectAll('.bar')
    .data(bins)
    .enter().append('g')
    .attr('class', 'bar')
    .attr('transform', (d) => `translate(${x(d.x0)},${y(d.length)})`);

  bar.append('rect')
    .attr('x', 1)
    .attr('width', x(bins[0].x1) - x(bins[0].x0) - 1)
    .attr('height', (d) => (height - y(d.length)));

  bar.append('text')
    .attr('dy', '.75em')
    .attr('y', 6)
    .attr('x', (x(bins[0].x1) - x(bins[0].x0)) / 2)
    .attr('text-anchor', 'middle')
    .text((d) => formatCount(d.length));

  g.append('g')
    .attr('class', 'axis axis--x')
    .attr('transform', `translate(0,${height})`)
    .call(d3.axisBottom(x));
}

function createStackedBar(selector, data, keys) {
  let formatCount = d3.format(',.0f');

	let svg = d3.select(selector)
    margin = {top: 10, right: 20, bottom: 20, left: 20}
    width = +svg.attr('width') - margin.left - margin.right
    height = +svg.attr('height') - margin.top - margin.bottom
    g = svg.append('g').attr('transform', `translate(${margin.left}, ${margin.top})`);

	let x = d3.scaleBand()
    .rangeRound([0, width])
    .paddingInner(0.05)
    .align(0.1);

	let y = d3.scaleLinear().rangeRound([height, 0]);

	let z = d3.scaleOrdinal()
    .range(['#98abc5', '#8a89a6', '#7b6888', '#6b486b', '#a05d56', '#d0743c', '#ff8c00']);

  x.domain(data.map((d) => d.bin));
  y.domain([0, d3.max(data, (d) => d.total)]).nice();
  z.domain(keys);

  g.append('g')
    .selectAll('g')
    .data(d3.stack().keys(keys)(data))
    .enter().append('g')
      .attr('fill', (d) => z(d.key))
    .selectAll('rect')
    .data((d) => d)
    .enter().append('rect')
      .attr('x', (d) => x(d.data.State))
      .attr('y', (d) => y(d[1]))
      .attr('height', (d) => (y(d[0]) - y(d[1])))
      .attr('width', x.bandwidth());

  g.append('g')
      .attr('class', 'axis')
      .attr('transform', 'translate(0,' + height + ')')
      .call(d3.axisBottom(x));

  g.append('g')
      .attr('class', 'axis')
      .call(d3.axisLeft(y).ticks(null, 's'))
    .append('text')
      .attr('x', 2)
      .attr('y', y(y.ticks().pop()) + 0.5)
      .attr('dy', '0.32em')
      .attr('fill', '#000')
      .attr('font-weight', 'bold')
      .attr('text-anchor', 'start')
      .text('Population');

  let legend = g.append('g')
      .attr('font-family', 'sans-serif')
      .attr('font-size', 10)
      .attr('text-anchor', 'end')
    .selectAll('g')
    .data(keys.slice().reverse())
    .enter().append('g')
      .attr('transform', (d, i) => 'translate(0,' + i * 20 + ')');

  legend.append('rect')
      .attr('x', width - 19)
      .attr('width', 19)
      .attr('height', 19)
      .attr('fill', z);

  legend.append('text')
      .attr('x', width - 24)
      .attr('y', 9.5)
      .attr('dy', '0.32em')
      .text((d) => d);
}
