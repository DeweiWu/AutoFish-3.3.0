/* Electron modules*/
const {
  app,
  BrowserWindow,
  ipcMain,
  Menu,
  dialog,
  shell,
  powerSaveBlocker,
  globalShortcut,
  screen
} = require("electron");
const path = require("path");

const { readFileSync, writeFileSync, mkdir, rmdir, readdir } = require("fs");
const { unlink } = require("fs").promises;

const createAdvSettings = require(`./wins/advsettings/main.js`);
const createFishingZone = require(`./wins/fishingzone/main.js`);

const getJson = (jsonPath) => {
  return JSON.parse(readFileSync(path.join(__dirname, jsonPath), "utf8"));
};

const getProfile = () => {
  return getJson(`./config/config.json`);
};

/* Electron modules end */

/* Bot modules */
const generateName = require('./utils/generateName.js');
const { createLog } = require("./utils/logger.js");
const { findGameWindows, getAllWindows } = require("./game/createGame.js");
const createBots = require("./bot/createBots.js");
const getBitmapAsync = require("./utils/getBitmap.js");
const { Telegraf, Markup } = require('telegraf');
/* Bot modules end */

/* Squirrel */
const handleSquirrelEvent = require(`./utils/handleSquirrel.js`);
if (require("electron-squirrel-startup")) return app.quit();
if (handleSquirrelEvent(app)) {
  // squirrel event handled and app will exit in 1000ms, so don't do anything else
  return;
}
/* Squirrel end */


const showChoiceWarning = (win, warning) => {
  return result = dialog.showMessageBoxSync(win, {
    type: "warning",
    title: `Disclaimer`,
    message: warning,
    buttons: [`I agree`, `I don't agree`],
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

const setFishingZone = async ({workwindow}, relZone, type, config, settings) => {
  workwindow.setForeground();
  while(!workwindow.isForeground()) {
    workwindow.setForeground();
  }
  const screenSize = workwindow.getView();
  const scale = screen.getPrimaryDisplay().scaleFactor || 1;

  const pos = {
    x: (screenSize.x + relZone.x * screenSize.width) / scale,
    y: (screenSize.y + relZone.y * screenSize.height) / scale,
    width: (relZone.width * screenSize.width) / scale,
    height: (relZone.height * screenSize.height) / scale
  }

  const result = await createFishingZone({pos, screenSize, type, config, settings, scale});
  if(!result) return;
  return {
    x: (result.x - screenSize.x) * scale / screenSize.width,
    y: (result.y - screenSize.y) * scale / screenSize.height,
    width: result.width * scale / screenSize.width,
    height: result.height * scale / screenSize.height
  }
}

const random = (from, to) => {
  return from + Math.random() * (to - from);
};

const createWindow = async () => {
  let win = new BrowserWindow({
    title: generateName(Math.floor(random(5, 15))),
    width: 325,
    height: 785,
    show: false,
    resizable: false,
    webPreferences: {
      spellcheck: false,
      contextIsolation: false,
      nodeIntegration: true,
    },
    icon: "./app/img/icon.png",
  });

  win.loadFile("./app/index.html");

  win.on("closed", () => {
    if (process.platform === "darwin") {
      return false;
    }
    powerSaveBlocker.stop(powerBlocker);
    app.quit();
  });

  const log = createLog((data) => {
    win.webContents.send("log-data", data);
  });

let tmBot = {
  bot: null,
  ctx: null,
  stats: [],
  reconnects: [],
  ss: [],
  replies: []
};

const connectToTelegram = (key) => {
  tmBot.bot = new Telegraf(key);
  const helpMessage = `<b>Start</b> - starts the bot.\n<b>Stop</b> - stops the bot.\n<b>Stats</b> - returns stats.\n<b>Screenshot</b> - makes a screenshot of the game window.\n<b>Quit</b> - closes both the game and the bot.\n<b>/r</b> <i> text</i> - replies to user.<b>\n/w</b> <i>username text</i> - whispers to user.\n/start - starts telegram bot.`;
  const welcomeMessage = `<b>AutoFish Premium</b> is connected successfully!\n\n${helpMessage}`;

  tmBot.bot.command("start", async (ctx) => {
    tmBot.ctx = ctx;
    await ctx.reply(`${welcomeMessage}`,  { parse_mode: "HTML" });
    return await ctx.reply(
      `Before using via telegram you should configure and test the bot on your local computer.`,
      Markup.keyboard([
        ["🟢 Start", "🔴 Stop", "❌ Quit"],
        ["📢 Stats", "📷 Screenshot", "💬 Help"],
        ["⌨️ Press Enter"]
      ]).resize(),
    );
  });

  tmBot.bot.command(`/th`, (ctx) => {
    const profile = getProfile().selected;
    if(!tmBot.ctx) tmBot.ctx = ctx;
    let text = ctx.update.message.text;
    let newThreshold = Number(text.slice((`/th`).length));
    console.log(newThreshold);
    if(!isNaN(newThreshold) && newThreshold > 1 && newThreshold < 150) {
      let settings = getJson(`./config/${profile}/settings.json`);
      settings.threshold = newThreshold;
      writeFileSync(path.join(__dirname, `./config/${profile}/settings.json`), JSON.stringify(settings));
      ctx.reply(`Threshold is changed to ${newThreshold}`);
    } else {
      ctx.reply(`The value is incorrect. Provide a proper numeric value between 1 and 150.`);
    }
  });

  tmBot.bot.hears("🟢 Start", (ctx) => {
    if(!tmBot.ctx) tmBot.ctx = ctx;
    win.webContents.send(`start-tm`);
    ctx.reply(`Started the bot!`);
  });

  tmBot.bot.hears("🔴 Stop", (ctx) => {
    if(!tmBot.ctx) tmBot.ctx = ctx;
    win.webContents.send(`stop-tm`);
  });

  tmBot.bot.hears("💬 Help", (ctx) => {
    if(!tmBot.ctx) tmBot.ctx = ctx;
    ctx.reply(helpMessage, { parse_mode: "HTML" });
  });

  return tmBot.bot.launch();
};


  win.once("ready-to-show", () => {
    const profile = getProfile().selected;
    const config = getJson(`./config/${profile}/bot.json`);
    const settings = getJson(`./config/${profile}/settings.json`);

    if(settings.initial) {
      log.send(`Thank you for purchasing Premium!`);
    }

    let tmKey = config.patch[settings.game].tmApiKey;

    if(tmKey) {
      connectToTelegram(tmKey)
      .then(() => log.ok(`Connected to Telegram!`))
      .catch(e => log.err(`Telegram error: ${e.message}`))
    } else {
      log.warn(`Provide a Telegram token!`);
    }

    win.show();
    let { version } = getJson('../package.json');
    win.webContents.send('set-version', version);
  });

  ipcMain.on("start-bot", async (event, type) => {
    const profile = getProfile().selected;
    const config = getJson(`./config/${profile}/bot.json`);
    const settings = getJson(`./config/${profile}/settings.json`);

    log.send(`Looking for the windows...`);

    const useCustomWindow = config.patch[settings.game].useCustomWindow;
    if(useCustomWindow) {
      const customWindow = config.patch[settings.game].customWindow;
      const name = getAllWindows().find(({title}) => title == customWindow);
      if(!name) {
        log.err(`Can't access this window`);
        win.webContents.send("stop-bot");
        return;
      }
      const {title, className} = name;
      config.game.names.push(title);
      config.game.classNames.push(className);
    }

    const games = findGameWindows(config.game);
    if (!games) {
      log.err(`Can't find any window of the game!`);
      win.webContents.send("stop-bot");
      return;
    } else {
      log.ok(`Found ${games.length} window${games.length > 1 ? `s` : ``} of the game!`);
    }

    if(type == `relZone` || type == `chatZone`) {
      log.send(`Setting ${type == `relZone` ? `Fishing` : `Chat`} Zone...`);
      let data = await setFishingZone(games[0], config.patch[settings.game][type], type, config.patch[settings.game], settings);
      if(data) {
        config.patch[settings.game][type] = data;
        writeFileSync(path.join(__dirname, `./config/${profile}/bot.json`), JSON.stringify(config));
      }
      log.ok(`Set ${type == `relZone` ? `Fishing` : `Chat`} Zone successfully!`);
      win.focus();
      return;
    }

    if (settings.initial && (settings.game == "Dragonflight" || settings.game == "WotLK Classic" || settings.game == "Classic")) {
      if(showChoiceWarning(win, `The software is provided "as is" and the author disclaims all warranties
with regard to this software. In no event shall the author be liable for
any special, direct, indirect, or consequential damages or any damages
whatsoever resulting from loss of use or data, whether in an
action of contract, negligence or other tortious action, arising out of
or in connection with the use or performance of this software.`)) {
        win.webContents.send('stop-bot');
        return;
      } else {
        settings.initial = false;
        writeFileSync(path.join(__dirname, `./config/${profile}/settings.json`), JSON.stringify(settings));
      }
    }

    if(settings.fishingKey === `` || settings.luresKey === ``) {
      dialog.showErrorBox('', `Fishing and lures key values can't be empty`);
      win.webContents.send('stop-bot');
      return;
    }

    const {startBots, stopBots} = await createBots(games, settings, config, log, tmBot);

    const stopAppAndBots = () => {
      stopBots();
      shell.beep();
      if (!win.isFocused()) {
        win.flashFrame(true);
        win.once("focus", () => win.flashFrame(false));
      }
      globalShortcut.unregisterAll();
      win.webContents.send("stop-bot");
      ipcMain.removeAllListeners("stop-bot");
    };

    ipcMain.on("stop-bot", stopAppAndBots);
    globalShortcut.register(settings.stopKey, stopAppAndBots);

    win.blur();
    startBots(stopAppAndBots);
  });


  ipcMain.on("open-link-youtube", () =>
    shell.openExternal("https://www.youtube.com/jsbots")
  );

  ipcMain.on("dx11-warn", () => {
    showWarning(win, `If you play on official servers, don't forget to switch to DirectX 11 in the game.`);
  });

  ipcMain.on("whitelist-warn", () => {
    showWarning(win, `Turn off AutoLoot. The resolution in game should be 1366x768 or 1920x1080 or 3840x2160. UI addons and UI scale should be turned off. Turn on Open Loot Window at Mouse option (optional for Dragonflight and Vanilla).`);
  });

  ipcMain.on("open-link-donate", () =>
    shell.openExternal("https://www.buymeacoffee.com/jsbots/e/96734")
  );

  ipcMain.on("save-settings", (event, settings) =>
    writeFileSync(path.join(__dirname, `./config/${getProfile().selected}/settings.json`), JSON.stringify(settings))
  );

  let settWin;
  ipcMain.on("advanced-settings", () => {
    if(!settWin || settWin.isDestroyed()) {
      settWin = createAdvSettings(__dirname)
    } else {
      settWin.focus();
    }
  });

  ipcMain.handle("connect-telegram", (event, key) => {
    return connectToTelegram(key)
    .then(() => log.ok(`Connected to Telegram!`), (e) => {
      log.err(`Telegram error: ${e.message}`)
      return Promise.reject(e);
    })
  })
  ipcMain.handle("get-bitmap", getBitmapAsync);
  ipcMain.handle("get-all-windows", getAllWindows);
  ipcMain.handle("get-profiles", () => getProfile());
  ipcMain.handle("get-settings", () => getJson(`./config/${getProfile().selected}/settings.json`));

ipcMain.handle("delete-user", (event, user) => {
  if (user == `Default`) {
    log.err(`You can't delete Default profile.`);
    return;
  }
  return new Promise((resolve, reject) => {
  readdir(path.join(__dirname, `./config/`, user), async (error, files) => {
      if(error) reject(error);

      for(let file of files) {
        await unlink(path.join(__dirname, `./config/`, user, file));
      }

      rmdir(path.join(__dirname, `./config/`, user), (error) => {
        if (error) {
          reject(error);
        } else {
          let profile = getProfile();
          profile.selected = profile.users[profile.users.indexOf(user) - 1];
          profile.users = profile.users.filter((exstUser) => exstUser != user);
          writeFileSync(path.join(__dirname, `./config/`, `config.json`), JSON.stringify(profile));
          resolve(profile.selected);
        }
      });
  });
  });
});


  ipcMain.handle("create-user", (event, user) => {
    return new Promise((resolve, reject) => {
      mkdir(path.join(__dirname, `./config/`, user), (error) => {
        if(error) {
          if(error.code == `EEXIST`) {
            log.err(`The user already exist.`);
          }
          reject(error);
        } else {
          let profile = getProfile();
          let settings = getJson(`./config/${profile.selected}/settings.json`);
          let config = getJson(`./config/${profile.selected}/bot.json`);
          let defConfig = getJson(`./config/${profile.selected}/defaults.json`);
          writeFileSync(path.join(__dirname, `./config/`, user, `settings.json`), JSON.stringify(settings));
          writeFileSync(path.join(__dirname, `./config/`, user, `bot.json`), JSON.stringify(config));
          writeFileSync(path.join(__dirname, `./config/`, user, `defaults.json`), JSON.stringify(defConfig));
          profile.selected = user;
          profile.users.push(user);
          writeFileSync(path.join(__dirname, `./config/`, `config.json`), JSON.stringify(profile));
          resolve();
        }
      })
    });
  });
  ipcMain.handle("change-selected-profile", (event, profile) => {
    let profiles = getProfile();
    profiles.selected = profile;
    writeFileSync(path.join(__dirname, `./config/config.json`), JSON.stringify(profiles));
  });
}

let powerBlocker = powerSaveBlocker.start("prevent-display-sleep");
app.whenReady().then(() => {
  Menu.setApplicationMenu(null);
  createWindow();
});
