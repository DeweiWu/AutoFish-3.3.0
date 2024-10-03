const { ipcRenderer, shell } = require("electron");
const elt = require("../../ui/utils/elt.js");
const wrapInLabel = require("../../ui/utils/wrapInLabel.js");
const { SerialPort } = require(`serialport`);
const keySupport = require("./../../utils/keySupport.js");
const { hexToRgb, rgbToHex } = require("./../../utils/colors.js");

let spareNumber;


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
  return elt(`input`, {type: `checkbox`, checked: highlightPercent, name: `highlightPercent`});
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

const renderArduino = ({arduino, streamMode}) => {
    return elt(`input`, {type: `checkbox`, disabled: streamMode, checked: arduino, name: `arduino`});
};

const renderArduinoPort = ({arduino, arduinoPort}) => {
    let select = elt(`select`, {disabled: !arduino, className: `arduino_select`, name: `arduinoPort`});
    SerialPort.list()
    .then((list) => list.forEach((port) => select.append(elt(`option`, {selected: arduinoPort == port.path, value: port.path}, port.friendlyName))));
    return elt(`div`, null, select, elt(`input`, {type: `button`, disabled: !arduino, className: `${!arduino ? `disabledButtonPremium` : ``}`, value: `Connect`, id:`arduino`}));
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

const renderLikeHumanHover = ({likeHumanHover = 2, arduino, likeHuman}) => {
  const winRange = elt(`input`, {type: `number`, value: likeHumanHover, name: "likeHumanHover", disabled: !likeHuman || arduino})
  const range = elt('input', {type: `range`, min: 0, className: !likeHuman || arduino ? `threshold_disabled` : ``, max: 100, value: likeHumanHover, disabled: !likeHuman || arduino, oninput: function() {winRange.value = this.value}, name: "likeHumanHover"});
  return elt(`div`, null, range, winRange);
}

const renderCastDelay = ({castDelay}) => {
  return elt(`div`, {"data-collection": `castDelay`}, elt(`span`, {className: `option_text`}, `from:`),
     elt('input', {type: `number`, name: `from`, value: castDelay.from}), elt(`span`, {className: `option_text`}, `to:`),
     elt('input', {type: `number`, name: `to`, value: castDelay.to}));
};

const renderLogOut = ({logOut}) => {
  return elt('input', {type: `checkbox`, name: `logOut`, checked: logOut})
};

const renderLogOutDoAfter = ({logOut, logOutDoAfter, logOutDoAfterKey}) => {
  const checkbox = elt('input', {type: 'checkbox', checked: logOutDoAfter, name: `logOutDoAfter`, disabled: !logOut });
  const key = elt('input', {type: `text`, disabled: !logOut || !logOutDoAfter, name: `logOutDoAfterKey`, value: logOutDoAfterKey});
  key.setAttribute(`readonly`, `true`);
  return elt('div', null, checkbox, key);
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
  return elt(`div`, {"data-collection": `maxFishTime`}, elt(`span`, {className: `option_text`}, `from:`),
     elt('input', {type: `number`, name: `from`, value: maxFishTime.from}), elt(`span`, {className: `option_text`}, `to:`),
     elt('input', {type: `number`, name: `to`, value: maxFishTime.to}));
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

const renderStreamDevice = ({streamMode, streamDevice}) => {
  const select = elt(`select`, {name: `streamDevice`, className: `streamSelect`, disabled: !streamMode});
  const renderUseStreamMode = elt(`input`, {name: `streamMode`, type: `checkbox`, checked: streamMode});

  if(streamMode) {
    navigator.mediaDevices.enumerateDevices()
    .then(devices => {
      devices
      .filter(device => device.kind === 'videoinput')
      .forEach(device => {
          select.append(elt(`option`, { selected: device.deviceId == streamDevice, value: device.deviceId }, device.label));
      })
    })
  }
  return elt(`div`, null, renderUseStreamMode, select);
};

const renderPicoIp = ({streamMode, picoip}) => {
  const focusButton = elt(`input`, {type: `button`, value: `Connect`,  id: 'pico', className: `${streamMode ? `` : `disabledButton`}`, disabled: !streamMode, onclick() {
    ipcRenderer.send('ping-pico');
  }});
  return elt('div', null, elt('input', {type: 'text', value: picoip, className: 'picoip', name: 'picoip', disabled: !streamMode}), focusButton);
};

const renderStreamScreenSize = ({streamMode, streamScreenSize}) => {
  return elt(`div`, {"data-collection": `streamScreenSize`}, elt(`span`, {className: `option_text`}, `width:`),
  elt('input', {type: `number`, name: `width`, value: streamScreenSize.width, disabled: !streamMode}), elt(`span`, {className: `option_text`}, `height:`),
  elt('input', {type: `number`, name: `height`, value: streamScreenSize.height, disabled: !streamMode})
  );
}

const renderCustomWindow = ({useCustomWindow, customWindow, streamMode}) => {
  const select = elt(`select`, {name: `customWindow`, className: `customWindow`, disabled: !useCustomWindow});
  const renderUseCustomWindow = elt(`input`, {name: `useCustomWindow`, type: `checkbox`, checked: useCustomWindow, disabled: streamMode});
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

const renderHsKey = ({timer, hsKey, afterTimer}) => {
  const key = elt('input', {type: `text`, name: `hsKey`, disabled: !timer || (afterTimer != `HS` && afterTimer != `HS + Quit`), value: hsKey});
  key.setAttribute(`readonly`, `true`);
  return key;
};

const renderHsKeyDelay = ({timer, hsKeyDelay, afterTimer}) => {
  return elt(`input`, {type: `number`, value: hsKeyDelay, disabled: !timer || (afterTimer != `HS` && afterTimer != `HS + Quit`), name: `hsKeyDelay`})
}

const renderShutDown = ({timer, timerShutDown, afterTimer}) => {
  return elt(`input`, {type: `checkbox`, checked: timerShutDown, disabled: !timer || (afterTimer != `Quit` && afterTimer != `HS + Quit`), name: `timerShutDown`});
};

const renderTmApiKey = ({tmApiKey}) => {
  return elt('div', null, elt('input', {type: `text`, name: `tmApiKey`, value: tmApiKey, className: `tmApiKey`}), elt('input', {type: `button`, value: `Connect`, id: `tm`}));
};

const renderTmUsername = ({tmUseUsername = false, tmUsername = ``}) => {
  const checkbox = elt('input', {type: `checkbox`, checked: tmUseUsername, name: 'tmUseUsername'});
  const text = elt('input', {type: `text`, style: `width: 100px;`,disabled: !tmUseUsername, value: tmUsername, name: 'tmUsername'});
  return elt('div', null, checkbox, text);
};

const renderDetectWhisper = ({detectWhisper}) => {
  return elt('input', {type: `checkbox`, checked: detectWhisper, name: `detectWhisper`});
};

const renderWhisperColors = ({detectWhisper, whispSpecColors}) => {
  const addButton = elt(`input`, {type: `button`, className: `whispSpecColorsAdd`, onclick() {
    const colorBox = elt('input', {type: `color`, className: `whisperColorBox`, value: `#ffffff`});
    const colorPicker = elt('input', {type: `button`, className: `whisperColorPicker`, value: ``, onclick() {
      ipcRenderer.invoke('start-bot', 'pointZone').then((data) => {
        if(!data) {
          return;
        }
        const {r, g, b} = data.color;
        colorBox.value = rgbToHex(r, g, b);
      })
    }});

    const colorPercent = elt('input', {type: `number`, title: `Tolerance: % of how closely other colors must match the chosen color.`, value: 100, min: 0, max: 100, className: `whisperColorRange`});
    const removeButton = elt('input', {type: `button`, className: `whisperColorRemoveButton`, onclick() {
      this.parentNode.remove();
    }})

    this.parentNode.insertBefore(elt('div', {className: `whispSpecColorsInnerContainer`}, colorPicker, colorBox, colorPercent, removeButton), this);
  }})

  const whispSpecColorsNodes = whispSpecColors.map(({r, g, b, percent}) => {
    const colorBox = elt('input', {type: `color`, className: `whisperColorBox`, value: rgbToHex(r, g, b)});
    const colorPicker = elt('input', {type: `button`, className: `whisperColorPicker`, value: ``, onclick() {
      ipcRenderer.invoke('start-bot', 'pointZone').then((data) => {
        if(!data) {
          return;
        }
        const {r, g, b} = data.color;
        colorBox.value = rgbToHex(r, g, b);
      })
    }});

    const colorPercent = elt('input', {type: `number`, title: `Tolerance: % of how closely other colors must match the chosen color.`, value: percent, min: 0, max: 100, className: `whisperColorRange`});
    const removeButton = elt('input', {type: `button`, className: `whisperColorRemoveButton`, onclick() {
      this.parentNode.remove();
    }})

    return elt('div', {className: `whispSpecColorsInnerContainer`}, colorPicker, colorBox, colorPercent, removeButton);
  })

return elt(`div`, {className: `whispSpecColorsContainer`}, ...whispSpecColorsNodes, addButton)
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

const renderManualPositionOnBobber = ({manualPositionOnBobberOn, manualPositionOnBobber}) => {
  let checkbox = elt(`input`, {type: `checkbox`, name: `manualPositionOnBobberOn`, checked: manualPositionOnBobberOn});
  let input = elt(`input`, {type: `number`, min: 0, max: 100, name: `manualPositionOnBobber`, disabled: !manualPositionOnBobberOn, value: manualPositionOnBobber});
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
      if(!data) {
        return;
      }
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
      if(!data) {
        return;
      }
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


const renderSkills = ({aggroCheck, skills}) => {

  const addButton = elt('input', {type: 'button', className: `spares-addButton ${!aggroCheck ? `disabledButtonPremium add_button_disabled` : ``}`, onclick() {
    if(!aggroCheck) return;
    let key = elt('input', {type: 'text', value: `1`, className: "spares-key", name: `spareKey`, "data-skills": "key"});
    key.setAttribute('readonly', true);

    const x = elt('input', {type: `number`, "data-skills": "x", value: 0});
    const y = elt('input', {type: `number`, "data-skills": "y", value: 0})

    const colorPicker = elt('input', {type: `color`, className: `whisperColorBox`, value: rgbToHex(255, 255, 255), "data-skills": "color"})
    const precision = elt('input', {type: `number`, value: 95, title: `How accurate the color should be`, "data-skills": "precision"})

    const coordsButton = elt('input', {type: `button`, className: `whisperColorPicker`, onclick() {
      ipcRenderer.invoke('start-bot', 'pointZone').then((data) => {
        if(!data) {
          return;
        }
        x.value = data.x;
        y.value = data.y;
        const {r, g, b} = data.color;
        colorPicker.value = rgbToHex(r, g, b);
      })
    }});

    this.parentNode.insertBefore(elt('form', {className: "skillsContainer"},
      elt(`div`, {className: `skills-inner`},
        wrapInLabel('Do only once: ', elt('input', {type: `checkbox`, checked: false, "data-skills": "once"}), `Cast skill only once during rotation.`),
        wrapInLabel('Range Only: ', elt('input', {type: `checkbox`, checked: false, "data-skills": "rangeonly"}), `If your skill doesn't work in melee mode and requires your character to be far from the enemy, turn this value on. For example if it's a range hunter's skill, which works ONLY if target is far from you. The bot will not use this skill to check if it's close enough to the enemy.`),
        wrapInLabel(`Key: `, key, `Same key you've bound your skill to in the game.`),
        wrapInLabel(`Skill Position: `, elt(`div`, {style: `margin: 0`},elt('span', {style: `margin: 0 5px;`}, `x: `), x, elt('span', {style: `margin-right: 5px;`}, `y: `), y, elt('span', {style: `margin-right: 5px;`}, `acc: `), precision, coordsButton, colorPicker), `This should be pointed at skill icon (best at the top of the skill icon to avoid cooldown animations), which in turn should have some range indication with either addons like bartender/tullarange or by pointing at number of the skill (which is range indicator by default).\n\nAcc: accuracy of the color. Lower it if your skill isn't solid and slightly transparent, making it always a little bit different. `),
        wrapInLabel(`Execution/Cast/GCD Time (sec):`, elt(`input`, {type: `number`, value: 1.5, "data-skills": "delay"}), `Delay of how long the skill is being cast, or global cooldown value.`),
        wrapInLabel(`Cooldown Time (sec): `, elt(`input`, {type: `number`, value: 1, "data-skills": "cooldown"}), `Cooldown of your skill, usually can be found in the description of the skill.`),

        elt('input', {type: 'button', className: `skills-removeButton`, onclick() {
          this.parentNode.parentNode.remove();
        }}),
      ),
    ), this);
  }});

  const skillsNodes = skills.map((skill) => {
    const key = elt('input', {type: 'text', value: skill.key, className: "spares-key", name: `spareKey`, "data-skills": "key"});

    const x = elt('input', {type: `number`, "data-skills": "x", value: skill.x});
    const y = elt('input', {type: `number`, "data-skills": "y", value: skill.y})

    const colorPicker = elt('input', {type: `color`, className: `whisperColorBox`, value: skill.color, "data-skills": "color"})

    if(skill.precision < 0) skill.precision = 0;
    if(skill.precision > 100) skill.precision = 100;

    const precision = elt('input', {type: `number`, value: skill.precision, "data-skills": "precision"})

    const coordsButton = elt('input', {type: `button`, className: `whisperColorPicker`, onclick() {
      ipcRenderer.invoke('start-bot', 'pointZone').then((data) => {
        if(!data) {
          return;
        }
        x.value = data.x;
        y.value = data.y;
        const {r, g, b} = data.color;
        colorPicker.value = rgbToHex(r, g, b);
      })
    }});

    key.setAttribute('readonly', true);
    return elt('form', {className: "skillsContainer"},
      elt(`div`, {className: `skills-inner`},
        wrapInLabel('Do only once: ', elt('input', {type: `checkbox`, checked: skill.once, "data-skills": "once"}), `Cast skill only once during rotation.`),
        wrapInLabel('Range Only: ', elt('input', {type: `checkbox`, checked: skill.rangeonly, "data-skills": "rangeonly"}), `If your skill doesn't work in melee mode and requires your character to be far from the enemy, turn this value on. It will not use this skill to check if it's close enough to the enemy.`),
        wrapInLabel(`Key: `, key, `Same key you've bound your skill to in the game.`),
        wrapInLabel(`Skill Position: `, elt(`div`, {style: `margin: 0`}, elt('span', {style: `margin: 0 5px;`}, `x: `), x, elt('span', {style: `margin-right: 5px;`}, `y: `), y, elt('span', {style: `margin-right: 5px;`}, `acc: `), precision, coordsButton, colorPicker), `This should be pointed at skill icon (best at the top of the skill icon to avoid cooldown animations), which in turn should have some range indication with either addons like bartender/tullarange or by pointing at number of the skill (which is range indicator by default).\n\nAcc: accuracy of the color. Lower it if your skill isn't solid and slightly transparent, making it always a little bit different. `),
        wrapInLabel(`Execution/Cast/GCD Time (sec): `, elt(`input`, {type: `number`, value: skill.delay, "data-skills": "delay"}), `Cast time or global cool down time.`),
        wrapInLabel(`Cooldown Time (sec): `, elt(`input`, {type: `number`, value: skill.cooldown, "data-skills": "cooldown"}), `Cooldown of your skill, usually can be found in the description of the skill.`),

        elt('input', {type: 'button', className: `skills-removeButton`, onclick() {
          this.parentNode.parentNode.remove();
        }}),
      ),
    )
  });

  return elt('div', {className: `sparesContainer`}, ...skillsNodes, addButton);
};

const renderAggroCheckControlBy = ({aggroCheck, aggroCheckControlBy}) => {
  let types = ['Mouse', 'Keyboard'];
  return elt('select', {name: 'aggroCheckControlBy', disabled: !aggroCheck},  ...types.map(type => elt('option', {selected: type == aggroCheckControlBy}, type)))
};

/* REAL SPARES */
const renderSpares = ({spares}) => {

  const types = ['Press Key', "Move Mouse", "Move Mouse + Left Click", "Move Mouse + Right Click", "Drag Mouse By Right", "Drag Mouse By Left", "Left Click", "Right Click", "Middle Click", "Print Text", "Sleep"];
  const conditions = ['Pixel Color TRUE', 'Pixel Color FALSE', 'Chance'];
  const addButton = elt('input', {type: 'button', className: "spares-addButton", onclick() {
    let key = elt('input', {type: 'text', value: `1`, className: "spares-key", name: `spareKey`,"data-spares": "key"});
    key.setAttribute('readonly', true);

    const x = elt('input', {type: `number`, style: `display: none`, "data-spares": "x", value: 0});
    const y = elt('input', {type: `number`, style: `display: none`, "data-spares": "y", value: 0})

    const text = elt('input', {type: `text`, className: `spares-text`, style: `display: none`, "data-spares": "text", value: ``})
    const colorPicker = elt('input', {type: `color`, className: `spares-color-picker`, value: rgbToHex(255, 255, 255), "data-spares": "color", style:  `display: none`})
    const precision = elt('input', {type: `number`, value: 100, style: `cursor: help; display: none`, title: `How accurate the color should be`, "data-spares": "precision"})

    const chanceWin = elt(`input`, {type: `number`, value: 100, "data-spares": "chance"})
    const chanceRange = elt('input', {type: `range`, max: 100, min: 1, step: 1, value: 100, oninput: function() {chanceWin.value = this.value}, "data-spares": "chance"});
    const chanceContainer =  elt(`div`, {style: `display: none`}, chanceRange, chanceWin);

    const delayContainer = elt('div', null, elt('span', {style: `margin-right: 5px`}, `from: `), elt(`input`, {type: `number`, value: 1, "data-spares": "delayFrom"}), elt('span', {style: `margin-right: 5px`}, `to: `), elt(`input`, {type: `number`, value: 3, "data-spares": "delayTo"}))

    const coordsButton = elt('input', {type: `button`, style: `display: none`, value: `Set`, onclick() {
      ipcRenderer.invoke('start-bot', 'pointZone').then((data) => {
        if(!data) {
          return;
        }
        x.value = data.x;
        y.value = data.y;
        const {r, g, b} = data.color;
        colorPicker.value = rgbToHex(r, g, b);
      })
    }});

    this.parentNode.insertBefore(elt('form', {className: "spareContainer"},
      elt(`div`, {className: `spare-inner`, style: ``},
        wrapInLabel(``, elt('input', { className: "spares-description", value: `Action №${spareNumber++}`,"data-spares": "description"}), ``, 'description-inner'),
        wrapInLabel(`Execute After Action Above`, elt(`input`, {type: `checkbox`, disabled: spareNumber == 2, checked: false, "data-spares": "execute"}), `The action will be executed just after the action or condition above.`),
        wrapInLabel(`Type:`, elt('select', { className: "spares-type", value: `Press Key`,"data-spares": "type"},
        elt('optgroup', {label: `Actions`}, ...types.map((type) => elt('option', {value: type}, type))),
        elt('optgroup', {label: `Conditions`}, ...conditions.map((type) => elt('option', {value: type}, type))),
      ),  `Press Key: the bot will press the same key bound to the action in the game.\nMove Mouse: the bot will move your cursor to the provided coordinates on the screen and make a click (if chosen).\nPrint Text: the bot will print the provided text.\nPixel Color: The bot will use the provided pixel on the screen as a condition (positive or negative: true or false) for the next actions.Any following actions should be used with "Execute after action above" option turned on if you need them under this condition.\nChance: the bot will execute all the inner actions only if random value lesser than the chosen one.Any following actions should be used with "Execute after action above" option turned on if you need them under this condition.\n`),
        wrapInLabel(`Key:`, elt('div', null, chanceContainer, precision, colorPicker, text, key, x, y, coordsButton), `Same key bound to the action in the game.` ),
        wrapInLabel(`Auto-confirm Action: `,  elt(`input`, {type: `checkbox`, checked: false, "data-spares": "autoconfirm"}), `If you want the bot to apply actions earlier than they expire, some games might require confirmation for this. If on, the bot will auto-confirm in such cases. You can also use a macro for the same (in the guide), in that case you don't need to turn on this option.`),
        wrapInLabel(`Omit Initial Application: `, elt(`input`, {type: `checkbox`, checked: false, "data-spares": "omitinitial"}), `Don't apply this action just after the bot started, wait until timer elapses.`),
        wrapInLabel(`Interval (min):`, elt('input', {type: 'number', value: 10, step: 0.1, "data-spares": "repeatTime"}), `Time after which the bot will apply action. The value is in minutes (you can use decimals for smaller values: 0.5)`),
        wrapInLabel(`Random Delay After Action (sec):`, delayContainer, `Delay after action.`),
        wrapInLabel(`Repeat (times):`, elt(`input`, {type: `number`, value: 1, "data-spares": "repeat"}), `How many times the bot should repeat this action consequentially (one after another).`),
        elt('input', {type: 'button', className: "spares-removeButton"})
      ),
    ), this);
  }});

  const sparesNodes = spares.map((spare, i) => {

    if(!spare.chance) {
      spare.chance = 100;
    }

    if(spare.repeat == null) {
      spare.repeat = 1;
    }

    if(spare.autoconfirm == null) {
      spare.autoconfirm = false;
    }

    if(!spare.x) {
      spare.x = 0;
    }

    if(!spare.y) {
      spare.y = 0;
    }

    if(!spare.key) {
      spare.key = `1`;
    }

    if(spare.text == null) {
      spare.text = ``;
    }

    if(!spare.color) {
      spare.color = `#ffffff`
    }

    if(!spare.precision) {
      spare.precision = 100;
    }

    const types = ['Press Key', "Move Mouse", "Move Mouse + Left Click", "Move Mouse + Right Click", "Drag Mouse By Right", "Drag Mouse By Left", "Left Click", "Right Click", "Middle Click", "Print Text", "Sleep"];
    const conditions = ['Pixel Color TRUE', 'Pixel Color FALSE', 'Chance'];
    const key = elt('input', {type: 'text', name: `spareKey`, style: `${spare.type == `Press Key` ? `` : `display: none;`}`, value: spare.key, className: "spares-key", "data-spares": "key"});

    const x = elt('input', {type: `number`, style: `${spare.type == `Move Mouse` || spare.type == `Drag Mouse By Right` || spare.type == `Drag Mouse By Left` || spare.type == `Pixel Color TRUE` || spare.type == `Pixel Color FALSE`  || spare.type == `Move Mouse + Left Click` ||  spare.type == `Move Mouse + Right Click` ? `` : `display: none;`}`,  "data-spares": "x", value: spare.x});
    const y = elt('input', {type: `number`, style: `${spare.type == `Move Mouse` || spare.type == `Drag Mouse By Right` || spare.type == `Drag Mouse By Left` || spare.type == `Pixel Color TRUE` || spare.type == `Pixel Color FALSE`  || spare.type == `Move Mouse + Left Click`  || spare.type == `Move Mouse + Right Click` ? `` : `display: none;`}`, "data-spares": "y", value: spare.y})

    const text = elt('input', {type: `text`, className: `spares-text`, style: `${spare.type == `Print Text` ? `` : `display: none`}`, "data-spares": "text", value: spare.text})
    const colorPicker = elt('input', {type: `color`, className: `spares-color-picker`, value: spare.color, "data-spares": "color", style: `${spare.type == `Pixel Color TRUE` || spare.type == `Pixel Color FALSE` ? `` : `display: none;`}`})


    const chanceWin = elt(`input`, {type: `number`, value: spare.chance, "data-spares": "chance"})
    const chanceRange = elt('input', {type: `range`, max: 100, min: 1, step: 1, value: spare.chance, oninput: function() {chanceWin.value = this.value}, "data-spares": "chance"});
    const chanceContainer =  elt(`div`, {style: `${spare.type == `Chance` ? `` : `display: none;`}`}, chanceRange, chanceWin);

    if(spare.precision < 0) spare.precision = 0;
    if(spare.precision > 100) spare.precision = 100;

    const precision = elt('input', {type: `number`, value: spare.precision, style: `${spare.type == `Pixel Color TRUE` || spare.type == `Pixel Color FALSE` ? `` : `display: none;`} cursor: help; margin-left: 3px;`, title: `How accurate the color should be in %`, "data-spares": "precision"})

    const delayContainer = elt('div', null, elt('span', {style: `margin-right: 5px`}, `from: `), elt(`input`, {type: `number`, value: spare.delayFrom, "data-spares": "delayFrom"}), elt('span', {style: `margin-right: 5px`}, `to: `), elt(`input`, {type: `number`, value: spare.delayTo, "data-spares": "delayTo"}))

    const coordsButton = elt('input', {type: `button`, style: `${spare.type == `Move Mouse` || spare.type == `Drag Mouse By Right` || spare.type == `Drag Mouse By Left` || spare.type == `Pixel Color TRUE` || spare.type == `Pixel Color FALSE`  || spare.type == `Move Mouse + Left Click` || spare.type == `Move Mouse + Right Click` ? `` : `display: none;`}`, value: `Set`, onclick() {
      ipcRenderer.invoke('start-bot', 'pointZone').then((data) => {
        if(!data) {
          return;
        }
        x.value = data.x;
        y.value = data.y;
        const {r, g, b} = data.color;
        colorPicker.value = rgbToHex(r, g, b);
      })
    }});

    key.setAttribute('readonly', true);

    let typeName;
    let typeHint;

    switch(true) {
      case spare.type == 'Press Key': {
        typeName = `Key: `;
        typeHint = `Same key bound to the action in the game.`;
        break;
      }

      case spare.type == `Move Mouse`: {
        typeName = `Coordinates: `;
        typeHint = `The bot will move your cursor to the provided coordinates on the screen.`
        break;
      }

      case spare.type == `Move Mouse + Left Click` || spare.type == `Move Mouse + Right Click`: {
        typeName = `Coordinates: `;
        typeHint = `The bot will move your cursor to the provided coordinates on the screen and make a chosen click.`
        break;
      }

      case spare.type == `Drag Mouse By Right` || spare.type == `Drag Mouse By Left`: {
        typeName = `Coordinates: `;
        typeHint = `The bot will drag your cursor to the provided coordinates on the screen. Left - left button. Right - right button.`
        break;
      }

      case spare.type == `Pixel Color TRUE` || spare.type == `Pixel Color FALSE`: {
        typeName = `Coordinates: `;
        typeHint = `The bot will use the provided pixel on the screen as a condition for the next actions. Any following actions should be used with "Execute after action above" option turned on if you need them under this condition.`;
        break;
      }

      case spare.type == `Print Text`: {
        typeName = `Text: `
        typeHint = `Text the bot will print. You can combine it with action: enter + print text + action: enter to write something in the chat (or action Move Mouse + Left Click on the chat)`;
        break;
      }

      case spare.type == `Chance`: {
        typeName = `Chance (%): `;
        typeHint = `The bot will apply any following actions under the condition of the given chance.`;
        break;
      }
    }

    return elt('form', {className: "spareContainer"},
      elt(`div`, {className: `spare-inner ${spare.execute ? `spare-execute` : ``}`, style: ``},
        wrapInLabel(``, elt('input', { className: "spares-description", value: spare.description, "data-spares": "description"}), ``, 'description-inner'),
        wrapInLabel(`Execute After Action Above`, elt(`input`, {type: `checkbox`, disabled: i == 0, checked: spare.execute && i != 0, "data-spares": "execute"}), `The action will be executed just after the action or condition above.`),
        wrapInLabel(`Type: `, elt('select', { className: "spares-type", value: spare.type, "data-spares": "type"},
        elt('optgroup', {label: `Actions`}, ...types.map((type) => elt('option', {selected: type == spare.type}, type))),
        elt('optgroup', {label: `Conditions`}, ...conditions.map((type) => elt('option', {selected: type == spare.type}, type))),
      ), `Press Key: the bot will press the same key bound to the action in the game.\nMove Mouse: the bot will move your cursor to the provided coordinates on the screen and make a click (if chosen).\nPrint Text: the bot will print the provided text.\nPixel Color: The bot will use the provided pixel on the screen as a condition (positive or negative: true or false) for the next actions. Any following actions should be used with "Execute after action above" option turned on if you need them under this condition.\n`),
        !typeName ? `` : wrapInLabel(typeName,
        elt('div', null, elt(`div`, null, x, y, coordsButton, colorPicker, precision), key, text, chanceContainer),
        typeHint, null,
        `${spare.type != `Press Key` && spare.type != `Print Text` && spare.type != `Move Mouse` && spare.type != `Move Mouse + Left Click` && spare.type != `Move Mouse + Right Click` && spare.type != `Pixel Color TRUE` && spare.type != `Pixel Color FALSE` && spare.type != `Chance` && spare.type != `Drag Mouse By Right` && spare.type != `Drag Mouse By Left` ? `display: none` : ``}`),

        spare.type != `Pixel Color FALSE` && spare.type != `Pixel Color TRUE` && spare.type != `Chance` ? wrapInLabel(`Auto-confirm Action: `, elt(`input`, {type: `checkbox`, checked: spare.autoconfirm, "data-spares": "autoconfirm"}), `If you want the bot to apply actions earlier than they expire, some games might require confirmation for this. If on, the bot will auto-confirm in such cases. You can also use a macro for the same (in the guide), in that case you don't need to turn on this option.`, null, `${spare.type == 'Sleep' ? `display: none` : ``}`) : ``,
        wrapInLabel(`Omit Initial Application: `, elt(`input`, {type: `checkbox`, disabled: spare.execute, checked: spare.omitinitial, "data-spares": "omitinitial"}), `Don't apply this action just after the bot started`),
        wrapInLabel(`Interval (min): `, elt('input', {type: 'number', disabled: spare.execute, value: spare.repeatTime, step: 0.1, "data-spares": "repeatTime"}), `Time after which the bot will apply action.`),
        wrapInLabel(`${spare.type == `Sleep` ? `Random Sleep Time (sec)` : `Random Delay After Action (sec)`}: `, delayContainer, `Delay after action.`, null, `${spare.type == `Pixel Color TRUE` || spare.type == `Pixel Color FALSE` || spare.type == 'Chance' ? `display: none` : ``}`),
        spare.type != `Pixel Color FALSE` && spare.type != `Pixel Color TRUE` && spare.type != `Chance` &&  spare.type != `Drag Mouse By Left` && spare.type != `Drag Mouse By Left` ? wrapInLabel(`Repeat (times): `, elt(`input`, {type: `number`, "data-spares": "repeat", value: spare.repeat}), `How many times the bot should repeat this action consequentially (one after another).`, null, `${spare.type == `Pixel Color TRUE` || spare.type == `Pixel Color FALSE` || spare.type == 'Move Mouse' || spare.type == "Move Mouse + Left Click" || spare.type == "Move Mouse + Right Click" || spare.type == "Sleep" ? `display: none` : ``}`) : ``,
        elt('input', {type: 'button', className: "spares-removeButton"})
      ),
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

const renderFilterConfidence = ({whitelist, filterConfidence}) => {
  const winRange = elt(`input`, {type: `number`, value: filterConfidence, disabled: !whitelist, name: "filterConfidence"})
  const range = elt('input', {type: `range`, max: 100, min: 1, step: 1, value: filterConfidence, className: `${!whitelist ? `threshold_disabled` : ``}`, disabled: !whitelist,  oninput: function() {winRange.value = this.value}, name: "filterConfidence"});
  return elt(`div`, null, range, winRange);
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

const renderCheckLogic = ({checkLogic}) => {
  const checkLogicTypes = ['default', 'pixelmatch'];
  const modeSelect = elt(`select`, {name: 'checkLogic', title: `Alternative modes for detecting bobber animation.`}, ...checkLogicTypes.map((logic) => elt('option', {selected: checkLogic == logic, value: logic}, logic[0].toUpperCase() + logic.slice(1))));
   return elt(`div`, null, modeSelect);
};

const renderAggroCheck = ({aggroCheck}) => {
  return elt('input', {type: `checkbox`, checked: aggroCheck, name: `aggroCheck`});
};

const renderAggroCheckUserHp = ({aggroCheck, aggroCheckUserHp}) => {

  const x = elt('input', {type: `number`, name: 'x', disabled: !aggroCheck, value: aggroCheckUserHp.x});
  const y = elt('input', {type: `number`, name: 'y', disabled: !aggroCheck, value: aggroCheckUserHp.y});
  const colorBox = elt('input', {type: `color`, className: `whisperColorBox ${!aggroCheck ? `colorPicker_disabled` : ``}`, disabled: !aggroCheck, name: 'color', value: aggroCheckUserHp.color});
  const precision = elt('input', {type: `number`, disabled: !aggroCheck, value: aggroCheckUserHp.precision, "data-skills": "precision"})

  const colorPicker = elt('input', {type: `button`, disabled: !aggroCheck, className: `whisperColorPicker ${!aggroCheck ? `disabledButtonPremium` : ``}`, value: ``, onclick() {
    ipcRenderer.invoke('start-bot', 'pointZone').then((data) => {
      if(!data) {
        return;
      }

      x.value = data.x;
      y.value = data.y;

      const {r, g, b} = data.color;
      colorBox.value = rgbToHex(r, g, b);
    })
  }});

  return elt('div', {"data-collection": `aggroCheckUserHp`}, elt('span', {style: `margin: 0 5px;`}, `x: `), x, elt('span', {style: `margin-right: 5px;`}, `y: `), y, elt('span', {style: `margin-right: 5px;`}, `t: `), precision, colorPicker, colorBox)

};

const renderDeathCheck = ({deathCheck}) => {
  return elt('input', {type: `checkbox`, checked: deathCheck, name: 'deathCheck'});
}

const renderDeathCheckHp = ({deathCheck, deathHp}) => {
    const x = elt('input', {type: `number`, name: 'x', disabled: !deathCheck, value: deathHp.x});
    const y = elt('input', {type: `number`, name: 'y', disabled: !deathCheck, value: deathHp.y});
    const colorBox = elt('input', {type: `color`, className: `whisperColorBox ${!deathCheck ? `colorPicker_disabled` : ``}`, disabled: !deathCheck, name: 'color', value: deathHp.color});
    const precision = elt('input', {type: `number`, disabled: !deathCheck, value: deathHp.precision, "data-skills": "precision"})

    const colorPicker = elt('input', {type: `button`, disabled: !deathCheck, className: `whisperColorPicker ${!deathCheck ? `disabledButtonPremium` : ``}`, value: ``, onclick() {
      ipcRenderer.invoke('start-bot', 'pointZone').then((data) => {
        if(!data) {
          return;
        }

        x.value = data.x;
        y.value = data.y;

        const {r, g, b} = data.color;
        colorBox.value = rgbToHex(r, g, b);
      })
    }});

    return elt('div', {"data-collection": `deathHp`}, elt('span', {style: `margin: 0 5px;`}, `x: `), x, elt('span', {style: `margin-right: 5px;`}, `y: `), y, elt('span', {style: `margin-right: 5px;`}, `t: `), precision, colorPicker, colorBox)
}

/*
const renderAggroCheckUserHpStart = ({aggroCheck, aggroCheckUserHpStart}) => {

  const x = elt('input', {type: `number`, name: 'x', disabled: !aggroCheck, value: aggroCheckUserHpStart.x});
  const y = elt('input', {type: `number`, name: 'y', disabled: !aggroCheck, value: aggroCheckUserHpStart.y});
  const colorBox = elt('input', {type: `color`, className: `whisperColorBox ${!aggroCheck ? `colorPicker_disabled` : ``}`, disabled: !aggroCheck, name: 'color', value: aggroCheckUserHpStart.color});
  const precision = elt('input', {type: `number`, disabled: !aggroCheck, value: aggroCheckUserHpStart.precision, name: 'precision'})

  const colorPicker = elt('input', {type: `button`, disabled: !aggroCheck, className: `whisperColorPicker ${!aggroCheck ? `disabledButton` : ``}`, value: ``, onclick() {
    ipcRenderer.invoke('start-bot', 'pointZone').then((data) => {
      if(!data) {
        return;
      }

      x.value = data.x;
      y.value = data.y;

      const {r, g, b} = data.color;
      colorBox.value = rgbToHex(r, g, b);
    })
  }});

  return elt('div', {"data-collection": `aggroCheckUserHpStart`}, elt('span', {style: `margin: 0 5px;`}, `x: `), x, elt('span', {style: `margin-right: 5px;`}, `y: `), y, elt('span', {style: `margin-right: 5px;`}, `acc: `), precision, colorPicker, colorBox)

};
*/

const renderAggroCheckEnemyHp = ({aggroCheck, aggroCheckEnemyHp}) => {

  const x = elt('input', {type: `number`, name: 'x', disabled: !aggroCheck, value: aggroCheckEnemyHp.x});
  const y = elt('input', {type: `number`, name: 'y', disabled: !aggroCheck, value: aggroCheckEnemyHp.y});
  const colorBox = elt('input', {type: `color`, className: `whisperColorBox ${!aggroCheck ? `colorPicker_disabled` : ``}`, disabled: !aggroCheck, name: 'color', value: aggroCheckEnemyHp.color});
  const precision = elt('input', {type: `number`, disabled: !aggroCheck, value: aggroCheckEnemyHp.precision, "data-skills": "precision"})

  const colorPicker = elt('input', {type: `button`, disabled: !aggroCheck, className: `whisperColorPicker ${!aggroCheck ? `disabledButtonPremium` : ``}`, value: ``, onclick() {
    ipcRenderer.invoke('start-bot', 'pointZone').then((data) => {
      if(!data) {
        return;
      }

      x.value = data.x;
      y.value = data.y;

      const {r, g, b} = data.color;
      colorBox.value = rgbToHex(r, g, b);
    })
  }});

  return elt('div', {"data-collection": `aggroCheckEnemyHp`}, elt('span', {style: `margin: 0 5px;`}, `x: `), x, elt('span', {style: `margin-right: 5px;`}, `y: `), y, elt('span', {style: `margin-right: 5px;`}, `t: `), precision, colorPicker, colorBox)

};

const renderAggroCheckInterval = ({aggroCheck, aggroCheckInterval}) => {
  return elt('input', {type: `number`, value: aggroCheckInterval, name: `aggroCheckInterval`, disabled: !aggroCheck})
};

const renderAggroCheckDoAfterType = ({aggroCheck, aggroCheckDoAfterType}) => {
  const types = ['Run Away', 'Attack', 'Stop Bot'];
  return elt('select', {name: 'aggroCheckDoAfterType', disabled: !aggroCheck}, ...types.map((type) => elt('option', {selected: type == aggroCheckDoAfterType}, type)))
};

const renderAggroCheckRunTime = ({aggroCheck, aggroCheckRunTime}) => {
  return elt('input', {type: `number`, value: aggroCheckRunTime, disabled: !aggroCheck, name: `aggroCheckRunTime`})
};

const renderAggroCheckCameraDistance = ({aggroCheck, aggroCheckCameraDistance}) => {
  return elt('input', {type: `number`, value: aggroCheckCameraDistance, disabled: !aggroCheck, name: `aggroCheckCameraDistance`});
}

const renderAggroCheckRunAwayFirstTurnDir = ({aggroCheck, aggroCheckRunAwayFirstTurnDir}) => {
  const types = ['left', 'right'];
  return elt('select', {name: 'aggroCheckRunAwayFirstTurnDir', disabled: !aggroCheck}, ...types.map((type) => elt('option', {selected: type == aggroCheckRunAwayFirstTurnDir, value: type}, type[0].toUpperCase() + type.slice(1))));
};

const renderAggroCheckRunAwayFirstTurnDeg = ({aggroCheck, aggroCheckRunAwayFirstTurnDeg}) => {
  if(aggroCheckRunAwayFirstTurnDeg < 0) aggroCheckRunAwayFirstTurnDeg = 0;
  if(aggroCheckRunAwayFirstTurnDeg > 180) aggroCheckRunAwayFirstTurnDeg = 180;
  return elt('input', {type: 'number', name: "aggroCheckRunAwayFirstTurnDeg", value: aggroCheckRunAwayFirstTurnDeg, disabled: !aggroCheck})
}

const renderAggroCheckTargetKey = ({aggroCheck, aggroCheckTargetKey}) => {
  let key = elt('input', {type: 'text', value: aggroCheckTargetKey, disabled: !aggroCheck, name: "aggroCheckTargetKey"});
  key.setAttribute(`readonly`, `true`);
  return key;
};

const renderAggroCheckEquip = ({aggroCheck, aggroCheckEquip, aggroCheckEquipKey}) => {
  const checkbox = elt('input', {type: `checkbox`, checked: aggroCheckEquip, disabled: !aggroCheck, name: `aggroCheckEquip`});
  let key = elt('input', {type: 'text', value: aggroCheckEquipKey, disabled: !aggroCheck || !aggroCheckEquip, name: "aggroCheckEquipKey"});
  key.setAttribute(`readonly`, `true`);
  return elt('div', null, checkbox, key);
};

const renderTestSkillsButton = ({aggroCheck, skills}) => {
  return elt('input', {type: `button`, value: `Test Rotation`, disabled: !aggroCheck, title: `Bot will open the game and do what it would do in normal circumstances when it detects changes in your hp bar (User HP value).\n\nIf you chose "Attack" it will search for enemies and start your rotation. If you chose "Run Away" it will run away.\n\nUse this button to test beforehand how bot would act in real situation with your configuration (you can use mobs with red names for testing).`,className: `testSkillsButton${!aggroCheck ? ` disabledButtonPremium` : ``}`})
};

const renderAggroCheckEnemyName = ({aggroCheck, aggroCheckEnemyName}) => {
  const winRange = elt(`input`, {type: `number`, disabled: !aggroCheck, value: aggroCheckEnemyName, style: `color: white; border: 1px solid rgb(180, 180, 180); ${aggroCheck ? `background-image: linear-gradient(to right, rgb(${aggroCheckEnemyName - 50}, 0, 0), rgb(${aggroCheckEnemyName}, 0, 0));` : `background-image: linear-gradient(to right, rgb(${aggroCheckEnemyName + 175 - 50}, 175, 175), rgb(${aggroCheckEnemyName}, 175, 175));`} `,  name: "aggroCheckEnemyName"})
  const range = elt('input', {type: `range`, max: 255, disabled: !aggroCheck, className: `${!aggroCheck ? `threshold_disabled` : ``}`, value: aggroCheckEnemyName, oninput: function() {
    winRange.value = this.value;
    winRange.style = `color: white; border: 1px solid grey;  background-image: linear-gradient(to right, rgb(${this.value - 50}, 0, 0), rgb(${this.value}, 0, 0));`;
  }});
  return elt(`div`, null, range, winRange)
};

const renderAggroCheckQuit = ({aggroCheck, aggroCheckQuit}) => {
  return elt('input', {type: `checkbox`, checked: aggroCheckQuit, name: "aggroCheckQuit", disabled: !aggroCheck})
};

const renderAggroCheckTurnAround= ({aggroCheck, aggroCheckTurnAround}) => {
  return elt('input', {type: `checkbox`, checked: aggroCheckTurnAround, name: "aggroCheckTurnAround", disabled: !aggroCheck})
};

const renderFindPlayer = ({findPlayer}) => {
  return elt('input', {type: "checkbox", checked: findPlayer, name: "findPlayer"});
};

const renderFindPlayerHp = ({findPlayer, findPlayerHp}) => {
    const x = elt('input', {type: `number`, name: 'x', disabled: !findPlayer, value: findPlayerHp.x});
    const y = elt('input', {type: `number`, name: 'y', disabled: !findPlayer, value: findPlayerHp.y});
    const colorBox = elt('input', {type: `color`, className: `whisperColorBox ${!findPlayer ? `colorPicker_disabled` : ``}`, disabled: !findPlayer, name: 'color', value: findPlayerHp.color});
    const precision = elt('input', {type: `number`, disabled: !findPlayer, value: findPlayerHp.precision, name: "precision"})

    const colorPicker = elt('input', {type: `button`, disabled: !findPlayer, className: `whisperColorPicker ${!findPlayer ? `disabledButtonPremium` : ``}`, value: ``, onclick() {
      ipcRenderer.invoke('start-bot', 'pointZone').then((data) => {
        if(!data) {
          return;
        }

        x.value = data.x;
        y.value = data.y;

        const {r, g, b} = data.color;
        colorBox.value = rgbToHex(r, g, b);
      })
    }});

    return elt('div', {"data-collection": `findPlayerHp`}, elt('span', {style: `margin: 0 5px;`}, `x: `), x, elt('span', {style: `margin-right: 5px;`}, `y: `), y, elt('span', {style: `margin-right: 5px;`}, `t: `), precision, colorPicker, colorBox)
};

const renderFindPlayerHpException = ({findPlayer, findPlayerHpException}) => {
    const x = elt('input', {type: `number`, name: 'x', disabled: !findPlayer, value: findPlayerHpException.x});
    const y = elt('input', {type: `number`, name: 'y', disabled: !findPlayer, value: findPlayerHpException.y});
    const colorBox = elt('input', {type: `color`, className: `whisperColorBox ${!findPlayer ? `colorPicker_disabled` : ``}`, disabled: !findPlayer, name: 'color', value: findPlayerHpException.color});
    const precision = elt('input', {type: `number`, disabled: !findPlayer, value: findPlayerHpException.precision, name: "precision"})

    const colorPicker = elt('input', {type: `button`, disabled: !findPlayer, className: `whisperColorPicker ${!findPlayer ? `disabledButtonPremium` : ``}`, value: ``, onclick() {
      ipcRenderer.invoke('start-bot', 'pointZone').then((data) => {
        if(!data) {
          return;
        }

        x.value = data.x;
        y.value = data.y;

        const {r, g, b} = data.color;
        colorBox.value = rgbToHex(r, g, b);
      })
    }});

    return elt('div', {"data-collection": `findPlayerHpException`}, elt('span', {style: `margin: 0 5px;`}, `x: `), x, elt('span', {style: `margin-right: 5px;`}, `y: `), y, elt('span', {style: `margin-right: 5px;`}, `t: `), precision, colorPicker, colorBox)
};

const renderFindPlayerCameraDistance = ({findPlayer, findPlayerCameraDistance}) => {
  return elt('input', {type: 'number', value: findPlayerCameraDistance, name: "findPlayerCameraDistance", disabled: !findPlayer});
};

const renderFindPlayerCameraVertical = ({findPlayer, findPlayerRotateBy, findPlayerCameraVertical}) => {
  return elt('input', {type: 'number', value: findPlayerCameraVertical, name: "findPlayerCameraVertical", disabled: !findPlayer || findPlayerRotateBy == 'Keyboard'});
};

const renderAggroCheckCameraVertical = ({aggroCheck, aggroCheckCameraVertical}) => {
  return elt('input', {type: 'number', value: aggroCheckCameraVertical, name: "aggroCheckCameraVertical", disabled: !aggroCheck});
};

const renderCombatZone = ({aggroCheck, combatZone}) => {
  let x = elt('input', {type: `number`, name: `x`, value: combatZone.x});
  let y = elt('input', {type: `number`, name: `y`, value: combatZone.y})
  let width = elt('input', {type: `number`, name: `width`, value: combatZone.width});
  let height = elt('input', {type: `number`, name: `height`, value: combatZone.height});

  let combatZoneInput = elt(`div`, {style: `display: none`, "data-collection": `combatZone`}, x, y, width, height);
  return elt('div', null, elt('input', {type: `button`, disabled: !aggroCheck, className: `${!aggroCheck ? ` disabledButtonPremium` : ``}`, style: `width: 120px;`, value: `Set Combat Zone`, onclick() {
    ipcRenderer.invoke("start-bot", `combatZone`).then(data => {
      x.value = data.x;
      y.value = data.y;
      width.value = data.width;
      height.value = data.height;
    })
  }}), combatZoneInput);
};

const renderFindPlayerTargetKey = ({findPlayer, findPlayerTargetKey}) => {
  let key = elt('input', {type: 'text', value: findPlayerTargetKey, disabled: !findPlayer, name: "findPlayerTargetKey"});
  key.setAttribute(`readonly`, `true`);
  return key;
};

const renderFindPlayerRotateBy = ({game, findPlayer, findPlayerRotateBy}) => {
  const types = ['Mouse', 'Keyboard'];
  const typeSelect = elt(`select`, {name: 'findPlayerRotateBy', disabled: !findPlayer}, ...types.map((type) => elt('option', {selected: type == findPlayerRotateBy, value: type}, type)));

  if(game != `Retail` && game != `Classic` && game != `Cata Classic`) {
    typeSelect.value = 'Keyboard';
    typeSelect.disabled = true;
  }

  return elt(`div`, null, typeSelect);
};

const renderFindPlayerType = ({findPlayer, findPlayerType = 'Front + Around'}) => {
  const types = ['Front', 'Around', 'Front + Around'];
  const typeSelect = elt(`select`, {name: 'findPlayerType', disabled: !findPlayer}, ...types.map((type) => elt('option', {selected: type == findPlayerType, value: type}, type)));
  return elt(`div`, null, typeSelect);
};

const renderFindPlayerDoAfter = ({findPlayer, findPlayerDoAfter}) => {
  const types = ['Sleep', 'Press Key', 'Log out', 'Random Movement', "Face and Wave", "Stop", "Exit"];
  const typeSelect = elt(`select`, {name: 'findPlayerDoAfter', disabled: !findPlayer}, ...types.map((type) => elt('option', {selected: type == findPlayerDoAfter, value: type}, type)));
   return elt(`div`, null, typeSelect);
};

const renderFindPlayerDoAfterKey = ({findPlayer, findPlayerDoAfterKey}) => {
  let key = elt('input', {type: 'text', value: findPlayerDoAfterKey, disabled: !findPlayer, name: "findPlayerDoAfterKey"});
  key.setAttribute(`readonly`, `true`);
  return key;
}

const renderFindPlayerTargetKeyAdd = ({findPlayer, findPlayerTargetKeyAdd, findPlayerTargetKeyAddUse}) => {
  const checkbox = elt('input', {type: `checkbox`, disabled: !findPlayer, checked: findPlayerTargetKeyAddUse, name: `findPlayerTargetKeyAddUse`})
  let key = elt('input', {type: 'text', disabled: !findPlayer || !findPlayerTargetKeyAddUse, value: findPlayerTargetKeyAdd, name: "findPlayerTargetKeyAdd"});
  key.setAttribute(`readonly`, `true`);
  return elt(`div`, null, checkbox, key);
}

const renderFindPlayerInterval = ({findPlayer, findPlayerInterval}) => {
  return elt(`div`, {"data-collection": `findPlayerInterval`}, elt(`span`, {className: `option_text`}, `from:`),
     elt('input', {type: `number`, name: `from`, disabled: !findPlayer, value: findPlayerInterval.from}), elt(`span`, {className: `option_text`}, `to:`),
     elt('input', {type: `number`, name: `to`, disabled: !findPlayer, value: findPlayerInterval.to}));
}

const renderFindPlayerFrontInterval = ({findPlayer, findPlayerFrontInterval}) => {
  return elt(`div`, {"data-collection": `findPlayerFrontInterval`}, elt(`span`, {className: `option_text`}, `from:`),
     elt('input', {type: `number`, name: `from`, disabled: !findPlayer, value: findPlayerFrontInterval.from}), elt(`span`, {className: `option_text`}, `to:`),
     elt('input', {type: `number`, name: `to`, disabled: !findPlayer, value: findPlayerFrontInterval.to}));}

const renderFindPlayerDoAfterSleepTime = ({findPlayer, findPlayerDoAfterSleepTime}) => {
    return elt('input', {type: `number`, value: findPlayerDoAfterSleepTime, disabled: !findPlayer, name: "findPlayerDoAfterSleepTime"});
}

const renderAggroCheckMouseSpeed = ({aggroCheck, aggroCheckMouseSpeed}) => {
  const winRange = elt(`input`, {type: `number`, value: aggroCheckMouseSpeed, disabled: !aggroCheck, name: "aggroCheckMouseSpeed"})
  const range = elt('input', {type: `range`, max: 100, min: 0, disabled: !aggroCheck, className: `${!aggroCheck ? `threshold_disabled` : ``}`, value: aggroCheckMouseSpeed, oninput: function() {winRange.value = this.value}, name: "aggroCheckMouseSpeed"});
  return elt(`div`, null, range, winRange);
}

const renderFindPlayerMouseSpeed = ({findPlayer, findPlayerMouseSpeed}) => {
  const winRange = elt(`input`, {type: `number`, value: findPlayerMouseSpeed, disabled: !findPlayer, name: "findPlayerMouseSpeed"})
  const range = elt('input', {type: `range`, max: 100, min: 0, disabled: !findPlayer, className: `${!findPlayer ? `threshold_disabled` : ``}`, value: findPlayerMouseSpeed, oninput: function() {winRange.value = this.value}, name: "findPlayerMouseSpeed"});
  return elt(`div`, null, range, winRange);
}

const renderFindPlayerRotationTime = ({findPlayer, findPlayerRotateBy, findPlayerRotationTimeMouse, findPlayerRotationTimeKeyboard}) => {
  return elt('input', {type: `number`, disabled: !findPlayer, value: findPlayerRotateBy == `Keyboard` ? findPlayerRotationTimeKeyboard : findPlayerRotationTimeMouse, name: `${findPlayerRotateBy == `Keyboard` ? `findPlayerRotationTimeKeyboard` : `findPlayerRotationTimeMouse`}`})
};

const renderSettings = (config) => {
  return elt('section', {className: `settings settings_advSettings`},
  elt(`p`, {className: `settings_header advanced_settings_header`}, `⚙️`), elt(`span`, {className: `advanced_settings_header_text`}, `General`),
  elt('div', {className: "settings_section"},
  wrapInLabel(`Start Bot By Fishing Key`, renderStartByFishingKey(config), `Your Fishing Key (the same assigned in the bot) in the game will start the bot and you don't need to alt-tab to start it manually, you still need to stop it either by Stop Key or manually (the bot won't stop if you just move away as it happens in the game). Warning! The key you assigned for Fishing Key will be blocked on your machine and if used will start the bot. Turn this feature on only after you have configured all the settings.`),
  wrapInLabel(`Human-like Movement: `, renderLikeHuman(config), `The bot will move your mouse in a human way: random speed and with a slight random deviation in the movement. Otherwise it will move the mouse instantly, which might be a better option if you use a lot of windows.`),
  wrapInLabel(`Human-like Accuracy: `, renderLikeHumanFineTune(config), `The bot will "fine-tune" the mouse position after moving to the bobber, imitating a human-like way of reaching the mouse-movement target position.`),
  wrapInLabel(`Hide Bot Window After Start: `, renderHideWin(config), `The window of the bot will be hidden and you will be able to focus it only after using stop key.`),
  wrapInLabel(
    "Use Shift+Click: ",
    renderShiftClick(config),
    `Use shift + click instead of Auto Loot. Check this option if you don't want to turn on Auto Loot option in the game. Your "Loot key" in the game should be assigned to shift.`
  ),
    wrapInLabel(`Auto-Confirm SB Items: `, renderCheckConfirm(config), `The bot will check for confirmation window after every catch and will auto-confirm soulbound items (even in AutoLoot mode).`),
  ),

  elt(`p`, {className: `settings_header settings_header_premium`}, `📹`), elt(`span`, {className: `advanced_settings_header_text`}, `Stream (beta)`), elt(`a`, {href: `#`, style: `margin-left: 3px`, onclick: () => {shell.openExternal("https://youtu.be/Kacworq8j8Q")}}, `(Guide)`),
  elt(`div`, {className: `settings_section settings_premium`},
    wrapInLabel(`Video Capture Device: `, renderStreamDevice(config), `Streaming logic is used to run the bot and the game on different machines. Video Capture device is a capture device HDMI part of which you connect to your GPU on the Game PC and USB part of which you connect to your Bot PC.`),
    wrapInLabel(`Raspberry Pico W IP: `, renderPicoIp(config), `Same IP address you configured for your Pico W device in its own code.`),
    wrapInLabel(`Streaming PC Resolution: `, renderStreamScreenSize(config), `The resolution of the Game PC. Same resolution should be for the game, meaning it shouldn't be in windowed mode.`)
  ),


    elt(`p`, {className: `settings_header`}, `🖥️`), elt(`span`, {className: `advanced_settings_header_text`}, `Window`),
    elt(`div`, {className: `settings_section`},
    wrapInLabel(`Custom window: `, renderCustomWindow(config), `You can choose a custom window from all the windows opened on your computer.`),
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
  elt(`p`, {className: `settings_header settings_header_premium`}, `🧙`),elt(`span`, {className: `advanced_settings_header_text`}, `Additional Actions`),
  elt(`div`, {className: `settings_section settings_premium`},
    renderSpares(config)
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
      wrapInLabel("Filter Confidence (%): ", renderFilterConfidence(config), `Confidence determines how close and similar recognized words should be to the provided ones.`),
      wrapInLabel("", renderWhitelistWords(config))
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


  elt(`p`, {className: `settings_header advanced_settings_header`}, `🖱️`), elt(`span`, {className: `advanced_settings_header_text`}, `Mouse & Keyboard`),
  elt(`div`, {className: `settings_section`},
    wrapInLabel(`Highlight Bobber: `, renderHighlightPercent(config), `Whether the bot should move the cursor to the bobber (highlight it) before starting checking (if in your game the bobber become brigther or more colourfull after highlighting turn it on to improve performance)`),
    wrapInLabel(`Random Mouse Speed: `, renderMouseMoveSpeed(config), `The bot will generate a random number between the provided values. The higher the value the faster the bot moves the cursor. Works only if Like a human option is on.`),
    wrapInLabel(`Random Mouse Curvature: `, renderMouseCurvature(config), `The bot will generate a random number between the provided values. The higher the value the stronger is the deviation of the movement. Works only if Like a human option is on.`),
    wrapInLabel(`Human-like Hovering (%): `, renderLikeHumanHover(config), `The value is chance of how often the bot should "hover" your cursor from time to time to simulate slight movements when the hand rests on the mouse. Doesn't work in streaming mode. This feature might impact performance.`),
    wrapInLabel(`Input Library: `, renderLibraryTypeInput(config), `Different ways of simulating keyboard and mouse actions.`),
    wrapInLabel(`Catch With Mouse Button: `, renderCatchFishButton(config), `Choose the button you want the bot to click when it wants to catch the fish.`),
    wrapInLabel(`Mouse/Keyboard Random Delay (ms): `, renderDelay(config), `The bot will generate a random number between the provided values. The number is generated every time bot utilizes your mouse or keyboard and represents the delay between pressing/releasing of mouse/keyboard clicks and pressing.`),
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
    wrapInLabel(`Random Log Out For: (min)`, renderLogOutFor(config), `How long the bot should be stayed logged out. The bot will generate a random number from the provided values. The number is generated every time the bot logs out: so the next time the bot logs out, it will be always different (randomly generated).`),
    wrapInLabel(`Random Log Out After: (min)`, renderLogOutAfter(config), `How long the bot should wait before starting fishing again. The bot will generate a random number from the provided values. The number is generated every time the bot logs out: so the next time the bot logs out, it will be always different (randomly generated).`),
    wrapInLabel(`Use Macro: `, renderLogOutMacro(config), `Use your own macro in the game instead of the bot typing /logout command.`),
    wrapInLabel(`Do After Logging In: `, renderLogOutDoAfter(config), `Press the key after logging in.`)
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
    wrapInLabel(`Random Reaction Time Delay (ms):`, renderReactionDelay(config), `The bot will generate a random number from the provided values. The number is generated every time the bot needs to move/press/click something: so the next time the bot uses your mouse/keyboard the reaction time will be always different(randomly generated)`)),
    elt(`p`, {className: `settings_header`}, `💤`), elt(`span`, {className: `advanced_settings_header_text`}, `Sleep After Catch`),
    elt('div', {className: "settings_section"},
    wrapInLabel(`Sleep After Catch:`, renderSleepAfterHook(config), `The bot will sleep after it hooked the fish for the random duration.`),
    wrapInLabel(`After Catch Chance (%): `, renderSleepAfterHookChance(config), `Likelihood that the bot will sleep after it caches fish.`),
    wrapInLabel(`After Catch Random Delay (ms): `, renderAfterHookDelay(config), `The bot will generate a random number from the provided values. The number is generated every time the bot hooked the fish.`),
    ),

      elt(`p`, {className: `settings_header settings_header_premium`}, `☠️`), elt(`span`, {className: `advanced_settings_header_text`}, `Death/Disconnect`),
      elt(`div`, {className: `settings_section settings_premium`},
      wrapInLabel(`Quit and notify at Death/Disconnect: `, renderDeathCheck(config), `The bot will check your HP bar to determine whether your character is dead or you are disconnected. It will notify you via Telegram (if connected) and then exit both the game and the bot.`),
      wrapInLabel(`Death Indication (User HP): `, renderDeathCheckHp(config), `Should be pointed at the start of your HP bar or at any pixel the dissapearance of which means death/disconnection.\n\nt: Adjust the tolerance to set how closely other colors must match the chosen color.`)
    ),

    elt(`p`, {className: `settings_header settings_header_premium`}, `📲`),  elt(`span`, {className: `advanced_settings_header_text`}, `Remote Control`),  elt(`a`, {href: `#`, style: `margin-left: 3px`, onclick: () => {shell.openExternal("https://github.com/jsbots/AutoFish#remote-control-iphone")}}, `(Guide)`),
    elt(`div`, {className: `settings_section settings_premium`},
      wrapInLabel(`Telegram Token:`, renderTmApiKey(config), `Provide telegram token created by t.me/BotFather and press connect.`),
      wrapInLabel(`Detect Chat Messages:`, renderDetectWhisper(config), `The bot will analyze Chat Zone for Whisper Threshold purple colors, if it finds any it will notifiy telegram bot you connected through token.`),
      wrapInLabel(`Stop and Close the Game at Chat Message:`, renderCloseAtWhisper(config), `Whether to stop the bot and close the window if someone whispered.`),
      wrapInLabel(`Recieve Commands Only From: `, renderTmUsername(config), `The bot will recieve commands only from the provided telegram user. You can find your name in the settings of your Telegram account. Should look like this: @username. Omit "@", put in just the name.`),
      elt('p', {style: `text-align: center; font-weight: bold`}, `Chat Message Colors:`),
      renderWhisperColors(config),
    ),
    elt(`p`, {className: `settings_header settings_header_premium`}, `🤖`),elt(`span`, {className: `advanced_settings_header_text`}, `Random Movement`),
    elt('div', {className: "settings_section settings_premium"},
    wrapInLabel(`Use Random Camera Movement: `, renderRngMove(config), `The bot will randomly move your camera within the provided radius. If the bot overdoes it and "no fishing water" error appear, it will move your camera back for the r * 2 radius.`),
    wrapInLabel(`Use Random Character Movement:`, renderRngMoveKeys(config), `The bot will move your character around a little. Don't leave the bot for a long time in this mode, it might run away and tell everyone that you are using bots.`),
    wrapInLabel(`Camera Movement (deg):`, renderRngMoveRadiusMax(config), `The maximum radius of the camera movement. The bigger the value, the more your character will turn the camera.`),
    wrapInLabel(`Character Movement (steps):`, renderRngMoveDirLengthMax(config), `Aproximate value of steps made by the bot when it moves around, defines the perimeter of how far it might move.`),
    wrapInLabel(`Use Movements Randomly Every (min): `, renderRngMoveTimer(config), `How often the bot should move your camera/character. The value is chosen randomly within the provided values.`),
    ),

    elt(`p`, {className: `settings_header settings_header_premium`}, `🔭`),elt(`span`, {className: `advanced_settings_header_text`}, `Players Check (beta)`), elt(`a`, {href: `#`, style: `margin-left: 3px`, onclick: () => {shell.openExternal("https://github.com/jsbots/AutoFish?tab=readme-ov-file#check-for-players-around-telescope")}}, `(Guide)`),
    elt(`div`, {className: `settings_section settings_premium`},
      wrapInLabel('Use Find Player: ', renderFindPlayer(config), `The bot will look around to see any other (friendly) players nearby (within target range).`),
      wrapInLabel('Find Player Mode: ', renderFindPlayerType(config), `How the bot should look for the players.`),
      wrapInLabel('Target HP: ', renderFindPlayerHp(config), `Point it anywhere on the healthbar of your target.\n\nt: Adjust the tolerance to set how closely other colors must match the chosen color.`),
      config.game == 'Vanilla' || config.game == 'Vanilla (splash)' ? wrapInLabel('Target HP Exception: ', renderFindPlayerHpException(config), `Some servers when "Target Friendly Player" used make your character target itself. Point at some unique pixel of your HP bar to make the bot differentiate between your own character and others.\n\nt: Adjust the tolerance to set how closely other colors must match the chosen color.`) : ``,
      wrapInLabel('Target Key: ', renderFindPlayerTargetKey(config), `The same key you use to target other friendly players in the game (Options -> Keybindings -> Targeting -> Target Nearest Friendly Player)`),
      wrapInLabel('Target Key (additional): ', renderFindPlayerTargetKeyAdd(config), `Additional key in case you want to target something else. Enemies for example.`),
      config.findPlayerType != `Front` ? wrapInLabel('Rotate Camera By: ', renderFindPlayerRotateBy(config), `Keyboard: the bot will rotate by using arrow keys, it will be visible to others because your character will move as well.\nMouse: the bot will look around by using mouse, it won't be visible to others.`) : ``,
      config.findPlayerRotateBy == 'Mouse' && config.findPlayerType != `Front` ? wrapInLabel('Mouse Speed: ', renderFindPlayerMouseSpeed(config), `Adjust the speed at which the bot should move your camera.`) : ``,
      config.findPlayerType != `Front` ? wrapInLabel('Scroll Camera Distance (steps):', renderFindPlayerCameraDistance(config), `The bot will scroll down your camera to see more, the value is number of "scroll steps", which is how far it should place your camera before checking.`) : ``,
      config.findPlayerType != `Front` ? wrapInLabel('Vertical Camera Position (steps):', renderFindPlayerCameraVertical(config), `Vertical position of the camera view. In simple words: how low the bot should position your camera to better see the horizon. Leave it at 0 if you don't need it.`) : ``,
      config.findPlayerType != `Front` ? wrapInLabel('Search For Players Around Every (min): ', renderFindPlayerInterval(config), `How often the bot should search for players nearby. You can use decimals for seconds (0.5 is every 30 seconds), but remember that the bot will check only after it finishes current fishing cast. The value is random between the provided. `) : ``,
      config.findPlayerType != `Around` ? wrapInLabel('Search For Players In Front Every (sec): ', renderFindPlayerFrontInterval(config), `How often the bot should search for players in front of the character. The value is random between the provided. `) : ``,
      wrapInLabel('Do After Player Found: ', renderFindPlayerDoAfter(config), `What to do if you targeted someone in the vicinity of your range distance.\n\nSleep: the bot will sleep for the provided time.\nPress Key: the bot will press the key you bound.\nLog out: the bot will log out and will use settings from "Logging Out" section.\nRandom Movement: the bot will move slightly, it will use settings from Random Movement section.\nFace and Wave: The bot will face the player, print /wave in the chat and sleep for the provided time. It won't face and wave any other player within the next 15 minutes to prevent pretty obvious automated behaviour.\nStop: the bot will stop working.\nExit: the bot will exit the game and stop working.`),
      config.findPlayerDoAfter == 'Press Key' ? wrapInLabel('Press Key: ', renderFindPlayerDoAfterKey(config), `The key to press in case the bot finds someone.`) : ``,
      wrapInLabel('Sleep After Player Found (sec): ', renderFindPlayerDoAfterSleepTime(config), `For how long the bot should sleep in case it finds someone or after chosen action.`),
      config.findPlayerType != `Front` ? wrapInLabel('Rotation Time (ms): ', renderFindPlayerRotationTime(config), `How long the bot should rotate. Tweak this if the rotation the bot makes isn't complete or overcomplete.`) : ``
    ),

    elt(`p`, {className: `settings_header settings_header_premium`}, `⚔️`),  elt(`span`, {className: `advanced_settings_header_text`}, `Aggro Check (beta)`),  elt(`a`, {href: `#`, style: `margin-left: 3px`, onclick: () => {shell.openExternal("https://github.com/jsbots/AutoFish?tab=readme-ov-file#aggro-checking-crossed_swords")}}, `(Guide)`),
    elt(`div`, {className: `settings_section settings_premium`},
      wrapInLabel('Use Aggro Check', renderAggroCheck(config), `Bot will check your HP bar (User HP End value) for any changes to determine whether it's attacked, then if you have chosen "Attack" mode it will turn around and make an attempt to find an enemy within target range (within your target key range), if successful it will move to the enemy until in range of the first skill in the rotation. After that it starts skill rotation, centering camera and keeping distance in range of the current skill of the rotation.\n\nThis module relies on the skill range, namely on the colors whether the skill is in range or not. You need to install an addon that does that (like bartender or tullarange) or point "Skill Position" value exactly at the number of the skill on the skill icon (this number is usually an indication of range: red if in range and white if not in range)\n\nUse "Test Rotation" button to see what will happen if you are attacked during fishing and check whether your rotation and the bot works properly for you.`),
      wrapInLabel('Do After Being Attacked: ', renderAggroCheckDoAfterType(config), `What bot should do after detecting changes in "User HP" pixel.\n\nRun Away: The bot will run away in the direction it was looking to during the fishing. It will randomly jump from time to time.\n\nAttack: Bot will turn around and make an attempt to find an enemy (checking for Enemy Name color value), if successful it will move within the range distance of the first skill and then start skill rotation, centering and keeping distance relative to the range indication of "Skill Position" value of every skill in the rotation. `),
      wrapInLabel('Scroll Camera Distance (steps): ', renderAggroCheckCameraDistance(config), `The bot will scroll down your camera to see more, the value is number of "scroll steps", which is how far it should place your camera before checking.`),
      wrapInLabel('Vertical Camera Position (steps)', renderAggroCheckCameraVertical(config), `Vertical position of the camera view. In simple words: how low the bot should position your camera to better see the horizon. Leave it at 0 if you don't need it.`),
      wrapInLabel('Check User HP Changes Every (sec)', renderAggroCheckInterval(config), `How often the bot should check changes of "User HP" pixel.`),
      wrapInLabel('Center Camera By: ', renderAggroCheckControlBy(config), `What input command the bot should use to center camera.`),
      config.aggroCheckControlBy == 'Mouse' ? wrapInLabel('Mouse Speed: ', renderAggroCheckMouseSpeed(config), `Adjust the speed at which the bot should move your camera.`) : ``,
      wrapInLabel('Enemy Name Color: ', renderAggroCheckEnemyName(config), `The color of the enemy names the bot should look for when attacked.`),
      wrapInLabel('Combat Indication Pixel', renderAggroCheckUserHp(config), `The pixel on the screen bot will check to determine whether it's in combat mode. Usually should be the place which changes when the character is in combat mode (on character level or on the rim around the avatar which changes to red when in combat mode) or on the end of the green HP field of your character.\n\nt: Adjust the tolerance to set how closely other colors must match the chosen color.`),
      wrapInLabel('Enemy HP Pixel', renderAggroCheckEnemyHp(config), `The pixel on the screen bot will check to determine whether the enemy is targeted. Usually should be somewhere on the green HP field.\n\t: Adjust the tolerance to set how closely other colors must match the chosen color.`),
      wrapInLabel('Quit The Game After: ', renderAggroCheckQuit(config), `The bot will quit the game and the bot after it either ran away, stopped, killed or being killed.`),
      config.aggroCheckDoAfterType != 'Stop Bot' ? elt('div', {style: `border-bottom: 1px solid grey; margin-bottom: 5px;`}) : ``,
      config.aggroCheckDoAfterType == 'Run Away' ?
      elt('div', null,
      wrapInLabel('First Turn Direction: ', renderAggroCheckRunAwayFirstTurnDir(config), `The direction the bot should start turning to run away.`),
      wrapInLabel('First Turn (deg): ', renderAggroCheckRunAwayFirstTurnDeg(config), `How much the bot should turn before running away.`),
      wrapInLabel('Run For (sec): ', renderAggroCheckRunTime(config), `For how long the bot should run away.`)
      ) :
      config.aggroCheckDoAfterType == `Attack` ?
      elt('div', null,
      wrapInLabel('Turn Around First: ', renderAggroCheckTurnAround(config), `The bot will turn around first to find enemies. Check if it you expect enemy from behind in the first place.`),
      wrapInLabel('Target Key: ', renderAggroCheckTargetKey(config), `What key the bot should use to target the enemy. By default it's "Tab" in the game, but if you want the bot to target only enemy players (and not mobs), you should bind a different key for that in the game and bind it here respectively.`),
      wrapInLabel('Equip Weapon: ', renderAggroCheckEquip(config), `Equip weapon/armor before attacking. Use your own macro for that.`),
      wrapInLabel('Combat Zone: ', renderCombatZone(config), `The zone in which the bot will look for Enemy Name colors and center your camera relative to the position of the name.`)
    ) : ``,
      config.aggroCheckDoAfterType == `Attack` ?  elt('p', {style: `font-weight: bold; text-align: center; margin-bottom: 3px;`}, `Rotation: `) : ``,
      config.aggroCheckDoAfterType == `Attack` ?  renderSkills(config) : ``,
      renderTestSkillsButton(config)
    ),

    elt(`p`, {className: `settings_header settings_header_premium`}, `🥱`), elt(`span`, {className: `advanced_settings_header_text`}, `Fatigue`),
    elt('div', {className: "settings_section settings_premium"},
    wrapInLabel(`Apply Fatigue:`, renderApplyFatigue(config), `The bot will simulate fatigueness by decreasing all the delay values by given rate.`),
    wrapInLabel(`Apply Fatigue Every (min):`, renderApplyFatigueEvery(config), `The bot will randomly apply fatigueness between the provided interval`),
    wrapInLabel(`Fatigue Rate (%):`, renderApplyFatigueRate(config), `The rate value of fatigueness which will make all the delay values increase in geometric progression.`),
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

    elt(`p`, {className: `settings_header settings_header_premium`}, `🎮`), elt(`span`, {className: `advanced_settings_header_text`}, `Arduino Control (legacy)`), elt(`a`, {href: `#`, style: `margin-left: 3px`, onclick: () => {shell.openExternal("https://github.com/jsbots/AutoFish#arduino-control-joystick")}}, `(Guide)`),
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
  wrapInLabel(`Ignore Preliminary Checks:`, renderIgnorePreliminary(config), `The bot will ignore all the preliminary checks including notification errors.`),
  wrapInLabel(`Visual Library: `, renderLibraryType(config), `If something doesn't work with default library you can choose another one. Mind that keysender works only with dx11 and will be force for Multiple Fishing or Alt-Tab Fishing modes.`),
  wrapInLabel(`Check Mode: `, renderCheckLogic(config), `check mode`),
  wrapInLabel(`Cast Attempts Limit: `, renderMaxAttempts(config), `How many times the bot will fail finding bobber before stopping.`),
  wrapInLabel(`Manual Position On Bobber: `, renderManualPositionOnBobber(config), `Manual position on the feather the bot should stick to when found the bobber: 0 - most left, 100 - most right.`),
  // wrapInLabel(`Dynamic Threshold: `, renderDynamicThreshold(config), `ONLY FOR MANUAL MODE. After attempts limit the bot will dynamically change threshold by the provided value.`),
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

  spareNumber = config.spares.length + 1;

  const buttons = elt(`div`, {className: `buttons`},
     elt('input', {type: `button`, value: `Ok`}),
     elt('input', {type: `button`, value: `Cancel`}),
     elt('input', {type: `button`, value: `Defaults`}))

  settings.addEventListener(`click`, (event) => {
    gatherConfig();
    if(event.target.className == `testSkillsButton`) {
      if(config.skills.length < 1 && config.aggroCheckDoAfterType == `Attack`) {
        return;
      }

      ipcRenderer.send('advanced-click', config);
      ipcRenderer.invoke('start-bot', 'skills-test');
    }

    if(event.target.className == `spares-removeButton`) {
      ipcRenderer.invoke('remove-spare-confirm')
        .then((confirm) => {
          if(confirm) {
            event.target.parentNode.parentNode.remove();
            spareNumber--;

            let container = settings.querySelectorAll('.spareContainer')[0];
            if(container) {
              let execute = [...container.elements].find((el) => el['data-spares'] == `execute`);

              if(execute.checked) {
                execute.checked = false;
              }
            }

            gatherConfig();
            settings.innerHTML = ``;
            settings.append(renderSettings(config));
          }
        })
    }

    if(event.target.value == `Connect` && event.target.id == "tm") {
      event.target.value = `⌛`;
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

    if(event.target.value == `Connect` && event.target.id == "pico") {
      event.target.value = `⌛`;
      ipcRenderer.invoke(`connect-pico`, config.picoip)
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
      }, 1500);
    }


    if(event.target.value == `Connect` && event.target.id == "arduino") {
      event.target.value = `⌛`;
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
      }, 1000);
    }


    if(event.target.name == `mammoth` && event.target.checked) {
      ipcRenderer.send("mammoth-warn");
    }

    if(event.target.name == 'aggroCheck' && event.target.checked) {
      ipcRenderer.send("aggroCheck-warn");
    }

    if(event.target.name == `rngMove` && event.target.checked) {
      ipcRenderer.send("rngMove-warn");
    }

    if(event.target.name == `streamMode` && event.target.checked) {
      ipcRenderer.send("stream-warn");
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
        event.target.name == 'checkChangesDoAfterKey' ||
        event.target.name == 'aggroCheckTargetKey' ||
        event.target.name == `aggroCheckEquipKey` ||
        event.target.name == `findPlayerTargetKey` ||
        event.target.name == `findPlayerDoAfterKey` ||
        event.target.name == `findPlayerTargetKeyAdd` ||
        event.target.name == `logOutDoAfterKey`) &&
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

    /* skills start */
    if(config.aggroCheckDoAfterType == `Attack`) {
      let skills = [...settings.querySelectorAll('.skillsContainer')]
      .map((skill) => {
        let inputs = [...skill.elements].filter(input => input.type != `button`);
          return inputs.reduce((a, b) => {
            if(b['data-skills']) {
              a[b["data-skills"]] = convertValue(b);
            }
            return a;
          }, {})
        }
      );
      config['skills'] = skills;
    }

    /* skills end */

    /* spares start */
    let spares = [...settings.querySelectorAll('.spareContainer')]
    .map((spare) => {
      let inputs = [...spare.elements].filter(input => input.type != `button`);
        return inputs.reduce((a, b) => {
          if(b['data-spares']) {
            a[b["data-spares"]] = convertValue(b);
          }
          return a;
        }, {})
      }
    );

    spares.forEach((spare, i) => {
      if(spare.execute) {
        spare.repeatTime = spares[i - 1].repeatTime;
        spare.omitinitial = spares[i - 1].omitinitial;
      }
    })

    config['spares'] = spares;
    /* spares end */

    let whispSpecColors = [...settings.querySelectorAll('.whispSpecColorsInnerContainer')]
    .map((whisperSpecColor) => {
      let color = whisperSpecColor.querySelector('.whisperColorBox').value;
      let percent = Number(whisperSpecColor.querySelector('.whisperColorRange').value);

      return {...(hexToRgb(color)), percent};
    })

    config.whispSpecColors = whispSpecColors;

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
