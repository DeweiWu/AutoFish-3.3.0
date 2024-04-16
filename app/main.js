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
  crashReporter,
  screen
} = require("electron");
const path = require("path");

const { readFileSync, writeFileSync, writeFile, mkdir, rmdir, readdir } = require("fs");
const { unlink } = require("fs").promises;

const createAdvSettings = require(`./wins/advsettings/main.js`);
const createFishingZone = require(`./wins/fishingzone/main.js`);

const getJson = (jsonPath) => {
  return JSON.parse(readFileSync(path.join(__dirname, jsonPath), "utf8"));
};

const sleep = (time) => {
  return new Promise((resolve) => {
    setTimeout(resolve, time);
  });
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

app.setPath('sessionData', path.resolve(app.getAppPath(), `cache`)); // Set cache folder in the app folder

const showChoiceWarning = (win, warning, title, ...buttons) => {
  return result = dialog.showMessageBoxSync(win, {
    type: "warning",
    title: `${title}`,
    message: warning,
    buttons: buttons,
    defaultId: 0,
    cancelId: 1,
  });
};

const showWarning = (win, warning) => {
  return result = dialog.showMessageBoxSync(win, {
    type: "warning",
    title: `Warning`,
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

  const convertedResult = {
    x: (result.x * scale - screenSize.x) / screenSize.width,
    y: (result.y * scale - screenSize.y) / screenSize.height,
    width: (result.width * scale) / screenSize.width,
    height: (result.height * scale) / screenSize.height
  };

  return convertedResult
}

const random = (from, to) => {
  return from + Math.random() * (to - from);
};

let win;
const createWindow = async () => {
  win = new BrowserWindow({
    title: generateName(Math.floor(random(5, 15))),
    width: 341,
    height: 687,
    show: false,
    resizable: true,
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


const createArduinoDevice = require(`./game/arduino.js`);
let arduino = createArduinoDevice();

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
  const helpMessage = `
<b>🟢 Start</b> - Starts the bot.\n
<b>🔴 Stop</b> - Stops the bot.\n
<b>📢 Stats</b> - Returns stats.\n
<b>📷 Screenshot</b> - Makes a screenshot of every window of the game.\n
<b>⌨️ Press Enter</b> - Presses "Enter". Might help in case of manual reconnection.\n
<b>💼 Open Bags</b> - Opens/Closes Bags (by pressing shift + b).\n
<b>❌ Quit</b> - closes both the game and the bot.
---
You can also write in this chat directly to do:

<b>/r</b> (<i>win_num</i>) <i>text</i> - replies to the last whispered user. If you use Multiple Fishing Mode provide the number of the window instead of <i>win_num</i>. If not, omit it.\n
<b>/w</b> (<i>win_num</i>) <i>username</i> <i>text</i> - whispers to the <i>username</i>. If you use Multiple Fishing Mode, provide the number of the window instead of <i>win_num</i>. If not, omit it.\n
<b>/th</b> <i>value</i> - changes threshold value.\n
<b>/start</b> - starts the <i>telegram</i> bot.`;
  const welcomeMessage = `<b>AutoFish Premium</b> is connected successfully!\n${helpMessage}`;

  tmBot.bot.command("start", async (ctx) => {
    tmBot.ctx = ctx;
    await ctx.reply(`${welcomeMessage}`,  { parse_mode: "HTML" });
    return await ctx.reply(
      `Before using via telegram you should configure and test the bot on your local computer.`,
      Markup.keyboard([
        ["🟢 Start", "🔴 Stop"],
        ["📢 Stats", "📷 Screenshot"],
        ["⌨️ Press Enter", "💼 Open Bags"],
        ["💬 Help", "❌ Quit"]
      ]).resize(),
    );
  });

  tmBot.bot.command(`/th`, (ctx) => {
    const profile = getProfile().selected;
    if(!tmBot.ctx) tmBot.ctx = ctx;
    let text = ctx.update.message.text;
    let newThreshold = Number(text.slice((`/th`).length));

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

  ipcMain.on(`onload`, async () => {
    const profile = getProfile().selected;
    const config = getJson(`./config/${profile}/bot.json`);
    const settings = getJson(`./config/${profile}/settings.json`);

    if(config.patch[settings.game].startByFishingKey) {
      globalShortcut.register(settings.fishingKey, () => {
        win.webContents.send('start-by-fishing-key');
      });
    }

    if(settings.initial) {
      log.msg(`Thank you for your support!❤️`);
    }

    let tmKey = config.patch[settings.game].tmApiKey;

    if(config.patch[settings.game].arduino) {
      arduino.connectTo(config.patch[settings.game].arduinoPort, Number(config.patch[settings.game].arduinoRate))
      .then((msg) => log.ok(msg))
      .catch((err) => log.err(err))
    }

    if(tmKey) {
      connectToTelegram(tmKey)
      .then(() => log.ok(`Connected to Telegram!`))
      .catch(e => log.err(`Telegram error: ${e.message}`))
    } else {
      log.warn(`Provide a Telegram Token! (from BotFather)`);
    }

    let { version } = getJson('../package.json');
    win.webContents.send('set-version', version);

    await new Promise(function(resolve, reject) {
      setTimeout(resolve, 350);
    });

    if(settings.initial) {

      if(showChoiceWarning(win, `This project was developed for educational purposes, aiming to explore the feasibility of creating a functional gaming bot using web-development technologies only. The software provided should never be used with real-life applications, games and servers outside private "sandbox".

You assume full responsibility for any outcomes that may arise from using this software. It's essential to acknowledge that this software is not designed to be "undetectable" in any way, nor was it ever intended for such purposes as stated above. As a result, no guarantees or assurances can be made regarding the functionality or outcomes of the bot.

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

By pressing "Accept" you agree to everything stated above.`,
`MIT License | Copyright (c) 2023 jsbots`, `Accept`, `Decline`)) {
        app.quit();
      } else {
        settings.initial = false;
      }
      let games = [`Retail`, `LK Classic`, `Classic`, "Leg", "MoP", "Cata", "LK Private", "TBC", "Vanilla"];
      let initialGameChoice = showChoiceWarning(win, `The shortcut to AutoFish was created on you desktop!\n\nChoose your game:`, `Initial configuration`,
        ...games
      );
      win.webContents.send('set-game', games[initialGameChoice])
      settings.game = games[initialGameChoice];
    }

    writeFile(path.join(__dirname, `./config/${profile}/settings.json`), JSON.stringify(settings), () => {})

    if(screen.getAllDisplays().length > 1) {
      log.warn("The bot detected more than 1 display: use both the game and the bot on the primary one.")
    }
  });

  win.once("ready-to-show", () => {
    //win.openDevTools({mode: `detach`});
    win.show();
  });

  ipcMain.on("start-bot", async (event, type) => {
    const profile = getProfile().selected;
    const config = getJson(`./config/${profile}/bot.json`);
    const configDefault = getJson(`./config/${profile}/defaults.json`);
    const settings = getJson(`./config/${profile}/settings.json`);

    log.send(`Looking for the windows of the game...`);

    const useCustomWindow = config.patch[settings.game].useCustomWindow;
    if(useCustomWindow) {
      const customWindow = config.patch[settings.game].customWindow;
      const name = getAllWindows().find(({handle}) => handle == customWindow);
      if(!name) {
        log.err(`Can't access this window`);
        win.webContents.send("stop-bot");
        return;
      }
      const {title, className, handle} = name;

      config.game.names = [title];
      config.game.classNames = [className];
      config.game.handles = [handle];
    } else {
      config.game = configDefault.game;
    }

    let games = findGameWindows(config).map(game => ({game, settings, config}));

    if(!settings.multipleWindows) {
      games = [games[0]];
    }

    if (!games) {
      log.err(`Can't find any window of the game! Go to the Advanced Settings and choose the window of the game manually.`);
      win.webContents.send("stop-bot");
      return;
    } else {
      log.ok(`Found ${games.length} window${games.length > 1 ? `s` : ``} of the game!`);
    }

    if(type != `relZone` && type != `chatZone` && type != `detectZone` && settings.initialZone){
      await new Promise(function(resolve, reject) {
        setTimeout(resolve, 50);
      });
      if(!(showChoiceWarning(win, `This is your first launch. Do you want to set your Fishing Zone first? (recommended)`, `Fishing Zone`, `Yes`, `No`))) {
        type = `relZone`;
        win.webContents.send("stop-bot");
      }
    }

    if(settings.initialZone) {
      settings.initialZone = false;
      writeFileSync(path.join(__dirname, `./config/${profile}/settings.json`), JSON.stringify(settings));
    }

    if(type == `relZone` || type == `chatZone` || type == `detectZone`) {
      log.send(`Setting ${type == `relZone` ? `Fishing` : type == `chatZone` ? `Chat` : `Motion Detection`} Zone...`);
      let data = await setFishingZone(games[0].game, config.patch[settings.game][type], type, config.patch[settings.game], settings);
      if(data) {
        config.patch[settings.game][type] = data;
        writeFileSync(path.join(__dirname, `./config/${profile}/bot.json`), JSON.stringify(config));
        log.ok(`Set ${type == `relZone` ? `Fishing` : type == `chatZone` ? `Chat` : `Motion Detection`} Zone successfully!`);
      } else {
        log.send(`Canceled.`)
      }
      win.focus();
      return;
    }

    if(config.patch[settings.game].startByFishingKey) {
      globalShortcut.unregister(settings.fishingKey);
    }

    if(settings.multipleWindows) { // TEMP:
      games = [];
      for(let i = 1; i <= 10; i++) {
        const config = getJson(`./config/WIN${i}/bot.json`);
        const settings = getJson(`./config/WIN${i}/settings.json`);

        const useCustomWindow = config.patch[settings.game].useCustomWindow;
        if(useCustomWindow) {
          const customWindow = config.patch[settings.game].customWindow;
          const name = getAllWindows().find(({handle}) => handle == customWindow);
          if(!name) {
            log.err(`Can't access this window`);
            win.webContents.send("stop-bot");
            return;
          }
          const {title, className, handle} = name;

          config.game.names = [title];
          config.game.classNames = [className];
          config.game.handles = [handle];

          games.push({game: findGameWindows(config)[0], settings, config});
        }
      }
    }

    const {startBots, stopBots} = await createBots(games, log, tmBot, arduino);
    const stopAppAndBots = () => {

      if(config.patch[settings.game].startByFishingKey) {
        globalShortcut.register(settings.fishingKey, () => {
          win.webContents.send('start-by-fishing-key');
        });
      }

      games.forEach(async ({game}) => {
        const {mouse, keyboard, workwindow} = game;
        while(!workwindow.isForeground()) await sleep(100);
          mouse.humanMoveTo.cancelCurrent();
          keyboard.sendKeys.cancelCurrent();
          keyboard.printText.cancelCurrent();
      });

      if(config.patch[settings.game].hideWin) win.show();
      stopBots();
      shell.beep();
      if (!win.isFocused()) {
        win.flashFrame(true);
        win.once("focus", () => win.flashFrame(false));
      }
      globalShortcut.unregister(settings.stopKey);
      win.webContents.send("stop-bot");
      ipcMain.removeAllListeners("stop-bot");
    };

    ipcMain.on("stop-bot", stopAppAndBots);
    globalShortcut.register(settings.stopKey, stopAppAndBots);

    win.blur();
    if(config.patch[settings.game].hideWin) {
      setTimeout(() => {
        win.hide();
      }, 500 + Math.random() * 1500);
    }
    startBots(stopAppAndBots);
  });

  ipcMain.on('reg-start-by-fishing-key', () => {
    let profile = getProfile();
    let settings = getJson(`./config/${profile.selected}/settings.json`);
    let config = getJson(`./config/${profile.selected}/bot.json`);

    globalShortcut.register(settings.fishingKey, () => {
      win.webContents.send('start-by-fishing-key');
    });
  })

  ipcMain.on('unreg-start-by-fishing-key', () => {
    let profile = getProfile();
    let settings = getJson(`./config/${profile.selected}/settings.json`);
    let config = getJson(`./config/${profile.selected}/bot.json`);
    globalShortcut.unregister(settings.fishingKey);
  })

  ipcMain.on("open-link-youtube", () =>
    shell.openExternal("https://www.youtube.com/jsbots")
  );

  ipcMain.on("afk-fishing-warn", () => {
    showWarning(win, `Don't forget to switch to DirectX 11 in the game.\n\nTurn off Human-like Accuracy feature (Advanced Settings) and increase Mouse Random Speed to make it work better.\n\nDecreasing all sleeping and reaction values should also help.`);
  });

  ipcMain.on("multiple-fishing-warn", () => {
    showWarning(win, `In this mode the bot will use config from respective to the window profiles: WIN1, WIN2, WIN3 and so on.\n\nEvery "WIN" profile should have "Custom window" set (Advanced Settings -> Window). You can use "Focus" button to understand which window you chose exactly. The bot will ignore profiles for which you didn't set custom window.\n\nDon't forget to switch to DirectX 11 in the game.`);
  })

  ipcMain.on("splash-warn", () => {
    showWarning(win, `The bot will try to detect splash animation instead of the bobber animation. If possible, increase the visual quality of the water either by installing modded textures or in the settings of the game.\n\nIf the splash isn't detected, you can increase Sensitivity and Splash Color values (You can find the Splash Color value in the Advanced Settings).`);
  });

  ipcMain.on("open-link-donate", () =>
    shell.openExternal("https://www.buymeacoffee.com/jsbots/e/96734")
  );

  ipcMain.on("save-settings", (event, settings) =>
    writeFileSync(path.join(__dirname, `./config/${getProfile().selected}/settings.json`), JSON.stringify(settings))
  );

  ipcMain.on("unsupported-key", () => {
    showWarning(win, `The key you pressed is not supported by AutoFish.`);
  });

  ipcMain.on(`resize-win`, (event, size) => {
    win.setSize(size.width, size.height);
  });

  ipcMain.on("sound-warn", () => {
    return showWarning(win, `Turn off Music and Ambient Sounds in the game, leave only Sound Effects. Your volume should be normal. Try to find a place secluded from the sounds made by other players to avoid false detections.\n\nThe feature is experimental and might not work with some audio devices, in that case you need to switch to another device (e.g. you are using headphones and sound detection doesn't work, then plug in speakers and test again).\n\n Multiple Fishing Mode won't work with Sound Detection.`);
  });

  ipcMain.on("ascension-warn", () => {
    return showWarning(win, `If you play on some custom servers like Ascension, don't forget to run the bot as admin, otherwise it won't work.`);
  })

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
  });
  ipcMain.handle("connect-arduino", (event, {port, speed}) => {
   return arduino.connectTo(port, Number(speed))
   .then((response) => log.ok(response), (e) => {
     log.err(e)
     return Promise.reject(e);
   })
  })
  ipcMain.handle("get-bitmap", getBitmapAsync);
  ipcMain.handle("get-all-windows", getAllWindows);
  ipcMain.on('focus-win', (event, winHandle) => {
    const {handle, title, className} = getAllWindows().find(({handle}) => handle == winHandle);
    let game = findGameWindows({game: {handles: [handle], names: [title], classNames: [className]}});
    game[0].workwindow.setForeground();

  })
  ipcMain.handle("get-profiles", () => getProfile());
  ipcMain.handle("get-settings", () => getJson(`./config/${getProfile().selected}/settings.json`));

ipcMain.handle("delete-user", (event, user) => {
  if(showChoiceWarning(win, `Are you sure you want to delete this profile?`, `Warning`, `Yes`, `No`)) {
    return false;
  }

  if (user == `Default` ||
    user == `WIN1` ||
    user == `WIN2` ||
    user == `WIN3` ||
    user == `WIN4` ||
    user == `WIN5` ||
    user == `WIN6` ||
    user == `WIN7` ||
    user == `WIN8` ||
    user == `WIN9` ||
    user == `WIN10`
  ) {
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
const menu = Menu.buildFromTemplate([
  {
    label: `Help`,
    submenu: [
      { label: "AutoFish ver. 2.10.2 Premium" },
      { type: "separator" },
      {
        label: "📘 Read Me",
        click: () =>
          shell.openExternal(
            "https://github.com/jsbots/AutoFish#guide-blue_book"
          ),
      },
      {
        label: "Video",
        click: () => shell.openExternal("https://youtu.be/A3W8UuVIZTo"),
      },
      {
        label: "Report issue",
        click: () =>
          shell.openExternal("https://github.com/jsbots/AutoFish/issues"),
      },
      { type: "separator" },
      {
        label: "Discord Server",
        click: () => shell.openExternal("https://discord.gg/4sHFUtZ8tC"),
      },
      {
        label: "Donate",
        click: () => shell.openExternal("https://www.buymeacoffee.com/jsbots"),
      },
      { type: "separator" },
      { role: "quit" },
    ],
  },
    {
    label: `Cache`,
    submenu: [
      {
        label: "Open Cache",
        click: () => {
          shell.openExternal(win.webContents.session.storagePath);
        },
      },
      {
        label: "Clear Cache",
        click: () => {
          win.webContents.session.clearStorageData();
          showWarning(win, `Cache Cleared. Application Reload May Be Required`);
        },
      },
      { type: "separator" },
    ],
  },
  {
  label: `Debug`,
  submenu: [
    {
      label: "Debugging On",
      type: `checkbox`,
      checked: false,
      click: () => {
        if(process.env.NODE_ENV != `dev`) {
          process.env.NODE_ENV = `dev`
        } else {
          process.env.NODE_ENV = `prod`
        }
      },
    },
    {
      label: "Open Debugging Folder",
      click: () => {
        shell.openExternal(`${__dirname}/debug`);
      },
    },
    { role: 'toggleDevTools' },
    { type: "separator" },
  ],
},
]);

Menu.setApplicationMenu(menu);
  createWindow();
});

crashReporter.start({uploadToServer: false});
