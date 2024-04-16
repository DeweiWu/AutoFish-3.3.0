const { Hardware, getAllWindows } = require("keysender");

const findGameWindows = ({game}) => {
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
