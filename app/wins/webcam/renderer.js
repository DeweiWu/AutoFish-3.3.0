const { ipcRenderer } = require('electron');
let stream;

ipcRenderer.on('close-stream', () => {
  if(stream) {
    stream.getTracks().forEach(track => track.stop());
    stream = null;
  }
})



ipcRenderer.on('connect-to-stream', async (event, deviceId, screenSizeGame, screenSizePC, multipleWindowsId) => {
  const video = document.createElement('video');
  try {
    if(deviceId != 'Custom Server') {
      const devices = await navigator.mediaDevices.enumerateDevices();
      if(!devices.find((device) => device.deviceId == deviceId)) {
        throw new Error(`Can't find video capture device. Try to reassign.`)
      }
      stream = await navigator.mediaDevices.getUserMedia({
        video: {
          deviceId: { exact: deviceId },
          width: { ideal: screenSizeGame.width },
          height: { ideal: screenSizeGame.height },
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
      video.srcObject = stream;
    } else {
      //video.src = `http://localhost:8888/live/index.m3u8`;
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
            let streamAddress = multipleWindowsId ? `http://localhost:8889/live${multipleWindowsId}/whep` : `http://localhost:8889/live/whep`
            const response = await fetch(streamAddress, {
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
            ipcRenderer.send('connect-to-stream-error', `Server doesn't support this Video Encoder.`);
            return;
          }

      /*
      const hls = new Hls();
      hls.loadSource(`http://localhost:8888/live/index.m3u8`);
      hls.attachMedia(video);
      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        video.dispatchEvent(new Event('loadeddata'));
      });
      */
    }

    video.style.width = `${screenSizePC.width}px`;
    video.style.height = `${screenSizePC.height}px`;

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
