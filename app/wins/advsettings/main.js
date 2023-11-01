const { BrowserWindow, ipcMain, dialog } = require("electron");
const { readFileSync, writeFileSync } = require("fs");
const path = require("path");

const getJson = (path) => JSON.parse(readFileSync(path), "utf8");

const getProfile = (appPath) => {
  return getJson(path.join(appPath, `./config/config.json`)).selected;
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
    height: 627,
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
    ipcMain.removeAllListeners(`unsupported-key-win`);
    ipcMain.removeAllListeners(`rngMove-warn`);
    ipcMain.removeAllListeners(`lures-warn`);
    ipcMain.removeAllListeners(`whitelist-warn`);
    ipcMain.removeHandler(`advanced-defaults`);
    ipcMain.removeHandler(`get-game-config`);
    ipcMain.removeHandler("remove-spare-confirm");
  });

  win.removeMenu();

  win.once("ready-to-show", () => {
    //win.openDevTools({mode: `detach`});
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
    return showWarning(win, `In game go to Options -> Controls -> Camera Following Style and change it to "Never adjust camera", otherwise the feature won't work properly.\n\nThis feature might trigger a bug that changes your cursor type to "Move Cursor" (4-arrow cursor). It should disappear after relaunching the game.\n\nFind a fishing place where you character can move freely within a couple of yards.\n\n All the sensitivity settings should be set to default.`);
  });

  ipcMain.on("lures-warn", () => {
    showWarning(win, `Don't forget to make a macros as described in the Guide (Help -> Read Me) and assign it to the same key you have assigned for Lures Key.`);
  })

  ipcMain.on("unsupported-key-win", () => {
    showWarning(win, `The key you pressed is not supported by AutoFish.`);
  });

  ipcMain.on("whitelist-warn", () => {
    showWarning(win, `Turn off AutoLoot option in the game.\n\nTurn off UI addons and UI scaling in the game.\n\nTurn on Open Loot Window at Mouse option in the game. (optional for Retail, Vanilla, Vanilla(splash), but if you do then check respective option in this section).\n\nBest works with standard resolutions like: 1366x768, 1920x1080 and 3840x2160.`);
  });

  ipcMain.handle("advanced-defaults", () => {
    const profile = getProfile(appPath);
    const settings = getJson(path.join(appPath, `./config/${profile}/settings.json`));
    const defaults = getJson(path.join(appPath, `./config/${profile}/defaults.json`));
    return defaults.patch[settings.game];
  })

  ipcMain.handle("remove-spare-confirm", () => {
    return !showChoiceWarning(win, `Are you sure you want to delete this action?`, `Warning`, `Yes`, `No`);;
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
