const { ipcRenderer } = require("electron");

const generateEventsFor = (stream, screenSize) => {
  return new Promise(function (resolve, reject) {
    const video = document.createElement("video");
    video.srcObject = stream;
    video.addEventListener("loadeddata", () => {
      video.play();
      video.addEventListener("play", () => {
        ipcRenderer.on("request-frame", (event, pos, reqCh) => {
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
      stream.getTracks().forEach(track => track.stop());
      stream = null;
      video.remove();
    })
  });
};

const connectToStream = async (deviceId, screenSize) => {
  let stream;
  try {
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

  } catch(err) {
    throw err
  }

  return await generateEventsFor(stream, screenSize);
};

module.exports = {
  connectToStream
};
