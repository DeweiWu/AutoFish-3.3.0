const { BrowserWindow, ipcMain } = require("electron");

const createMouseCoordsEvent = (resolve, win, botWin) => {
  ipcMain.on('mouse-coords', (event, data) => {
    resolve(data);
    ipcMain.removeAllListeners(`mouse-coords`);
    win.close();
    botWin.focus(); 
  })
}

const createPointZone = async (botWin) => {
  let win = new BrowserWindow({
    fullscreen: true,
    frame: false,
    transparent: true,
    webPreferences: {
      contextIsolation: false,
      nodeIntegration: true,
    },
  });

  win.loadFile("./app/wins/pointZone/index.html");

  win.once("ready-to-show", () => {
    win.show();
  });

  return new Promise(function(resolve, reject) {
    createMouseCoordsEvent(resolve, win, botWin);
  });
}



module.exports = createPointZone;
