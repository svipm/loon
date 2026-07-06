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
  // while releases, archives, and codeload are better handled by GitHubProxy.plugin.
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
const DOWNLOAD_PROXY_RULES = [
  "",
  "[URL Rewrite]",
  "",
  "# Public raw files. Exclude svipm/* to avoid sending private or personal repository requests to a third-party proxy.",
  "^https?:\\/\\/raw\\.githubusercontent\\.com\\/(?!svipm\\/)(.+)$ https://gh-proxy.com/https://raw.githubusercontent.com/$1 302",
  "",
  "# Public GitHub blob file pages. Exclude svipm/*.",
  "^https?:\\/\\/github\\.com\\/(?!svipm\\/)([^\\/]+\\/[^\\/]+\\/blob\\/.+)$ https://gh-proxy.com/https://github.com/$1 302",
  "",
  "# Public release assets. Exclude svipm/*.",
  "^https?:\\/\\/github\\.com\\/(?!svipm\\/)([^\\/]+\\/[^\\/]+\\/releases\\/download\\/.+)$ https://gh-proxy.com/https://github.com/$1 302",
  "",
  "# Public archive downloads. Exclude svipm/*.",
  "^https?:\\/\\/github\\.com\\/(?!svipm\\/)([^\\/]+\\/[^\\/]+\\/archive\\/refs\\/.+)$ https://gh-proxy.com/https://github.com/$1 302",
  "",
  "# Public codeload archive downloads. Exclude svipm/*.",
  "^https?:\\/\\/codeload\\.github\\.com\\/(?!svipm\\/)(.+)$ https://gh-proxy.com/https://codeload.github.com/$1 302",
  "",
  "# Public gist raw files. Exclude svipm/*.",
  "^https?:\\/\\/gist\\.githubusercontent\\.com\\/(?!svipm\\/)(.+)$ https://gh-proxy.com/https://gist.githubusercontent.com/$1 302",
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
    "#!desc=GitHub domain host mapping from GitHub520, with gh-proxy.com for public raw/release/archive downloads. For study only.",
    "#!author=svipm",
    "#!tag=GitHub,Host,Download",
    `#!homepage=${SOURCE_REPO}`,
    `#!icon=${ICON_URL}`,
    `#!date=${generatedAt}`,
    "#!warning=For study and personal testing only. Delete within 24 hours. Do not use for illegal, infringing, unauthorized, commercial, or abusive purposes. Use at your own risk.",
    "#!notice=Do not proxy private repositories, login requests, cookies, tokens, or sensitive URLs through third-party services.",
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
