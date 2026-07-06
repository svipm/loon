const fs = require("fs");
const path = require("path");
const net = require("net");

const SOURCE_URL = "https://raw.hellogithub.com/hosts.json";
const SOURCE_REPO = "https://github.com/521xueweihan/GitHub520";
const OUTPUT_FILE = path.join(__dirname, "..", "GitHubIP.plugin");

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
    if (!hosts.has(host)) {
      hosts.set(host, ip);
    }
  }

  if (hosts.size === 0) {
    throw new Error("No valid host entries were found");
  }

  const generatedAt = new Date().toISOString();
  const lines = [
    "#!name=GitHub IP",
    "#!desc=Use GitHub520 hosts.json to fix GitHub DNS pollution for GitHub domains. Source: raw.hellogithub.com/hosts.json",
    "#!author=svipm",
    `#!homepage=${SOURCE_REPO}`,
    `#!date=${generatedAt}`,
    "",
    "[host]",
    ...Array.from(hosts.entries()).map(([host, ip]) => `${host} = ${ip}`),
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
