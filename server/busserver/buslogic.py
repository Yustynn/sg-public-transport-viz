import json

from time import mktime
from datetime import datetime

buses = []
stops = None
services = None
KEYS = ('busID', 'stop', 'service', 'arrival', 'lat', 'lng', 'timestamp')

with open('busserver/static/js/processed.min.json') as f:
    data = json.load(f)
    stops = data['stops']
    services = data['services']

j = 0
scraped_buses = []
processed_buses = {}
with open('scraped_buses.csv') as f:
    for line in f:
        s_no, stop_no, arr, lat, lng, ts = line.strip().split(',')

        try:
            lat, lng = float(lat), float(lng)
        except ValueError:
            continue

        svc = services.get(s_no)

        if svc is None:
            continue

        arr = int(arr)
        s_dir = -1
        stop_idx = -1

        for r, route in enumerate(svc['routes']):
            try:
                stop_idx = route['stops'].index(stop_no)
                s_dir = r
            except ValueError:
                continue

        busID = "%s:%d" % (s_no, s_dir)
        ts = tuple(int(i) for i in ts[1:-1].split(':'))

        if busID not in processed_buses:
            processed_buses[busID] = []

        scraped_buses.append({
            'stop': stop_no,
            'service': s_no,
            'arrival': arr,
            'lat': lat, 'lng': lng,
            'timestamp': ts,
        })

        processed_buses[busID].append((ts, stop_idx, j))
        j += 1

#scraped_buses.sort(key=lambda x: x['timestamp'])

del processed_buses['136:1']
del processed_buses['139:1']

for b_id in processed_buses:
    processed_buses[b_id].sort()
    b = processed_buses[b_id]
    dirty = None
    prev_id = b[0][1]
    for i in range(len(b) - 1):
        if prev_id > b[i + 1][1]:
            dirty = i
            break
        prev_id = b[i + 1][1]

    if dirty is not None:
        processed_buses[b_id] = b[:dirty]

for busID, b in processed_buses.items():
    buses.append({
        'busID': busID,
        **scraped_buses[b[0][2]],
    })




def get_buses_single(bounds):
    min_lng, min_lat, max_lng, max_lat = bounds

    tm = datetime.now().timetuple()
    mn = tm.tm_min

    show_bus = []

    for bus in buses:
        if not (min_lat < bus['lat'] < max_lat):
            continue
        if not (min_lng < bus['lng'] < max_lng):
            continue

        show_bus.append(tuple(bus[k] for k in KEYS))

    return tuple(show_bus)
