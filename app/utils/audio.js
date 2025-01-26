const webAnalyser = require('web-audio-analyser');
const { getAudioStreams } = require('./../ui/webcam.js');

let streams = [];
const getAudio = async (settings, streamMode, mWin) => {
  let stream = new MediaStream();
  if(streamMode) {
    stream = getAudioStreams()[mWin - 1];
    //stream.addTrack(getAudioStreams()[mWin - 1]);
  } else if (settings.soundDetectionMode == `Desktop` || !settings.soundDetectionInputDevice) {
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
    // speaker.addTrack(stream.getAudioTracks()[0].clone());
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

  streams.push(stream);
  const analyser = webAnalyser(stream, {audible: false, stereo: false});
  return analyser;
};

module.exports = {
  startStream(settings, streamMode, mWin) {
    return getAudio(settings, streamMode, mWin);
  },
  stopStream(mWin) {
     streams[mWin - 1].getTracks().forEach(track => track.stop());
  }
};
