import json

stops = None
services = None

with open('busserver/static/js/processed.min.json') as f:
    data = json.load(f)
    stops = data['stops']
    services = data['services']


def get_buses_fake(bounds):
    min_lng, min_lat, max_lng, max_lat = bounds

    return ()
