const elt = require("./utils/elt.js");
const wrapInLabel = require("./utils/wrapInLabel.js");
const { hexToRgb, rgbToHex } = require("./../utils/colors.js");
const { ipcRenderer } = require('electron');

const renderColorSwitch = ({bobberColor, bobberColorManual, checkLogic, autoColor, soundDetection}) => {
  const colorTypes = [`red`, `blue`, `Manual`];

  const colorType = elt('select', {className: `bobberColorSelect`, name: `bobberColor`},
   ...colorTypes.map((color) => elt(`option`, {selected: color == bobberColor, value: color}, (color[0].toUpperCase() + color.slice(1)) + `${color == 'red' || color == 'blue' ? ` (recommended)` : ``}`)
 ))

  const redColor = [180, 0, 0];
  const blueColor = [0, 0, 180];

  const colorBox = elt('input', {type: `color`, oninput() {
    colorType.value = `Manual`;
  }, className: `bobberColorBox`, name: `bobberColorManual`, value:  bobberColor == `red` ? rgbToHex(...redColor) : bobberColor == `blue` ? rgbToHex(...blueColor) : bobberColorManual});

  const colorPicker = elt('input', {type: `button`, className: `bobberColorPicker`});
 return elt(`div`, null, colorType, colorBox, colorPicker);
}


const renderBobberSensitivity = ({game, bobberSensitivity, bobberColor, soundDetection, autoSens}) => {
  bobberSensitivity = bobberSensitivity[game]

  let min = 1;
  let max = 10;

  if(game == `Retail` || game == `Vanilla (splash)` || bobberColor == `Manual`) {
    min = 1;
    max = 30;
  }

    if(game == `Vanilla (splash)` || bobberColor == `Manual`) autoSens = false;

  if(bobberSensitivity > max) bobberSensitivity = max;
  if(bobberSensitivity < min) bobberSensitivity = min;

  let bobberSensitivityWin = elt(`input`, {type: `number`, name: `bobberSensitivity`, value: bobberSensitivity, disabled: soundDetection || autoSens});

  return elt(`div`, {className: `sensitivityContainer`, style: `${soundDetection ? `display: none` : ``}`}, elt('input', {type: `range`, min, max,  value: bobberSensitivity, disabled: soundDetection || autoSens, className: `${autoSens ? `threshold_disabled` : ``}` , oninput: function() {bobberSensitivityWin.value = this.value}, name: `bobberSensitivity`}), bobberSensitivityWin);
};

const renderThreshold = ({ threshold, bobberColor, soundDetectionMode = 'Desktop', soundDetectionInputDevice = '', bobberColorManual, autoTh, game, soundDetection, soundDetectionRange }) => {
  if(!soundDetection) {

    if(bobberColor != `Manual`) {
      if(threshold < 1) threshold = 1;
      else if(threshold > 250) threshold = 250;
    } else {
      if(threshold < 1) threshold = 1;
      else if(threshold > 100) threshold = 100;
    }


    if(game == `Vanilla (splash)` || bobberColor == `Manual`) autoTh = false;

    const range = elt(`input`, { type: `range`, min: 1, max: `${bobberColor == `Manual` ? 100 : 250}`, value: threshold, name: `threshold`, disabled: autoTh, className: `${autoTh ? `threshold_disabled` : ``}` });
    const number = elt(`input`, { type: `number`, className: `threshold_number_input`, value: threshold, disabled: autoTh, name: `threshold` });

    const bobberContainer = elt(`div`, null, number);
    const rangeContainer = elt(`div`, { className: `rangeContainer`}, range, bobberContainer)

    let rgbBobberColorManual = hexToRgb(bobberColorManual);
    if(bobberColor == `red`) {
      document.styleSheets[0].rules[79].style.backgroundImage = "linear-gradient(to right, rgb(100, 0, 0), rgb(250, 0, 0))"
    } else if(bobberColor == `blue`) {
      document.styleSheets[0].rules[79].style.backgroundImage = "linear-gradient(to right, rgb(0, 0, 100), rgb(0, 90, 200))"
    } else {
      document.styleSheets[0].rules[79].style.backgroundImage = `linear-gradient(to right, rgb(${rgbBobberColorManual.r - 25}, ${rgbBobberColorManual.g - 25}, ${rgbBobberColorManual.b - 25}), rgb(${rgbBobberColorManual.r + 25}, ${rgbBobberColorManual.g + 25}, ${rgbBobberColorManual.b + 25}))`;
    }

    return elt(`div`, { className: `thresholdRange` }, rangeContainer); // autoThSwitch
  } else {
    if(soundDetectionRange > 255) soundDetectionRange = 255;
    if(soundDetectionRange < 0) soundDetectionRange = 0;
    let soundDetectionRangeWin = elt(`input`, {type: `number`, name: `soundDetectionRange`, value: soundDetectionRange, disabled: !soundDetection});

    const soundDetectionInputSelect = elt('select', {name: 'soundDetectionInputDevice', disabled: soundDetectionMode == `Desktop`});

    const soundDetectionModeContainer = elt('label', {title: `Which device the bot should listen to.`}, `Mode: `, elt('select', {name: 'soundDetectionMode'}, ...['Desktop', 'Input'].map((mode) => elt('option', {selected: mode == soundDetectionMode}, mode))));
    const soundDetectionInputContainer = elt('label', {title: `If you want the bot to listen only to the sounds of the game install Virtual Audio Cable and choose CABLE Input device.`}, `Input: `, soundDetectionInputSelect);
    const rangeContainer = elt('input', {type: `range`, min: 0, max: 255, value: soundDetectionRange, disabled: !soundDetection,  oninput: function() {soundDetectionRangeWin.value = this.value}, name: `soundDetectionRange`, className: `${!soundDetection ? `threshold_disabled` : ``}`});


    navigator.mediaDevices.enumerateDevices()
    .then(devices => {
      devices
      .filter(device => device.kind === 'audioinput')
      .forEach(device => {
          soundDetectionInputSelect.append(elt(`option`, { selected: device.deviceId == soundDetectionInputDevice, value: device.deviceId }, device.label));
      })
    })

    let listeningOn = false;
    const listenButton = elt('input', {type: 'button', style: `cursor: pointer; width: 63px; height: 41px; margin-right: -6px;`, value: "Listen", onclick() {
      if(!listeningOn) {
        this.value = `Stop`;
        rangeContainer.disabled = true;
        rangeContainer.className = `threshold_disabled`;
        soundDetectionRangeWin.disabled = true;
        ipcRenderer.send('create-listen-win');
      } else {
        ipcRenderer.send('destroy-listen-win');
        this.value = `Listen`;
        rangeContainer.disabled = false;
        rangeContainer.className = ``;
        soundDetectionRangeWin.disabled = false;
      }
      listeningOn = !listeningOn;
    }, className: "soundDetection-image"});


    const soundDetectionModeInputContainer = elt('div', {className: `soundDetectionModeInputContainer`}, soundDetectionModeContainer, soundDetectionInputContainer);

    // const img = elt(`img`, {className: `soundDetection-image`, src: `img/sound-icon.png`});

    return elt(`div`, {className: `soundDetection-container`}, rangeContainer,
    soundDetectionModeInputContainer, soundDetectionRangeWin, listenButton);
  }
};

const renderGameNames = ({game}) => {
  const gamesOfficial = [
    `Retail`,
    `Cata Classic`,
    `Classic`
  ];

  const gamesPrivate = [
    "Leg",
    "MoP",
    "Cata",
    "LK Private",
    "TBC",
    "Vanilla",
    "Vanilla (splash)"
  ];

  return elt(
    "select",
    { name: "game", className: "option game-option" },
    elt(`optgroup`, {label: `Official-like`}, ...gamesOfficial.map((name) =>
          elt("option", { selected: name == game }, name)
        )),
    elt(`optgroup`, {label: `Private-like`}, ...gamesPrivate.map((name) =>
          elt("option", { selected: name == game }, name)
        ))
  );
};


const renderAfkmode = ({afkmode, multipleWindows}) => {
  const checkbox = elt("input", {
    type: "checkbox",
    className: "option premium_option",
    checked: afkmode,
    name: "afkmode",
  });
  if(multipleWindows) {
    checkbox.setAttribute("disabled", true);
  }
  return checkbox;
};

const renderMultipleWindows = ({multipleWindows, afkmode}) => {
  const checkbox = elt("input", {
    type: "checkbox",
    className: "option premium_option",
    checked: multipleWindows,
    name: "multipleWindows",
  });
  if(afkmode) {
    checkbox.setAttribute("disabled", true);
  }

  ipcRenderer.invoke('get-profile-name')
  .then((name) => {
    if(name == 'WIN1' || name == 'WIN2' || name == 'WIN3' || name == 'WIN4' || name == 'WIN5' || name == 'WIN6' || name == 'WIN7' || name == 'WIN8' || name == 'WIN9' || name == 'WIN10') {
      checkbox.setAttribute("disabled", true);
      checkbox.checked = true;
    }
  });

  return checkbox;
};

const renderPoleKey = ({lures, game, intKey, useInt}) => {
  let key = elt('input', {type: 'text', value: intKey, disabled: !useInt, name: "intKey"});
  key.setAttribute(`readonly`, `true`);

  const checkbox = elt(`input`, {
    type: `checkbox`,
    disabled: !(game == `Retail` || game == `Classic` || game == `Cata Classic`),
    checked: !(game == `Retail` || game == `Classic` || game == `Cata Classic`) ? false : useInt,
    style: `margin-right: 7px`, name: "useInt"
    });

  const container = elt(`div`, null, checkbox, key)
  return container;
};

const renderStopKey = ({stopKey}) => {
  let key = elt('input', {type: 'text', value: stopKey, name: "stopKey"});
  key.setAttribute(`readonly`, `true`);
  return key;
};

const renderFishingKey = ({fishingKey}) => {
  let key = elt('input', {type: 'text', value: fishingKey, name: "fishingKey"});
  key.setAttribute(`readonly`, `true`);
  return key;
};

const renderAdvancedSettings = () => {
  return elt('input', {type: 'button', name:"advancedSettings", value: "Advanced Settings", className: "advanced_settings_button advanced_settings_button_fz"});
};

const renderFishingZone = () => {
  return elt('input', {type: 'button', name:"fishingZone", value: "Fishing Zone", className: "advanced_settings_button"});
};

const renderDetectZone = () => {
  return elt('input', {type: 'button', name:"detectZone", value: "Detection Zone", className: "advanced_settings_button"});
};

const renderChatZone = () => {
  return elt('input', {type: 'button', name:"chatZone", value: "Chat Zone", className: "advanced_settings_button"});
};

const renderSettings = (config) => {
return elt(
    "section",
    { className: "settings" },
    elt(
      "div",
      { className: "settings_section" },
      wrapInLabel(
        "",
        renderGameNames(config),
        `Choose the version of the game you want the bot to work on.`
      ),
      wrapInLabel(
        "Fishing Key: ",
        renderFishingKey(config),
        `Assign the same key you use for fishing. If you use /castFishing instead, then you should assign a key for fishing.`
      ),
      wrapInLabel(
        "Int. Key: ",
        renderPoleKey(config),
        `Exclusively for Retail. Use interaction key instead of mouse for catching.`
      ),
      wrapInLabel(
        "Stop Key: ",
        renderStopKey(config),
        `Assign a key that you will use to stop the bot.`
      ),
      wrapInLabel(
        "Alt-Tab Fishing: ",
        renderAfkmode(config),
        `ONLY ON DIRECTX 11. The bot will automatically alt+tab after it casts (bringing back the previous window) and automatically focus the window of the game when it needs to catch. If you use your mouse too much during AFK fishing the whitelist feature might be unstable. `,
        `premium_label`
      ),
      wrapInLabel(
        "Multiple Fishing: ",
         renderMultipleWindows(config),
        `ONLY ON DIRECTX 11. If you want to use multiple windows check this option. You need to launch every window and configure them properly, make sure every window is in DirectX 11 mode. The bot will switch between windows automatically.`,
        `premium_label`
      ),
    ),
    elt(
      "div",
      { className: "settings_section " },
      wrapInLabel(
        "",
        renderFishingZone(config),
      ),
      wrapInLabel(
        "",
        renderChatZone(config),
      ),
      wrapInLabel(
        "",
        renderDetectZone(config),
      ),
      wrapInLabel(
        "",
        renderAdvancedSettings(config),
        ),
    ),
    elt("p", {className: `settings_header settings_header_main threshold-header ${config.soundDetection ? `thClosed`: ``}`, "data-thresholdHeader": true}, "🎨"),
    elt("p", {className: `settings_header settings_header_main soundDeteaction-header ${config.soundDetection ? ``: `thClosed`}`, "data-soundDetectionHeader": true}, "🔊"),
    elt(
      "div",
      { className: "settings_section threshold_settings" },
      // elt('input', {type: `button`,  disabled: !config.autoTh || config.game == `Vanilla (splash)` || config.checkLogic == `pixelmatch`, name: `autoColor`, checked: config.autoTh && config.autoColor, style: `${config.soundDetection ? `display: none`: ``}`, className: `auto_button autoColor ${config.autoColor && config.game != `Vanilla (splash)` && config.autoTh && config.checkLogic != `pixelmatch` ? `auto_button_on` : ``}`, value: `Auto`}),
      elt('input', {type: `button`, disabled: config.game == `Vanilla (splash)` || config.bobberColor == `Manual`, name: `autoTh`, checked: config.autoTh && config.game != `Vanilla (splash)` && config.bobberColor != `Manual`, style: `${config.soundDetection ? `display: none`: ``}`, className: `auto_button autoTh ${config.autoTh && config.game != `Vanilla (splash)` && config.bobberColor != `Manual`? `auto_button_on` : ``}`, value: `Auto`}),
      elt('input', {type: `button`, disabled: config.game == `Vanilla (splash)` || config.bobberColor == `Manual`, name: `autoSens`, checked: config.autoSens && config.game != `Vanilla (splash)` && config.bobberColor != `Manual`, style: `${config.soundDetection ? `display: none`: ``}`, className: `auto_button autoSens ${config.autoSens && config.game != `Vanilla (splash)` && config.bobberColor != `Manual`? `auto_button_on` : ``}`, value: `Auto`}),

      !config.soundDetection ? wrapInLabel("Feather: ", renderColorSwitch(config), `Bobber color. The color the bot will search within Fishing Zone (${config.bobberColor}, in your case). If the water and environment is bluish, choose red color. If the water and environment is reddish, choose blue color. If nothing helps and the bot still can't find the bobber: choose Manual color and pick color of your bobber.`, `thLabel colorLabel`) : ``,

      wrapInLabel(`${config.soundDetection ? `` : config.bobberColor == `Manual` ? `Tolerance: ` : `Intensity: `}`,
        renderThreshold(config),
        config.soundDetection ? `Amplitude value. The bot will listen to the amplitude value of the audio signal until it reaches the threshold. Use "Listen" button to determine the amplitude of "splash" sound when the fish is caught. If the bot doesn't react to the sound, decrease this value. If the bot reacts too early, increase this value.\n\nIf you click on "Listen" button it will show you two values. Amp: current amplitude. Max: maximum amplitude reached.` : config.bobberColor == `Manual` ? `Adjust the tolerance to set how closely other colors must match the chosen color.` : `Decrease this value, if the bot can't find the bobber (e.g. at night, bad weather). Increase this value if you want the bot to ignore more ${config.bobberColor} colors.`
        , `thLabel`),
      !config.soundDetection ? wrapInLabel("Sensitivity: ", renderBobberSensitivity(config), config.game == `Vanilla (splash)` ?
       `The size of the zone which will be checked for splash, if the bot doesn't react to "plunging" animation - increase this value. If in Auto mode: The bot will auto-adjust both sensitivity value per each cast.`
       : `How sensitive the bot is to any movements (jerking, plunging) of the bobber. If the bot clicks too early, decrease this value (don't confuse it with when the bot missclicks on purpose). If the bot clicks on the bobber too late (or doesn't click at all), increase this value.`, `thLabel`) : ``
    )
  );
}

module.exports = renderSettings;
