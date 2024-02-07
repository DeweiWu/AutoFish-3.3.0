const createRgb = require("../utils/rgb.js");
const mouseWithinZone = (mouse, zone) => {
  return (
    mouse.x - zone.x > 0 &&
    mouse.y - zone.y > 0 &&
    mouse.x < zone.x + zone.width &&
    mouse.y < zone.y + zone.height
  );
};


const createRedButtonZone = ({getDataFrom, zone}) => {
  const isRed = ([r, g, b]) => r - g > 150 && r - b > 150;
  const isYellow = ([r, g, b]) => r - b > 200 && g - b > 200;
  const isWhite = ([r, g, b]) => r > 240 && g > 240 && b > 240;
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
