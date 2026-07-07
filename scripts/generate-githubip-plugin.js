const fs = require("fs");
const path = require("path");
const net = require("net");

const SOURCE_URL = "https://raw.hellogithub.com/hosts.json";
const SOURCE_REPO = "https://github.com/521xueweihan/GitHub520";
const ICON_URL = "https://raw.githubusercontent.com/luestr/IconResource/main/App_icon/120px/GitHub.png";
const OUTPUT_FILE = path.join(__dirname, "..", "GitHubIP.plugin");
const EXCLUDED_HOSTS = new Set([
  // Download/file hosts are intentionally excluded from IP pinning.
  // Loon plugin updates and Script Hub conversions commonly depend on raw links,
  // while releases, archives, and codeload are better handled by rewrite proxy rules.
  "codeload.github.com",
  "github-cloud.s3.amazonaws.com",
  "github-com.s3.amazonaws.com",
  "github-production-release-asset-2e65be.s3.amazonaws.com",
  "github-production-repository-file-5c1aeb.s3.amazonaws.com",
  "github-production-user-asset-6210df.s3.amazonaws.com",
  "objects.githubusercontent.com",
  "raw.githubusercontent.com",
]);
const WILDCARD_HOSTS = ["github.io"];
const PROXY_SCRIPT_URL = "https://gh-proxy.com/https://raw.githubusercontent.com/svipm/loon/main/scripts/github-download-proxy-auto.js";
const PROXY_OPTIONS = ["Auto", "ghproxy.net", "gh-proxy.com", "gh.3w.pm"];
const DISCLAIMER_LINES = [
  "# 声明：本插件仅供学习、研究、技术交流和个人合法网络环境测试使用。",
  "# 请在下载、导入、订阅或启用后的 24 小时内自行删除、卸载或取消订阅。",
  "# 严禁用于违法违规、侵权、未授权访问、绕过平台限制、商业倒卖或任何不正当用途。",
  "# 本插件不提供突破访问控制、绕过授权、获取未公开资源、规避平台风控或批量抓取数据的能力。",
  "# 使用者应自行确认所在地法律法规、网络服务条款、组织/学校/公司网络规范和设备管理要求。",
  "# 本插件依赖第三方公开数据源和公益代理服务；可用性、准确性、稳定性、安全性与合规性均不作保证。",
  "# 公益代理可能限流、失效、变更、记录请求信息，或因多人共用出口触发 GitHub 429/风控提示。",
  "# 请勿通过第三方代理访问私有仓库、登录态请求、Cookie、Token、鉴权链接或任何敏感内容。",
  "# 私有代码、公司/学校/客户资料、未公开文件、账号凭据和任何敏感数据均不应交由第三方服务处理。",
  "# 若你不理解某条规则的作用，请不要启用、传播、二次分发或修改后继续使用。",
  "# 使用、修改、传播或继续保留本插件产生的所有风险、争议与责任均由使用者自行承担。",
  "# 如果本插件内容与你的使用环境、服务条款或法律要求冲突，请立即停止使用并删除相关配置。",
];
const DOWNLOAD_PROXY_RULES = [
  "",
  "[Script]",
  "",
  "# Benchmark selectable public mirrors, then cache the fastest one for Auto mode.",
  `cron "0 */6 * * *" script-path=${PROXY_SCRIPT_URL},timeout=30,tag=GitHub Proxy Auto Select,enable=true`,
  `network-changed script-path=${PROXY_SCRIPT_URL},timeout=30,tag=GitHub Proxy Auto Select,enable=true`,
  "",
  "# Public raw/release/archive/codeload/gist downloads.",
  `http-request ^https?:\\/\\/(raw\\.githubusercontent\\.com|codeload\\.github\\.com|gist\\.githubusercontent\\.com)\\/|^https?:\\/\\/github\\.com\\/[^\\/]+\\/[^\\/]+\\/(releases\\/download|archive\\/refs)\\/ script-path=${PROXY_SCRIPT_URL},timeout=10,tag=GitHub Download Proxy,enable=true`,
  "",
  "[MITM]",
  "hostname = raw.githubusercontent.com, github.com, codeload.github.com, gist.githubusercontent.com",
];

function isValidHost(host) {
  return (
    typeof host === "string" &&
    host.length > 0 &&
    host.length <= 253 &&
    /^[a-zA-Z0-9.-]+$/.test(host) &&
    !host.startsWith(".") &&
    !host.endsWith(".") &&
    host.split(".").every((label) => label.length > 0 && label.length <= 63)
  );
}

function formatPluginDate(date) {
  const pad = (value) => String(value).padStart(2, "0");
  return [
    date.getFullYear(),
    "-",
    pad(date.getMonth() + 1),
    "-",
    pad(date.getDate()),
    " ",
    pad(date.getHours()),
    ":",
    pad(date.getMinutes()),
    ":",
    pad(date.getSeconds()),
  ].join("");
}

async function main() {
  const response = await fetch(SOURCE_URL, {
    headers: {
      "user-agent": "svipm/loon-githubip-generator",
      accept: "application/json",
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch ${SOURCE_URL}: HTTP ${response.status}`);
  }

  const data = await response.json();
  if (!Array.isArray(data)) {
    throw new Error("hosts.json must be an array");
  }

  const hosts = new Map();
  for (const row of data) {
    if (!Array.isArray(row) || row.length < 2) continue;
    const [ip, host] = row;
    if (!net.isIP(ip) || !isValidHost(host)) continue;
    if (EXCLUDED_HOSTS.has(host)) continue;
    if (!hosts.has(host)) {
      hosts.set(host, ip);
    }
  }

  if (hosts.size === 0) {
    throw new Error("No valid host entries were found");
  }

  for (const domain of WILDCARD_HOSTS) {
    const candidates = Array.from(hosts.entries())
      .filter(([host]) => host === domain || host.endsWith(`.${domain}`))
      .map(([, ip]) => ip);
    if (candidates.length === 0) continue;

    const counts = new Map();
    for (const ip of candidates) {
      counts.set(ip, (counts.get(ip) || 0) + 1);
    }
    const [ip] = Array.from(counts.entries())
      .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))[0];
    hosts.set(`*.${domain}`, ip);
  }

  const generatedAt = formatPluginDate(new Date());
  const lines = [
    "#!name=GitHub IP",
    "#!desc=GitHub domain host mapping from GitHub520, plus selectable public download proxy. For study only.",
    "#!author=svipm",
    "#!tag=GitHub,Host,Download",
    `#!homepage=${SOURCE_REPO}`,
    `#!icon=${ICON_URL}`,
    `#!date=${generatedAt}`,
    `#!select=代理模式,${PROXY_OPTIONS.join(",")}`,
    "#!warning=For study and personal testing only. Delete within 24 hours. Do not use for illegal, infringing, unauthorized, commercial, or abusive purposes. Use at your own risk.",
    "#!notice=Do not proxy private repositories, login requests, cookies, tokens, or sensitive URLs through third-party services.",
    "",
    ...DISCLAIMER_LINES,
    "",
    "[host]",
    ...Array.from(hosts.entries()).map(([host, ip]) => `${host} = ${ip}`),
    ...DOWNLOAD_PROXY_RULES,
    "",
  ];

  fs.writeFileSync(OUTPUT_FILE, lines.join("\n"), "utf8");
  console.log(`Generated ${OUTPUT_FILE}`);
  console.log(`Entries: ${hosts.size}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
