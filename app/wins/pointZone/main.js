const { BrowserWindow, ipcMain } = require("electron");
const nutJS = require("@nut-tree-fork/nut-js");
let winClosed = false;

const showColorPixel = async (scale) => {
  let pos = await nutJS.mouse.getPosition();
  let color = await(await nutJS.screen.grabRegion(new nutJS.Region(pos.x, pos.y, 1, 1))).toRGB();
  return {x: pos.x, y: pos.y, r: color.data[0], g: color.data[1], b: color.data[2], scale};
}

const createMouseCoordsEvent = (resolve, win, botWin, scaleFactor) => {
  ipcMain.on('mouse-coords', async (event, save) => {
      if(save) {
        let data = {x: 0, y: 0};
        let pos = await nutJS.mouse.getPosition();
        data.x = pos.x; // data.x * scaleFactor;
        data.y = pos.y; // data.y * scaleFactor;

      let color = await(await nutJS.screen.grabRegion(new nutJS.Region(data.x, data.y, 1, 1))).toRGB();
      data.color = {r: color.data[0], g: color.data[1], b: color.data[2]};

      resolve(data);
    } else {
      resolve();
    }

    botWin.focus();
    win.close();
    setTimeout(() => {
      ipcMain.removeAllListeners(`mouse-coords`);
      ipcMain.removeHandler(`get-pixel-color`);
    }, 250);
  })
}

const createPointZone = async (botWin, screenData, isStream) => {
  let scaleFactor = screenData.scaleFactor || 1;

  let win = new BrowserWindow({
    x: 0,
    y: 0,
    width: screenData.bounds.width - 1,
    height: screenData.bounds.height - 1,
    show: true,
    frame: false,
    alwaysOnTop: true,
    resizable: false,
    transparent: isStream ? false : true,
    /* transparent + fullscreen for normal */
    opacity: isStream ? 0.01 : 1,
    /* opacity: 0.01 for VM and -transparent */
    /* -fullscreen for streaming because of 2 windows*/
    webPreferences: {
      contextIsolation: false,
      nodeIntegration: true,
    },
  });

  win.loadFile("./app/wins/pointZone/index.html");

  win.once("ready-to-show", async () => {
    //win.openDevTools({mode: `detach`})

    const showInfoBox = async () => {
      if(win.isDestroyed()) {
        return;
      }
      let data = await showColorPixel(scaleFactor);
      win.webContents.send('show-info-box', data, screenData);
      setTimeout(showInfoBox);
    }
    
    showInfoBox();
  });


  return new Promise(function(resolve, reject) {
    createMouseCoordsEvent(resolve, win, botWin, scaleFactor);
  });
}



module.exports = createPointZone;
