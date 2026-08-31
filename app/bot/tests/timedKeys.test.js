const createTimedKeys = require('../timedKeys.js');

describe('timed keys', () => {
  let now;

  beforeEach(() => {
    now = 1000;
    jest.spyOn(Date, 'now').mockImplementation(() => now);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  test('waits for the complete interval after start', () => {
    const timedKey = createTimedKeys([{key: '1', intervalMinutes: 10}], jest.fn())[0];
    timedKey.timer.start();

    now += 10 * 60 * 1000;
    expect(timedKey.timer.isElapsed()).toBe(false);

    now += 1;
    expect(timedKey.timer.isElapsed()).toBe(true);
  });

  test('creates independent timers and executes the configured key', async () => {
    const pressKey = jest.fn().mockResolvedValue();
    const timedKeys = createTimedKeys([
      {key: '1', intervalMinutes: 10},
      {key: '2', intervalMinutes: 30},
      {key: '3', intervalMinutes: 60}
    ], pressKey);

    timedKeys.forEach(({timer}) => timer.start());
    now += 30 * 60 * 1000 + 1;

    const elapsed = timedKeys.filter(({timer}) => timer.isElapsed());
    expect(elapsed.map(({key}) => key)).toEqual(['1', '2']);

    for(const timedKey of elapsed) {
      timedKey.timer.update();
      await timedKey.execute();
    }

    expect(pressKey.mock.calls).toEqual([['1'], ['2']]);
    expect(timedKeys[0].timer.isElapsed()).toBe(false);
    expect(timedKeys[1].timer.isElapsed()).toBe(false);
  });

  test('ignores missing and invalid configuration', () => {
    expect(createTimedKeys(undefined, jest.fn())).toEqual([]);
    expect(createTimedKeys([
      {key: '', intervalMinutes: 10},
      {key: '1', intervalMinutes: 0}
    ], jest.fn())).toEqual([]);
  });

  test('a new bot run starts with fresh timer state', () => {
    const firstRun = createTimedKeys([{key: '1', intervalMinutes: 10}], jest.fn())[0];
    firstRun.timer.start();
    now += 10 * 60 * 1000 + 1;
    expect(firstRun.timer.isElapsed()).toBe(true);

    const restartedRun = createTimedKeys([{key: '1', intervalMinutes: 10}], jest.fn())[0];
    restartedRun.timer.start();
    expect(restartedRun.timer.isElapsed()).toBe(false);
  });
});
