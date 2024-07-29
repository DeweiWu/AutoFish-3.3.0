const { faker } = require("@faker-js/faker");
const { obfuscateFiles, obfuscateFolder } = require('./obfuscator.js');
const path = require('path');

process.env.NODE_ENV = 'prod';
let name = process.env.NODE_ENV == 'dev' ? 'AutoFish Premium' : 'app';

module.exports = {
  hooks: {
    prePackage: async (forgeConfig, appProcess) => {
      process.env.NODE_ENV == 'dev' ? await obfuscateFolder('./app') : await obfuscateFiles(['./app/main.js']);
    },
  },
  packagerConfig: {
    "name": name,
    "icon": "./app/img/icon-premium.ico",
    "asar": {
      unpackDir: 'app/config',   // Unpack the entire config directory
      unpack: 'app/config/**'    // Additionally, ensure all files in the config directory are unpacked
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
