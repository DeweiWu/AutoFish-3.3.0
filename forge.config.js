const path = require('path');

// obfuscator.js is intentionally not part of the public source tree. Builds
// must still work for contributors and CI when that optional file is absent.
let obfuscateFiles;
try {
  ({ obfuscateFiles } = require('./obfuscator.js'));
} catch (error) {
  obfuscateFiles = null;
}

let name = 'AutoFish Premium'

module.exports = {
  hooks: {
    prePackage: async (forgeConfig, appProcess) => {
       if (obfuscateFiles) {
         await obfuscateFiles(['./app/main.js']);
       }
    },
  },
  packagerConfig: {
    "name": name,
    "icon": "./app/img/icon-premium.ico",
    "asar": {
      unpackDir: path.join('**', '{app/config,node_modules/sharp}', '**', '*'),   // Unpack the entire config directory
      unpack: path.join('**', '{app/badd7ae8f43,app/config/config.json,app/config/logs.json,app/utils/rtmp/mediamtx.exe,app/utils/rtmp/mediamtx.yml,app/utils/rtmp/mediamtx.log}')
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
    ...(process.platform === 'win32' ? [{
      name: '@electron-forge/maker-squirrel',
      config: {
        name: 'AutoFishPremium',
        authors: 'jsbots',
        description: 'An easy-to-use fishing bot for official and unofficial wow servers.',
        setupIcon: './app/img/icon-premium.ico'
      }
    }] : []),
    {
      "name": "@electron-forge/maker-zip",
      "config": {
        "name": name,
        "authors": 'jsbots',
        "description": '',
        "setupIcon": "./app/img/icon-premium.ico",
        "setupExe": `AutoFish (${name}) Setup.exe`,
        "skipUpdateIcon": true,
        "iconUrl": "https://raw.githubusercontent.com/jsbots/AutoFish/main/app/img/icon-premium.ico",
        "loadingGif": "./app/img/install.gif"
      }
    }
  ]
};
