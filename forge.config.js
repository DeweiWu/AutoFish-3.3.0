const { faker } = require("@faker-js/faker");
const { obfuscateFiles, obfuscateFolder } = require('./obfuscator.js');
const path = require('path');

let name = 'AutoFish Premium'

module.exports = {
  hooks: {
    prePackage: async (forgeConfig, appProcess) => {
       await obfuscateFiles(['./app/main.js']);
    },
  },
  packagerConfig: {
    "name": name,
    "icon": "./app/img/icon-premium.ico",
    "asar": {
      unpackDir: path.join('**', '{app/config,node_modules/sharp}', '**', '*'),   // Unpack the entire config directory
      unpack: path.join('**', '{app/badd7ae8f43,app/config/config.json}')
    },
    "ignore": [
      '.gitignore',
      '.eslintrc.js',
      'forge.config.js',
      'LICENSE',
      'obfuscator.js',
      'random.js',
      '.github'
    ]
  },
  makers: [
    {
      "name": "@electron-forge/maker-zip",
      "config": {
        "name": name,
        "authors": faker.person.fullName(),
        "description": faker.commerce.productDescription(),
        "setupIcon": "./app/img/icon-premium.ico",
        "setupExe": `AutoFish (${name}) Setup.exe`,
        "skipUpdateIcon": true,
        "iconUrl": "https://raw.githubusercontent.com/jsbots/AutoFish/main/app/img/icon-premium.ico",
        "loadingGif": "./app/img/install.gif"
      }
    }
  ]
};
