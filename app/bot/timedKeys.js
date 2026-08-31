const { createTimer } = require('../utils/time.js');

const createTimedKeys = (items, pressKey) => {
  if(!Array.isArray(items)) {
    return [];
  }

  return items
  .filter(({key, intervalMinutes}) => key && Number(intervalMinutes) > 0)
  .map(({key, intervalMinutes}) => ({
    key,
    intervalMinutes: Number(intervalMinutes),
    timer: createTimer(() => Number(intervalMinutes) * 60 * 1000),
    execute() {
      return pressKey(key);
    }
  }));
};

module.exports = createTimedKeys;
