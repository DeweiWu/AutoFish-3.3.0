let { mouse, Point } = require("@nut-tree/nut-js");

const random = (from, to) => {
  return from + Math.random() * (to - from);
};

const sleep = (time) => {
  return new Promise((resolve) => {
    setTimeout(resolve, time);
  });
};

const generatePath = (x, y) => {
  let startX = 0;
  let startY = 0;

  let signX = x < 0 ? -1 : 1;
  let signY = y < 0 ? -1 : 1;

  let max = Math.max(Math.abs(x), Math.abs(y));
  let min = Math.min(Math.abs(x), Math.abs(y));

  let step = max / min;

  let path = [];
  for (let i = 0; i <= max; i++) {
    path.push(new Point(startX, startY));
    if(Math.abs(x) == max) {
      startX += signX;
      if((i % step) < 1) {
        startY += signY;
      }
    } else {
      startY += signY;
      if((i % step) < 1) {
        startX += signX;
      }
    }
  }

  return path;
};


const deviatePath = (path, size, frequency) => {
  let frequencyZones = new Array(Math.round(random(frequency[0], frequency[1])))
    .fill(true)
    .map((zone) => Math.round(random(0, path.length)));

  let lastX = Math.abs(path[path.length - 1].x);
  let lastY = Math.abs(path[path.length - 1].y);
  let direction = Math.abs(lastX) > Math.abs(lastY) ? `vertical` : `horizontal`;
  let angleStep = Math.PI * 2 / random(100, 500);
  let angle = direction == `vertical` ? 0 : Math.PI / 2;

  let xLength = random(size[0], size[1]);
  let yLength = random(size[0], size[1]);

  return path.map((point, i) => {
    angle += angleStep;

    if (frequencyZones.some((zonePos) => zonePos == i)) {
      angleStep = -angleStep;
      xLength = random(size[0], size[1]);
      yLength = random(size[0], size[1]);
    }

    let xDeviationLength = direction == `horizontal` ? xLength : 0;
    let yDeviationLength = direction == `vertical` ? yLength : 0;
    let resPoint = {
      x: point.x + Math.cos(angle) * xDeviationLength,
      y: point.y + Math.sin(angle) * yDeviationLength,
    };
    return resPoint;
  });
};

const easingFunctions = {
  easeInSine(x) {
    return 1 - Math.cos((x * Math.PI) / 2);
  },
  easeOutSine(x) {
  return Math.sin((x * Math.PI) / 2);
  },
  easeInOutSine(x) {
    return -(Math.cos(Math.PI * x) - 1) / 2;
  },
  easeInQuad(x) {
    return x * x;
  },
  easeOutQuad(x) {
    return 1 - (1 - x) * (1 - x);
  },
  easeInOutQuad(x) {
    return x < 0.5 ? 2 * x * x : 1 - Math.pow(-2 * x + 2, 2) / 2;
  }
}

module.exports = {
  mouse: {
    async move({from, to, speed, deviation, speedDeviation}) {
      if(!speedDeviation) {
        let keys = Object.keys(easingFunctions);
        speedDeviation = easingFunctions[keys[Math.floor(Math.random() * keys.length)]];
      }

      if(!deviation) {
        deviation = {};
        deviation.size = [1, 10];
        deviation.frequency = [1, 10];
      }

      mouse.config.mouseSpeed = speed;

      let path = deviatePath(generatePath(to.x, to.y), deviation.size, deviation.frequency);

      let cPos = from ? from : await mouse.getPosition();
      let pathFromCurrent = path.map((point) => new Point(cPos.x + point.x, cPos.y + point.y));
      await mouse.move(pathFromCurrent, speedDeviation);
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
    }
  }
}
