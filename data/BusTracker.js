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

    this.isDone = false;
    this.tracked = [];

    this.remainingRouteRev = route.slice().reverse();
    this.currBusStop = this.remainingRouteRev.pop();

    BusTracker._storeInstance(this);
  }

  _parseBusDataToEntry(busData, timestamp) {
    const nextBus = busData.NextBus;

    console.log(nextBus.EstimatedArrival);
    console.log(new Date(nextBus.EstimatedArrival));

    return { 
      busStop: this.currBusStop,
      estArrival: new Date(nextBus.EstimatedArrival),
      latitude: nextBus.Latitude,
      longitude: nextBus.Longitude,
      timestamp,
    };
  }

  track(busStop, timestamp) {
    console.log(busStop)

    // Ensure right bus stop passed in
    if (busStop.BusStopCode != this.currBusStop) {
      throw new Error(`Wrong Bus Stop for Bus ${this.serviceNum}! Expected ${this.currBusStop}, got ${busStop.BusStopCode}.`);
    }

    // Ensure bus not already fully tracked
    if (this.isDone) {
        return console.error(`Bus ${this.serviceNum} is already fully tracked.`);
    }

    // Verify API response integrity
    if (!busStop.Services) {
      return console.error(`While tracking Bus ${this.serviceNum}, no services found for bus stop ${this.currBusStop} in bus stop ${this.currBusStop}`);
    }

    const bus = busStop.Services.find( (bus) => bus.ServiceNo = this.serviceNum );

    if (!bus) {
      return console.error(`No bus ${this.serviceNum} found in ${this.currStop}`);
    }
    else {
      const entry = this._parseBusDataToEntry(bus, timestamp);
      this.tracked.push(entry);
    }

    this.updateBusTrackingState();
  }


  updateBusTrackingState() {
    if (!this.remainingRouteRev.length) {
      return console.error(`Bus ${this.serviceNum} already fully tracked`);
    }

    if (this.tracked.length) {
      const lastEntry = this.tracked[ this.tracked.length - 1 ];
      console.log(`delta: ${lastEntry.estArrival.getTime() - Date.now()} `);
      console.log(`last: ${lastEntry.estArrival.getTime()} `);
      console.log(`curr: ${Date.now()} `);
      if (lastEntry.estArrival.getTime() - Date.now() <= NEXT_STOP_TIME_DELTA) {
        this.currBusStop = this.remainingRouteRev.pop();
        if (!this.remainingRouteRev.length) {
          this.isDone = true;
          console.log(`Bus ${this.serviceNum} is fully tracked.`);
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

 //Quick tests
//const sampleBusStopData = require('./sampleBusStopData.json');
//const sampleRoute = require('./bus-services/15.json')[1].stops;

//const tracker1 = new BusTracker(15, sampleRoute);
//const tracker2 = new BusTracker(17, [1, 2]);
//const tracker3 = new BusTracker(18, [1, 2, 3]);

//const serviceData = sampleBusStopData.Services[0];
//serviceData.ServiceNo = 17;

//console.log(sampleBusStopData)
//tracker1.track(sampleBusStopData, Date.now())
//console.log(tracker1.tracked)

//tracker2.track(sampleBusStopData)
//tracker2.track(sampleBusStopData)
//tracker1.track(sampleBusStopData)

//// expect [15, 18]
//console.log(BusTracker.getInProgressTrackers().map(t => t.serviceNum))

//serviceData.serviceNo = 18;
//tracker3.track(sampleBusStopData, Date.now())

//// expect [15, 18]


