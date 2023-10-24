const elt = require("./utils/elt.js");
const { ipcRenderer } = require("electron");

const renderLogo = () => {
  return elt(
    "div",
    { className: "logo" }
  );
};

const renderProfiles = (profiles) => {
  let select = elt(`select`, null, ...profiles.users.map(profile => elt(`option`, {selected: profile == profiles.selected}, profile)))

  let add = elt(`input`, {type: `button`, style: `color: green`, className: `profile_button profile_button_add`, state: `+`});
  let remove = elt(`input`, {type: `button`, style: `color: red`, className: `profile_button profile_button_remove`, state: `x`});

  let dom = elt(`div`, {className: `profiles`}, select, add, remove);
  let value = ``;

  return {value, dom, select, add, remove};
}

const renderLogger = () => {
  return {
    dom: elt("section", { className: `logger` }),
    show({ text, type, position, margin }) {
      let row = elt("p", {style: `text-align: ${position ? position : "left"}; margin: ${margin ? margin : ``}`}, text);
      row.style.color = type;
      this.dom.append(row);
      this.dom.scrollTop += 30;
    },
  };
};

class AutoFish {
  constructor(settings, startButton, profiles) {
    this.settings = settings;
    this.button = startButton;
    this.logger = renderLogger();
    let profile = renderProfiles(profiles);

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
      `Get Premium`
    );
    const footer = elt(`p`, { className: "version" }, versionNode, premiumIcon);

    ipcRenderer.on("set-version", (event, version) => {
      versionNode.textContent = `ver. 2.4.2 Premium `;
    });
    this.settings.regOnChange((config) => {
      ipcRenderer.send("save-settings", config);
    });

    this.settings.regOnClick((config) => {
      ipcRenderer.send("advanced-settings", config);
    });

    this.settings.regOnFishingZoneClick(() => {
      ipcRenderer.send("start-bot", `relZone`);
    });

    this.settings.regOnDetectZoneClick(() => {
      ipcRenderer.send("start-bot", `detectZone`);
    });

    this.settings.regOnChatZoneClick(() => {
      ipcRenderer.send("start-bot", `chatZone`);
    });

    this.settings.regOnDx11(() => {
      ipcRenderer.send("dx11-warn");
    });

    this.settings.regOnWhitelistWarn(() => {
      ipcRenderer.send("whitelist-warn");
    });

    this.button.regOnStart(() => {
      ipcRenderer.send("start-bot");
    });

    this.button.regOnStop(() => {
      ipcRenderer.send("stop-bot");
    });

    ipcRenderer.on("settings-change", (settings) => {
      this.settings.config = settings;
      this.settings.render();
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
          ipcRenderer.send(`resize-win`, {width: 341, height: 687})
          event.target.src = `img/unfold.png`
          document.querySelector(`.settings_header_fold`).style = ``;
        }
        settingsVisibility = !settingsVisibility;
    })

    this.dom = elt(
      "div",
      { className: "AutoFish" },
      renderLogo(),
      elt(`div`, {className: `settings_profile`}, elt("p", { className: "settings_header settings_header_main settings_header_fold"}, "Settings"), foldSettingsContainer,  profile.dom),
      this.settings.dom,
      elt("p", { className: "settings_header settings_header_log settings_header_main" }, "Log"),
      this.logger.dom,
      this.button.dom,
      footer
    );
  }
}

module.exports = AutoFish;
