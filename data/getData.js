const fetch = require('node-fetch');
const fs = require('fs');
const stringify = require('csv-stringify');

const HEADERS = {
  AccountKey: process.env.LTA_API_KEY,
  accept: 'application/json'
}

async function getBusStopData(stopNum) {
  const url = `http://datamall2.mytransport.sg/ltaodataservice/BusArrivalv2?BusStopCode=${stopNum}`

  return await fetch(
    url,
    { headers: HEADERS }
  ).then( res => res.json(), console.error )
}

function writeJSON(data, filepath='./output.json') {
  data = JSON.stringify(data);
  return promisifiedWriteFile(data);
}

function processData(data) {
  const cols = [
    'stop_num',
    'service_num',
    'est_arrival',
    'latitude',
    'longitude'
  ]
  const processed = [cols];

  for (const stop of data) {
    if (!stop.Services) continue;

    for (const bus of stop.Services) {
      for (const _entry of [bus.NextBus, bus.NextBus2]) {
        const entry = {
          stop_num: stop.BusStopCode,
          service_num: bus.ServiceNo,
          est_arrival: _entry.EstimatedArrival,
          latitude: _entry.Latitude,
          longitude: _entry.Longitude
        };

        processed.push( cols.map((col) => entry[col]) );
      }
    }
  }

  return processed;
}

function promisifiedStringify(data) {
  return new Promise((resolve, reject) => {
    stringify(data, (err, res) => {
      if (err) return reject(err);
      return resolve(res);
    })
  })
}

function promisifiedWriteFile(filepath, data) {
  return new Promise((resolve, reject) => {
    fs.writeFile(filepath, data, (err) => err ? reject(err): resolve(data))
  })
}

async function writeCSV(data, filepath='./output.csv') {
  data = await promisifiedStringify(data);
  return promisifiedWriteFile(filepath, data);
}


const stops = require('./bus-stops.json');
const stopNums = stops.map((s) => s.no);

const data = require('./output.json');
writeCSV(data);

const getTimestamp = () => new Date(Date.now()).toLocaleTimeString();

async function getData(timeout=0, numRuns=600, queriesPerRun=25, _runCount=0) {
  if (!fs.existsSync('output')){
      fs.mkdirSync('output');
  }

  const startIdx = queriesPerRun * _runCount % stopNums.length;
  const stopIdx = Math.min(startIdx + queriesPerRun, stopNums.length-1);
  Promise.all( stopNums.slice(startIdx, stopIdx).map(getBusStopData) )
    .then(processData)
    .then( (data) => writeCSV(data, `./output/output${_runCount}-${getTimestamp()}.csv`) )
    .then(() => {
      console.log(`written run ${_runCount} of ${numRuns} ${getTimestamp()}`);

      if (_runCount < numRuns) {
        setTimeout(
          () => {getData(timeout, numRuns, queriesPerRun, _runCount+1)}, 
          timeout
        );
      }
    })
    .catch((err) => {
      console.error(err);
      console.log(`Retrying ${_runCount}`);
      getData(timeout, numRuns, queriesPerRun, _runCount);
    })
}

getData()
