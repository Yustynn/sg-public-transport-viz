const MAP_TILES = 'https://maps-{s}.onemap.sg/v3/Night/{z}/{x}/{y}.png';
const BOUNDS = [[1.56073, 104.11475], [1.16, 103.502]];

let map, basemap;
let serviceRouteGroup;
let busGroup, busStopGroup;
let stops, services = {}, serviceType = {};
let buses = {};

let gui;
let settings = {
  showBuses: true,
  showStops: false,
  showRoutes: false,
  animateMap: false
};

let routeFilters = {
  showLoop: false,
  showTrunk: true,
  minLength: 0,
  maxLength: 75
};

let stopFilters = {
  show1: true,
  show9: true,
  showOthers: false
};

init();

function init() {
  let center = L.bounds(...BOUNDS).getCenter();
  map = L.map('map').setView([center.x, center.y], 12).setMaxBounds(BOUNDS);

  basemap = L.tileLayer(MAP_TILES, {detectRetina: true, maxZoom: 18, minZoom: 12});
  basemap.addTo(map);

  busGroup = L.layerGroup();
  busStopGroup = L.layerGroup();
  serviceRouteGroup = L.layerGroup();

  busGroup.addTo(map);

  fetch('/data/processed.min.json')
    .then((r) => r.json())
    .then((s) => {
      stops = s.stops;
      showStops();
      services = s.services;
      serviceType = s.types;
      showServices();

      updateStopFilters();
      updateRouteFilters();

      map.on('zoomend', (e) => {
        let z = e.target._zoom - 11;
        let n = {
          stroke: z < 3 ? 2 : 3
        };
        busStopGroup.eachLayer((s) => s.setRadius(z));
        serviceRouteGroup.eachLayer((s) => s.setStyle(n));
      });
    });

  getBuses();

  gui = new dat.GUI({resizable: false});

  gui.add(settings, 'showBuses').onFinishChange((v) => setLayer(map, busGroup, v));
  gui.add(settings, 'showStops').onFinishChange((v) => setLayer(map, busStopGroup, v));

  let guiSFilter = gui.addFolder('stop filters');

  guiSFilter.add(stopFilters, 'show1').onFinishChange(updateStopFilters);
  guiSFilter.add(stopFilters, 'show9').onFinishChange(updateStopFilters);
  guiSFilter.add(stopFilters, 'showOthers').onFinishChange(updateStopFilters);

  gui.add(settings, 'showRoutes').onFinishChange((v) => setLayer(map, serviceRouteGroup, v));

  let guiRFilter = gui.addFolder('route filters');

  guiRFilter.add(routeFilters, 'showLoop').onFinishChange(updateRouteFilters);
  guiRFilter.add(routeFilters, 'showTrunk').onFinishChange(updateRouteFilters);
  guiRFilter.add(routeFilters, 'maxLength', 0, 75).onFinishChange(updateRouteFilters);
  guiRFilter.add(routeFilters, 'minLength', 0, 75).onFinishChange(updateRouteFilters);

  gui.add(settings, 'animateMap').onFinishChange(animate);

  gui.close();
}

function animate() {
  if ( ! settings.animateMap ) return;

  setTimeout(animate, 1000);
}

function setLayer(g, l, v) {
  let visible = g.hasLayer(l);
  if ( v === undefined ) { v = !visible; }
  if ( v && (!visible) ) {
    g.addLayer(l);
  } else if ( (!v) && visible ) {
    g.removeLayer(l);
  }
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

  Object.keys(stops).forEach((s_no) => {
    let s = stops[s_no];
    let color = colors[s.side];
    let tooltip = `${s_no}: ${s.name}`;
    let prop = {
      color,
      radius: 2
    };

    stops[s_no].marker = L.circleMarker(s.latlng, prop);
  });
}

function showServices() {
  const colors = {
    0: '#d8b365',
    1: '#3388ff',
    2: '#ff8833'
  };

  Object.keys(services).forEach((s_no) => {
    services[s_no].routes.forEach((r) => {
      let color = colors[r.loop ? 0 : r.direction];
      let prop = {
        color,
        weight: 2
      };
      r.line = L.polyline(r.polyline, prop);
    });
  });
}

function filterRouteLength(r) {
  let minLength = routeFilters.minLength || 0;
  let maxLength = routeFilters.maxLength || 75;
  return (r.route_length > minLength && r.route_length < maxLength);
}

function filterType(r) {
  let showLoop = routeFilters.showLoop;
  let showTrunk = routeFilters.showTrunk;
  return ((r.loop && showLoop) || ((!r.loop) && showTrunk));
}

function updateRouteFilters() {
  let show;
  Object.keys(services).forEach((s_no) => {
    services[s_no].routes.forEach((r) => {
      show = filterType(r) && filterRouteLength(r);
      setLayer(serviceRouteGroup, r.line, show);
    });
  });
}

function updateStopFilters() {
  let showStopSides = {
    1: stopFilters.show1,
    2: stopFilters.showOthers,
    3: stopFilters.showOthers,
    7: stopFilters.showOthers,
    8: stopFilters.showOthers,
    9: stopFilters.show9
  };

  let show, s;
  Object.keys(stops).forEach((s_no) => {
    s = stops[s_no];
    show = showStopSides[s.side];
    setLayer(busStopGroup, s.marker, show);
  });
}

function getBuses() {
  let bounds = map.getBounds().toBBoxString();
  fetch(`/api/buses?bounds=${bounds}`)
    .then((r) => r.json())
    .then((d) => {
      d.buses.map(updateBus);
    });
}

function updateBus(details) {
  let [ busID, stop, service, arrival, lat, lng, timestamp ] = details;

  let latlng = [lat, lng].map(parseFloat);
  if ( latlng.some((l) => !l) ) {
    return;
  }

  if ( busID in buses ) {
    buses[busID].setLatLng(latlng);
  } else {
    buses[busID] = L.circleMarker(latlng, {radius: 2}).addTo(busGroup);
  }
}
