const { BrowserWindow, ipcMain, dialog } = require("electron");
const { readFileSync, writeFileSync } = require("fs");
const path = require("path");

const getJson = (path) => JSON.parse(readFileSync(path), "utf8");

const showWarning = (win, warning) => {
  return result = dialog.showMessageBoxSync(win, {
    type: "warning",
    title: `Disclaimer`,
    message: warning,
    buttons: [`Ok`]
  });
};

const createAdvSettings = (appPath) => {
  let win = new BrowserWindow({
    title: 'Advanced Settings',
    width: 455,
    height: 705,
    show: false,
    resizable: true,
    webPreferences: {
      contextIsolation: false,
      nodeIntegration: true,
    },
    icon: `./img/icon.png`
  });

  win.loadFile(path.join(__dirname, `index.html`));

  win.on("closed", () => {
    ipcMain.removeAllListeners(`advanced-click`);
    ipcMain.removeHandler(`advanced-defaults`);
    ipcMain.removeHandler(`get-game-config`);
  });

  win.once("ready-to-show", () => {
    win.show();
  });

  ipcMain.on("advanced-click", (event, newConfig) => {
    if(newConfig) {
      const settings = getJson(path.join(appPath, "./config/settings.json"));
      const config = getJson(path.join(appPath, "./config/bot.json"));
      config.patch[settings.game] = newConfig;
      writeFileSync(path.join(appPath, "./config/bot.json"), JSON.stringify(config));
    }
    win.close();
  });

  ipcMain.on("mammoth-warn", () => {
    showWarning(win, `Turn on interaction key in the game. You don't need to turn it on in the bot (Int.key section), but the bot will use the same key assigned there (even if disabled).`);
  })

  ipcMain.handle("advanced-defaults", () => {
    const settings = getJson(path.join(appPath, "./config/settings.json"));
    const defaults = getJson(path.join(appPath, "./config/defaults.json"));
    return defaults.patch[settings.game];
  })

  ipcMain.handle("get-game-config", () => {
    const settings = getJson(path.join(appPath, "./config/settings.json"));
    const config = getJson(path.join(appPath, "./config/bot.json"));
    return config.patch[settings.game];
  });

  return win;
};

module.exports = createAdvSettings;
