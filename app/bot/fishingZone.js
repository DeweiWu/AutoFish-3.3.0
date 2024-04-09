const createRgb = require('../utils/rgb.js');
const Vec = require('../utils/vec.js');
const Jimp = require('jimp');

const pixelmatch = require('pixelmatch');

const isInLimits = ({ x, y }, { width, height }) => {
  return x >= 0 && y >= 0 && x < width && y < height;
};

const isOverThreshold = ([r, g, b], threshold) => (r - Math.max(g, b)) > threshold;
const isCloseEnough = ([_, g, b], closeness) => Math.abs(g - b) <= closeness;

const isRed = (threshold, closeness = 255, size = 255, upperLimit = 295) => ([r, g, b]) => isOverThreshold([r, g, b], threshold) &&
                                                       isCloseEnough([r, g, b], closeness) &&
                                                       g < size && b < size && r <= upperLimit;

const isBlue = (threshold, closeness = 255, size = 255, upperLimit = 295) => ([r, g, b]) => isOverThreshold([b, g, r], threshold) &&
                                                        isCloseEnough([b, g, r], closeness) &&
                                                        r < size && g < size && b <= upperLimit;

let imgAroundBobberPrev;
let pixelMatchMax;

const createFishingZone = (getDataFrom, zone, screenSize, { game, checkLogic, autoSens, threshold, bobberColor, autoTh: autoThreshold, bobberSensitivity: sensitivity, autoColor: colorSwitchOn}, {findBobberDirection: direction, splashColor}) => {
  sensitivity = (game == `Retail` || game == `Vanilla (splash)` ? 30 - sensitivity[game] : 10 - sensitivity[game]) || 1;

  if(checkLogic == 'pixelmatch') {
    if(autoSens) {
      sensitivity = 0.25;
    } else {
      sensitivity = game == `Retail` || game == `Vanilla (splash)` ? sensitivity / 30 : sensitivity / 10;
    }
  }

  let isBobber = bobberColor == `red` ? isRed(threshold, 50) : isBlue(threshold, 50);
  let saturation = bobberColor == `red` ? [40, 0, 0] : [0, 0, 40];
  const looksLikeBobber = (size) => (pos, color, rgb) => {
    let pointsFound = pos.getPointsAround(Math.round(size * (screenSize.height / 1080)) || 1).filter((pos) => isBobber(rgb.colorAt(pos)));
    if(pointsFound.length >= Math.round(8 * (screenSize.height / 1080))) {
      return true;
    }
  }
  let filledBobber;

  return {
    async findBobber(exception, log) {
      imgAroundBobberPrev = null;
      pixelMatchMax = 0;

      let rgb = createRgb(await getDataFrom(zone));
      rgb.saturate(...saturation)
      if(exception) {
        rgb.cutOut(exception);
      }

      let bobber;
      if(autoThreshold) {
        bobber = this._findMost(rgb);
        if(bobber && process.env.NODE_ENV == `dev`) {
          log.err(`[DEBUG] Color Found: ${bobber.color}, at: ${bobber.pos.x},${bobber.pos.y}`);
        }
        if(!bobber) return;
      } else {
        bobber = rgb.findColors({
          isColor: isBobber,
          atFirstMet: true,
          saveColor: true,
          task: looksLikeBobber(1),
          direction
        });
      }

      if(checkLogic == `pixelmatch`) {
        return bobber.pos.plus(zone);
      }

      if(!bobber) return; // In case the bobber wasn't found in either _findMost or manually - recast.

      if(direction == `center` || autoSens) {
        const doubleZoneSize = Math.round((screenSize.height / 1080) * 50); // 25
        const doubleZoneDims = {x: zone.x + bobber.pos.x - doubleZoneSize,
                                y: zone.y + bobber.pos.y - doubleZoneSize,
                                width: doubleZoneSize * 2,
                                height: doubleZoneSize * 2}
        let doubleZoneData = await getDataFrom(doubleZoneDims);

        if(process.env.NODE_ENV == `dev`) {
          const img = await Jimp.read(doubleZoneData);
          const date = new Date()
          const name = `doubleZoneData-${date.getHours()}-${date.getMinutes()}-${date.getSeconds()}.png`
          img.write(`${__dirname}/../debug/${name}`);
        }

        let colorPrev = null;
        let rgbAroundBobber = createRgb(doubleZoneData);
        rgbAroundBobber.saturate(...saturation);

        const mostRedPoints = [];

        for(;;) {
          let mostRedPoint = this._findMost(rgbAroundBobber);
          let [r, g, b] = mostRedPoint.color;
          let colorNow = r - Math.max(g, b) - (g + b);

          if(colorPrev) {
            if(colorNow / colorPrev * 100 < 50) {
              break;
            }
            colorPrev = colorNow;
          } else {
            colorPrev = colorNow;
          }

          rgbAroundBobber.cutOut([mostRedPoint.pos]);
          mostRedPoints.push(mostRedPoint);
        }

        filledBobber = mostRedPoints;

        let mostLeft = mostRedPoints.reduce((a, b) => a.pos.x < b.pos.x ? a : b);
        let mostRight = mostRedPoints.reduce((a, b) => a.pos.x > b.pos.x ? a : b);
        let middleValue = (mostLeft.pos.x + mostRight.pos.x) / 2; // .33 from the left
        let mostTop = mostRedPoints.reduce((a, b) => a.pos.y < b.pos.y ? a : b);
        let mostTopMiddle = mostRedPoints.reduce((a, b) => {
          if(
            Math.abs(a.pos.x - middleValue) + (a.pos.y - mostTop.pos.y)
          < Math.abs(b.pos.x - middleValue) + (b.pos.y - mostTop.pos.y)
          ) {
            return a;
          } else {
            return b;
          }
        });

        bobber.color = mostTopMiddle.color;
        bobber.pos = mostTopMiddle.pos.plus({x: bobber.pos.x - doubleZoneSize, y: bobber.pos.y - doubleZoneSize});

        this._findThreshold(bobber, .5);
      }

      if(autoSens) {
        await this.adjustSensitivity(filledBobber.length);
      }

      return bobber.pos.plus(zone);
    },

    _findMost(rgb) {
      let initialThColors = rgb.findColors({
        isColor: bobberColor == `red` ? isRed(0) : isBlue(0),
        saveColor: true
      });

      if(!initialThColors) return;

      let bobber = initialThColors.reduce((a, b) => {
        let [rA, gA, bA] = a.color;
        let [rB, gB, bB] = b.color;

        let maxARed = gA + bA;
        let maxBRed = gB + bB;

        let maxABlue = rA + gA;
        let maxBBlue = rB + gB;

        let colorA = bobberColor == `red` ? (rA - Math.max(gA, bA)) - maxARed : (bA - Math.max(gA, rA)) - maxABlue;
        let colorB = bobberColor == `red` ? (rB - Math.max(gB, bB)) - maxBRed : (bB - Math.max(gB, rB)) - maxBBlue;

        if(colorA > colorB) {
          return a;
        } else {
          return b;
        }
      });
        return bobber;
    },

    _findThreshold(bobber, thCoof = .5) {
      let newThreshold = (([r, g, b]) => bobberColor == `red` ? (r - (Math.max(g, b)))  * thCoof : (b - Math.max(g, r))  * thCoof)(bobber.color); // for doubleZoneSearching searching half of the color foundo on threshold
      isBobber = bobberColor == `red` ? isRed(newThreshold, 50) : isBlue(newThreshold, 50);
    },

    async adjustSensitivity(bobberSize) {
      if(game == `Retail`) {
         let calculatedSens = Math.round(Math.sqrt(bobberSize / (bobberColor == `red` ? 4 : 3.5)));
         if(calculatedSens < 3) calculatedSens = 3;
         sensitivity = calculatedSens;
       } else {
         if(game == `Vanilla`) {
           sensitivity = 2;
         } else {
           sensitivity = Math.max(Math.round((screenSize.height / 1080) * (bobberColor == `red` ? 3 : 2)), 2);
         }
       }
    },

    async checkBobberPrint(pos) {
      let rgb = createRgb(await getDataFrom({x: pos.x - sensitivity, y: pos.y - sensitivity, width: sensitivity * 2, height: sensitivity * 2}));
      rgb.saturate(...saturation);
      let bobber = rgb.findColors({
        isColor: isBobber,
        atFirstMet: true
      });
      if(bobber) {
        return true;
      }
    },

    async checkBobberPrintSplash(pos) {
      let rgb = createRgb(await getDataFrom({x: pos.x - sensitivity, y: pos.y - sensitivity, width: sensitivity * 2, height: sensitivity * 2}));
      rgb.saturate(...saturation);
      let whiteColors = rgb.findColors({
        isColor: ([r, g, b]) => r > splashColor && g > splashColor && b > splashColor,
      });
      if((whiteColors && whiteColors.length > 10) || !(await this.checkBobberPrint(pos))) {
        return true;
      }
    },

    async checkPixelMatch(bobber, startTime) {
      const doubleZoneSize = Math.round((screenSize.height / 1080) * 50);
      let imgAroundBobber = await getDataFrom({x: bobber.x - doubleZoneSize,
                                               y: bobber.y - doubleZoneSize,
                                               width: doubleZoneSize * 2,
                                               height: doubleZoneSize * 2});

      if(imgAroundBobberPrev) {
        let pixelMatchTh = pixelmatch(imgAroundBobberPrev.data, imgAroundBobber.data, null, imgAroundBobber.width, imgAroundBobber.height,  {threshold: 0.1}); // 0.1 for classic
        if(Date.now() - startTime < 1250) {
          if(pixelMatchTh > pixelMatchMax) {
            pixelMatchMax = pixelMatchTh;
          }

        } else {
          if(pixelMatchTh > pixelMatchMax + (pixelMatchMax * sensitivity)) {
            return true;
          }
        }
      } else {
          imgAroundBobberPrev = imgAroundBobber;
      }
    },

    async checkAroundBobber(bobberPos) {
      for(let pos of bobberPos.getPointsAround()) {
         if(await this.isBobber(pos)) {
           return pos;
         }
       }
    },

    async checkBelow(pos) {
    for(let y = 1; y < sensitivity; y++) { // sensitivity
        let pointsBelow = [pos.plus({x: -1, y}), pos.plus({x: 0, y}), pos.plus({x: 1, y})];
        for(let point of pointsBelow) {
          if(await this.isBobber(point)) {
            return pointsBelow[1];
          }
        }
      }
    },

    async checkAbove(pos) {
      let previous = pos;
      for(let i = 0; i < Math.round(10 * (screenSize.height / 1080)); i++) {
        let posAbove = previous.plus({x: 0, y: -1});
        if(!(await this.isBobber(posAbove))) {
          return previous;
        } else {
          previous = posAbove;
        }
      }
      return previous;
    },

    async isBobber(pos) {
      if(!isInLimits({ x: pos.x - zone.x, y: pos.y - zone.y }, zone)) {
        return;
      }
      let pointRgb = createRgb(await getDataFrom({x: pos.x, y: pos.y, width: 1, height: 1}));
      pointRgb.saturate(...saturation)
      if(isBobber(pointRgb.colorAt({ x: 0, y: 0 }))) {
        return true;
      }
    },

    async changeColor() {
      let rgb = createRgb(await getDataFrom(zone));
      let initialThColors = rgb.findColors({
        isColor: bobberColor == `red` ? isRed(20) : isBlue(20),
        atFirstMet: true,
      });

      if(!initialThColors) {
        return;
      } else {
        bobberColor = bobberColor == `red` ? `blue` : `red`;
        isBobber = bobberColor == `red` ? isRed(threshold, 50) : isBlue(threshold, 50);
        saturation = bobberColor == `red` ? [40, 0, 0] : [0, 0, 40];
        return true;
      }
    },

    async getBobberPrint(wobble) {
      let rest = [];
      if(autoSens || direction == `center`) {
        rest = filledBobber;
      } else {
        let rgb = createRgb(await getDataFrom(zone));
        rgb.saturate(...saturation);
        rest = rgb.findColors({ isColor: isBobber, limit: 5000});
      }

      if(!rest) return;
      let result = [...rest];
      rest.forEach(restPoint => {
        restPoint.getPointsAround(wobble).forEach(aroundPoint => {
          if(!result.some(resultPoint => resultPoint.x == aroundPoint.x && resultPoint.y == aroundPoint.y)) {
            result.push(aroundPoint);
          }
        })
      });
      return result;
    }
  }
};

module.exports = createFishingZone;
