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

// Milliseconds till bus arrival at stop A before polling stop B instead
const NEXT_STOP_TIME_DELTA = 2.5 * 60 * 1000

class BusTracker {
  constructor(serviceNum, route, direction=1) {
    this.direction = direction;
    this.serviceNum = serviceNum;
    this.route = route;

    this.tracked = [];
    this.nextTimingEstimate = null;

    this.remainingRouteRev = route.slice().reverse();
    this.currBusStop = this.remainingRouteRev.pop();

    BusTracker.trackInstance(this);
  }

  _parseBusDataToEntry(bus, timestamp) {
    return { 
      busStop: this.currBusStop,
      estArrival: new Date(bus.EstimatedArrival),
      latitude: bus.Latitude,
      longitude: bus.Longitude,
      timestamp,
    };
  }

  track(busStop, timestamp) {
    console.log(busStop)
    if (!this.remainingRouteRev.length) {
        return console.error(`Bus ${this.serviceNum} is already fully tracked.`);
    }

    if (!busStop.Services) {
      return console.error(`No services found for bus stop ${this.currBusStop} not found in ${busStop}`);
    }

    const bus = busStop.Services.find( (bus) => bus.ServiceNo = this.serviceNum );

    if (!bus) {
      return console.error(`No bus ${this.serviceNum} found in ${this.currStop}`);
    }
    else {
      const entry = this._parseBusDataToEntry(bus, timestamp);
      this.tracked.push(entry);
    }

    this.updateBusStopState();
  }


  updateBusStopState() {
    if (!this.remainingRouteRev.length) {
      return console.error(`Bus ${this.serviceNum} already fully tracked`);
    }

    if (this.tracked.length) {
      const lastEntry = this.tracked[ this.tracked.length - 1 ];

      if (lastEntry.estArrival.getMilliseconds() - Date.now() <= NEXT_STOP_TIME_DELTA) {
        this.currBusStop = this.remainingRouteRev.pop();
        if (!this.remainingRouteRev.length) {
          this.isDone = true;
          console.log(`Bus ${this.serviceNum} is fully tracked.`);
      }
    }
  }

  static trackInstance(instance) {
    if (!this.instances) this.instances = [];
    this.instances.push(instance);
  }

  static getBus(serviceNum, direction = 1) {
    this.instances.find( (bus) => {
      return (bus.serviceNum == serviceNum) & (bus.direction == direction);
    })
  }
}

const sampleBusStopData = require('./sampleBusStopData.json');
const sampleRoute = require('./bus-services/15.json')[1].stops;

const tracker1 = new BusTracker(15, sampleRoute);
tracker1.track(sampleBusStopData, Date.now())
tracker1.tracked

