const LTAPoller = require('./LTAPoller');

// configure below to change frequency/duration of having the poll results written to CSV
const CSV_EXPORT_DIR = './exports';
const RECORD_MINS_MAX = 180;
const RECORD_MINS_INTERVAL = 0.05;

const poller = new LTAPoller()
poller.poll(25); // 25 requests per batch

for (let mins = RECORD_MINS_INTERVAL; mins <= RECORD_MINS_MAX; mins += RECORD_MINS_INTERVAL) {
  setTimeout(() => {
    poller.export(`${CSV_EXPORT_DIR}/export_${mins}.csv`);
  }, mins*60*1000)
}
