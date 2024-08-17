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
          ipcRenderer.send(reqCh, imageData.data.buffer);
        });
      });
      resolve();
    });
    ipcRenderer.once('stop-webcam-stream', () => {
      let tracks = stream.getTracks(); // Get all tracks (audio and video)
      tracks.forEach(track => track.stop()); // Stop each track
      ipcRenderer.removeAllListeners('request-frame');
    })
  });
};

const connectToStream = async (deviceId, screenSize) => {
  const stream = await navigator.mediaDevices.getUserMedia({
    video: {
      deviceId: { exact: deviceId },
      width: { ideal: screenSize.width },
      height: { ideal: screenSize.height },
      frameRate: { ideal: 60 },
    },
  });
  return await generateEventsFor(stream, screenSize);
};

module.exports = {
  connectToStream
};
