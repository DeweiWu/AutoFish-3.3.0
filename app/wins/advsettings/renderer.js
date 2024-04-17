const { ipcRenderer, shell } = require("electron");
const elt = require("../../ui/utils/elt.js");
const wrapInLabel = require("../../ui/utils/wrapInLabel.js");
const { SerialPort } = require(`serialport`);
const keySupport = require("./../../utils/keySupport.js");

const convertValue = (node) => {
  let value = node.value;
  if (node.type == "checkbox") {
    value = node.checked;
  }

  if (node.type == "number" || node.type == "range") {
    value = Number(node.value) || 0;
  }

  return value;
};

const renderCheckConfirm = ({checkConfirm, whitelist}) => elt('input', {type: `checkbox`, disabled: whitelist, checked: checkConfirm, name: `checkConfirm`});

const renderHideWin = ({hideWin}) => elt(`input`, {type: `checkbox`, checked: hideWin, name: `hideWin`});

const renderConfirmLures = ({confirmLures = false, lures}) => elt(`input`, {type: `checkbox`, disabled: !lures, checked: confirmLures, name: `confirmLures`});
const renderConfirmSpares = ({confirmSpares = false}) => elt(`input`, {type: `checkbox`, checked: confirmSpares, name: `confirmSpares`});

const renderDelay = ({delay}) => {
  return elt(`div`, {"data-collection": `delay`}, elt(`span`, {className: `option_text`}, `from:`),
     elt('input', {type: `number`, name: `from`, value: delay.from}), elt(`span`, {className: `option_text`}, `to:`),
     elt('input', {type: `number`, name: `to`, value: delay.to}));
};

const renderColorSwitchOn = ({colorSwitchOn}) => elt('input', {type: `checkbox`, checked: colorSwitchOn, name: "colorSwitchOn"});

const renderStartByFishingKey = ({startByFishingKey = false}) => {
  if(startByFishingKey) {
    ipcRenderer.send('reg-start-by-fishing-key');
  } else {
    ipcRenderer.send('unreg-start-by-fishing-key');
  }
  return elt('input', {type: 'checkbox', onchange() {
    if(!startByFishingKey) {
      ipcRenderer.send('start-by-fishing-key-warn')
    }
  }, checked: startByFishingKey, name: "startByFishingKey"});
}

const renderHighlightPercent = ({highlightPercent}) => {
  const winRange = elt(`input`, {type: `number`, value: highlightPercent, name: "highlightPercent"})
  const range = elt('input', {type: `range`, max: 100, value: highlightPercent, oninput: function() {winRange.value = this.value}, name: "highlightPercent"});
  return elt(`div`, null, range, winRange);
};

const renderFindBobberDirection = ({findBobberDirection, game}) => {
  return elt(`select`, {name: `findBobberDirection`, disabled: game == "Vanilla (splash)"}, ...([`normal`, `reverse`, `center`].map(dir => elt(`option`, {value: dir, selected: findBobberDirection == dir}, dir.slice(0, 1).toUpperCase() + dir.slice(1)))))
}

const renderCloseLootDelay = ({closeLootDelay}) => {
  return elt('input', {type: `number`, name: `closeLootDelay`, value: closeLootDelay});
};

const renderIgnorePreliminary = ({ignorePreliminary}) => {
  return elt(`input`, {type: `checkbox`, checked: ignorePreliminary, name: `ignorePreliminary`});
};

const renderArduino = ({arduino}) => {
    return elt(`input`, {type: `checkbox`, checked: arduino, name: `arduino`});
};

const renderArduinoPort = ({arduino, arduinoPort}) => {
    let select = elt(`select`, {disabled: !arduino, className: `arduino_select`, name: `arduinoPort`});
    SerialPort.list()
    .then((list) => list.forEach((port) => select.append(elt(`option`, {selected: arduinoPort == port.path, value: port.path}, port.friendlyName))));
    return elt(`div`, null, select, elt(`input`, {type: `button`, disabled: !arduino, className: `${!arduino ? `disabledButton` : ``}`, value: `Connect`, id:`arduino`}));
};

const renderArduinoRate = ({arduino, arduinoRate}) => {
  return elt(`select`, {disabled: !arduino, className: `arduino_rate`, name: `arduinoRate`}, ...[9600, 14400, 19200, 38400, 57600, 115200].map((rate) => elt(`option`, {selected: rate == arduinoRate}, `${rate}`)))
}

const renderSplashColor = ({splashColor}) => {
let min = 100;
let max = 255;
if (splashColor < min) splashColor = min;
if (splashColor > max) splashColor = max;

  let splashColorWin = elt(`input`, {type: `number`, name: `splashColor`, value: splashColor });
  return elt(`div`, null, elt('input', {type: `range`, min, max, value: splashColor, oninput: function() {splashColorWin.value = this.value}, name: `splashColor`}),
   splashColorWin);
};

const renderSoundDetectionRange = ({soundDetection, soundDetectionRange}) => {
    if(soundDetectionRange > 1100) soundDetectionRange = 1100;
    if(soundDetectionRange < 128) soundDetectionRange = 128;
    let soundDetectionRangeWin = elt(`input`, {type: `number`, name: `soundDetectionRange`, value: soundDetectionRange, disabled: !soundDetection});

    return elt(`div`, null, elt('input', {type: `range`, min: 128, max: 1100, value: soundDetectionRange, disabled: !soundDetection,  oninput: function() {soundDetectionRangeWin.value = this.value}, name: `soundDetectionRange`, className: `${!soundDetection ? `threshold_disabled` : ``}`}),
     soundDetectionRangeWin);
};

const renderShiftClick = ({shiftClick}) => {
  let dom = elt("input", {
    type: "checkbox",
    className: "option",
    checked: shiftClick,
    name: "shiftClick",
  });
  return dom;
};

const renderLikeHuman = ({likeHuman}) => {
  let dom = elt("input", {
    type: "checkbox",
    className: "option",
    checked: likeHuman,
    name: "likeHuman",
  });
  return dom;
};

const renderLikeHumanFineTune = ({likeHumanFineTune, arduino, likeHuman}) => {
  let dom = elt("input", {
    type: "checkbox",
    disabled: !likeHuman || arduino,
    className: "option",
    checked: arduino ? false : likeHumanFineTune,
    name: "likeHumanFineTune",
  });
  return dom;
}

const renderCastDelay = ({castDelay}) => {
  return elt('input', {type: `number`, name: `castDelay`, value: castDelay})
};

const renderLogOut = ({logOut}) => {
  return elt('input', {type: `checkbox`, name: `logOut`, checked: logOut})
};

const renderLogOutEvery = ({logOutEvery, logOut}) => {
  return elt(`div`, {"data-collection": `logOutEvery`}, elt(`span`, {className: `option_text`}, `from:`),
     elt('input', {type: `number`, name: `from`, value: logOutEvery.from, disabled: !logOut}), elt(`span`, {className: `option_text`}, `to:`),
     elt('input', {type: `number`, name: `to`, value: logOutEvery.to, disabled: !logOut}));
};

const renderLogOutFor = ({logOutFor, logOut}) => {
  return elt(`div`, {"data-collection": `logOutFor`}, elt(`span`, {className: `option_text`}, `from:`),
     elt('input', {type: `number`, name: `from`, value: logOutFor.from, disabled: !logOut}), elt(`span`, {className: `option_text`}, `to:`),
     elt('input', {type: `number`, name: `to`, value: logOutFor.to, disabled: !logOut}));
};

const renderLogOutAfter = ({logOutAfter, logOut}) => {
  return elt(`div`, {"data-collection": `logOutAfter`}, elt(`span`, {className: `option_text`}, `from:`),
     elt('input', {type: `number`, name: `from`, value: logOutAfter.from, disabled: !logOut}), elt(`span`, {className: `option_text`}, `to:`),
     elt('input', {type: `number`, name: `to`, value: logOutAfter.to, disabled: !logOut}));
};

const renderLogOutMacro = ({logOut, logOutUseMacro, logOutMacroKey}) => {
  const checkbox = elt('input', {type: 'checkbox', checked: logOutUseMacro, name: `logOutUseMacro`, disabled: !logOut });
  const key = elt('input', {type: `text`, disabled: !logOut || !logOutUseMacro, name: `logOutMacroKey`, value: logOutMacroKey});
  key.setAttribute(`readonly`, `true`);
  return elt('div', null, checkbox, key);
}

const renderMaxAttempts = ({ maxAttempts }) => {
  return elt('input', {type: 'number', name:"maxAttempts", value: maxAttempts})
};

const renderCloseLoot = ({ closeLoot, whitelist, game }) => {
  return elt(`select`, {className: `closeLoot`, disabled: !whitelist, value: closeLoot, name: `closeLoot`},
    elt(`option`, {selected: closeLoot == `mouse`, value: `mouse`}, `Mouse`),
    elt(`option`, {selected: closeLoot == `esc`, value: `esc`}, `Escape`),
    elt(`option`, {selected: closeLoot == `mouse+esc`, value: `mouse+esc`}, `Random: Mouse + Escape`),
  );
};

const renderMaxFishTimeAfter = ({ maxFishTimeAfter }) => {
  return elt(`select`, {className: `maxFishTimeAfter`, name: `maxFishTimeAfter`},
    elt(`option`, {selected: maxFishTimeAfter == `stop`, value: `stop`}, `Stop`),
    elt(`option`, {selected: maxFishTimeAfter == `recast`, value: `recast`}, `Recast`),
  );
}

const renderAfterHookDelay = ({sleepAfterHook, afterHookDelay}) => {
  return elt(`div`, {"data-collection": `afterHookDelay`}, elt(`span`, {className: `option_text`}, `from:`),
  elt('input', {type: `number`, name: `from`, value: afterHookDelay.from, disabled: !sleepAfterHook}), elt(`span`, {className: `option_text`}, `to:`),
  elt('input', {type: `number`, name: `to`, value: afterHookDelay.to, disabled: !sleepAfterHook})
  );
};

const renderMaxFishTime = ({maxFishTime}) => {
  return elt(`input`, {type: `number`, name: `maxFishTime`, value: maxFishTime});
};

const renderCloseAtWhisper = ({closeAtWhisper}) => elt(`input`, {type: `checkbox`, checked: closeAtWhisper, name: `closeAtWhisper`});

const renderCheckingDelay = ({checkingDelay}) => {
  return elt(`input`, {type: `number`, name:`checkingDelay`, value: checkingDelay});
};

const renderMouseMoveSpeed = ({mouseMoveSpeed, likeHuman}) => {
  const winRange = elt(`input`, {type: `number`, value: mouseMoveSpeed, name: "mouseMoveSpeed", disabled: !likeHuman})
  const range = elt('input', {type: `range`, min: 0, className: !likeHuman ? `threshold_disabled` : ``, max: 100, value: mouseMoveSpeed, disabled: !likeHuman, oninput: function() {winRange.value = this.value}, name: "mouseMoveSpeed"});
  return elt(`div`, null, range, winRange);
};

const renderMouseCurvature = ({mouseCurvatureStrength, likeHuman}) => {
  const winRange = elt(`input`, {type: `number`, value: mouseCurvatureStrength, disabled: !likeHuman, name: "mouseCurvatureStrength"})
  const range = elt('input', {type: `range`, className: !likeHuman ? `threshold_disabled` : ``, min: 0, max: 150, value: mouseCurvatureStrength, disabled: !likeHuman, oninput: function() {winRange.value = this.value}, name: "mouseCurvatureStrength"});
  return elt(`div`, null, range, winRange);
};

const renderLuresDelay = ({luresDelay, lures}) => {
  return elt(`input`, {type: `number`, disabled: !lures, name: `luresDelay`, value: luresDelay});
};

const renderRandomSleep = ({randomSleep}) => {
  return elt(`input`, {type: `checkbox`, name: `randomSleep`, checked: randomSleep});
};

const renderRandomSleepEvery = ({randomSleepEvery, randomSleep}) => {
  return elt(`div`, {"data-collection": `randomSleepEvery`}, elt(`span`, {className: `option_text`}, `from:`),
  elt('input', {type: `number`, name: `from`, value: randomSleepEvery.from, disabled: !randomSleep}), elt(`span`, {className: `option_text`}, `to:`),
  elt('input', {type: `number`, name: `to`, value: randomSleepEvery.to, disabled: !randomSleep})
  );
};

const renderRandomSleepDelay = ({randomSleepDelay, randomSleep}) => {
  return elt(`div`, {"data-collection": `randomSleepDelay`}, elt(`span`, {className: `option_text`}, `from:`),
  elt('input', {type: `number`, name: `from`, value: randomSleepDelay.from, disabled: !randomSleep}), elt(`span`, {className: `option_text`}, `to:`),
  elt('input', {type: `number`, name: `to`, value: randomSleepDelay.to, disabled: !randomSleep})
  );
};

const renderRandomSleepChance = ({randomSleepChance, randomSleep}) => {
  const winRange = elt(`input`, {type: `number`, disabled: !randomSleep, value: randomSleepChance, name: "randomSleepChance"})
  const range = elt('input', {type: `range`, max: 100, disabled: !randomSleep,  className: randomSleep ? `` : `threshold_disabled`, value: randomSleepChance, oninput: function() {winRange.value = this.value}, name: "randomSleepChance"});
  return elt(`div`, null, range, winRange);
};

const renderReaction = ({reaction}) => {
  return elt(`input`, {type: `checkbox`, name:`reaction`, checked: reaction});
};

const renderMissOnPurpose = ({missOnPurpose}) => {
  return elt(`input`, { type: `checkbox`, name:`missOnPurpose`, checked: missOnPurpose });
};

const renderMissOnPurposeRandom = ({missOnPurpose, missOnPurposeRandom}) => {

  if(missOnPurposeRandom.from > 100) missOnPurposeRandom.from = 100;
  if(missOnPurposeRandom.to > 100) missOnPurposeRandom.to = 100;
  if(missOnPurposeRandom.from < 0) missOnPurposeRandom.from = 0;
  if(missOnPurposeRandom.to < 0) missOnPurposeRandom.to = 0;

  return elt(`div`, {"data-collection": `missOnPurposeRandom`}, elt(`span`, {className: `option_text`}, `from:`),
     elt('input', {type: `number`, name: `from`, value: missOnPurposeRandom.from, disabled: !missOnPurpose}), elt(`span`, {className: `option_text`}, `to:`),
     elt('input', {type: `number`, name: `to`, value: missOnPurposeRandom.to, disabled: !missOnPurpose}));
}

const renderMissOnPurposeRandomDelay = ({missOnPurposeRandomDelay, missOnPurpose}) => {
  return elt(`div`, {"data-collection": `missOnPurposeRandomDelay`}, elt(`span`, {className: `option_text`}, `from:`),
     elt('input', {type: `number`, name: `from`, value: missOnPurposeRandomDelay.from, disabled: !missOnPurpose}), elt(`span`, {className: `option_text`}, `to:`),
     elt('input', {type: `number`, name: `to`, value: missOnPurposeRandomDelay.to, disabled: !missOnPurpose}));
}

const renderReactionDelay = ({reaction, reactionDelay}) => {
  return elt(`div`, {"data-collection": `reactionDelay`}, elt(`span`, {className: `option_text`}, `from:`),
  elt('input', {type: `number`, name: `from`, value: reactionDelay.from, disabled: !reaction}), elt(`span`, {className: `option_text`}, `to:`),
  elt('input', {type: `number`, name: `to`, value: reactionDelay.to, disabled: !reaction})
  );
};

const renderSleepAfterHook = ({sleepAfterHook}) => {
  return elt(`input`, {type: `checkbox`, name: `sleepAfterHook`, checked: sleepAfterHook});
};

const renderSleepAfterHookChance = ({sleepAfterHook, sleepAfterHookChance}) => {
  const winRange = elt(`input`, {type: `number`, disabled: !sleepAfterHook, value: sleepAfterHookChance, name: "sleepAfterHookChance"})
  const range = elt('input', {type: `range`, max: 100, disabled: !sleepAfterHook,  className: sleepAfterHook ? `` : `threshold_disabled`, value: sleepAfterHookChance, oninput: function() {winRange.value = this.value}, name: "sleepAfterHookChance"});
  return elt(`div`, null, range, winRange);
};

const renderBobberSensitivity = ({bobberSensitivity, soundDetection, bobberSensitivityPrint, autoSensDens}) => {
  let min = 1;
  let max = 10;
  if(bobberSensitivityPrint) {
    min = 1;
    max = 30;
  }

  if(bobberSensitivity > max) bobberSensitivity = max;
  if(bobberSensitivity < min) bobberSensitivity = min;
  let bobberSensitivityWin = elt(`input`, {type: `number`, name: `bobberSensitivity`, value: bobberSensitivity, disabled: soundDetection || autoSensDens});

  return elt(`div`, null, elt('input', {type: `range`, min, max, value: bobberSensitivity, disabled: soundDetection || autoSensDens, className: `${soundDetection || autoSensDens ? `threshold_disabled` : ``}`, oninput: function() {bobberSensitivityWin.value = this.value}, name: `bobberSensitivity`}),
   bobberSensitivityWin);
};

const renderCustomWindow = ({useCustomWindow, customWindow}) => {
  const select = elt(`select`, {name: `customWindow`, className: `customWindow`, disabled: !useCustomWindow});
  const renderUseCustomWindow = elt(`input`, {name: `useCustomWindow`, type: `checkbox`, checked: useCustomWindow});
  const focusButton = elt(`input`, {type: `button`, value: `Focus`,  className: `${useCustomWindow ? `` : `disabledButton`}`, disabled: !useCustomWindow, onclick() {
    ipcRenderer.send('focus-win', customWindow);
  }});

  if(useCustomWindow) {
    ipcRenderer.invoke('get-all-windows')
    .then((windows) => {
      windows.forEach(({title, handle}) => {
        select.append(elt(`option`, { selected: handle == customWindow, value: handle }, `${title} (${handle})`));
      })

    });
  }
  return elt(`div`, null, renderUseCustomWindow, select, focusButton);

};

const renderAfterTimer = ({afterTimer, timer}) => {
  let options = [
    `Stop`,
    `HS`,
    `Quit`,
    `HS + Quit`
  ]
  return elt('select', {value: afterTimer, disabled: !timer, name: "afterTimer"}, ...options.map(option => elt(`option`, {value: option, selected: option == afterTimer}, option)));
};

const renderHsKey = ({hsKey, afterTimer}) => {
  const key = elt('input', {type: `text`, name: `hsKey`, disabled: afterTimer != `HS` && afterTimer != `HS + Quit`, value: hsKey});
  key.setAttribute(`readonly`, `true`);
  return key;
};

const renderHsKeyDelay = ({hsKeyDelay, afterTimer}) => {
  return elt(`input`, {type: `number`, value: hsKeyDelay, disabled: afterTimer != `HS` && afterTimer != `HS + Quit`, name: `hsKeyDelay`})
}

const renderShutDown = ({timerShutDown, afterTimer}) => {
  return elt(`input`, {type: `checkbox`, checked: timerShutDown, disabled: afterTimer != `Quit` && afterTimer != `HS + Quit`, name: `timerShutDown`});
};

const renderTmApiKey = ({tmApiKey}) => {
  return elt('div', null, elt('input', {type: `text`, name: `tmApiKey`, value: tmApiKey, className: `tmApiKey`}), elt('input', {type: `button`, value: `Connect`, id: `tm`}));
};

const renderDetectWhisper = ({detectWhisper}) => {
  return elt('input', {type: `checkbox`, checked: detectWhisper, name: `detectWhisper`});
};

const renderWhisperThreshold = ({whisperThreshold, detectWhisper}) => {
  let colorWin = elt(`div`, {className: `whisperColorBox`, style: `background-color: rgb(${whisperThreshold},0,${whisperThreshold})`}, `${whisperThreshold}`);
  let range = elt('input', {type: `range`, min: 0, max: 255, oninput: function () {colorWin.style = `background-color: rgb(${this.value},0,${this.value})`; colorWin.innerHTML = this.value}, value: whisperThreshold, name: `whisperThreshold`, className: `whisperRange ${!detectWhisper ? `threshold_disabled` : ``}`, disabled: !detectWhisper});
  return elt(`div`, null, range, colorWin);
};

const renderMammoth = ({mammoth}) => {
  return elt('input', {type: `checkbox`, checked: mammoth, name: `mammoth`});
};

const renderMammothKey = ({mammoth, mammothKey}) => {
  const key = elt('input', {type: `text`, disabled: !mammoth, name: `mammothKey`, value: mammothKey});
  key.setAttribute(`readonly`, `true`);
  return key;
};

const renderMammothKeyDelay = ({mammoth, mammothKeyDelay}) => {
  return elt('input', {type: `number`, disabled: !mammoth, name: `mammothKeyDelay`, value: mammothKeyDelay});
};

const renderMammothSellDelay = ({mammoth, mammothSellDelay}) => {
  return elt(`div`, {"data-collection": `mammothSellDelay`}, elt(`span`, {className: `option_text`}, `from:`),
  elt('input', {type: `number`, name: `from`, value: mammothSellDelay.from, disabled: !mammoth}), elt(`span`, {className: `option_text`}, `to:`),
  elt('input', {type: `number`, name: `to`, value: mammothSellDelay.to, disabled: !mammoth})
  );
};

const renderMammothApplyEvery= ({mammoth, mammothApplyEvery}) => {
  return elt(`div`, {"data-collection": `mammothApplyEvery`}, elt(`span`, {className: `option_text`}, `from:`),
  elt('input', {type: `number`, name: `from`, value: mammothApplyEvery.from, disabled: !mammoth}), elt(`span`, {className: `option_text`}, `to:`),
  elt('input', {type: `number`, name: `to`, value: mammothApplyEvery.to, disabled: !mammoth})
  );
};

const renderMammothTraderName = ({mammoth, mammothUseMacro, mammothTraderName}) => {
    return elt('input', {type: `text`, disabled: !mammoth || mammothUseMacro, name: `mammothTraderName`, value: mammothTraderName});
};

const renderMammothAfterTradeDelay = ({mammoth, mammothAfterTradeDelay}) => {
  return elt('input', {type: `number`, disabled: !mammoth, name: `mammothAfterTradeDelay`, value: mammothAfterTradeDelay})
}

const renderMammothMacro = ({mammoth, mammothUseMacro, mammothMacroKey}) => {
  const checkbox = elt('input', {type: 'checkbox', checked: mammothUseMacro, name: `mammothUseMacro`, disabled: !mammoth });
  const key = elt('input', {type: `text`, disabled: !mammoth || !mammothUseMacro, name: `mammothMacroKey`, value: mammothMacroKey});
  key.setAttribute(`readonly`, `true`);
  return elt('div', null, checkbox, key);
}

const renderDynamicThreshold = ({dynamicThreshold, dynamicThresholdValue}) => {
  let checkbox = elt(`input`, {type: `checkbox`, name: `dynamicThreshold`, checked: dynamicThreshold});
  let input = elt(`input`, {type: `number`, name: `dynamicThresholdValue`, disabled: !dynamicThreshold, value: dynamicThresholdValue});
  return elt(`div`, null, checkbox, input);
};

const renderRngMove = ({rngMove}) => {
  return elt(`input`, {type: `checkbox`, name: `rngMove`, checked: rngMove});
};

const renderRngMoveKeys = ({rngMoveKeys, rngMove}) => {
  const checkBox = elt(`input`, {type: `checkbox`, name: `rngMoveKeys`, checked: rngMoveKeys, disabled: !rngMove});
  return checkBox;
};

const renderRngMoveTimer = ({rngMove, rngMoveTimer}) => {
  return elt(`div`, {"data-collection": `rngMoveTimer`}, elt(`span`, {className: `option_text`}, `from:`),
  elt('input', {type: `number`, className: `rngMoveTimer_from`, name: `from`, value: rngMoveTimer.from, disabled: !rngMove}), elt(`span`, {className: `option_text`}, `to:`),
  elt('input', {type: `number`, name: `to`, value: rngMoveTimer.to, disabled: !rngMove})
  );
}

const renderRngMoveRadiusMax = ({rngMove, rngMoveRadiusMax}) => {
  const winRange = elt(`input`, {type: `number`, disabled: !rngMove, value: rngMoveRadiusMax, name: "rngMoveRadiusMax"})
  const range = elt('input', {type: `range`, step: 0, max: 360, disabled: !rngMove, className: `${!rngMove ? `threshold_disabled` : ``}`, value: rngMoveRadiusMax, oninput: function() {winRange.value = this.value}, name: "rngMoveRadiusMax"});
  return elt(`div`, null, range, winRange);
};

const renderRngMoveDirLengthMax = ({rngMove, rngMoveDirLengthMax, rngMoveKeys}) => {
  const winRange = elt(`input`, {type: `number`, disabled: !rngMove || !rngMoveKeys, value: rngMoveDirLengthMax, name: "rngMoveDirLengthMax"})
  const range = elt('input', {type: `range`, step: 1, min: 1, max: 10, disabled: !rngMove || !rngMoveKeys, className: `${!rngMove || !rngMoveKeys ? `threshold_disabled` : ``}`, value: rngMoveDirLengthMax, oninput: function() {winRange.value = this.value}, name: "rngMoveDirLengthMax"});
  return elt(`div`, null, range, winRange);
};

const renderAutoSensDens = ({autoSensDens, game}) => {
  return elt(`input`, {type: `checkbox`, disabled: game == `Vanilla (splash)`, checked: autoSensDens, name: `autoSensDens`});
};

const renderTimer = ({timer}) => elt('input', {type: 'checkbox', checked: timer, name: "timer"});

const renderTimerTime = ({timer, timerTime}) => {
  return elt(
    "input",
    { type: "number", min: 0, value: timerTime, name: "timerTime", disabled: !timer, title: "Minutes"},
    `(min)`
  );
};

const renderLures = ({lures}) => {
  let checkbox = elt("input", {
    type: "checkbox",
    className: "option",
    checked: lures,
    name: "lures",
  });
  return checkbox;
};

const renderLuresType = ({lures, luresType}) => {
  let types = ['key', 'mouse'];
  return elt('select', {name: 'luresType', disabled: !lures},  ...types.map(type => elt('option', {selected: type == luresType, value: type}, type[0].toUpperCase() + type.slice(1) )))
}

const renderLuresCoords = ({luresCoords, lures}) => {
  const x = elt('input', {type: `number`, disabled: !lures, name: `x`, value: luresCoords.x});
  const y = elt('input', {type: `number`, disabled: !lures, name: `y`, value: luresCoords.y})
  const button = elt('input', {type: `button`, className: `${!lures ? `disabledButton` : ``}`, disabled: !lures, value: `Set`, onclick() {
    ipcRenderer.invoke('start-bot', 'pointZone').then((data) => {
      x.value = data.x;
      y.value = data.y;
    })
  }});

  return elt(`div`, null, elt(`div`, {"data-collection": `luresCoords`},
  elt(`span`, {className: `option_text`}, `x:`), x, elt(`span`, {className: `option_text`}, `y:`), y), button);
}

const renderLuresOpenCharacterWin = ({luresOpenCharacterWin, lures}) => elt(`input`, {type: `checkbox`, disabled: !lures, checked: luresOpenCharacterWin, 'name': `luresOpenCharacterWin`});

const renderFishpolCoords = ({fishpoleCoords, lures}) => {
  const x = elt('input', {type: `number`, disabled: !lures, name: `x`, value: fishpoleCoords.x});
  const y = elt('input', {type: `number`, disabled: !lures, name: `y`, value: fishpoleCoords.y})
  const button = elt('input', {type: `button`, className: `${!lures ? `disabledButton` : ``}`, disabled: !lures, value: `Set`, onclick() {
    ipcRenderer.invoke('start-bot', 'pointZone').then((data) => {
      x.value = data.x;
      y.value = data.y;
    })
  }});

  return elt(`div`, null, elt(`div`, {"data-collection": `fishpoleCoords`},
  elt(`span`, {className: `option_text`}, `x:`), x, elt(`span`, {className: `option_text`}, `y:`), y), button);
}

const renderLuresKey = ({lures, luresKey}) => {
  let key = elt('input', {type: 'text', value: luresKey, disabled: !lures, name: "luresKey"});
  key.setAttribute(`readonly`, `true`);
  return key;
};

const renderLuresDelayMin = ({lures, luresDelayMin}) => {
  return elt('input', {type: 'number', value: luresDelayMin, step: 0.1, disabled: !lures, name: "luresDelayMin"});
};

const renderSpares = ({spares}) => {
  const addButton = elt('input', {type: 'button', className: "spares-addButton", onclick() {
    let key = elt('input', {type: 'text', value: `1`, className: "spares-key", "data-spares": "key"});
    key.setAttribute('readonly', true);
    this.parentNode.insertBefore(elt('div', {className: "spareContainer"}, `Name: `,
      elt('input', {type: `text`, value: `My Action`, className: "spares-name", "data-spares": "name"}), `Key: `,
      key, `Time: `,
      elt('input', {type: 'number', value: 10, step: 0.1, title: "Minutes (you can use decimals for smaller values: 0.5)", "data-spares": "repeatTime"}), `Delay: `,
      elt(`input`, {type: `number`, value: 3000, title: "Milliseconds", "data-spares": "delay"}),
      elt('input', {type: 'button', className: "spares-removeButton", onclick(){
        ipcRenderer.invoke('remove-spare-confirm')
        .then((confirm) => confirm ? this.parentNode.remove() : null)
      }})
    ), this);
  }});

  const sparesNodes = spares.map(spare => {
    const key = elt('input', {type: 'text', value: spare.key, className: "spares-key", "data-spares": "key"});
    key.setAttribute('readonly', true);
    return elt('div', {className: "spareContainer"}, `Name: `,
      elt('input', {type: `text`, value: spare.name, className: "spares-name", "data-spares": "name"}), `Key: `,
      key, `Time: `,
      elt('input', {type: 'number', value: spare.repeatTime, step: 0.1, title: "Minutes (you can use decimals for smaller values: 0.5)", "data-spares": "repeatTime"}), `Delay: `,
      elt(`input`, {type: `number`, value: spare.delay,  title: "Milliseconds",  "data-spares": "delay"}),
      elt('input', {type: 'button', className: "spares-removeButton", onclick(){
        ipcRenderer.invoke('remove-spare-confirm')
        .then((confirm) => confirm ? this.parentNode.remove() : null)
      }})
    )
  });
  return elt('div', {className: `sparesContainer`}, ...sparesNodes, addButton);
};

const renderFilterType = ({whitelist, filterType}) => {
  return elt(`select`, {name: `filterType`, className: `filterType`, disabled: !whitelist},
    elt(`option`, {selected: filterType == `whitelist`, value: "whitelist"}, `Whitelist`),
    elt(`option`, {selected: filterType == `blacklist`, value: "blacklist"}, `Blacklist`)
  );
}

const renderFilterAtMouse = ({game, whitelist, atMouse}) => {
  if(game != `Retail` && game != `Vanilla` && game != `Vanilla (splash)`) {
    atMouse = true;
  }
  return elt(`input`, {name: `atMouse`, type:`checkbox`, checked: atMouse, className: `atMouse`, disabled: !whitelist || game != `Retail`});
}

const renderWhitelistLanguage = ({whitelist, whitelistLanguage}) => {
  let languages = [`eng`, `spa`, `spa_old`, `por`, `fra`, `deu`, `ita`, `chi_sim`, `chi_tra`, `kor`, `rus`];
  let properLanguages = {eng: `English`, spa: "Spanish", spa_old: "Spanish Old", deu: "Deutsch", por: "Português", fra: "Français", ita: "Italiano", chi_sim: "Simplified Chinese", chi_tra: "Traditional Chinese", kor: "Korean", rus: "Russian"};
  return elt('select', {name: `whitelistLanguage`, className: `whitelistLanguage` , disabled: !whitelist}, ...languages.map(language => elt(`option`, {selected: whitelistLanguage == language, value: language}, `${properLanguages[language]}`)));
}

const renderWhitelistWords = ({whitelist, whitelistWords}) => {
  return elt('textarea', {name:"whitelistWords", placeholder: `Red Salmon, Curcian Carp, Dragon Goby`, className: "whitelist_input", value: whitelistWords, disabled: !whitelist})
}

const renderWhitelist = ({whitelist}) => {
 return elt('input', {type: 'checkbox', name: "whitelist", onclick: () => { if(!whitelist) {ipcRenderer.send("whitelist-warn")}}, checked: whitelist})
};

const renderLuresOmitInitial = ({luresOmitInitial, lures}) => elt('input', {type: 'checkbox', name: "luresOmitInitial", disabled: !lures, checked: luresOmitInitial})
const renderSparesOmitInitial = ({sparesOmitInitial}) => elt('input', {type: 'checkbox', name: "sparesOmitInitial", checked: sparesOmitInitial})

const renderCheckChanges = ({checkChanges}) => elt('input', {type: 'checkbox', name:"checkChanges", checked: checkChanges});
const renderCheckChangesSens = ({checkChanges, checkChangesSens}) => {
  const winRange = elt(`input`, {type: `number`, value: checkChangesSens, disabled: !checkChanges, name: "checkChangesSens"})
  const range = elt('input', {type: `range`, max: 1000, min: 1, step: 1, value: checkChangesSens, className: `${!checkChanges ? `threshold_disabled` : ``}`, disabled: !checkChanges,  oninput: function() {winRange.value = this.value}, name: "checkChangesSens"});
  return elt(`div`, null, range, winRange);
}
const renderCheckChangesInterval = ({checkChanges, checkChangesInterval}) => elt('input', {type: "number", name:"checkChangesInterval", value: checkChangesInterval, disabled: !checkChanges});
const renderCheckChangesIntervalAfter = ({checkChanges, checkChangesIntervalAfter}) => elt('input', {type: "number", name: "checkChangesIntervalAfter", value: checkChangesIntervalAfter, disabled: !checkChanges});
const renderCheckChangesSendImg = ({checkChanges, checkChangesSendImg}) => elt('input', {type: 'checkbox', name: `checkChangesSendImg`, checked: checkChangesSendImg, disabled: !checkChanges});
const renderCheckChangesDoAfter = ({checkChanges, checkChangesDoAfter}) => {
  return elt('select', {name: `checkChangesDoAfter`, disabled: !checkChanges}, ...['nothing', 'random', 'sleep', 'logout', 'press key', 'move', 'stop', 'quit'].map(type => elt('option', {value: type, selected: checkChangesDoAfter == type}, `${type[0].toUpperCase()}${type.slice(1)}`)))
};
const renderCheckChangesDoAfterSleepTime = ({checkChanges, checkChangesDoAfter, checkChangesDoAfterSleepTime}) => {
  return elt('input', {type: `number`, disabled: !checkChanges, name: `checkChangesDoAfterSleepTime`, value: checkChangesDoAfterSleepTime });
};
const renderCheckChangesDoAfterKey = ({checkChanges, checkChangesDoAfterKey}) => {
  const key = elt('input', {type: `text`, disabled: !checkChanges, name: `checkChangesDoAfterKey`, value: checkChangesDoAfterKey});
  key.setAttribute(`readonly`, `true`);
  return key;
}

const renderCheckChangesIgnoreActions = ({checkChanges, checkChangesIgnoreActions}) => elt('input', {type: 'checkbox', name: `checkChangesIgnoreActions`, disabled: !checkChanges, checked: checkChangesIgnoreActions});
const renderCatchFishButton = ({catchFishButton}) => elt("select", {name: "catchFishButton"}, ...["right", "left", "middle"].map(button => elt('option', {selected: catchFishButton == button}, button)))
const renderLibraryType = ({libraryType}) => elt('select', { name: "libraryType" }, ...['nut.js', 'keysender'].map(lib => elt('option', {selected: lib == libraryType}, lib)));

const renderApplyFatigue = ({applyFatigue}) => elt('input', {name: "applyFatigue", type: "checkbox", checked: applyFatigue});
const renderApplyFatigueEvery = ({applyFatigue, applyFatigueEvery}) => {
  return elt(`div`, {"data-collection": `applyFatigueEvery`}, elt(`span`, {className: `option_text`}, `from:`),
  elt('input', {type: `number`, name: `from`, value: applyFatigueEvery.from, disabled: !applyFatigue}), elt(`span`, {className: `option_text`}, `to:`),
  elt('input', {type: `number`, name: `to`, value: applyFatigueEvery.to, disabled: !applyFatigue})
  );
};
const renderApplyFatigueRate = ({applyFatigue, applyFatigueRate}) => {
  const winRange = elt(`input`, {type: `number`, disabled: !applyFatigue, value: applyFatigueRate, name: "applyFatigueRate"})
  const range = elt('input', {type: `range`, step: 0.1, max: 10, disabled: !applyFatigue,  className: applyFatigue ? `` : `threshold_disabled`, value: applyFatigueRate, oninput: function() {winRange.value = this.value}, name: "applyFatigueRate"});
  return elt(`div`, null, range, winRange);
}

const renderLibraryTypeInput = ({libraryTypeInput}) => {
  const libs = ['nut.js', 'keysender'];
  return elt('select', {name: 'libraryTypeInput'}, ...libs.map(lib => elt('option', {value: lib, selected: lib == libraryTypeInput}, lib)))
};

const renderSettings = (config) => {
  return elt('section', {className: `settings settings_advSettings`},
  elt(`p`, {className: `settings_header advanced_settings_header`}, `⚙️`), elt(`span`, {className: `advanced_settings_header_text`}, `General`),
  elt('div', {className: "settings_section"},
  wrapInLabel(`Start Bot By Fishing Key`, renderStartByFishingKey(config), `Your Fishing Key (the same assigned in the bot) in the game will start the bot and you don't need to alt-tab to start it manually, you still need to stop it either by Stop Key or manually (the bot won't stop if you just move away as it happens in the game). Warning! The key you assigned for Fishing Key will be blocked on your machine and if used will start the bot. Turn this feature on only after you have configured all the settings.`),
  wrapInLabel(`Human-like Movement: `, renderLikeHuman(config), `The bot will move your mouse in a human way: random speed and with a slight random deviation in the movement. Otherwise it will move the mouse instantly, which might be a better option if you use a lot of windows.`),
  wrapInLabel(`Human-like Accuracy: `, renderLikeHumanFineTune(config), `The bot will "fine-tune" the mouse position after moving to the bobber, imitating a human-like way of reaching the mouse-movement target position.`),
  wrapInLabel(
    "Use Shift+Click: ",
    renderShiftClick(config),
    `Use shift + click instead of Auto Loot. Check this option if you don't want to turn on Auto Loot option in the game. Your "Loot key" in the game should be assigned to shift.`
  ),
    wrapInLabel(`Auto-Confirm SB Items: `, renderCheckConfirm(config), `The bot will check for confirmation window after every catch and will auto-confirm soulbound items (even in AutoLoot mode).`),
  wrapInLabel(`Attempts Limit: `, renderMaxAttempts(config), `How many times the bot will fail finding bobber before stopping.`),
  wrapInLabel(`Dynamic Threshold: `, renderDynamicThreshold(config), `ONLY FOR MANUAL MODE. After attempts limit the bot will dynamically change threshold by the provided value.`),
  wrapInLabel(`Catch With Mouse Button: `, renderCatchFishButton(config), `Choose the button you want the bot to click when it wants to catch the fish.`),
  ),

  elt(`p`, {className: `settings_header advanced_settings_header`}, `🖱️`), elt(`span`, {className: `advanced_settings_header_text`}, `Mouse & Keyboard`),
  elt(`div`, {className: `settings_section`},
    wrapInLabel(`Random Mouse Speed: `, renderMouseMoveSpeed(config), `The bot will generate a random number between the provided values. The higher the value the faster the bot moves the cursor. Works only if Like a human option is on.`),
    wrapInLabel(`Random Mouse Curvature: `, renderMouseCurvature(config), `The bot will generate a random number between the provided values. The higher the value the stronger is the deviation of the movement. Works only if Like a human option is on.`),
    wrapInLabel(`Highlight Bobber (%): `, renderHighlightPercent(config), `How often the bot should highlight the bobber before checking on it (if in your game the bobber become brigther or more colourfull after highlighting, then change this value to 100% if you don't care for randomness)`),
    wrapInLabel(`Input Library: `, renderLibraryTypeInput(config), `Different ways of simulating keyboard and mouse actions.`),
    wrapInLabel(`Mouse/keyboard Random Delay (ms): `, renderDelay(config), `The bot will generate a random number between the provided values. The number is generated every time bot utilizes your mouse or keyboard and represents the delay between pressing/releasing of mouse/keyboard clicks and pressing.`),
  ),

  elt(`p`, {className: `settings_header`}, `🖥️`), elt(`span`, {className: `advanced_settings_header_text`}, `Window`),
  elt(`div`, {className: `settings_section`},
  wrapInLabel(`Custom window: `, renderCustomWindow(config), `You can choose a custom window from all the windows opened on your computer.`),
  wrapInLabel(`Hide bot after start: `, renderHideWin(config), `The window of the bot will be hidden and you will be able to focus it only after using stop key.`),
),

  elt("p", {className: 'settings_header advanced_settings_header'}, "🔎"),  elt(`span`, {className: `advanced_settings_header_text`}, `Filter`),
  elt(
    "div",
    { className: "settings_section" },
    wrapInLabel("Use Filter: ",
      renderWhitelist(config),
      `The bot will loot only items in the whitelist. Before using, turn off AutoLoot in the game and set UI Scale to default. The names of the items must be exactly the same as in the game, separated by comma. `
    ),
    wrapInLabel("Mode: ", renderFilterType(config), `Filter Mode will decide whether to pick or to ignore items in the list.`),
    wrapInLabel("Language: ", renderWhitelistLanguage(config), `If it's the first time you using a language from the list, wait until the bot downloads the tesseract data for your language. `),
    wrapInLabel(`Close Loot Window With: `, renderCloseLoot(config), `The bot will use mouse/esc or randomly one of them to close the loot window while filtering the loot.`),
    wrapInLabel("Loot Window At Mouse: ", renderFilterAtMouse(config), `Loot window at mouse will tell the bot whether it should check the loot window at mouse or the default loot window at the left side of the screen.`),
    wrapInLabel("", renderWhitelistWords(config))
  ),
  elt(`p`, {className: `settings_header`}, `🎣`), elt(`span`, {className: `advanced_settings_header_text`}, `Lures`), elt(`a`, {href: `#`, style: `margin-left: 3px`, onclick: () => {shell.openExternal("https://github.com/jsbots/AutoFish#applying-lures-pushpin")}}, `(Guide)`),
  elt(`div`, {className: `settings_section`},
    wrapInLabel(
      "Use Lures: ",
      renderLures(config),
      `Check this option if you want to use fishing lures.`
    ),
    wrapInLabel('Lures Application Type: ', renderLuresType(config), `Whether the bot should use macro or mouse to apply lures.`),
    config.luresType == `key` ? wrapInLabel(
      "Lures Key: ",
      renderLuresKey(config),
      `Check this option if you want to use fishing lures. Assign the same key you use for using fishing lures.  You can change cast delay of this key in the Advanced Settings.`
    ) : ``,
    config.luresType == `mouse` ? wrapInLabel(`Open Character Window: `, renderLuresOpenCharacterWin(config), `The bot will open character window (by pressing "c" key) before applying lures to fishpole coordinates.`) : ``,
    config.luresType == `mouse` ? wrapInLabel(`Lures Coordinates: `, renderLuresCoords(config), `Lures coordinates on the screen.`) : ``,
    config.luresType == `mouse` ? wrapInLabel(`Fishpole Coordinates: `, renderFishpolCoords(config), `Fishpole coordinates on the screen.`) : ``,
    wrapInLabel(
  "Reuse Lures (min): ",
  renderLuresDelayMin(config),
  `Fishing lures expiration time in minutes.`
  ),
  wrapInLabel(`Applying Lures Delay (ms):`, renderLuresDelay(config), `How much it takes the bot to apply the lure.`),
  wrapInLabel(`Omit Initial Application:`, renderLuresOmitInitial(config), `Don't apply lures at the beggining, wait until timer elapses.`),
  wrapInLabel(`Auto-Confirm Lures:`, renderConfirmLures(config), `If you want the bot to apply lures earlier than they expire, some games might require confirmation for this. If on, the bot will auto-confirm in such cases. You can also use a macro for the same, in that case you don't need to turn on this option.`)
  ),
  elt(`p`, {className: `settings_header`}, `⏲️`), elt(`span`, {className: `advanced_settings_header_text`}, `Timer`),
  elt('div', {className: "settings_section"},
  wrapInLabel("Use Timer: ", renderTimer(config),`It's timer. It's too dificult to explain here, so you can ask AI what is it exactly.`),
  wrapInLabel("Time (min): ", renderTimerTime(config), `The bot will work for the given period of minutes.`),
  wrapInLabel("Do After Timer: ", renderAfterTimer(config),`What the bot should do after the timer elapses (you can set it in the main window)`),
  wrapInLabel("HS Key: ", renderHsKey(config), `A key your HS is assigned.`),
  wrapInLabel("HS Delay (ms): ", renderHsKeyDelay(config), `How long it take to use HS`),
  wrapInLabel("Shut Down Computer After Quitting: ", renderShutDown(config), `The bot will press Left Windows Key and launch command line, after that it will write shutdown -s -t 10 command which will shut down your computer in 10 seconds. `),
  ),

    elt(`p`, {className: `settings_header`}, `🎯`), elt(`span`, {className: `advanced_settings_header_text`}, `Miss On Purpose`),
    elt('div', {className: "settings_section"},
    wrapInLabel(`Miss On Purpose: `, renderMissOnPurpose(config), `The bot will miss fish on purpose to simulate a human mistake. The value is % chance per cast that the bot will miss (it's not % of the whole session, so it might be drastically different).`),
    wrapInLabel(`Miss On Purpose Likelihood Per Cast: (%)`, renderMissOnPurposeRandom(config), `The bot will generate a random number from the provided values. The number is generated every fishing session: so the next time you start the bot, it will be always different (randomly generated) between the given values.`),
    wrapInLabel(`Miss On Purpose Delay: (sec) `,  renderMissOnPurposeRandomDelay(config), `Random delay after which the bot will miss on purpuse. The bot will generate a random number from the provided values. The number is generated every fishing session: so the next time you start the bot, it will be always different (randomly generated) between the given values.`)
    ),
    elt(`p`, {className: `settings_header`}, `🚪`),elt(`span`, {className: `advanced_settings_header_text`}, `Logging Out`),
    elt('div', {className: "settings_section"},
    wrapInLabel(`Use Log out/Log in:`, renderLogOut(config), `The bot will log out from the game after the given time, wait for a couple of minutes and log back to the game.`),
    wrapInLabel(`Random Log Out Every: (min)`, renderLogOutEvery(config), `The bot will generate a random number from the provided values. The number is generated every time the bot logs out: so the next time the bot logs out, it will be always different (randomly generated).`),
    wrapInLabel(`Random Log Out For: (sec)`, renderLogOutFor(config), `How long the bot should be stayed logged out. The bot will generate a random number from the provided values. The number is generated every time the bot logs out: so the next time the bot logs out, it will be always different (randomly generated).`),
    wrapInLabel(`Random Log Out After: (sec)`, renderLogOutAfter(config), `How long the bot should wait before starting fishing again. The bot will generate a random number from the provided values. The number is generated every time the bot logs out: so the next time the bot logs out, it will be always different (randomly generated).`),
    wrapInLabel(`Use Macro: `, renderLogOutMacro(config), `Use your own macro in the game instead of the bot typing /logout command.`),
    ),
    elt(`p`, {className: `settings_header`}, `💤`), elt(`span`, {className: `advanced_settings_header_text`}, `Random Sleep`),
    elt('div', {className: "settings_section"},
    wrapInLabel(`Random Sleep:`, renderRandomSleep(config), `The bot will sleep randomly from time to time for the random duration.`),
    wrapInLabel(`Random Sleep Chance (%):`, renderRandomSleepChance(config), `Likelihood that the bot will go to sleep.`),
    wrapInLabel(`Random Sleep Every (min):`, renderRandomSleepEvery(config), `The bot will generate a random number from the provided values. The number is generated every time the bot goes to sleep: so the next time the bot goes to sleep it will be always different (randomly generated). You can use decimal notation for seconds. `),
    wrapInLabel(`Random Sleep For (sec):`, renderRandomSleepDelay(config), `The bot will generate a random number from the provided values. The number is generated every time the bot goes to sleep: so the next time the bot goes to sleep it will be always different(randomly generated).`),
    ),
    elt(`p`, {className: `settings_header`}, `💤`), elt(`span`, {className: `advanced_settings_header_text`}, `Reaction Time`),
    elt('div', {className: "settings_section"},
    wrapInLabel(`Random Reaction Time:`, renderReaction(config), `Randomise reaction time before any action.`),
    wrapInLabel(`Ranomd Reaction Time Delay (ms):`, renderReactionDelay(config), `The bot will generate a random number from the provided values. The number is generated every time the bot needs to move/press/click something: so the next time the bot uses your mouse/keyboard the reaction time will be always different(randomly generated)`)),
    elt(`p`, {className: `settings_header`}, `💤`), elt(`span`, {className: `advanced_settings_header_text`}, `Sleep After Catch`),
    elt('div', {className: "settings_section"},
    wrapInLabel(`Sleep After Catch:`, renderSleepAfterHook(config), `The bot will sleep after it hooked the fish for the random duration.`),
    wrapInLabel(`After Catch Chance (%): `, renderSleepAfterHookChance(config), `Likelihood that the bot will sleep after it caches fish.`),
    wrapInLabel(`After Catch Random Delay (ms): `, renderAfterHookDelay(config), `The bot will generate a random number from the provided values. The number is generated every time the bot hooked the fish.`),
    ),

    elt(`p`, {className: `settings_header settings_header_premium`}, `📲`),  elt(`span`, {className: `advanced_settings_header_text`}, `Remote Control`),  elt(`a`, {href: `#`, style: `margin-left: 3px`, onclick: () => {shell.openExternal("https://github.com/jsbots/AutoFish#remote-control-iphone")}}, `(Guide)`),
    elt(`div`, {className: `settings_section settings_premium`},
      wrapInLabel(`Telegram Token:`, renderTmApiKey(config), `Provide telegram token created by t.me/BotFather and press connect.`),
      wrapInLabel(`Detect Whisper:`, renderDetectWhisper(config), `The bot will analyze Chat Zone for Whisper Threshold purple colors, if it finds any it will notifiy telegram bot you connected through token.`),
      wrapInLabel(`Stop and Close the Game at Whisper:`, renderCloseAtWhisper(config), `Whether to stop the bot and close the window if someone whispered.`),
      wrapInLabel(`Whisper Threshold:`, renderWhisperThreshold(config), `The intensity of purple color the bot will recognize as whispering.`),
    ),
    elt(`p`, {className: `settings_header settings_header_premium`}, `🤖`),elt(`span`, {className: `advanced_settings_header_text`}, `Random Movement`),
    elt('div', {className: "settings_section settings_premium"},
    wrapInLabel(`Use Random Camera Movement: `, renderRngMove(config), `The bot will randomly move your camera within the provided radius. If the bot overdoes it and "no fishing water" error appear, it will move your camera back for the r * 2 radius.`),
    wrapInLabel(`Use Random Character Movement:`, renderRngMoveKeys(config), `The bot will move your character around a little. Don't leave the bot for a long time in this mode, it might run away and tell everyone that you are using bots.`),
    wrapInLabel(`Camera Movement (deg):`, renderRngMoveRadiusMax(config), `The maximum radius of the camera movement. The bigger the value, the more your character will turn the camera.`),
    wrapInLabel(`Character Movement (steps):`, renderRngMoveDirLengthMax(config), `Aproximate value of steps made by the bot when it moves around, defines the perimeter of how far it might move.`),
    wrapInLabel(`Use Movements Randomly Every (min): `, renderRngMoveTimer(config), `How often the bot should move your camera/character. The value is chosen randomly within the provided values.`),
    ),
    elt(`p`, {className: `settings_header settings_header_premium`}, `🥱`), elt(`span`, {className: `advanced_settings_header_text`}, `Fatigue`),
    elt('div', {className: "settings_section settings_premium"},
    wrapInLabel(`Apply Fatigue:`, renderApplyFatigue(config), `The bot will simulate fatigueness by decreasing all the delay values by given rate.`),
    wrapInLabel(`Apply Fatigue Every (min):`, renderApplyFatigueEvery(config), `The bot will randomly apply fatigueness between the provided interval`),
    wrapInLabel(`Fatigue Rate (%):`, renderApplyFatigueRate(config), `The rate value of fatigueness which will make all the delay values increase in geometric progression.`),
    ),
  elt(`p`, {className: `settings_header settings_header_premium`}, `🧙`),elt(`span`, {className: `advanced_settings_header_text`}, `Additional Actions`),
  elt(`div`, {className: `settings_section settings_premium`},
      wrapInLabel(`Omit Initial Application:`, renderSparesOmitInitial(config), `Don't apply additional actions at the beggining, wait until timer elapses.`),
      wrapInLabel(`Auto-Confirm Actions:`, renderConfirmSpares(config),`If you want the bot to apply actions earlier than they expire, some games might require confirmation for this. If on, the bot will auto-confirm in such cases. You can also use a macro for the same (in the guide), in that case you don't need to turn on this option.`),
      renderSpares(config)
  ),
    elt(`p`, {className: `settings_header settings_header_premium`}, `🏃`), elt(`span`, {className: `advanced_settings_header_text`}, `Motion Detection`),
    elt(`div`, {className: `settings_section settings_premium`},
    wrapInLabel('Use Motion Detection: ', renderCheckChanges(config), `The bot will detect changes within Detection Zone. The bot will notify you in Telegram if some movement happens within Detection Zone.\n\nYou can set the Detection Zone around your character and decrease sensitivity to make the bot detect any suspicious actions around your character and prevent possible griefing. `),
    wrapInLabel('Send Screenshot Of The Event To Telegram:', renderCheckChangesSendImg(config), `The bot will send a screenshot of what exactly triggered the event.`),
    wrapInLabel('Ignore My Actions:', renderCheckChangesIgnoreActions(config), `The bot will try to ignore time when you do something: cast, catch, move camera, log out and so on.`),
    wrapInLabel('Sensitivity: ', renderCheckChangesSens(config), `Old good sensitivity value for a typical motion detection. Doesn't need an explanation, right?`),
    wrapInLabel('Interval (sec): ', renderCheckChangesInterval(config), `The bot will check for motion every given interval value.`),
    wrapInLabel('Ignore Time After Event Occured (sec): ', renderCheckChangesIntervalAfter(config), `After some event happened how long to ignore all the events after. `),
    wrapInLabel('Do After Event: ', renderCheckChangesDoAfter(config), `What to do after the event occured.\nChoices:\n- Sleep: the bot will sleep for the given duration.\n- Logout: The bot will log out for the given duration (will use settings from the Logging out section).\n- Move: The bot will make a random movement (will use the settings from the Random Movement section)\n- Press key: the bot will press the designated key.\n- Random: the bot will either sleep, move or do nothing randomly.`),
    config.checkChangesDoAfter == `press key` ? wrapInLabel('Key: ', renderCheckChangesDoAfterKey(config), `Key the bot will press after the event occured. It will sleep after for the prvoided Sleep time. `) : ``,
    config.checkChangesDoAfter == `sleep` || config.checkChangesDoAfter == `press key` || config.checkChangesDoAfter == `random` ? wrapInLabel('Sleep Time (min): ', renderCheckChangesDoAfterSleepTime(config), `Time the bot will sleep after the event occured.`) : ``,
    ),

    elt(`p`, {className: `settings_header settings_header_premium`}, `🎮`), elt(`span`, {className: `advanced_settings_header_text`}, `Arduino Control`), elt(`a`, {href: `#`, style: `margin-left: 3px`, onclick: () => {shell.openExternal("https://github.com/jsbots/AutoFish#arduino-control-joystick")}}, `(Guide)`),
    elt('div', {className: "settings_section settings_premium"},
    wrapInLabel(`Use Arduino Board: `, renderArduino(config), `Using an Arduino Board will allow you to emulate a device in 100% hardware way: it will look like a real keyboard or mouse to the OS and the game. Check the guide on how to use an Arduino Board with AutoFish (Help -> Arduino Guide)`),
    wrapInLabel(`COM Port: `, renderArduinoPort(config), `Choose the COM port of the Arduino Board connected to your computer and press Connect button.`),
    wrapInLabel(`Bits Per Second: `, renderArduinoRate(config), `Don't change this value if you don't know what you are doing. The value should be the same as in Arduino Sketch provided in the guide (you can find it in the top of the sketch)`)
    ),
    elt(`p`, {className: `settings_header settings_header_premium`}, `🐘`), elt(`span`, {className: `advanced_settings_header_text`}, `Mount Selling`),
    elt('div', {className: "settings_section settings_premium"},
    wrapInLabel(`Use a Mount for Selling Junk: `, renderMammoth(config), `You can summon a mammoth carrying traders during the fishing and then sell all the scrap to one of them using any addon for selling such scrap.`),
    wrapInLabel(`Mount Key: `, renderMammothKey(config), `A key that will be used to summon a mammoth mount.`),
    wrapInLabel(`Mount Key Delay (ms): `, renderMammothKeyDelay(config), `How long the bot will wait after summoning a mammoth mount.`),
    wrapInLabel(`Mount Sell Delay (ms): `, renderMammothSellDelay(config), `How long it will take to sell all the scrap to a trader. The bot will generate a random number from the provided values. The number is generated every time the bot interacts with the trader: so the next time the bot interacts with the trader it will be always different (randomly generated).`),
    wrapInLabel(`Use Mount Selling Every (min): `, renderMammothApplyEvery(config), `A randomly generated interval of summoning a mammoth mount. The bot will summon a mammoth and then generate a new random value between the provided ones.`),
    wrapInLabel(`Sleep After For (sec):`, renderMammothAfterTradeDelay(config), `How long the bot should wait after all the operations. This time is usually needed to wait until traders disappear to avoid unintentional targeting.`),
    wrapInLabel(`Use Macro: `, renderMammothMacro(config), `Use your own macro in the game instead of the bot typing /target trader_name command.`),
    wrapInLabel(`Mount Trader Name: `, renderMammothTraderName(config), `The bot will use /target trader_name command to target one of your traders. Check the name of one you want to use for trading and write it here. The bot will use interaction key for interaction with a trader, you can assign it in them main settings.`),
    ),

  elt(`p`, {className: `settings_header settings_header_critical`}, `⚠️`), elt(`span`, {className: `advanced_settings_header_text`}, `Critical`),
  elt('div', {className: "settings_section settings_critical"},
  wrapInLabel(`Visual Library: `, renderLibraryType(config), `If something doesn't work with default library you can choose another one. Mind that keysender works only with dx11 and will be force for Multiple Fishing or Alt-Tab Fishing modes.`),
  wrapInLabel(`Ignore Preliminary Checks:`, renderIgnorePreliminary(config), `The bot will ignore all the preliminary checks including notification errors.`),
  wrapInLabel(`Loot Window Closing Delay (ms):`, renderCloseLootDelay(config), `How much does it take for the loot window to disappear after looting. If you use some special addons which turn off loot window completely, you can set this value to 0 to make the bot work faster.`),
  wrapInLabel(`Max Check Time (sec):`, renderMaxFishTime(config), `Maximum time the bot will wait for the bobber to jerk before casting again.`),
  wrapInLabel(`Do After Max Check Time:`, renderMaxFishTimeAfter(config), `What the bot should do if it reaches the maximum checking time.`),
  config.game == `Vanilla (splash)` ? wrapInLabel(`Splash color: `, renderSplashColor(config), `Whitness of the splash effect: should be smaller at night and higher during the day. `) : ``,
  wrapInLabel(`Bobber Check Interval (ms):`, renderCheckingDelay(config), `Every given value the bot checks the bobber for any movements. Use this option in addition to Bobber Sensitivity to find an optimal sensitivity.`),
  wrapInLabel(`Cast Animation Delay (ms):`, renderCastDelay(config), `How long the bot will wait before starting to look for the bobber in the fishing zone. This value is related to appearing and casting animations.`),
  wrapInLabel(`Looking For Bobber Direction:`, renderFindBobberDirection(config), `The direction how the bot will look for the bobber in the fishing zone. Normal means from left to right and from top to bottom, Reverse means from left to right and from bottom to top, Center means from the very center of the Fishing Zone to its borders.`),
),

);
}

const runApp = async () => {
  let config = await ipcRenderer.invoke("get-game-config");
  const settings = elt(`form`, {className: `advSettings_settings`}, renderSettings(config));
  const buttons = elt(`div`, {className: `buttons`},
     elt('input', {type: `button`, value: `Ok`}),
     elt('input', {type: `button`, value: `Cancel`}),
     elt('input', {type: `button`, value: `Defaults`}))

  settings.addEventListener(`click`, (event) => {
    if(event.target.value == `Connect` && event.target.id == "tm") {
      ipcRenderer.invoke(`connect-telegram`, config.tmApiKey)
      .then(() => {
        event.target.style.backgroundColor = `rgb(65, 255, 65)`;
        event.target.value = `Success!`
      })
      .catch(() => {
        event.target.style.backgroundColor = `rgb(255, 65, 65)`;
        event.target.value = `Error!`
      });

      setTimeout(() => {
        event.target.value = `Connect`;
        event.target.style.backgroundColor = `rgb(240, 240, 240)`;
      }, 1000);
    }

    if(event.target.value == `Connect` && event.target.id == "arduino") {
      ipcRenderer.invoke(`connect-arduino`, {port: config.arduinoPort, speed: config.arduinoRate})
      .then(() => {
        event.target.style.backgroundColor = `rgb(65, 255, 65)`;
        event.target.value = `Success!`
      })
      .catch(() => {
        event.target.style.backgroundColor = `rgb(255, 65, 65)`;
        event.target.value = `Error!`
      });

      setTimeout(() => {
        event.target.value = `Connect`;
        event.target.style.backgroundColor = `rgb(240, 240, 240)`;
      }, 3000);
    }


    if(event.target.name == `mammoth` && event.target.checked) {
      ipcRenderer.send("mammoth-warn");
    }

    if(event.target.name == `rngMove` && event.target.checked) {
      ipcRenderer.send("rngMove-warn");
    }

    if(event.target.name == `lures` && event.target.checked) {
      ipcRenderer.send(`lures-warn`);
    }
  });

  const keyAssigning = (event) => {
    if(event.key == ` `) {
      event.target.value = `space`;
    } else {
      let firstChar = event.key[0].toLowerCase();
      let resultKey = firstChar + event.key.slice(1);
      if(keySupport.isSupported(resultKey)) {
        event.target.value = resultKey;
      } else {
        ipcRenderer.send(`unsupported-key-win`);
      }
    }
    gatherConfig();
    document.removeEventListener(`keydown`, keyAssigning);
    event.target.blur();
    event.preventDefault();
  }

  settings.addEventListener('mousedown', (event) => {
      if (
      (event.target.name == `mammothKey` ||
        event.target["data-spares"] == "key" ||
        event.target.name == `hsKey` ||
        event.target.name == `luresKey` ||
        event.target.name == `spareKey` ||
        event.target.name == 'logOutMacroKey' ||
        event.target.name == 'mammothMacroKey' ||
        event.target.name == 'checkChangesDoAfterKey') &&
      !event.target.disabled
    ) {
      event.target.style.backgroundColor = `rgb(255, 219, 197)`;
      const activeKeyAnimation = (alter) => () => {
        if(alter) {
          event.target.style.backgroundColor = `rgb(255, 219, 197)`;
        } else {
          event.target.style.backgroundColor = `white`;
        }
        alter = !alter;
      }
      const flashKeyAnimation = setInterval(activeKeyAnimation(false), 300);
      event.target.addEventListener(`blur`, function bluring(event) {
        clearInterval(flashKeyAnimation)
        event.target.style.backgroundColor = `white`;
        event.target.removeEventListener(`blur`, bluring);
        event.target.removeEventListener(`keydown`, keyAssigning);
      });

      event.target.addEventListener(`keydown`, keyAssigning);
    }
  });

  buttons.addEventListener(`click`, async (event) => {
    if(event.target.value == 'Ok') {
      gatherConfig();
      ipcRenderer.send('advanced-click', config);
    }

    if(event.target.value == 'Cancel') {
      ipcRenderer.send('advanced-click');
    }

    if(event.target.value == 'Defaults') {
      let defaultConfig = await ipcRenderer.invoke('advanced-defaults');
      settings.innerHTML = ``;
      config = defaultConfig;
      settings.append(renderSettings(config));
    }
  });

  const advancedSettings = elt('div', {className: `advSettings`},
  settings,
  buttons);
  document.body.append(advancedSettings);

  const gatherConfig = () => {

    let spares = [...settings.querySelectorAll('.spareContainer')]
    .map((spare) =>
      [...spare.children].reduce((a, b) => {
        if(b['data-spares']) {
          a[b["data-spares"]] = convertValue(b);
        }
        return a;
      }, {}));
    config['spares'] = spares;

    [...settings.elements].forEach(option => {
      if(!option.name) return;

      let value = convertValue(option);
      let collection = option.parentNode["data-collection"];
      if(collection) {
        config[collection][option.name] = value;
      } else {
        config[option.name] = value;
      }
    });
  };

  settings.addEventListener('change', () => {
    gatherConfig();
    settings.innerHTML = ``;
    settings.append(renderSettings(config));
  });
};

runApp();
