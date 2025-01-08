const audioAnalyser = require('./../../utils/audio.js');
const elt = require('./../../ui/utils/elt.js')
const { ipcRenderer } = require('electron');

const renderContainers = (amplitude, maxAmplitude) => {
  const amplitudeContainer = elt('p', null, `Amp: `, amplitude.toString());
  const maxAmplitudeContainer = elt('p', null, `Max: `, maxAmplitude.toString());

  return elt('div', null, amplitudeContainer, maxAmplitudeContainer)
}

ipcRenderer.on('settings-listen-win', async (event, settings) => {
  let analyser = await audioAnalyser.startStream(settings);
  let maxAmpSoFar = 0;
  let amplitudeSlow = [];

  setInterval(() => {
    document.body.innerHTML = ``;
    let waveform = analyser.waveform();
    let amplitude = waveform.reduce((a, b) => a > b ? a : b) - waveform.reduce((a, b) => a < b ? a : b);
    if(amplitude > maxAmpSoFar) {
      maxAmpSoFar = amplitude;
    }

    document.body.append(renderContainers(amplitude, maxAmpSoFar))
  }, 0);
})
