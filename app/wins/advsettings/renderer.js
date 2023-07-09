const { ipcRenderer } = require("electron");
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

const renderHideWin = ({hideWin}) => elt(`input`, {type: `checkbox`, checked: hideWin, name: `hideWin`});

const renderDelay = ({delay}) => {
  return elt(`div`, {"data-collection": `delay`}, elt(`span`, {className: `option_text`}, `from:`),
     elt('input', {type: `number`, name: `from`, value: delay.from}), elt(`span`, {className: `option_text`}, `to:`),
     elt('input', {type: `number`, name: `to`, value: delay.to}));
};

const renderHighlightPercent = ({highlightPercent}) => elt(`input`, {type: `number`, value: highlightPercent, name: `highlightPercent`});


const renderFindBobberDirection = ({findBobberDirection}) => {
  return elt(`select`, {name: `findBobberDirection`}, ...([`normal`, `reverse`, `center`].map(dir => elt(`option`, {value: dir, selected: findBobberDirection == dir}, dir.slice(0, 1).toUpperCase() + dir.slice(1)))))
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
    return elt(`div`, null, select, elt(`input`, {type: `button`, disabled: !arduino, value: `Connect`, id:`arduino`}));
};

const renderArduinoRate = ({arduino, arduinoRate}) => {
  return elt(`select`, {disabled: !arduino, className: `arduino_rate`, name: `arduinoRate`}, ...[9600, 14400, 19200, 38400, 57600, 115200].map((rate) => elt(`option`, {selected: rate == arduinoRate}, `${rate}`)))
}

const renderSoundDetection = ({soundDetection}) => {
    return elt(`input`, {type: `checkbox`, checked: soundDetection, name: `soundDetection`});
};

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

const renderLikeHumanFineTune = ({likeHumanFineTune}) => {
  let dom = elt("input", {
    type: "checkbox",
    className: "option",
    checked: likeHumanFineTune,
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

const renderMaxAttempts = ({ maxAttempts }) => {
  return elt('input', {type: 'number', name:"maxAttempts", value: maxAttempts})
};

const renderCloseLoot = ({ closeLoot }) => {
  return elt(`select`, {className: `closeLoot`, value: closeLoot, name: `closeLoot`},
    elt(`option`, {selected: closeLoot == `mouse`, value: `mouse`}, `Mouse`),
    elt(`option`, {selected: closeLoot == `esc`, value: `esc`}, `Escape`),
    elt(`option`, {selected: closeLoot == `mouse+esc`, value: `mouse+esc`}, `Mouse + Escape`)
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

const renderRelZone = ({relZone}) => {
  return elt(`div`, {"data-collection": `relZone`},
      elt(`span`, {className: `option_text`}, `x:`), elt(`input`, {type: `number`, step: 0.1, name: `x`, value: relZone.x}),
      elt(`span`, {className: `option_text`}, `y:`), elt(`input`, {type: `number`, step: 0.1, name: `y`, value: relZone.y}),
      elt(`span`, {className: `option_text`}, `w:`), elt(`input`, {type: `number`, step: 0.1, name: `width`, value: relZone.width}),
      elt(`span`, {className: `option_text`}, `h:`), elt(`input`, {type: `number`, step: 0.1, name: `height`, value: relZone.height})
    );
};

const renderChatZone = ({chatZone}) => {
  return elt(`div`, {"data-collection": `chatZone`},
      elt(`span`, {className: `option_text`}, `x:`), elt(`input`, {type: `number`, step: 0.1, name: `x`, value: chatZone.x}),
      elt(`span`, {className: `option_text`}, `y:`), elt(`input`, {type: `number`, step: 0.1, name: `y`, value: chatZone.y}),
      elt(`span`, {className: `option_text`}, `w:`), elt(`input`, {type: `number`, step: 0.1, name: `width`, value: chatZone.width}),
      elt(`span`, {className: `option_text`}, `h:`), elt(`input`, {type: `number`, step: 0.1, name: `height`, value: chatZone.height})
    );
}

const renderCheckingDelay = ({checkingDelay}) => {
  return elt(`input`, {type: `number`, name:`checkingDelay`, value: checkingDelay});
};

const renderMouseMoveSpeed = ({mouseMoveSpeed, arduino}) => {
  return elt(`div`, {"data-collection": `mouseMoveSpeed`}, elt(`span`, {className: `option_text`}, `from:`),
  elt('input', { disabled: arduino, type: `number`, step: 0.1, name: `from`, value: mouseMoveSpeed.from }), elt(`span`, {className: `option_text`}, `to:`),
  elt('input', { disabled: arduino, type: `number`, step: 0.1, name: `to`, value: mouseMoveSpeed.to })
  );
};

const renderMouseCurvature = ({mouseCurvatureStrength, arduino}) => {
  return elt(`div`, {"data-collection": `mouseCurvatureStrength`}, elt(`span`, {className: `option_text`}, `from:`),
  elt('input', { disabled: arduino, type: `number`, name: `from`, value: mouseCurvatureStrength.from }), elt(`span`, {className: `option_text`}, `to:`),
  elt('input', { disabled: arduino, type: `number`, name: `to`, value: mouseCurvatureStrength.to })
  );
};

const renderLuresDelay = ({luresDelay}) => {
  return elt(`input`, {type: `number`, name: `luresDelay`, value: luresDelay});
};

const renderSpareDelay = ({spareDelay}) => {
  return elt(`input`, {type: `number`, name: `spareDelay`, value: spareDelay});
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

const renderReactionDelay = ({reaction, reactionDelay}) => {
  return elt(`div`, {"data-collection": `reactionDelay`}, elt(`span`, {className: `option_text`}, `from:`),
  elt('input', {type: `number`, name: `from`, value: reactionDelay.from, disabled: !reaction}), elt(`span`, {className: `option_text`}, `to:`),
  elt('input', {type: `number`, name: `to`, value: reactionDelay.to, disabled: !reaction})
  );
};

const renderSleepAfterHook = ({sleepAfterHook}) => {
  return elt(`input`, {type: `checkbox`, name: `sleepAfterHook`, checked: sleepAfterHook});
};

const renderBobberSensitivity = ({bobberSensitivity, soundDetection, bobberSensitivityPrint, autoSensDens}) => {
  let min = 1;
  let max = 3;
  if(bobberSensitivityPrint) {
    min = 1;
    max = 100;
  }

  if(bobberSensitivity > max) bobberSensitivity = max;
  if(bobberSensitivity < min) bobberSensitivity = min;
  let bobberSensitivityWin = elt(`input`, {type: `number`, name: `bobberSensitivity`, value: bobberSensitivity, disabled: soundDetection || autoSensDens});

  return elt(`div`, null, elt('input', {type: `range`, min, max, value: bobberSensitivity, disabled: soundDetection || autoSensDens, className: `${soundDetection || autoSensDens ? `threshold_disabled` : ``}`, oninput: function() {bobberSensitivityWin.value = this.value}, name: `bobberSensitivity`}),
   bobberSensitivityWin);
};

const renderBobberDensity = ({bobberDensity, autoSensDens}) => {

  if(bobberDensity > 10) bobberDensity = 10;
  if(bobberDensity < 1) bobberDensity = 1;
  let bobberDensityWin = elt(`input`, {type: `number`, disabled: autoSensDens, name: `bobberDensity`, value: bobberDensity});

  return elt(`div`, null, elt('input', {type: `range`, disabled: autoSensDens, className: `${autoSensDens ? `threshold_disabled` : ``}`,min: 1, max: 10, value: bobberDensity, oninput: function() {bobberDensityWin.value = this.value}, name: `bobberDensity`}),
   bobberDensityWin);
};

const renderCustomWindow = ({useCustomWindow, customWindow}) => {
  const select = elt(`select`, {name: `customWindow`, disabled: !useCustomWindow, value: customWindow});
  const renderUseCustomWindow = elt(`input`, {name: `useCustomWindow`, type: `checkbox`, checked: useCustomWindow});

  if(useCustomWindow) {
    ipcRenderer.invoke('get-all-windows')
    .then((windows) => {
      windows.forEach(({title}) => {
        select.append(elt(`option`, { selected: title == customWindow }, title));
      })
    });
  }
  return elt(`div`, null, renderUseCustomWindow, select);

};

const renderAfterTimer = ({afterTimer}) => {
  let options = [
    `Stop`,
    `HS`,
    `Quit`,
    `HS + Quit`
  ]
  return elt('select', {value: afterTimer, name: "afterTimer"}, ...options.map(option => elt(`option`, {value: option, selected: option == afterTimer}, option)));
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

const renderMammothTraderName = ({mammoth, mammothTraderName}) => {
    return elt('input', {type: `text`, disabled: !mammoth, name: `mammothTraderName`, value: mammothTraderName});
};

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
  return elt(`div`, {"data-collection": `rngMoveRadiusMax`}, elt(`span`, {className: `option_text`}, `x:`),
  elt('input', {type: `number`, name: `x`, value: rngMoveRadiusMax.x, disabled: !rngMove}), elt(`span`, {className: `option_text`}, `y:`),
  elt('input', {type: `number`, name: `y`, value: rngMoveRadiusMax.y, disabled: !rngMove})
  );
};

const renderRngMoveRadiusStep = ({rngMove, rngMoveRadiusStep}) => {
  return elt(`div`, {"data-collection": `rngMoveRadiusStep`}, elt(`span`, {className: `option_text`}, `x:`),
  elt('input', {type: `number`, name: `x`, value: rngMoveRadiusStep.x, disabled: !rngMove}), elt(`span`, {className: `option_text`}, `y:`),
  elt('input', {type: `number`, name: `y`, value: rngMoveRadiusStep.y, disabled: !rngMove})
  );
};

const renderRngMoveDirLengthMax = ({rngMove, rngMoveDirLengthMax, rngMoveKeys}) => {
  return elt(`div`, {"data-collection": `rngMoveDirLengthMax`},
      elt(`span`, {className: `option_text`}, `w:`), elt(`input`, {disabled: !rngMove || !rngMoveKeys, type: `number`, step: 1, name: `w`, value: rngMoveDirLengthMax.w}),
      elt(`span`, {className: `option_text`}, `s:`), elt(`input`, {disabled: !rngMove || !rngMoveKeys, type: `number`, step: 1, name: `s`, value: rngMoveDirLengthMax.s}),
      elt(`span`, {className: `option_text`}, `a:`), elt(`input`, {disabled: !rngMove || !rngMoveKeys, type: `number`, step: 1, name: `a`, value: rngMoveDirLengthMax.a}),
      elt(`span`, {className: `option_text`}, `d:`), elt(`input`, {disabled: !rngMove || !rngMoveKeys, type: `number`, step: 1, name: `d`, value: rngMoveDirLengthMax.d})
    );
};

const renderRngMoveDirLength = ({rngMove, rngMoveDirLength, rngMoveKeys}) => {
  return elt(`div`, {"data-collection": `rngMoveDirLength`}, elt(`span`, {className: `option_text`}, `from:`),
  elt('input', {type: `number`, className: `rngMoveTimer_from`, name: `from`, value: rngMoveDirLength.from, disabled: !rngMove || !rngMoveKeys}), elt(`span`, {className: `option_text`}, `to:`),
  elt('input', {type: `number`, name: `to`, value: rngMoveDirLength.to, disabled: !rngMove || !rngMoveKeys})
  );
};

const renderRngMoveBalanceTime = ({rngMove, rngMoveBalanceTime}) => {
  return elt(`input`, {disabled: !rngMove,type: `number`, value: rngMoveBalanceTime, name: `rngMoveBalanceTime`});
};

const renderAutoSensDens = ({autoSensDens, game}) => {
  return elt(`input`, {type: `checkbox`, disabled: game == `Vanilla (splash)`, checked: autoSensDens, name: `autoSensDens`});
}

const renderSettings = (config) => {
  return elt('section', {className: `settings settings_advSettings`},
  elt(`p`, {className: `settings_header advanced_settings_header`}, `General`),
  elt('div', {className: "settings_section"},
  wrapInLabel(`Like a human: `, renderLikeHuman(config), `The bot will move your mouse in a human way: random speed and with a slight random deviation in the movement. Otherwise it will move the mouse instantly, which might be a better option if you use a lot of windows.`),
  wrapInLabel(`Like a human fine-tunning: `, renderLikeHumanFineTune(config), `The bot will "fine-tune" the mouse position after moving to the bobber, imitating a human-like way of reaching the mouse-movement target position.`),
  wrapInLabel(`Hide window after start: `, renderHideWin(config), `The window will be hidden and you will be able to stop it only by using stop key.`),
  wrapInLabel(`Custom window: `, renderCustomWindow(config), `If for some reason your game window isn't "World of Warcraft" you can choose a custom window from all the windows opened on your computer.`),
  wrapInLabel(`Close loot window with: `, renderCloseLoot(config), `The bot will use mouse/esc or randomly one of them to close the loot window while filtering the loot.`),
  wrapInLabel(`Mouse/keyboard random delay (ms): `, renderDelay(config), `The bot will generate a random number between the provided values. The number is generated every time bot utilizes your mouse or keyboard and represents the delay between pressing/releasing of mouse/keyboard clicks and pressing.`),
  wrapInLabel(`Random mouse speed: `, renderMouseMoveSpeed(config), `The bot will generate a random number between the provided values. The higher the value the faster the bot moves the cursor. Works only if Like a human option is on.`),
  wrapInLabel(`Random mouse curvature: `, renderMouseCurvature(config), `The bot will generate a random number between the provided values. The higher the value the stronger is the deviation of the movement. Works only if Like a human option is on.`),
  wrapInLabel(`Applying lures delay (ms):`, renderLuresDelay(config), `How much it takes the bot to apply the lure.`),
  wrapInLabel(`Applying ability delay (ms):`, renderSpareDelay(config), `How much it takes the bot to apply the spare.`),
  wrapInLabel(`Attempts limit: `, renderMaxAttempts(config), `How many times the bot will fail finding bobber before stopping.`),
  wrapInLabel(`Dynamic Threshold: `, renderDynamicThreshold(config), `After attempts limit the bot will dynamically change threshold by the provided value.`),
  wrapInLabel(`Highlight bobber (%): `, renderHighlightPercent(config), `How often the bot should highlight the bobber before checking on it (if in your game the bobber become brigther or more colourfull after highlighting, then change this value to 100% if you don't care for randomness)`),
  wrapInLabel(
    "Use shift+click: ",
    renderShiftClick(config),
    `Use shift + click instead of Auto Loot. Check this option if you don't want to turn on Auto Loot option in the game. Your "Loot key" in the game should be assigned to shift.`
  )),
  elt(`p`, {className: `settings_header`}, `Timer`),
  elt('div', {className: "settings_section"},
  wrapInLabel("Do after timer: ", renderAfterTimer(config),`What the bot should do after the timer elapses (you can set it in the main window)`),
  wrapInLabel("HS Key: ", renderHsKey(config), `A key your HS is assigned.`),
  wrapInLabel("HS Delay: ", renderHsKeyDelay(config), `How long it take to use HS`),
  wrapInLabel("Shut down computer after quitting: ", renderShutDown(config), `The bot will press Left Windows Key and launch command line, after that it will write shutdown -s -t 10 command which will shut down your computer in 10 seconds. `),
  ),
  elt(`p`, {className: `settings_header settings_header_premium`}, `🔊 Sound Detection`),
  elt('div', {className: "settings_section settings_premium"},
  wrapInLabel(`Use Sound Detection: `, renderSoundDetection(config), `The bot will check the change of sound instead of the change of pixels when it should catch the fish.`),
  wrapInLabel(`Sound Detection Range: `, renderSoundDetectionRange(config), `The strength of the noise created by jerking of the bobber`),
  ),
  elt(`p`, {className: `settings_header settings_header_premium`}, `📲 Remote Control`),
  elt(`div`, {className: `settings_section settings_premium`},
    wrapInLabel(`Telegram token:`, renderTmApiKey(config), `Provide telegram token created by t.me/BotFather and press connect.`),
    wrapInLabel(`Detect whisper:`, renderDetectWhisper(config), `The bot will analyze Chat Zone for Whisper Threshold purple colors, if it finds any it will notifiy telegram bot you connected through token.`),
    wrapInLabel(`Stop and close the game at whisper:`, renderCloseAtWhisper(config), `Whether to stop the bot and close the window if someone whispered.`),
    wrapInLabel(`Whisper Threshold:`, renderWhisperThreshold(config), `The intensity of purple color the bot will recognize as whispering.`),
    wrapInLabel(`Chat zone (%):`, renderChatZone(config), `The same logic as with Fishing Zone. The bot will analyze this zone for Whisper Threshold purple colors.`),
  ),
  elt(`p`, {className: `settings_header settings_header_premium`}, `🎮 Arduino Control`),
  elt('div', {className: "settings_section settings_premium"},
  wrapInLabel(`Use Arduino Board: `, renderArduino(config), `Using an Arduino Board will allow you to emulate a device in 100% hardware way: it will look like a real keyboard or mouse to the OS and the game. Check the guide on how to use an Arduino Board with AutoFish (Help -> Arduino Guide)`),
  wrapInLabel(`COM Port: `, renderArduinoPort(config), `Choose the COM port of the Arduino Board connected to your computer and press Connect button.`),
  wrapInLabel(`Bits Per Second: `, renderArduinoRate(config), `Don't change this value if you don't know what you are doing. The value should be the same as in Arduino Sketch provided in the guide (you can find it in the top of the sketch)`)
  ),
  elt(`p`, {className: `settings_header settings_header_premium`}, `🤖 Random Movement`),
  elt('div', {className: "settings_section settings_premium"},
  wrapInLabel(`Use Random Camera Movement`, renderRngMove(config), `The bot will move your camera view and the character within the given x and y radius and within w, a, s, d keys (press/release) delay.`),
  wrapInLabel(`Camera Movement Max (px):`, renderRngMoveRadiusMax(config), `Maximum radius the bot will randomly move your camera.`),
  wrapInLabel(`Camera Movement Step (px):`, renderRngMoveRadiusStep(config), `Size of the step the bot will move your camera. The bot wil choose a random value between -value and +value and move your camera by the given value.`),
  wrapInLabel(`Use Random Keys Movement`, renderRngMoveKeys(config), `The bot will move your character within the delays of w, a, s, d keys (how the key is pressed)`),
  wrapInLabel(`Keys Moves Max:`, renderRngMoveDirLengthMax(config), `Maximum delay of how long the bot will press w, s, a, d keys.`),
  wrapInLabel(`Keys Moves Step:`, renderRngMoveDirLength(config), `Step delay of how long the bot will press w, s, a, d keys.`),
  wrapInLabel(`Repeat Every (min): `, renderRngMoveTimer(config), `How often the bot should use random camera view and character position.`),
  wrapInLabel(`Balance Every (min):`, renderRngMoveBalanceTime(config), `How often the bot should balance its position and camera direction to default values.`),
),
  elt(`p`, {className: `settings_header settings_header_premium`}, `🐘 Mammoth Selling`),
  elt('div', {className: "settings_section settings_premium"},
  wrapInLabel(`Use mammoth for selling: `, renderMammoth(config), `You can summon a mammoth carrying traders during the fishing and then sell all the scrap to one of them using any addon for selling such scrap.`),
  wrapInLabel(`Mammoth Key: `, renderMammothKey(config), `A key that will be used to summon a mammoth mount.`),
  wrapInLabel(`Mammoth Key Delay(ms): `, renderMammothKeyDelay(config), `How long the bot will wait after summoning a mammoth mount.`),
  wrapInLabel(`Mammoth Sell Delay(ms): `, renderMammothSellDelay(config), `How long it will take to sell all the scrap to a trader. The bot will generate a random number from the provided values. The number is generated every time the bot interacts with the trader: so the next time the bot interacts with the trader it will be always different (randomly generated).`),
  wrapInLabel(`Mammoth Apply Every(min): `, renderMammothApplyEvery(config), `A randomly generated interval of summoning a mammoth mount. The bot will summon a mammoth and then generate a new random value between the provided ones.`),
  wrapInLabel(`Mammoth Trader Name: `, renderMammothTraderName(config), `The bot will use /target trader_name command to target one of your traders. Check the name of one you want to use for trading and write it here. The bot will use interaction key for interaction with a trader, you can assign it in them main settings.`),
  ),
  elt(`p`, {className: `settings_header`}, `Miss on purpose`),
  elt('div', {className: "settings_section"},
  wrapInLabel(`Miss on purpose: `, renderMissOnPurpose(config), `The bot will miss fish on purpose to simulate a human mistake. The value is % chance per cast that the bot will miss (it's not % of the whole session, so it might be drastically different). This functionality might decrease chances of being detected`),
  wrapInLabel(`Random Miss on purpose: (%)`, renderMissOnPurposeRandom(config), `The bot will generate a random number from the provided values. The number is generated every fishing session: so the next time you start the bot, it will be always different (randomly generated) between the given values.`),
  ),
  elt(`p`, {className: `settings_header`}, `Logging out`),
  elt('div', {className: "settings_section"},
  wrapInLabel(`Log out/Log in:`, renderLogOut(config), `The bot will log out from the game after the given time, wait for a couple of minutes and log back to the game. This functionality might decrease chances of being detected.`),
  wrapInLabel(`Random Log out every: (min)`, renderLogOutEvery(config), `The bot will generate a random number from the provided values. The number is generated every time the bot logs out: so the next time the bot logs out, it will be always different (randomly generated).`),
  wrapInLabel(`Random Log out for: (sec)`, renderLogOutFor(config), `How long the bot should be stayed logged out. The bot will generate a random number from the provided values. The number is generated every time the bot logs out: so the next time the bot logs out, it will be always different (randomly generated).`),
  wrapInLabel(`Random Log out after: (sec)`, renderLogOutAfter(config), `How long the bot should wait before starting fishing again. The bot will generate a random number from the provided values. The number is generated every time the bot logs out: so the next time the bot logs out, it will be always different (randomly generated).`),
  ),
  elt(`p`, {className: `settings_header`}, `Random sleep`),
  elt('div', {className: "settings_section"},
  wrapInLabel(`Random sleep:`, renderRandomSleep(config), `The bot will sleep randomly from time to time for the random duration.`),
  wrapInLabel(`Random sleep every (min):`, renderRandomSleepEvery(config), `The bot will generate a random number from the provided values. The number is generated every time the bot goes to sleep: so the next time the bot goes to sleep it will be always different (randomly generated).`),
  wrapInLabel(`Random sleep for (ms):`, renderRandomSleepDelay(config), `The bot will generate a random number from the provided values. The number is generated every time the bot goes to sleep: so the next time the bot goes to sleep it will be always different(randomly generated).`)
  ),
  elt(`p`, {className: `settings_header`}, `Random reaction`),
  elt('div', {className: "settings_section"},
  wrapInLabel(`Reaction:`, renderReaction(config), `Randomise reaction time before any action.`),
  wrapInLabel(`Reaction random delay (ms):`, renderReactionDelay(config), `The bot will generate a random number from the provided values. The number is generated every time the bot needs to move/press/click something: so the next time the bot uses your mouse/keyboard the reaction time will be always different(randomly generated)`)),
  elt(`p`, {className: `settings_header`}, `Sleep after hook`),
  elt('div', {className: "settings_section"},
  wrapInLabel(`Sleep After hook:`, renderSleepAfterHook(config), `The bot will sleep after it hooked the fish for the random duration.`),
  wrapInLabel(`After hook random delay (ms): `, renderAfterHookDelay(config), `The bot will generate a random number from the provided values. The number is generated every time the bot hooked the fish.`),
  ),
  elt(`p`, {className: `settings_header settings_header_critical`}, `Critical`),
  elt('div', {className: "settings_section settings_critical"},
  wrapInLabel(`Ignore Preliminary Checks:`, renderIgnorePreliminary(config), `The bot will ignore all the preliminary checks including notification errors.`),
  wrapInLabel(`Loot Window Closing Delay (ms):`, renderCloseLootDelay(config), `How much does it take for the loot window to disappear after looting.`),
  wrapInLabel(`Max Check Time (ms):`, renderMaxFishTime(config), `Maximum time the bot will wait for the bobber to jerk before casting again.`),
  wrapInLabel(`Do after Max Check Time:`, renderMaxFishTimeAfter(config), `What the bot should do if it reaches the maximum checking time.`),
  wrapInLabel(`Auto-adjust Density and Sensitivity:`, renderAutoSensDens(config), `The bot will auto-adjust both Sensitivity and Density values per each cast.`),
  wrapInLabel(`${config.game == `Vanilla (splash)` ? `Splash` : `Bobber`} Sensitivity (px):`, renderBobberSensitivity(config), config.game != `Vanilla (splash)` ? `How sensitive the bot is to any movements of the bobber. If the bot often clicks too early, decrease this value (don't confuse it with when the bot missclicks on purpose). If the bot often doesn't react to bobber, increase this value.` : `The size of the zone which will be checked for splash, if the bot doesn't react to "plunging" animation - increase this value.`),
  config.game == `Vanilla (splash)` ? wrapInLabel(`Splash color: `, renderSplashColor(config), `Whitness of the splash effect: should be smaller at night and higher during the day. `) : ``,
  wrapInLabel(`Bobber Density (px):`, renderBobberDensity(config), `Density decides where exactly the bot sticks on the feather. The larger the feather the larger the value should be. This value is mostly for 4k resolution users and if the bot clicks too early.`),
  wrapInLabel(`Bobber Check Time (ms):`, renderCheckingDelay(config), `How often the bot checks the bobber for any movements. Use this option in addition to Bobber Sensativity to find an optimal sensitivity.`),
  wrapInLabel(`Fishing Zone (%):`, renderRelZone(config), `A zone in which the bot looks for the bobber. The values are percentages of the dimensions of the window: 0.3 = 30%, 0.4 = 40% etc.`),
  wrapInLabel(`Cast Animation Delay (ms):`, renderCastDelay(config), `How long the bot will wait before starting to look for the bobber in the fishing zone. This value is related to appearing and casting animations.`),
  wrapInLabel(`Looking For Bobber Direction:`, renderFindBobberDirection(config), `The direction how the bot will look for the bobber in the fishing zone. Normal means from left to right and from top to bottom, Reverse means from left to right and from bottom to top, Center means from the very center of the Fishing Zone to its borders.`),
  ));
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
      console.log(config.arduinoPort, config.arduinoRate);
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

    if(event.target.name == `soundDetection` && event.target.checked) {
      ipcRenderer.send("sound-warn");
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
    if(event.target.name == `mammothKey` || event.target.name == `hsKey` && !event.target.disabled) {
      event.target.style.backgroundColor = `rgb(255, 104, 101)`;
      event.target.style.border = `1px solid grey`;

      event.target.addEventListener(`blur`, function bluring(event) {
        event.target.style.backgroundColor = `white`;
        event.target.style.border = `1px solid grey`;
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
