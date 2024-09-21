const axios = require('axios');

const random = (from, to) => {
  return from + Math.random() * (to - from);
};

const sleep = (time) => {
  return new Promise((resolve) => {
    setTimeout(resolve, time);
  });
};

const delay = [50, 150];
let previousPos, speedDistCoof, picoIp;
let log;
let attempts = 0;

async function send(type, jsonData) {
  try {
      const response = await axios.post(`http://${picoIp}:5000/${type}`,
        jsonData,  // Send data as a JSON object
        {
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );
      attempts = 0;
  } catch (error) {
    log.err(`Pico: Error: ${error.response ? error.response.data : error.message}`);
    await sleep(1000);
    if(attempts++ < 3) {
      log.send(`Pico: Sending Again (${attempts})...`);
      await send(type, jsonData);
    } else {
      throw new Error(`Something wrong with the connection to Pico Board.`)
    }
  }
}

const keyboard = {
  async sendKey(key, delays = [50, 150]) {
    // key = key.toUpperCase();
    let delay = Math.round(random(delays[0], delays[1]))
    await send('presskey', {key, delay})
  },

  async toggleKey(key, type) {
    // key = key.toUpperCase();
    let toggleType = 'release';
    if(type) {
      toggleType = 'press';
    } else {
      toggleType = 'release';
    }
    await send('togglekey', {key, toggleType})
  },

  async printText(text, delays) {
    await send('printtext', {text, delayFrom: delays[0], delayTo: delays[1]});
  }
}

const mouse = {
  async moveTo(x, y) {
    newX = Math.round(x - previousPos.x);
    newY = Math.round(y - previousPos.y);
    if(x != -9999 && y != -9999) {
      previousPos = {x, y};
    }

    await send('movemouse', {x: newX, y: newY});
  },

  async humanMoveTo(x, y, mainSpeed, deviation) { // speed = 88, curvature = 20
    x = x + 1;
    y = y + 1;
    let speed = mainSpeed * 15; // 15 // % of step from distance
    let curvature = (deviation / 100) * 30; //20 // % from distance

    const newX = Math.round(x - previousPos.x);
    const newY = Math.round(y - previousPos.y);

    if(x != -9999 && y != -9999) {
      previousPos = {x, y};
    }

    const distance = Math.sqrt(Math.pow(newX, 2) + Math.pow(newY, 2));

    let convertedSpeed = speed * (distance / (1920 / 8));
    await send('movemousehuman', {x: newX, y: newY, speed: convertedSpeed, curvature});
  },

  async click(button, delays) {
    let delay = Math.round(random(delays[0], delays[1]));
    await send('clickbutton', {button, delay})
  },

  async toggle(button, type) {
    let toggleType = 'release';
    if(type) {
      toggleType = 'press';
    } else {
      toggleType = 'release'
    }
    await send('togglebutton', {button, toggleType})
  },

  async scroll(type, amount) {
    if(!type) {
      amount = -amount
    }
    await send('scrollwheel', {amount});
  },

  getPos() {
    return previousPos;
  }
}

const createPicoInterface = (ip, screenSize, mainLog) => {
  previousPos = {x: 0, y: 0};
  speedDistCoof = screenSize.width / 4; // TEMP:
  picoIp = ip;
  log = mainLog;

  return {
    keyboard, mouse
  }
}

async function pingDevice(ip) {
  const response = await axios.get(`http://${ip}:5000/device`, {timeout: 1000});
  if (response.data === "Raspberry Pi Pico W") {
    return true
  } else {
    return false
  }
}

module.exports = {
  createPicoInterface,
  pingDevice
};
