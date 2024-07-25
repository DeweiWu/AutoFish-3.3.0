const { getCurrentTime } = require("./time.js");
const { createWriteStream } = require('fs');

const createLog = (sendToWindow) => {
  let state = true;
  return {
    send(text, type = "black") {
      if(state) {
        const { hr, min, sec } = getCurrentTime();
        text = `[${hr}:${min}:${sec}] ${text}`;
        sendToWindow({ text, type });
      }
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
