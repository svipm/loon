# 一个 App 去广告 — Loon 安装 (fix3)

## 必须本地安装（重要）
远端 `raw.githubusercontent.com/svipm/loon/.../One1222.fixed.js` 当前 404。
请把同目录的 `One.plugin` + `One1222.fixed.js` 一起拷到 iPhone，用 Loon 打开 plugin 安装。

## 验证
1. 日志出现 `✅ one patched: /v2.5/bootstrap`
2. 日志出现 `✅ one token injected`（点视频详情时）
3. 若出现 `Token获取失败/超时 → 只会试看`，说明 token 源不可达

## fix3
- 我的页 game_bonus 弹窗强制关闭
- token 源改为 raw 直连优先（修试看）
- reject game_bonus / blind_box 图片
