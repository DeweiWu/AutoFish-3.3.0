const { getCurrentTime } = require("./time.js");
const { createWriteStream } = require('fs');

const createLog = (sendToWindow, sendToWindowStats) => {
  let state = true;
  let statsMemory = [];
  return {
    send(text, type = "black") {
      if(state) {
        const { hr, min, sec } = getCurrentTime();
        text = `[${hr}:${min}:${sec}] ${text}`;
        sendToWindow({ text, type });
      }
    },

    showStats(stats, time) {
      statsMemory[stats.win] = stats; 

      let combinedStats = statsMemory.reduce((a, b) => {
        return {
          caught: a.caught + b.caught,
          miss: a.miss + b.miss,
          confused: a.confused + b.confused,
          misspurpose: a.misspurpose + b.misspurpose
        }
      })
      sendToWindowStats(combinedStats, time);
    },

    msg(text) {
      sendToWindow({ text, type: "black", position: "center", margin: `0 0 5px 0` });
    },

    ok(text) {
      this.send(text, "#127500");
    },

    warn(text) {
      this.send(text, "#fc7703");
    },

    err(text) {
      this.send(text, "red");
    },

    setState(value) {
      state = value;
    }
  };
};

const createIdLog = (log, id) => {
  let logData;
  return Object.assign({}, log, {
    send(text, type) {
        log.send(`[WIN${id}] ${text}`, type);
      }
  });
};


module.exports = {
  createLog,
  createIdLog,
};
