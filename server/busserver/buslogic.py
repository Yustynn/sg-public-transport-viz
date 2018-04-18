import pandas as pd

data = pd.read_csv('../data/compiled_output.csv')

def get_buses(bounds):
    min_lng, min_lat, max_lng, max_lat = bounds

    return data[
        (data.longitude >= min_lng) &
        (data.longitude <= max_lng) &
        (data.latitude >= min_lat) &
        (data.latitude <= max_lat)
    ].values.tolist()
