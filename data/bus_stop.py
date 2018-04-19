#!/usr/local/bin/python3
#Author: Martin Tan

import json
import os

class Bus_Stop(object):
    def __init__(self):
        self.stopIDs = self.read_jsons()

    def read_jsons(self): #read all the files in the bus-services dir
        stopIDs = {}
        for root, dirs, files in os.walk("./bus-services", topdown = False):
            for service_num, extension in self._get_extension(files):
                if extension == ".json":
                    # print(os.path.join(root, filename + extension))
                    with open(os.path.join(root, service_num + extension), 'r') as json_file:
                        json_file = json.load(json_file) #convert file object into python dict
                        stopIDs[service_num] = {direction:data['stops'] for (direction, data) in json_file.items()}

                        #some buses have empty lists for direction 2 e.g. bus 24
                        if not stopIDs[service_num]['2']: #i.e. if stopIDs[service_num]['2'] is an empty list
                            stopIDs[service_num]['2'] = stopIDs[service_num]['1'][::-1] #assume direction 2 is the reverse of the direction 1

        return stopIDs

    def getStopIDs(self, service_num, direction=1):
        service_num = str(service_num)
        direction = str(direction)
        if direction not in ('1', '2'):
            raise Exception('Invalid direction.')
        try:
            return self.stopIDs[service_num][direction]
        except KeyError:
            raise Exception('Service number does not exist.')

    def _get_extension(self, files):
        for file in files:
            yield os.path.splitext(file)

#Example usage:
if __name__ == "__main__":
    stops = Bus_Stop()
    print(stops.getStopIDs(service_num=12, direction=1))
