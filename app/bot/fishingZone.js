const createRgb = require('../utils/rgb.js');
const Vec = require('../utils/vec.js');
const Jimp = require('jimp');
const { hexToRgb } = require('../utils/colors.js');
const pixelmatch = require('pixelmatch');

const sleep = (time) => {
  return new Promise((resolve) => {
    setTimeout(resolve, time);
  });
};

const isInLimits = ({ x, y }, { width, height }) => {
  return x >= 0 && y >= 0 && x < width && y < height;
};
let nnnn = 0;

let smallLentgthAttempt = 0
const closeEnough = value => (v1, v2) => Math.abs(v1 - v2) <= value;

const isOverThreshold = ([r, g, b], threshold) => (r - Math.max(g, b)) > threshold;
const isCloseEnough = ([_, g, b], closeness) => Math.abs(g - b) <= closeness;

const isRed = (threshold, closeness = 255, size = 255, upperLimit = 335) => ([r, g, b]) => isOverThreshold([r, g, b], threshold) &&
                                                       isCloseEnough([r, g, b], closeness) &&
                                                       g < size && b < size && r <= upperLimit; // && g != 0 && b != 0 ???

const isBlue = (threshold, closeness = 255, size = 255, upperLimit = 335) => ([r, g, b]) => isOverThreshold([b, g, r], threshold) &&
                                                        isCloseEnough([b, g, r], closeness) &&
                                                        r < size && g < size && b <= upperLimit; // && r != 0 && g != 0 ???

const isManual = (specColor, percentPrecision) => ([r, g, b]) => {

  if(percentPrecision > 100) percentPrecision = 100;

  let percR = specColor.r / 100 * (100 - percentPrecision);
  let percG = specColor.g / 100 * (100 - percentPrecision);
  let percB = specColor.b / 100 * (100 - percentPrecision);

  return closeEnough(percR)(specColor.r, r) && closeEnough(percG)(specColor.g, g) && closeEnough(percB)(specColor.b, b)
}

let nn = 0;
let nnn = 0;
let checkBobberPrintAttempts = 0;

let imgAroundBobberPrev;
let pixelMatchMax;

const createFishingZone = (getDataFrom, zone, screenSize, { game, checkLogic, autoSens, threshold, bobberColor, bobberColorManual, autoTh, bobberSensitivity: sensitivity}, {findBobberDirection: direction, streamMode, highlightPercent, splashColor, manualPositionOnBobberOn, manualPositionOnBobber }) => {

  let checkAboveCompensateValue = 0;
  const doubleZoneSize = Math.round((screenSize.height / 1080) * 50); // 25
  sensitivity = (game == `Retail` || game == `Vanilla (splash)` || bobberColor == `Manual` ? 30 - sensitivity[game] : 10 - sensitivity[game]) || 1;

  if(checkLogic == 'pixelmatch') {
    if(autoSens) {
      sensitivity = 0.25;
    } else {
      sensitivity = game == `Retail` || game == `Vanilla (splash)` || bobberColor == `Manual` ? sensitivity / 30 : sensitivity / 10;
    }
  }

  let isBobber = bobberColor == `red` ? isRed(threshold, 50) : bobberColor == `blue` ? isBlue(threshold, 50) : isManual(hexToRgb(bobberColorManual), threshold);
  let newThreshold;
  let saturation = bobberColor == `red` ? [0, 0, 0] : bobberColor == `blue` ? [0, 0, 0] : [0, 0, 0];

  const looksLikeBobber = (size) => (pos, color, rgb) => {
    let pointsFound = pos.getPointsAround(Math.round(size * (screenSize.height / 1080)) || 1).filter((pos) => isBobber(rgb.colorAt(pos)));
    if(pointsFound.length >= Math.round(8 * (screenSize.height / 1080))) {
      return true;
    }
  }
  let filledBobber;

  return {
    async findBobber(exception, log, highlight, isRechecking) {

      checkAboveCompensateValue = 0;
      imgAroundBobberPrev = null;
      pixelMatchMax = 0;

      let rgbZone = zone;

      if(highlight && (game == `Classic` || game == `Cata Classic` || game == `Retail`)) {
        rgbZone = {x: highlight.x - doubleZoneSize, y: highlight.y - doubleZoneSize, width: doubleZoneSize * 2, height: doubleZoneSize * 2};
        if(rgbZone.x < zone.x) rgbZone.x = zone.x;
        if(rgbZone.y < zone.y) rgbZone.y = zone.y;
        if(rgbZone.x + rgbZone.width > zone.x + zone.width) rgbZone.x = zone.x + zone.width - rgbZone.width;
        if(rgbZone.y + rgbZone.height > zone.y + zone.height) rgbZone.y = zone.y + zone.height - rgbZone.height;
        if(!isRechecking) {
          exception = exception.map((pos) => new Vec(pos.x + zone.x - rgbZone.x, pos.y + zone.y - rgbZone.y));
        }
      }

      let rgbData = await getDataFrom(rgbZone);

      //let img = await Jimp.read(rgbData);
      //img.write(`test_fishing_zone${nn++}.png`);

      let rgb = createRgb(rgbData);
      rgb.saturate(...saturation)


      if(exception) {
        rgb.cutOut(exception);
      }

       //let img = await Jimp.read(rgb.getBitmap());
       //img.write(`${nnn++}_cursor.png`);

      let bobber;
      if(autoTh) {
        bobber = this._findMost(rgb, highlight);
        if(!bobber) return;

        if(highlightPercent && !highlight) {
            return bobber.pos.plus({x: rgbZone.x, y: rgbZone.y});
        }

      } else {
        bobber = rgb.findColors({
          isColor: isBobber,
          atFirstMet: true,
          saveColor: true,
          task: bobberColor == `Manual` ? null : looksLikeBobber(1),
          direction
        });
      }

      if(checkLogic == `pixelmatch`) {
        return bobber.pos.plus(rgbZone);
      }

      if(!bobber) return; // In case the bobber wasn't found in either _findMost or manually - recast.

      if(autoTh || direction == `center` || autoSens) {
        /*
        const doubleZoneDims = {x: rgbZone.x + bobber.pos.x - doubleZoneSize,
                                y: rgbZone.y + bobber.pos.y - doubleZoneSize,
                                width: doubleZoneSize * 2,
                                height: doubleZoneSize * 2};

        if(doubleZoneDims.x < rgbZone.x) doubleZoneDims.x = rgbZone.x;
        if(doubleZoneDims.y < rgbZone.y) doubleZoneDims.y = rgbZone.y;
        if(doubleZoneDims.x + doubleZoneDims.width > rgbZone.x + rgbZone.width) doubleZoneDims.x = rgbZone.x + rgbZone.width - doubleZoneDims.width;
        if(doubleZoneDims.y + doubleZoneDims.height > rgbZone.y + rgbZone.height) doubleZoneDims.y = rgbZone.y + rgbZone.height - doubleZoneDims.height;

        let doubleZoneData = await getDataFrom(doubleZoneDims);
        let rgbAroundBobber = createRgb(doubleZoneData);

        rgbAroundBobber.saturate(...saturation);
        */

        if(autoTh) {

            const mostRedPoints = [{pos: new Vec(bobber.pos.x, bobber.pos.y), color: bobber.color}];
            this._findThreshold(bobber, 0.4); // 0.4
            let startLimitCheck = Date.now();
            for(const savedPoint of mostRedPoints) {

              if(Date.now() - startLimitCheck > 2000) {
                return;
              }

              for(const innerPoint of savedPoint.pos.getPointsAround()) {
                if(mostRedPoints.some(mostRedPoint => innerPoint.isEqual(mostRedPoint.pos))) {
                  continue;
                }

                let innerPointColor = rgb.colorAt(innerPoint);
                // let distance =  Math.sqrt(Math.pow(r - innerPointColor[0], 2) + Math.pow(g - innerPointColor[1], 2) + Math.pow(b - innerPointColor[2], 2)); // r - Math.max(g, b) - (g + b);

                if(isBobber(innerPointColor)) { // 25% distance < (0.2 * 441.67)
                  mostRedPoints.push({pos: new Vec(innerPoint.x, innerPoint.y), color: innerPointColor});
                }

              }
            }
          /*
          rgb.cutOut(mostRedPoints.map(({pos}) => pos));
          let img = await Jimp.read(rgb.getBitmap())
          img.write('my.png');
          /*

          /* ----------------------- OLD
          let colorPrev = null;
          const mostRedPoints = [];
          let errorStartTime = Date.now();
          for(;Date.now() - errorStartTime < 2000;) {
            let mostRedPoint = this._findMost(rgbAroundBobber);

            if(!mostRedPoint) {
              break;
            }

            let [r, g, b] = mostRedPoint.color;

            if(!colorPrev) {
              colorPrev = mostRedPoint.color;
            }

            let distance =  Math.sqrt(Math.pow(r - colorPrev[0], 2) + Math.pow(g - colorPrev[1], 2) + Math.pow(b - colorPrev[2], 2)); // r - Math.max(g, b) - (g + b);

            if(distance > (0.1 * 441.67)) { // 10%
              break;
            }

            rgbAroundBobber.cutOut([mostRedPoint.pos]);
            mostRedPoints.push(mostRedPoint);
          }
          */

          if(mostRedPoints.length == 0) {
            return;
          }

          if((mostRedPoints.length < (10 * (screenSize.height / 1080)) && smallLentgthAttempt++ < 5)) { // we don't check if it's not highlighted yet
            log.warn(`Rechecking (${smallLentgthAttempt})...`);
            await sleep(250);
            return await this.findBobber([...exception, ...mostRedPoints.map(({pos}) => pos)], log, highlight, true); // true -> rechecking
          } else {
            smallLentgthAttempt = 0;
          }

          filledBobber = mostRedPoints;

          /*
          filledBobber = mostRedPoints.map((point) => ({
            color: point.color,
            pos: new Vec(point.pos.x + doubleZoneDims.x - rgbZone.x, point.pos.y + doubleZoneDims.y - rgbZone.y)
          }));
          */

          let mostLeft = mostRedPoints.reduce((a, b) => a.pos.x < b.pos.x ? a : b);
          let mostRight = mostRedPoints.reduce((a, b) => a.pos.x > b.pos.x ? a : b);

          let middleValue;
          if(manualPositionOnBobberOn) {
            middleValue = mostLeft.pos.x + ((mostRight.pos.x - mostLeft.pos.x) * (manualPositionOnBobber / 100));
          } else {
            middleValue = (mostLeft.pos.x + mostRight.pos.x) / (bobberColor == `red` ? 2 : 2); // position on the feather 2 : 1.5
          }

          let mostTop = mostRedPoints.reduce((a, b) => a.pos.y < b.pos.y ? a : b);
          let mostTopMiddle = mostRedPoints.reduce((a, b) => {
            if(Math.abs(a.pos.x - middleValue) + (a.pos.y - mostTop.pos.y) < Math.abs(b.pos.x - middleValue) + (b.pos.y - mostTop.pos.y)) {
              return a;
            } else {
              return b;
            }
          });

          bobber.color = mostTopMiddle.color;
          bobber.pos = mostTopMiddle.pos.plus({x: rgbZone.x, y: rgbZone.y});

          this._findThreshold(bobber);
        } else {
          /* if direction == center */
          filledBobber = rgbAroundBobber.findColors({isColor: isBobber, saveColor: true});

          bobber = rgbAroundBobber.findColors({
              isColor: isBobber,
              atFirstMet: true,
              saveColor: true,
              direction: `normal`,
              task: game == `Vanilla` || bobberColor == `Manual` ? null : looksLikeBobber(1)
          })

          if(!bobber) {
            return;
          }

          bobber.pos = bobber.pos.plus({x: doubleZoneDims.x, y: doubleZoneDims.y});
        }

        if(autoSens) {
          await this.adjustSensitivity(filledBobber);
        }

        return bobber.pos;
      }

      return bobber.pos.plus(rgbZone);
    },

    _findMost(rgb, highlight) {
      let initialThColors = rgb.findColors({
        isColor: ([r, g, b]) => !(r == 0 && g == 0 && b == 0),
        saveColor: true
      });

      let bobber = initialThColors.reduce((a, b) => {
        let [rA, gA, bA] = a.color;
        let [rB, gB, bB] = b.color;

        let maxARed =  0 // gA + bA;
        let maxBRed =  0 // gB + bB;

        let maxABlue = 0 // rA + gA;
        let maxBBlue = 0 // rB + gB;

        if(!highlight && (game == 'Classic' || game == 'Cata Classic')) {
          maxARed =  gA + bA;
          maxBRed =  gB + bB;

          maxABlue = rA + gA;
          maxBBlue = rB + gB;
        }

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

    _findThreshold(bobber, thCoof = .5) { // .75
      newThreshold = (([r, g, b]) => bobberColor == `red` ? (r - (Math.max(g, b)))  * thCoof : (b - Math.max(g, r))  * thCoof)(bobber.color); // for doubleZoneSearching searching half of the color foundo on threshold
      isBobber = bobberColor == `red` ? isRed(newThreshold, 50) : isBlue(newThreshold, 50); // 50?
    },

    async adjustSensitivity(bobberPoints) {
      if(game == `Retail`) {

        let mostTop = bobberPoints.map(point => point.pos).reduce((a, b) => a.y < b.y ? a : b);
        let mostBottom = bobberPoints.map(point => point.pos).reduce((a, b) => a.y > b.y ? a : b);

         let calculatedSens = Math.round((mostBottom.y - mostTop.y)) // Math.round(Math.sqrt(bobberSize / (bobberColor == `red` ? 3 : 2.5))); // 4 2.5
         let defaultMinimumSens =  Math.round(5 * (screenSize.height / 1080));
         if(calculatedSens < defaultMinimumSens) calculatedSens = defaultMinimumSens;
         sensitivity = calculatedSens;
       } else {
         if(game == `Vanilla` ) {
           sensitivity = 2;
         } else {
           sensitivity = bobberPoints.length < 200 ? 2 : 3; // Math.max(Math.round((screenSize.height / 1080) * (bobberColor == `red` ? 3 : 3)), 3); // 3 : 2
         }
       }
    },

    async checkBobberPrint(pos, log) {
      let data = await getDataFrom({x: pos.x - sensitivity, y: pos.y, width: sensitivity * 3, height: sensitivity});

       //let img = await Jimp.read(data);
       //img.write(`test_print_${nnn++}.png`);

      let rgb = createRgb(data);
      //rgb.saturate(...saturation);

      let bobber = rgb.findColors({
        isColor: isBobber,
        atFirstMet: true,
        saveColor: true
      });


      if(bobber) {
        //log.send(`bobber still found at ${nn}, x:${bobber.pos.x}, y:${bobber.pos.y}, color: ${bobber.color}`);
        return true;
      } else {
        /*
        if(autoSens && checkBobberPrintAttempts < 3) { // let's make additional 3 px check to decrease mistakes
          checkBobberPrintAttempts++
          sensitivity += 1;
          return await checkBobberPrint(pos, log);
        }
        */
        //log.ok(`HAVEN'T FIND BOBBER COLORS`, newThreshold);
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
    for(let y = 1; y < sensitivity; y++) {
        let pointsBelow = [pos.plus({x: -1, y}), pos.plus({x: 0, y}), pos.plus({x: 1, y})];
        for(let point of pointsBelow) {
          if(await this.isBobber(point)) {
            checkAboveCompensateValue++;
            return pointsBelow[1];
          }
        }
      }
    },

    async checkAbove(pos) {
      let previous = pos;
      for(let i = 0; i < checkAboveCompensateValue; i++) {
        let posAbove = previous.plus({x: 0, y: -1});
        if(!(await this.isBobber(posAbove))) {
          return previous;
        } else {
          checkAboveCompensateValue--;
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
      const pointRgbColor = pointRgb.colorAt({ x: 0, y: 0 });
      if(isBobber(pointRgbColor)) {
        return true;
      }
    },

    async checkColor() {
      let rgb = createRgb(await getDataFrom(zone));
      let colors = rgb.findColors({
        isColor: bobberColor == `red` ? isRed(0) : isBlue(0),
      });

      return colors ? (colors.length / (zone.width * zone.height)) * 100 : 0;
    },

    async changeColor() {
      bobberColor = bobberColor == `red` ? `blue` : `red`;
      isBobber = bobberColor == `red` ? isRed(threshold, 50) : isBlue(threshold, 50); // 50?
      saturation = bobberColor == `red` ? [80, 0, 0] : [0, 0, 80];
    },

    async getBobberPrint(wobble) {
      let rest = [];
      if(autoTh) {
        if(!filledBobber) {
          return;
        }
        rest = filledBobber.map(({pos}) => pos);
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
