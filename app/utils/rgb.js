const Vec = require("./vec.js");

const isInLimits = ({ x, y }, { width, height }) => {
  return x >= 0 && y >= 0 && x < width && y < height;
};

const createRgb = ({ data, width, height }) => {
  const getPixelIndex = (x, y) => (y * width + x) * 4;

  return {
    getBitmap() {
      return { data, width, height };
    },

    colorAt(pos) {
      if (isInLimits(pos, { width, height })) {
        let idx = getPixelIndex(pos.x, pos.y);
        return [data[idx], data[idx + 1], data[idx + 2]];
      } else {
        return [0, 0, 0];
      }
    },

    saturate(rs, gs, bs) {
      for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
          let idx = getPixelIndex(x, y);
          data[idx] = Math.min(255, data[idx] + rs);
          data[idx + 1] = Math.min(255, data[idx + 1] + gs);
          data[idx + 2] = Math.min(255, data[idx + 2] + bs);
        }
      }
    },

    cutOut(exception) {
      exception.forEach(({ x, y }) => {
        if (isInLimits({ x, y }, { width, height })) {
          let idx = getPixelIndex(x, y);
          data[idx] = 0;
          data[idx + 1] = 0;
          data[idx + 2] = 0;
        }
      });
    },

    findColors({ isColor, atFirstMet, task, limit, direction, saveColor }) {
      let colors = [];
      if (!direction) direction = `normal`;

      const checkAndPushColor = (x, y) => {
        let pos = new Vec(x, y);
        let idx = getPixelIndex(x, y);
        let color = [data[idx], data[idx + 1], data[idx + 2]];
        if (isColor(color)) {
          if (limit != null) {
            limit--;
            if (limit < 0) return null;
          }
          if (!task || task(pos, color, this)) {
            if (atFirstMet) {
              return saveColor ? { pos, color } : pos;
            } else {
              colors.push(saveColor ? { pos, color } : pos);
            }
          }
        }
        return null;
      };

      switch (direction) {
        case `normal`:
          for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
              let result = checkAndPushColor(x, y);
              if (result) return result;
            }
          }
          break;
        case `normalright`:
          for (let y = 0; y < height; y++) {
            for (let x = width - 1; x >= 0; x--) {
              let result = checkAndPushColor(x, y);
              if (result) return result;
            }
          }
          break;
        case `reverse`:
          for (let y = height - 1; y >= 0; y--) {
            for (let x = 0; x < width; x++) {
              let result = checkAndPushColor(x, y);
              if (result) return result;
            }
          }
          break;
        case `center`: {
          let center = { x: Math.floor(width / 2), y: Math.floor(height / 2) };
          let stepDiffX = 1, stepDiffY = 1;
          if (height > width) stepDiffX = width / height;
          if (width > height) stepDiffY = height / width;
          for (let step = 1; step < Math.floor(Math.max(height, width) / 2); step++) {
            for (let angle = 0; angle < Math.PI * 2; angle += ((Math.PI * 2 / 8) / step)) {
              let x = center.x + Math.round(Math.cos(angle) * (step * stepDiffX));
              let y = center.y + Math.round(Math.sin(angle) * (step * stepDiffY));
              if (x >= 0 && y >= 0 && x < width && y < height) {
                let result = checkAndPushColor(x, y);
                if (result) return result;
              }
            }
          }
          break;
        }
      }

      return colors.length ? colors : null;
    },
  };
};

module.exports = createRgb;
