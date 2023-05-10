const { BrowserWindow, ipcMain, dialog } = require("electron");
const { readFileSync, writeFileSync } = require("fs");
const path = require("path");

const getJson = (path) => JSON.parse(readFileSync(path), "utf8");

const getProfile = (appPath) => {
  return getJson(path.join(appPath, `./config/config.json`)).selected;
};

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
    height: 715,
    show: false,
    resizable: false,
    webPreferences: {
      contextIsolation: false,
      nodeIntegration: true,
    },
    icon: `./img/icon.png`
  });

  win.loadFile(path.join(__dirname, `index.html`));

  win.on("closed", () => {
    ipcMain.removeAllListeners(`advanced-click`);
    ipcMain.removeAllListeners(`mammoth-warn`);
    ipcMain.removeAllListeners(`sound-warn`);
    ipcMain.removeAllListeners(`rngMove-warn`);
    ipcMain.removeHandler(`advanced-defaults`);
    ipcMain.removeHandler(`get-game-config`);
  });

  win.once("ready-to-show", () => {
    win.show();
  });

  ipcMain.on("advanced-click", (event, newConfig) => {
    if(newConfig) {
      const profile = getProfile(appPath);
      const settings = getJson(path.join(appPath, `./config/${profile}/settings.json`));
      const config = getJson(path.join(appPath, `./config/${profile}/bot.json`));
      config.patch[settings.game] = newConfig;
      writeFileSync(path.join(appPath, `./config/${profile}/bot.json`), JSON.stringify(config));
    }
    win.close();
  });

  ipcMain.on("mammoth-warn", () => {
    return showWarning(win, `Turn on interaction key in the game. You don't need to turn it on in the bot (Int.key section), but the bot will use the same key assigned there (even if disabled).`);
  });

  ipcMain.on("rngMove-warn", () => {
    return showWarning(win, `In game go to Options -> Controls -> Camera Following Style and change it to "Never adjust camera", otherwise the feature won't work properly.\n\nThis feature might trigger a bug that changes your cursor type to "Move Cursor" (4-arrow cursor). It should disappear after relaunching the game.\n\nFind a fishing place where you character can move freely within a couple of yards.`);
  })

  ipcMain.on("sound-warn", () => {
    return showWarning(win, `Turn off Music and Ambient Sounds in the game, leave only Sound Effects. Your volume should be normal. Try to find a place secluded from the sounds made by other players to avoid false detections.`);
  });

  ipcMain.handle("advanced-defaults", () => {
    const profile = getProfile(appPath);
    const settings = getJson(path.join(appPath, `./config/${profile}/settings.json`));
    const defaults = getJson(path.join(appPath, `./config/${profile}/defaults.json`));
    return defaults.patch[settings.game];
  })

  ipcMain.handle("get-game-config", () => {
    const profile = getProfile(appPath);
    const settings = getJson(path.join(appPath, `./config/${profile}/settings.json`));
    const config = getJson(path.join(appPath, `./config/${profile}/bot.json`));
    return config.patch[settings.game];
  });

  return win;
};

module.exports = createAdvSettings;
