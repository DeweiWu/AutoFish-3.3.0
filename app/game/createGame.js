const { Hardware, getAllWindows } = require("keysender");
const { createWebCamWin } = require('./../wins/webcam/main.js');

const findGameWindows = async ({game}, {streamMode, streamDevice, streamScreenSize}, type, multipleWindowsId) => {

  if(streamMode) {
    if(type == `relZone` || type == `chatZone` || type == `detectZone` || type == `combatZone` || type == `pointZone`) {
      const webCamWin = await createWebCamWin(streamDevice, streamScreenSize, multipleWindowsId);
      let win = {
        workwindow: {
          isForeground: () => webCamWin.isFocused(),
          setForeground: () => webCamWin.focus(),
          close: () => webCamWin.close(),
          getView: () => ({x: 0, y: 0, ...streamScreenSize})
        }
      }
      return [win];
    } else {
      return [
        {
          workwindow: {
            isForeground() {
              return true;
            },
            setForeground() {
              return true;
            },
            getView() {
              return ({x: 0, y: 0, ...streamScreenSize})
            },
            close() {
              return true
            }
          }
        }
      ]
    }
  }

  const { names, classNames, handles } = game;
  const wins = getAllWindows().filter(
    ({ title, className, handle }) =>
      names.some(name => new RegExp(`${name}`).test(title)) && classNames.includes(className) && (handles.length ? handles.includes(handle) : true)
  );

  if (wins.length > 0) {
    return wins.map((win) => new Hardware(win.handle));
  }
};

module.exports = {
  findGameWindows,
  getAllWindows
};
