const { ipcRenderer } = require("electron");
const Hls = require('hls.js');

const audioStreams = [];

const sleep = (time) => {
  return new Promise((resolve) => {
    setTimeout(resolve, time);
  });
};

let stream;

const generateEventsFor = (video, screenSize, mWin, audioElement) => {
  return new Promise(async (resolve, reject) => {
    let canplayError = true

    //video.addEventListener("canplay", () => {
      video.play();
      video.addEventListener("play", () => {
        canplayError = false;
        ipcRenderer.on(`request-frame-${mWin}`, (event, pos, reqCh) => {
          const offscreenCanvas = new OffscreenCanvas(pos.width, pos.height); // Set desired resolution
          const context = offscreenCanvas.getContext("2d");
          context.drawImage(
            video,
            pos.x,
            pos.y,
            pos.width,
            pos.height,
            0,
            0,
            pos.width,
            pos.height
          );
          const imageData = context.getImageData(0, 0, pos.width, pos.height);

          setTimeout(() => {
            ipcRenderer.send(reqCh, imageData.data.buffer);
          }, 0);
        });
        resolve();
      });
    //});
    ipcRenderer.once('stop-webcam-stream', async () => {
      ipcRenderer.removeAllListeners(`request-frame-${mWin}`);
      if(stream) {
        stream.getTracks().forEach(track => track.stop());
        stream = null;
      }
      video.remove();
      if(audioElement) {
        audioElement.remove();
      }
    })

    await sleep(30000);
    if(canplayError) {
      reject(`Error Stream: can't load the stream.`);
    }
  });
};

const connectToStream = async (deviceId, screenSize, mWin, soundDetection) => {
  const video = document.createElement("video");
  let audioElement;

  if(deviceId != 'Custom Server') {
    const devices = await navigator.mediaDevices.enumerateDevices();

    if(!devices.find((device) => device.deviceId == deviceId)) {
      throw new Error(`Can't find the capture device.`)
    }

    stream = await navigator.mediaDevices.getUserMedia({
      video: {
        deviceId: { exact: deviceId },
        width: { ideal: screenSize.width },
        height: { ideal: screenSize.height },
        frameRate: { ideal: 60 }
      }
    });

    const videoTrack = stream.getVideoTracks()[0];
    const capabilities = videoTrack.getCapabilities();

    videoTrack.applyConstraints({ advanced: [{
      brightness: 48,
      saturation: 43,
      contrast: 50,
      }]
    });
    video.srcObject = stream;
  } else {
    const pc = new RTCPeerConnection({
        iceServers: []
    });

    pc.ontrack = (event) => {
        if (event.track.kind === 'video') {
          video.srcObject = event.streams[0];
        }
    };

    // Create empty offer to start the process
    const offer = await pc.createOffer({
        offerToReceiveVideo: true,
        offerToReceiveAudio: soundDetection ? true : false
    });
    await pc.setLocalDescription(offer);

    const response = await fetch(`http://localhost:8889/live${mWin}/whep`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/sdp'
        },
        body: offer.sdp
    });

    if(!response.ok) {
      throw new Error(`Stream Error: ${response.status} ${response.statusText}`);
    }

    const serverSdp = await response.text();
    await pc.setRemoteDescription(new RTCSessionDescription({
        type: 'answer',
        sdp: serverSdp
    }));

    const serverReportOk = await ipcRenderer.invoke('mediamtx-check-last-report');
    if(/doesn't support/.test(serverReportOk)) {
      throw new Error(`Server doesn't support this Video Encoder.`);
    }

    if(soundDetection) {
      const hls = new Hls();
      audioElement = document.createElement('audio');
      hls.loadSource(`http://localhost:8888/live${mWin}/index.m3u8`);
      hls.attachMedia(audioElement);

      audioElement.play();
      audioElement.muted = false;
      audioElement.volume = 1;

      await new Promise(function(resolve, reject) {
        hls.on(Hls.Events.MANIFEST_PARSED, () => {
          const audioContext = new AudioContext();
          const source = audioContext.createMediaElementSource(audioElement);
          const audioStream = audioContext.createMediaStreamDestination();
          source.connect(audioStream);
          audioStreams.push(audioStream.stream);
          resolve();
        })
      });
    }
  }

  return await generateEventsFor(video, screenSize, mWin, audioElement);
};

module.exports = {
  connectToStream,
  getAudioStreams() {
    return audioStreams;
  }
};
