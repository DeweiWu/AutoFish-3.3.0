const createRgb = require("../utils/rgb.js");
const Jimp = require('jimp');

const createNotificationZone = ({ getDataFrom, zone }) => {
  const notifications = {
    isWarning: ([r, g, b]) => r - b > 150 && g - b > 150,
    isError: ([r, g, b]) => r - g > 175 && r - b > 175
  }

  return {
    async check(...type) {
      const colors = type.map((type) => {
        switch (type) {
          case "warning": {
            return notifications.isWarning;
          }
          case "error": {
            return notifications.isError;
          }
        }
      });

      for(const color of colors) {
        let data = await getDataFrom(zone);
        let rgb = createRgb(data);

        let foundColor = rgb.findColors({
          isColor: color,
          atFirstMet: true
        });
        if(foundColor) {
          return true;
        }
      }
    },
  };
};

module.exports = createNotificationZone;
