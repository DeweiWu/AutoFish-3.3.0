const { ipcRenderer } = require('electron');

ipcRenderer.on('connect-to-stream', (event, deviceId, screenSize) => {
  console.log(screenSize);
  navigator.mediaDevices.getUserMedia({
    video: {
      deviceId: { exact: deviceId },
      width: { ideal: screenSize.width },
      height: { ideal: screenSize.height },
      frameRate: { ideal: 60 }
    }
  })
  .then(stream => {
    const video = document.createElement('video');
    video.srcObject = stream;
    video.videoWidth = `${screenSize.width}px`;
    video.videoHeight = `${screenSize.height}px`;
    video.addEventListener('loadeddata', () => {
      video.play();
      video.addEventListener('play', () => {
        document.body.append(video);
        ipcRenderer.send('stream-loaded');
      })
    })
  })
  .catch(err => {
    ipcRenderer.send('connect-to-stream-error', err);
  });
})
