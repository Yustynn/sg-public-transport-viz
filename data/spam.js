const fetch = require('node-fetch');

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

const stops = require('./bus-stops.json');

const stopNums = stops.map((s) => s.no)

//Promise.all( stopNums.map(getBusStop) )

//getBusStopData('83139').then(console.log)

console.log(stopNums)
