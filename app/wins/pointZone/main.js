const { BrowserWindow, ipcMain } = require("electron");

const nutJS = require("@nut-tree/nut-js");

const createMouseCoordsEvent = (resolve, win, botWin) => {
  ipcMain.on('mouse-coords', async (event, data) => {

    let color = await(await nutJS.screen.grabRegion(new nutJS.Region(data.x, data.y, 1, 1))).toRGB();
    data.color = {r: color.data[0], g: color.data[1], b: color.data[2]};

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
