const MAP_TILES = 'https://maps-{s}.onemap.sg/v3/Night/{z}/{x}/{y}.png';
const BOUNDS = [[1.56073, 104.11475], [1.16, 103.502]];

let center = L.bounds(...BOUNDS).getCenter();
let map = L.map('map').setView([center.x, center.y], 12).setMaxBounds(BOUNDS);

let basemap = L.tileLayer(MAP_TILES, {detectRetina: true, maxZoom: 18, minZoom: 12});
basemap.addTo(map);
