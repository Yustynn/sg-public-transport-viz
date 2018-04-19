import json

from time import mktime
from datetime import datetime

buses = []
stops = None
services = None

with open('busserver/static/js/processed.min.json') as f:
    data = json.load(f)
    stops = data['stops']
    services = data['services']

for s_no, service in services.items():
    if service.get('type') == 2:
        continue

    busID = '%s:%d' % (s_no, 0)
    route = service['routes'][0]
    stop_no = route['stops'][0]
    lat, lng = 0, 0
    try:
        lat, lng = stops[stop_no]['latlng']
    except (KeyError, ValueError):
        pass

    buses.append({
        'busID': busID,
        'stop': stop_no,
        'service': s_no,
        'arrival': '',
        'lat': lat, 'lng': lng,
        'timestamp': '',
    })


def get_buses_fake(bounds):
    keys = ('busID', 'stop', 'service', 'arrival', 'lat', 'lng', 'timestamp')
    now = int(round(mktime(datetime.now().timetuple())))
    min_lng, min_lat, max_lng, max_lat = bounds

    timestep = now
    show_bus = []

    for bus in buses:
        polyline = services[bus['service']]['routes'][0]['polyline']
        bus['lat'], bus['lng'] = polyline[timestep % len(polyline)]

        if not (min_lat < bus['lat'] < max_lat):
            continue
        if not (min_lng < bus['lng'] < max_lng):
            continue

        show_bus.append(tuple(bus[k] for k in keys))

    return tuple(show_bus)
