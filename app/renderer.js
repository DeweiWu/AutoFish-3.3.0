const { ipcRenderer } = require("electron");

const Settings = require("./ui/settings.js");
const StartButton = require("./ui/startButton.js");
const AutoFish = require("./ui/autoFish.js");
const audioAnalyser = require('./utils/audio.js');
const { createTimer } = require("./utils/time.js");

const sleep = (time) => {
  return new Promise((resolve) => {
    setTimeout(resolve, time);
  });
};

const random = (from, to) => {
  return from + Math.random() * (to - from);
};


const runApp = async () => {
  const settings = await ipcRenderer.invoke("get-settings");

  ipcRenderer.on('start-audio', async (event, settings) => {
    let analyser = await audioAnalyser.startStream(settings);
    ipcRenderer.on('get-audio', async (event, threshold, checkBobberTime, missOnPurpose, missOnPurposeValues, pos) => { // miss on purpuse?

    const checkBobberTimer = createTimer(() => random(checkBobberTime.from * 1000, checkBobberTime.to * 1000));
    const missOnPurposeTimer = createTimer(() => random(missOnPurposeValues.from * 1000, missOnPurposeValues.to * 1000));

    checkBobberTimer.update();

    if(missOnPurpose) {
      missOnPurposeTimer.update();
    }

      for(;!checkBobberTimer.isElapsed();) {;
        let waveform = analyser.waveform();
        let result = waveform.reduce((a, b) => a > b ? a : b) - waveform.reduce((a, b) => a < b ? a : b) > threshold ? true : false;

        if(result) {
          ipcRenderer.send('get-audio-result', pos);
          return;
        }

        if(missOnPurpose && missOnPurposeTimer.isElapsed()) {
          pos.missedIntentionally = true;
          ipcRenderer.send('get-audio-result', pos);
          return;
        }

        await sleep(0);
      }

      ipcRenderer.send('get-audio-result', false);
    });

    ipcRenderer.on('stop-audio', () => {
      ipcRenderer.removeAllListeners('get-audio');
      ipcRenderer.removeAllListeners('stop-audio');
      audioAnalyser.stopStream();
    })

  })

  const profiles = await ipcRenderer.invoke("get-profiles");
  let autoFish = new AutoFish(
    new Settings(settings),
    new StartButton(),
    profiles
  );
  document.body.append(autoFish.dom);
  ipcRenderer.send(`onload`);
};

runApp();
