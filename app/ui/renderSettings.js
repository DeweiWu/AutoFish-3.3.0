const elt = require("./utils/elt.js");
const wrapInLabel = require("./utils/wrapInLabel.js");

const renderThreshold = ({ threshold, bobberColor, autoTh, game, soundDetection, soundDetectionRange }) => {
  if(!soundDetection) {
    if(threshold < 1) threshold = 1;
    else if(threshold > 150) threshold = 150;
    const bobberColorSwitch = elt(`radio`, { className: `bobberColorSwitch ${autoTh ? `bobberColorSwitch_disabled` : ``}`,
                                  name: `bobberColor`,
                                  title: `Switch between blue and red feathers.`,
                                  value: bobberColor,
                                  style: `background-image: linear-gradient(to right, ${bobberColor == `red` ? `rgb(100, 0, 0), red` : `rgb(0, 90, 200), rgb(0, 0, 100)`});`
                                }, elt(`div`, {className: `switch_thumb ${bobberColor == `red` ? `switch_thumb_left` : `switch_thumb_right`}`}), elt(`span`, {className: `bobberColorSwitchText`}, `${bobberColor == `red` ? `Red Feather` : `Blue Feather`}`));
    if(game == `Vanilla (splash)`) autoTh = false;
    const autoThSwitch = elt(`radio`, { className: `autoTh`,
                                name: `autoTh`,
                                title: `Switch between auto and manual modes.`,
                                value: autoTh,
                                disabled: game == `Vanilla (splash)`,
                                style: `background-image: linear-gradient(to right, ${autoTh ? `#663c20, #fe954d` : `#a8a8a8, #4b4b4b`});`
                              }, elt(`div`, {className: `switch_thumb ${autoTh ? `switch_thumb_left` : `switch_thumb_right`}`}), elt(`span`, {className: `bobberColorSwitchText`},  `${autoTh ? `Auto` : `Manual`}`));

    const range = elt(`input`, { type: `range`, min: 1, max: 150, value: threshold, name: `threshold`, disabled: autoTh, className: `${autoTh ? `threshold_disabled` : ``}` });
    if(bobberColor == `blue`) {
      document.styleSheets[0].rules[77].style.backgroundImage = "linear-gradient(to right, rgb(0, 0, 100), rgb(0, 90, 200))"
    } else {
      document.styleSheets[0].rules[77].style.backgroundImage = "linear-gradient(to right, rgb(100, 0, 0), rgb(250, 0, 0))"
    }

    const number = elt(`input`, { type: `number`, className: `threshold_number_input`, value: threshold, disabled: autoTh, name: `threshold` });
    let bobberImg = elt(`div`, {id: `bobber`, style: `background-color: ${bobberColor == `blue` ? `rgb(0, 0, ${150 + Number(threshold)})` : `rgb(${150 + Number(threshold)}, 0, 0)`}`}, elt(`div`, {id: `bobberHandle`, style: `background-color: ${bobberColor == `blue` ? `rgb(0, 0, ${150 + Number(threshold)})` : `rgb(${150 + Number(threshold)}, 0, 0)`}`}));
    let waterImg = elt(`div`, {id: "water"}, bobberImg);

    const bobberContainer = elt(`div`, { className: `bobberContainer` }, waterImg, number, elt(`div`, {id: `grass`}));
    return elt(`div`, { className: `thresholdRange` }, bobberColorSwitch, range, bobberContainer, autoThSwitch);
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
    className: "option",
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
    className: "option",
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
  const checkbox = elt(`input`, {type: `checkbox`, disabled: game != `Retail`, checked: game != `Retail` ? false : useInt, style: `margin-right: 7px`, name: "useInt"});
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
        elt(`div`, {className: `premium_option`}, renderAfkmode(config)),
        `ONLY ON DIRECTX 11. The bot will automatically alt+tab after it casts (bringing back the previous window) and automatically focus the window of the game when it needs to catch. If you use your mouse too much during AFK fishing the whitelist feature might be unstable. `
      ),
      wrapInLabel(
        "Multiple Fishing: ",
        elt(`div`, {className: `premium_option`}, renderMultipleWindows(config)),
        `ONLY ON DIRECTX 11. If you want to use multiple windows check this option. You need to launch every window and configure them properly, make sure every window is in DirectX 11 mode. This option uses a different library to analyze your screen, you can check it even for one window if for some reason the default way doesn't work for you.`
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
    elt("p", {className: `settings_header settings_header_main threshold-header ${config.soundDetection ? `thClosed`: ``}`, "data-thresholdHeader": true}, "Threshold"),
    elt("p", {className: `settings_header settings_header_main soundDeteaction-header ${config.soundDetection ? ``: `thClosed`}`, "data-soundDetectionHeader": true}, "Sound"),
    elt(
      "div",
      { className: "settings_section threshold_settings" },
      wrapInLabel("",
        renderThreshold(config),
        !config.soundDetection ? `The bot will ignore all red/blue colors below this value. The higher the value the more red/blue colors the bot will ignore. The lower the value the more red/blue colors the bot will find. Min value: 10, max value: 150.  Increase this value if the bot can't pass the preliminary checks for red/blue colors in the fishing zone and there's nothing except the bobber there (e.g. red bottom in Durotar). Decrease this value, if the bobber is very dark and the bot can't find it (e.g. bad lighting, bad weather).` :
        `The bot will listen to your main output device for any abrupt changes of sound to detect the "splash" sound when the bobber plunging. Sound range determines the sensitivity of listening.`
      ),
    )
  );
}

module.exports = renderSettings;
