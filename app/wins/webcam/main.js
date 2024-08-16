const { app, BrowserWindow, ipcMain, Menu } = require('electron');
const path = require('path');

const once = (fn) => {
  let shown = false;
  if(!shown) {
    shown = true;
    return fn();
  }
}

const createWebCamWin = (deviceId, screenSize) =>
  new Promise(function(resolve, reject) {
    let mainWindow = new BrowserWindow({
        width: screenSize.width, // 15 px offset
        height: screenSize.height, // 65 px offset
        show: false,
        frame: false,
        webPreferences: {
          contextIsolation: false,
          nodeIntegration: true,
        }
      });

    //mainWindow.openDevTools({mode: 'detach'})
    mainWindow.loadFile(path.join(__dirname, 'index.html'));
    mainWindow.on('closed', () => {
      ipcMain.removeAllListeners(`stream-loaded`);
      ipcMain.removeAllListeners(`connect-to-stream-error`);
    })

    mainWindow.on('ready-to-show', () => {
      console.log(`im here ready to show lol`);
      mainWindow.webContents.send('connect-to-stream', deviceId, screenSize);
    })

    ipcMain.on('stream-loaded', () => {
      mainWindow.show();
    })

    mainWindow.on('show', () => {
      resolve(mainWindow);
    })

    ipcMain.on('connect-to-stream-error', (event, err) => { // TEMP:
      console.log(`Error connecting to stream`, err);
    })
});

module.exports = {
  createWebCamWin
}
