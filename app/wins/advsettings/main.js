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
    title: `Warning!`,
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
    icon: `./app/img/icon.png`
  });

  win.loadFile(path.join(__dirname, `index.html`));

  win.on("closed", () => {
    ipcMain.removeAllListeners(`advanced-click`);
    ipcMain.removeAllListeners(`mammoth-warn`);
    ipcMain.removeAllListeners(`unsupported-key-win`);
    ipcMain.removeAllListeners(`rngMove-warn`);
    ipcMain.removeAllListeners(`lures-warn`);
    ipcMain.removeAllListeners(`whitelist-warn`);
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

  ipcMain.on("aggroCheck-warn", () => {
    showWarning(win, `Attack mode is unstable yet, so either carefully test before using or choose "Run Away" for more stable results.`);
  });

  ipcMain.on("whitelist-warn", () => {
    showWarning(win, `Turn off AutoLoot option in the game.\n\nTurn off UI addons and UI scaling in the game.\n\nTurn on Open Loot Window at Mouse option in the game.\n\nFor filtering to work properly, your resolution (in game) and scaling (in Windows) should be one of these:\n- 1366x768 (100% scaling)\n- 1920x1080 (100% scaling)\n- 2560x1440 (125% scaling)\n- 3840x2160 (175% scaling)\n\nYou can change scaling in Windows in Settings -> Display.`);
  });

  ipcMain.handle("advanced-defaults", () => {
    const profile = getProfile(appPath);
    const settings = getJson(path.join(appPath, `./config/${profile}/settings.json`));
    const defaults = getJson(path.join(appPath, `./config/${profile}/defaults.json`));
    return defaults.patch[settings.game];
  })

  ipcMain.handle("remove-spare-confirm", () => {
    return !showChoiceWarning(win, `Are you sure you want to delete this action?`, `Warning`, `Yes`, `No`);
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
