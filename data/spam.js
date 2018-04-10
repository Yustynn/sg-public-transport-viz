const fetch = require('node-fetch');
const fs = require('fs');

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

async function writeJSON(data, filepath='./output.json') {
  data = JSON.stringify(data);

  return new Promise((resolve, reject) => {
    fs.writeFile(filepath, data, function(err) {
        if(err) {
          return reject(err);
        }

        resolve()
    });
  })
}

const stops = require('./bus-stops.json');
const stopNums = stops.map((s) => s.no)

Promise.all( stopNums.slice(0, 480).map(getBusStopData) )
  .then(writeJSON)
  .then(() => console.log('written!'))
