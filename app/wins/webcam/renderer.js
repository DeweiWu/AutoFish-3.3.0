const { ipcRenderer } = require('electron');
let stream;
ipcRenderer.on('close-stream', () => {
  stream.getTracks().forEach(track => track.stop());
  stream = null;
})

ipcRenderer.on('connect-to-stream', async (event, deviceId, screenSize) => {
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
    })

    const videoTrack = stream.getVideoTracks()[0];
    const capabilities = videoTrack.getCapabilities();

    videoTrack.applyConstraints({ advanced: [{
      brightness: 48,
      saturation: 43,
      contrast: 50,
      }]
    });

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
  } catch(e) {
      ipcRenderer.send('connect-to-stream-error', e.message);
  }
})
