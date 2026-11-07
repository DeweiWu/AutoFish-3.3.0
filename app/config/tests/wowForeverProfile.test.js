const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..', '..', '..');
const GAME = 'WoW Forever';
const PROFILES = ['Default', 'WIN1', 'WIN2', 'WIN3', 'WIN4', 'WIN5', 'WIN6', 'WIN7', 'WIN8', 'WIN9', 'WIN10'];
const PREVIOUS_GAMES = ['Retail', 'Cata Classic', 'Classic', 'Leg', 'MoP', 'Cata', 'LK Private', 'TBC', 'Vanilla', 'Vanilla (splash)'];
const MISSING_WINDOW = '未找到游戏窗口。无限服 / WoW Forever 仍使用现有窗口匹配（标题包含 “World of”，类名 GxWindowClass、GxWindowClassD3d 或 waApplication Window）。若无法识别，请到 Advanced Settings 使用 Custom Window 手动选择客户端窗口。浮漂识别和收竿尚未在 1.60.1.70862 上实机验证。';

const readJson = (rel) => JSON.parse(fs.readFileSync(path.join(ROOT, rel), 'utf8'));
const normalizeNewlines = (text) => text.replace(/\r\n/g, '\n');
const readText = (rel) => normalizeNewlines(fs.readFileSync(path.join(ROOT, rel), 'utf8'));
const withoutGame = (profile) => {
  const copy = JSON.parse(JSON.stringify(profile));
  delete copy.game;
  return copy;
};

describe('WoW Forever profile', () => {
  test('dedicated list check matches a CRLF checkout', () => {
    const needle = 'const gamesDedicated = [\n    `WoW Forever`\n  ]';
    const windowsText = fs.readFileSync(path.join(ROOT, 'app/ui/renderSettings.js'), 'utf8').replace(/\n/g, '\r\n');

    expect(windowsText.includes(needle)).toBe(false);
    expect(normalizeNewlines(windowsText).includes(needle)).toBe(true);
  });

  test('clones Classic into every window without changing other games', () => {
    const cloned = [];

    for(const profile of PROFILES) {
      for(const file of ['bot.json', 'defaults.json']) {
        const data = readJson(`app/config/${profile}/${file}`);
        const forever = data.patch[GAME];
        const classic = data.patch.Classic;
        const lkPrivate = data.patch['LK Private'];

        expect(forever).toBeDefined();
        expect(forever.game).toBe(GAME);
        expect(classic.game).toBe('Classic');
        expect(withoutGame(forever)).toEqual(withoutGame(classic));
        expect(forever).not.toEqual(lkPrivate);
        expect(forever.maxFishTime).toEqual({from: 25, to: 28});
        expect(lkPrivate.maxFishTime).toEqual({from: 13, to: 16});
        expect(forever.catchFishButton).toBe('right');
        expect(forever.checkLogic).toBe('default');
        expect(forever.whitelist).toBe(false);
        expect(forever.splashColor).toBeUndefined();
        expect(forever.useCustomWindow).toBe(false);
        expect(data.game).toEqual({
          names: ['World of'],
          classNames: ['GxWindowClass', 'GxWindowClassD3d', 'waApplication Window'],
          handles: []
        });
        expect(Object.keys(data.patch).slice(0, PREVIOUS_GAMES.length)).toEqual(PREVIOUS_GAMES);
        cloned.push(forever);
      }
    }

    for(const profile of cloned.slice(1)) {
      expect(profile).toEqual(cloned[0]);
    }
  });

  test('adds the sensitivity key and keeps saved window settings', () => {
    for(const profile of PROFILES) {
      const settings = readJson(`app/config/${profile}/settings.json`);
      expect(settings.game).toBe('Retail');
      expect(settings.useInt).toBe(false);
      expect(settings.intKey).toBe('f');
      expect(settings.fishingKey).toBe('1');
      expect(settings.stopKey).toBe('delete');
      expect(settings.bobberSensitivity[GAME]).toBe(settings.bobberSensitivity.Classic);
      expect(settings.bobberSensitivity.Classic).toBe(7);
      expect(settings.bobberSensitivity['Vanilla (splash)']).toBe(10);
      expect(settings.bobberSensitivity['LK Private']).toBe(7);
      expect(Object.keys(settings.bobberSensitivity)).toEqual([...PREVIOUS_GAMES.slice(0, 3), GAME, ...PREVIOUS_GAMES.slice(3)]);

      if(profile == 'Default') {
        expect(settings.multipleWindows).toBe(false);
        expect(settings.initial).toBe(true);
        expect(settings.initialZone).toBe(true);
        expect(settings.timedKeys).toEqual([]);
      } else {
        expect(settings.multipleWindows).toBe(true);
        expect(settings.initial).toBe(false);
        expect(settings.initialZone).toBe(false);
        expect(settings.timedKeys).toBeUndefined();
      }
    }
  });

  test('is selectable, keeps sink detection, and explains Custom Window in Chinese', () => {
    const renderSettings = readText('app/ui/renderSettings.js');
    const main = readText('app/main.js');
    const settingsUi = readText('app/ui/settings.js');
    const createBot = readText('app/bot/createBot.js');
    const startup = main.match(/let games = \[([^\]]+)\]/);
    const startupNames = [...startup[1].matchAll(/[`'"]([^`'"]+)[`'"]/g)].map((match) => match[1]);
    const warningLine = main.split('\n').find((line) => line.includes('Cata Classic') && line.includes('streamMode'));

    expect(renderSettings).toContain('const gamesDedicated = [\n    `WoW Forever`\n  ]');
    expect(renderSettings).toContain('label: `WoW Forever`');
    expect(renderSettings).toContain('label: `Official-like`');
    expect(renderSettings).toContain('label: `Private-like`');
    expect(renderSettings).toContain('game == `Retail` || game == `Classic` || game == `Cata Classic` || game == `WoW Forever`');
    expect(startupNames).toEqual([...PREVIOUS_GAMES.filter((name) => name != 'Vanilla (splash)'), GAME]);
    expect(main).toContain(MISSING_WINDOW);
    expect(main).toContain("Can't find any window of the game! Go to the Advanced Settings and choose the window of the game manually.");
    expect(warningLine).not.toContain(GAME);
    expect(settingsUi).toContain('event.target.value == "LK Private"');
    expect(settingsUi).not.toContain(GAME);
    expect(createBot).toContain('settings.game == `Retail` || settings.bobberColor == `Manual`');
    expect(createBot).toContain('settings.game == `Vanilla (splash)`');
    expect(createBot).not.toContain(GAME);
  });
});
