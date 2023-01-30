const { ipcRenderer } = require("electron");

const Settings = require("./ui/settings.js");
const StartButton = require("./ui/startButton.js");
const AutoFish = require("./ui/autoFish.js");

const getAudio = async () => {
  let speaker = new MediaStream();
  let stream = await navigator.mediaDevices.getUserMedia({
    audio: {
      mandatory: {
        chromeMediaSource: 'desktop'
      }
    },
    video: {
      mandatory: {
        chromeMediaSource: 'desktop'
      }
    }
  });
  speaker.addTrack(stream.getAudioTracks()[0].clone());
  stream.getVideoTracks()[0].stop();
  stream.removeTrack(stream.getVideoTracks()[0]);

  const analyser = require('web-audio-analyser')(stream, {audible: false});
  ipcRenderer.on('get-audio', () => {
    ipcRenderer.send('get-waveform', analyser.waveform())
  });
};


const runApp = async () => {
  getAudio();
  const settings = await ipcRenderer.invoke("get-settings");
  const profiles = await ipcRenderer.invoke("get-profiles");
  let autoFish = new AutoFish(
    new Settings(settings),
    new StartButton(),
    profiles
  );
  document.body.append(autoFish.dom);
};

runApp();
