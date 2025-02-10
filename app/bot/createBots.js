const runBot = require("./runBot.js");
const createBot = require("./createBot.js");

const { ipcMain, screen, BrowserWindow } = require("electron");

const { convertMs } = require('../utils/time.js');
const Stats = require('./stats.js');

const Jimp = require('jimp');
const { createPicoInterface } = require('../game/pico.js');

const { createIdLog } = require("../utils/logger.js");
const EventLine = require("../utils/eventLine.js");
const { setWorker } = require("../utils/textReader.js");

const createWinSwitch = require("../game/winSwitch.js");
const { app } = require("electron");

let properLanguages = {eng: `English`, spa: "Spanish", spa_old: "Spanish Old", deu: "Deutsch", por: "Português", fra: "Français", ita: "Italiano", chi_sim: "Simplified Chinese", chi_tra: "Traditional Chinese", kor: "Korean", rus: "Russian"};

const getPercent = (value, total) => {
  return Math.ceil((value / (total || 1)) * 100 * 100) / 100;
};

const random = (from, to) => {
  return from + Math.random() * (to - from);
};

function cropImage({ data, width, height }, crop) {
    const croppedData = new Uint8Array(crop.width * crop.height * 4); // 4 bytes per pixel (RGBA)

    for (let row = 0; row < crop.height; row++) {
        for (let col = 0; col < crop.width; col++) {
            const sourceIndex = ((crop.y + row) * width + (crop.x + col)) * 4;
            const destIndex = (row * crop.width + col) * 4;

            croppedData[destIndex] = data[sourceIndex];       // R
            croppedData[destIndex + 1] = data[sourceIndex + 1]; // G
            croppedData[destIndex + 2] = data[sourceIndex + 2]; // B
            croppedData[destIndex + 3] = data[sourceIndex + 3]; // A
        }
    }

    return {
        data: Buffer.from(croppedData),
        width: crop.width,
        height: crop.height
    };
}


const sleep = (time) => {
  return new Promise((resolve) => {
    setTimeout(resolve, time);
  });
};


const createBots = async (games, log, tmBot, arduino, win, registerSession, onError) => {
  const winSwitch = createWinSwitch(new EventLine(), games.length);

  let chosenConfig = games[0].config.patch[games[0].settings.game];
  let chosenSettings = games[0].settings;

  if(chosenConfig.whitelist) { // check language only by main win (???)
    log.send(`Downloading data for ${properLanguages[games[0].config.patch[games[0].settings.game].whitelistLanguage]} language, it might take a while...`);
    await setWorker(games[0].config.patch[games[0].settings.game].whitelistLanguage);
  }

  if (tmBot.bot) {
  tmBot.ss = [];
  tmBot.replies = [];
  tmBot.reconnects = [];
  tmBot.openBags = [];

  tmBot.bot.hears(`📷 Screenshot`, (ctx) => {
    if (!tmBot.ctx) tmBot.ctx = ctx;
    ctx.sendChatAction(`upload_photo`);
    tmBot.ss.reduce((a, screenshot) => a.then(() => screenshot(ctx)), Promise.resolve())
  });

  tmBot.bot.hears(`🏃 Use HS`, (ctx) => {
    tmBot.reconnects.forEach(reconnect => reconnect(ctx));
    ctx.reply(`Using HS!`);
  });


  tmBot.bot.hears(`💼 Check Bags`, (ctx) => {
    tmBot.openBags.forEach(bag => bag(ctx));
  });

  }

  let picoInterface;
  const bots = games.map(({game, config, settings}, i) => {
    if(config.patch[settings.game].streamMode) {
      let gameConfig = config.patch[settings.game];
      if(!picoInterface) {
        picoInterface = createPicoInterface(gameConfig.picoip, gameConfig.streamScreenSize, gameConfig.delay, gameConfig.streamScale, log);
      }

      let streamWindow = settings.multipleWindows ? i + 1 : ``;
      game.workwindow.capture = (zone) => {
        return new Promise(function(resolve, reject) {
          let reqCh = `channel-${Math.random()}`;
          ipcMain.once(reqCh, (event, buffer) => {
            resolve({
              width: zone.width,
              height: zone.height,
              data: Buffer.from(buffer)
            });
          })

          setTimeout(() => {
            //console.log(`channel requested`, `request-frame-${i}`);
            win.webContents.send(`request-frame-${streamWindow}`, zone, reqCh);
          }, 0)
      });
      }

      game = {mouse: picoInterface.mouse, workwindow: game.workwindow, keyboard: picoInterface.keyboard}
    }

    if(config.patch[settings.game].arduino) {

      if(config.patch[settings.game].arduinoType == 'arduino') {
        if(i == 0 && (settings.multipleWindows || settings.afkmode)) {
          game.keyboard.sendKey('backspace', [100, 400]);
        }

        arduino.mouse.getPos = game.mouse.getPos;
        game = {mouse: arduino.mouse, workwindow: game.workwindow, keyboard: arduino.keyboard}
      }

      if(config.patch[settings.game].arduinoType == 'pico') {
        let gameConfig = config.patch[settings.game];
        if(!picoInterface) {
          picoInterface = createPicoInterface(gameConfig.arduinoPicoIp, game.workwindow.getView(), gameConfig.delay, screen.getPrimaryDisplay().scaleFactor * 100, log);
        }

        game = {mouse: picoInterface.mouse, workwindow: game.workwindow, keyboard: picoInterface.keyboard}
      }
    }

    let state = { status: "initial", startTime: Date.now() };

    return {
      bot: createBot(game, {config: config.patch[settings.game], settings}, winSwitch, tmBot, i + 1, state, onError),
      log: createIdLog(log, ++i, settings.multipleWindows),
      state,
      stats: new Stats(i)
  }
  });

  if(chosenConfig.streamMode || (chosenConfig.arduino && chosenConfig.arduinoType == `pico`)) {
    let screenSize = chosenConfig.streamMode ? chosenConfig.streamScreenSize : games[0].game.workwindow.getView();
    let speed = random(chosenConfig.mouseMoveSpeed - chosenConfig.mouseMoveSpeed * 0.1, chosenConfig.mouseMoveSpeed + chosenConfig.mouseMoveSpeed * 0.1) / 100;
    let curvature = random(chosenConfig.mouseCurvatureStrength - chosenConfig.mouseCurvatureStrength * 0.1, chosenConfig.mouseCurvatureStrength + chosenConfig.mouseCurvatureStrength * 0.1)

    if(!chosenConfig.streamManualCursor) {
      let xMovement = Math.floor(screenSize.width / 5);
      let yMovement = Math.floor(screenSize.height / 5);
      for (var i = 0; i < 5; i++) {
        await picoInterface.mouse.humanMoveTo(-xMovement, -yMovement, speed, curvature, true);
        await sleep(random(50, 350));
      }
    }

    await sleep(random(250, 1000));

    if(!chosenSettings.useInt) {
      await picoInterface.mouse.humanMoveTo(Math.floor(25 * (screenSize.height / 1080)), Math.floor(25 * (screenSize.height / 1080)), speed, 0);
    }

    await sleep(random(250, 1000));
  }

if (tmBot.bot) {

  tmBot.stats = bots.map(({ stats, state }) => ({stats, state}));

  tmBot.bot.hears("📢 Stats", (ctx) => {
    if(!tmBot.ctx) tmBot.ctx = ctx;
    tmBot.stats.forEach(({stats, state}, i) => ctx.reply(`State: <b>${state.status.toUpperCase()}</b>\nTime passed: <b> ${convertMs(Date.now() - state.startTime)}</b>\nWindow: <b>${i + 1}</b>\n---\nCaught: <b>${stats.caught} (${getPercent(stats.caught, stats.total)}%)</b>\nMissed: <b>${stats.miss + stats.confused} (${getPercent(stats.miss + stats.confused, stats.total)}%)</b>\n---\nTotal: <b>${stats.total}</b>`, { parse_mode: "HTML" }));
  });

  tmBot.bot.hears("❌ Quit", (ctx) => {
    games.forEach(({ game }) => game.workwindow.close());
    log.send("Stopped.");
    log.setState(false);
    bots.forEach(({ state }) => (state.status = "stop"));
    ctx.reply(`Closed every window of the game and the bot.`);
    app.quit();
  });

  tmBot.bot.on((tmBot.message('text')), async (ctx) => {

    if(/^\/say/.test(ctx.message.text)) {
      sayReply(ctx.message.text);
    }

    if(/^\/w/.test(ctx.message.text)) {
      whisperReply(ctx.message.text);
    }

    if(/^\/r/.test(ctx.message.text)) {
      replyReply(ctx.message.text);
    }

  }) // should be after all 'hears' listeners otherwise it removes them (???)

  const whisperReply = (message) => {
    if(tmBot.replies.length > 1) {
      let winNum = message.slice(3, 5).match(/\d+/)[0];
      if(!(/\d+/.test(winNum))) {
        ctx.reply(`Please ensure proper formatting: Use '/w win_number username message' `);
        return;
      }

      let reply = tmBot.replies.find((bot) => bot.win == winNum);

      if(!reply) {
        ctx.reply(`Can't find Window: ${winNum}`);
        return;
      }

      reply.fn(message.slice(0, 3) + message.slice(5));
    } else {
      tmBot.replies[0].fn(message);
    }
  }

  const sayReply = (message) => {
      if (tmBot.replies.length > 1) {
        let winNum = message.slice(5, 7).match(/\d+/)[0];
        if (!/\d+/.test(winNum)) {
          ctx.reply(
            `Please ensure proper formatting: Use '/say win_number username message' `
          );
          return;
        }

        let reply = tmBot.replies.find((bot) => bot.win == winNum);

        if (!reply) {
          ctx.reply(`Can't find Window: ${winNum}`);
          return;
        }

        reply.fn(message.slice(0, 5) + message.slice(7));
      } else {
        tmBot.replies[0].fn(message);
      }
    };

  const replyReply = (message) => {
      if (tmBot.replies.length > 1) {
        let winNum = message.slice(3, 5).match(/\d+/)[0];

        if (!/\d+/.test(winNum)) {
          ctx.reply(
            `Please ensure proper formatting: Use '/r win_number message' `
          );
          return;
        }

        let reply = tmBot.replies.find((bot) => bot.win == winNum);

        if (!reply) {
          ctx.reply(`Can't find Window: ${winNum}`);
          return;
        }

        reply.fn(message.slice(0, 3) + message.slice(5));
      } else {
        tmBot.replies[0].fn(message);
      }
    };
}

  let sessionStartTime = Date.now();
  let sessionStartDate = new Date();
  return {
    startBots: async (onError, aggroTestRun) => {
      log.send("Starting the bots...");
      for(const bot of bots) {
        runBot(bot, onError, bots, aggroTestRun)
        .then(() => {
            //win.show();
            if(bots.every(({state}) => state.status == 'stop')) {
              setTimeout(() => log.setState(true), 500);
            }

            BrowserWindow.getAllWindows().forEach((win) => {
              win.webContents.send('unfreeze-loading');
            })

            //bot.stats.show().forEach((stat) => bot.log.ok(stat));
            //bot.log.ok(`Time Passed: ${convertMs(Date.now() - bot.state.startTime)}`);
        })
        .catch((error) => {
            win.show();
            bot.state.status = "stop";
            if (bots.every(({state}) => state.status == "stop")) {
              onError();
            }
            log.setState(true);
            bot.log.err(`${error.message, error.stack}`);
            if(tmBot.ctx) {
              tmBot.ctx.reply(`[ERROR]${error.message}`);
            }

            BrowserWindow.getAllWindows().forEach((win) => {
              win.webContents.send('unfreeze-loading');
            })

            //bot.stats.show().forEach((stat) => bot.log.ok(stat));
            //bot.log.ok(`Time Passed: ${convertMs(Date.now() - bot.state.startTime)}`);
        });
      }
    },
    stopBots(profile) {
      //win.show();
      let sessionData = {
        date: sessionStartDate,
        time: Date.now() - sessionStartTime,
        caught: bots.reduce((a, b) => a + b.stats.caught, 0),
        missed: bots.reduce((a, b) => a + b.stats.miss, 0),
        place: bots.length > 1 ? `Multiple` : profile
      }

      registerSession(sessionData);

      log.send('Stopped.');
      log.setState(false);
      bots.forEach(({state}) => state.status = "stop");
      if(tmBot.ctx) {
        tmBot.ctx.reply(`Stopped the bot!`);
        tmBot.stats.forEach(({stats, state}, i) => tmBot.ctx.reply(`State: <b>${state.status.toUpperCase()}</b>\nTime passed: <b> ${convertMs(Date.now() - state.startTime)}</b>\nWindow: <b>${i + 1}</b>\n---\nCaught: <b>${stats.caught} (${getPercent(stats.caught, stats.total)}%)</b>\nMissed: <b>${stats.miss + stats.confused} (${getPercent(stats.miss + stats.confused, stats.total)}%)</b>\n---\nTotal: <b>${stats.total}</b>`, { parse_mode: "HTML" }));
      }
    },
  };
};

module.exports = createBots;
