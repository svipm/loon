# One1222.js 反混淆 / 解密结果

## 输出文件

| 文件 | 说明 |
|------|------|
| `One1222.js` | 原始混淆文件 |
| `One1222.deob.js` | 自动解密：字符串数组旋转 + a0d/a0e 全量内联 (仍含对象代理/死代码) |
| `One1222.business.js` | 同上，去掉 Env 兼容层，便于阅读业务主体 |
| **`One1222.readable.js`** | **完整可读版**（控制流重构后的等价实现，推荐阅读） |
| `string-table-a0e.json` | 旋转后 a0e 解码字符串表 (2057 条) |
| `deobfuscate.mjs` | 自动解密管线 |

## 混淆 / 加密层

1. **obfuscator.io 字符串数组** `a0c` + 校验和旋转 `(a0c, 0xef498)`
2. **双解码器**
   - `a0e(idx)`: base64 → 百分号编码 → `decodeURIComponent`
   - `a0d(idx, key)`: base64 → **RC4(key)** → 百分号编码 → `decodeURIComponent`
3. **业务层 AES-CBC**（响应 body 加解密）
   - KEY: `l*bv%Ziq000Biaog`
   - IV:  `8597506002939249`
   - 模式: CBC / PKCS7（CryptoJS，由远程 `Utils.js` 提供）
4. **控制流平坦化 + 对象属性代理 + 死代码 + 反调试包装**

## 自动还原统计

- 解码并替换字符串调用: **1486** 处
- 字符串表长度: **2057**
- 失败调用: 0

## 业务逻辑摘要（可读版）

| 路径 | 行为 |
|------|------|
| 请求 `/article/detail` | 从 `onetoken1222.txt` 拉 token 写入 headers |
| 响应 `/ad/space` | AES 解密 → 清空各类 banner ads → 再加密 |
| 响应 `/v2.5/navigation` | 只保留 one / discovery / vod / my |
| 响应 `/bootstrap` | 伪造成 VIP（level 10，到期 2099-09-09，关广告开关等） |
| 响应 `/article/discovery` | 递归把所有 `buy` 改成 `1` |
| 响应 `/my/userExtraInfo` | 伪造 `active_level` |
| 响应 `/vip/download` | 伪造下载额度 limit/use/last |

## 使用建议

- 日常阅读 / 二次修改：用 **`One1222.readable.js`**
- 对照自动还原是否漏逻辑：看 `One1222.business.js`（约 119KB，含残留代理对象）
