/*
 * 软件名称: o*N （一个）
 * 脚本说明: 解锁内容 + 全量去广告（开屏/弹窗/视频贴片/底部 banner）
 * 版本: 2026.07.19 fix（基于抓包 102 + 106（我的页弹窗））
 *
 * 修复点:
 *  1. 兼容 0325api.* / api.* / jmtp.* / qqcapi.* 动态域名
 *  2. /v2.5/ad/space 清空全部广告位（含 index-footer-banner 等）
 *  3. bootstrap 关闭 bootstrap_ads / popup_ads，并伪造 VIP
 *  4. 兼容 popup / vip 弹窗 / panda 弹窗等接口
 *  5. 配合 Loon .plugin / QX rewrite 屏蔽 commercial 与 /encry/ad
 *
 * Quantumult X / Surge 规则见文件头注释；Loon 请直接装 One.plugin
 */

//2026.07.19 fix3b - gh-proxy 优先 + token 源日志

const $ = new Env("one");

const AES_KEY = "l*bv%Ziq000Biaog";
const AES_IV = "8597506002939249";
// 原作者视频「解锁」不是解 m3u8，而是给 /article/detail 注入共享 VIP JWT。
// 手机侧优先走 gh-proxy.com（直连 raw 在部分网络反而慢/失败）。
const TOKEN_SOURCES = [
  "https://gh-proxy.com/https://raw.githubusercontent.com/Yu9191/Rewrite/main/onetoken1222.txt",
  "https://ghproxy.net/https://raw.githubusercontent.com/Yu9191/Rewrite/main/onetoken1222.txt",
  "https://raw.githubusercontent.com/Yu9191/Rewrite/main/onetoken1222.txt",
];
const UTILS_URLS = [
  "https://gh-proxy.com/https://raw.githubusercontent.com/xzxxn777/Surge/main/Utils/Utils.js",
  "https://ghproxy.net/https://raw.githubusercontent.com/xzxxn777/Surge/main/Utils/Utils.js",
  "https://raw.githubusercontent.com/xzxxn777/Surge/main/Utils/Utils.js",
];
const UTILS_CACHE_KEY = "Utils_Code";
const TOKEN_CACHE_KEY = "one_vip_token_cache";
const CONTACT = "📞 有问题请联系作者，频道: https://t.me/Jsforbaby";

function sourceLabel(url) {
  try {
    var u = String(url || "");
    if (u.indexOf("gh-proxy.com") >= 0) return "gh-proxy.com";
    if (u.indexOf("ghproxy.net") >= 0) return "ghproxy.net";
    if (u.indexOf("raw.githubusercontent.com") >= 0) return "raw.githubusercontent.com";
    return u.slice(0, 48);
  } catch (_) {
    return "unknown";
  }
}

// 抓包确认的全部广告位
const AD_SLOT_KEYS = [
  "bootstrap-full", // 开屏
  "index-popup_image", // 首页弹窗图
  "index-popup_text", // 首页弹窗文
  "index-banner",
  "index-footer-banner", // 底部轮播
  "video-pre_roll-banner", // 视频前贴
  "video-paused-banner", // 视频暂停
  "video-player-float-banner",
  "vod-player-float-banner",
  // 抓包 106：我的页/列表新增
  "video-list-banner",
  "demand_image",
  "serialize-list-image",
  "manga-list-image",
];

const NAV_KEEP_CODES = ["one", "discovery", "vod", "my"];

const VIP = {
  nickname: "白嫖哥",
  mobile: "86 13898766789",
  vip_expiry: "2099-09-09",
  vip_updated_at: "2025-09-11 22:21:11",
  desc: "https://t.me/ios151",
  active_level_name: "baby",
};

function aesDecrypt(cipherText, key, iv, CryptoJS) {
  return CryptoJS.AES.decrypt(cipherText, key, {
    iv: iv,
    mode: CryptoJS.mode.CBC,
    padding: CryptoJS.pad.Pkcs7,
  }).toString(CryptoJS.enc.Utf8);
}

function aesEncrypt(plainText, key, iv, CryptoJS) {
  return CryptoJS.AES.encrypt(plainText, key, {
    iv: iv,
    mode: CryptoJS.mode.CBC,
    padding: CryptoJS.pad.Pkcs7,
  }).toString();
}

function loadUtils() {
  return new Promise(function (resolve, reject) {
    var cached = ($.getdata && $.getdata(UTILS_CACHE_KEY)) || "";
    if (cached && cached.length) {
      try {
        eval(cached);
        if (typeof creatUtils === "function") {
          resolve(creatUtils());
          return;
        }
      } catch (e) {
        console.log("❌ 缓存Utils执行失败: " + e.message);
      }
    }

    if (typeof CryptoJS !== "undefined") {
      resolve({
        createCryptoJS: function () {
          return CryptoJS;
        },
      });
      return;
    }

    if (typeof $.getScript !== "function") {
      reject(new Error("当前环境不支持 getScript，无法加载 CryptoJS"));
      return;
    }

    var idx = 0;
    function tryNext() {
      if (idx >= UTILS_URLS.length) {
        console.log("❌ Utils全部源失败");
        console.log(CONTACT);
        reject(new Error("Utils下载失败"));
        return;
      }
      var url = UTILS_URLS[idx++];
      var label = sourceLabel(url);
      console.log("⏳ Utils拉取: " + label);
      $.getScript(url)
        .then(function (code) {
          if (!code || !code.length) {
            console.log("❌ Utils空响应: " + label);
            return tryNext();
          }
          try {
            if ($.setdata) $.setdata(code, UTILS_CACHE_KEY);
            eval(code);
            if (typeof creatUtils === "function") {
              console.log("✅ Utils就绪: " + label);
              resolve(creatUtils());
            } else {
              console.log("❌ Utils无 creatUtils: " + label);
              tryNext();
            }
          } catch (e) {
            console.log("❌ Utils执行失败: " + label + " / " + e.message);
            tryNext();
          }
        })
        .catch(function (e) {
          console.log(
            "❌ Utils下载失败: " + label + " / " + ((e && e.message) || e)
          );
          tryNext();
        });
    }
    tryNext();
  });
}

function isValidToken(s) {
  if (!s || typeof s !== "string") return false;
  s = s.trim();
  if (!s) return false;
  if (/[一-龥]/.test(s)) return false;
  if (s.length < 10 || s.length > 2000) return false;
  return /^[a-zA-Z0-9\-_=+\/.]+$/.test(s);
}

function decodeJwtPayload(token) {
  try {
    var parts = String(token || "").split(".");
    if (parts.length < 2) return null;
    var b64 = parts[1].replace(/-/g, "+").replace(/_/g, "/");
    while (b64.length % 4) b64 += "=";
    var json;
    if (typeof atob === "function") {
      json = decodeURIComponent(
        Array.prototype.map
          .call(atob(b64), function (c) {
            return "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2);
          })
          .join("")
      );
    } else if (typeof Buffer !== "undefined") {
      json = Buffer.from(b64, "base64").toString("utf8");
    } else {
      return null;
    }
    return JSON.parse(json);
  } catch (_) {
    return null;
  }
}

function requestHost(url) {
  try {
    return new URL(url).hostname;
  } catch (_) {
    var m = String(url || "").match(/^https?:\/\/([^\/]+)/i);
    return m ? m[1] : "";
  }
}

function applyTokenHeaders(headers, token, url) {
  // 原作者只覆盖单个小写 token。不要写 Token/Authorization（会双 token / 多鉴权头）。
  var keys = Object.keys(headers || {});
  for (var i = 0; i < keys.length; i++) {
    var lk = String(keys[i]).toLowerCase();
    if (lk === "token" || lk === "authorization") delete headers[keys[i]];
  }
  headers.token = token;

  var payload = decodeJwtPayload(token);
  var host = requestHost(url || "");
  if (payload) {
    console.log(
      "🧾 token claims iss=" +
        payload.iss +
        " sub=" +
        payload.sub +
        " exp=" +
        payload.exp +
        " uuid=" +
        (payload.uuid || "")
    );
    if (
      payload.sub &&
      host &&
      String(payload.sub).toLowerCase() !== String(host).toLowerCase()
    ) {
      console.log(
        "⚠️ token.sub 与 API 域名不一致: sub=" +
          payload.sub +
          " host=" +
          host +
          " → 很容易仍是试看"
      );
    }
  }
  console.log(
    "⚠️ 原请求 sign/uuid/user-key 未改；sign=" +
      (headers.sign || headers.Sign || "")
  );
  return headers;
}

function parseTokenPayload(data) {
  if (!data) return null;
  var text =
    data.charCodeAt && data.charCodeAt(0) === 0xfeff ? data.slice(1) : data;
  try {
    var json = JSON.parse(text);
    if (json && json.token) return String(json.token);
  } catch (_) {}
  var trimmed = String(text).trim().replace(/^["']|["']$/g, "");
  return trimmed || null;
}

function injectTokenAndDone(headers, body) {
  var finished = false;
  var failCount = 0;
  var total = TOKEN_SOURCES.length;
  var reqUrl = ($request && $request.url) || "";
  var cached = ($.getdata && $.getdata(TOKEN_CACHE_KEY)) || "";
  if (cached && isValidToken(cached)) {
    console.log(
      "✅ one token cache hit len=" + cached.length + " head=" + cached.slice(0, 16)
    );
    return $done({
      headers: applyTokenHeaders(headers, cached, reqUrl),
      body: body,
    });
  }

  console.log("⏳ one token 开始拉取, 源数=" + total + ", 优先=" + sourceLabel(TOKEN_SOURCES[0]));

  function finish(token, label, reason) {
    if (finished) return;
    if (token && isValidToken(token)) {
      finished = true;
      if ($.setdata) $.setdata(token, TOKEN_CACHE_KEY);
      console.log(
        "✅ one token injected via " +
          label +
          " len=" +
          token.length +
          " head=" +
          token.slice(0, 16)
      );
      return $done({
        headers: applyTokenHeaders(headers, token, reqUrl),
        body: body,
      });
    }
    failCount++;
    console.log(
      "❌ Token源失败[" +
        failCount +
        "/" +
        total +
        "]: " +
        label +
        (reason ? " / " + reason : "")
    );
    if (failCount >= total) {
      console.log("❌ Token获取失败，所有源都无法获取有效token → 只会试看");
      console.log(CONTACT);
      finished = true;
      return $done({ headers: headers, body: body });
    }
  }

  TOKEN_SOURCES.forEach(function (src) {
    var label = sourceLabel(src);
    console.log("⏳ Token拉取: " + label);
    $.get(
      {
        url: src,
        headers: { "Cache-Control": "no-cache" },
        timeout: 8000,
      },
      function (err, _resp, data) {
        if (err) return finish(null, label, "err=" + ((err && err.message) || err));
        if (!data) return finish(null, label, "empty body");
        try {
          var token = parseTokenPayload(data);
          if (!token) return finish(null, label, "parse empty");
          if (!isValidToken(token)) return finish(null, label, "invalid token");
          finish(token, label);
        } catch (e) {
          finish(null, label, "parse err=" + e.message);
        }
      }
    );
  });

  setTimeout(function () {
    if (!finished) {
      finished = true;
      console.log("❌ Token获取超时(10s) → 只会试看");
      console.log(CONTACT);
      $done({ headers: headers, body: body });
    }
  }, 10000);
}

function handleRequest() {
  var url = ($request && $request.url) || "";
  if (!/\/article\/detail/i.test(url)) return $done();
  try {
    var headers = Object.assign({}, ($request && $request.headers) || {});
    var body =
      typeof $request.body === "string" ? $request.body : undefined;
    injectTokenAndDone(headers, body);
  } catch (e) {
    console.log("❌ 请求处理异常: " + e.message);
    console.log(CONTACT);
    $done();
  }
}

function neuterAdSlot(slot) {
  if (!slot || typeof slot !== "object" || Array.isArray(slot)) return false;
  var changed = false;
  if (Array.isArray(slot.ads) && slot.ads.length) {
    slot.ads = [];
    changed = true;
  }
  if (Array.isArray(slot.list) && slot.list.length) {
    slot.list = [];
    changed = true;
  }
  if (!slot.parameters || typeof slot.parameters !== "object") {
    slot.parameters = slot.parameters || {};
  }
  if (slot.parameters.is_multiple != null) {
    slot.parameters.is_multiple = "0";
    changed = true;
  }
  if (slot.parameters.interval != null) {
    slot.parameters.interval = "99999";
    changed = true;
  }
  return changed;
}

/** /v2.5/ad/space 全量清广告（含未知广告位） */
function clearAdSpace(data) {
  if (!data || typeof data !== "object") return false;
  var changed = false;
  var i, key, val, hasAds, nameHit;

  for (i = 0; i < AD_SLOT_KEYS.length; i++) {
    key = AD_SLOT_KEYS[i];
    if (!Object.prototype.hasOwnProperty.call(data, key)) continue;
    if (Array.isArray(data[key])) {
      if (data[key].length) {
        data[key] = [];
        changed = true;
      }
    } else if (neuterAdSlot(data[key])) {
      changed = true;
    }
  }

  var keys = Object.keys(data);
  for (i = 0; i < keys.length; i++) {
    key = keys[i];
    val = data[key];
    if (!val) continue;
    if (Array.isArray(val)) {
      if (/ad|banner|popup|splash|commercial|image|list|manga|serialize|demand|video/i.test(key) && val.length) {
        data[key] = [];
        changed = true;
      }
      continue;
    }
    if (typeof val === "object") {
      hasAds = Array.isArray(val.ads) || Array.isArray(val.list);
      nameHit = /ad|banner|popup|splash|commercial|boot|footer|float|roll|image|list|manga|serialize|demand|video/i.test(
        key
      );
      if ((hasAds || nameHit) && neuterAdSlot(val)) changed = true;
    }
  }

  if (Array.isArray(data.ads) && data.ads.length) {
    data.ads = [];
    changed = true;
  }
  return changed;
}


/** 递归关闭对象里各类弹窗/引导开关字段 */
function killPopupSwitches(node) {
  if (!node || typeof node !== "object") return;
  if (Array.isArray(node)) {
    for (var i = 0; i < node.length; i++) killPopupSwitches(node[i]);
    return;
  }
  var keys = Object.keys(node);
  for (var j = 0; j < keys.length; j++) {
    var k = keys[j];
    var v = node[k];
    var kl = String(k).toLowerCase();
    if (
      /popup_switch|guide_switch|bubble_switch|entrance_switch|is_popup|show_popup|ad_switch|ads_switch/.test(
        kl
      )
    ) {
      if (typeof v === "number" || typeof v === "string") node[k] = 0;
    }
    if (/popup_image|guide_image|bubble_image/i.test(k) && typeof v === "string") {
      node[k] = "";
    }
    if (typeof v === "object" && v) killPopupSwitches(v);
  }
}

function patchBootstrap(json) {
  if (!json || !json.data) return;
  var d = json.data;

  if (!d.user || typeof d.user !== "object") d.user = {};
  d.user.nickname = VIP.nickname;
  d.user.vip_level = 10;
  d.user.mobile = VIP.mobile;
  d.user.vip_expiry = VIP.vip_expiry;
  d.user.vip_updated_at = VIP.vip_updated_at;
  d.user.desc = VIP.desc;
  d.user.vip_status = 1;
  d.user.next_level = 11;
  d.user.need_exp = 666;
  d.user.level_up_day = 666;
  d.user.active_level = 999;
  d.user.permanent_vip = 1;

  if (!d.switches || typeof d.switches !== "object") d.switches = {};
  d.switches.bootstrap_ads = 0;
  d.switches.popup_ads = 0;
  d.switches.pwa_download_guide_switch = 0;

  if (!d.vip || typeof d.vip !== "object") d.vip = {};
  d.vip.skip_ad = 1;

  d.article_ads_gap_interval = "99999";
  d.advert_interval = 99999;
  d.video_advert_interval = 99999;
  d.actor_interval = 99999;
  d.image_text_interval = 99999;
  d.is_show_webp = 1;
  d.buy = 0;
  d.vip_coin = "2";

  if (d.expire_prompt && typeof d.expire_prompt === "object") {
    d.expire_prompt.switch_40 = 0;
    d.expire_prompt.switch_60 = 0;
  }
  if (d.upgrade && typeof d.upgrade === "object") {
    d.upgrade.is_popup = 0;
  }
  if (d.vip_gift && typeof d.vip_gift === "object") {
    try {
      d.vip_gift.enable = 0;
      d.vip_gift.is_popup = 0;
      d.vip_gift.vip_gift_replys = [];
    } catch (_) {}
  }

  // 点「我的」弹窗广告：game_bonus（抓包 106 主漏点）
  if (d.game_bonus && typeof d.game_bonus === "object") {
    try {
      if (!d.game_bonus.free || typeof d.game_bonus.free !== "object") {
        d.game_bonus.free = {};
      }
      d.game_bonus.free.free_game_bonus_popup_switch = 0;
      d.game_bonus.free.free_game_bonus_popup_image = "";
      d.game_bonus.free.free_game_bonus_popup_position = 0;
      d.game_bonus.free.last_free_game_bonus_time = "";

      if (!d.game_bonus.bubble || typeof d.game_bonus.bubble !== "object") {
        d.game_bonus.bubble = {};
      }
      d.game_bonus.bubble.bottom_navigation_bubble_switch = 0;
      d.game_bonus.bubble.bottom_navigation_bubble_daily_show_count = 0;

      if (!d.game_bonus.wallet || typeof d.game_bonus.wallet !== "object") {
        d.game_bonus.wallet = {};
      }
      d.game_bonus.wallet.my_game_bonus_guide_switch = 0;
      d.game_bonus.wallet.my_game_bonus_wallet_android_switch = 0;
      d.game_bonus.wallet.my_game_bonus_wallet_ios_switch = 0;

      if (d.game_bonus.gift_coins && typeof d.game_bonus.gift_coins === "object") {
        d.game_bonus.gift_coins.game_bonus_give_coin_popup_image = "";
      }
    } catch (_) {}
  }

  // 直播入口也会像广告一样跳外链
  if (d.one_live && typeof d.one_live === "object") {
    d.one_live.one_live_url_list = [];
    d.one_live.live_user_type = 0;
  }

  if (d.partner && typeof d.partner === "object") {
    d.partner.partner_entrance_switch = 0;
  }
  if (d.new_share && typeof d.new_share === "object") {
    d.new_share.new_share_switch = 0;
  }
  d.is_share_red_point = 0;
  d.quiz_status = 0;

  killPopupSwitches(d);
}

function unlockBuyFields(node) {
  if (!node || typeof node !== "object") return;
  if (Array.isArray(node)) {
    for (var i = 0; i < node.length; i++) unlockBuyFields(node[i]);
    return;
  }
  var keys = Object.keys(node);
  for (var j = 0; j < keys.length; j++) {
    var key = keys[j];
    if (key === "buy") node[key] = 1;
    else if (node[key] && typeof node[key] === "object") unlockBuyFields(node[key]);
  }
}

function filterNavigation(list) {
  var map = {};
  for (var i = 0; i < (list || []).length; i++) {
    var item = list[i];
    if (item && item.code) map[item.code] = item;
  }
  var out = [];
  for (var j = 0; j < NAV_KEEP_CODES.length; j++) {
    if (map[NAV_KEEP_CODES[j]]) out.push(map[NAV_KEEP_CODES[j]]);
  }
  return out;
}

function getPathname(url) {
  try {
    return new URL(url).pathname;
  } catch (_) {
    var m = String(url).match(/^https?:\/\/[^/]+(\/[^?#]*)/i);
    return m ? m[1] : "";
  }
}

function emptyOk(data) {
  return { code: 200, message: "请求成功", data: data == null ? {} : data };
}

function handleResponse() {
  var url = ($request && $request.url) || "";
  var rawBody = ($response && $response.body) || "";
  function passthrough() {
    return $done({ body: rawBody });
  }

  // article/detail: 原作者只在 request 注 token，response 原样放行（不要回加密改写）
  if (/\/article\/detail/i.test(url)) {
    console.log("ℹ️ article/detail response passthrough（不改 body）");
    return passthrough();
  }

  loadUtils()
    .then(function (utils) {
      if (!utils || typeof utils.createCryptoJS !== "function") {
        console.log("❌ Utils加载失败");
        return passthrough();
      }
      var CryptoJS = utils.createCryptoJS();
      var key = CryptoJS.enc.Utf8.parse(AES_KEY);
      var iv = CryptoJS.enc.Utf8.parse(AES_IV);

      var plain;
      try {
        plain = aesDecrypt(rawBody, key, iv, CryptoJS);
      } catch (e) {
        console.log("❌ 解密失败: " + e.message);
        return passthrough();
      }
      if (!plain) {
        console.log("❌ 解密结果为空");
        return passthrough();
      }

      var json;
      try {
        json = JSON.parse(plain);
      } catch (e) {
        console.log("❌ JSON解析失败: " + e.message);
        return passthrough();
      }

      var path = getPathname(url);
      var changed = false;

      // /ad/space
      if (/\/ad\/space/i.test(path) || /\/ad\/space/i.test(url)) {
        if (json && json.data && typeof json.data === "object") {
          clearAdSpace(json.data);
          changed = true;
        } else {
          json = emptyOk({});
          changed = true;
        }
      }
      // 弹窗类
      else if (/\/popup\/activityInfo/i.test(path)) {
        json = emptyOk({ ad_status: 0, list: [] });
        changed = true;
      } else if (/\/vip\/getVipGiftPopup/i.test(path)) {
        json = emptyOk([]);
        changed = true;
      } else if (/\/panda\/popup/i.test(path)) {
        json = emptyOk([]);
        changed = true;
      } else if (/\/activityNavigations/i.test(path)) {
        json = emptyOk([]);
        changed = true;
      } else if (/\/blindBox\/getOngoingActivities/i.test(path)) {
        json = emptyOk({ index: [], discovery: [], demand: [], game: [], my: [] });
        changed = true;
      } else if (/\/my\/unread/i.test(path)) {
        if (json && json.data && typeof json.data === "object") {
          json.data.comments = 0;
          json.data.likes = 0;
          json.data.notifies = 0;
          json.data.feedback = 0;
          changed = true;
        }
      } else if (/\/user\/oneLiveInfo/i.test(path)) {
        json = emptyOk({ one_live_url: "" });
        changed = true;
      }
      // navigation
      else if (/\/v2\.5\/navigation$/i.test(path)) {
        var list = Array.isArray(json && json.data) ? json.data : null;
        if (list) {
          var filtered = filterNavigation(list);
          if (filtered.length) {
            json = { code: 200, message: "请求成功", data: filtered };
            changed = true;
          }
        }
      }
      // bootstrap / login / avatarFrame
      else if (
        /\/bootstrap/i.test(path) ||
        /\/user\/login/i.test(path) ||
        /\/user\/avatarFrame/i.test(path)
      ) {
        if (json && (json.code === 200 || json.code == null)) {
          try {
            patchBootstrap(json);
            changed = true;
          } catch (e) {
            console.log("❌ bootstrap处理异常: " + e.message);
          }
        }
      }
      // discovery / day（detail 已在上方放行）
      else if (/\/article\/discovery/i.test(path) || /\/article\/day/i.test(path)) {
        if (json) {
          unlockBuyFields(json);
          changed = true;
        }
      }
      // userExtraInfo
      else if (/\/my\/userExtraInfo/i.test(path)) {
        json = emptyOk({
          active_level: {
            level: 999,
            name: VIP.active_level_name,
            exp_value: 37966,
            user_exp: 99990,
          },
        });
        changed = true;
      }
      // upgrade
      else if (/\/upgrade/i.test(path)) {
        if (json && json.data && typeof json.data === "object") {
          if (json.data.upgrade && typeof json.data.upgrade === "object") {
            json.data.upgrade.is_popup = 0;
            changed = true;
          }
          if (json.data.is_popup != null) {
            json.data.is_popup = 0;
            changed = true;
          }
        }
      }
      // vip/download
      else if (/\/vip\/download/i.test(path)) {
        if (json) {
          json.data = { limit: 999, use: 0, last: 999, articles: [] };
          changed = true;
        }
      }

      if (!changed) return passthrough();

      try {
        var out = aesEncrypt(JSON.stringify(json), key, iv, CryptoJS);
        console.log("✅ one patched: " + path);
        return $done({ body: out });
      } catch (e) {
        console.log("❌ 回加密失败: " + e.message);
        return passthrough();
      }
    })
    .catch(function (e) {
      console.log("❌ 响应处理异常: " + ((e && e.message) || e));
      console.log(CONTACT);
      passthrough();
    });
}

(function main() {
  var hasReq = typeof $request !== "undefined";
  var hasRes = typeof $response !== "undefined";
  if (hasReq && !hasRes) return handleRequest();
  if (hasRes) return handleResponse();
  $done();
})();

// -------------------- Env 兼容层 (QX / Surge / Loon / Stash / Node) --------------------
function Env(name, opts) {
  class Http {
    constructor(env) {
      this.env = env;
    }
    send(opts, method = "GET") {
      opts = typeof opts === "string" ? { url: opts } : opts;
      let sender = this.get;
      if (method === "POST") sender = this.post;
      return new Promise((resolve, reject) => {
        sender.call(this, opts, (err, resp, body) => {
          if (err) reject(err);
          else resolve(resp);
        });
      });
    }
    get(opts) {
      return this.send.call(this.env, opts);
    }
    post(opts) {
      return this.send.call(this.env, opts, "POST");
    }
  }

  return new (class {
    constructor(name, opts) {
      this.name = name;
      this.http = new Http(this);
      this.data = null;
      this.dataFile = "box.dat";
      this.logs = [];
      this.isMute = false;
      this.isNeedRewrite = false;
      this.logSeparator = "\n";
      this.encoding = "utf-8";
      this.startTime = new Date().getTime();
      Object.assign(this, opts);
      this.log("", `🔔${this.name}, 开始!`);
    }
    getEnv() {
      if (typeof $environment !== "undefined" && $environment["surge-version"])
        return "Surge";
      if (typeof $environment !== "undefined" && $environment["stash-version"])
        return "Stash";
      if (typeof module !== "undefined" && module.exports) return "Node.js";
      if (typeof $task !== "undefined") return "Quantumult X";
      if (typeof $loon !== "undefined") return "Loon";
      if (typeof $rocket !== "undefined") return "Shadowrocket";
    }
    isNode() {
      return this.getEnv() === "Node.js";
    }
    isQuanX() {
      return this.getEnv() === "Quantumult X";
    }
    isSurge() {
      return this.getEnv() === "Surge";
    }
    isLoon() {
      return this.getEnv() === "Loon";
    }
    isShadowrocket() {
      return this.getEnv() === "Shadowrocket";
    }
    isStash() {
      return this.getEnv() === "Stash";
    }
    toObj(str, defaultValue = null) {
      try {
        return JSON.parse(str);
      } catch {
        return defaultValue;
      }
    }
    toStr(obj, defaultValue = null) {
      try {
        return JSON.stringify(obj);
      } catch {
        return defaultValue;
      }
    }
    getjson(key, defaultValue) {
      let json = defaultValue;
      const val = this.getdata(key);
      if (val)
        try {
          json = JSON.parse(val);
        } catch {}
      return json;
    }
    setjson(obj, key) {
      try {
        return this.setdata(JSON.stringify(obj), key);
      } catch {
        return false;
      }
    }
    getScript(url) {
      return new Promise((resolve) => {
        this.get({ url }, (err, resp, body) => resolve(body));
      });
    }
    runScript(script, options) {
      return new Promise((resolve) => {
        let httpapi = this.getdata("@chavy_boxjs_userCfgs.httpapi");
        httpapi = httpapi ? httpapi.replace(/\n/g, "").trim() : httpapi;
        let httpapi_timeout = this.getdata(
          "@chavy_boxjs_userCfgs.httpapi_timeout"
        );
        httpapi_timeout = httpapi_timeout ? httpapi_timeout * 1 : 20;
        httpapi_timeout =
          options && options.timeout ? options.timeout : httpapi_timeout;
        const [key, addr] = httpapi.split("@");
        const opts = {
          url: `http://${addr}/v1/scripting/evaluate`,
          body: {
            script_text: script,
            mock_type: "cron",
            timeout: httpapi_timeout,
          },
          headers: { "X-Key": key, Accept: "*/*" },
          timeout: httpapi_timeout,
        };
        this.post(opts, (err, resp, body) => resolve(body));
      }).catch((e) => this.logErr(e));
    }
    loaddata() {
      if (!this.isNode()) return {};
      this.fs = this.fs ? this.fs : require("fs");
      this.path = this.path ? this.path : require("path");
      const curDirDataFilePath = this.path.resolve(this.dataFile);
      const rootDirDataFilePath = this.path.resolve(
        process.cwd(),
        this.dataFile
      );
      const isCurDirDataFile = this.fs.existsSync(curDirDataFilePath);
      const isRootDirDataFile =
        !isCurDirDataFile && this.fs.existsSync(rootDirDataFilePath);
      if (isCurDirDataFile || isRootDirDataFile) {
        const datPath = isCurDirDataFile
          ? curDirDataFilePath
          : rootDirDataFilePath;
        try {
          return JSON.parse(this.fs.readFileSync(datPath));
        } catch {
          return {};
        }
      }
      return {};
    }
    writedata() {
      if (!this.isNode()) return;
      this.fs = this.fs ? this.fs : require("fs");
      this.path = this.path ? this.path : require("path");
      const curDirDataFilePath = this.path.resolve(this.dataFile);
      const rootDirDataFilePath = this.path.resolve(
        process.cwd(),
        this.dataFile
      );
      const isCurDirDataFile = this.fs.existsSync(curDirDataFilePath);
      const isRootDirDataFile =
        !isCurDirDataFile && this.fs.existsSync(rootDirDataFilePath);
      const jsondata = JSON.stringify(this.data);
      if (isCurDirDataFile) this.fs.writeFileSync(curDirDataFilePath, jsondata);
      else if (isRootDirDataFile)
        this.fs.writeFileSync(rootDirDataFilePath, jsondata);
      else this.fs.writeFileSync(curDirDataFilePath, jsondata);
    }
    lodash_get(source, path, defaultValue = undefined) {
      const paths = path.replace(/\[(\d+)\]/g, ".$1").split(".");
      let result = source;
      for (const p of paths) {
        result = Object(result)[p];
        if (result === undefined) return defaultValue;
      }
      return result;
    }
    lodash_set(obj, path, value) {
      if (Object(obj) !== obj) return obj;
      if (!Array.isArray(path)) path = path.toString().match(/[^.[\]]+/g) || [];
      path
        .slice(0, -1)
        .reduce(
          (a, c, i) =>
            Object(a[c]) === a[c]
              ? a[c]
              : (a[c] = Math.abs(path[i + 1]) >> 0 === +path[i + 1] ? [] : {}),
          obj
        )[path[path.length - 1]] = value;
      return obj;
    }
    getdata(key) {
      let val = this.getval(key);
      if (/^@/.test(key)) {
        const [, objkey, paths] = /^@(.*?)\.(.*?)$/.exec(key);
        const objval = objkey ? this.getval(objkey) : "";
        if (objval)
          try {
            const objedval = JSON.parse(objval);
            val = objedval ? this.lodash_get(objedval, paths, "") : val;
          } catch {
            val = "";
          }
      }
      return val;
    }
    setdata(val, key) {
      let isset = false;
      if (/^@/.test(key)) {
        const [, objkey, paths] = /^@(.*?)\.(.*?)$/.exec(key);
        const objdat = this.getval(objkey);
        const objval =
          objkey && (objdat === "null" ? null : objdat || "{}");
        try {
          const objedval = JSON.parse(objval);
          this.lodash_set(objedval, paths, val);
          isset = this.setval(JSON.stringify(objedval), objkey);
        } catch {
          const objedval = {};
          this.lodash_set(objedval, paths, val);
          isset = this.setval(JSON.stringify(objedval), objkey);
        }
      } else {
        isset = this.setval(val, key);
      }
      return isset;
    }
    getval(key) {
      switch (this.getEnv()) {
        case "Surge":
        case "Loon":
        case "Stash":
        case "Shadowrocket":
          return $persistentStore.read(key);
        case "Quantumult X":
          return $prefs.valueForKey(key);
        case "Node.js":
          this.data = this.loaddata();
          return this.data[key];
        default:
          return (this.data && this.data[key]) || null;
      }
    }
    setval(val, key) {
      switch (this.getEnv()) {
        case "Surge":
        case "Loon":
        case "Stash":
        case "Shadowrocket":
          return $persistentStore.write(val, key);
        case "Quantumult X":
          return $prefs.setValueForKey(val, key);
        case "Node.js":
          this.data = this.loaddata();
          this.data[key] = val;
          this.writedata();
          return true;
        default:
          return (this.data && this.data[key]) || null;
      }
    }
    initGotEnv(opts) {
      this.got = this.got ? this.got : require("got");
      this.cktough = this.cktough ? this.cktough : require("tough-cookie");
      this.ckjar = this.ckjar ? this.ckjar : new this.cktough.CookieJar();
      if (opts) {
        opts.headers = opts.headers ? opts.headers : {};
        if (opts.headers.Cookie === undefined && opts.cookieJar === undefined) {
          opts.cookieJar = this.ckjar;
        }
      }
    }
    get(opts, callback = () => {}) {
      if (opts.headers) {
        delete opts.headers["Content-Type"];
        delete opts.headers["Content-Length"];
        delete opts.headers["content-type"];
        delete opts.headers["content-length"];
      }
      switch (this.getEnv()) {
        case "Surge":
        case "Loon":
        case "Stash":
        case "Shadowrocket":
        default:
          if (this.isSurge() && this.isNeedRewrite) {
            opts.headers = opts.headers || {};
            Object.assign(opts.headers, { "X-Surge-Skip-Scripting": false });
          }
          $httpClient.get(opts, (err, resp, body) => {
            if (!err && resp) {
              resp.body = body;
              resp.statusCode = resp.status ? resp.status : resp.statusCode;
              resp.status = resp.statusCode;
            }
            callback(err, resp, body);
          });
          break;
        case "Quantumult X":
          if (this.isNeedRewrite) {
            opts.opts = opts.opts || {};
            Object.assign(opts.opts, { hints: false });
          }
          $task.fetch(opts).then(
            (resp) => {
              const { statusCode: status, headers, body } = resp;
              callback(
                null,
                { status, statusCode: status, headers, body },
                body
              );
            },
            (err) => callback((err && err.error) || "UndefinedError")
          );
          break;
        case "Node.js":
          {
            let iconv = require("iconv-lite");
            this.initGotEnv(opts);
            this.got(opts)
              .on("redirect", (resp, nextOpts) => {
                try {
                  if (resp.headers["set-cookie"]) {
                    const ck = resp.headers["set-cookie"]
                      .map(this.cktough.Cookie.parse)
                      .toString();
                    if (ck) this.ckjar.setCookieSync(ck, null);
                    nextOpts.cookieJar = this.ckjar;
                  }
                } catch (e) {
                  this.logErr(e);
                }
              })
              .then(
                (resp) => {
                  const { statusCode: status, headers, rawBody } = resp;
                  const body = iconv.decode(rawBody, this.encoding);
                  callback(
                    null,
                    {
                      status,
                      statusCode: status,
                      headers,
                      rawBody,
                      body,
                    },
                    body
                  );
                },
                (err) => {
                  const { message: error, response: resp } = err;
                  callback(
                    error,
                    resp,
                    resp && iconv.decode(resp.rawBody, this.encoding)
                  );
                }
              );
          }
          break;
      }
    }
    post(opts, callback = () => {}) {
      const method = opts.method ? opts.method.toLocaleLowerCase() : "post";
      if (
        opts.body &&
        opts.headers &&
        !opts.headers["Content-Type"] &&
        !opts.headers["content-type"]
      ) {
        opts.headers["content-type"] = "application/x-www-form-urlencoded";
      }
      if (opts.headers) {
        delete opts.headers["Content-Length"];
        delete opts.headers["content-length"];
      }
      switch (this.getEnv()) {
        case "Surge":
        case "Loon":
        case "Stash":
        case "Shadowrocket":
        default:
          if (this.isSurge() && this.isNeedRewrite) {
            opts.headers = opts.headers || {};
            Object.assign(opts.headers, { "X-Surge-Skip-Scripting": false });
          }
          $httpClient[method](opts, (err, resp, body) => {
            if (!err && resp) {
              resp.body = body;
              resp.statusCode = resp.status ? resp.status : resp.statusCode;
              resp.status = resp.statusCode;
            }
            callback(err, resp, body);
          });
          break;
        case "Quantumult X":
          opts.method = method;
          if (this.isNeedRewrite) {
            opts.opts = opts.opts || {};
            Object.assign(opts.opts, { hints: false });
          }
          $task.fetch(opts).then(
            (resp) => {
              const { statusCode: status, headers, body } = resp;
              callback(
                null,
                { status, statusCode: status, headers, body },
                body
              );
            },
            (err) => callback((err && err.error) || "UndefinedError")
          );
          break;
        case "Node.js":
          {
            let iconv = require("iconv-lite");
            this.initGotEnv(opts);
            const { url, ..._opts } = opts;
            this.got[method](url, _opts).then(
              (resp) => {
                const { statusCode: status, headers, rawBody } = resp;
                const body = iconv.decode(rawBody, this.encoding);
                callback(
                  null,
                  {
                    status,
                    statusCode: status,
                    headers,
                    rawBody,
                    body,
                  },
                  body
                );
              },
              (err) => {
                const { message: error, response: resp } = err;
                callback(
                  error,
                  resp,
                  resp && iconv.decode(resp.rawBody, this.encoding)
                );
              }
            );
          }
          break;
      }
    }
    time(fmt, ts = null) {
      const date = ts ? new Date(ts) : new Date();
      let o = {
        "M+": date.getMonth() + 1,
        "d+": date.getDate(),
        "H+": date.getHours(),
        "m+": date.getMinutes(),
        "s+": date.getSeconds(),
        "q+": Math.floor((date.getMonth() + 3) / 3),
        S: date.getMilliseconds(),
      };
      if (/(y+)/.test(fmt))
        fmt = fmt.replace(
          RegExp.$1,
          (date.getFullYear() + "").substr(4 - RegExp.$1.length)
        );
      for (let k in o)
        if (new RegExp("(" + k + ")").test(fmt))
          fmt = fmt.replace(
            RegExp.$1,
            RegExp.$1.length == 1
              ? o[k]
              : ("00" + o[k]).substr(("" + o[k]).length)
          );
      return fmt;
    }
    queryStr(options) {
      let queryString = "";
      for (const key in options) {
        let value = options[key];
        if (value != null && value !== "") {
          if (typeof value === "object") value = JSON.stringify(value);
          queryString += `${key}=${value}&`;
        }
      }
      queryString = queryString.substring(0, queryString.length - 1);
      return queryString;
    }
    msg(title = name, subt = "", desc = "", opts) {
      const toEnvOpts = (rawopts) => {
        if (!rawopts) return rawopts;
        if (typeof rawopts === "string") {
          switch (this.getEnv()) {
            case "Surge":
            case "Stash":
            default:
              return { url: rawopts };
            case "Loon":
            case "Shadowrocket":
              return rawopts;
            case "Quantumult X":
              return { "open-url": rawopts };
            case "Node.js":
              return undefined;
          }
        } else if (typeof rawopts === "object") {
          switch (this.getEnv()) {
            case "Surge":
            case "Stash":
            case "Shadowrocket":
            default: {
              let openUrl = rawopts.url || rawopts.openUrl || rawopts["open-url"];
              return { url: openUrl };
            }
            case "Loon": {
              let openUrl =
                rawopts.openUrl || rawopts.url || rawopts["open-url"];
              let mediaUrl = rawopts.mediaUrl || rawopts["media-url"];
              return { openUrl, mediaUrl };
            }
            case "Quantumult X": {
              let openUrl =
                rawopts["open-url"] || rawopts.url || rawopts.openUrl;
              let mediaUrl = rawopts["media-url"] || rawopts.mediaUrl;
              let updatePasteboard =
                rawopts["update-pasteboard"] || rawopts.updatePasteboard;
              return {
                "open-url": openUrl,
                "media-url": mediaUrl,
                "update-pasteboard": updatePasteboard,
              };
            }
            case "Node.js":
              return undefined;
          }
        }
      };
      if (!this.isMute) {
        switch (this.getEnv()) {
          case "Surge":
          case "Loon":
          case "Stash":
          case "Shadowrocket":
          default:
            $notification.post(title, subt, desc, toEnvOpts(opts));
            break;
          case "Quantumult X":
            $notify(title, subt, desc, toEnvOpts(opts));
            break;
          case "Node.js":
            break;
        }
      }
      if (!this.isMuteLog) {
        let logs = ["", "==============📣系统通知📣=============="];
        logs.push(title);
        if (subt) logs.push(subt);
        if (desc) logs.push(desc);
        console.log(logs.join("\n"));
        this.logs = this.logs.concat(logs);
      }
    }
    log(...logs) {
      if (logs.length > 0) this.logs = [...this.logs, ...logs];
      console.log(logs.join(this.logSeparator));
    }
    logErr(err, msg) {
      switch (this.getEnv()) {
        case "Surge":
        case "Loon":
        case "Stash":
        case "Shadowrocket":
        case "Quantumult X":
        default:
          this.log("", `❗️${this.name}, 错误!`, err);
          break;
        case "Node.js":
          this.log("", `❗️${this.name}, 错误!`, err.stack);
      }
    }
    wait(time) {
      return new Promise((resolve) => setTimeout(resolve, time));
    }
    done(val = {}) {
      const endTime = new Date().getTime();
      const costTime = (endTime - this.startTime) / 1000;
      this.log("", `🔔${this.name}, 结束! 🕛 ${costTime} 秒`);
      this.log();
      switch (this.getEnv()) {
        case "Surge":
        case "Loon":
        case "Stash":
        case "Shadowrocket":
        case "Quantumult X":
        default:
          $done(val);
          break;
        case "Node.js":
          process.exit(1);
      }
    }
  })(name, opts);
}
