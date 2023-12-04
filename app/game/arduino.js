const { SerialPort } = require(`serialport`);

const keyCodes = {
  backspace: 178,
  tab: 179,
  alt: 130,
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

const random = (from, to) => {
  return from + Math.random() * (to - from);
};

const sleep = (time) => {
  return new Promise((resolve) => {
    setTimeout(resolve, time);
  });
};

const convertKey = (key) => {
  if(keyCodes[key]) {
    return keyCodes[key];
  } else {
    return key.charCodeAt(0);
  }
};

  const createKeyboard = (write) => {
    return {
      sendKey(key, delay = 0) {

        if(!Array.isArray(delay)) {
          delay = [delay, delay];
        }

        return new Promise(function(resolve, reject) {
          write(`1,${convertKey(key)},${Math.round(delay[0])},${Math.round(delay[1])}\n`, resolve, reject);
        });
      },
      toggleKey(key, type, delay = 0) {

        if(!Array.isArray(delay)) {
          delay = [delay, delay];
        }

        return new Promise(function(resolve, reject) {
          write(`2,${convertKey(key)},${Number(type)},${Math.round(delay[0])},${Math.round(delay[1])}\n`, resolve, reject)
        });
      },
      printText(text, delay = 0) {

        if(!Array.isArray(delay)) {
          delay = [delay, delay];
        }

        return new Promise(function(resolve, reject) {
          write(`3,${text},${Math.round(delay[0])},${Math.round(delay[1])}\n`, resolve, reject);
        });
      }
    }
  };

const createMouse = (write) => {
  return {
    click(button, delay = 0) {

      if(!Array.isArray(delay)) {
        delay = [delay, delay];
      }

      return new Promise(function(resolve, reject) {
        let numButton = 1;
        switch(button) {
          case 'left': {
            numButton = 1;
            break;
          }

          case 'right': {
            numButton = 2;
          break;
        }
          case 'middle': {
            numButton = 4;
          }
        }

        write(`4,${numButton},${Math.round(delay[0])},${Math.round(delay[1])}\n`, resolve, reject);
      });
    },

    toggle(button, type, delay = 0) {

      if(!Array.isArray(delay)) {
        delay = [delay, delay];
      }

      return new Promise(function(resolve, reject) {
        let numButton = 1;
        switch(button) {
          case 'left': {
            numButton = 1;
            break;
          }

          case 'right': {
            numButton = 2;
          break;
        }
          case 'middle': {
            numButton = 4;
          }
        }

        write(`5,${numButton},${Number(type)},${Math.round(delay[0])},${Math.round(delay[1])}\n`, resolve, reject);
      });
    },

    moveTo(x, y) {
      let cPos = this.getPos();
      x = x - cPos.x;
      y = y - cPos.y;

      let speedByDistance = 10;

      let minDelay = 0;
      let maxDelay = 0;

      let minControlDistance = 10
      let maxControlDistance = 10

      let offset = 10


      return new Promise(function(resolve, reject) {
        write(`7,${Math.floor(x)},${Math.floor(y)},${Math.round(speedByDistance)},${minDelay},${maxDelay},${minControlDistance},${maxControlDistance},${offset}\n`, resolve, reject);
      });
    },

    humanMoveTo(x, y) {
      let cPos = this.getPos();
      x = x - cPos.x;
      y = y - cPos.y;
      let distance = Math.sqrt(Math.pow(x, 2) + Math.pow(y, 2));
      let speedByDistance = Math.round(distance * (distance < 50 ? 0.75 : distance < 150 ? 0.50 : distance < 300 ? 0.35 : 0.25)); // distance / 4 (0.25 + (1 - (distance / 400)))

      let minDelay = 0;
      let maxDelay = 15;

      let minControlDistance = Math.round(distance * 0.050); // 10 at 400 px
      let maxControlDistance = Math.round(distance * 0.250); // 50 at 400 px

      let offset = Math.round(distance * 0.25); // 100 at 400px

      return new Promise(function(resolve, reject) {
        write(`7,${Math.floor(x)},${Math.floor(y)},${Math.round(speedByDistance)},${minDelay},${maxDelay},${minControlDistance},${maxControlDistance},${offset}\n`, resolve, reject);
      });
    },
  }
}

const createEventLine = (port) => {
  let line = [];
  port.on(`data`, (data) => {
    if(String(data) == `ready` && line[0]) {
      line[0].resolve();
      line.shift();
      if(line[0]) {
        port.write(line[0].data);
      }
    }
  });

  return {
    write(data, resolve, reject) {
      line.push({data, resolve, reject});
      if(line.length == 1) {
        port.write(data);
      }
    }
  }
};

const createArduinoDevice = () => {
  let keyboard = {};
  let mouse = {};
  let port;
  return {
    keyboard,
    mouse,
    connectTo(com, rate) {
      let initial = true;
      return new Promise(async function(resolve, reject) {
        if(port && port.isOpen) {
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
          port.write(`0\n`);
          setTimeout(() => {
            reject(`Wrong response from Arduino Board! Change COM Port or upload AutoFish sketch on your board (Help -> Arduino Sketch).`);
          }, 1000);
        });
        port.on(`data`, (data) => {
          if(initial && data.toString() == `ready`) {
            let {write} = createEventLine(port);
            Object.assign(keyboard, createKeyboard(write));
            Object.assign(mouse, createMouse(write));;
            resolve(`Connected to Arduino Board!`);
            initial = false;
          }
        })
      });
    }
  }
}

module.exports = createArduinoDevice;
