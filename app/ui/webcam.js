const { ipcRenderer } = require("electron");

let stream;

const generateEventsFor = (video, screenSize, mWin) => {

  return new Promise(function (resolve, reject) {
    video.addEventListener("loadeddata", () => {
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
      });

      setTimeout(() => { // give some time to start
          resolve();
      }, 3000);

    });
    ipcRenderer.once('stop-webcam-stream', async () => {
      ipcRenderer.removeAllListeners('request-frame');
      if(stream) {
        stream.getTracks().forEach(track => track.stop());
        stream = null;
      }
      video.remove();
    })
  });
};

const connectToStream = async (deviceId, screenSize, mWin) => {
  const video = document.createElement("video");
  try {
    if(deviceId != 'Custom Server') {
      const devices = await navigator.mediaDevices.enumerateDevices();
      if(!devices.find((device) => device.deviceId == deviceId)) {
        throw new Error(`Can't find video capture device. Try to reassign.`)
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

      const serverSdp = await response.text();
      await pc.setRemoteDescription(new RTCSessionDescription({
          type: 'answer',
          sdp: serverSdp
      }));
    }
  } catch(err) {
    throw err
  }

  return await generateEventsFor(video, screenSize, mWin);
};

module.exports = {
  connectToStream
};
