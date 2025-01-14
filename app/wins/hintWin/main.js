const { BrowserWindow, ipcMain } = require("electron");

const createHintWin = (data) => {
  let {pos, text} = data;

  let win = new BrowserWindow({
    x: pos.x + 25,
    y: pos.y,
    transparent: true,
    focusable: false,
    frame: false,
    show: true,
    width: 300,
    height: 500,
    resizable: false,
    webPreferences: {
      contextIsolation: false,
      nodeIntegration: true,
    },
  });

  win.loadFile("./app/wins/hintWin/index.html");

  win.once("ready-to-show", async () => {
    win.show();
    setTimeout(() => {
      if(win.isDestroyed()) return;
      win.webContents.send('show-hint', text);
    }, 150)

    //win.openDevTools({mode: `detach`})
  });

  return win;
}



module.exports = createHintWin;
