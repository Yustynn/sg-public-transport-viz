import json

from os import walk
from math import radians, cos, sin, asin, sqrt

DATA_FOLDER_PATH = '../raw'

stops = {}
services = {}
service_types = None

def h_dist(lat1, lon1, lat2, lon2):
    r = 6371  # Radius of earth in km
    lon1, lat1, lon2, lat2 = map(radians, [lon1, lat1, lon2, lat2])

    dlon = lon2 - lon1
    dlat = lat2 - lat1
    a = sin(dlat/2)**2 + cos(lat1) * cos(lat2) * sin(dlon/2)**2

    return 2 * asin(sqrt(a)) * r


def parse_coords(route):
    for coord in route:
        try:
            yield tuple(float(l) for l in coord.split(','))
        except ValueError:
            continue


def process_stops(data):
    for stop in data:
        stop_no = stop.pop('no')
        stop['latlng'] = tuple(float(stop.pop(k)) for k in ('lat', 'lng'))
        stop['side'] = int(stop_no[-1])
        stops[stop_no] = stop


def process_services(data):
    global service_types
    service_types = data['types']
    for service in data['services']:
        services[service['no']] = {
            'routes': [],
            'name': service['name'],
            'type': int(service['type']),
        }


def process_route(direction, details):
    r = details.get('route', [])
    if not r:
        return None

    r_stops = details['stops']

    polyline = tuple(parse_coords(r))
    num_pts = len(polyline)

    def dist(i):
        return h_dist(*polyline[i], *polyline[i + 1])

    def stop_dists(stop_no, last_idx):
        s = stops.get(stop_no)
        if not s:
            yield 999, -1, 0
            return

        s_coord = s['latlng']

        for i, coord in enumerate(polyline[1:]):
            if i <= last_idx:
                continue

            d = h_dist(*s_coord, *coord)
            if d > 2:
                continue

            yield d + (i - last_idx)/num_pts, i

        yield 999, -2, 0

    polyline_dists = tuple(dist(i) for i in range(num_pts - 1))
    r_len = sum(polyline_dists)
    prog = tuple(sum(polyline_dists[:i]) / r_len for i in range(len(polyline)))

    last_idx = 0
    stop_polyline = [0]

    for stop_no in r_stops[1:]:
        closest = min(stop_dists(stop_no, last_idx))
        stop_polyline.append(closest[1])

        if closest[1] > 0:
            last_idx = closest[1]

    latlons = (
        sorted(lat for lat, lon in polyline),
        sorted(lon for lat, lon in polyline)
    )
    bounds = ((latlons[0][0], latlons[1][0]), (latlons[0][-1], latlons[1][-1]))

    return {
        'bounds': bounds,
        'stops': r_stops,
        'progress': prog,
        'polyline': polyline,
        'route_length': r_len,
        'num_stops': len(r_stops),
        'direction': int(direction),
        'stop_polyline': tuple(stop_polyline),
        'loop': int(r_stops[0] == r_stops[-1]),
    }


def init_data():
    print('processing stops... ', end='')
    with open('{}/bus-stops.json'.format(DATA_FOLDER_PATH)) as f:
        process_stops(json.load(f))
    print('ok')

    print('processing buses... ', end='')
    with open('{}/bus-services.json'.format(DATA_FOLDER_PATH)) as f:
        process_services(json.load(f))

    for root, _, files in walk('{}/bus-services'.format(DATA_FOLDER_PATH)):
        for bus_service in files:
            bus_no = bus_service.split('.')[0]

            with open('%s/%s' % (root, bus_service)) as f:
                routes = []
                s = json.load(f)

                for d, r in s.items():
                    route = process_route(d, r)
                    if not route:
                        continue
                    routes.append(route)

                if routes:
                    routes = tuple(routes)
                    if bus_no in services:
                        services[bus_no]['routes'] = routes
                    else:
                        services[bus_no] = {'routes': routes}
                else:
                    services.pop(bus_no, None)
    print('ok')


def write_data():
    data = {
        'stops': stops,
        'services': services,
        'types': service_types,
    }

    print('writing to file... ', end='')
    with open('{}/processed.min.json'.format(DATA_FOLDER_PATH), 'w') as f:
        json.dump(data, f, separators=(',', ':'), sort_keys=True)
    print('ok')


def load_data():
    with open('processed.min.json'.format(DATA_FOLDER_PATH)) as f:
        return json.load(f)


init_data()
write_data()
# data = load_data()
