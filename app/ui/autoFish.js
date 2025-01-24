const elt = require("./utils/elt.js");
const { ipcRenderer } = require("electron");
const { connectToStream, stopStream } = require('./webcam.js');

const renderLogo = () => {
  return elt(
    "div",
    { className: "logo" }
  );
};

const renderProfiles = (profiles) => {
  let select = elt(`select`, null, ...profiles.users.map(profile => elt(`option`, {selected: profile == profiles.selected}, profile)))

  let add = elt(`input`, {type: `button`, title: `Add a new profile`, style: `color: green`, className: `profile_button profile_button_add`, state: `+`});
  let remove = elt(`input`, {type: `button`, title: `Delete this profile`, style: `color: red`, className: `profile_button profile_button_remove`, state: `x`});
  let save = elt(`input`, {type: `button`, title: `Save config`,style: `color: green`, onclick() {
    ipcRenderer.send('save-config');
  }, className: `profile_button profile_button_save`});
  let load = elt(`input`, {type: `button`, title: `Load config`, style: `color: green`, className: `profile_button profile_button_load`});

  let dom = elt(`div`, {className: `profiles`}, select, add, remove, save, load);
  let value = ``;

  return {value, dom, select, add, save, load, remove};
}

const loggerMemory = [];

const renderLogger = () => {
  return {
    dom: elt("section", { className: `logger` }),
    show({ text, type, position, margin }) {
      let row = elt("p", {style: `text-align: ${position ? position : "left"}; margin: ${margin ? margin : ``}`}, text);
      /*
      loggerMemory.push(row);
      if(loggerMemory.length > 100) {
        loggerMemory.shift().remove()
      }
      */
      row.style.color = type;
      this.dom.append(row);
      this.dom.scrollTop += 30;
    },
  };
};

const renderLoggerStats = () => {
  let fishCaught = elt('span', {style: `cursor: help;`, className: `stats-icon`, title: `Caught.`}, `🐟: 0`);
  let fishMissed = elt('span', {style: `cursor: help;`, className: `stats-icon`, title: `Missed.`}, `🙁: 0`);
  let timeSpent = elt('span', {style: `cursor: help;`, className: `stats-icon`, title: `Time passed (min).`}, `🕑: 0`);
  let dom = elt('p', {className: `settings_header settings_header_log settings_header_main stats_logger`}, fishCaught, fishMissed, timeSpent);
  return {
    dom,
    showStats(stats, time) {
      fishCaught.textContent = `🐟: ${stats.caught}`;
      fishMissed.textContent = `🙁: ${stats.miss + stats.confused}`;
      timeSpent.textContent = `🕑: ${Math.floor(time / 1000 / 60)}`
    }
  }
}

class AutoFish {
  constructor(settings, startButton, profiles) {
    this.settings = settings;
    this.button = startButton;
    this.logger = renderLogger();
    this.loggerStats = renderLoggerStats();
    let profile = renderProfiles(profiles);

    ipcRenderer.on('connect-to-stream-main', (event, {deviceId, screenSize, mWin, soundDetection}) => {
      connectToStream(deviceId, screenSize, mWin, soundDetection)
      .then(() => {
          ipcRenderer.send('connect-to-stream-main-end')
      })
      .catch(e => {
          ipcRenderer.send('connect-to-stream-main-end', e)
      })
    });

    const inputTextWriting = (event) => {
       profile.value = event.target.value;
    };

    let mouseOverProfileAdd = false;

    profile.add.addEventListener(`mouseover`, () => mouseOverProfileAdd ? null : mouseOverProfileAdd = true);
    profile.add.addEventListener(`mouseout`, () => mouseOverProfileAdd = false);

    const inputTextDone = async (event) => {
      event.target.remove();
      profile.select.style = `visibility: visible; position: static;`;
      if(event.target.value == `` || !mouseOverProfileAdd) {
        profile.add.state = `+`;
        profile.add.style.backgroundImage = "url('img/add.png')"
      } else {
        ipcRenderer.invoke(`create-user`, event.target.value.trim())
        .then(() => {
          let option = elt(`option`, {selected: true}, event.target.value.trim());
          profile.select.append(option);
        })
      }
      event.target.removeEventListener(`blur`, inputTextDone);
      event.target.removeEventListener(`change`, inputTextWriting);
    };

    profile.remove.addEventListener(`mousedown`, async () => {
      let user = profile.select.value;

      ipcRenderer.invoke("delete-user", user)
      .then(async (another) => {
        if(!another) return;
        if(user == `Default`) return;
        [...profile.select.options].find(child => child.value == user).remove();
        profile.select.value = another;
        this.settings.config = await ipcRenderer.invoke("get-settings");
        this.settings.reRender();
      })
      .catch(e => console.log(e))
    });

    profile.add.addEventListener(`click`, () => {
      if(profile.add.state == `v`) {
        profile.add.state = `+`;
        profile.add.style.backgroundImage = "url('img/add.png')"
        return;
      }
      profile.select.style = `visibility: hidden; position: absolute;`;
      profile.add.state = `v`;
      profile.add.style.backgroundImage = "url('img/ok.png')"
      let inputText = elt(`input`, {type: `text`, className: `profiles_text`});
      inputText.addEventListener(`change`, inputTextWriting);
      profile.dom.prepend(inputText);
      inputText.focus();
      inputText.addEventListener(`blur`, inputTextDone);
    });

    profile.load.addEventListener(`click`, async () => {
      await ipcRenderer.invoke("load-config");
      let profiles = await ipcRenderer.invoke("get-profiles");
      profile.select.innerHTML = ``;
      profiles.users.forEach(user => profile.select.append(elt(`option`, {selected: user == profiles.selected}, user)));
      await ipcRenderer.invoke("change-selected-profile", profiles.selected);
      this.settings.config = await ipcRenderer.invoke("get-settings");
      this.settings.reRender();
    })

    profile.select.addEventListener(`change`, async (event) => {
      await ipcRenderer.invoke("change-selected-profile", event.target.value)
      this.settings.config = await ipcRenderer.invoke("get-settings");
      this.settings.reRender();
    })

    const premiumIcon = elt(`img`, { className: `premium_icon`, src: `img/premium.png` });
    const versionNode = elt("span");
    const donateLink = elt(
      "a",
      {
        href: `#`,
        className: "donateLink",
        onclick: () => ipcRenderer.send("open-link-donate"),
      },
      `Premium`
    );
    const footer = elt(`p`, { className: "version" }, versionNode, premiumIcon);

    ipcRenderer.on("set-version", (event, version, trial) => {
      versionNode.textContent = `ver. 3.2.0 ${trial ? `Trial ${trial}` : `Premium`} `;
      if(trial) {
        versionNode.append(donateLink);
      }
    });

    ipcRenderer.on('start-by-fishing-key', () => {
      if(!this.button.state) {
        this.button.dom.click();
      }
    });

    this.settings.regOnChange((config) => {
      ipcRenderer.send("save-settings", config);
    });

    this.settings.regOnClick((config, node) => {
      node.style.cursor = 'progress';
      ipcRenderer.invoke("advanced-settings", config).then(() => {
        node.style.cursor = 'pointer';
      })
    });

    this.settings.regOnFishingZoneClick((button) => {
      button.style.cursor = 'progress';
      ipcRenderer.invoke("start-bot", `relZone`).then(() => {
        button.style.cursor = 'pointer';
      })
    });

    this.settings.regOnDetectZoneClick((button) => {
      button.style.cursor = 'progress';
      ipcRenderer.invoke("start-bot", `detectZone`).then(() => {
        button.style.cursor = 'pointer';
      })
    });

    this.settings.regOnChatZoneClick((button) => {
      button.style.cursor = 'progress';
      ipcRenderer.invoke("start-bot", `chatZone`).then(() => {
        button.style.cursor = 'pointer';
      })
    });

    this.settings.regOnAfkFishing(() => {
      ipcRenderer.send("afk-fishing-warn");
    });

    this.settings.regOnMultipleFishing(() => {
      ipcRenderer.send("multiple-fishing-warn");
    });

    this.settings.regOnWhitelistWarn(() => {
      ipcRenderer.send("whitelist-warn");
    });

    this.button.regOnStart(() => {
      ipcRenderer.invoke("start-bot");
    });

    this.button.regOnStop(() => {
      ipcRenderer.send("stop-bot");
    });

    ipcRenderer.on("settings-change", (event, settings) => {
      if(settings) {
        this.settings.config = settings;
      }

      this.settings.reRender();
    });

    ipcRenderer.on("set-game", (event, game) => {
      this.settings.config.game = game;
      this.settings.reRender();
    });


    ipcRenderer.on("show-loading-cursor-start", () => {
      document.body.style.cursor = 'progress';
    });

    ipcRenderer.on("show-loading-cursor-end", () => {
      document.body.style.cursor = 'default';
    });

    ipcRenderer.on('start-tm', () => {
        this.button.dom.click();
    });

    ipcRenderer.on(`stop-tm`, () => {
      if(this.button.state) {
        this.button.dom.click();
      }
    })

    ipcRenderer.on("stop-bot", () => {
      this.button.onError();
    });

    ipcRenderer.on("log-data", (event, data) => {
      this.logger.show(data);
    });

    ipcRenderer.on('log-data-stats', (event, stats, time) => {
      this.loggerStats.showStats(stats, time)
    })

    let settingsVisibility = true;
    let foldSettingsContainer = elt(`img`, {src: `img/unfold.png`, className: `settingsFolder`})
    foldSettingsContainer.addEventListener(`click`, (event) => {
        if(settingsVisibility) {
          this.settings.dom.style = `display: none;`;
          ipcRenderer.send(`resize-win`, {width: 341, height: 403})
          event.target.src = `img/fold.png`;
          document.querySelector(`.settings_header_fold`).style = `border-bottom: 1px solid grey; border-radius: 5px`;
        } else {
          this.settings.dom.style = `display: block`;
          ipcRenderer.send(`resize-win`, {width: 341, height: 689})
          event.target.src = `img/unfold.png`
          document.querySelector(`.settings_header_fold`).style = ``;
        }
        settingsVisibility = !settingsVisibility;
    })

    this.dom = elt(
      "div",
      { className: "AutoFish" },
      renderLogo(),
            elt(`div`, {className: `settings_profile`}, elt("p", { className: "settings_header settings_header_main settings_header_fold"}, "⚙️"), foldSettingsContainer, profile.dom),
      this.settings.dom,
            elt(`div`, {style: `display: flex; flex-flow: row nowrap; justify-content: space-between;`}, elt("p", { className: "settings_header settings_header_log settings_header_main" }, "📋"), this.loggerStats.dom),
      this.logger.dom,
      this.button.dom,
      footer
    );
  }
}

module.exports = AutoFish;
