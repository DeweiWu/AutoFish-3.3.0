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

process.env.NODE_ENV = `dev`;

const configPath = process.env.NODE_ENV == `dev` ? './config/' : '../../app.asar.unpacked/app/config/';
const trialPath = process.env.NODE_ENV == `dev` ? './app/badd7ae8f43' : '../../app.asar.unpacked/app/badd7ae8f43';
const trialIsOn = false;

const createAdvSettings = require(`./wins/advsettings/main.js`);
const createFishingZone = require(`./wins/fishingzone/main.js`);
const createPointZone = require(`./wins/pointZone/main.js`);
const createListenWin = require('./wins/listenWin/main.js');
const trialEncryption = require('./../enc.js')
const { saveArchive, loadArchive } = require('./utils/saveArchive.js');

const getJson = (jsonPath) => {
  return JSON.parse(readFileSync(path.join(__dirname, jsonPath), "utf8"));
};

const sleep = (time) => {
  return new Promise((resolve) => {
    setTimeout(resolve, time);
  });
};

const getProfile = () => {
  return getJson(`${configPath}config.json`);
};

const connectToMediaMtx = (log) => {
  try {
    require('./utils/rtmp/server.js')(log, __dirname);

    log.ok(`Launched MediaMTX server!`)

    const os = require('os');
    const networkInterfaces = os.networkInterfaces();
     const addresses = [];

     for (const iface of Object.values(networkInterfaces)) {
       for (const config of iface) {
         if (config.family === 'IPv4' && !config.internal) {
           addresses.push(config.address);
         }
       }
     }
    log.send(`Servers for OBS:`);
    addresses.forEach((address, i) => {
      log.ok(`rtmp://${address}:1935/live`)
    })
  } catch(e) {
    log.err(`Couldn't launch MediaMTX server!`)
    return Promise.reject(e);
  }
}

const createTrialTime = () => {
  const data = readFileSync(path.join(__dirname, trialPath), "utf8");
  const key = "26612137141ed19dcefd816de67f04e9593ac46461c8953d0a437b3762778644";
  const iv = "ef8945445e29a2cfe32bae03bd71477f"

  let trialTime = trialEncryption.decrypt(data, key, iv);
  let intervalId;

  return {
    start(doIfElapsed) {
      intervalId = setInterval(() => {
        trialTime.timeLeft = trialTime.timeLeft - 5000;
        if(trialTime.timeLeft < 0) {
          doIfElapsed();
        }

        let encData = trialEncryption.encrypt(trialTime, key, iv);
        writeFile(path.join(__dirname, trialPath), encData, (err, done) => {

        });
      }, 5000);
    },

    isElapsed() {
      return trialTime.timeLeft < 0;
    },

    timeLeft() {
      return trialTime.timeLeft;
    },

    stop() {
      clearInterval(intervalId);
    }
  }

}

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

  const scale = config.streamMode ? config.streamScreenSize.height / screen.getPrimaryDisplay().bounds.height : screen.getPrimaryDisplay().scaleFactor

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
let trial;
const createWindow = async () => {
  win = new BrowserWindow({
    title: "Settings",
    width: 341,
    height: 689,
    show: false,
    resizable: true,
    webPreferences: {
      spellcheck: false,
      contextIsolation: false,
      nodeIntegration: true,
      backgroundThrottling: false
    },
    icon: "./app/img/icon.png",
  });


  if(trialIsOn) {
    trial = createTrialTime();
  }

  win.loadFile("./app/index.html");
  //win.openDevTools({mode: 'detach'})
  win.on("closed", () => {
    if (process.platform === "darwin") {
      return false;
    }
    powerSaveBlocker.stop(powerBlocker);
    app.quit();
  });

  const log = createLog(
    (data) => {
      win.webContents.send("log-data", data);
    },
    (stats, time) => {
      win.webContents.send("log-data-stats", stats, time);
    }
  );

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
<b>🟢 Start</b> - Start the bot.\n
<b>🔴 Stop</b> - Stop the bot.\n
<b>📢 Stats</b> - Return stats.\n
<b>📷 Screenshot</b> - Make a screenshot (all wins).\n
<b>🏃 Use HS</b> - Use HS (all wins). The settings from Timer section will be used.\n
<b>💼 Check Bags</b> - Open-Screenshot-Close bags (all wins, using shift + b).\n
<b>❌ Quit</b> - Close both the game and the bot (all wins).
---
You can also write in this chat directly to do:

<b>/w</b> (<i>win_num</i>) <i>username</i> <i>text</i> - whispers to the <i>username</i>. If you use Multiple Fishing Mode, provide the number of the window instead of <i>win_num</i>. If not, omit it.\n
<b>/r</b> (<i>win_num</i>) <i>text</i> - replies to the last whispered user. If you use Multiple Fishing Mode provide the number of the window instead of <i>win_num</i>. If not, omit it.\n
<b>/say</b> (<i>win_num</i>) <i>text</i> - says in the general chat. If you use Multiple Fishing Mode, provide the number of the window instead of <i>win_num</i>. If not, omit it.\n

<b>/start</b> - starts the <i>telegram</i> bot.`;
  const welcomeMessage = `<b>AutoFish Premium</b> is connected successfully!\n${helpMessage}`;

  tmBot.bot.command("start", async (ctx) => {
    const profile = getProfile().selected;
    const config = getJson(`${configPath}${profile}/bot.json`);
    const settings = getJson(`${configPath}${profile}/settings.json`);
    let tmUseUsername = config.patch[settings.game].tmUseUsername;
    let tmUsername = config.patch[settings.game].tmUsername;

    if(tmUseUsername && tmUsername != ctx.from.username) {
      ctx.reply(`Forbidden.`);
      return;
    }

    tmBot.ctx = ctx;
    await ctx.reply(`${welcomeMessage}`,  { parse_mode: "HTML" });
    return await ctx.reply(
      `Before using via telegram you should configure and test the bot on your local computer.`,
      Markup.keyboard([
        ["🟢 Start", "🔴 Stop"],
        ["📢 Stats", "📷 Screenshot"],
        ["🏃 Use HS", "💼 Check Bags"],
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
      let settings = getJson(`${configPath}${profile}/settings.json`);
      settings.threshold = newThreshold;
      writeFileSync(path.join(__dirname, `${configPath}${profile}/settings.json`), JSON.stringify(settings));
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

  tmBot.bot.catch((err, ctx) => {
    console.log(err);
  })

  return new Promise(async (resolve, reject) => {
    try {
      await tmBot.bot.launch(() => {
        resolve();
      });
    } catch(e) {
      reject(e);
    }
  });
};
  ipcMain.on(`onload`, async () => {
    const profile = getProfile().selected;
    const config = getJson(`${configPath}${profile}/bot.json`);
    const settings = getJson(`${configPath}${profile}/settings.json`);

    if(config.patch[settings.game].startByFishingKey) {
      globalShortcut.register(settings.fishingKey, () => {
        win.webContents.send('start-by-fishing-key');
      });
    }

    if(settings.initial) {
      if(trialIsOn) {
        log.msg(`This is a trial version! ⌛`);
      } else {
        log.msg(`Thank you for your support!❤️`);
      }
    }

    let tmKey = config.patch[settings.game].tmApiKey;

    if(config.patch[settings.game].arduino) {
      if(config.patch[settings.game].arduinoType == 'arduino') {
        arduino.connectTo(config.patch[settings.game].arduinoPort, Number(config.patch[settings.game].arduinoRate))
        .then((msg) => log.ok(msg))
        .catch((err) => log.err(err))
      } else {
        const { pingDevice } = require('./game/pico.js');
        try {
          await pingDevice(config.patch[settings.game].arduinoPicoIp).then(() => {
            log.ok(`Connected to Pico!`)
          })
        } catch(e) {
          log.err(`No pico device under this IP!`)
        }
      }
    }

    if(config.patch[settings.game].streamDevice == 'Custom Server' && config.patch[settings.game].streamMode) {
      connectToMediaMtx(log);
    }

    if(tmKey) {
      connectToTelegram(tmKey)
      .then(() => log.ok(`Connected to Telegram!`))
      .catch(e => log.err(`Telegram error: ${e.message}`))
    } else {
      log.warn(`Telegram isn't connected.`);
    }

    let { version } = getJson('../package.json');

    if(trialIsOn) {
      let trialTimeLeft = Math.round((trial.timeLeft() / 1000 / 60) * 10) / 10;
      if(trialTimeLeft < 0) trialTimeLeft = 0;
      win.webContents.send('set-version', version, `(${trialTimeLeft} min)`);
    } else {
      win.webContents.send('set-version', version);
    }

    win.focus();

    await new Promise(function(resolve, reject) {
      setTimeout(resolve, 350);
    });

    if(settings.initial) {
      let games = [`Retail`, `Cata Classic`, `Classic`, "Leg", "MoP", "Cata", "LK Private", "TBC", "Vanilla"];
      let initialGameChoice = showChoiceWarning(win, `Choose your game:`, `Initial configuration`,
        ...games
      );

      win.webContents.send('set-game', games[initialGameChoice])
      settings.game = games[initialGameChoice];
      settings.initial = false;

      writeFileSync(path.join(__dirname, `${configPath}${profile}/settings.json`), JSON.stringify(settings), () => {});
    }

    if(screen.getAllDisplays().length > 1) {
      log.warn("The bot detected more than 1 display: use both the game and the bot on the primary one.")
    }
  });
  win.once("ready-to-show", () => {
    win.show();
  });

  ipcMain.handle("start-bot", async (event, type) => {
    const profile = getProfile().selected;
    const config = getJson(`${configPath}${profile}/bot.json`);
    const configDefault = getJson(`${configPath}${profile}/defaults.json`);
    const settings = getJson(`${configPath}${profile}/settings.json`);

    if(config.patch[settings.game].streamMode) {
      log.send(`Connecting to stream... Please wait.`);
    } else {
      log.send(`Looking for the windows of the game... Please wait.`);
    }

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

    let games
    try {
      games =  await findGameWindows(config, config.patch[settings.game], type);
    } catch(e) {
      log.err(e);
      win.webContents.send("stop-bot");
      shell.beep();
      return;
    }

    if (!games) {
      log.err(`Can't find any window of the game! Go to the Advanced Settings and choose the window of the game manually.`);
      win.webContents.send("stop-bot");
      shell.beep();
      return;
    } else {
      log.ok(`Found ${games.length} window${games.length > 1 ? `s` : ``} of the game!`);
    }

    if(!settings.multipleWindows) {
      games = [games[0]];
    }

    games = games.map(game => ({game, settings, config}));

    if(type == `pointZone`) {
      while(!games[0].game.workwindow.isForeground()) {
        games[0].game.workwindow.setForeground();
      }

      let screenData = screen.getPrimaryDisplay();
      let data = await createPointZone(BrowserWindow.getAllWindows()[0], screenData, config.patch[settings.game].streamMode);

      if(config.patch[settings.game].streamMode) {
        games[0].game.workwindow.close(); // closing webcam stream
      }

      if(data && config.patch[settings.game].streamMode) {
        showWarning(win, `Please wait a couple of seconds until the data is saved! (After you press "OK")`);
        log.send('Saving data... Please wait.');
        win.webContents.send('show-loading-cursor-start');

        let streamColor;
        const scale = config.patch[settings.game].streamScreenSize.height / (screen.getPrimaryDisplay().bounds.height * screen.getPrimaryDisplay().scaleFactor)

        data.x = Math.floor(data.x * scale);
        data.y = Math.floor(data.y * scale);
        try {
           streamColor = await (new Promise(function(resolve, reject) {
             win.webContents.send('connect-to-stream-main', {
               deviceId: config.patch[settings.game].streamDevice,
               screenSize: config.patch[settings.game].streamScreenSize
            });

            ipcMain.once('connect-to-stream-main-end', (event, e) => {
              if(e) {
                log.err(e);
                reject(e);
              }

             let reqCh = `channel-${Math.random()}`;
             win.webContents.send('request-frame', {x: data.x, y: data.y, width: 1, height: 1}, reqCh);
             ipcMain.once(reqCh, async (event, buffer) => {
               resolve({
                 width: 1,
                 height: 1,
                 data: Buffer.from(buffer)
               });
             })
            })
          }));
        } catch(e) {
          log.err(e);
          return;
        }
        win.webContents.send('stop-webcam-stream');
        let streamColorRGB = {r: Array.from(streamColor.data)[0], g: Array.from(streamColor.data)[1], b: Array.from(streamColor.data)[2]}
        data.color = streamColorRGB;
      }

      if(data) {
        log.ok(`Set point to [${data.x}, ${data.y}] successfully!`);
      } else {
        log.ok('Canceled.')
      }

      BrowserWindow.getAllWindows()[0].show();

      win.webContents.send('show-loading-cursor-end');
      return data;
    }

    /*
    if(type != `relZone` && type != `chatZone` && type != `detectZone` && type != `pointZone` && type != `combatZone` && settings.initialZone){
      await new Promise(function(resolve, reject) {
        setTimeout(resolve, 50);
      });
      if(!(showChoiceWarning(win, `This is your first launch. Do you want to set your Fishing Zone first? (recommended)`, `Fishing Zone`, `Yes`, `No`))) {
        type = `relZone`;
        win.webContents.send("stop-bot");
      }
    }
    */

    if(type == `relZone` || type == `chatZone` || type == `detectZone` || type == `combatZone`) {
      log.send(`Setting ${type == `relZone` ? `Fishing` : type == `chatZone` ? `Chat` : type == `combatZone` ? `Combat` : `Motion Detection`} Zone...`);

      let zoneData = config.patch[settings.game][type];
      if(Object.keys(zoneData).some((key) => zoneData[key] === null)) {
        zoneData = configDefault.patch[settings.game][type];
      }

      let data = await setFishingZone(games[0].game, zoneData, type, config.patch[settings.game], settings);
      if(data) {
        config.patch[settings.game][type] = data;
        writeFileSync(path.join(__dirname, `${configPath}${profile}/bot.json`), JSON.stringify(config));
        if(settings.initialZone) {
          settings.initialZone = false;
          writeFileSync(path.join(__dirname, `${configPath}${profile}/settings.json`), JSON.stringify(settings));
        }
        log.ok(`Set ${type == `relZone` ? `Fishing` : type == `chatZone` ? `Chat` : type == `combatZone` ? `Combat` : `Motion Detection`} Zone successfully!`);
      } else {
        log.send(`Canceled.`)
      }

      if(config.patch[settings.game].streamMode) {
          games[0].game.workwindow.close();
      }

      win.focus();
      return data;
    }

    if((settings.game == `Retail` || settings.game == `Classic` || settings.game == `Cata Classic`) && !config.patch[settings.game].streamMode) {
      await new Promise(function(resolve, reject) {
        setTimeout(resolve, 50);
      });
      if((showChoiceWarning(win, `You are about to start the bot in a default mode on official servers.\n\nIt's not just a disclaimer, your account WILL be banned sooner or later.\n\nYou can use Streaming Mode for a much safer approach.\n\nAre you sure you want to continue?`, `Warning`, `Yes `, `No (recommended)`))) {
        win.webContents.send("stop-bot");
        return;
      }
    }

    if(config.patch[settings.game].startByFishingKey) {
      globalShortcut.unregister(settings.fishingKey);
    }

    if(settings.multipleWindows) { // TEMP:
      games = [];
      for(let i = 1; i <= 10; i++) {
        const config = getJson(`${configPath}WIN${i}/bot.json`);
        const settings = getJson(`${configPath}WIN${i}/settings.json`);

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

          games.push({game: (await findGameWindows(config, {}))[0], settings, config});
        }
      }
    }

    if(config.patch[settings.game].streamMode && !config.patch[settings.game].picoip) {
      // TEMP: Check Pico Connection Logic
      log.err('Connect to your Pico W device, first.');
      win.webContents.send("stop-bot");
      return;
    }


    let sharedArray;
    if(config.patch[settings.game].streamMode) {
      log.send(`Connecting to capture device... Please wait.`);
      let secondValue = 5;
      setTimeout(function logSeconds() {
        log.send(`Start in ${secondValue--}...`);
        if(secondValue > 0) {
          setTimeout(logSeconds, 1000);
        }
      });

      try {
        sharedArray = await (new Promise(function(resolve, reject) {
          win.webContents.send('connect-to-stream-main', {
            deviceId: config.patch[settings.game].streamDevice,
            screenSize: config.patch[settings.game].streamScreenSize
         });
          ipcMain.once('connect-to-stream-main-end', (event, e, sharedArray) => {
            if(e) {
              log.err(e);
              reject(e);
            }

            resolve(sharedArray);
          })
          log.ok(`Connected successfully!`);
        }));
      } catch(e) {
        log.err(e.message);
        log.err(e.stack)
        return;
      }
    }

    if(settings.soundDetection) {
      win.webContents.send('start-audio', settings);
    }

    const {startBots, stopBots} = await createBots(games, log, tmBot, arduino, win, sharedArray);

    const stopAppAndBots = () => {
      if(trialIsOn) {
        trial.stop();
        let { version } = getJson('../package.json');
        let trialTimeLeft = Math.round((trial.timeLeft() / 1000 / 60) * 10) / 10;
        if(trialTimeLeft < 0) trialTimeLeft = 0;
        win.webContents.send('set-version', version, `(${trialTimeLeft} min)`);
      }

      if(config.patch[settings.game].startByFishingKey) {
        globalShortcut.register(settings.fishingKey, () => {
          win.webContents.send('start-by-fishing-key');
        });
      }

      if(settings.soundDetection) {
        win.webContents.send('stop-audio');
      }

      games.forEach(async ({game}) => {
        if(config.patch[settings.game].streamMode) {
          return;
        }

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


      if(config.patch[settings.game].streamMode) {
        setTimeout(() => {
          win.webContents.send('stop-webcam-stream');
        }, 500);
      }

      ipcMain.removeAllListeners("stop-bot");
    };

    ipcMain.on("stop-bot", stopAppAndBots);
    globalShortcut.register(settings.stopKey, stopAppAndBots);

    if(!config.patch[settings.game].streamMode) {
      win.blur();
    }

    if(config.patch[settings.game].hideWin) {
        win.hide();
    }

    if(trialIsOn) {
      if(trial.isElapsed()) {
        win.webContents.send("stop-bot");
        shell.beep();
        if(config.patch[settings.game].hideWin) {
          win.show();
        }
        win.focus();
        setTimeout(() => {
          log.setState(true);
          log.err('Your free trial has ended.');
          log.setState(false);
        }, 500);
        return;
      }

      trial.start(() => {
        setTimeout(() => {
          log.setState(true);
          log.err('Your free trial has ended.');
          log.setState(false);
        }, 500);
        stopAppAndBots();
      });
    }

    startBots(stopAppAndBots, type == 'skills-test');
  });

  ipcMain.on('reg-start-by-fishing-key', () => {
    let profile = getProfile();
    let settings = getJson(`${configPath}${profile.selected}/settings.json`);
    let config = getJson(`${configPath}${profile.selected}/bot.json`);

    globalShortcut.register(settings.fishingKey, () => {
      win.webContents.send('start-by-fishing-key');
    });
  });

  ipcMain.on('unreg-start-by-fishing-key', () => {
    let profile = getProfile();
    let settings = getJson(`${configPath}${profile.selected}/settings.json`);
    let config = getJson(`${configPath}${profile.selected}/bot.json`);
    globalShortcut.unregister(settings.fishingKey);
  })

  ipcMain.on('save-config', () => {
    saveArchive(log);
  });

  ipcMain.handle('load-config', async () => {
    return await loadArchive(log);
  })

  ipcMain.on("open-link-youtube", () =>
    shell.openExternal("https://www.youtube.com/jsbots")
  );

  ipcMain.on("afk-fishing-warn", () => {
    showWarning(win, `Don't forget to switch to DirectX 11 in the game.\n\nTurn off Human-like Accuracy feature (Advanced Settings) and increase Mouse Random Speed to make it work better.\n\nDecreasing all sleeping and reaction values should also help.\n\nWarning! This doesn't work in streaming mode!`);
  });

  ipcMain.on("multiple-fishing-warn", () => {
    showWarning(win, `In this mode the bot will use config from respective to the window profiles: WIN1, WIN2, WIN3 and so on.\n\nEvery "WIN" profile should have "Custom window" set (Advanced Settings -> Window). You can use "Focus" button to understand which window you chose exactly. The bot will ignore profiles for which you didn't set custom window.\n\nDon't forget to switch to DirectX 11 in the game.\n\nWarning! This doesn't work in streaming mode!`);
  })

  ipcMain.on("splash-warn", () => {
    showWarning(win, `The bot will try to detect splash animation instead of the bobber animation. If possible, increase the visual quality of the water either by installing modded textures or in the settings of the game.\n\nIf the splash isn't detected, you can increase Sensitivity and Splash Color values (You can find the Splash Color value in the Advanced Settings).`);
  });

  ipcMain.on("open-link-donate", () =>
    shell.openExternal("https://www.buymeacoffee.com/jsbots/e/96734")
  );

  ipcMain.on("save-settings", (event, settings) =>
    writeFileSync(path.join(__dirname, `${configPath}${getProfile().selected}/settings.json`), JSON.stringify(settings))
  );

  ipcMain.on("unsupported-key", () => {
    showWarning(win, `The key you pressed is not supported by AutoFish.`);
  });

  ipcMain.on(`resize-win`, (event, size) => {
    win.setSize(size.width, size.height);
  });

  ipcMain.on("sound-warn", () => {
    return showWarning(win, `Turn off Music and Ambient Sounds in the game, leave only Sound Effects. Try to find a place secluded from the sounds made by other players to avoid false detections.\n\nUse "Listen" button to determine your specific amplitude value.\n\n Multiple Fishing Mode won't work with Sound Detection.`);
  });

  ipcMain.on("ascension-warn", () => {
    return showWarning(win, `If you play on some custom servers like Ascension, don't forget to run the bot as admin, otherwise it won't work.`);
  })

  let settWin;
  ipcMain.handle("advanced-settings", async (event, settings) => {
    if(!settWin || settWin.isDestroyed()) {
      settWin = createAdvSettings(__dirname, settings.game)
    } else {
      settWin.focus();
    }
    await new Promise(function(resolve, reject) {
      settWin.on('show', () => {
        resolve();
      })
    });
  });

  let listenWin;
  ipcMain.on('create-listen-win', (event) => {
    let profile = getProfile();
    let settings = getJson(`${configPath}${profile.selected}/settings.json`);

    if(!listenWin || listenWin.isDestroyed()) {
      listenWin = createListenWin(settings);
    } else {
      listenWin.focus();
    }
  });

  ipcMain.on('destroy-listen-win', (event) => {
    listenWin.close();
  });

  ipcMain.handle("connect-telegram", (event, key) => {
    return connectToTelegram(key)
    .then(() => log.ok(`Connected to Telegram!`), (e) => {
      log.err(`Telegram error: ${e.message}`)
      return Promise.reject(e);
    })
  });

  ipcMain.handle('connect-pico', async (event, ip) => {
    const { pingDevice } = require('./game/pico.js');
    try {
      return await pingDevice(ip).then(() => {
        log.ok(`Connected to Pico!`)
      })
    } catch(e) {
      log.err(`No pico device under this IP!`)
      return Promise.reject(e);
    }
  })


  ipcMain.handle('connect-mediamtx', async (event) => {
    return connectToMediaMtx(log);
  })

  ipcMain.handle('get-profile-name', () => {
    return getProfile().selected;
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
  ipcMain.on('focus-win', async (event, winHandle) => {
    const {handle, title, className} = getAllWindows().find(({handle}) => handle == winHandle);
    let game = await findGameWindows({game: {handles: [handle], names: [title], classNames: [className]}}, {});
    game[0].workwindow.setForeground();
  })
  ipcMain.handle("get-profiles", () => getProfile());
  ipcMain.handle("get-settings", () => getJson(`${configPath}${getProfile().selected}/settings.json`));

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
  readdir(path.join(__dirname, `${configPath}`, user), async (error, files) => {
      if(error) reject(error);

      for(let file of files) {
        await unlink(path.join(__dirname, `${configPath}`, user, file));
      }

      rmdir(path.join(__dirname, `${configPath}`, user), (error) => {
        if (error) {
          reject(error);
        } else {
          let profile = getProfile();
          profile.selected = profile.users[profile.users.indexOf(user) - 1];
          profile.users = profile.users.filter((exstUser) => exstUser != user);
          writeFileSync(path.join(__dirname, `${configPath}`, `config.json`), JSON.stringify(profile));
          resolve(profile.selected);
        }
      });
  });
  });
});

  ipcMain.handle("create-user", (event, user) => {
    return new Promise((resolve, reject) => {
      mkdir(path.join(__dirname, `${configPath}`, user), (error) => {
        if(error) {
          if(error.code == `EEXIST`) {
            log.err(`The user already exist.`);
          }
          reject(error);
        } else {
          let profile = getProfile();
          let settings = getJson(`${configPath}${profile.selected}/settings.json`);
          let config = getJson(`${configPath}${profile.selected}/bot.json`);
          let defConfig = getJson(`${configPath}${profile.selected}/defaults.json`);
          writeFileSync(path.join(__dirname, `${configPath}`, user, `settings.json`), JSON.stringify(settings));
          writeFileSync(path.join(__dirname, `${configPath}`, user, `bot.json`), JSON.stringify(config));
          writeFileSync(path.join(__dirname, `${configPath}`, user, `defaults.json`), JSON.stringify(defConfig));
          profile.selected = user;
          profile.users.push(user);
          writeFileSync(path.join(__dirname, `${configPath}`, `config.json`), JSON.stringify(profile));
          resolve();
        }
      })
    });
  });
  ipcMain.handle("change-selected-profile", (event, profile) => {

    const config = getJson(`${configPath}${profile}/bot.json`);
    const settings = getJson(`${configPath}${profile}/settings.json`);
    const customWin = config.patch[settings.game].customWindow;

    if(!customWin && (profile == 'WIN1' || profile == 'WIN2' || profile == 'WIN3' || profile == 'WIN4' || profile == 'WIN5' || profile == 'WIN6' || profile == 'WIN7' || profile == 'WIN8' || profile == 'WIN9' || profile == 'WIN10')) {
      showWarning(win, 'Specify your window in Advanced Settings -> Custom Window, otherwise the bot will ignore this window.')
    }
    let profiles = getProfile();
    profiles.selected = profile;
    writeFileSync(path.join(__dirname, `${configPath}config.json`), JSON.stringify(profiles));
  });
}

let powerBlocker = powerSaveBlocker.start("prevent-display-sleep");
app.whenReady().then(() => {
const menu = Menu.buildFromTemplate([
  {
    label: `Help`,
    submenu: [
      { label: "AutoFish ver. 3.2.0 Premium" },
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
      { type: "separator" },
      {
        label: "Report issue",
        click: () =>
          shell.openExternal("https://discord.com/channels/1006827456931569735/1008328201031921694"),
      },
      {
        label: "Clear Cache",
        click: () => {
          win.webContents.session.clearStorageData();
          showWarning(win, `Cache Cleared. Application Reload May Be Required`);
        },
      },
      { type: "separator" },
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
  }
]);

Menu.setApplicationMenu(menu);
  createWindow();
});

app.commandLine.appendSwitch('enable-features','SharedArrayBuffer')

crashReporter.start({uploadToServer: false});
