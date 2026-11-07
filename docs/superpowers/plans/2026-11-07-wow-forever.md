# WoW Forever Profile Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 新增可选、可持久化的 `WoW Forever` 游戏档，从 Classic 配置克隆，并补上不依赖 Windows native 模块的一致性测试。

**Architecture:** 不改下沉判定代码。每个 `bot.json` / `defaults.json` 在 `patch` 末尾插入 Classic 的深拷贝，`settings.json` 只增加灵敏度键。设置下拉、被注释的启动列表和找不到窗口时的中文说明使用同一个档名。

**Tech Stack:** Node.js CommonJS、现有 JSON 配置、Jest。

## Global Constraints

- 游戏档键名是 `WoW Forever`。
- 从该文件自己的 `Classic` 深拷贝，不覆盖 `Classic`，不复制 `LK Private`。
- 保留现有下沉判定；`catchFishButton` 保持 `"right"`；`checkLogic` 保持 `"default"`；`maxFishTime` 保持 `{from: 25, to: 28}`，且不得写成已实测。
- `whitelist` 保持 `false`；`useInt` 仓库默认保持 `false`，但设置界面允许勾选。
- `bobberSensitivity["WoW Forever"]` 等于该文件的 Classic 值 `7`，这是拷贝值。
- 窗口规则保持 `World of` 与 `GxWindowClass`、`GxWindowClassD3d`、`waApplication Window`。
- 不加入官方服警告或 LK Private / Ascension 提示。
- 不改 `Default` 与 `WIN1`–`WIN10` 已有的 `game`、`multipleWindows`、`initial`、`initialZone`。
- 不新增算法、注入、内存读取、隐藏、混淆或反检测。
- 不把首次启动对话框从注释里放出来。
- 测试只读 JSON 和源码文本，不 `require` `keysender`、Electron 或 `createBot.js`。

---

### Task 1: 配置与列表一致性测试

**Files:**
- Create: `app/config/tests/wowForeverProfile.test.js`
- Test: `app/config/tests/wowForeverProfile.test.js`

**Interfaces:**
- Consumes: `app/config/*/bot.json`、`defaults.json`、`settings.json`，以及 `app/ui/renderSettings.js`、`app/main.js`、`app/ui/settings.js`、`app/bot/createBot.js` 的文本。
- Produces: 失败断言，要求存在 `patch["WoW Forever"]`、灵敏度键、设置下拉、启动列表和中文 Custom Window 说明。

- [x] **Step 1: Write the failing test**

```javascript
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..', '..', '..');
const GAME = 'WoW Forever';
const PROFILES = ['Default', 'WIN1', 'WIN2', 'WIN3', 'WIN4', 'WIN5', 'WIN6', 'WIN7', 'WIN8', 'WIN9', 'WIN10'];
const PREVIOUS_GAMES = ['Retail', 'Cata Classic', 'Classic', 'Leg', 'MoP', 'Cata', 'LK Private', 'TBC', 'Vanilla', 'Vanilla (splash)'];
const MISSING_WINDOW = '未找到游戏窗口。无限服 / WoW Forever 仍使用现有窗口匹配（标题包含 “World of”，类名 GxWindowClass、GxWindowClassD3d 或 waApplication Window）。若无法识别，请到 Advanced Settings 使用 Custom Window 手动选择客户端窗口。浮漂识别和收竿尚未在 1.60.1.70862 上实机验证。';

const readJson = (rel) => JSON.parse(fs.readFileSync(path.join(ROOT, rel), 'utf8'));
const readText = (rel) => fs.readFileSync(path.join(ROOT, rel), 'utf8');
const withoutGame = (profile) => {
  const copy = JSON.parse(JSON.stringify(profile));
  delete copy.game;
  return copy;
};

describe('WoW Forever profile', () => {
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
```

- [x] **Step 2: Run test to verify it fails**

Run: `npx jest app/config/tests/wowForeverProfile.test.js --runInBand`

Expected: FAIL because `patch["WoW Forever"]` is missing, the settings key is missing, and the UI strings are absent. The failure must be an assertion failure, not a missing-module error.

Observed RED (`npx jest app/config/tests/wowForeverProfile.test.js --runInBand --no-coverage`, exit 1):

- `clones Classic into every window without changing other games`: `expect(forever).toBeDefined()` received `undefined`.
- `adds the sensitivity key and keeps saved window settings`: `bobberSensitivity["WoW Forever"]` was `undefined`, expected `7`.
- `is selectable, keeps sink detection, and explains Custom Window in Chinese`: `renderSettings.js` did not contain `const gamesDedicated = [\n    \`WoW Forever\`\n  ]`.

3 failed, 0 passed. No missing-module error.

- [x] **Step 3: Implement the profile and the two UI lists**

Keep `createBot.js` and `settings.js` unchanged. In `app/ui/renderSettings.js`, add `gamesDedicated` and a third optgroup, and extend both interaction-key comparisons with `|| game == \`WoW Forever\``. In the commented startup array, append `"WoW Forever"`. Replace only the `!games` error so `WoW Forever` logs `MISSING_WINDOW` and every other game keeps the English sentence.

Insert the cloned patch with a script that does not reformat existing JSON. After `JSON.parse`, copy `patch.Classic`, set `game` to `WoW Forever`, stringify that object with two-space indent, indent the block by four spaces, and insert it before the final `\n  }\n}\n`. For settings, insert `"WoW Forever": 7` immediately after the `"Classic": 7` line.

- [x] **Step 4: Run test to verify it passes**

Run: `npx jest app/config/tests/wowForeverProfile.test.js --runInBand`

Expected: PASS, 3 tests.

Observed GREEN: that file passed, 3 tests.

- [x] **Step 5: Run the existing pure tests**

Run: `npx jest app/bot/tests/timedKeys.test.js app/utils/tests/vec.test.js app/utils/tests/zone.test.js --runInBand`

Expected: PASS. Do not treat a native-module failure as a profile regression.

Observed: `npx jest --runInBand --no-coverage` passed 4 suites / 11 tests (`wowForeverProfile`, `timedKeys`, `vec`, `zone`).

### Task 2: 记录实机限制

**Files:**
- Modify: `docs/superpowers/plans/2026-11-07-wow-forever.md`

- [x] **Step 1: Record the RED output and the Linux test limit**

RED output is recorded under Task 1 Step 2. `npx jest --runInBand --no-coverage` passes and does not load `keysender`.

`node -e "require('keysender')"` exits 1: `Cannot find module '../../build/Release/key_sender.node'` from `node_modules/keysender/dist/addon/index.js`. This checkout used `npm install --no-package-lock --ignore-scripts` on Linux, so that native addon was not built. `npm run make` then reached electron-packager and failed while rebuilding `keysender`: `disableInput.hpp` and `workwindow.hpp` use Windows types (`HWND`, `WPARAM`, `HHOOK`), and node-gyp exited 2. That is not a Windows build. Existing CI (`.github/workflows/build.yml`) runs tests and `npm run make` on `windows-2022` only for pushes to `main`, tags `v*`, and `workflow_dispatch`, not for pull requests.

## Self-review

- 独立档、Classic 起点、不覆盖 Classic、不复制 LK Private：Task 1 的深比较。
- 下沉判定与右键：配置断言，加上 `createBot.js` 不出现新档名。
- 交互键可选且默认关闭、拾取过滤关闭、灵敏度只是拷贝：设置断言和 `renderSettings.js` 条件。
- 多窗口与重启数据依赖：11 个 profile 的三份文件；默认 `game` 仍是 Retail。
- 启动列表与设置界面：源码断言。启动对话框保持注释。
- 窗口匹配与中文 Custom Window：`data.game` 断言和 `MISSING_WINDOW`。
- 无私服提示、无官方服警告扩围：`settings.js` 与警告条件行。
- 使用与验收、未实测声明：设计文档，不在本计划里新增运行时算法。
