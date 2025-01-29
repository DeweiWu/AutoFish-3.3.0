const { createTimer } = require('../utils/time.js');

const windowStuck = createTimer(() => 3000);

const sleep = (time) => {
  return new Promise((resolve) => {
    setTimeout(resolve, time);
  });
};

const createWinSwitch = (eventLine, winsNumber) => {
  let focusedWins = [];
  for (let i = 1; i <= winsNumber; i++) {
    focusedWins.push({
      focused: i == 1 ? true : false,
      position: i
    })
  }

  return {
    execute(workwindow, mWinCallback, winNum, streamMode) {

      return new Promise(async (resolve, reject) => {
        eventLine.add(async () => {

          if(streamMode) {
            winNum = winNum - 1;
            if(!focusedWins[winNum].focused) {
              let currentlyFocused = focusedWins.find((win) => win.focused == true);

              let stepsToMove = Math.abs(1 - focusedWins[winNum].position);
              if(stepsToMove > 1) {
                focusedWins.forEach((win, i) => {
                  if(i != winNum)
                    win.position = win.position + 1;
                })
              } else {
                currentlyFocused.position = focusedWins[winNum].position;
              }
              focusedWins[winNum].position = 1;

              currentlyFocused.focused = false;
              focusedWins[winNum].focused = true;

              await mWinCallback(stepsToMove);
            }
          }


          workwindow.setForeground();
          windowStuck.start();
          while (!workwindow.isForeground()) {
            if(windowStuck.isElapsed()) {
              this.finished();
              reject(new Error(`Can't set the window to foreground`));
            }
            await sleep();
          }
          resolve();
        });
      });
    },
    finished() {
      eventLine.remove();
    },
  };
};

module.exports = createWinSwitch;
