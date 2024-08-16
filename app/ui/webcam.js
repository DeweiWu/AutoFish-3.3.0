const { ipcRenderer } = require('electron');
let connectedStream;

const generateEventsFor = (stream, screenSize) => {
  return new Promise(function(resolve, reject) {
    const video = document.createElement('video');
    video.srcObject = stream;
    video.addEventListener('loadeddata', () => {
      video.play();
      video.addEventListener('play', () => {
        ipcRenderer.on('request-frame', (event, pos) => {
          const offscreenCanvas = new OffscreenCanvas(pos.width, pos.height); // Set desired resolution
          const context = offscreenCanvas.getContext('2d');
          context.drawImage(video, pos.x, pos.y, pos.width, pos.height, 0, 0, pos.width, pos.height);
          const imageData = context.getImageData(0, 0, pos.width, pos.height);
          ipcRenderer.send('video-frame', imageData.data.buffer);
      })
    })
    resolve();
  });
})
};

const stopStream = () => {
  ipcRenderer.removeAllListeners('request-frame');
};

const connectToStream = async (deviceId, screenSize) => {
  if(connectedStream) {
    return await generateEventsFor(connectedStream, screenSize);
  } else {
    const stream = await navigator.mediaDevices.getUserMedia({
      video: {
        deviceId: { exact: deviceId },
        width: { ideal: screenSize.width},
        height: { ideal: screenSize.height},
        frameRate: { ideal: 60 }
      }
    })
    connectedStream = stream;
    return await generateEventsFor(connectedStream, screenSize);
  }
}

module.exports = {
  connectToStream,
  stopStream
}
