/**
 * SETUP 
 **/

const fetch = require('node-fetch');
const fs = require('fs');

const BusTracker = require('./BusTracker');
const { 
  logBlue,
  logGray,
  logGreen,
  logRed,
  logYellow,
  writeCSV
} = require('./helpers');

const BUS_SERVICES_DATA_DIR = './bus-services';
const HEADERS = {
  AccountKey: process.env.LTA_API_KEY,
  accept: 'application/json'
}

class LTAPoller {
  constructor(batchSize = 20, pollTimeout = 1000) {
    this.batchSize = batchSize;
    this.pollTimeout = pollTimeout;

    this.started = Date.now()
    this.trackers = this._makeTrackers();

    this.cycleCount = 0;
    this.currTrackerIdx = 0;
    this.runCount = 0;
  }

  async pollSingle(tracker, timestamp) {
    const url = this.makeUrl(tracker);

    try {
      const data = await fetch(url, { headers: HEADERS })
        .then( res => res.json() )

      tracker.track(data, timestamp);
    }
    catch (e) {
      logRed(`Failed to poll for Bus ${tracker.serviceNum} at stop ${tracker.currBusStop}`);
      logRed(e);
    }

  }

  getRemainingTrackers() {
    return this.trackers.filter( (t) => !t.isDone );
  }

  pollNextBatch() {
    const startIdx = this.currTrackerIdx;
    const endIdx = (startIdx + this.batchSize) % this.trackers.length;
    this.currTrackerIdx = endIdx;

   logGray (`Starting run ${this.runCount} of cycle ${this.cycleCount} at ${new Date().toLocaleTimeString()}, Batch Size: ${this.batchSize}`);

    if (endIdx < startIdx) {
      this.cycleCount++;
      this.runCount = 0;
      const remaining = this.getRemainingTrackers();
      logBlue(`${remaining.length} services still being tracked.`);
    }

    this.runCount++;

    const timestamp = new Date(Date.now()).toLocaleString();
    return Promise.all(
      this.trackers.slice(startIdx, endIdx).map((tracker) => {
        this.pollSingle(tracker, timestamp)
      })
    );
  }

  export(path='export.csv') {
    const data = [[
      'service_num',
      'stop_num',
      'est_arrival',
      'lat',
      'lng',
      'poll_timestamp'
    ]];

    for (const tracker of this.trackers) {
      for (const entry of tracker.tracked) {
        data.push([
          tracker.serviceNum,
          entry.busStop,
          entry.estArrival,
          entry.latitude,
          entry.longitude,
          entry.timestamp
        ])
      }
    }

    logGreen('\n\n\nCSV written!\n\n\n');

    return writeCSV(data, path);
  }

  async poll() {
    await this.pollNextBatch();

    const remaining = this.getRemainingTrackers();
    if (!remaining.length) {
      return logGreen('Done!');
    }

    setTimeout(this.poll.bind(this), this.pollTimeout);
  }


  _makeTrackers() {
    const trackers = [];

    const filenames = fs.readdirSync('bus-services')
      .filter((f) => f.includes('json'))

    for (const filename of filenames) {
      const serviceNum = filename.replace('.json', '');
      const data = require(`${BUS_SERVICES_DATA_DIR}/${filename}`);

      for (const direction of Object.keys(data)) {
        const route = data[direction].stops;
        if (!route.length) continue;

        trackers.push( new BusTracker(serviceNum, route, direction) );
      }
    }

    return trackers;
  }

  makeUrl(tracker) {
    const { serviceNum, currBusStop } = tracker;

    return `http://datamall2.mytransport.sg/ltaodataservice/BusArrivalv2?BusStopCode=${currBusStop}&ServiceNo=${serviceNum}`;
  }
}

poller = new LTAPoller()
poller.poll(25);

const MINS_MAX = 180;
const MINS_INTERVAL = 5;

for (let mins = MINS_INTERVAL; mins < MINS_MAX; mins += MINS_INTERVAL) {
  setTimeout(() => {
    poller.export(`exports/export_${mins}.csv`);
  }, mins*60*1000)
}

