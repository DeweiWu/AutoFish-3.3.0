const runBot = require("./runBot.js");
const createBot = require("./createBot.js");

const { convertMs } = require('../utils/time.js');
const Stats = require('./stats.js');

const { createIdLog } = require("../utils/logger.js");
const EventLine = require("../utils/eventLine.js");
const { setWorker } = require("../utils/textReader.js");

const createWinSwitch = require("../game/winSwitch.js");
const { app } = require("electron");

let properLanguages = {eng: `English`, spa: "Spanish", spa_old: "Spanish Old", deu: "Deutsch", por: "Português", fra: "Français", ita: "Italiano", chi_sim: "Simplified Chinese", chi_tra: "Traditional Chinese", kor: "Korean", rus: "Russian"};

const getPercent = (value, total) => {
  return Math.ceil((value / (total || 1)) * 100 * 100) / 100;
};

const createBots = async (games, settings, config, log, tmBot, arduino) => {
  const winSwitch = createWinSwitch(new EventLine());

  if(config.patch[settings.game].whitelist) {
    log.send(`Downloading data for ${properLanguages[config.patch[settings.game].whitelistLanguage]} language, it might take a while...`);
    await setWorker(config.patch[settings.game].whitelistLanguage);
  }

if (tmBot.bot) {
  tmBot.ss = [];
  tmBot.replies = [];
  tmBot.reconnects = [];

  tmBot.bot.hears(`📷 Screenshot`, (ctx) => {
    if (!tmBot.ctx) tmBot.ctx = ctx;
    ctx.sendChatAction(`upload_photo`);
    tmBot.ss.reduce((a, screenshot) => a.then(() => screenshot(ctx)), Promise.resolve())
  });

  tmBot.bot.hears(`⌨️ Press Enter`, (ctx) => {
    tmBot.reconnects.forEach(reconnect => reconnect(ctx))
  });

  tmBot.bot.command(`/w`, (ctx) => {
    let message = ctx.update.message.text;

    if(tmBot.replies.length > 1) {
      let winNum = message[3]

      if(!(/\d+/.test(winNum))) {
        ctx.reply(`Message is written incorrectly. It should be "/w win_number message"`);
        return;
      }

      let reply = tmBot.replies.find((bot) => bot.win == winNum);

      if(!reply) {
        ctx.reply(`Can't find Window: ${winNum}`);
        return;
      }

      reply.fn(message.slice(0, 3) + message.slice(4));
    } else {
      tmBot.replies[0].fn(message);
    }
  });

  tmBot.bot.command(`/r`, (ctx) => {
    let message = ctx.update.message.text;

    if(tmBot.replies.length > 1) {
      let winNum = message[3]

      if(!(/\d+/.test(winNum))) {
        ctx.reply(`Message writtent incorrectly! It should be "/r win_number message"`);
        return;
      }

      let reply = tmBot.replies.find((bot) => bot.win == winNum);

      if(!reply) {
        ctx.reply(`Can't find Window: ${winNum}`);
        return;
      }

      reply.fn(message.slice(0, 3) + message.slice(4));
    } else {
      tmBot.replies[0].fn(message);
    }
  });
}


  if(!settings.multipleWindows) {
    games = [games[0]];
  }

  const bots = games.map((game, i) => {

    if(config.patch[settings.game].arduino) {

      if(i == 0 && (settings.multipleWindows || settings.afkmode)) {
        game.keyboard.sendKey('backspace', [100, 400]);
      }

      arduino.mouse.getPos = game.mouse.getPos;
      game = {mouse: arduino.mouse, workwindow: game.workwindow, keyboard: arduino.keyboard}
    }
    let state = { status: "initial", startTime: Date.now() };

    return {
      bot: createBot(game, {config: config.patch[settings.game], settings}, winSwitch, tmBot, i + 1, state),
      log: createIdLog(log, ++i),
      state,
      stats: new Stats()
  }
  });

if (tmBot.bot) {
  tmBot.stats = bots.map(({ stats, state }) => ({stats, state}));

  tmBot.bot.hears("📢 Stats", (ctx) => {
    if(!tmBot.ctx) tmBot.ctx = ctx;
    tmBot.stats.forEach(({stats, state}, i) => ctx.reply(`State: <b>${state.status == `working` ? `ON` : state.status == `initial` ? `INITIAL` : `OFF`}</b>\nTime passed: <b> ${convertMs(Date.now() - state.startTime)}</b>\nWindow: <b>${i + 1}</b>\n---\nCaught: <b>${stats.caught} (${getPercent(stats.caught, stats.total)}%)</b>\nMissed: <b>${stats.miss} (${getPercent(stats.miss, stats.total)}%)</b>\n---\nTotal: <b>${stats.total}</b>`, { parse_mode: "HTML" }));
  });

  tmBot.bot.hears("❌ Quit", (ctx) => {
    games.forEach(({ workwindow }) => workwindow.close());
    log.send("Stopping the bots...");
    log.setState(false);
    bots.forEach(({ state }) => (state.status = "stop"));
    ctx.reply(`Quit all the windows of the game and the bot.`);
    app.quit();
  });
}

  return {
    startBots(onError) {
      log.send("Starting the bots...");
      bots.forEach((bot) => {
        runBot(bot, onError, bots)
        .then(() => {
            log.setState(true);
            bot.stats.show().forEach((stat) => bot.log.ok(stat));
            bot.log.ok(`Time Passed: ${convertMs(Date.now() - bot.state.startTime)}`);
        })
        .catch((error) => {
            bot.state.status = "stop";
            if (bots.every(({state}) => state.status == "stop")) {
              onError();
            }
            log.setState(true);
            bot.log.err(`${error.message}`);
            if(tmBot.ctx) {
              tmBot.ctx.reply(`[ERROR]${error.message}`);
            }

            bot.stats.show().forEach((stat) => bot.log.ok(stat));
            bot.log.ok(`Time Passed: ${convertMs(Date.now() - bot.state.startTime)}`);
        });
      })
    },
    stopBots() {
      log.send('Stopping the bots...');
      if(tmBot.ctx) {
        tmBot.ctx.reply(`Stopped the bot!`);
        tmBot.stats.forEach(({stats, state}, i) => tmBot.ctx.reply(`State: <b>${state.status == `working` ? `ON` : state.status == `initial` ? `INITIAL` : `OFF`}</b>\nTime passed: <b> ${convertMs(Date.now() - state.startTime)}</b>\nWindow: <b>${i + 1}</b>\n---\nCaught: <b>${stats.caught} (${getPercent(stats.caught, stats.total)}%)</b>\nMissed: <b>${stats.miss} (${getPercent(stats.miss, stats.total)}%)</b>\n---\nTotal: <b>${stats.total}</b>`, { parse_mode: "HTML" }));
      }
      log.setState(false);
      bots.forEach(({state}) => state.status = "stop");
    },
  };
};

module.exports = createBots;
