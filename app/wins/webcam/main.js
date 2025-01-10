const { app, BrowserWindow, ipcMain, Menu, screen } = require('electron');
const path = require('path');

const createWebCamWin = (deviceId, screenSizeGame) =>
  new Promise(function(resolve, reject) {

    let screenSizePC = screen.getPrimaryDisplay().bounds;

    let mainWindow = new BrowserWindow({
        x: 0,
        y: 0,
        width: screenSizePC.width, // screenSize.width, // 15 px offset
        height: screenSizePC.height, // screenSize.height, // 65 px offset
        show: false,
        frame: false,
        resizable: false,
        fullscreen: true,
        webPreferences: {
          contextIsolation: false,
          nodeIntegration: true,
        }
      });

    //mainWindow.openDevTools({mode: 'detach'})
    mainWindow.loadFile(path.join(__dirname, 'index.html'));

    mainWindow.on('close', () => {
      mainWindow.webContents.send('close-stream');
      ipcMain.removeAllListeners(`stream-loaded`);
      ipcMain.removeAllListeners(`connect-to-stream-error`);
    })

    mainWindow.on('ready-to-show', () => {
      mainWindow.webContents.send('connect-to-stream', deviceId, screenSizeGame, screenSizePC);
    })

    ipcMain.on('stream-loaded', () => {
      mainWindow.show();
    })

    mainWindow.on('show', () => {
      resolve(mainWindow);
    })

    ipcMain.on('connect-to-stream-error', (event, err) => {
      mainWindow.close();
      reject(err);
    })
});

module.exports = {
  createWebCamWin
}
