const axios = require('axios');

const random = (from, to) => {
  return from + Math.random() * (to - from);
};

const sleep = (time) => {
  return new Promise((resolve) => {
    setTimeout(resolve, time);
  });
};

let delay;
let previousPos, speedDistCoof, picoIp;
let log;
let attempts = 0;

const keysSheet = {
  left: "LEFT_ARROW",
  up: "UP_ARROW",
  right: "RIGHT_ARROW",
  down: "DOWN_ARROW",
  lWin: "WINDOWS",
  alt: "ALT",
  tab: "TAB",
  backspace: "BACKSPACE",
  enter: "ENTER",
  pause: "PAUSE",
  capsLock: "CAPS_LOCK",
  escape: "ESCAPE",
  space: "SPACEBAR",
  pageup: "PAGE_UP",
  pagedown: "PAGE_DOWN",
  end: "END",
  home: "HOME",
  printscreen: "PRINT_SCREEN",
  insert: "INSERT",
  delete: "DELETE",
  numlock: "KEYPAD_NUMLOCK",
  scrolllock: "SCROLL_LOCK",
  shift: "SHIFT"
}

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
  async sendKey(key, delays = delay) {
    // key = key.toUpperCase();

    if(keysSheet[key]) {
      key = keysSheet[key];
    }

    if(!Array.isArray(delays)) {
      delays = [delays, delays];
    }

    await send('presskey', {key, delay: Math.round(random(delays[0], delays[1]))})
  },

  async toggleKey(key, type, delays = delay) {
    // key = key.toUpperCase();

    if(!Array.isArray(delays)) {
      delays = [delays, delays];
    }

    if(keysSheet[key]) {
      key = keysSheet[key];
    }

    let toggleType = 'release';
    if(type) {
      toggleType = 'press';
    } else {
      toggleType = 'release';
    }
    await send('togglekey', {key, toggleType, delay: Math.round(random(delays[0], delays[1]))})
  },

  async printText(text, delays) {

    if(!Array.isArray(delays)) {
      delays = [delays, delays];
    }

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
    let speed = mainSpeed * 15; // 15 // % of step from distance
    let curvature = (deviation / 100) * 30; //20 // % from distance

    x = Math.round(x);
    y = Math.round(y);

    const newX = x - previousPos.x;
    const newY = y - previousPos.y;

    if(x != -9999 && y != -9999) {
      previousPos = {x, y};
    }

    const distance = Math.sqrt(Math.pow(newX, 2) + Math.pow(newY, 2));

    let convertedSpeed = speed * (distance / speedDistCoof);
    await send('movemousehuman', {x: newX, y: newY, speed: convertedSpeed, curvature});
  },

  async click(button, delays = delay) {

  if(!Array.isArray(delays)) {
    delays = [delays, delays];
  }

    await send('clickbutton', {button, delay: Math.round(random(delays[0], delays[1]))})
  },

  async toggle(button, type, delays = delay) {

    if(!Array.isArray(delays)) {
      delays = [delays, delays];
    }

    let toggleType = 'release';
    if(type) {
      toggleType = 'press';
    } else {
      toggleType = 'release'
    }
    await send('togglebutton', {button, toggleType, delay: Math.round(random(delays[0], delays[1]))})
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

const createPicoInterface = ({picoip, streamScreenSize, delay: delays}, mainLog) => {
  previousPos = {x: 0, y: 0};
  speedDistCoof = streamScreenSize.width / 8;
  picoIp = picoip;
  log = mainLog;
  delay = delays;
  console.log(`delay`, delay);
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
