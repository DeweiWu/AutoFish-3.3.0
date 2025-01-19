const path = require('path');
const { app } = require('electron');
const { spawn } = require('child_process');
const fs = require('fs');

let wholeLog = ``;
let mediamtxProcess;

function extractIPAddress(logLine) {
    const regex = /(\d+\.\d+\.\d+\.\d+):\d+.*?is publishing to path 'live(\d*)'/;
    const match = logLine.match(regex);
    return match ? match : null;
}

module.exports = (log, mainPath) => {
  // Path to the MediaMTX binary
  if(mediamtxProcess) {
    return;
  }

  const mediamtxPath =  process.env.NODE_ENV == `dev` ? path.join(__dirname, "mediamtx") : path.join(mainPath, '../../app.asar.unpacked/app/utils/rtmp/mediamtx.exe');
  const extractedConfigPath =  process.env.NODE_ENV == `dev` ? path.join(__dirname, "mediamtx.yml") : path.join(mainPath, '../../app.asar.unpacked/app/utils/rtmp/mediamtx.yml');
  const extractedLogPath =  process.env.NODE_ENV == `dev` ? path.join(__dirname, "mediamtx.log") : path.join(mainPath, '../../app.asar.unpacked/app/utils/rtmp/mediamtx.log');

  // Start the MediaMTX server
  mediamtxProcess = spawn(mediamtxPath, [extractedConfigPath]);

  // Handle process output
  mediamtxProcess.stdout.on("data", (data) => {
    let remoteConnection = extractIPAddress(data.toString());
    if(remoteConnection) {
      if(remoteConnection[2]) {
        log.ok(`${remoteConnection[1]} is streaming to /live${remoteConnection[2]} (WIN${remoteConnection[2]})`);
      } else {
        log.ok(`${remoteConnection[1]} is streaming to /live`);
      }
    }
    wholeLog += data.toString();
  });

  mediamtxProcess.stderr.on("data", (data) => {
    wholeLog += data.toString();
  });

  // Handle process errors
  mediamtxProcess.on("error", (error) => {
    log.err(`RTMP Server Error: ${error.message.toString()}`);
    wholeLog += error.message.toString();
  });

  // Kill the process on app termination
  app.on("quit", () => {
    fs.writeFileSync(extractedLogPath, wholeLog);
    mediamtxProcess.kill();
  });
};
