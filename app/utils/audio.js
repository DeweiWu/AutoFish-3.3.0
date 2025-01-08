const webAnalyser = require('web-audio-analyser');

let stream;
const getAudio = async (settings) => {
  if(settings.soundDetectionMode == `Desktop` || !settings.soundDetectionInputDevice) {
    let speaker = new MediaStream();
    stream = await navigator.mediaDevices.getUserMedia({
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
  } else {
    stream = await navigator.mediaDevices.getUserMedia({
        audio: {
            deviceId: settings.soundDetectionInputDevice,
            echoCancellation: false,
            noiseSuppression: false,
            autoGainControl: false
        }
    });
  }

  const analyser = webAnalyser(stream, {audible: false});
  return analyser;
};

module.exports = {
  startStream(settings) {
    return getAudio(settings);
  },
  stopStream() {
     stream.getTracks().forEach(track => track.stop());
  }
};
