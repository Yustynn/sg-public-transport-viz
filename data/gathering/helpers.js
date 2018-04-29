const chalk = require('chalk');
const fs = require('fs');
const stringifyOrig = require('csv-stringify');

function stringify(data) {
  return new Promise((resolve, reject) => {
    stringifyOrig(data, (err, res) => {
      if (err) return reject(err);
      return resolve(res);
    })
  })
}

function writeFile(filepath, data) {
  return new Promise((resolve, reject) => {
    fs.writeFile(filepath, data, (err) => err ? reject(err): resolve(data))
  })
}

async function writeCSV(data, filepath='./output.csv') {
  data = await stringify(data);
  return writeFile(filepath, data);
}

function writeJSON(data, filepath='./output.json') {
  data = JSON.stringify(data);
  return writeFile(data);
}

const makeTimestamp = () => new Date(Date.now()).toLocaleTimeString();

const loggerMaker = (color) => (str) => console.log( chalk[color](str) );

const [
  logBlue,
  logRed,
  logGreen,
  logYellow,
  logGray
] = ['blue', 'red', 'green', 'yellow', 'gray'].map(loggerMaker);

module.exports = {
  logBlue,
  logGray,
  logGreen,
  logRed,
  logYellow,
  stringify,
  writeCSV,
  writeFile,
  writeJSON,
}
