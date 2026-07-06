# loon

个人 Loon 插件仓库，仅供学习、研究与个人网络环境测试使用。

## GitHubIP.plugin

`GitHubIP.plugin` 用于缓解 GitHub 域名 DNS 污染、资源加载慢和公开下载链接访问困难的问题。

功能：

- 使用 `GitHub520` 的 `hosts.json` 自动生成 GitHub 页面/API/静态资源域名的 `[host]` 映射。
- 使用 `gh-proxy.com` 加速公开 `raw`、`release`、`archive`、`codeload`、`gist` 下载链接。
- 排除 `svipm/*` 路径，避免自有仓库或可能涉及私有内容的请求经过第三方代理。
- GitHub Actions 每小时自动更新一次，并刷新插件头部 `#!date` 时间，方便 Loon 显示更新时间。

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

## 免责声明

本仓库内容仅供学习、研究与个人合法用途测试。请遵守当地法律法规、网络服务条款及相关平台规则。插件中使用的第三方数据源和代理服务由对应项目或服务提供者维护，其可用性、准确性、安全性和合规性不由本仓库保证。

使用本仓库内容所产生的任何风险、损失或法律责任由使用者自行承担。若相关内容侵犯了你的权益，请联系删除。
