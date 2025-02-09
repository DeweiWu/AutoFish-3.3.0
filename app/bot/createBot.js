const Zone = require("../utils/zone.js");
const createFishingZone = require("./fishingZone.js");
const createNotificationZone = require("./notificationZone.js");
const createLootZone = require("./lootZone.js");
const createChatZone = require('./chatZone');
const createLootExitZone = require("./lootExitZone.js");
const createRedButtonZone = require("./redButtonZone.js");
const pixelmatch = require('pixelmatch');
const Vec = require('../utils/vec.js');
const { hexToRgb, rgbToHex } = require("./../utils/colors.js");
const createRgb = require('../utils/rgb.js');
const createDynamicFunction = require('../utils/dynamicFunction.js');
const sharp = require('sharp');
const { createWriteStream } = require('fs');

const closeEnough = value => (v1, v2) => Math.abs(v1 - v2) <= value;

const Jimp = require(`jimp`);

const { BrowserWindow, ipcMain, app } = require(`electron`);

const { screen, Region, Point, straightTo } = require("@nut-tree-fork/nut-js");

const nutjs = require("../game/nut.js");

let once = (fn, done) => (...args) => {
  if(!done) {
    done = true;
    return fn(...args);
  }
}

const {
  percentComparison,
  readTextFrom,
  readTextFrom2,
  sortWordsByItem,
  sortWordsByItem2
} = require("../utils/textReader.js");

const { createTimer } = require("../utils/time.js");

const sleep = (time, toDo, every) => {
  let everyTime = () => every ? every : 50 + (Math.random() * 150);
  return new Promise((resolve) => {
    if(toDo && typeof toDo == `function`) {
      let startTime = Date.now();
      setTimeout(function repeat() {
        toDo().then(() => {
          if((Date.now() - startTime) < time) {
            setTimeout(repeat, everyTime());
          } else {
            resolve();
          }
        })
      }, everyTime());
    } else {
      setTimeout(resolve, time);
    }
  });
};

const random = (from, to) => {
  return from + Math.random() * (to - from);
};

const createBot = (game, { config, settings }, winSwitch, tmBot, winNum, state, onError) => {
  if(config.streamMode || (config.arduino && config.arduinoType == 'pico')) { // in stream mode we should consider network delay
    config.reactionDelay = {
      from:  Math.round(config.reactionDelay.from / 6),
      to:  Math.round(config.reactionDelay.to / 3)
    }
    config.afterHookDelay = {
      from:  Math.round(config.afterHookDelay.from / 6),
      to:  Math.round(config.afterHookDelay.to / 3)
    }
  }

  let regOnError = {};
  let chatMsgs = [];
  if(settings.game == `Vanilla (splash)` && settings.autoTh == true) {
    settings.autoTh = false;
  };

  if(settings.multipleWindows) {
    config.highlightPercent = false;
  }

  const { keyboard, mouse, workwindow } = game;
  let delay = [config.delay.from, config.delay.to];

 const altTab = async () => {
   if(config.reaction) {
     await sleep(random(config.reaction.from, config.reaction.to))
   }

  await keyboard.toggleKey(["alt", "tab"], true, delay);
  await keyboard.toggleKey(["alt", "tab"], false, delay);
 }

 class HealthBar {
   constructor({x, y, color, precision}) {
     this.x = x;
     this.y = y;
     this.precision = precision;
     this.color = hexToRgb(color);
   }

   async checkColor(getDataFrom) {
     const pixelData = await getDataFrom({x: this.x - screenSize.x, y: this.y - screenSize.y, width: 1, height: 1});
     const [r, g, b] = Array.from(pixelData.data);

     let percR = 255 - (255 * (this.precision / 100))
     let percG = 255 - (255 * (this.precision / 100))
     let percB = 255 - (255 * (this.precision / 100))

     return closeEnough(percR)(this.color.r, r) && closeEnough(percG)(this.color.g, g) && closeEnough(percB)(this.color.b, b)
   }
 }

  const action = async (callback, forced) => {
    if(state.status == `stop` && !forced) return;
    if(settings.afkmode && config.reaction) {
       await sleep(random(config.reaction.from, config.reaction.to))
    }
    await winSwitch.execute(workwindow, async (steps) => {
      await keyboard.altTab(steps, delay);
    }, winNum, config.streamMode);
    try {
      await callback();
    } catch(e) {
      if(e.message == 'socket hang up') {
        onError(new Error(`An error occured on Pico W side. You can check the error message via Mu Editor -> Serial on the PC Pico W connected to.`));
      } else {
        onError(e);
      }
    }
    winSwitch.finished();
  };

  const screenSize = workwindow.getView();
  const actionOnce = once(action);
  const missOnPurposeValue = config.missOnPurpose ? random(config.missOnPurposeRandom.from, config.missOnPurposeRandom.to) : 0;

  const inCaseOfShutDown = async () => {
      await keyboard.sendKey(`lWin`, delay);
      await sleep(random(1000, 2000));
      await keyboard.printText(`cmd`, delay);
      await sleep(random(1000, 2000));
      await keyboard.sendKey(`enter`, delay);
      await sleep(random(1000, 2000));
      await keyboard.printText(`shutdown -s -t 10`, delay); //
      await keyboard.sendKey(`enter`, delay);

      if(config.streamMode) { // even if it's VM, it will just shut down VM, not a big deal.
        await nutjs.keyboard.sendKey(`LeftWin`, delay);
        await sleep(random(1000, 2000));
        await nutjs.keyboard.printText(`cmd`, delay);
        await sleep(random(1000, 2000));
        await nutjs.keyboard.sendKey(`Enter`, delay);
        await sleep(random(1000, 2000));
        await nutjs.keyboard.printText(`shutdown -s -t 10`, delay);
        await nutjs.keyboard.sendKey(`Enter`, delay);
      }
  }

  /* --- GET DATA FROM --- */
  const getDataFrom = async (zone) => {
    if(zone.x < 0) zone.x = 0;
    if(zone.y < 0) zone.y = 0;
    if(zone.width > screenSize.width) zone.width = screenSize.width;
    if(zone.height > screenSize.height) zone.height = screenSize.height;

    switch(true) {
      case config.streamMode: {
        for(const key of Object.keys(zone)) {
          zone[key] = Math.floor(zone[key]);
        }
        return await workwindow.capture(zone);
      }

      case settings.multipleWindows || settings.afkmode || config.libraryType == 'keysender': {
        return workwindow.capture(zone);
      }

      case config.libraryType == 'nut.js': {
        return await(await screen.grabRegion(new Region(zone.x + screenSize.x, zone.y + screenSize.y, zone.width, zone.height))).toRGB();
      }
    }
  };
  /* --- GET DATA FROM END --- */

  /* --- GET DATA FROM FISHING ZONE --- */
  const getDataFromFishingZone = async (zone) => {
    if(zone.x < 0) zone.x = 0;
    if(zone.y < 0) zone.y = 0;
    if(zone.width > screenSize.width) zone.width = screenSize.width;
    if(zone.height > screenSize.height) zone.height = screenSize.height;

    switch(true) {
      case config.streamMode: {

        for(const key of Object.keys(zone)) {
          zone[key] = Math.floor(zone[key]);
        }

        let data = await workwindow.capture(zone);
        let result = await sharp(data.data, {
           raw: {
             width: Math.floor(data.width),
             height: Math.floor(data.height),
             channels: 4
          }
        })
        .sharpen()
        .modulate({
          saturation: 2, // Increase the saturation to make the colors more vibrant 1.5
        })
        .toBuffer()

        data.data = result;
        return data;
      }


      case settings.multipleWindows || settings.afkmode || config.libraryType == 'keysender': {
        let data = workwindow.capture(zone);
        let result = await sharp(data.data, {
           raw: {
             width: Math.floor(data.width),
             height: Math.floor(data.height),
             channels: 4
          }
        })
        .sharpen()
        .modulate({
          saturation: 2, // Increase the saturation to make the colors more vibrant 2
        })
        .toBuffer()

        data.data = result;
        return data;
      }

      case config.libraryType == 'nut.js': {
        let data = await(await screen.grabRegion(new Region(zone.x + screenSize.x, zone.y + screenSize.y, zone.width, zone.height))).toRGB();
        let result = await sharp(data.data, {
           raw: {
             width: Math.floor(data.width),
             height: Math.floor(data.height),
             channels: 4
          }
        })
        .sharpen()
        .modulate({
          saturation: 2, // Increase the saturation to make the colors more vibrant 2
        })
        .toBuffer()

        data.data = result;
        return data;
      }
    }
  };
  /* --- GET DATA FROM FISHINGZONE END --- */

  if(tmBot.bot) {
  tmBot.replies.push({win: winNum, fn: (message) => {
    chatMsgs.push(message);
    if (tmBot.ctx) tmBot.ctx.reply(`Your message is queued!`);
  }});

  tmBot.reconnects.push(async (ctx) => {
    await action(async () => {
      await keyboard.sendKey(config.hsKey, delay);
    }, true);
    if(regOnError.stopBots) {
      regOnError.stopBots();
    }
  });

  tmBot.openBags.push(async (ctx) => {
    await action(async () => {
      if(config.streamMode) {
        await keyboard.toggleKey('shift', true, delay);
        await keyboard.toggleKey('b', true, delay);
        await keyboard.toggleKey('shift', false, delay);
        await keyboard.toggleKey('b', false, delay);
      } else {
        await keyboard.sendKeys([`shift`, `b`], delay);
      }
    });

    await getDataFrom({x: 0, y: 0, width: screenSize.width, height: screenSize.height})
    .then(Jimp.read)
    .then((data) => data.getBufferAsync(Jimp.MIME_JPEG))
    .then(async (screenshot) => {
      await ctx.reply(`Screenshot of the window ${winNum}:`);
      await ctx.replyWithPhoto({source: screenshot})
    });

    await action(async () => {
      if(config.streamMode) {
        await keyboard.toggleKey('shift', true, delay);
        await keyboard.toggleKey('b', true, delay);
        await keyboard.toggleKey('shift', false, delay);
        await keyboard.toggleKey('b', false, delay);
      } else {
        await keyboard.sendKeys([`shift`, `b`], delay);
      }
    });
  });


  tmBot.ss.push((ctx) => {
    return getDataFrom({x: 0, y: 0, width: screenSize.width, height: screenSize.height})
    .then(Jimp.read)
    .then((data) => data.getBufferAsync(Jimp.MIME_JPEG))
    .then(async (screenshot) => {
      await ctx.reply(`Screenshot of the window ${winNum}:`);
      await ctx.replyWithPhoto({source: screenshot})
    })
   })
  }

  let fishingZone = createFishingZone(settings.bobberColor == 'Manual' ? getDataFrom : getDataFromFishingZone, Zone.from(screenSize).toRel(config.relZone), screenSize, settings, config);

  const notificationZone = createNotificationZone({
    getDataFrom: getDataFrom,
    zone: Zone.from({
      x: Math.round((screenSize.width / 2) - (screenSize.width * config.notificationPos.width)),
      y: Math.round(screenSize.height * config.notificationPos.y),
      width: Math.round((screenSize.width * config.notificationPos.width) * 2),
      height: Math.round(screenSize.height * config.notificationPos.height)
    }),
  });

  const chatZone = createChatZone({
    getDataFrom,
    screenSize,
    zone: Zone.from(screenSize).toRel(config.chatZone)
  }, tmBot, config);

  let lootWinResType;
  switch(true) {
    case screenSize.height <= 768: {
      lootWinResType = `1536`
      break;
    }

    case screenSize.height > 768 && screenSize.height <= 1080: {
      lootWinResType = `1920`;
      break;
    }

    case screenSize.height > 1080 && screenSize.height <= 1440: {
      lootWinResType = `2560`;
      break;
    }

    case screenSize.height > 1440: {
      lootWinResType = `3840`;
    }
  }
let ultrawide = (screenSize.width / screenSize.height) > 2;

const lootWindowPatch = config.lootWindow[lootWinResType] ? config.lootWindow[lootWinResType] : config.lootWindow[`1920`];
const confirmationWindowPatch = config.confirmationWindow[screenSize.width <= 1536 ? `1536` : `1920`];

let ignoreInterruptedPatch;
if (config.ignoreInterrupted) {
  ignoreInterruptedPatch = config.ignoreInterrupted[screenSize.width <= 1536 ? `1536` : `1920`];
}

const lootWindow = {
  upperLimit: lootWindowPatch.upperLimit * screenSize.height,
  toItemX: lootWindowPatch.toItemX * (ultrawide ? Number(lootWinResType) : screenSize.width),
  toItemY: lootWindowPatch.toItemY * screenSize.height,
  width: lootWindowPatch.width * (ultrawide ? Number(lootWinResType) : screenSize.width),
  height: lootWindowPatch.height * screenSize.height,
  itemHeight: lootWindowPatch.itemHeight * screenSize.height,
};

if(lootWindowPatch.itemHeightAdd) {
  lootWindow.itemHeightAdd = lootWindowPatch.itemHeightAdd * screenSize.height;
}

const confirmationWindow = {
  x: (screenSize.width / 2) - (confirmationWindowPatch.x * screenSize.width),
  y: confirmationWindowPatch.y * screenSize.height,
  width: Math.floor(confirmationWindowPatch.width * screenSize.width),
  height: Math.floor(confirmationWindowPatch.height * screenSize.height)
};

if(lootWindowPatch.cursorPos) {
  lootWindow.cursorPos = {
    x: lootWindowPatch.cursorPos.x * (ultrawide ? Number(lootWinResType) : screenSize.width),
    y: lootWindowPatch.cursorPos.y * screenSize.height
  }
}

if(lootWindowPatch.exitButton) {
  lootWindow.exitButton = {
    x: lootWindowPatch.exitButton.x * (ultrawide ? Number(lootWinResType) : screenSize.width),
    y: lootWindowPatch.exitButton.y * screenSize.height
  }
}

  const lootExitZone = createLootExitZone({getDataFrom, lootWindow, size: 10 * (screenSize.width / 1920)});

  const whitelist = config.whitelistWords
    .split(",")
    .map((word) => word.trim());

    const generateMovePastPos = (pos) => {
      let posFromCurrent = {x: pos.x - mouse.getPos().x, y: pos.y - mouse.getPos().y};
      let movePastDir =  {x: posFromCurrent.x > 0 ? 1 : -1, y: posFromCurrent.y > 0 ? 1 : -1};
      let movePastMaxMain = Math.abs(posFromCurrent.x) > Math.abs(posFromCurrent.y) ? "x" : "y";
      let movePastMaxSub = Math.abs(posFromCurrent.x) < Math.abs(posFromCurrent.y) ? "x" : "y";

      const movePastDist = Math.sqrt(Math.pow(Math.abs(posFromCurrent.x), 2) + Math.pow(Math.abs(posFromCurrent.y), 2)) * .5;

      posFromCurrent[movePastMaxMain] += (movePastDist * random(0.15, 0.20)) * movePastDir[movePastMaxMain];
      posFromCurrent[movePastMaxSub] += (movePastDist * random(0.05, 0.10)) * movePastDir[movePastMaxSub];

      return {x: posFromCurrent.x + mouse.getPos().x, y: posFromCurrent.y + mouse.getPos().y};
    }

    const moveTo = async ({ pos, withClick, norec, randomRange, fineTune = {offset: randomRange || 5, steps: [1, 3]}, forcedNutMouse, speed, deviation, cPos}) => {

      if (randomRange) {
        pos.x = pos.x + Math.round(random(-randomRange, randomRange));
        pos.y = pos.y + Math.round(random(-randomRange, randomRange));
      }

      if (config.likeHuman) {
        let speedValue = speed ? speed : config.mouseMoveSpeed;

        let convertedSpeed = speedValue / 100;
        let speedByRes = convertedSpeed * (screenSize.width / 1920);
        let speedCoofByRes = 0.05 * (screenSize.width / 1920);

        let randomSpeed = {from: speedByRes - speedCoofByRes, to: speedByRes + speedCoofByRes}

        if(randomSpeed.from < 0) {
          randomSpeed.from = 0;
        }

        let deviationValue = deviation ? deviation : config.mouseCurvatureStrength;

        let deviationCoof = config.libraryTypeInput === 'nut.js' ? 30 : 15;
        let randomDeviation = {from: deviationValue - deviationCoof, to: deviationValue + deviationCoof};
        if(randomDeviation.from < 0) {
          randomDeviation.from = 0;
        }

        if(!config.streamMode && !config.arduino && (config.libraryTypeInput === 'nut.js' || forcedNutMouse)) {
          if(!(pos instanceof Vec)) {
            pos = new Vec(pos.x, pos.y);
          }

          let curPos = cPos ? cPos : mouse.getPos();
          curPos = new Vec(curPos.x, curPos.y);

          await nutjs.mouse.humanMoveTo({
            from: curPos.plus(screenSize),
            to: pos.plus(screenSize),
            speed: random(randomSpeed.from, randomSpeed.to),
            deviation: random(randomDeviation.from, randomDeviation.to),
            fishingZone: Zone.from(screenSize).toRel(config.relZone),
            static: speed
          });
        } else if(config.arduino) {
          if(speed) {
            await mouse.humanMoveTo(pos.x, pos.y, 0, 0); // if speed is static then 0 deviation;
          } else {
            if(withClick && config.arduinoType == 'pico') {
              await mouse.humanMoveToRClick(pos.x, pos.y, random(randomSpeed.from, randomSpeed.to), random(randomDeviation.from, randomDeviation.to));
            } else {
              await mouse.humanMoveTo(pos.x, pos.y, random(randomSpeed.from, randomSpeed.to), random(randomDeviation.from, randomDeviation.to));
            }
          }
        } else {
          //let nutjspos = await nutjs.mouse.getPos();
          //let normalpos = mouse.getPos();
          if(withClick) {
            await mouse.humanMoveToRClick(pos.x, pos.y, random(randomSpeed.from, randomSpeed.to), random(randomDeviation.from, randomDeviation.to));
          } else {
            await mouse.humanMoveTo(pos.x, pos.y, random(randomSpeed.from, randomSpeed.to), random(randomDeviation.from, randomDeviation.to), norec);
          }
        }

        if(config.likeHumanFineTune && fineTune && !settings.multipleWindows && state.status != "stop") {
          let times = random(fineTune.steps[0], fineTune.steps[1]);
          for(let i = 1; i <= times; i++) {
            await mouse.humanMoveTo(
              pos.x + random(-fineTune.offset / i, fineTune.offset / i),
              pos.y + random(-fineTune.offset / i, fineTune.offset / i),
              random(randomSpeed.from / 3, randomSpeed.to / 3),
              random(randomDeviation.from, randomDeviation.to)
            );
            if(!config.streamMode) {
              await sleep(random(25, 150));
            }
          }
        }
      } else {
        await mouse.moveTo(pos.x, pos.y, delay);
      }
    };

    const checkRedButton = async (buttonPos) => {
        const redButtonZone = createRedButtonZone({getDataFrom: getDataFrom, zone: buttonPos});
        const colorPositions = await redButtonZone.isOn(mouse.getPos());

        if(colorPositions) {
          await action(async () => {
            await moveTo({pos: {
              x: buttonPos.x + 30,
              y: buttonPos.y + 30
            },
              randomRange: 2,
            });
          });

          return await redButtonZone.isOnAfterHighlight()
        }
    };


  const checkBobberTimer = createTimer(() => random(config.maxFishTime.from * 1000, config.maxFishTime.to * 1000));
  const missOnPurposeTimer = createTimer(() => random(config.missOnPurposeRandomDelay.from, config.missOnPurposeRandomDelay.to) * 1000);
  const logOutTimer = createTimer(() => random(config.logOutEvery.from * 1000 * 60, config.logOutEvery.to * 1000 * 60));

  const logOut = async (state) => {
    findPlayer.state = true;

    if(tmBot.ctx) {
      tmBot.ctx.reply(`Scheduled Logging out in: ${winNum}!`);
    }

    await action(async () => {
      if(config.logOutUseMacro) {
        await keyboard.toggleKey(config.logOutMacroKey, true, delay);
        await keyboard.toggleKey(config.logOutMacroKey, false, delay);
      } else {
        await keyboard.toggleKey(`enter`, true, delay);
        await keyboard.toggleKey(`enter`, false, delay);
        await keyboard.printText(`/logout`, delay);
        await keyboard.toggleKey(`enter`, true, delay);
        await keyboard.toggleKey(`enter`, false, delay);
      }
    });

    if(settings.afkmode) await altTab();

    await sleep(20000);

    const addTimeLures = applyLures.timer.timeRemains();
    const addTimeSpares = spares.map(spare => spare.timer.timeRemains());
    await sleep(random(config.logOutFor.from * 1000 * 60, config.logOutFor.to * 1000 * 60));
    if(state.status == 'stop') {
      return;
    }

    if(config.logOutFor.from > 30) { // if the bot more than 30 min // reconnect after 30 min ()
      await action(async () => {
        await keyboard.sendKey(`enter`);
      });

      await sleep(1000); // 1 sec

      await action(async () => {
        await keyboard.sendKey(`enter`);
      });

      if(settings.afkmode) await altTab();

      await sleep(10000); // 10 sec
    }


    await action(async () => {
      await keyboard.sendKey(`enter`);
    });

    if(settings.afkmode) await altTab();



    await sleep(random(config.logOutAfter.from * 1000 * 60, config.logOutAfter.from * 1000 * 60));

    if(config.lures) {
      applyLures.timer.update(() => addTimeLures);
    }

    if(spares.length > 0) {
      spares.forEach((spare, i) => {
        spare.timer.update(() => addTimeSpares[i]);
      })
    }

    if(config.logOutDoAfter) {
      await action(async () => {
        await keyboard.sendKey(config.logOutDoAfterKey);
      });

      if(settings.afkmode) await altTab();
    }

  if(tmBot.ctx) {
    tmBot.ctx.reply(`Logged back in: ${winNum}!`);
  }

  findPlayer.state = false;
  };
  logOut.timer = logOutTimer;
  logOut.on = config.logOut > 0;

  const preliminaryChecks = async (log) => {
    if(config.ignorePreliminary) return;

    if (screenSize.x == -32000 && screenSize.y == -32000) {
      throw new Error("The window is either in fullscreen mode or minimized. Switch to windowed or windowed(maximized).");
    }

    if(settings.autoColor) {
      let colorPercent = await fishingZone.checkColor();
      if(colorPercent > 25) {
        fishingZone.changeColor();
      }
    }

    if(!settings.autoTh) {
      let bobber = await fishingZone.findBobber();

      if (bobber) {
        screen.config.highlightOpacity = 1;
        screen.config.highlightDurationMs = 1000;
        const highlightRegion = new Region(screenSize.x + (bobber.x - 15), screenSize.y + (bobber.y - 15), 30, 30);
        await screen.highlight(highlightRegion);

        throw new Error(
          `Found ${settings.bobberColor == `red` ? `red` : `blue`} colors before casting. Change your Fishing Zone or increase the Threshold value or change the fishing place.`
        );
      }
    }
  };

  const applyMammoth = async () => {
    await action(async () => {
      await keyboard.sendKey(config.mammothKey, delay);
    });
    await sleep(config.mammothKeyDelay);

    if(config.reaction) {
      await sleep(random(config.reaction.from, config.reaction.to));
    }

    await action(async () => {
      if(config.mammothUseMacro) {
        await keyboard.toggleKey(config.mammothMacroKey, true, delay);
        await keyboard.toggleKey(config.mammothMacroKey, false, delay);
      } else {
        await keyboard.toggleKey(`enter`, true, delay);
        await keyboard.toggleKey(`enter`, false, delay);
        await keyboard.printText(`/target ${config.mammothTraderName} `, delay);
        await keyboard.toggleKey(`enter`, true, delay);
        await keyboard.toggleKey(`enter`, false, delay);
      }
    });

    if(config.reaction) {
      await sleep(random(config.reaction.from, config.reaction.to));
    }

    await action(async () => {
      await keyboard.toggleKey(settings.intKey, true, delay);
      await keyboard.toggleKey(settings.intKey, false, delay);
    });

    await sleep(random(config.mammothSellDelay.from, config.mammothSellDelay.to));



    await action(async () => {
      await keyboard.sendKey(`escape`, delay);
      if(config.reaction) {
        await sleep(random(config.reaction.from, config.reaction.to));
      }
      await keyboard.sendKey(config.mammothKey, delay);
    });

    if(settings.afkmode) {
      await altTab();
    }

    await sleep(config.mammothAfterTradeDelay * 1000);

    if(config.reaction) {
      await sleep(random(config.reaction.from, config.reaction.to));
    }
  }

  applyMammoth.on = config.mammoth;
  applyMammoth.timer = createTimer(() => random(config.mammothApplyEvery.from * 1000 * 60, config.mammothApplyEvery.to * 1000 * 60));

  const applyLures = async () => {
    if(config.luresType == `key`) {
      await action(async () => {
        await keyboard.sendKey(config.luresKey, delay);
      });
    } else {
      await action(async () => {
        await moveTo({pos: {x: config.luresCoords.x - screenSize.x, y: config.luresCoords.y - screenSize.y}, randomRange: 0, fineTune: false});
        await mouse.toggle('right', true, delay);
        await mouse.toggle('right', false, delay);
        if(config.luresOpenCharacterWin) {
          await keyboard.sendKey('c', delay);
        }
        await moveTo({pos: {x: config.fishpoleCoords.x - screenSize.x, y: config.fishpoleCoords.y - screenSize.y}, randomRange: 3, fineTune: false});
        await mouse.toggle('left', true, delay);
        await mouse.toggle('left', false, delay);

        if(config.luresOpenCharacterWin) {
          await keyboard.sendKey('c', delay);
        }
      });
    }

    if(config.confirmLures) {
      if (config.reaction && !config.streamMode) {
        await sleep(random(config.reactionDelay.from, config.reactionDelay.to));
      } else {
        await sleep(random(500, 1000)) // wait for the window to appear
      }
      const needsConfirm = await checkRedButton(confirmationWindow);
      if(needsConfirm) {
        await action(async () => {
          await mouse.toggle('left', true, delay);
          await mouse.toggle('left', false, delay);
        });
      }
    }

    if(settings.afkmode) {
      await altTab();
    }

    await sleep(config.luresDelay);
    if (config.reaction) {
      await sleep(random(config.reactionDelay.from, config.reactionDelay.to));
    }
  };
  applyLures.on = config.lures;
  applyLures.timer = createTimer(() => {
    return config.luresDelayMin * 60 * 1000;
  });

  if(config.luresOmitInitial) {
    applyLures.timer.start();
  }

  let spares = config.spares.reduce((a, b) => {
    if(b.execute) {
      let parentSpare = a[a.length - 1];

      if(!parentSpare.inner) {
        parentSpare.inner = [];
      }

      parentSpare.inner.push(b);
      return a;
    } else {
      return [...a, b];
    }
  }, []);

  spares = spares.map((spare) => {
      const applySpareDummy = (spare) => async () => {

        switch(spare.type) {
          case "Pixel Color TRUE": {
            let [r, g, b] = Array.from((await getDataFrom({x: spare.x - screenSize.x, y: spare.y - screenSize.y, width: 1, height: 1})).data);
            let color = hexToRgb(spare.color);

           let percR = 255 - (255 * (spare.precision / 100))
           let percG = 255 - (255 * (spare.precision / 100))
           let percB = 255 - (255 * (spare.precision / 100))

            if(!
              (percR)(r, color.r) && !closeEnough(percG)(g, color.g) && !closeEnough(percB)(b, color.b)) {
              return "break";
            }

            break;
          }

          case "Pixel Color FALSE": {
            let [r, g, b] = Array.from((await getDataFrom({x: spare.x - screenSize.x, y: spare.y - screenSize.y, width: 1, height: 1})).data);
            let color = hexToRgb(spare.color);

            let percR = 255 - (255 * (spare.precision / 100))
            let percG = 255 - (255 * (spare.precision / 100))
            let percB = 255 - (255 * (spare.precision / 100))

            if(closeEnough(percR)(r, color.r) && closeEnough(percG)(g, color.g) && closeEnough(percB)(b, color.b)) {
              return "break";
            }
            break;
          }

          case "Chance": {
            let chance = Math.random() < (spare.chance / 100);
            if(chance) {
              return "break";
            }

            break;
          }
        }

        for(let times = 0; times < Number(spare.repeat || 1); times++) {
          await action(async () => {
          switch(spare.type) {
            case "Print Text": {
              await keyboard.printText(spare.text, delay);
              break;
            }

            case "Press Key": {
              await keyboard.sendKey(spare.key, delay);
              break;
            }

            case "Move Mouse": {
              await moveTo({pos: {x: spare.x - screenSize.x, y: spare.y - screenSize.y}, randomRange: 3});
              break;
            }

            case "Move Mouse + Right Click": {
              await moveTo({pos: {x: spare.x - screenSize.x, y: spare.y - screenSize.y}, randomRange: 3});
              if (config.reaction) {
                await sleep(random(config.reactionDelay.from, config.reactionDelay.to));
              }
              await mouse.toggle('right', true, delay);
              await mouse.toggle('right', false, delay)
             break;
            }

            case "Move Mouse + Left Click": {
              await moveTo({pos: {x: spare.x - screenSize.x, y: spare.y - screenSize.y}, randomRange: 3});
              if (config.reaction) {
                await sleep(random(config.reactionDelay.from, config.reactionDelay.to));
              }
              await mouse.toggle('left', true, delay);
              await mouse.toggle('left', false, delay)
              break;
            }

            case "Drag Mouse By Right": {
              await mouse.toggle('right', true, delay);
              await moveTo({pos: {x: spare.x - screenSize.x, y: spare.y - screenSize.y}, randomRange: 3});
              if (config.reaction) {
                await sleep(random(config.reactionDelay.from, config.reactionDelay.to));
              }
              await mouse.toggle('right', false, delay);
              break;
            }

            case "Drag Mouse By Left": {
              await mouse.toggle('left', true, delay);
              await moveTo({pos: {x: spare.x - screenSize.x, y: spare.y - screenSize.y}, randomRange: 3});
              if (config.reaction) {
                await sleep(random(config.reactionDelay.from, config.reactionDelay.to));
              }
              await mouse.toggle('left', false, delay);
              break;
            }

            case "Left Click": {
              await mouse.toggle('left', true, delay);
              await mouse.toggle('left', false, delay);
              break;
            }

            case "Right Click": {
              await mouse.toggle('right', true, delay);
              await mouse.toggle('right', false, delay);
              break;
            }

            case "Middle Click": {
              await mouse.toggle('middle', true, delay);
              await mouse.toggle('middle', false, delay);
            }
          }
        });

          if(spare.autoconfirm) {
            if (config.reaction && !config.streamMode) {
              await sleep(random(config.reactionDelay.from, config.reactionDelay.to));
            } else {
              await sleep(random(500, 1000)) // wait for the window to appear
            }
          const needsConfirm = await checkRedButton(confirmationWindow);
          if(needsConfirm) {
            await action(async () => {
              await mouse.toggle('left', true, delay);
              await mouse.toggle('left', false, delay);
            });
          }
        }

          if(settings.afkmode) {
          await altTab();
        }

          await sleep(random(spare.delayFrom * 1000, spare.delayTo * 1000));

          if (config.reaction) {
            await sleep(random(config.reactionDelay.from, config.reactionDelay.to));
          }
       }

       if(spare.inner) {
         for(let innerSpare of spare.inner) {
           let toBreak = await applySpareDummy(innerSpare)();
           if(toBreak == 'break') {
             break;
           }
         }
       }
      };

      const applySpare = applySpareDummy(spare);

      applySpare.timer = createTimer(() => {
        return spare.repeatTime * 1000 * 60;
      });

      if(spare.omitinitial) {
        applySpare.timer.start();
      }

      return applySpare;
  })

  const randomSleep = async () => {
    let likelihood = Math.random() * 100;
    if(likelihood > config.randomSleepChance) {
      return;
    }

    if(settings.afkmode) await altTab();

    let sleepFor = random(
      config.randomSleepDelay.from * 1000,
      config.randomSleepDelay.to * 1000
    );
    await sleep(sleepFor);
  };

  randomSleep.on = config.randomSleep;
  randomSleep.timer = createTimer(() => {
    return (
      random(config.randomSleepEvery.from, config.randomSleepEvery.to) *
      60 *
      1000
    );
  });

  const cutOutNotification = (zone) => {
    let noteZone = Zone.from(screenSize).toRel(zone);
    let fZone = Zone.from(screenSize).toRel(config.relZone)
    let result = [];
    for(let y = noteZone.y - fZone.y; y < (noteZone.y - fZone.y) + noteZone.height; y++) {
      for(let x = noteZone.x - fZone.x; x < (noteZone.x - fZone.x) + noteZone.width; x++) {
        result.push(new Vec(x, y));
      }
    }
    return result;
  }

  const findAllBobberColors = async () => {
    let bobber = [];

    if(settings.game != `Retail` && settings.game != `Cata Classic` && settings.game != `Classic`) {
        let bobberPrint = await fishingZone.getBobberPrint(7);
        bobber = [...bobber, ...(bobberPrint ? bobberPrint : [])];

        if(config.ignoreInterrupted) {
          let interruptedArea = cutOutNotification(ignoreInterruptedPatch);
          bobber = [...bobber, ...interruptedArea];
        }
    }

    return bobber;
  };

  const detectZone = Zone.from(screenSize).toRel(config.detectZone);
  const checkChanges = (onError, log) => {
    let prevImg = null;
    let prevDiff = 0;

    checkChanges.blocked = false;
    checkChanges.block = (inner) => {
      if(config.checkChanges && (config.checkChangesIgnoreActions || inner)) {
        checkChanges.blocked = true;
        prevImg = null;
      }
    };

    checkChanges.unblock = (inner) => {
      if(config.checkChanges && (config.checkChangesIgnoreActions || inner)) {
        checkChanges.blocked = false;
      }
    };

    if(config.checkChanges) {
      setTimeout(async function checkChangesRepeat () {

        if(state.status == `stop`) return;

        if(!prevImg && !checkChanges.blocked) {
          prevImg = await getDataFrom(detectZone);
          prevDiff = 0;
        } else if(!checkChanges.blocked) {
          let newImg = await getDataFrom(detectZone);
          let res = pixelmatch(prevImg.data, newImg.data, null, detectZone.width, detectZone.height,  {threshold: (1000 - config.checkChangesSens) / 1000 });

          let difference = (res / (detectZone.width * detectZone.height)) * 100;
          let differenceResult = Math.abs(difference - prevDiff);
          prevDiff = difference;

          if(differenceResult > 1) {
            log.warn(`Something happened!`);

            if(tmBot.ctx) {
              if(state.status != "stop") {
                tmBot.ctx.reply(`Something happened in the window ${winNum}:`);
                if(config.checkChangesSendImg) {
                  Jimp.read(newImg)
                  .then((data) => data.getBufferAsync(Jimp.MIME_JPEG))
                  .then((screenshot) => {
                    tmBot.ctx.replyWithPhoto({source: screenshot});
                  })
                }
              }
            }

            checkChanges.block(true);

            let toDo = config.checkChangesDoAfter;

            if(toDo == `random`) {
              toDo = [`sleep`, `move`, `nothing`][Math.floor(Math.random() * 3)]
            }

            if(toDo == `sleep`) {
              if(state.status == `checking`) {
                await action(async () => {
                  await keyboard.sendKey('escape', delay);
                })
              }
              state.status = 'sleep';
              state.sleepTime = config.checkChangesDoAfterSleepTime * 1000 * 60;
            }

            if(toDo == `logout`) {
              state.status = 'logout';
            }

            if(toDo == `move`) {
              state.status = 'move';
            }

            if(toDo == `press key`) {
              await action(async () => {
                await keyboard.sendKey(config.checkChangesDoAfterKey, delay);
              })
              state.status = 'sleep';
              state.sleepTime = config.checkChangesDoAfterSleepTime * 1000 * 60;
            }

            if(toDo == `stop`) {
              onError();
            }

            if(toDo == `quit`) {
              workwindow.close();
              app.quit();
            }

            if(config.checkChangesDoAfter == `nothing`) {
              setTimeout(() => {
                checkChanges.unblock(true);
              }, config.checkChangesIntervalAfter * 1000);
            }
          } else {
            prevImg = newImg;
          }
        }

        if(state.status != "stop") {
          setTimeout(checkChangesRepeat, config.checkChangesInterval * 1000);
        }
      }, config.checkChangesInterval * 1000);
    }
  };

  let wavedAlready = false;
  let rotationTime = config.findPlayerRotationTimeKeyboard; // arduino: 1995  soft: 2000

  const findPlayer = async (state, log, onError) => {

    if(config.arduino) {
      config.findPlayerMouseSpeed = 50;
    }

    const enemyHp = new HealthBar(config.findPlayerHp);
    let enemyHpException = new HealthBar(config.findPlayerHpException);

    const checkTarget = async () => {
      if(config.game != 'Vanilla' && config.game != 'Vanilla (splash)') {
        enemyHpException.checkColor = () => false;
      }
      let targetIsOn = await enemyHp.checkColor(getDataFrom) && !(await enemyHpException.checkColor(getDataFrom));
      return targetIsOn;
    }

    const scrollCamera = async (direction, value) => {
        if(config.arduino || config.streamMode) {
          await mouse.scroll(direction, value);
        } else {
          for(let step = 0; step < value; step++) {
            await nutjs.mouse.scroll(1, direction);
          }
        }
    };
    const generateRandomSteps = (th, from, to) => {
      const steps = [];
      for(let maxValue = 0;;) {
        let value = Math.round(random(from, to));
        if(maxValue + value < th) {
          maxValue += value;
          steps.push(value);
        } else {
          steps.push(th - maxValue);
          break;
        }
      }
      return steps;
    }
    const lowerCamera = async (direction) => {
      if(config.findPlayerCameraVerticalDistance < 1 || config.findPlayerRotateBy != "Mouse") {
        return;
      }
      let signDir = direction ? -1 : 1;

      let cPos = mouse.getPos();

      cPos = {x: cPos.x + 1, y: cPos.y + 1};

      let y = cPos.y - (10 * config.findPlayerCameraVertical) * signDir;

      await mouse.toggle('left', true, delay);

      await moveTo({
        pos: {x: cPos.x, y: y},
        fineTune: false,
        randomRange: 0,
        speed: config.findPlayerMouseSpeed,
        deviation: 50
      });
      await mouse.toggle('left', false, delay);

      await moveTo({pos: cPos, fineTune: false, randomRange: 0});
      await sleep(random(delay[0], delay[1]));
    }
    const steps = generateRandomSteps(config.findPlayerRotationTimeMouse, config.findPlayerRotationTimeMouse * 0.1, config.findPlayerRotationTimeMouse * 0.2) // arduino: 2570, soft: 1590

    const rotationTimer = createTimer(() => rotationTime);
    let yCompensation = 0;
    let foundPlayer = false;

   await action(async () => {

    if(!config.findPlayer) {
      return;
    }

    if(state.status == 'checking') {
      await keyboard.sendKey('escape', delay);
    }

    findPlayer.state = true;
    log.send('Searching for other players...');

    await lowerCamera(false);
    await scrollCamera(false, config.findPlayerCameraDistance);
    if(config.arduino || config.streamMode) await sleep(1000);
    await sleep(random(delay[0], delay[1]));

    if(config.findPlayerRotateBy == 'Mouse') {
      let wavedAlreadyInner = false;
      for(let i = 0; i < steps.length; i++) {
        let step = steps[i];

        let cPos = mouse.getPos();
        cPos = {x: cPos.x + 1, y: cPos.y + 1}; // +1 compensation because of incorrect getPos position after.

        let randomYvalue = Math.round(random(-10, 10));
        if(i < steps.length - 1) {
          if(yCompensation + randomYvalue < -10 || yCompensation + randomYvalue > 10) {
            randomYvalue = -randomYvalue;
          }
          yCompensation += randomYvalue;
        } else {
          randomYvalue = -yCompensation;
        }

        if(config.arduino || config.streamMode) randomYvalue = 0;

        let x = cPos.x - (config.findPlayerTurnDir == 'left' ? step : -step);

        await mouse.toggle('left', true, delay);
        await moveTo({pos: {x: x, y: cPos.y + randomYvalue}, fineTune: false, randomRange: 0, speed: config.findPlayerMouseSpeed, deviation: 50}); // randomYvalue
        await mouse.toggle('left', false, delay);

        await moveTo({pos: cPos, fineTune: false, randomRange: 0});
        await sleep(random(delay[0], delay[1]));

        if(!foundPlayer) {
          await keyboard.sendKey(config.findPlayerTargetKey, delay);
          if(config.findPlayerTargetKeyAddUse) {
            await keyboard.sendKey(config.findPlayerTargetKeyAdd, delay);
          }
        }

        await sleep(random(delay[0], delay[1]));


        if(await checkTarget() && !foundPlayer) {
          log.warn("Found a player in the vicinity!");
          foundPlayer = true;
          if(tmBot.ctx) {
            tmBot.ctx.reply(`Found a player in the vicinity in Window: ${winNum}!`);
            getDataFrom({x: 0, y: 0, width: screenSize.width, height: screenSize.height})
            .then(Jimp.read)
            .then((data) => data.getBufferAsync(Jimp.MIME_JPEG))
            .then(async (screenshot) => {
              await tmBot.ctx.replyWithPhoto({source: screenshot})
            })
          }
        }

        if(foundPlayer && config.findPlayerDoAfter == `Face and Wave` && !wavedAlreadyInner && !wavedAlready) {

          /* facing */
          await mouse.toggle('right', true, delay);
          await mouse.toggle('left', true, delay);
          await mouse.toggle('right', false);
          await mouse.toggle('left', false);

          await keyboard.sendKey('enter', delay);
          await keyboard.printText('/wave', delay);
          await keyboard.sendKey('enter', delay);

          wavedAlreadyInner = true;

          await sleep(config.findPlayerDoAfterSleepTime * 1000);
        }
      }

      if(config.findPlayerDoAfter == `Face and Wave` && wavedAlreadyInner) {
        wavedAlready = true;

        await mouse.toggle('right', true, delay);
        await mouse.toggle('left', true, delay);
        await mouse.toggle('right', false, delay);
        await mouse.toggle('left', false, delay);

        setTimeout(() => {
          wavedAlready = false;
        }, 15 * 60 * 1000); // don't wave within 15 min
      }

    } else {
      let wavedAlreadyInner = false;

      rotationTimer.start();
      await keyboard.toggleKey(config.findPlayerTurnDir, true);

      const pressTargetKeyTimer = createTimer(() => 200);
      pressTargetKeyTimer.start();

      let startRotation = Date.now();
      while(!rotationTimer.isElapsed()) {

        if(!foundPlayer && pressTargetKeyTimer.isElapsed()) {
          await keyboard.sendKey(config.findPlayerTargetKey);
          if(config.findPlayerTargetKeyAddUse) {
            await keyboard.sendKey(config.findPlayerTargetKeyAdd);
          }
          pressTargetKeyTimer.update();
        }

        if(await checkTarget() && !foundPlayer) {
          log.warn("Found a player in the vicinity!");
          foundPlayer = true;
          if(tmBot.ctx) {
            tmBot.ctx.reply(`Found a player in the vicinity in Window: ${winNum}!`);
            getDataFrom({x: 0, y: 0, width: screenSize.width, height: screenSize.height})
            .then(Jimp.read)
            .then((data) => data.getBufferAsync(Jimp.MIME_JPEG))
            .then(async (screenshot) => {
              await tmBot.ctx.replyWithPhoto({source: screenshot})
            })
          }
        }

        if(foundPlayer && config.findPlayerDoAfter == `Face and Wave` && !wavedAlreadyInner && !wavedAlready) {
          let timeRemained = rotationTimer.timeRemains();
          await keyboard.toggleKey(config.findPlayerTurnDir, false);

          await keyboard.sendKey('enter', delay);
          await keyboard.printText('/wave', delay);
          await keyboard.sendKey('enter', delay);

          await sleep(config.findPlayerDoAfterSleepTime * 1000);
          wavedAlready = true;
          wavedAlreadyInner = true;

          setTimeout(() => {
            wavedAlready = false;
          }, 15 * 60 * 1000); // don't wave within 5 min

          rotationTimer.update(() => timeRemained);
          await keyboard.toggleKey(config.findPlayerTurnDir, true);
        }
      }
      await keyboard.toggleKey(config.findPlayerTurnDir, false);
    }

    await scrollCamera(true, config.findPlayerCameraDistance);
    if(config.arduino || config.streamMode) await sleep(1000);
    await lowerCamera(true);

    lastMovementFrom = 'findPlayer';

    if(foundPlayer) {
      switch(config.findPlayerDoAfter) {
        case "Sleep": {
          state.status = `sleep`;
          state.sleepTime = config.findPlayerDoAfterSleepTime * 1000;
          if(settings.afkmode) await altTab();
          break;
        }

        case "Log out": {
          state.status = `logout`;
          state.sleepTime = config.findPlayerDoAfterSleepTime * 1000;
          break;
        }

        case "Random Movement": {
          state.status = `move`;
          state.sleepTime = config.findPlayerDoAfterSleepTime * 1000;
          if(settings.afkmode) await altTab();
          break;
        }

        case "Face and Wave": {
          if(wavedAlready) break;
          state.status = 'sleep';
          state.sleepTime = config.findPlayerDoAfterSleepTime * 1000;

          await keyboard.sendKey('enter', delay);
          await keyboard.printText('/wave', delay);
          await keyboard.sendKey('enter', delay);

          wavedAlready = true;
          setTimeout(() => {
            wavedAlready = false;
          }, 15 * 60 * 1000); // don't wave within 15 min
          if(settings.afkmode) await altTab();
          break;
        }

        case "Press Key": {
          await keyboard.sendKey(config.findPlayerDoAfterKey, delay);
          state.status = 'sleep';
          state.sleepTime = config.findPlayerDoAfterSleepTime * 1000;
          if(settings.afkmode) await altTab();
          break;
        }

        case "Stop": {
          state.status = "stop";
          break;
        }

        case "Exit": {
          state.status = "stop";
          onError();
          workwindow.close();
          break;
        }
      }

      if(await enemyHp.checkColor(getDataFrom)) { // if target is still opened and within vicinity
        await keyboard.sendKey('escape', delay); // close target
      }
    } else {
      log.ok('None.');
    }

    if((config.game == 'Vanilla' || config.game == 'Vanilla (splash)') && await enemyHp.checkColor(getDataFrom)) {
      await keyboard.sendKey('escape', delay); // close target
    }

    findPlayer.state = false;
   });
  };
  findPlayer.timer = createTimer(() => random(config.findPlayerInterval.from * 60 * 1000, config.findPlayerInterval.to * 60 * 1000));
  findPlayer.on = config.findPlayer && config.findPlayerType != 'Front';
  findPlayer.state;
  findPlayer.frontCheck = async (state, log, onError) => {
    if(!config.findPlayer || config.findPlayerType == 'Around' || settings.multipleWindows || settings.afkmode || config.game == 'Vanilla' || config.game == 'Vanilla (splash)') {
      return;
    }

    while(state.status != 'stop') {
      await sleep(random(config.findPlayerFrontInterval.from * 1000, config.findPlayerFrontInterval.to * 1000));

      if(state.status == 'stop') {
        break;
      }

      if(findPlayer.state || state.status == 'move' || state.status == 'logout' || state.status == 'sleep') {
        continue;
      }

      await keyboard.sendKey(config.findPlayerTargetKey, delay);

      if(config.findPlayerTargetKeyAddUse) {
        await keyboard.sendKey(config.findPlayerTargetKeyAdd, delay);
      }

      const enemyHp = new HealthBar(config.findPlayerHp);
      if(await enemyHp.checkColor(getDataFrom)) {

        log.warn("Found a player in the vicinity!");
        if(tmBot.ctx) {
          tmBot.ctx.reply(`Found a player in the vicinity in Window: ${winNum}!`);
        }

        switch(config.findPlayerDoAfter) {
          case "Sleep": {
            state.status = `sleep`;
            state.sleepTime = config.findPlayerDoAfterSleepTime * 1000;
            if(settings.afkmode) await altTab();
            break;
          }

          case "Log out": {
            state.status = `logout`;
            state.sleepTime = config.findPlayerDoAfterSleepTime * 1000;
            break;
          }

          case "Random Movement": {
            state.status = `move`;
            state.sleepTime = config.findPlayerDoAfterSleepTime * 1000;
            if(settings.afkmode) await altTab();
            break;
          }

          case "Face and Wave": {
            if(wavedAlready) break;
            state.status = 'sleep';
            state.sleepTime = config.findPlayerDoAfterSleepTime * 1000;

            await keyboard.sendKey('enter', delay);
            await keyboard.printText('/wave', delay);
            await keyboard.sendKey('enter', delay);

            wavedAlready = true;
            setTimeout(() => {
              wavedAlready = false;
            }, 15 * 60 * 1000); // don't wave within 15 min
            if(settings.afkmode) await altTab();
            break;
          }

          case "Press Key": {
            await keyboard.sendKey(config.findPlayerDoAfterKey, delay);
            state.status = 'sleep';
            state.sleepTime = config.findPlayerDoAfterSleepTime * 1000;
            if(settings.afkmode) await altTab();
            break;
          }

          case "Stop": {
            state.status = "stop";
            break;
          }

          case "Exit": {
            state.status = "stop";
            onError();
            workwindow.close();
            break;
          }
        }

        while(await enemyHp.checkColor(getDataFrom)) { // if target is still opened and within vicinity
          await action(async () => {
            await keyboard.sendKey('escape', delay); // close target
          });
        }
      }
    }
  }

  const deathCheck = async (wins, onStop, log) => {
    if(!config.deathCheck) {
      return;
    }
    const deathHp = new HealthBar(config.deathHp);
    while(state.status != 'stop') {
      await sleep(1000);

      if(findPlayer.state || state.status == 'move' || state.status == 'logout') {
        continue;
      }


      if(!(await deathHp.checkColor(getDataFrom))) {

        if(doAfterTimer.on && doAfterTimer.timer.isElapsed() && config.timerShutDown) {
          return;
        }

        let isLastWin = wins.filter(win => win.state.status != `stop`).length == 1;

        log.warn(`The bot is dead or disconnected in WIN${winNum}! Closing window...`);
        if(tmBot.bot) {
          tmBot.ctx.reply(`The bot is dead or disconnected in WIN${winNum}!`);
          await getDataFrom({x: 0, y: 0, width: screenSize.width, height: screenSize.height})
          .then(Jimp.read)
          .then((data) => data.getBufferAsync(Jimp.MIME_JPEG))
          .then(async (screenshot) => {
            await tmBot.ctx.reply(`Screenshot of the WIN${winNum}:`);
            await tmBot.ctx.replyWithPhoto({source: screenshot})
          });
        }

        if(config.deathCheckQuit) {
          /*
          if(config.streamMode) {

            await action(async () => {
              await keyboard.toggleKey('alt', true, delay);
              await keyboard.sendKey('f4', delay);
              await keyboard.toggleKey('alt', false, delay);

              await keyboard.sendKey('enter', delay);
              await keyboard.printText('/logout', delay);
              await keyboard.sendKey('enter', delay);
            })
          } else {
            workwindow.close();
          }
          */

          if(config.timerShutDown && isLastWin) {  //  if you have a timer.shutDown ON the bot will also shut down
            await action(async () => {
              await inCaseOfShutDown();
            })
          }

          if(isLastWin) {
            onStop();
            app.quit();
            return;
          }
        }

        if(isLastWin) {
          onStop();
          return;
        }

        state.status = 'stop'; // stop this window
      }
    }
  };

  const aggroCheck = async (onStop, state, aggroTestRun) => {
    if(!config.aggroCheck) return;
    const runAway = async (time) => {

      if(config.aggroCheckControlBy == "Mouse") {
        let step = 1600 * (config.aggroCheckRunAwayFirstTurnDeg / 360);
        if(config.aggroCheckRunAwayFirstTurnDir == 'left') {
          step = -step;
        }
        let cPos = mouse.getPos();
        await mouse.toggle('right', true, delay);
        await moveTo({pos: {x: cPos.x + step, y: cPos.y}, randomRange: 0, fineTune: false, speed: config.aggroCheckMouseSpeed});
        await mouse.toggle('right', false, delay);
      } else {
        let step = 2000 * (config.aggroCheckRunAwayFirstTurnDeg / 360);
        let dir = config.aggroCheckRunAwayFirstTurnDir;
        await keyboard.toggleKey(dir, true);
        await sleep(step);
        await keyboard.toggleKey(dir, false);
      }

      await keyboard.toggleKey('w', true, delay);
        for(let start = Date.now(); Date.now() < start + time;) {

          while(random(0, 100) < 50) {
            await keyboard.sendKey('space', [250, 750]);
          }

          if(random(0, 100) > 50) {
            await _rngMoveAction()
            await keyboard.toggleKey('w', true, delay);
          }

          await sleep(random(250, 3000));
        }
      await keyboard.toggleKey('w', false, delay);
    };

    const createEnemyZone = (scale) => {
      const combatZone = Zone.from(screenSize).toRel(config.combatZone);
      if(scale) {
        let middle = combatZone.x + combatZone.width / 2;
        combatZone.width = screenSize.width * scale;
        combatZone.x = middle - (combatZone.width / 2)
      }
      return combatZone;
    }

    const findEnemy = async (zone, ignoreErrorZone) => {
      let enemyScreenData = await getDataFrom(zone);

      let errorZone = Zone.from({
        x: Math.round((screenSize.width / 2) - (screenSize.width * config.notificationPos.width)) - zone.x,
        y: Math.round(screenSize.height * config.notificationPos.y) - zone.y,
        width: Math.round((screenSize.width * config.notificationPos.width) * 2),
        height: Math.round(screenSize.height * config.notificationPos.height)
      });

      const image = await Jimp.read(enemyScreenData);
      let positions = [];
      image.scan(0, 0, image.bitmap.width, image.bitmap.height, function (x, y, idx) {

      if(ignoreErrorZone && y > errorZone.y && y < errorZone.y + errorZone.height) { // ignore error messages
        return;
      }

      let r = this.bitmap.data[idx + 0];
      let g = this.bitmap.data[idx + 1];
      let b = this.bitmap.data[idx + 2];

        if((r - Math.max(g, b)) > config.aggroCheckEnemyName) {
          positions.push({x, y});
        }
      });

      if(positions.length < 1) {
        return;
      }

      return positions.map(pos => ({
         x: zone.x + pos.x,
         y: zone.y + pos.y + (screenSize.height / 1080 * 20)}
       ));
    };
    const centerCamera = async (centerX, centerY, stepX, stepY) => {
      let cPos = mouse.getPos();
      cPos = {x: cPos.x + 1, y: cPos.y + 1};
      if(config.aggroCheckControlBy == "Mouse") {
        await mouse.toggle('right', true);
        await moveTo({pos: {x: cPos.x + stepX, y: cPos.y + stepY}, randomRange: 0, fineTune: false});
        await mouse.toggle('right', false);
      } else {
        if(stepX > 0) {
          await keyboard.toggleKey("right", true);
          await sleep(Math.abs(stepX));
          await keyboard.toggleKey("right", false);
        } else {
          await keyboard.toggleKey("left", true);
          await sleep(Math.abs(stepX));
          await keyboard.toggleKey("left", false);
        }
      }
    }
    const userHp = new HealthBar(config.aggroCheckUserHp);
    const enemyHp = new HealthBar(config.aggroCheckEnemyHp);

    let skills = config.skills.map((skill) => (
      {
      ...skill,
      attackRange: new HealthBar({x: skill.x, y: skill.y, color: skill.color, precision: skill.precision}),
      initial: true,
      async apply() {
        await keyboard.sendKey(this.key, delay);
        this.delayTimer.update();
        this.cooldownTimer.update();
      },
      cooldownTimer: createTimer(() => {
        if(skill.cooldown < skill.delay) {
          skill.cooldown = skill.delay;
        }
        return skill.cooldown * 1000
      }),
      delayTimer: createTimer(() => (skill.delay + 1) * 1000) // + 1 second to avoid all "skill available" animations.
    }));

    const findAndCenter = async (zone) => {
      enemyPosition = await findEnemy(zone, true); // ignoreEnemyZone = true;
      if(enemyPosition) {
        const combatZone = createEnemyZone();
        const avarageX = enemyPosition.reduce((a, b) => a + b.x, 0) / enemyPosition.length; // middle position
        const avarageY = enemyPosition.reduce((a, b) => a + b.y, 0) / enemyPosition.length; // middle position
        let stepSizeX = (avarageX - (combatZone.x + (combatZone.width / 2))) / (screenSize.height / 1080); // how much we should move the camera to center the name of the enemy
        let stepSizeY = (avarageY - (combatZone.y + (combatZone.height / 2))) / (screenSize.height / 1080); // how much we should move the camera to center the name of the enemy
        await centerCamera(avarageX, avarageY, Math.round(stepSizeX / 4), Math.round(stepSizeY / 4));
      }
    }

    const lowerCamera = async (direction) => {

      if(config.aggroCheckCameraVertical < 1 || config.aggroCheckControlBy != "Mouse") {
        return;
      }

      let signDir = direction ? -1 : 1;

      let cPos = mouse.getPos();

      cPos = {x: cPos.x + 1, y: cPos.y + 1};

      let y = cPos.y - (10 * config.aggroCheckCameraVertical) * signDir;
      await mouse.toggle('left', true, delay);
      await moveTo({
        pos: {x: cPos.x, y: y},
        fineTune: false,
        randomRange: 0,
        speed: config.aggroCheckMouseSpeed,
        deviation: 0
      });
      await mouse.toggle('left', false, delay);

      await moveTo({pos: cPos, fineTune: false, randomRange: 0});
      await sleep(random(delay[0], delay[1]));
    }
    const scrollCamera = async (direction, value) => { // config.aggroCheckCameraDistance
        if(config.arduino || config.streamMode) {
          await mouse.scroll(direction, value);
        } else {
          for(let step = 0; step < value; step++) {
            await nutjs.mouse.scroll(1, direction);
          }
        }
    };
    const turnAround = async () => {
      if(config.aggroCheckControlBy == "Mouse") {
        let cPos = mouse.getPos();
        await mouse.toggle('right', true, delay);
        await moveTo({pos: {x: cPos.x + 840, y: cPos.y}, randomRange: 0, fineTune: false, speed: config.aggroCheckMouseSpeed});
        await mouse.toggle('right', false, delay);
      } else {
        let step = 2000 / 2;
        let dir = 'right';
        await keyboard.toggleKey(dir, true);
        await sleep(step);
        await keyboard.toggleKey(dir, false);
      }
    }

    for(;state.status != `stop`;) {
      await sleep(aggroTestRun ? 0 : config.aggroCheckInterval * 1000);

      if(state.status == 'stop') {
        break;
      }

      if(findPlayer.state || state.status == 'move' || state.status == 'logout' || state.status == 'sleep') {
        continue;
      }

      if(!(await userHp.checkColor(getDataFrom)) || aggroTestRun) {
      await action(async () => {
        state.status = 'stop';

        let finish;
        aggroCheck.status = new Promise(function(resolve, reject) {
          finish = resolve;
        });

        if(tmBot.ctx) {
          tmBot.ctx.reply(`The bot is being attacked in Window: ${winNum}!`);
        }

        let attackFailed = false;
        if(config.aggroCheckDoAfterType == "Attack") { // config.aggroCheck.type == attack
          if(skills.length < 1) {
            return;
          }

          if(config.aggroCheckEquip) {
            await keyboard.sendKey(config.aggroCheckEquipKey, delay);
          }

          await lowerCamera(false);
          await scrollCamera(false, config.aggroCheckCameraDistance);

          if(config.aggroCheckTurnAround) {
            await turnAround();
          }


          if(config.reaction) {
            await sleep(random(config.reaction.from, config.reaction.to))
          }


          for(let i = 0, foundEnemy = null; i < 2 && !foundEnemy; i++) {

            let turnDirection; // config.aggroCheckRunAwayFirstTurnDir
            let turnTimer;

            if(i == 0) {
              turnDirection = 'left';
              turnTimer = createTimer(() => 500);
            }

            if(i == 1) {
              turnDirection = 'right';
              turnTimer = createTimer(() => 2000);
            }

            turnTimer.start();
            await keyboard.toggleKey(turnDirection, true);
            while(!turnTimer.isElapsed() && !foundEnemy) {
              let possibleEnemies = await findEnemy(createEnemyZone(0.025));
              if(possibleEnemies) {
                let turnTimeRemains = turnTimer.timeRemains();
                await keyboard.toggleKey(turnDirection, false); // stop rotation
                await keyboard.sendKey(config.aggroCheckTargetKey, delay); // target enemy
                await sleep(250); // Time to open hp
                if(await enemyHp.checkColor(getDataFrom)) { // if targtable
                  foundEnemy = true;
                  let rangeCondition = async () => await skills[0].attackRange.checkColor(getDataFrom); // range condition

                  await keyboard.toggleKey("up", true, delay);
                  while(!(await rangeCondition())) { // come up to target until it's in range of the first skill
                    let found = await findAndCenter(createEnemyZone());
                   }
                  await sleep(250); // delay to avoid blinking of the range indication when close to the enemy
                  await keyboard.toggleKey("up", false, delay);

                  let killingEnemyStartTime = Date.now();
                  let skillNumber = 0;

                  const deathCondition = async () => {
                    let enemyIsNotNearDeath = await enemyHp.checkColor(getDataFrom);
                    if(!enemyIsNotNearDeath) {
                      enemyIsNotNearDeath = !(await userHp.checkColor(getDataFrom)) // if enemy is near death, fight until in combat mode
                    }
                    return enemyIsNotNearDeath && (Date.now() - killingEnemyStartTime < 120000)
                  }


                  while(await deathCondition()) { // if the bot can't kill the target, or die within 2 minutes, something is wrong.
                      await findAndCenter(createEnemyZone());

                      let skill = skills[skillNumber % skills.length];

                      if(!(await skill.attackRange.checkColor(getDataFrom)) &&
                         !skill.rangeonly &&
                          skill.cooldownTimer.timeRemains() < ((skill.cooldown * 1000) * .8)) { //  come up to target if not in range of the skill. Do it only if there's less than 80% of skill cooldown time remain, to avoid UI animation of cooldown.
                          await keyboard.toggleKey("up", true);
                          while(!(await skill.attackRange.checkColor(getDataFrom))) {};
                          await keyboard.toggleKey("up", false);
                      }

                      if(!(skill.cooldownTimer.isElapsed())) {
                        continue;
                      } else {
                        skill.cooldownTimer.update();
                      }

                      if(skill.once) {
                        skills[skillNumber] = null;
                        skills = skills.filter(Boolean);
                      } else {
                        skillNumber++;
                      }

                      await skill.apply();

                      while(!skill.delayTimer.isElapsed() && await deathCondition()) { // center camera during cast/execution time
                        await findAndCenter(createEnemyZone()); // 0.2
                      }
                    }

                  if(!(await userHp.checkColor(getDataFrom))) {
                    if(tmBot.ctx) {
                      tmBot.ctx.reply(`The character is still in combat mode after ${120000 / 1000} sec., will try to run away in Window: ${winNum}!`);
                    }

                    await keyboard.toggleKey(turnDirection, true);
                    await sleep(1000);
                    await keyboard.toggleKey(turnDirection, false);
                    await runAway(config.aggroCheckRunTime * 1000);
                  }

                  if(await userHp.checkColor(getDataFrom)) {
                    if(tmBot.ctx) {
                      tmBot.ctx.reply(`The character is out of combat mode or dead in Window: ${winNum}!`);
                    }
                  }

                } else {
                  turnTimer.update(() => turnTimeRemains);
                  await keyboard.toggleKey(turnDirection, true);
                }
              }
            }
            await keyboard.toggleKey(turnDirection, false);
          }
        }

        if(config.aggroCheckDoAfterType == "Run Away") { // config.aggroCheck.type == runAway
          await runAway(config.aggroCheckRunTime * 1000);
        }

        finish();

        if(config.aggroCheckQuit) {
          workwindow.close();
        }

        }) // action end

      }
    }
  };
  aggroCheck.status = Promise.resolve();

  let lastMovementFrom;
  const castFishing = async (state) => {
    let timeSpentOnCastingStart = Date.now();
    await action(async () => {
      await keyboard.sendKey(settings.fishingKey, delay);
    });

    let timeSpentOnCasting = Date.now() - timeSpentOnCastingStart;

    if(settings.afkmode) await altTab();

    if(config.rngMove || config.findPlayer) {
      let lastDir = lastMovementFrom == 'rngMove' ? moveMemory.lastDir : config.findPlayerTurnDir;
        await sleep(350);
        for(let i = 0; i < 2 && await notificationZone.check("error"); i++) {
          if(lastDir == `left`) {
            await _rngMoveAction({delay: ((config.rngMoveRadiusMax * 2) / 360) * 500, value: 0, direction: 'right'}, true) // true -> nomovement
          } else {
            await _rngMoveAction({delay: ((config.rngMoveRadiusMax * 2) / 360) * 500, value: 0, direction: 'left'}, true) // true -> nomovement
          }

          if(lastMovementFrom != 'rngMove') {
            config.findPlayerTurnDir = config.findPlayerTurnDir == 'left' ? 'right' : 'left'; // switch to different direction for find player if run into shallow waters.
          }

          await sleep(random(3000, 4000));
          await action(async () => {
            await keyboard.sendKey(settings.fishingKey, delay);
          });
        }
    }

    if (state.status == "initial") {
      await sleep(250);
      if (!config.ignorePreliminary && await notificationZone.check("error")) {
        throw new Error(`Game error notification occured on casting fishing. Turn on "Ignore Preliminary Checks" in Advanced Settings to ignore this error.`);
      } else {
        state.status = "working";
      }
    }

    if(settings.checkLogic == `pixelmatch` && state.status != 'stop') {
      await sleep(2500, async () => {
        await hoverMouse();
      });
    } else {

      let castDelaySleepValue = config.streamMode && settings.multipleWindows ? random(config.castDelay.from, config.castDelay.to) : Math.max(0, random(config.castDelay.from, config.castDelay.to) - timeSpentOnCasting);
      await sleep(castDelaySleepValue, async () => {
        await hoverMouse();
      });
    }
  };

  const highlightBobber = async (pos, log) => {
    if (settings.checkLogic == `pixelmatch` ||
        settings.useInt ||
        settings.afkmode ||
        settings.multipleWindows ||
        settings.colorBobber == `Manual` ||
        !config.highlightPercent) {
        return pos;
    }

    if (config.reaction) {
      await sleep(random(config.reactionDelay.from, config.reactionDelay.to));
    }

    await action(async () => {
      let posToHighlight = {...pos};
      let randomRange = 5;
      let fineTune = {offset: 5, steps: [1, 5]};

      if(config.likeHumanFineTune && !config.streamMode) {
        let pastPost = generateMovePastPos(posToHighlight);
        await moveTo({pos: pastPost, randomRange, fineTune: null})
      }

      if(config.streamMode) { // to avoid cursor covering the found pixel
        if(settings.game == 'Retail') {
          posToHighlight.y = posToHighlight.y + (screenSize.height / 1080) * 5;
          posToHighlight.x = posToHighlight.x + (screenSize.height / 1080) * 5;
        } else if(settings.game == 'Classic' || settings.game == 'Cata Classic' ) {
          posToHighlight.y = posToHighlight.y + (screenSize.height / 1080) * 5;
          posToHighlight.x = posToHighlight.x + (screenSize.height / 1080) * 5;
          fineTune = {offset: 3, steps: [1, 3]};
          randomRange = 3;
        } else {
          posToHighlight.y = posToHighlight.y + (screenSize.height / 1080) * 5;
          posToHighlight.x = posToHighlight.x - (screenSize.height / 1080) * 5;
        }
      }

      await moveTo({ pos: posToHighlight, randomRange, fineTune });
    });

   await sleep(250) // some time for highlighting?
   return await findBobber(log, pos);
  };

  const findBobber = async (log, highlight) => {

    let cursorArea = []
    if(config.streamMode && config.streamDevice != 'Custom Server') {
      let cursorPos = mouse.getPos();
      cursorArea = cutOutNotification({
        x: cursorPos.x / screenSize.width,
        y: cursorPos.y / screenSize.height,
        width: 35 / screenSize.width,
        height: 35 / screenSize.height
      })
    }

    if(state.status == 'stop') {
      return;
    }

    if(settings.useInt && settings.soundDetection) {
      return true;
    }

    const pos = await fishingZone.findBobber([...findBobber.memory, ...cursorArea], log, highlight);
    return pos;
  };

  findBobber.memory = null;
  findBobber.maxAttempts = config.maxAttempts;

  const hoverMouse = async (chance = (config.likeHumanHover / 100)) => {
    if(!config.likeHumanHover || config.arduino || settings.multipleWindows || settings.afkmode) { // config.streamMode
      return;
    }

    let cPos = mouse.getPos();
    if(Math.random() < (chance / 2)) {
      await moveTo({pos: cPos});
      return true;
    }
  }

  const checkBobber = async (pos, state, log) => {
    checkBobberTimer.update();
    const startTime = Date.now();
    const missOnPurpose = random(0, 100) < missOnPurposeValue;
    if(missOnPurpose) {
      missOnPurposeTimer.update();
    }

    if(state.status == `working`) {
      state.status = `checking`;
    }

  if(settings.soundDetection) {
    config.checkingDelay = 0;
  }

    while (state.status == "checking") {
      if (checkBobberTimer.isElapsed()) {
        switch(config.maxFishTimeAfter) {
          case `stop`: {
            throw new Error(
              `Something is wrong. The bot had been checking the bobber for more than ${config.maxFishTime} ms. The server might be down or your character is dead.`
            );
          }
          case `recast`: {
            if(state.status != 'stop') {
              state.status = `working`;
            }
            log.warn('Missed by recasting.');
            return false;
          }
        }
      }

      if(missOnPurpose && missOnPurposeTimer.isElapsed()) {
        pos.missedIntentionally = true;
        return pos;
      }

if (settings.soundDetection) {
  let caught = await new Promise((resolve, reject) => {
    ipcMain.once(`get-audio-result${winNum}`, (event, result) => {
      // resolve(waveform.filter((n) => n != 128 && n != 127).length > Number(settings.soundDetectionRange) ? false : false);
      resolve(result)
    });

    BrowserWindow.getAllWindows()[0].webContents.send(`get-audio${winNum}`,
     settings.soundDetectionRange,
     config.maxFishTime,
     missOnPurpose,
     config.missOnPurposeRandomDelay,
     pos);
  });

  if(state.status != 'checking') {
    return;
  }

  return caught;

} else if(settings.checkLogic == `pixelmatch`) {
  if(await fishingZone.checkPixelMatch(pos, startTime)) {
    return pos;
  };
} else if(settings.game == `Retail` || settings.bobberColor == `Manual`) {
   if(!(await fishingZone.checkBobberPrint(pos, log))) {
     return pos;
   }
} else if (settings.game == `Vanilla (splash)`) {
  if(await fishingZone.checkBobberPrintSplash(pos)) {
    return pos;
    }
  } else {
  if (!(await fishingZone.isBobber(pos))) {
    const newPos = settings.autoTh ? await fishingZone.checkBelow(pos) : await fishingZone.checkAroundBobber(pos);
    if (!newPos) {
      return pos;
    } else {
      pos = newPos;
    }
  }

    if(settings.autoTh) {
      pos = await fishingZone.checkAbove(pos);
    }

  }
    if(!(await hoverMouse())) {
      await sleep(config.checkingDelay);
    }
}

};

  const pickLoot = async (log) => {
    let cursorPos = config.atMouse || !lootWindow.cursorPos ? mouse.getPos() : lootWindow.cursorPos;
    if (cursorPos.y - lootWindow.upperLimit < 0) {
      cursorPos.y = lootWindow.upperLimit;
    }

    await sleep(500); // open loot window

    if (config.reaction) {
      await sleep(random(config.reactionDelay.from, config.reactionDelay.to)); // react to opening loot win
    }

    if(settings.game != `Retail`) {
      let pos = {
        x: cursorPos.x + random(-(lootWindow.width * .25), lootWindow.width * .25),
        y: cursorPos.y - lootWindow.toItemY - 10,
      };
      await moveTo({ pos, randomRange: 5 });
    }

    if (config.reaction) {
      await sleep(random(config.reactionDelay.from, config.reactionDelay.to)); // hint disappearing and smooth text analyzing time with random value
    } else {
      await sleep(150); // hint dissappearing
    }

    /*
    if(lootWindow.exitButton) {
      for (let times = 0; times <= 30; times++) {
        // Wait for 2 seconds max until loot appears
        await sleep(100);
        if (await lootExitZone.isLootOpened(cursorPos)) {
          break;
        }

        if (times == 30) {
          return [];
        }
      }
    }
    */

    const lootWindowDim = {
      x: cursorPos.x + lootWindow.toItemX,
      y: cursorPos.y - lootWindow.toItemY,
      width: lootWindow.width,
      height: lootWindow.height,
    };

    const lootScale = screenSize.width <= 1536 ? 3 : screenSize.width <= 1920 ? 2 : 1;
    //let recognizedWords = await readTextFrom(await getDataFrom(lootWindowDim), lootScale);
    //let items = sortWordsByItem(recognizedWords, lootWindow, settings.game == `Retail`);

    let increaseForWidth = lootWindowDim.width * 0.1;
    let increaseForHeight = lootWindowDim.height * 0.1;
    let largenLootWindowDim = {
      x: lootWindowDim.x - increaseForWidth,
      y: lootWindowDim.y - increaseForHeight,
      width: lootWindowDim.width + increaseForWidth * 2,
      height: lootWindowDim.height + increaseForHeight * 2,
    }

    let recognizedWords2 = await readTextFrom2(await getDataFrom(largenLootWindowDim), lootScale);
    let items2 = sortWordsByItem2(recognizedWords2, whitelist.map((filterItem) => filterItem.split(' ')), config.filterConfidence);

    log.err(`Found Items: ${items2.toString()}`);

    let pickedItems = [];
    for(const {pos, name} of items2) {
      await moveTo({
        pos: {
          x: cursorPos.x,
          y: largenLootWindowDim.y + (pos / lootScale),
        },
        randomRange: 5,
      });

      await mouse.toggle("right", true, delay);
      await mouse.toggle("right", false, delay);
      pickedItems.push(name);
    }

    for(;state.status != 'stop';) {
      let lootZone = createLootZone({
        getDataFrom,
        zone: {
          x: lootWindowDim.x,
          y: lootWindowDim.y,
          width: lootWindow.width,
          height: lootWindow.height,
        },
      });
      let blueGreenPurple = await lootZone.findItems("blue", "green", "purple");
      if(blueGreenPurple) {
        await moveTo({
          pos: {
            x: cursorPos.x,
            y: lootWindowDim.y + blueGreenPurple.y,
          },
          randomRange: 5,
        });

        await mouse.toggle("right", true, delay);
        await mouse.toggle("right", false, delay);

        if(config.confirmSoulbound) {
          if (config.reaction && !config.streamMode) {
            await sleep(random(config.reactionDelay.from, config.reactionDelay.to));
          } else {
            await sleep(random(500, 1000)) // wait for the window to appear
          }
          const needsConfirm = await checkRedButton(confirmationWindow);
          if(needsConfirm) {
            await action(async () => {
              await mouse.toggle('left', true, delay);
              await mouse.toggle('left', false, delay);
            });
            if(tmBot.ctx) {
              tmBot.ctx.reply(`Confirmed Souldbound item in the window ${winNum}!`);
              tmBot.ctx.replyWithPhoto({source: await chatZone.getImage()});
            }
          }
        }
        pickedItems.push('bgp_item');
      } else {
        break; // if there's no blue/green/purple item - break
      }
    }

    if(settings.useInt && itemsPicked.length > 1) {
      await moveTo({pos: cursorPos, randomRange: 5});
    }

    if(settings.game != `Retail` && settings.game != `Cata Classic` && settings.game != `Classic`) {
      await sleep(350); // disappearing loot window delay
      if (await lootExitZone.isLootOpened(cursorPos)) {
        if (config.reaction) {
          await sleep(random(config.reactionDelay.from, config.reactionDelay.to));
        }

        if((config.closeLoot == `mouse` || config.closeLoot == `mouse+esc`) && lootWindow.exitButton) {
          if(config.closeLoot == `mouse`) {
            await moveTo({ pos: {
              x: cursorPos.x + lootWindow.exitButton.x,
              y: cursorPos.y - lootWindow.exitButton.y
            }, randomRange: 2});
            await mouse.toggle("left", true, delay);
            await mouse.toggle("left", false, delay);

            if(settings.useInt) {
              await moveTo({ pos: cursorPos, randomRange: 2 });
            }
          }

          if(config.closeLoot == `mouse+esc`) {
            if(random(0, 100) > 50) {
              await keyboard.sendKey("escape", delay);
            } else {
              await moveTo({ pos: {
                x: cursorPos.x + lootWindow.exitButton.x,
                y: cursorPos.y - lootWindow.exitButton.y
              }, randomRange: 2});
              await mouse.toggle("left", true, delay);
              await mouse.toggle("left", false, delay);

              if(settings.useInt) {
                await moveTo({ pos: cursorPos, randomRange: 2 });
              }
            }
          }
        } else {
            await keyboard.sendKey("escape", delay);
        }
      }
    }

    /* OLD FILTER CODE */
    /*
    let itemPos = 0;
    let itemsPicked = [];
    for (let item of items) {
      let isInList = whitelist.find((word) => percentComparison(word, item) > config.filterConfidence); // 90

      if(config.filterType == `blacklist`) {
        if(isInList) {
          isInList = false;
        } else {
          isInList = true;
        }
      }

      if (!isInList && config.whiteListBlueGreen) {
        let lootZone = createLootZone({
          getDataFrom,
          zone: {
            x: lootWindowDim.x,
            y: lootWindowDim.y + itemPos,
            width: lootWindow.width,
            height: lootWindow.itemHeight,
          },
        });

        isInList = await lootZone.findItems("blue", "green", "purple");
      }

      if (isInList) {
          await moveTo({
            pos: {
              x: cursorPos.x,
              y: cursorPos.y + itemPos,
            },
            randomRange: 5,
          });

        if (config.reaction && random(0, 10) > 8) { // sometimes we think
          await sleep(random(config.reactionDelay.from, config.reactionDelay.to));
        } else {
          await sleep(random(50, 150));
        }

        await mouse.toggle("right", true, delay);
        await mouse.toggle("right", false, delay);

        if(typeof isInList == `boolean` && config.confirmSoulbound) {
          if (config.reaction && !config.streamMode) {
            await sleep(random(config.reactionDelay.from, config.reactionDelay.to));
          } else {
            await sleep(random(500, 1000)) // wait for the window to appear
          }
          const needsConfirm = await checkRedButton(confirmationWindow);
          if(needsConfirm) {
            await action(async () => {
              await mouse.toggle('left', true, delay);
              await mouse.toggle('left', false, delay);
            });
            if(tmBot.ctx) {
              tmBot.ctx.reply(`Confirmed Souldbound item in the window ${winNum}!`);
              tmBot.ctx.replyWithPhoto({source: await chatZone.getImage()});
            }
          }
        }

        itemsPicked.push(item);
      }

      itemPos += settings.game == `Retail` ? lootWindow.itemHeight + lootWindow.itemHeightAdd : lootWindow.itemHeight;
    }


    if(settings.useInt && itemsPicked.length > 1) {
      await moveTo({pos: cursorPos, randomRange: 5});
    }

    await sleep(350); // disappearing loot window delay
    if (settings.game == 'Leg' ? items.length != itemsPicked.length : await lootExitZone.isLootOpened(cursorPos)) {

      if (config.reaction) {
        await sleep(random(config.reactionDelay.from, config.reactionDelay.to));
      }

      if((config.closeLoot == `mouse` || config.closeLoot == `mouse+esc`) && lootWindow.exitButton) {
        if(config.closeLoot == `mouse`) {
          await moveTo({ pos: {
            x: cursorPos.x + lootWindow.exitButton.x,
            y: cursorPos.y - lootWindow.exitButton.y
          }, randomRange: 2});
          await mouse.toggle("left", true, delay);
          await mouse.toggle("left", false, delay);

          if(settings.useInt) {
            await moveTo({ pos: cursorPos, randomRange: 2 });
          }
        }

        if(config.closeLoot == `mouse+esc`) {
          if(random(0, 100) > 50) {
            await keyboard.sendKey("escape", delay);
          } else {
            await moveTo({ pos: {
              x: cursorPos.x + lootWindow.exitButton.x,
              y: cursorPos.y - lootWindow.exitButton.y
            }, randomRange: 2});
            await mouse.toggle("left", true, delay);
            await mouse.toggle("left", false, delay);

            if(settings.useInt) {
              await moveTo({ pos: cursorPos, randomRange: 2 });
            }
          }
        }
      } else {
          await keyboard.sendKey("escape", delay);
      }
    }
  */

    return pickedItems; // remove pos
  };

  const hookBobber = async (pos, log) => {
    if (config.reaction) {
      await sleep(random(config.reactionDelay.from, config.reactionDelay.to));
    }
    let caught = false;

    if(!pos) { // in case recasting if it's stated in maxFishTimeAfter
      return caught;
    }

    await action(async () => {
      if(settings.useInt) {
        await keyboard.toggleKey(settings.intKey, true, delay);
        await keyboard.toggleKey(settings.intKey, false, delay);
      } else {
        if(!(config.streamMode || (config.arduino && config.arduinoType == 'pico')))
          await moveTo({ pos, randomRange: 5});

        if (config.shiftClick) {
          await keyboard.toggleKey("shift", true, delay);
          if(config.streamMode || (config.arduino && config.arduinoType == 'pico')) {
            await moveTo({ pos, randomRange: 5, withClick: true});
            // await mouse.click(config.catchFishButton, delay);
          } else {
            await mouse.toggle(config.catchFishButton, true, delay);
            await mouse.toggle(config.catchFishButton, false, delay);
          }

          await keyboard.toggleKey("shift", false, delay);
        } else {
          if(config.streamMode || (config.arduino && config.arduinoType == 'pico')) {
            await moveTo({ pos, randomRange: 5, withClick: true});
            // await mouse.click(config.catchFishButton, delay);
          } else {
            await mouse.toggle(config.catchFishButton, true, delay);
            await mouse.toggle(config.catchFishButton, false, delay);
          }
        }
      }

    if(config.streamMode) {
      await sleep(350);
    } else {
      await sleep(250);
    }

    if (!(await notificationZone.check("warning")) && !pos.missedIntentionally) {
      caught = true;
      if (config.whitelist) {
          let itemsPicked = await pickLoot(log);
            if(itemsPicked.length > 0) {
              caught = itemsPicked.toString();
            }
      }
    }
    });
    if(!config.whitelist) {
      await sleep(config.closeLootDelay);
    } else {
      await sleep(150);
    }

    if (config.sleepAfterHook && random(0, 100) < config.sleepAfterHookChance) {
      await sleep(random(config.afterHookDelay.from, config.afterHookDelay.to), async () => {
        await hoverMouse();
      });
    }
    return caught;
  };

  const checkWhisper = async (onStop, wins) => {
     if(!config.detectWhisper) return;
     let whispMessage = await chatZone.checkNewMessages();
     if(whispMessage) {
       if(config.openai && config.openaikey && whispMessage.response) {
         await action(async () => {
           await keyboard.sendKey('enter', delay);
           const commandToUse = whispMessage.type == 'whisper' ? '/r' : '/say';
           await keyboard.printText(`${commandToUse} ${whispMessage.response}`, delay);
           await keyboard.sendKey('enter', delay);
         })
          if (config.reaction) {
          await sleep(random(config.reactionDelay.from, config.reactionDelay.to));
        }
       }

       if(tmBot.ctx) {
         tmBot.ctx.reply(`Message in the window ${winNum}:`);
         tmBot.ctx.sendChatAction(`upload_photo`);
         tmBot.ctx.replyWithPhoto({source: await chatZone.getImage()});
       }

      if(config.closeAtWhisper) {

        if(config.streamMode) {
          await action(async () => {
            /*
            await keyboard.toggleKey('alt', true, delay);
            await keyboard.sendKey('f4', delay);
            await keyboard.toggleKey('alt', false, delay);
            */
            await keyboard.sendKey('enter', delay);
            await keyboard.printText('/logout', delay);
            await keyboard.sendKey('enter', delay);
          });
        } else {
          workwindow.close();
        }

        let isLastWin = wins.filter(win => win.state.status != `stop`).length == 1;

        if(isLastWin) {
          if(config.quitAtWhisper) {

            if(config.timerShutDown) {
              await action(async () => {
                await inCaseOfShutDown();
              });
            }

            onStop();
            app.quit();
            return;
          }

          onStop();
        }

        state.status = `stop`;
      }
    }
  };

  const replyToChat = async () => {
    if(chatMsgs.length > 0) {
      await action(async () => {
        for(const message of chatMsgs) {
          await keyboard.toggleKey(`enter`, true, delay);
          await keyboard.toggleKey(`enter`, false, delay);
          await keyboard.printText(message, delay);
          await keyboard.toggleKey(`enter`, true, delay);
          await keyboard.toggleKey(`enter`, false, delay);
        }
        await sleep(500);
        chatMsgs = [];
      })
    }
  }

  const dx12Case = async () => {
    if(!settings.multipleWindows && !settings.afkmode && !config.streamMode) {
        await actionOnce(() => {});
    }
  }

  const dynamicThreshold = () => {
    settings.threshold = settings.threshold - config.dynamicThresholdValue;
    fishingZone = createFishingZone(getDataFromFishingZone, Zone.from(screenSize).toRel(config.relZone), screenSize, settings, config);
  }

  dynamicThreshold.on = config.dynamicThreshold && !settings.autoTh;
  dynamicThreshold.limit = () => settings.threshold < 20;

  const keyMemory = {
    a: 0,
    w: 0,
    s: 0,
    d: 0
  };

  let moveMemory = {
    value: 0,
    lastDir: null
  };

  const getRandomPos = () => {
    let maxRadius = ((config.rngMoveRadiusMax / 2)) / 360 * (config.streamMode || (config.arduino && config.arduinoType == 'pico') ? 1600 : 500); // pico
    let minRadius = maxRadius * .25;

    let x = random(0, 100) > (50 + 50 * (moveMemory.value / maxRadius) ) ? random(-maxRadius, -minRadius) : random(minRadius, maxRadius);

    if(Math.abs(x + moveMemory.value) > maxRadius) { //maxRadius
      x = -x;
    }

    return {delay: Math.abs(x), value: x,  direction: x < 0 ? 'left' : 'right'};
  }


  const getRandomKey = () => {
    let maxStep = config.rngMoveDirLengthMax * 50; // 1 - 10 // 50 100 150 200;
    let minStep = maxStep * .25;

    let keys = `awsd`;
    let key = keys.split(``).find(key => {
      if(random(0, maxStep * 2) > keyMemory[key] + maxStep) { // the smallest value gets priority
        return key
      }
    }) || keys.split(``).reduce((a, b) => keyMemory[a] < keyMemory[b] ? a : b);
    let value = random(minStep, maxStep);

    switch(key) {
      case `a`: {
        if(keyMemory[key] + value > maxStep) {
          key = `d`;
          keyMemory[`a`] -= value;
        } else {
          keyMemory[`d`] -= value;
        }
        break;
      }

      case `d`: {
        if(keyMemory[key] + value > maxStep) {
          key = `a`;
          keyMemory[`d`] -= value;
        } else {
          keyMemory[`a`] -= value;
        }
        break;
      }

      case `w`: {
        if(keyMemory[key] + value > maxStep) {
          key = `s`;
          keyMemory[`w`] -= value;
        } else {
          keyMemory[`s`] -= value;
        }
        break;
      }

      case `s`: {
        if(keyMemory[key] + value > maxStep) {
          key = `w`;
          keyMemory[`s`] -= value;
        } else {
          keyMemory[`w`] -= value;
        }
      }
    }

    keyMemory[key] += value;

    if(key == `s`) {
      value *= 1.75;
    }

    return {key, value};
  }

  const _rngMoveAction = async (rngPos = getRandomPos(), nomove) => {
    if(config.reaction) {
      await sleep(random(config.reaction.from, config.reaction.to))
    }

    if(!nomove && config.rngMoveKeys && (Math.abs(moveMemory.value) < ((config.rngMoveRadiusMax * .25) / 360 * 500))) { // Use keys only if we face within 10(20 combined) degrees from the center
      let rngKey = getRandomKey();

      await mouse.toggle(`right`, true, delay);
      if(config.streamMode || (config.arduino && config.arduinoType == 'pico')) {
        await keyboard.sendKey(rngKey.key, rngKey.value);
        await sleep(random(delay[0], delay[1]))
      } else {
        await keyboard.toggleKey(rngKey.key, true, rngKey.value);
        await keyboard.toggleKey(rngKey.key, false, delay);
      }


      await mouse.toggle(`right`, false, delay);
    }

    if(config.reaction) {
      await sleep(random(config.reaction.from, config.reaction.to))
    }

    if(config.streamMode || (config.arduino && config.arduinoType == 'pico')) {
      await mouse.toggle('right', true, delay);
      let cPos = mouse.getPos();
      await moveTo({pos: {
        x: cPos.x + (rngPos.direction == 'left' ? -rngPos.delay : rngPos.delay),
        y: cPos.y
      }, fineTune: false, norec: true});
      await mouse.toggle('right', false, delay);
      /*
      await keyboard.sendKey(rngPos.direction, rngPos.delay);
      await sleep(random(delay[0], delay[1]))
      */
    } else {
      await keyboard.toggleKey(rngPos.direction, true, rngPos.delay);
      await keyboard.toggleKey(rngPos.direction, false, delay);
    }

    moveMemory.value += rngPos.value;
    moveMemory.lastDir = rngPos.direction;
  }

  const runRngMove = async () => {
    await action(async function rngMove() {
      await _rngMoveAction();
      for(let i = 0; i < 3; i++) {
        if(Math.random() > .95) await _rngMoveAction();
      }
    })

    lastMovementFrom = 'rngMove';
  };

  runRngMove.on = config.rngMove;
  runRngMove.timer = createTimer(() => random(config.rngMoveTimer.from * 1000 * 60,
                                              config.rngMoveTimer.to * 1000 * 60));


  const doAfterTimer = async (onError, wins, stats) => {
    if(config.afterTimer == `HS` || config.afterTimer == `HS + Quit`) {
      await action(async () => {
        await keyboard.sendKey(config.hsKey, delay);
      }, true);
      await sleep(config.hsKeyDelay);
    }


    let isLastWin = wins.filter(win => win.state.status != `stop`).length == 1;

    if(config.afterTimer == `HS + Quit` || config.afterTimer == `Quit`) {

      if (config.streamMode) {
        await action(async () => {
          /*
          await keyboard.toggleKey("alt", true, delay);
          await keyboard.sendKey("f4", delay);
          await keyboard.toggleKey("alt", false, delay);
          */
          await keyboard.sendKey('enter', delay);
          await keyboard.printText('/logout', delay);
          await keyboard.sendKey('enter', delay);
        });
      } else {
        workwindow.close();
      }

      if(isLastWin) {
        if(config.timerShutDown) {
          await action(async () => {
            await inCaseOfShutDown();
          })
        }
        onError();
        app.quit();
        return;
      }
    }

    if(isLastWin) {
      onError();
    }
    state.status = 'stop';
  }
  doAfterTimer.on = config.timer;
  doAfterTimer.timer = createTimer(() => config.timerTime * 1000 * 60)

  const applyFatigue = () => {
    let rate = config.applyFatigueRate / 100;
    delay = [delay[0] + delay[0] * rate, delay[1] + delay[1] * rate]
    config.mouseMoveSpeed = config.mouseMoveSpeed - config.mouseMoveSpeed * rate
    config.mouseCurvatureStrength = config.mouseCurvatureStrength + config.mouseCurvatureStrength * rate;
    config.reactionDelay.from = config.reactionDelay.from + config.reactionDelay.from * rate;
    config.reactionDelay.to = config.reactionDelay.to + config.reactionDelay.to * rate;
    config.randomSleepDelay.from = config.randomSleepDelay.from + config.randomSleepDelay.from * rate;
    config.randomSleepDelay.to = config.randomSleepDelay.to + config.randomSleepDelay.to * rate;
    config.afterHookDelay.from = config.afterHookDelay.from + config.afterHookDelay.from * rate;
    config.afterHookDelay.to = config.afterHookDelay.to + config.afterHookDelay.to * rate;
    }
  applyFatigue.on = config.applyFatigue
  applyFatigue.timer = createTimer(() => random(config.applyFatigueEvery.from, config.applyFatigueEvery.to) * 1000 * 60)

  const checkConfirm = async () => {
    if(config.checkConfirm && !config.whitelist) {
      await sleep(350) // wait for the window to appear
      const needsConfirm = await checkRedButton(confirmationWindow);
      if(needsConfirm) {
        await action(async () => {
          await mouse.toggle('left', true, delay);
          await mouse.toggle('left', false, delay);
        });
      }
    }
  }

  return {
    findPlayer,
    checkConfirm,
    applyFatigue,
    doAfterTimer,
    runRngMove,
    dynamicThreshold,
    logOut,
    preliminaryChecks,
    findAllBobberColors,
    randomSleep,
    applyMammoth,
    applyLures,
    spares,
    castFishing,
    findBobber,
    highlightBobber,
    checkBobber,
    hookBobber,
    checkWhisper,
    replyToChat,
    dx12Case,
    checkChanges,
    aggroCheck,
    deathCheck,
    regOnError
  };
};

module.exports = createBot;
