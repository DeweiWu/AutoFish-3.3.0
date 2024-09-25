const createRgb = require("../utils/rgb.js");
const Jimp = require('jimp');

const mouseWithinZone = (mouse, zone) => {
  return (
    mouse.x - zone.x > 0 &&
    mouse.y - zone.y > 0 &&
    mouse.x < zone.x + zone.width &&
    mouse.y < zone.y + zone.height
  );
};


const createRedButtonZone = ({getDataFrom, zone}) => {
  const isRed = ([r, g, b]) => r - g > 100 && r - b > 100;
  const isYellow = ([r, g, b]) => r - b > 150 && g - b > 150;
  const isWhite = ([r, g, b]) => r > 195 && g > 195 && b > 195;
  return {
    async isOn(mousePos) {
      const rgb = createRgb(await getDataFrom(zone));
      let red = rgb.findColors({isColor: isRed, atFirstMet: true});
      let yellow = mouseWithinZone(mousePos, zone) || rgb.findColors({isColor: isYellow, atFirstMet: true});
      if(red && yellow) {
        return {red, yellow};
      }
    },

    async isOnAfterHighlight() {
      const rgb = createRgb(await getDataFrom(zone));
      return rgb.findColors({isColor: isWhite, atFirstMet: true})
    }
  }
};

module.exports = createRedButtonZone;
