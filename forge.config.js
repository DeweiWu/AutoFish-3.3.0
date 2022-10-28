const generatedName = require('./app/utils/generateName.js');

const name = generatedName(10);

module.exports = {
  packagerConfig: {
    "name": name,
    "icon": "./app/img/icon-premium.ico"
  },
  makers: [
    {
      "name": "@electron-forge/maker-squirrel",
      "config": {
        "name": generatedName(10),
        "authors": generatedName(10),
        "description": 'Application',
        "setupIcon": "./app/img/icon-premium.ico",
        "setupExe": `AutoFish (${name}) Setup.exe`,
        "loadingGif": "./app/img/install.gif"
      }
    }
  ]
};
