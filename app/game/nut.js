let { mouse, Point, keyboard, Key } = require("@nut-tree-fork/nut-js");

function getRandomControlPoint(start, end, range) {
    const deltaX = end.x - start.x;
    const deltaY = end.y - start.y;

    const controlPoint1 = {
        x: start.x + range * deltaX + Math.random() * range * deltaX,
        y: start.y + range * deltaY + Math.random() * range * deltaY,
    };

    const controlPoint2 = {
        x: start.x + (1 - range) * deltaX + Math.random() * range * deltaX,
        y: start.y + (1 - range) * deltaY + Math.random() * range * deltaY,
    };

    return [controlPoint1, controlPoint2];
}

function generateBezierPath(startPoint, endPoint, steps, range) {
    const controlPoints = getRandomControlPoint(startPoint, endPoint, range);
    const path = [];

    for (let t = 0; t <= 1; t += 1 / steps) {
        const x = Math.pow(1 - t, 3) * startPoint.x +
                  3 * Math.pow(1 - t, 2) * t * controlPoints[0].x +
                  3 * (1 - t) * Math.pow(t, 2) * controlPoints[1].x +
                  Math.pow(t, 3) * endPoint.x;

        const y = Math.pow(1 - t, 3) * startPoint.y +
                  3 * Math.pow(1 - t, 2) * t * controlPoints[0].y +
                  3 * (1 - t) * Math.pow(t, 2) * controlPoints[1].y +
                  Math.pow(t, 3) * endPoint.y;

        path.push(new Point(x, y));
    }

    return path;
}


const random = (from, to) => {
  return from + Math.random() * (to - from);
};

const sleep = (time) => {
  return new Promise((resolve) => {
    setTimeout(resolve, time);
  });
};

function randomHumanLikeCursorEasing(x) {
    const oscillation = Math.sin(x * Math.PI) + (Math.random() - 0.5) * 0.1;
    const increasedEasingOut = 1 - Math.pow(1 - x, 4) + (Math.random() - 0.5) * 0.1;
    const result = 0.7 * oscillation + 0.3 * increasedEasingOut;
    return Math.max(0, Math.min(1, result));
}

const generateStraightPath = (from, to) => {
  let path = [];
  let stepSign = 0;
  if(to.x < from.x) {
    stepSign = -1;
  } else {
    stepSign = 1;
  }

  for(let x = from.x; Math.round(x) != Math.round(to.x); x += stepSign) {
    path.push({x, y: from.y});
  }

  return path;
}

keyboard.config.autoDelayMs = 0;

module.exports = {
  mouse: {
  async humanMoveTo({from, to, speed, deviation, fishingZone, staticSpeed}) {
    const distance = Math.sqrt(Math.pow(Math.round(from.x - to.x), 2) + Math.pow(Math.round(from.y - to.y), 2));
    const fZoneSize = Math.sqrt(Math.pow(fishingZone.width, 2) + Math.pow(fishingZone.height, 2)) * .25;
    /* apply distance relation to zone size only if distance is more than 5% */
    mouse.config.mouseSpeed = staticSpeed ? (speed * 100 * 15) : (speed * 100 * 20) * (distance > fZoneSize * .05 ? distance / fZoneSize : 0.25);
    const path = generateBezierPath(from, to, distance, deviation / 150);
    path[path.length - 1] = new Point(to.x, to.y);
    await mouse.move(path, randomHumanLikeCursorEasing); //
  },
  async toggle(button, type, delay) {
    let buttonNumber = button == `left` ? 1 : button == `right` ? 2 : 3;
    if(type == true) {
      await mouse.pressButton(buttonNumber);
    } else {
      await mouse.releaseButton(buttonNumber);
    }

    if(Array.isArray(delay)) {
      await sleep(random(delay[0], delay[1]))
    } else {
      await sleep(delay);
    }
  },

  async scroll(value, direction, delay) {
    if(direction) {
      await mouse.scrollUp(value);
    } else {
      await mouse.scrollDown(value);
    }

    if(Array.isArray(delay)) {
      await sleep(random(delay[0], delay[1]))
    } else {
      await sleep(delay);
    }
  },

  async getPos() {
    return await mouse.getPosition();
  }
  },

  keyboard: {
    async sendKey(key, delay = [0, 0]) {

      if(!Array.isArray(delay)) {
        delay = [delay, delay];
      }

      keyboard.config.autoDelayMs = random(delay[0], delay[1]);
      await keyboard.pressKey(Key[key]);
      await keyboard.releaseKey(Key[key]);
      keyboard.config.autoDelayMs = 0;
    },

    async toggleKey(key, toggle, delay = 0) {
      if(toggle) {
        await keyboard.pressKey(Key[key]);
      } else {
        await keyboard.releaseKey(Key[key]);
      }

      await sleep(delay);
    },
  }
}
