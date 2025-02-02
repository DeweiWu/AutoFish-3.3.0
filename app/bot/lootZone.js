const createRgb = require('../utils/rgb.js');
const Jimp = require('jimp');

const createLootZone = ({ getDataFrom, zone }) => {
  let colors = {
    blue: ([r, g, b]) => b - r > 80 && b - g > 80,
    green: ([r, g, b]) => g - r > 80 && g - b > 80,
    purple: ([r, g, b]) => r - g > 80 && b - g > 80
  };

  return {
    async findItems(...types) {
      let data = await getDataFrom(zone);
      let rgb = createRgb(data);

      for(const type of types) {
        let found = rgb.findColors({
         isColor: colors[type],
         atFirstMet: true
        });
       if(found) {
         return found;
       }
      }
    }
  }
};

module.exports = createLootZone;
