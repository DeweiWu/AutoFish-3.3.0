# 无限服 / WoW Forever 专用游戏档

用户已批准，按此实施。目标客户端是用户自己的 Windows 魔兽无限服客户端 1.60.1.70862。本文不声称浮漂识别或收竿已在该客户端上实测。

## 决定

- 新增独立游戏档，配置键和界面名称都是 `WoW Forever`（无限服）。
- 以每个窗口配置里现有的 `Classic` 对象为起点深拷贝，只把 `game` 改成 `WoW Forever`。
- 不修改 `Classic`，不从 `LK Private` 复制。`LK Private` 的等钩时间是 13–16 秒；新档沿用 Classic 的 25–28 秒，这只是起点，不是无限服实测计时。
- 不新增识别算法。`createBot.js` 里 Retail / Manual 颜色走消失判定，`Vanilla (splash)` 走水花，其余档走现有像素下沉。`WoW Forever` 不进入前两支，因此使用现有下沉判定。
- 收竿沿用 Classic 的 `catchFishButton: "right"`。
- 交互键使用现有 `useInt` / `intKey`。界面允许为该档勾选，仓库默认 `useInt` 仍是 `false`。
- 拾取过滤沿用 Classic 的 `whitelist: false`。不启用过滤，避免使用尚未在无限服上验证的拾取坐标。
- `bobberSensitivity["WoW Forever"]` 与 Classic 同为 `7`。这是拷贝的默认值，不是实测阈值。
- 窗口匹配不改：标题规则仍是 `World of`，类名仍是 `GxWindowClass`、`GxWindowClassD3d`、`waApplication Window`。匹配失败时给中文说明，让用户到 Advanced Settings 用 Custom Window 手动选择。
- 不加入官方服封号提示，也不加入 LK Private 的 Ascension 提示，不新增私服提示。
- `Default` 与 `WIN1`–`WIN10` 的 `bot.json`、`defaults.json`、`settings.json` 都有该档。不改各窗口已有的 `game`、`multipleWindows`、`initial` 等选择。
- 选择写入现有 `settings.json`。重启后只要 `settings.game` 是 `WoW Forever`，对应的 `patch` 必须存在。
- 设置界面游戏档下拉可以选到它，并放在单独分组，不放进 `Private-like`。
- `app/main.js` 里被注释的首次启动游戏列表同样加入 `WoW Forever`。该对话框保持注释：仓库里的 `settings.initial` 不会被这段死代码清掉，重新启用会在每次启动打断现有用户。应用窗口打开后，从设置区的游戏档下拉选择。

## 明确不做

- 不猜测无限服专用图像阈值、水花参数或收竿时机，也不把这些写成已验证。
- 不把新档加入 Classic 专有画面分支（高亮取色、官方服警告、寻找玩家时的鼠标转向例外）。
- 不新增注入、内存读取、隐藏、混淆、反检测或绕过。
- 不操作用户电脑或正在运行的游戏。

## 使用与验收

以下步骤供用户在自己的 Windows 机器上验收。本仓库没有在 1.60.1.70862 上验证真实画面或坐标。

1. 启动程序，在游戏档里选择 `WoW Forever`。默认钓鱼键是 `1`，停止键是 `delete`，交互键默认关闭。需要交互键时再勾选现有选项并设置按键。
2. 用 Fishing Zone 按当前画面重划钓鱼区域。不要直接相信配置里从 Classic 拷来的区域。
3. 点开始。若日志出现中文“未找到游戏窗口”，打开 Advanced Settings，用 Custom Window 选中无限服客户端窗口后再试。现有标题规则可能对不上 1.60.1.70862。
4. 确认停止键仍是 `delete`，需要时改成自己的按键。
5. 人工抛一次竿，看程序能否识别浮漂并右键收竿。识别失败或收竿失败都算尚未兼容，不要当成配置错误以外的已验证行为。拾取过滤保持关闭，直到自己核对坐标后再考虑打开。
