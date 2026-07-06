const STORE_KEY = "github_proxy_auto_base";
const OPTION_KEY = "代理模式";
const PROXY_BY_NAME = {
  "gh-proxy.com": "https://gh-proxy.com/",
  "ghproxy.net": "https://ghproxy.net/",
  "gh.3w.pm": "https://gh.3w.pm/",
  "ghproxy.vip": "https://ghproxy.vip/",
};
const PROXIES = Object.values(PROXY_BY_NAME);
const DEFAULT_PROXY = PROXY_BY_NAME["gh-proxy.com"];
const TEST_URL = "https://raw.githubusercontent.com/microsoft/vscode/main/package.json";
const OWNER_EXCLUDE = "svipm";

function isRequest() {
  return typeof $request !== "undefined" && $request && $request.url;
}

function readAutoProxy() {
  const saved = $persistentStore.read(STORE_KEY);
  return PROXIES.includes(saved) ? saved : DEFAULT_PROXY;
}

function readSelectedProxy() {
  const selected = ($persistentStore.read(OPTION_KEY) || "").trim();
  if (selected && selected !== "Auto" && PROXY_BY_NAME[selected]) {
    return PROXY_BY_NAME[selected];
  }
  return readAutoProxy();
}

function isOwnPath(path) {
  return path === `/${OWNER_EXCLUDE}` || path.startsWith(`/${OWNER_EXCLUDE}/`);
}

function shouldProxy(url) {
  const match = url.match(/^https?:\/\/([^/]+)(\/.*)?$/i);
  if (!match) return null;

  const host = match[1].toLowerCase();
  const path = match[2] || "/";

  if (host === "raw.githubusercontent.com") {
    return isOwnPath(path) ? null : readSelectedProxy();
  }

  if (host === "codeload.github.com") {
    return isOwnPath(path) ? null : readSelectedProxy();
  }

  if (host === "gist.githubusercontent.com") {
    return isOwnPath(path) ? null : readSelectedProxy();
  }

  if (host === "github.com") {
    if (isOwnPath(path)) return null;
    if (/^\/[^/]+\/[^/]+\/releases\/download\//.test(path)) return readSelectedProxy();
    if (/^\/[^/]+\/[^/]+\/archive\/refs\//.test(path)) return readSelectedProxy();
  }

  return null;
}

function benchmark() {
  let pending = PROXIES.length;
  const results = [];

  function finish(base, elapsed, ok) {
    results.push({ base, elapsed: ok ? elapsed : Number.MAX_SAFE_INTEGER });
    pending -= 1;

    if (pending > 0) return;

    results.sort((a, b) => a.elapsed - b.elapsed);
    const best = results[0] && results[0].elapsed !== Number.MAX_SAFE_INTEGER
      ? results[0].base
      : DEFAULT_PROXY;
    $persistentStore.write(best, STORE_KEY);
    if (typeof $notification !== "undefined") {
      $notification.post("GitHub Proxy Auto Select", "", `Selected ${best}`);
    }
    $done();
  }

  for (const base of PROXIES) {
    const started = Date.now();
    $httpClient.get(
      {
        url: base + TEST_URL,
        timeout: 8000,
        headers: { "user-agent": "Loon GitHub proxy benchmark" },
      },
      (error, response, data) => {
        const status = Number(response && (response.status || response.statusCode));
        const ok = !error &&
          status >= 200 &&
          status < 400 &&
          data &&
          data.length > 1024 &&
          data.indexOf('"name": "code-oss-dev"') !== -1;
        finish(base, Date.now() - started, ok);
      }
    );
  }
}

if (isRequest()) {
  const base = shouldProxy($request.url);
  if (!base) {
    $done({});
  } else {
    $done({ url: base + $request.url });
  }
} else {
  benchmark();
}
