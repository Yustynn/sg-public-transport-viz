/**
 * FUNCTIONAL REQUIREMENTS
 * - Properties
 *    - isDone
 *    - currBusStop
 * - Store busstop data
 *    - Take in 
 * - Provide access to bus stop data
 *    - Query by Bus
 */

const { logRed, logGreen, logYellow } = require('./helpers');

// Milliseconds till bus arrival at stop A before polling stop B instead
const NEXT_STOP_TIME_DELTA = 2 * 60 * 1000

class BusTracker {
  constructor(serviceNum, route, direction=1) {
    this.direction = direction;
    this.serviceNum = serviceNum;
    this.route = route;

    this.isDone = false;
    this.tracked = [];

    this.remainingRouteRev = route.slice().reverse();
    this.currBusStop = this.remainingRouteRev.pop();

    BusTracker._storeInstance(this);
  }

  _parseBusDataToEntry(busData, timestamp) {
    const nextBus = busData.NextBus;

    return { 
      busStop: this.currBusStop,
      estArrival: new Date(nextBus.EstimatedArrival),
      latitude: nextBus.Latitude,
      longitude: nextBus.Longitude,
      timestamp,
    };
  }

  track(busStop, timestamp) {
    // Ensure right bus stop passed in
    if (busStop.BusStopCode != this.currBusStop) {
      throw new Error(`Wrong Bus Stop for Bus ${this.serviceNum}! Expected ${this.currBusStop}, got ${busStop.BusStopCode}.`);
    }

    // Ensure bus not already fully tracked
    if (this.isDone) {
        return logRed(`Bus ${this.serviceNum} is already fully tracked.`);
    }

    // Verify API response integrity
    if (!busStop.Services) {
      return logRed(`While tracking Bus ${this.serviceNum}, no services found for bus stop ${this.currBusStop} in bus stop ${this.currBusStop}`);
    }

    const bus = busStop.Services.find( (bus) => bus.ServiceNo = this.serviceNum );

    if (!bus) {
      return logRed(`No bus ${this.serviceNum} found in ${this.currBusStop}`);
    }
    else {
      const entry = this._parseBusDataToEntry(bus, timestamp);
      this.tracked.push(entry);
    }

    this.updateBusTrackingState();
  }


  updateBusTrackingState() {
    if (!this.remainingRouteRev.length) {
      return logRed(`Bus ${this.serviceNum} already fully tracked`);
    }

    if (this.tracked.length) {
      const lastEntry = this.tracked[ this.tracked.length - 1 ];

      if (lastEntry.estArrival.getTime() - Date.now() <= NEXT_STOP_TIME_DELTA) {
        const oldBusStop = this.currBusStop;
        this.currBusStop = this.remainingRouteRev.pop();
        logYellow(`Bus ${this.serviceNum} switching bus stops ${oldBusStop} -> ${this.currBusStop}`);

        if (!this.remainingRouteRev.length) {
          this.isDone = true;
          logGreen(`Bus ${this.serviceNum} is fully tracked.`);
        }
      }
    }
  }

  static _storeInstance(instance) {
    if (!this.instances) this.instances = [];
    this.instances.push(instance);
  }

  static getBus(serviceNum, direction = 1) {
    this.instances.find( (bus) => {
      return (bus.serviceNum == serviceNum) & (bus.direction == direction);
    })
  }

  static getInProgressTrackers() {
    return this.instances.filter((i) => !i.isDone);
  }
}

module.exports = BusTracker
