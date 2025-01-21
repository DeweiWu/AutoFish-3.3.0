const { ipcRenderer } = require("electron");

const sleep = (time) => {
  return new Promise((resolve) => {
    setTimeout(resolve, time);
  });
};

let stream;

const generateEventsFor = (video, screenSize, mWin) => {
  return new Promise(async (resolve, reject) => {
    let canplayError = true

    video.addEventListener("canplay", () => {
      canplayError = false;

      video.play();
      video.addEventListener("play", () => {

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
    });
    ipcRenderer.once('stop-webcam-stream', async () => {
      ipcRenderer.removeAllListeners(`request-frame-${mWin}`);
      if(stream) {
        stream.getTracks().forEach(track => track.stop());
        stream = null;
      }
      video.remove();
    })

    await sleep(15000);
    if(canplayError) {
      reject(`Error Stream: can't load the stream.`);
    }
  });
};

const connectToStream = async (deviceId, screenSize, mWin) => {
  const video = document.createElement("video");

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
        offerToReceiveAudio: false
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
  }

  return await generateEventsFor(video, screenSize, mWin);
};

module.exports = {
  connectToStream
};
