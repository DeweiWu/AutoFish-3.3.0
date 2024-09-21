const sleep = (time) => {
  return new Promise((resolve) => {
    setTimeout(resolve, time);
  });
};

const random = (from, to) => {
  return from + Math.random() * (to - from);
};

const runBot = async ({ bot, log, state, stats }, onError, wins, aggroTestRun) => {
  const {
    deathCheck,
    findPlayer,
    dynamicThreshold,
    logOut,
    preliminaryChecks,
    findAllBobberColors,
    randomSleep,
    applyLures,
    castFishing,
    findBobber,
    highlightBobber,
    checkBobber,
    hookBobber,
    checkWhisper,
    replyToChat,
    spares,
    applyMammoth,
    dx12Case,
    runRngMove,
    detectSens,
    doAfterTimer,
    checkChanges,
    aggroCheck,
    applyFatigue,
    checkConfirm,
    regOnError,
    streamModeInitialMouse
  } = bot;

  regOnError.stopBots = () => {
    onError();
  }

  await streamModeInitialMouse();
  checkChanges(onError, log);
  deathCheck(wins, onError);
  aggroCheck(onError, state, aggroTestRun, wins);
  findPlayer.frontCheck(state, log, onError);

  let failedCast = false;
  let attempts = 0;
  do {
    await dx12Case();
    await aggroCheck.status;
    if (state.status == "initial") {
      log.send(`Preliminary checks...`);
      await preliminaryChecks(log);
      log.ok(`Everything is fine!`);

      if(applyFatigue.on) {
        applyFatigue.timer.start();
      }

      if(randomSleep.on) {
        randomSleep.timer.start();
      }

      if(applyMammoth.on) {
        applyMammoth.timer.start();
      }

      if(logOut.on) {
        logOut.timer.start();
      }

      if(runRngMove.on) {
        runRngMove.timer.start();
      }

      if(doAfterTimer.on) {
        doAfterTimer.timer.start();
      }

      if(findPlayer.on) {
        findPlayer.timer.start();
      }
    }

    if(findPlayer.on && findPlayer.timer.isElapsed()) {
      if(state.status == `stop`) return;
      await findPlayer(state, log, onError);
      findPlayer.timer.update();
    }

    if(state.status == `sleep`) {
      checkChanges.block(true);
      log.send(`Sleeping...`);

      await sleep(state.sleepTime);
      checkChanges.unblock(true);
      if(state.status == `stop`) {
        return
      } else {
        state.sleepTime = null;
        state.status = `working`;
      }
    }

    if(state.status == `logout`) {
      log.send(`Logging out...`)

      checkChanges.block(true);
      await logOut(state);
      /*
      log.send(`Sleeping... for ${state.sleepTime}`)
      await sleep(state.sleepTime ? state.sleepTime : 0);
      */
      checkChanges.unblock(true);

      if(state.status == 'stop') {
        return;
      } else {
        state.status = `working`;
      }
      log.send(`Logged back!`);
    }

    if(state.status == `move`) {
      log.send("Random movement...")
      checkChanges.block(true);
      await runRngMove();

      log.send(`Sleeping... for ${state.sleepTime}`)
      await sleep(state.sleepTime ? state.sleepTime : 0);
      checkChanges.unblock(true);
      if(state.status == 'stop') {
        return;
      } else {
        state.status = `working`;
      }
    }

    if(doAfterTimer.on && state.status == "working" && doAfterTimer.timer.isElapsed()) {
      await doAfterTimer(onError, wins, stats);
    }

    await replyToChat();
    await checkWhisper();

    if(logOut.on && logOut.timer.isElapsed()) {
      log.send(`Logging out...`)

      checkChanges.block();
      await logOut(state);
      checkChanges.unblock();

      if(state.status == 'stop') {
        return;
      }
      log.send(`Logged back!`);
      logOut.timer.update();
    }

    if(applyFatigue.on && applyFatigue.timer.isElapsed()) {
      log.send(`Applying fatigue...`);
      applyFatigue();
      applyFatigue.timer.update();
    }

    if (randomSleep.on && randomSleep.timer.isElapsed()) {
      log.send(`Sleeping...`);
      await randomSleep();
      if(state.status == 'stop') {
        return;
      }
      randomSleep.timer.update();
    }

    let checkSpares = spares.filter(spare => spare.timer.isElapsed());
    if(checkSpares.length > 0) {
      log.send(`Applying spares...`);
      for(const elapsedSpare of checkSpares) {
        elapsedSpare.timer.update()
        checkChanges.block();
        await elapsedSpare();
        checkChanges.unblock();
      }
    }

    if (applyLures.on && applyLures.timer.isElapsed()) {
      log.send(`Applying lures...`);
      checkChanges.block()
      await applyLures();
      checkChanges.unblock();
      applyLures.timer.update();
    }

    if(applyMammoth.on && applyMammoth.timer.isElapsed()) {
      log.send(`Applying mammoth...`);
      checkChanges.block();
      await applyMammoth();
      checkChanges.unblock();
      applyMammoth.timer.update();
    }

    findBobber.memory = await findAllBobberColors();

    if(failedCast) {
      let randomFailed = random(500, 2500);
      log.warn(`Sleeping for ${Math.floor(randomFailed)} ms`);
      await sleep(randomFailed);
    }

    log.send(`Casting fishing...`);
    checkChanges.block()
    await castFishing(state);
    checkChanges.unblock();

    log.send(`Looking for the bobber...`);
    let bobber = await findBobber(log);

    if(bobber) {
      bobber = await highlightBobber(bobber, log);
    }

    if (bobber) {
      failedCast = false;
      log.ok(`Found the bobber!`);
      attempts = 0;
    } else {
      if(state.status == 'stop') {
        return;
      }

      failedCast = true;
      stats.confused++;
      log.err(`Can't find the bobber!`);
      if (++attempts == findBobber.maxAttempts) {
        if(dynamicThreshold.on && !dynamicThreshold.limit()) {
          dynamicThreshold();
          attempts = 0;
        } else {
          throw new Error(
            `Have tried ${findBobber.maxAttempts} attempts to find the bobber and failed!`
          );
        }
      }

      if(runRngMove.on && runRngMove.timer.isElapsed()) {
        checkChanges.block();
        await runRngMove();
        checkChanges.unblock();
        runRngMove.timer.update();
      }

      continue;
    }

    log.send(`Checking the hook...`);
    if ((bobber = await checkBobber(bobber, state, log))) {

      if(state.status != `stop`) state.status = `working`;

      checkChanges.block();
      let isHooked = await hookBobber(bobber);
      checkChanges.unblock();

      if(bobber.missedIntentionally) {
        stats.misspurpose++;
        log.warn(`Missed the fish on purpose!`);
        continue;
      }

      if (isHooked) {
        stats.caught++;
        log.ok(`Caught ${typeof isHooked == `boolean` ? `the fish!` : isHooked}`);

        await checkConfirm();

        if(runRngMove.on && runRngMove.timer.isElapsed()) {
          checkChanges.block();
          await runRngMove();
          checkChanges.unblock();
          runRngMove.timer.update();
        }

        continue;
      }
    }

    if (state.status == "working") {
      stats.miss++;
      log.warn(`Missed the fish!`);
      if(runRngMove.on && runRngMove.timer.isElapsed()) {
        checkChanges.block();
        await runRngMove();
        checkChanges.unblock();
        runRngMove.timer.update();
      }
    }
  } while (state.status != "stop");
};

module.exports = runBot;
