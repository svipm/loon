/*
 * 软件名称: o*N （一个）
 * 脚本说明: 解锁所有内容(包含点播付费), 去除广告
 * 下载地址：谷歌搜

[rewrite_local]
# 广告
^https?:\/\/(api|jmtp)(.*-uat)?\.\w+\.com\/v2.5\/(bootstrap|user\/login|user\/avatarFrame|article\/discovery|navigation|ad\/space|my\/userExtraInfo) url script-response-body https://raw.githubusercontent.com/Yu9191/Rewrite/refs/heads/main/One1222.js
# 解锁
^https?:\/\/(api|jmtp)(.*-uat)?\.\w+\.com\/v2.5\/(article\/detail) url script-request-header https://raw.githubusercontent.com/Yu9191/Rewrite/refs/heads/main/One1222.js

[mitm]
hostname = api.53cuk7g.com, api.apubis.com, api.pjq6he.com, api.zbdk8ws.com, api.f38khx.com, api.deyhhc3.com, api.68f4deb.com, api.3459381.com, api.61c76a0.com, api.87735d5.com, api.afe9a49.com, api.c6dd5cc.com, api.2b37894.com, api.35a46dd.com, api.43b8477.com, api.5ce3771.com, api.632d809.com, api.b675211.com, api.a9a2bc4.com, api.8eb269a.com, api.4c86d03.com, api.979bb9e.com, api.988068b.com, api.9cbd862.com, api.c2e777b.com, api.b676039.com, api.ab1e7ee.com, api.5ed249d.com, api.2b1daea.com, api.4934430.com, api.645fb8d.com, api.53cuk7g.com, api.5ebd5d.com, api.em1oifd0.com, api*-uat.*.com, jmtp.*.com, api.k55n2r.com, api.zbdk8ws.com, api.26bb4xt.com, api.vf5x3hv.com, api.fexsqz.com, api.ec53y2t.com, api.j7y675.com, api.pjq6he.com, qqcapi.*.com, www.nj5byj6j.com, api.f38khx.com, api.3459381.com, api.61c76a0.com, api.87735d5.com, api.afe9a49.com, api.c6dd5cc.com, api.2b37894.com, api.35a46dd.com, api.43b8477.com, api.5ce3771.com, api.632d809.com, api.b675211.com, api.a9a2bc4.com, api.8eb269a.com, api.4c86d03.com, api.979bb9e.com, api.988068b.com, api.9cbd862.com, api.c2e777b.com, api.b676039.com, api.ab1e7ee.com, api.5ed249d.com, api.2b1daea.com, api.4934430.com, api.645fb8d.com, api.53cuk7g.com, api.5ebd5d.com, api.em1oifd0.com, api*-uat.*.com, jmtp.*.com, api.k55n2r.com, api.zbdk8ws.com, api.26bb4xt.com, api.vf5x3hv.com

*/
//2025.10.17.08.09
//2025.11.18
//2025.12.22
//2025.12.23
//2025.12.23 21.07
//2026.01.25.20.41
//2026.03.02 

const $ = new Env("one");

/**
 * ============================================================
 *  One1222.js  —  完整反混淆 / 解密还原版
 *  原始混淆: obfuscator.io (字符串数组旋转 + base64 + RC4 双解码器)
 *  还原内容:
 *    1) 所有 a0d/a0e 字符串解密并内联
 *    2) 响应 AES-CBC 加解密逻辑
 *    3) bootstrap / ad / navigation / VIP 等业务改写逻辑
 *    4) 去掉控制流平坦化、死代码、对象属性代理
 * ============================================================
 *
 * 脚本作用 (QuantumultX / Surge / Loon 等 rewrite):
 *  解锁「一个」App 内容 + 去广告
 *
 * 匹配路径 (见文件头 rewrite 规则):
 *  /v2.5/bootstrap | user/login | user/avatarFrame
 *  /v2.5/article/discovery | navigation | ad/space | my/userExtraInfo
 *  request 侧: /article/detail  (注入 token)
 */

// -------------------- 常量 / 配置 --------------------
const AES_KEY = "l*bv%Ziq000Biaog"; // AES_KEY_RES
const AES_IV = "8597506002939249"; // AES_IV_RES
const TOKEN_SOURCES = [
  "https://raw.githubusercontent.com/Yu9191/Rewrite/main/onetoken1222.txt",
];
const UTILS_URL =
  "https://raw.githubusercontent.com/xzxxn777/Surge/main/Utils/Utils.js";
const UTILS_CACHE_KEY = "Utils_Code";

const CONTACT = "📞 有问题请联系作者，频道: https://t.me/Jsforbaby";
const VIP_NICKNAME = "Baby";
const VIP_MOBILE = "86 13898766789";
const VIP_EXPIRY = "2099-09-09";
const VIP_UPDATED_AT = "2025-09-11 22:21:11";
const VIP_DESC = "https://t.me/ios151";
const ACTIVE_LEVEL_NAME = "baby";

// ad/space 中需要清空 ads 的字段
const AD_CLEAR_KEYS = [
  "index-footer-banner",
  "index-banner",
  "bootstrap-full",
  "index-popup_text",
  "index-popup_image",
  "video-paused-banner",
  "video-pre_roll-banner",
  "video-player-float-banner",
];
const AD_ARRAY_KEYS = ["vod-player-float-banner", "ads"];

// navigation 只保留这些 tab
const NAV_KEEP_CODES = ["one", "discovery", "vod", "my"];

// -------------------- AES 工具 (依赖 Utils 里的 CryptoJS) --------------------
function aesDecrypt(cipherText, key, iv, CryptoJS) {
  const bytes = CryptoJS.AES.decrypt(cipherText, key, {
    iv,
    mode: CryptoJS.mode.CBC,
    padding: CryptoJS.pad.Pkcs7,
  });
  return bytes.toString(CryptoJS.enc.Utf8);
}

function aesEncrypt(plainText, key, iv, CryptoJS) {
  const encrypted = CryptoJS.AES.encrypt(plainText, key, {
    iv,
    mode: CryptoJS.mode.CBC,
    padding: CryptoJS.pad.Pkcs7,
  });
  return encrypted.toString();
}

// -------------------- Token 校验 --------------------
/** 粗校验 token 是否像有效字符串 */
function isValidToken(s) {
  if (!s || typeof s !== "string") return false;
  s = s.trim();
  if (!s) return false;
  if (/[一-龥]/.test(s)) return false; // 含中文
  if (s.length < 10 || s.length > 2000) return false;
  return /^[a-zA-Z0-9\-_=+\/.]+$/.test(s);
}

// -------------------- 加载 Utils (提供 creatUtils / CryptoJS) --------------------
async function loadUtils() {
  // 1) 优先读本地缓存
  const cached = ($.getdata && $.getdata(UTILS_CACHE_KEY)) || "";
  if (cached && cached.length) {
    try {
      // eslint-disable-next-line no-eval
      eval(cached);
      return creatUtils();
    } catch (e) {
      console.log(`❌ 缓存Utils执行失败: ${e.message}`);
    }
  }

  // 2) 远程下载
  return new Promise((resolve, reject) => {
    $.getScript(UTILS_URL)
      .then((code) => {
        if (!code || !code.length) {
          console.log("❌ Utils内容为空");
          reject(new Error("Utils content is empty"));
          return;
        }
        try {
          if ($.setdata) $.setdata(code, UTILS_CACHE_KEY);
          // eslint-disable-next-line no-eval
          eval(code);
          resolve(creatUtils());
        } catch (e) {
          console.log(`❌ Utils执行失败: ${e.message}`);
          reject(e);
        }
      })
      .catch((e) => {
        console.log("❌ Utils下载失败: " + (e && e.message ? e.message : e));
        console.log(CONTACT);
        reject(e);
      });
  });
}

// -------------------- 请求侧: /article/detail 注入 token --------------------
/**
 * 当 $request 存在且 URL 含 /article/detail 时,
 * 从 TOKEN_SOURCES 拉取 token, 写入请求 headers 后 $done.
 * 其它请求路径直接 $done() 放行.
 */
function handleRequest() {
  const url = ($request && $request.url) || "";
  if (!/\/article\/detail/.test(url)) {
    return $done();
  }

  try {
    const headers = Object.assign({}, ($request && $request.headers) || {});
    const body = typeof $request.body === "string" ? $request.body : undefined;
    injectTokenAndDone(headers, body);
  } catch (e) {
    console.log("❌ 请求处理异常: " + e.message);
    console.log(CONTACT);
    return $done();
  }
}

function injectTokenAndDone(headers, body) {
  let finished = false;
  let failCount = 0;
  const total = TOKEN_SOURCES.length;

  function finish(token) {
    if (finished) return;
    if (token && isValidToken(token)) {
      finished = true;
      headers.token = token;
      return $done({ headers, body });
    }
    failCount++;
    if (failCount >= total) {
      console.log("❌ Token获取失败，所有源都无法获取有效token");
      console.log(CONTACT);
      finished = true;
      return $done({ headers, body });
    }
  }

  TOKEN_SOURCES.forEach((src) => {
    $.get(
      {
        url: src,
        headers: { "Cache-Control": "no-cache" },
        timeout: 5000,
      },
      (err, _resp, data) => {
        if (err || !data) return finish(null);
        try {
          // 去掉可能的 BOM
          let text =
            data.charCodeAt && data.charCodeAt(0) === 0xfeff
              ? data.slice(1)
              : data;
          let token = "";
          try {
            const json = JSON.parse(text);
            if (json && json.token) token = String(json.token);
          } catch {
            const trimmed = text.trim().replace(/^["']|["']$/g, "");
            if (trimmed) token = trimmed;
          }
          finish(token || null);
        } catch (e) {
          console.log("❌ Token解析失败: " + e.message);
          console.log(CONTACT);
          finish(null);
        }
      }
    );
  });

  // 总超时 8s
  setTimeout(() => {
    if (!finished) {
      finished = true;
      console.log("❌ Token获取超时");
      console.log(CONTACT);
      $done({ headers, body });
    }
  }, 8000);
}

// -------------------- 响应侧改写 --------------------
function clearAdsInSpace(data) {
  let changed = false;

  const clearAdsArray = (obj, key) => {
    if (!obj || !Object.prototype.hasOwnProperty.call(obj, key)) return;
    if (!obj[key] || typeof obj[key] !== "object") obj[key] = {};
    if (!Array.isArray(obj[key].ads)) obj[key].ads = [];
    if (obj[key].ads.length > 0) {
      obj[key].ads = [];
      changed = true;
    }
  };

  const setParams = (key, isMultiple = "1", interval = "3") => {
    if (!data[key] || typeof data[key] !== "object") return;
    const item = data[key];
    if (!item.parameters || typeof item.parameters !== "object") {
      item.parameters = {};
    }
    if (item.parameters.is_multiple != null) {
      item.parameters.is_multiple = String(isMultiple);
    }
    if (item.parameters.interval != null) {
      item.parameters.interval = String(interval);
    }
    changed = true;
  };

  for (const key of AD_CLEAR_KEYS) clearAdsArray(data, key);
  for (const key of AD_ARRAY_KEYS) {
    if (Array.isArray(data[key])) {
      data[key] = [];
      changed = true;
    }
  }

  setParams("index-footer-banner", "1", "3");
  setParams("index-banner", "1", "3");

  return changed;
}

function patchBootstrap(dataRoot) {
  // dataRoot = 已 JSON.parse 后的完整响应对象 (含 code/data)
  try {
    const u = dataRoot.data.user;
    u.nickname = VIP_NICKNAME;
    u.vip_level = 10;
    u.mobile = VIP_MOBILE;
    u.vip_expiry = VIP_EXPIRY;
    u.vip_updated_at = VIP_UPDATED_AT;
    u.desc = VIP_DESC;
    u.vip_status = 1;
    u.next_level = 11;
    u.need_exp = 666;
    u.level_up_day = 666;
    u.active_level = 999;

    dataRoot.data.switches.bootstrap_ads = 0;
    dataRoot.data.switches.popup_ads = 0;
    dataRoot.data.article_ads_gap_interval = "7";
    dataRoot.data.advert_interval = 7;
    dataRoot.data.video_advert_interval = 7;
    dataRoot.data.is_show_webp = 1;
    dataRoot.data.vip.skip_ad = 0;
    dataRoot.data.buy = 0;
    dataRoot.data.vip_coin = "2";
  } catch (e) {
    console.log("❌ bootstrap处理异常: " + e.message);
  }
}

/** 递归把对象里所有 buy 字段改成 1 (解锁点播/付费) */
function unlockBuyFields(node) {
  if (!node || typeof node !== "object") return;
  for (const key of Object.keys(node)) {
    if (node[key] && typeof node[key] === "object") {
      unlockBuyFields(node[key]);
    } else if (key === "buy") {
      node[key] = 1;
    }
  }
}

function filterNavigation(list) {
  // list: data 数组, 每项有 code
  const map = {};
  for (const item of list) {
    if (item && item.code) map[item.code] = item;
  }
  return NAV_KEEP_CODES.map((c) => map[c]).filter(Boolean);
}

function getPathname(url) {
  try {
    return new URL(url).pathname;
  } catch {
    const m = url.match(/^https?:\/\/[^/]+(\/[^?#]*)/i);
    return m ? m[1] : "";
  }
}

async function handleResponse() {
  const passthrough = () =>
    $.done({ body: ($response && $response.body) || "" });

  const url = ($request && $request.url) || "";

  // article/detail 的 response 直接放行 (token 在 request 侧处理)
  if (/\/article\/detail/.test(url)) {
    return $.done();
  }

  try {
    const utils = await loadUtils().catch(() => null);
    if (!utils) {
      console.log("❌ Utils加载失败");
      return passthrough();
    }

    const CryptoJS = utils.createCryptoJS();
    const key = CryptoJS.enc.Utf8.parse(AES_KEY);
    const iv = CryptoJS.enc.Utf8.parse(AES_IV);

    const rawBody = ($response && $response.body) || "";
    let plain;
    try {
      plain = aesDecrypt(rawBody, key, iv, CryptoJS);
    } catch (e) {
      console.log("❌ 解密失败: " + e.message);
      return passthrough();
    }

    let json;
    try {
      json = JSON.parse(plain || "{}");
    } catch (e) {
      console.log(`❌ JSON解析失败: ${e.message}`);
      return passthrough();
    }

    // ---- /ad/space ----
    if (/\/ad\/space/.test(url)) {
      try {
        const data =
          json && json.data && typeof json.data === "object"
            ? json.data
            : null;
        if (!data) return passthrough();
        const changed = clearAdsInSpace(data);
        if (!changed) return passthrough();
        const out = aesEncrypt(JSON.stringify(json), key, iv, CryptoJS);
        return $.done({ body: out });
      } catch (e) {
        console.log(`❌ ad/space处理异常: ${e.message}`);
        return passthrough();
      }
    }

    // ---- /v2.5/navigation ----
    const pathname = getPathname(url);
    if (/^\/v2\.5\/navigation$/i.test(pathname)) {
      const list = Array.isArray(json && json.data) ? json.data : null;
      if (!list) return passthrough();
      const filtered = filterNavigation(list);
      if (!filtered.length) return passthrough();
      const rebuilt = {
        code: 200,
        message: "请求成功",
        data: filtered,
      };
      const out = aesEncrypt(JSON.stringify(rebuilt), key, iv, CryptoJS);
      return $.done({ body: out });
    }

    // ---- 其它接口要求 code === 200 ----
    const code = json.code || 0;
    if (code !== 200) return passthrough();

    // ---- /bootstrap (login 等同源字段改写也命中此分支时同逻辑) ----
    if (/\/bootstrap/.test(url)) {
      patchBootstrap(json);
    }

    // ---- /vip/download ----
    if (/\/vip\/download/.test(url)) {
      json.data = {
        limit: 999,
        use: 0,
        last: 999,
        articles: [],
      };
    }

    // ---- /article/discovery : 递归 buy=1 ----
    if (/\/article\/discovery/.test(url)) {
      unlockBuyFields(json);
    }

    // ---- /my/userExtraInfo ----
    if (/\/my\/userExtraInfo/.test(url)) {
      json.data = {
        active_level: {
          level: 999,
          name: ACTIVE_LEVEL_NAME,
          exp_value: 37966,
          user_exp: 99990,
        },
      };
    }

    // 重新加密写回
    const out = aesEncrypt(JSON.stringify(json), key, iv, CryptoJS);
    return $.done({ body: out });
  } catch (e) {
    console.log(`❌ 响应处理异常: ${e.message}`);
    return $.done({ body: ($response && $response.body) || "" });
  }
}

// -------------------- 入口 --------------------
(async () => {
  // 只有 $request 没有 $response → request 分支
  // 有 $response → response 分支
  // 否则直接 done
  if (typeof $request !== "undefined" && typeof $response === "undefined") {
    return handleRequest();
  }
  if (typeof $response !== "undefined") {
    return handleResponse();
  }
  $.done();
})();

// -------------------- 下方保留原 Env 兼容层 (QuantumultX/Surge/Loon/Node) --------------------

function Env(t,e){class s{constructor(t){this.env=t}send(t,e="GET"){t="string"==typeof t?{url:t}:t;let s=this.get;return"POST"===e&&(s=this.post),new Promise((e,a)=>{s.call(this,t,(t,s,r)=>{t?a(t):e(s)})})}get(t){return this.send.call(this.env,t)}post(t){return this.send.call(this.env,t,"POST")}}return new class{constructor(t,e){this.name=t,this.http=new s(this),this.data=null,this.dataFile="box.dat",this.logs=[],this.isMute=!1,this.isNeedRewrite=!1,this.logSeparator="\n",this.encoding="utf-8",this.startTime=(new Date).getTime(),Object.assign(this,e),this.log("",`🔔${this.name}, 开始!`)}getEnv(){return"undefined"!=typeof $environment&&$environment["surge-version"]?"Surge":"undefined"!=typeof $environment&&$environment["stash-version"]?"Stash":"undefined"!=typeof module&&module.exports?"Node.js":"undefined"!=typeof $task?"Quantumult X":"undefined"!=typeof $loon?"Loon":"undefined"!=typeof $rocket?"Shadowrocket":void 0}isNode(){return"Node.js"===this.getEnv()}isQuanX(){return"Quantumult X"===this.getEnv()}isSurge(){return"Surge"===this.getEnv()}isLoon(){return"Loon"===this.getEnv()}isShadowrocket(){return"Shadowrocket"===this.getEnv()}isStash(){return"Stash"===this.getEnv()}toObj(t,e=null){try{return JSON.parse(t)}catch{return e}}toStr(t,e=null){try{return JSON.stringify(t)}catch{return e}}getjson(t,e){let s=e;const a=this.getdata(t);if(a)try{s=JSON.parse(this.getdata(t))}catch{}return s}setjson(t,e){try{return this.setdata(JSON.stringify(t),e)}catch{return!1}}getScript(t){return new Promise(e=>{this.get({url:t},(t,s,a)=>e(a))})}runScript(t,e){return new Promise(s=>{let a=this.getdata("@chavy_boxjs_userCfgs.httpapi");a=a?a.replace(/\n/g,"").trim():a;let r=this.getdata("@chavy_boxjs_userCfgs.httpapi_timeout");r=r?1*r:20,r=e&&e.timeout?e.timeout:r;const[i,o]=a.split("@"),n={url:`http://${o}/v1/scripting/evaluate`,body:{script_text:t,mock_type:"cron",timeout:r},headers:{"X-Key":i,Accept:"*/*"},timeout:r};this.post(n,(t,e,a)=>s(a))}).catch(t=>this.logErr(t))}loaddata(){if(!this.isNode())return{};{this.fs=this.fs?this.fs:require("fs"),this.path=this.path?this.path:require("path");const t=this.path.resolve(this.dataFile),e=this.path.resolve(process.cwd(),this.dataFile),s=this.fs.existsSync(t),a=!s&&this.fs.existsSync(e);if(!s&&!a)return{};{const a=s?t:e;try{return JSON.parse(this.fs.readFileSync(a))}catch(t){return{}}}}}writedata(){if(this.isNode()){this.fs=this.fs?this.fs:require("fs"),this.path=this.path?this.path:require("path");const t=this.path.resolve(this.dataFile),e=this.path.resolve(process.cwd(),this.dataFile),s=this.fs.existsSync(t),a=!s&&this.fs.existsSync(e),r=JSON.stringify(this.data);s?this.fs.writeFileSync(t,r):a?this.fs.writeFileSync(e,r):this.fs.writeFileSync(t,r)}}lodash_get(t,e,s){const a=e.replace(/\[(\d+)\]/g,".$1").split(".");let r=t;for(const t of a)if(r=Object(r)[t],void 0===r)return s;return r}lodash_set(t,e,s){return Object(t)!==t?t:(Array.isArray(e)||(e=e.toString().match(/[^.[\]]+/g)||[]),e.slice(0,-1).reduce((t,s,a)=>Object(t[s])===t[s]?t[s]:t[s]=Math.abs(e[a+1])>>0==+e[a+1]?[]:{},t)[e[e.length-1]]=s,t)}getdata(t){let e=this.getval(t);if(/^@/.test(t)){const[,s,a]=/^@(.*?)\.(.*?)$/.exec(t),r=s?this.getval(s):"";if(r)try{const t=JSON.parse(r);e=t?this.lodash_get(t,a,""):e}catch(t){e=""}}return e}setdata(t,e){let s=!1;if(/^@/.test(e)){const[,a,r]=/^@(.*?)\.(.*?)$/.exec(e),i=this.getval(a),o=a?"null"===i?null:i||"{}":"{}";try{const e=JSON.parse(o);this.lodash_set(e,r,t),s=this.setval(JSON.stringify(e),a)}catch(e){const i={};this.lodash_set(i,r,t),s=this.setval(JSON.stringify(i),a)}}else s=this.setval(t,e);return s}getval(t){switch(this.getEnv()){case"Surge":case"Loon":case"Stash":case"Shadowrocket":return $persistentStore.read(t);case"Quantumult X":return $prefs.valueForKey(t);case"Node.js":return this.data=this.loaddata(),this.data[t];default:return this.data&&this.data[t]||null}}setval(t,e){switch(this.getEnv()){case"Surge":case"Loon":case"Stash":case"Shadowrocket":return $persistentStore.write(t,e);case"Quantumult X":return $prefs.setValueForKey(t,e);case"Node.js":return this.data=this.loaddata(),this.data[e]=t,this.writedata(),!0;default:return this.data&&this.data[e]||null}}initGotEnv(t){this.got=this.got?this.got:require("got"),this.cktough=this.cktough?this.cktough:require("tough-cookie"),this.ckjar=this.ckjar?this.ckjar:new this.cktough.CookieJar,t&&(t.headers=t.headers?t.headers:{},void 0===t.headers.Cookie&&void 0===t.cookieJar&&(t.cookieJar=this.ckjar))}get(t,e=(()=>{})){switch(t.headers&&(delete t.headers["Content-Type"],delete t.headers["Content-Length"],delete t.headers["content-type"],delete t.headers["content-length"]),t.params&&(t.url+="?"+this.queryStr(t.params)),this.getEnv()){case"Surge":case"Loon":case"Stash":case"Shadowrocket":default:this.isSurge()&&this.isNeedRewrite&&(t.headers=t.headers||{},Object.assign(t.headers,{"X-Surge-Skip-Scripting":!1})),$httpClient.get(t,(t,s,a)=>{!t&&s&&(s.body=a,s.statusCode=s.status?s.status:s.statusCode,s.status=s.statusCode),e(t,s,a)});break;case"Quantumult X":this.isNeedRewrite&&(t.opts=t.opts||{},Object.assign(t.opts,{hints:!1})),$task.fetch(t).then(t=>{const{statusCode:s,statusCode:a,headers:r,body:i,bodyBytes:o}=t;e(null,{status:s,statusCode:a,headers:r,body:i,bodyBytes:o},i,o)},t=>e(t&&t.error||"UndefinedError"));break;case"Node.js":let s=require("iconv-lite");this.initGotEnv(t),this.got(t).on("redirect",(t,e)=>{try{if(t.headers["set-cookie"]){const s=t.headers["set-cookie"].map(this.cktough.Cookie.parse).toString();s&&this.ckjar.setCookieSync(s,null),e.cookieJar=this.ckjar}}catch(t){this.logErr(t)}}).then(t=>{const{statusCode:a,statusCode:r,headers:i,rawBody:o}=t,n=s.decode(o,this.encoding);e(null,{status:a,statusCode:r,headers:i,rawBody:o,body:n},n)},t=>{const{message:a,response:r}=t;e(a,r,r&&s.decode(r.rawBody,this.encoding))})}}post(t,e=(()=>{})){const s=t.method?t.method.toLocaleLowerCase():"post";switch(t.body&&t.headers&&!t.headers["Content-Type"]&&!t.headers["content-type"]&&(t.headers["content-type"]="application/x-www-form-urlencoded"),t.headers&&(delete t.headers["Content-Length"],delete t.headers["content-length"]),this.getEnv()){case"Surge":case"Loon":case"Stash":case"Shadowrocket":default:this.isSurge()&&this.isNeedRewrite&&(t.headers=t.headers||{},Object.assign(t.headers,{"X-Surge-Skip-Scripting":!1})),$httpClient[s](t,(t,s,a)=>{!t&&s&&(s.body=a,s.statusCode=s.status?s.status:s.statusCode,s.status=s.statusCode),e(t,s,a)});break;case"Quantumult X":t.method=s,this.isNeedRewrite&&(t.opts=t.opts||{},Object.assign(t.opts,{hints:!1})),$task.fetch(t).then(t=>{const{statusCode:s,statusCode:a,headers:r,body:i,bodyBytes:o}=t;e(null,{status:s,statusCode:a,headers:r,body:i,bodyBytes:o},i,o)},t=>e(t&&t.error||"UndefinedError"));break;case"Node.js":let a=require("iconv-lite");this.initGotEnv(t);const{url:r,...i}=t;this.got[s](r,i).then(t=>{const{statusCode:s,statusCode:r,headers:i,rawBody:o}=t,n=a.decode(o,this.encoding);e(null,{status:s,statusCode:r,headers:i,rawBody:o,body:n},n)},t=>{const{message:s,response:r}=t;e(s,r,r&&a.decode(r.rawBody,this.encoding))})}}time(t,e=null){const s=e?new Date(e):new Date;let a={"M+":s.getMonth()+1,"d+":s.getDate(),"H+":s.getHours(),"m+":s.getMinutes(),"s+":s.getSeconds(),"q+":Math.floor((s.getMonth()+3)/3),S:s.getMilliseconds()};/(y+)/.test(t)&&(t=t.replace(RegExp.$1,(s.getFullYear()+"").substr(4-RegExp.$1.length)));for(let e in a)new RegExp("("+e+")").test(t)&&(t=t.replace(RegExp.$1,1==RegExp.$1.length?a[e]:("00"+a[e]).substr((""+a[e]).length)));return t}queryStr(t){let e="";for(const s in t){let a=t[s];null!=a&&""!==a&&("object"==typeof a&&(a=JSON.stringify(a)),e+=`${s}=${a}&`)}return e=e.substring(0,e.length-1),e}msg(e=t,s="",a="",r){const i=t=>{switch(typeof t){case void 0:return t;case"string":switch(this.getEnv()){case"Surge":case"Stash":default:return{url:t};case"Loon":case"Shadowrocket":return t;case"Quantumult X":return{"open-url":t};case"Node.js":return}case"object":switch(this.getEnv()){case"Surge":case"Stash":case"Shadowrocket":default:{let e=t.url||t.openUrl||t["open-url"];return{url:e}}case"Loon":{let e=t.openUrl||t.url||t["open-url"],s=t.mediaUrl||t["media-url"];return{openUrl:e,mediaUrl:s}}case"Quantumult X":{let e=t["open-url"]||t.url||t.openUrl,s=t["media-url"]||t.mediaUrl,a=t["update-pasteboard"]||t.updatePasteboard;return{"open-url":e,"media-url":s,"update-pasteboard":a}}case"Node.js":return}default:return}};if(!this.isMute)switch(this.getEnv()){case"Surge":case"Loon":case"Stash":case"Shadowrocket":default:$notification.post(e,s,a,i(r));break;case"Quantumult X":$notify(e,s,a,i(r));break;case"Node.js":}if(!this.isMuteLog){let t=["","==============📣系统通知📣=============="];t.push(e),s&&t.push(s),a&&t.push(a),console.log(t.join("\n")),this.logs=this.logs.concat(t)}}log(...t){t.length>0&&(this.logs=[...this.logs,...t]),console.log(t.join(this.logSeparator))}logErr(t,e){switch(this.getEnv()){case"Surge":case"Loon":case"Stash":case"Shadowrocket":case"Quantumult X":default:this.log("",`❗️${this.name}, 错误!`,t);break;case"Node.js":this.log("",`❗️${this.name}, 错误!`,t.stack)}}wait(t){return new Promise(e=>setTimeout(e,t))}done(t={}){const e=(new Date).getTime(),s=(e-this.startTime)/1e3;switch(this.log("",`🔔${this.name}, 结束! 🕛 ${s} 秒`),this.log(),this.getEnv()){case"Surge":case"Loon":case"Stash":case"Shadowrocket":case"Quantumult X":default:$done(t);break;case"Node.js":process.exit(1)}}}(t,e)}
