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
  } catch (error) {
    console.error('Error:', error.response ? error.response.data : error.message);
  }
}

const keyboard = {
  async sendKey(key, delays = [50, 150]) {
    key = key.toUpperCase();
    let delay = Math.round(random(delays[0], delays[1]))
    await send('presskey', {key, delay})
  },

  async toggleKey(key, type) {
    key = key.toUpperCase();
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

  async humanMoveTo(x, y) { // speed = 88, curvature = 20
    // TEMP:
    let speed = 90;
    let curvature = 10;
    // TEMP END

    const newX = Math.round(x - previousPos.x);
    const newY = Math.round(y - previousPos.y);
    const distance = Math.sqrt(Math.pow(Math.round(newX), 2) + Math.pow(Math.round(newY), 2));

    if(x != -9999 && y != -9999) {
      previousPos = {x, y};
    }

    const convertedSpeed = (100 - speed) * (speedDistCoof / distance);
    if(convertedSpeed <= 0) {
      convertedSpeed = 1;
    }

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
  }
}

const createPicoInterface = (ip, screenSize) => {
  previousPos = {x: 0, y: 0};
  speedDistCoof = screenSize.width / 6; // TEMP:
  picoIp = ip;

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
