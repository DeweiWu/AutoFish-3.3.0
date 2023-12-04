const generatedName = require('./app/utils/generateName.js');

const random = (from, to) => {
  return from + Math.random() * (to - from);
};

const name = generatedName(Math.floor(random(5, 15)));


module.exports = {
  packagerConfig: {
    "name": name,
    "icon": "./app/img/icon-premium.ico"
  },
  makers: [
    {
      "name": "@electron-forge/maker-squirrel",
      "config": {
        "name": generatedName(Math.floor(random(5, 15))),
        "authors": generatedName(Math.floor(random(5, 15))),
        "description": 'Application',
        "setupIcon": "./app/img/icon-premium.ico",
        "setupExe": `AutoFish (${name}) Setup.exe`,
        "skipUpdateIcon": true,
        "iconUrl": "https://raw.githubusercontent.com/jsbots/AutoFish/main/app/img/icon-premium.ico",
        "loadingGif": "./app/img/install.gif"
      }
    }
  ]
};
