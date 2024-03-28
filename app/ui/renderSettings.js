const elt = require("./utils/elt.js");
const wrapInLabel = require("./utils/wrapInLabel.js");

const renderColorSwitch = ({bobberColor, checkLogic, autoColor, soundDetection}) => {

  const checkLogicTypes = ['default', 'pixelmatch'];

  const modeSelect = elt(`select`, {name: 'checkLogic', title: `Alternative modes for detecting bobber animation.\nDefault: bot will rely on colors much more than with Pixelmatch method. It also might cause a lot of missclicks on some games.\nPixelmatch: the bot will rely less on the colors but more on the movements of the bobber.`, className: `checkLogicSelect`}, ...checkLogicTypes.map((logic) => elt('option', {selected: checkLogic == logic, value: logic}, logic[0].toUpperCase() + logic.slice(1))));

  const bobberColorSwitch = elt(`radio`, { className: `bobberColorSwitch`,
                                name: `bobberColor`,
                                title: `Switch between blue and red feathers.`,
                                value: bobberColor,
                                style: `background-image: linear-gradient(to right, ${bobberColor == `red` ? `rgba(100, 0, 0, .8), rgba(255, 0, 0, .8)` : `rgba(0, 90, 200, .8), rgba(0, 0, 100, .8)`}); ${soundDetection ? `display: none` : ``}`
                              }, elt(`div`, {className: `switch_thumb ${bobberColor == `red` ? `switch_thumb_left` : `switch_thumb_right`}`}));
 return elt(`div`, null, modeSelect, bobberColorSwitch);
}


const renderBobberSensitivity = ({game, bobberSensitivity, soundDetection, autoSens}) => {
  let min = 1;
  let max = 10;

  if(game == `Retail` || game == `Vanilla (splash)`) {
    min = 1;
    max = 30;
  }

  if(game == `Vanilla (splash)`) {
    autoSens = false;
  }

  if(bobberSensitivity > max) bobberSensitivity = max;
  if(bobberSensitivity < min) bobberSensitivity = min;

  let bobberSensitivityWin = elt(`input`, {type: `number`, name: `bobberSensitivity`, value: bobberSensitivity[game], disabled: soundDetection || autoSens});

  return elt(`div`, {className: `sensitivityContainer`, style: `${soundDetection ? `display: none` : ``}`}, elt('input', {type: `range`, min, max,  value: bobberSensitivity[game], disabled: soundDetection || autoSens, className: `${autoSens ? `threshold_disabled` : ``}` , oninput: function() {bobberSensitivityWin.value = this.value}, name: `bobberSensitivity`}), bobberSensitivityWin);
};

const renderThreshold = ({ threshold, bobberColor, autoTh, game, soundDetection, soundDetectionRange }) => {
  if(!soundDetection) {

    if(threshold < 1) threshold = 1;
    else if(threshold > 150) threshold = 150;

    if(game == `Vanilla (splash)`) autoTh = false;

    const range = elt(`input`, { type: `range`, min: 1, max: 150, value: threshold, name: `threshold`, disabled: autoTh, className: `${autoTh ? `threshold_disabled` : ``}` });
    const number = elt(`input`, { type: `number`, className: `threshold_number_input`, value: threshold, disabled: autoTh, name: `threshold` });

    const bobberContainer = elt(`div`, null, number);
    const rangeContainer = elt(`div`, { className: `rangeContainer`}, range, bobberContainer)

    if(bobberColor == `blue`) {
      document.styleSheets[0].rules[77].style.backgroundImage = "linear-gradient(to right, rgb(0, 0, 100), rgb(0, 90, 200))"
    } else {
      document.styleSheets[0].rules[77].style.backgroundImage = "linear-gradient(to right, rgb(100, 0, 0), rgb(250, 0, 0))"
    }

    return elt(`div`, { className: `thresholdRange` }, rangeContainer); // autoThSwitch
  } else {
    if(soundDetectionRange > 1100) soundDetectionRange = 1100;
    if(soundDetectionRange < 128) soundDetectionRange = 128;
    let soundDetectionRangeWin = elt(`input`, {type: `number`, name: `soundDetectionRange`, value: soundDetectionRange, disabled: !soundDetection});

    const img = elt(`img`, {className: `soundDetection-image`, src: `img/sound-icon.png`});

    return elt(`div`, {className: `soundDetection-container`}, elt('input', {type: `range`, min: 128, max: 1100, value: soundDetectionRange, disabled: !soundDetection,  oninput: function() {soundDetectionRangeWin.value = this.value}, name: `soundDetectionRange`, className: `${!soundDetection ? `threshold_disabled` : ``}`}),
     soundDetectionRangeWin, img);
  }
};

const renderGameNames = ({game}) => {
  const gamesOfficial = [
    `Retail`,
    `LK Classic`,
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
  return checkbox;
};

const renderPoleKey = ({lures, game, intKey, useInt}) => {
  let key = elt('input', {type: 'text', value: intKey, disabled: !useInt, name: "intKey"});
  key.setAttribute(`readonly`, `true`);

  const checkbox = elt(`input`, {
    type: `checkbox`,
    disabled: !(game == `Retail` || game == `Classic` || game == `LK Classic`),
    checked: !(game == `Retail` || game == `Classic` || game == `LK Classic`) ? false : useInt,
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
  return elt('input', {type: 'button', name:"advancedSettings", value: "Advanced Settings", className: "advanced_settings_button"});
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
    elt("p", {className: `settings_header settings_header_main threshold-header ${config.soundDetection ? `thClosed`: ``}`, "data-thresholdHeader": true}, "🎣"),
    elt("p", {className: `settings_header settings_header_main soundDeteaction-header ${config.soundDetection ? ``: `thClosed`}`, "data-soundDetectionHeader": true}, "🔊"),
    elt(
      "div",
      { className: "settings_section threshold_settings" },
      elt('input', {type: `button`,  disabled: !config.autoTh || config.game == `Vanilla (splash)` || config.checkLogic == `pixelmatch`, name: `autoColor`, checked: config.autoTh && config.autoColor, style: `${config.soundDetection ? `display: none`: ``}`, className: `auto_button autoColor ${config.autoColor && config.game != `Vanilla (splash)` && config.autoTh && config.checkLogic != `pixelmatch` ? `auto_button_on` : ``}`, value: `Auto`}),
      elt('input', {type: `button`, disabled: config.game == `Vanilla (splash)`, name: `autoTh`, checked: config.autoTh && config.game != `Vanilla (splash)`, style: `${config.soundDetection ? `display: none`: ``}`, className: `auto_button autoTh ${config.autoTh && config.game != `Vanilla (splash)` ? `auto_button_on` : ``}`, value: `Auto`}),
      elt('input', {type: `button`, disabled: config.game == `Vanilla (splash)`, name: `autoSens`, checked: config.autoSens && config.game != `Vanilla (splash)`, style: `${config.soundDetection ? `display: none`: ``}`, className: `auto_button autoSens ${config.autoSens && config.game != `Vanilla (splash)` ? `auto_button_on` : ``}`, value: `Auto`}),

      !config.soundDetection ? wrapInLabel("Mode: ", renderColorSwitch(config), `The color the bot will search within Fishing Zone (${config.bobberColor}, in your case). If the water and environment is bluish, choose red color. If the water and environment is reddish, choose blue color.`) : ``,

      wrapInLabel(`${config.soundDetection ? `` : `Intensity: `}`,
        renderThreshold(config),
        !config.soundDetection ? `Decrease this value, if the bot can't find the bobber (e.g. at night, bad weather). Increase this value if you want the bot to ignore more ${config.bobberColor} colors.` :
        `The bot will listen to your main output device for any abrupt changes of sound to detect the "splash" sound when the bobber plunging. Sound range determines the sensitivity of listening.`
      ),
      !config.soundDetection ? wrapInLabel("Sensitivity: ", renderBobberSensitivity(config), config.game == `Vanilla (splash)` ?
       `The size of the zone which will be checked for splash, if the bot doesn't react to "plunging" animation - increase this value. If in Auto mode: The bot will auto-adjust both sensitivity value per each cast.`
       : `How sensitive the bot is to any movements (jerking, plunging) of the bobber. If the bot clicks too early, decrease this value (don't confuse it with when the bot missclicks on purpose). If the bot clicks on the bobber too late (or doesn't click at all), increase this value.`) : ``
    )
  );
}

module.exports = renderSettings;
