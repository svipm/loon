const fs = require("fs");
const https = require("https");
const assert = require("assert");
const vm = require("vm");
const { performance } = require("perf_hooks");

const NETWORK_FLAG = "--network";
const runNetworkChecks = process.argv.includes(NETWORK_FLAG);

function read(file) {
  return fs.readFileSync(file, "utf8").replace(/\r\n/g, "\n");
}

function assertIncludes(text, needle, label) {
  assert(text.includes(needle), `${label}: missing ${needle}`);
}

function assertNotIncludes(text, needle, label) {
  assert(!text.includes(needle), `${label}: unexpected ${needle}`);
}

function hasSection(text, sectionName) {
  return new RegExp(`(^|\\n)\\[${sectionName}\\]($|\\n)`).test(text);
}

function runScriptRequest(script, request, selectedProxy = "ghproxy.net") {
  const context = {
    $request: request,
    $persistentStore: {
      read: (key) => (key === "代理模式" ? selectedProxy : null),
      write: () => true,
    },
    $done: (value) => {
      context.done = value;
    },
  };
  vm.createContext(context);
  vm.runInContext(script, context);
  return JSON.parse(JSON.stringify(context.done));
}

function validateFiles() {
  const fast = read("GitHubFast.plugin");
  assert(fast.startsWith("#!name=GitHub Fast DoH"), "GitHubFast.plugin metadata must be first");
  for (const sectionName of ["host", "Script", "MITM"]) {
    assert(hasSection(fast, sectionName), `GitHubFast.plugin missing [${sectionName}]`);
  }
  assertIncludes(
    fast,
    "#!select=代理模式,Auto,ghproxy.net,gh-proxy.com,gh.3w.pm",
    "GitHubFast.plugin",
  );
  assertIncludes(fast, "github.com = server:https://doh.pub/dns-query", "GitHubFast.plugin");
  assertIncludes(fast, "*.github.com = server:https://doh.pub/dns-query", "GitHubFast.plugin");
  assertIncludes(
    fast,
    "raw.githubusercontent.com = server:https://doh.pub/dns-query",
    "GitHubFast.plugin",
  );
  assertIncludes(fast, "network-changed script-path=", "GitHubFast.plugin");
  assertNotIncludes(fast, "ghproxy.vip", "GitHubFast.plugin");
  assertNotIncludes(fast, "dns.fzjex.cn", "GitHubFast.plugin");

  const ip = read("GitHubIP.plugin");
  assert(ip.startsWith("#!name=GitHub IP"), "GitHubIP.plugin metadata must be first");
  assertIncludes(
    ip,
    "#!select=代理模式,Auto,ghproxy.net,gh-proxy.com,gh.3w.pm",
    "GitHubIP.plugin",
  );
  assertIncludes(ip, "network-changed script-path=", "GitHubIP.plugin");
  assertNotIncludes(ip, "ghproxy.vip", "GitHubIP.plugin");

  const proxyScript = read("scripts/github-download-proxy-auto.js");
  assertIncludes(
    proxyScript,
    'const DEFAULT_PROXY = PROXY_BY_NAME["ghproxy.net"]',
    "github-download-proxy-auto.js",
  );
  assertIncludes(proxyScript, "hasSensitiveHeaders", "github-download-proxy-auto.js");
  assertIncludes(proxyScript, "hasSensitiveQuery", "github-download-proxy-auto.js");
  assertNotIncludes(proxyScript, "ghproxy.vip", "github-download-proxy-auto.js");

  const publicRaw = runScriptRequest(proxyScript, {
    url: "https://raw.githubusercontent.com/public/repo/main/file.txt",
    headers: {},
  });
  assert.strictEqual(
    publicRaw.url,
    "https://ghproxy.net/https://raw.githubusercontent.com/public/repo/main/file.txt",
  );

  const skippedRequests = [
    {
      url: "https://raw.githubusercontent.com/public/repo/main/file.txt?token=abc",
      headers: {},
    },
    {
      url: "https://raw.githubusercontent.com/public/repo/main/file.txt",
      headers: { Cookie: "a=b" },
    },
    {
      url: "https://raw.githubusercontent.com/public/repo/main/file.txt",
      headers: { Authorization: "Bearer abc" },
    },
    {
      url: "https://raw.githubusercontent.com/svipm/loon/main/file.txt",
      headers: {},
    },
  ];
  for (const request of skippedRequests) {
    assert.deepStrictEqual(runScriptRequest(proxyScript, request), {});
  }

  const readme = read("README.md");
  assertIncludes(readme, "## 推荐方案：GitHubFast.plugin", "README.md");
  assertIncludes(readme, "https://doh.pub/dns-query", "README.md");
  assertIncludes(readme, "每 6 小时和网络切换时测速一次", "README.md");
  assertIncludes(readme, "脚本会跳过常见敏感请求", "README.md");
}

function dnsQuery(name) {
  const labels = name.split(".");
  const length = 12 + labels.reduce((total, label) => total + 1 + Buffer.byteLength(label), 0) + 1 + 4;
  const buffer = Buffer.alloc(length);
  let offset = 0;
  buffer.writeUInt16BE(0x1234, offset);
  offset += 2;
  buffer.writeUInt16BE(0x0100, offset);
  offset += 2;
  buffer.writeUInt16BE(1, offset);
  offset += 2;
  buffer.writeUInt16BE(0, offset);
  offset += 2;
  buffer.writeUInt16BE(0, offset);
  offset += 2;
  buffer.writeUInt16BE(0, offset);
  offset += 2;
  for (const label of labels) {
    buffer[offset++] = Buffer.byteLength(label);
    buffer.write(label, offset);
    offset += Buffer.byteLength(label);
  }
  buffer[offset++] = 0;
  buffer.writeUInt16BE(1, offset);
  offset += 2;
  buffer.writeUInt16BE(1, offset);
  return buffer;
}

function request(url, options = {}, body = null) {
  return new Promise((resolve, reject) => {
    const started = performance.now();
    const req = https.request(
      url,
      {
        method: body ? "POST" : "GET",
        timeout: options.timeout || 15000,
        headers: options.headers || {},
      },
      (res) => {
        const chunks = [];
        res.on("data", (chunk) => chunks.push(chunk));
        res.on("end", () =>
          resolve({
            url,
            status: res.statusCode,
            headers: res.headers,
            body: Buffer.concat(chunks),
            ms: Math.round(performance.now() - started),
          }),
        );
      },
    );
    req.on("timeout", () => req.destroy(new Error("timeout")));
    req.on("error", reject);
    if (body) req.write(body);
    req.end();
  });
}

async function validateNetwork() {
  const doh = await request(
    "https://doh.pub/dns-query",
    {
      headers: {
        "content-type": "application/dns-message",
        accept: "application/dns-message",
      },
      timeout: 10000,
    },
    dnsQuery("github.com"),
  );
  assert.strictEqual(doh.status, 200, `doh.pub HTTP ${doh.status}`);
  assert(
    String(doh.headers["content-type"]).includes("application/dns-message"),
    `doh.pub invalid content-type: ${doh.headers["content-type"]}`,
  );
  assert(doh.body.length > 20, "doh.pub response is too small");
  console.log(`doh.pub github.com ok: ${doh.ms}ms, ${doh.body.length} bytes`);

  const urls = [
    "https://ghproxy.net/https://raw.githubusercontent.com/microsoft/vscode/main/package.json",
    "https://gh-proxy.com/https://raw.githubusercontent.com/microsoft/vscode/main/package.json",
    "https://gh.3w.pm/https://raw.githubusercontent.com/microsoft/vscode/main/package.json",
  ];
  for (const url of urls) {
    const res = await request(url, {
      timeout: 15000,
      headers: { "user-agent": "svipm/loon-validation" },
    });
    const text = res.body.toString("utf8");
    assert(res.status >= 200 && res.status < 400, `${url} HTTP ${res.status}`);
    assert(text.includes('"name": "code-oss-dev"'), `${url} returned unexpected body`);
    console.log(`${new URL(url).host} ok: ${res.ms}ms, ${res.body.length} bytes`);
  }
}

async function main() {
  validateFiles();
  console.log("local validation passed");
  if (runNetworkChecks) {
    await validateNetwork();
    console.log("network validation passed");
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
