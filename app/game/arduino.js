const { SerialPort } = require(`serialport`);
const { ReadlineParser } = require(`@serialport/parser-readline`);

const keyCodes = {
  backspace: 178,
  tab: 179,
  enter: 224,
  pause: 208,
  capsLock: 193,
  escape: 177,
  space: 178,
  pageup: 211,
  pagedown: 214,
  end: 213,
  home: 210,
  left: 216,
  up: 218,
  right: 215,
  down: 217,
  printscreen: 206,
  insert: 209,
  delete: 212,
  f1: 194,
  f2: 195,
  f3: 196,
  f4: 197,
  f5: 198,
  f6: 199,
  f7: 200,
  f8: 201,
  f9: 202,
  f10: 203,
  f11: 204,
  f12: 205,
  numlock: 219,
  scrolllock: 207,
  shift: 129,
  lWin: 131
};

const sleep = (time) => {
  return new Promise((resolve) => {
    setTimeout(resolve, time);
  });
};
const random = (from, to) => {
  return from + Math.random() * (to - from);
};
const convertKey = (key) => {
  if(keyCodes[key]) {
    return keyCodes[key];
  } else {
    return key.charCodeAt(0);
  }
};


const createArduinoDevice = () => {
  let port;
  return {
    mouse: {
      async moveTo(x, y, delay) {
        let cPos = this.getPos();
        let signX = x - cPos.x < 0 ? `-` : `+`;
        let signY = y - cPos.y < 0 ? `-` : `+`;
        port.write(`5${signX}${signY}${65535 * Math.abs(Math.round(x - cPos.x)) + Math.abs(Math.round(y - cPos.y))}`);
      },

      async humanMoveTo(x, y, speed, deviation) {
        let cPos = this.getPos();
        let signX = x - cPos.x < 0 ? `-` : `+`;
        let signY = y - cPos.y < 0 ? `-` : `+`;
        port.write(`5${signX}${signY}${65535 * Math.abs(Math.round(x - cPos.x)) + Math.abs(Math.round(y - cPos.y))}`);
      },

      async toggle(button, pressed, delay) {
        port.write(`${pressed ? 7 : 8}${button == `left` ? 1 : button == `right` ? 2 : 3}`);
        if(Array.isArray(delay)) {
          await sleep(random(delay[0], delay[1]));
        } else {
          await sleep(delay);
        }
      }
    },
    keyboard: {
      async sendKey(key, delay) {
          await this.toggleKey(key, true, delay);
          await this.toggleKey(key, false, delay);
      },

      async printText(message, delay) {
        for (char of message) {
          await this.sendKey(char, delay);
        }
      },

      async toggleKey(key, pressed, delay) {
        if(Array.isArray(key)) {
          key.forEach((k) => port.write(`${pressed ? 3 : 4 }${convertKey(key)}`))
        } else {
          port.write(`${pressed ? 3 : 4 }${convertKey(key)}`);
        }

          if(Array.isArray(delay)) {
            await sleep(random(delay[0], delay[1]));
          } else {
            await sleep(delay);
          }
      },
    },
    async connectTo(com, rate) {
      return new Promise(async function(resolve, reject) {
        if(port) {
          port.close();
          await sleep(1000);
        }
        port = new SerialPort(
          {
            path: com,
            baudRate: rate,
          },
          (err) => {
            if (err) {
              reject(err.message);
            }
          }
        )
        port.on(`open`, () => {
          port.write(`0`);
          setTimeout(() => {
            reject(`Wrong response from Arduino Board! Change COM Port or upload AutoFish sketch on your board (Help -> Arduino Sketch).`);
          }, 1000);
        });
        port.on(`data`, (data) => {
          if(data == `ready`) {
            resolve(`Connected to Arduino Board!`);
          }
        })
      });
    }
  }
}

module.exports = createArduinoDevice;
