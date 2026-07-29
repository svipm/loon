# loon

个人 Loon 插件仓库，仅供学习、研究与个人网络环境测试使用。默认推荐 iPhone 上使用 `GitHubFast.plugin` 优化 GitHub 访问。

## 资源索引

- [公开 Loon / Quantumult X / Surge / JS 总索引](RESOURCE_LINKS.md)：按功能分类，包含目标 App / 网站、用途、来源、文件和直链。
- [手机已安装 App 专用索引](INSTALLED_APP_LINKS.md)：按你列出的 App / 网站分组，并在表头汇总实际适用目标和主要功能 / 用途。
- 生成脚本：`scripts/build-resource-index.ps1`、`scripts/build-installed-app-index.ps1`。


## 推荐方案：GitHubFast.plugin

`GitHubFast.plugin` 是 iPhone 上优先使用的 GitHub 访问优化插件。它把 GitHub 页面、API、头像、静态资源和下载相关域名交给 `https://doh.pub/dns-query` 做 DoH 解析，减少本地 DNS 污染影响；同时只对公开 `raw`、`release`、`archive`、`codeload`、`gist` 下载链接启用可选公益代理。

订阅地址：

```text
https://raw.githubusercontent.com/svipm/loon/main/GitHubFast.plugin
```

该订阅地址需要先把本仓库中的 `GitHubFast.plugin` 提交并推送到 `main` 分支后才会生效。未推送前，可先把本地 `GitHubFast.plugin` 通过 AirDrop、iCloud Drive、文件 App 或自建静态链接导入 Loon。

如果 raw 链接在当前网络下无法加载，可先用代理地址导入：

```text
https://gh-proxy.com/https://raw.githubusercontent.com/svipm/loon/main/GitHubFast.plugin
```

推荐设置：

1. 在 Loon 中导入并启用 `GitHubFast.plugin`。
2. 插件参数 `代理模式` 保持 `Auto`, 它会每 6 小时和网络切换时测速一次。
3. 按 Loon 提示开启 MITM, 并只勾选插件声明的 GitHub 下载域名。
4. 不要同时启用 `GitHubIP.plugin` 或 `FzjexGitHubDoH.plugin`, 避免多个 GitHub 解析方案互相覆盖。
5. 私有仓库、登录态请求、Cookie、Token、鉴权链接和敏感文件不要通过第三方下载代理访问；脚本会跳过常见敏感请求，但不要把它当作权限隔离边界。

适用判断：

- 如果 GitHub 网页打不开、图片或静态资源加载异常，优先使用本插件。
- 如果 GitHub 页面能打开但 raw、release、archive 下载慢，本插件的下载代理规则会优先改善这些公开下载链接。
- 如果只想测试纯 DoH 解析，不需要下载代理，使用 `FzjexGitHubDoH.plugin`。
- 如果只想测试固定 IP hosts，不需要 DoH，使用 `GitHubIP.plugin`。

本地验证：

```text
node --check scripts/github-download-proxy-auto.js
node --check scripts/generate-githubip-plugin.js
node scripts/validate-githubfast.js
node scripts/validate-githubfast.js --network
```

iPhone Loon 实机验证清单：

1. 导入并启用 `GitHubFast.plugin`。
2. 插件参数 `代理模式` 选择 `Auto`。
3. 在 Loon 中允许插件声明的 MITM 域名，并确认证书已安装且信任。
4. 关闭 `GitHubIP.plugin`、`FzjexGitHubDoH.plugin` 或其他 GitHub 解析/重写插件。
5. 断开并重新连接 Loon，让 `network-changed` 脚本触发一次测速。
6. 在 Safari 打开 `https://github.com/`，确认网页首页、登录态页面、头像和静态资源加载正常。
7. 打开一个公开 raw 链接，例如 `https://raw.githubusercontent.com/microsoft/vscode/main/package.json`，确认能快速显示 JSON。
8. 打开一个公开 release 下载链接，确认能开始下载。
9. 打开 Loon 日志，确认 `GitHub Proxy Auto Select` 执行成功，且没有私有仓库、Cookie、Authorization 或 token 链接被改写到第三方代理。

发布前检查清单：

1. 确认准备提交的文件包含 `.gitattributes`、`GitHubFast.plugin`、`README.md`、`.github/workflows/update-githubip.yml`、`scripts/github-download-proxy-auto.js`、`scripts/generate-githubip-plugin.js`、`scripts/validate-githubfast.js` 和 `GitHubIP.plugin`。
2. 不提交 `FzjexGitHubDoH 20260706 231956 4863004.plugin` 这类本地重复备份文件。
3. 运行本地验证和网络验证。
4. 推送到 `main` 后, 再用 iPhone Loon 订阅 `https://raw.githubusercontent.com/svipm/loon/main/GitHubFast.plugin`。

## GitHubIP.plugin

`GitHubIP.plugin` 用于缓解 GitHub 域名 DNS 污染、资源加载慢和公开下载链接访问困难的问题。

功能：

- 使用 `GitHub520` 的 `hosts.json` 自动生成 GitHub 页面/API/静态资源域名的 `[host]` 映射。
- 在 Loon 插件设置里通过 `代理模式` 选择 `Auto`、`ghproxy.net`、`gh-proxy.com` 或 `gh.3w.pm`。
- `Auto` 模式会每 6 小时和网络切换时测速可选公益代理，并为公开 `raw`、`release`、`archive`、`codeload`、`gist` 下载链接选择较快的代理。
- GitHub 用户头像域名走 `[host]` IP 映射，不经过第三方下载代理。
- 排除 `svipm/*` 路径，并跳过带 Cookie、Authorization 或常见签名/Token 查询参数的请求，降低私有或敏感链接误走第三方代理的风险。
- GitHub Actions 每小时自动更新一次，并刷新插件头部 `#!date` 时间，方便 Loon 显示更新时间。

当前纳入的公开下载代理：

- `ghproxy.net`：当前测试 raw 文件可用，作为默认兜底值。
- `gh-proxy.com`：当前测试 raw 文件可用。
- `gh.3w.pm`：当前测试 raw 文件可用。

未纳入的候选站点：

- `githubproxy.cc`、`ghproxy.site`：当前测试虽然返回 200，但返回体积与原始 raw 文件不一致，疑似返回网页壳或非目标内容，暂不加入自动选择。`ghproxy.vip` 当前测试返回 502, 暂不加入自动选择。

订阅地址：

```text
https://raw.githubusercontent.com/svipm/loon/main/GitHubIP.plugin
```

如果 raw 链接在当前网络下无法加载，可先用代理地址导入：

```text
https://gh-proxy.com/https://raw.githubusercontent.com/svipm/loon/main/GitHubIP.plugin
```

数据来源：

```text
https://github.com/521xueweihan/GitHub520
https://raw.hellogithub.com/hosts.json
```

## FzjexGitHubDoH.plugin

`FzjexGitHubDoH.plugin` 用于让 Loon 对 GitHub、GitHub 子域名、`linux.do` 和 `linux.do` 子域名使用 `https://dns.fzjex.cn/` 进行 DoH 解析。

订阅地址：

```text
https://raw.githubusercontent.com/svipm/loon/main/FzjexGitHubDoH.plugin
```

注意事项：

- 不要把它和 `GitHubIP.plugin` 同时作为 GitHub 解析测试方案启用；一个是固定 `[host]` IP，一个是指定 DoH 解析，同时启用会增加排查难度。
- 手机里的 `127.0.0.1` 是手机本机，不是 Windows 上的 `Steamcommunity_302`，所以本插件不会把域名指向 `127.0.0.1`。
- 插件使用 Loon host server 写法：`server:https://dns.fzjex.cn/`。

## 使用前须知

使用本仓库前，请先确认你理解以下事项：

- 本仓库内容只适合学习、研究和个人网络环境测试。
- 本仓库内容不保证在任何地区、网络、设备或 Loon 版本上都可用。
- 本仓库内容不会替你判断某项使用行为是否合法、合规或被授权。
- 本仓库内容可能涉及第三方数据源和第三方代理服务，使用前请自行评估风险。
- 私有仓库、登录态请求、含 Cookie、Token、鉴权参数或敏感内容的链接，不应交由第三方代理服务处理。
- 如果你不理解某条规则的作用，请不要启用、传播或修改后使用。

## 24 小时删除/卸载要求

本仓库内容仅面向临时学习和测试场景。请在下载、安装、导入、订阅、复制或运行后的 24 小时内，自行完成以下操作之一：

- 从 Loon 中禁用并删除相关插件。
- 删除本地保存的插件、脚本、规则或配置文件。
- 取消相关订阅链接。
- 删除由本仓库内容派生、复制或修改得到的临时文件。

若你在 24 小时后继续保留、订阅、运行或使用本仓库内容，即视为你已经自行确认该行为具备合法、合规、授权且正当的使用依据，并愿意独立承担由此产生的一切风险、争议和责任。

## 禁止用途

严禁将本仓库内容用于任何违法、违规、侵权、恶意、未授权或不正当用途，包括但不限于：

- 未经授权访问、抓取、下载、转发、绕过或使用任何网络服务、数据、接口或资源。
- 绕过平台访问限制、风控机制、权限校验、地区限制、账号限制或付费限制。
- 攻击、扫描、爆破、干扰、破坏、压测或影响第三方系统、网络、服务或设备。
- 传播恶意代码、钓鱼链接、欺诈内容、违法信息或侵犯他人权益的内容。
- 窃取、收集、泄露、转发或滥用账号、密码、Cookie、Token、隐私数据或敏感信息。
- 侵犯版权、商标权、专利权、商业秘密、隐私权、名誉权或其他合法权益。
- 批量注册、自动化滥用、恶意爬取、商业倒卖、非法牟利或协助他人实施类似行为。
- 在未获授权的公共网络、公司网络、学校网络、受管理设备或他人设备上使用。
- 任何违反你所在地法律法规、服务条款、平台规则或网络管理要求的行为。

## 第三方服务与数据源说明

本仓库中的部分功能可能依赖第三方项目、数据源、代理服务、镜像服务、DNS/Host 数据、图标资源或网络接口。这些第三方资源不由本仓库维护，本仓库无法保证其：

- 持续可用。
- 数据准确。
- 更新及时。
- 访问稳定。
- 安全可靠。
- 符合你的使用场景。
- 符合你所在地或使用环境的法律法规。

第三方服务可能发生以下情况：

- 服务停止、限流、故障或变更。
- 返回错误、过期或不适合你网络环境的 IP。
- 记录你的请求来源、目标 URL、访问时间或其他网络信息。
- 因网络环境差异导致访问失败、速度变慢或连接异常。
- 对私有资源、鉴权资源或登录态请求处理不正确。

使用第三方服务前，请自行阅读并遵守对应项目或服务的使用条款、隐私政策、授权协议和免责声明。

## 隐私与安全提醒

请不要通过第三方代理、镜像服务或公开转换服务访问以下内容：

- 私有仓库。
- 私有 Gist。
- 包含访问令牌的 URL。
- 带有 Cookie、Authorization Header 或其他身份凭据的请求。
- 公司、学校、组织或客户的内部代码与文件。
- 未公开发布或不应被第三方服务处理的资源。

如果你自行修改规则，使私有内容、登录态请求或敏感链接经过第三方服务，由此产生的信息泄露、账号风险、仓库暴露、权限异常、数据损失或法律责任均由你自行承担。

## 免责声明

本仓库内的所有内容，包括但不限于 Loon 插件、脚本、规则、配置片段、自动生成文件、文档说明及相关示例，仅供学习、研究、技术交流与个人合法网络环境测试使用。本仓库不以任何形式鼓励、支持、协助或暗示用户将相关内容用于任何违反法律法规、违反服务条款、侵犯他人权益、破坏网络安全、绕过授权限制、牟利分发或其他不当用途。

请你在下载、复制、订阅、安装、导入、运行、修改、分发或参考本仓库内容前，确认自己已经充分理解相关技术行为可能产生的影响，并确认你的使用方式符合你所在地及相关司法管辖区的法律法规、监管要求、平台规则、服务协议和网络使用规范。若你不能确认相关使用行为是否合法、合规或被授权，请立即停止使用本仓库内容。

本仓库内容仅面向临时学习和测试场景。请在下载、安装、导入、订阅或使用后的 24 小时内自行删除、卸载、取消订阅或移除相关内容。若你继续保留或使用本仓库内容，即视为你已经自行确认该行为具备合法、合规、授权且正当的使用依据，并愿意独立承担由此产生的一切风险和责任。

严禁将本仓库内容用于任何违法违规用途，包括但不限于：未经授权访问网络服务或数据、规避平台风控或访问限制、攻击或干扰第三方系统、传播恶意代码、侵犯版权或其他知识产权、侵犯隐私、窃取账号或凭据、批量注册或自动化滥用、商业倒卖、非法牟利、协助他人实施违法行为，或任何可能损害国家、社会、平台、组织或个人合法权益的行为。

本仓库中的部分功能可能依赖第三方数据源、公开项目、代理服务、镜像服务、DNS/Host 数据或网络接口。这些第三方资源由对应的项目维护者、服务提供者或网络环境决定，本仓库无法保证其持续可用、准确、安全、稳定、合法、合规或适合你的使用场景。第三方服务可能记录请求信息、变更规则、停止服务、返回错误数据、存在延迟或安全风险。使用者应自行评估并承担相关风险。

本仓库中的 GitHub 相关规则主要用于个人网络环境中的解析测试、访问诊断和公开资源下载辅助。对于私有仓库、登录态请求、包含令牌或 Cookie 的 URL、受权限保护的资源、敏感数据或任何不应交由第三方服务处理的请求，请勿通过第三方代理或镜像服务访问。因用户自行配置、修改、订阅或转发相关请求导致的信息泄露、账号风险、访问异常、数据损失或其他后果，由用户自行承担。

本仓库作者不对任何直接、间接、偶然、特殊、惩罚性或后续损失承担责任，包括但不限于网络中断、访问失败、账号异常、数据丢失、隐私泄露、设备异常、服务封禁、法律纠纷、经济损失或第三方索赔。无论此类损失是否由使用、无法使用、错误使用、修改、传播或依赖本仓库内容引起，均由使用者自行承担。

本仓库不提供任何明示或默示担保，包括但不限于适销性、特定用途适用性、准确性、完整性、及时性、稳定性、安全性、无错误、无中断、无侵权或合规性的担保。本仓库内容可能随时变更、删除、失效或停止维护，作者没有义务提前通知。

如果你是未成年人，或你所在地区、组织、学校、公司、网络服务提供方、设备管理方对相关技术工具存在限制，请在监护人、管理员或有权主体明确许可后再进行学习和测试。未经许可请勿在公共网络、公司网络、学校网络、他人设备或受管理设备上使用本仓库内容。

若本仓库内容无意中侵犯了你的合法权益，或你认为其中任何内容存在不当、侵权、违法或不应公开的问题，请通过 GitHub Issue 或其他可用方式联系仓库维护者。核实后将尽快处理、修改或删除相关内容。

下载、订阅、安装、导入、运行、复制、修改、分发或继续使用本仓库内容，即表示你已经阅读、理解并同意本免责声明的全部内容；如果你不同意本免责声明，请立即停止使用并删除本仓库相关内容。
