const MAP_TILES = 'https://maps-{s}.onemap.sg/v3/Night/{z}/{x}/{y}.png';
const BOUNDS = [[1.56073, 104.11475], [1.16, 103.502]];

let center = L.bounds(...BOUNDS).getCenter();
let map = L.map('map').setView([center.x, center.y], 12).setMaxBounds(BOUNDS);

let basemap = L.tileLayer(MAP_TILES, {detectRetina: true, maxZoom: 18, minZoom: 12});
basemap.addTo(map);

let stops;
let services = {}, serviceType = {};

let routeLayers = {};
let routeLayerGroup = L.layerGroup().addTo(map);

fetch('../data/bus-stops.json')
  .then((r) => r.json())
  .then((s) => { stops = s; })

fetch('../data/bus-services.json')
  .then((r) => r.json())
  .then((s) => { services = s.services; serviceType = s.types; serviceLines(); });

function getService(bus) {
  return fetch(`../data/bus-services/${bus}.json`).then((r) => r.json())
}

function serviceLines() {
  Object.keys(serviceType).forEach((k) => {
    routeLayers[k] = L.layerGroup().addTo(routeLayerGroup);
  });
  services.forEach((s) => getService(s.no).then((b) => {
    if ( !b[1].route ) return;
    let pts = b[1].route.map((p) => p.split(',').map(parseFloat));
    L.polyline(pts).addTo(routeLayers[s.type]);
  }));
}
