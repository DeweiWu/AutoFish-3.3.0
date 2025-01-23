const { BrowserWindow, ipcMain } = require("electron");

const createListenWin = (settings, streamMode, multipleWindowsId) => {
  let win = new BrowserWindow({
    alwaysOnTop: true,
    frame: false,
    transparent: true,
    focusable: false,
    x: 0,
    y: 0,
    width: 200,
    height: 400,
    resizable: false,
    webPreferences: {
      contextIsolation: false,
      nodeIntegration: true,
    },
  });

  win.loadFile("./app/wins/listenWin/index.html");

  win.once("ready-to-show", async () => {
    win.setIgnoreMouseEvents(true);
    win.webContents.send('settings-listen-win', settings, streamMode, multipleWindowsId);
    //win.openDevTools({mode: `detach`})
  });

  return win;
}



module.exports = createListenWin;
