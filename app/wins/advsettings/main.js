const { BrowserWindow, ipcMain, dialog, Menu } = require("electron");
const { readFileSync, writeFileSync } = require("fs");
const path = require("path");

let appPath;

const configPath = process.env.NODE_ENV == `dev` ? './config/' : '../../app.asar.unpacked/app/config/';

const getJson = (path) => JSON.parse(readFileSync(path), "utf8");

const getProfile = () => {
  return getJson(path.join(appPath, `${configPath}config.json`));
};

const showChoiceWarning = (win, warning, title, button1, button2) => {
  return result = dialog.showMessageBoxSync(win, {
    type: "warning",
    title: `${title}`,
    message: warning,
    buttons: [`${button1}`, `${button2}`],
    defaultId: 0,
    cancelId: 1,
  });
};


const showWarning = (win, warning) => {
  if(!getProfile().warningsOn) return;
  return result = dialog.showMessageBoxSync(win, {
    type: "warning",
    title: `Warning!`,
    message: warning,
    buttons: [`Ok`]
  });
};


const createAdvSettings = (mainAppPath, gameName, winZoomFactor) => {
  appPath = mainAppPath
  let mainWin = BrowserWindow.getAllWindows()[0];
  const [mainX, mainY] = mainWin.getPosition();
  let win = new BrowserWindow({
    x: mainX + 150,
    y: mainY,
    title: `Advanced Settings for ${gameName}`,
    width: Math.round(455 * (winZoomFactor != 1 ? (winZoomFactor + 0.0125) : 1)),
    height: Math.round(667 * (winZoomFactor != 1 ? (winZoomFactor + 0.0225) : 1)),
    show: false,
    resizable: false,
    webPreferences: {
      contextIsolation: false,
      nodeIntegration: true,
    },
    icon: `./app/img/icon.png`
  });

  win.loadFile(path.join(__dirname, `index.html`));
  // Define a global context menu
  const contextMenu = Menu.buildFromTemplate([
   { label: 'Cut', role: 'cut' },
   { label: 'Copy', role: 'copy' },
   { label: 'Paste', role: 'paste' }
  ]);


  win.webContents.on('context-menu', (event, params) => {
   contextMenu.popup({ window: win, x: params.x, y: params.y });
  });

  win.on("closed", () => {
    ipcMain.removeAllListeners(`advanced-click`);
    ipcMain.removeAllListeners(`mammoth-warn`);
    ipcMain.removeAllListeners(`unsupported-key-win`);
    ipcMain.removeAllListeners(`rngMove-warn`);
    ipcMain.removeAllListeners(`lures-warn`);
    ipcMain.removeAllListeners(`stream-warn`);
    ipcMain.removeAllListeners(`whitelist-warn`);
    ipcMain.removeAllListeners(`findPlayer-warn`);
    ipcMain.removeAllListeners(`start-by-fishing-key-warn`);
    ipcMain.removeAllListeners(`aggroCheck-warn`);
    ipcMain.removeHandler(`advanced-defaults`);
    ipcMain.removeHandler(`get-game-config`);
    ipcMain.removeHandler("remove-spare-confirm");
  });

  win.removeMenu();

  win.once("ready-to-show", () => {
    //win.openDevTools({mode: `detach`});
    win.show();
    win.webContents.setZoomFactor(winZoomFactor);
  });

  ipcMain.on("advanced-click", (event, newConfig) => {
    if(newConfig) {
      const profile = getProfile().selected;
      const settings = getJson(path.join(appPath, `${configPath}${profile}/settings.json`));
      const config = getJson(path.join(appPath, `${configPath}${profile}/bot.json`));
      config.patch[settings.game] = newConfig;
      writeFileSync(path.join(appPath, `${configPath}${profile}/bot.json`), JSON.stringify(config));
    }
    win.close();
  });

  ipcMain.on("mammoth-warn", () => {
    return showWarning(win, `Turn on interaction key in the game. You don't need to turn it on in the bot (Int.key section), but the bot will use the same key assigned there (even if disabled).`);
  });

  ipcMain.on("rngMove-warn", () => {
    return showWarning(win, `In game go to Options -> Controls -> Camera Following Style and change it to "Never adjust camera", otherwise the feature won't work properly.`);
  });

  ipcMain.on("lures-warn", () => {
    showWarning(win, `If you use "Key" type of lures application, don't forget to make a macro as described in the Guide and assign it to the same key you have assigned for Lures Key.`);
  });

  ipcMain.on("start-by-fishing-key-warn", () => {
    showWarning(win, `The key you assigned for Fishing Key will be blocked on your machine and if used will start the bot even if you are not in the game!\n\nTurn this feature on only after you have configured all the settings and turn it off before making any changes.`);
  })

  ipcMain.on("unsupported-key-win", () => {
    showWarning(win, `The key you pressed is not supported by AutoFish.`);
  });

  ipcMain.on("stream-warn", () => {
    showWarning(win, `- Alt-Tab Fishing doesn't work in Streaming Mode.\n- Doesn't support windowed mode (game).\n- Turn off enchance pointer precision in Mouse Properties (gaming PC).\n\nPress "Launch", save and open Advanced Settings again before configuring other settings.`);
  });

  ipcMain.on("aggroCheck-warn", () => {
    showWarning(win, `Attack mode is unstable yet, so either carefully test before using or choose "Run Away" for more stable results. As with "Find Player" feature such behaviour might be detectable on official servers. Use at your own risk.`);
  });

  ipcMain.on("findPlayer-warn", () => {
    showWarning(win, `The bot presses a key at random intervals to target other players but such behaviour might be detectable on official servers. Use at your own risk.`);
  })

  ipcMain.on("whitelist-warn", () => {
    showWarning(win, `Turn off AutoLoot option in the game.\n\nTurn on Open Loot Window at Mouse option in the game.`);
  });

  ipcMain.handle("advanced-defaults", () => {
    const profile = getProfile().selected;
    const settings = getJson(path.join(appPath, `${configPath}${profile}/settings.json`));
    const defaults = getJson(path.join(appPath, `${configPath}${profile}/defaults.json`));
    return defaults.patch[settings.game];
  })

  ipcMain.handle("remove-spare-confirm", () => {
    return !showChoiceWarning(win, `Are you sure you want to delete this?`, `Warning`, `Yes`, `No`);
  })

  ipcMain.handle("get-game-config", () => {
    const profile = getProfile().selected;
    const settings = getJson(path.join(appPath, `${configPath}${profile}/settings.json`));
    const config = getJson(path.join(appPath, `${configPath}${profile}/bot.json`));
    return config.patch[settings.game];
  });

  return win;
};

module.exports = createAdvSettings;
