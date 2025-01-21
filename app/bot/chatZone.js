const createRgb = require('../utils/rgb.js');
const Jimp = require("jimp");

const closeEnough = value => (v1, v2) => Math.abs(v1 - v2) <= value;

const createChatZone = ({ getDataFrom, zone, screenSize, whispSpecColors }) => {
  let whisperColor = ([r, g, b]) => whispSpecColors.some(specColor => {

    let percR = 255 - (255 * (specColor.percent / 100))
    let percG = 255 - (255 * (specColor.percent / 100))
    let percB = 255 - (255 * (specColor.percent / 100))

    return closeEnough(percR)(specColor.r, r) && closeEnough(percG)(specColor.g, g) && closeEnough(percB)(specColor.b, b)
  });

  let previousMsg = [];

  return {
    async checkNewMessages() {
      const rgb = createRgb(await getDataFrom(zone));
      const whisperMsg = rgb.findColors({ isColor: whisperColor });
      if(whisperMsg) {
        if(!closeEnough((screenSize.height / 1080) * 15)(previousMsg.length, whisperMsg.length)) {
          previousMsg = whisperMsg;
          return true;
        }
      }
    },

    async getImage() {
      const img = await Jimp.read(await getDataFrom(zone));
      return await img.getBufferAsync(Jimp.MIME_JPEG)
    }
  }
};

module.exports = createChatZone;
