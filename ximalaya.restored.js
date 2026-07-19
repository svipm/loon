/*
 *
 *
脚本功能：喜马拉雅+会员调试
软件版本：9.4.50
脚本作者：
更新时间：+20260609
电报频道：https://t.me/GieGie777
问题反馈：
使用声明：此脚本仅供学习与交流，请在下载使用24小时内删除！请勿在中国大陆转载与贩卖！
*******************************
[rewrite_local]

# > 喜马拉雅+会员解锁+大师课+音质/音效/下载/播放器皮肤
^https?:\/\/.+((ximalaya)|(xmcdn)).+(mobile-user\/v2\/homePage|product\/detail\/v1|v1\/album\/track\/ts|mobile-playpage\/track\/v4\/baseInfo\/ts|mobile-playpage\/playpage\/tabs\/v2|mobile-playpage\/playpage\/track\/qualityAndEffect|mobile\/download\/v2\/track|mobile-user-grade\/decoratorV2\/decorationDetails\/page|mobile-album\/album\/plant\/grass) url script-response-body https://raw.githubusercontent.com/svipm/loon/refs/heads/main/ximalaya.restored.js?token=GHSAT0AAAAAAEDFC5WQQO7WGCO5ZVAWJCTE2S4NKRA
#  > 去广告
^https?://passport\.ximalaya\.com/friendship-mobile/v1/findFriendsBanner/show/ url reject
^https?://xdcs-collector\.ximalaya\.com/api/v1/realtime url reject
^https?://adse\.wsa\.ximalaya\.com url reject
^https?://adse\.ximalaya\.com url reject
^https?://ad\.ximalaya\.com url reject
^https?://ulogs\.umeng\.com\/unify_logs url reject
^https?://.+ximalaya\.com/x-web-activity/signIn/getHomePageSignInInfo/ url reject-200
^https?://.+ximalaya\.com/product/promotion/v1/album/price url reject-200
#底部弹出会员购买页面
^https?://mobile\.ximalaya\.com/business-sale-promotion-guide-mobile-web/popup/info/ url reject
[mitm]
hostname = mobwsa.ximalaya.com,mobile.ximalaya.com, apisg.himalaya.com,36.150.215.*,61.172.194.*,180.153.*.*,180.153.255.*,180.153.140.*,180.153.250.*,114.80.99.*,114.80.139.2*,61.162.174.*,119.188.123.*,59.83.227.*,114.80.161.29,1.62.62.64,1.194.255.171,23.236.99.89,36.99.200.135,42.81.4.198,42.81.26.128,42.81.120.58,43.152.24.12,43.152.24.18,43.152.25.127,43.152.29.38,43.175.16.34,43.175.22.25,43.175.44.15,49.7.69.197,49.51.224.95,101.33.11.32,101.33.11.106,101.33.20.34,101.33.29.110,103.105.60.99,140.249.84.135,140.249.85.189,150.109.90.80,150.109.91.35,150.138.47.94,150.138.136.145,203.205.13*.*,203.205.250.*, 211.152.137.*,47.100.227.85,61.164.145.12, 106.41.204.126,118.25.119.177,223.111.231.198,120.22*.2*.*,43.132.8*.*,101.33.27.*,43.141.11.*,117.34.49.212,36.103.197.65,198.18.1*.*,198.18.2*.*,101.91.13*,36.42.77.*,118.180.43.252,49.119.120.*,58.144.235.61,58.251.62*,221.204.4*.*,112.84.131.*,112.80.180.72,112.98.170.228,112.99.146.108,116.136.188.184,116.162.203.111,116.177.225.247,123.138.8.*,183.204.35.*,183.201.114.*,101.91.135.*,101.91.133.*,101.91.134.*,adse.ximalaya.com,61.170.88.*,101.91.134.*,42.56.64.*,*.xmcdn.com,*.ximalaya.com,61.172.194.*,180.153.*.*,180.153.255.*,180.153.140.*,180.153.250.*,114.80.99.*,114.80.139.2*,61.162.174.*,119.188.123.*,59.83.227.*,114.80.161.29,1.62.62.64,1.194.255.171,23.236.99.89,36.99.200.135,42.81.4.198,42.81.26.128,42.81.120.58,43.152.24.12,43.152.24.18,43.152.25.127,43.152.29.38,43.175.16.34,43.175.22.25,43.175.44.15,49.7.69.197,49.51.224.95,101.33.11.32,101.33.11.106,101.33.20.34,101.33.29.110,103.105.60.99,140.249.84.135,140.249.85.189,150.109.90.80,150.109.91.35,150.138.47.94,150.138.136.145,203.205.13*.*,203.205.250.*,211.152.137.*,47.100.227.85,61.164.145.12,106.41.204.126,112.80.180.72,112.98.170.228, 112.99.146.108,118.25.119.177,223.111.231.198,120.22*.2*.*,43.132.8*.*,101.33.27.*,43.141.11.*,101.89.53.*,36.131.221.*,111.42.194.*,adse.ximalaya.com,36.131.221.*,112.84.131.*,111.6.56.*,111.6.56.228,*.xmcdn.com,120.232.165.228,43.159.71.*,ulogs.umeng.com,www.taobao.com,43.132.81.*,101.33.27.*,61.172.1*.*,43.141.11.*,114.80.99.86,180.153.255.*,114.80.99.*,*.mysteel.*,61.172.194.196,180.153.*.*,*xima*,*xmcdn*,*.ximalaya.com,*.xmcdn.com,180.153.255.*,180.153.140.*,180.153.250.*,114.80.99.*,114.80.139.237,114.80.161.29,1.62.62.64,51*.com,1.194.255.171,23.236.99.89,36.99.200.135,42.81.4.198,42.81.26.128,42.81.120.58,43.132.80.77,43.132.83.175,43.132.84.11,43.152.24.12,43.152.24.18,43.152.25.127,43.152.29.38,43.175.16.34,43.175.22.25,43.175.44.15,49.7.69.197,49.51.224.95,101.33.11.32,101.33.11.106,101.33.20.34,101.33.29.110,103.105.60.99,114.80.99.90,114.80.99.70,114.80.99.71,114.80.99.89,114.80.99.91,114.80.99.88,114.80.99.87,140.249.84.135,140.249.85.189,150.109.90.80,150.109.91.35,150.138.47.94,150.138.136.145,203.205.136.87,203.205.136.100,203.205.136.102,203.205.136.159,203.205.137.27,203.205.137.87,203.205.137.241,203.205.250.111,203.205.250.113,211.152.137.25,ulogs.umeng.com,passport.ximalaya.com,m.ximalaya.com,116.153.*.*,39.156.8.*,183.204.64.*,61.241.178.*,112.64.213.*,43.174.54.*,27.152.187.*,117.161.*.*,183.204.64.*,182.242.50.*,101.91.134.*,123.12.235.*,101.91.135.*,85.211.193.*,111.12.187.*,117.161.169.*,59.37.143.*,42.202.164.*,219.144.82.*,152.67.253.*,42.200.166.*,163.177.58.*,120.240.179.*,36.170.27.*,74.226.216.*

*
*
*/

const $ = new Env("喜马拉雅+会员解锁");

const EP_KEY = {
  key: "MZ4uGVu3dvMOKb1k",
  permutation: [
    33, 1, 24, 23, 2, 30, 10, 3, 7, 14, 15, 28, 32, 16, 5, 31, 13, 9, 22, 0, 29,
    21, 17, 25, 8, 26, 35, 27, 6, 19, 4, 20, 18, 34, 12, 11,
  ],
};
const COOKIE_URL =
  "https://gh-proxy.org/https://raw.githubusercontent.com/WeiGiegie/666/main/xmly_data.json";
const UTILS_URL =
  "https://gh-proxy.org/https://raw.githubusercontent.com/xzxxn777/Surge/main/Utils/Utils.js";
const AES_KEY = "a0QnjTaA9YicRj7H";
const PAID_API = "http://mpaywsa.ximalaya.com/mobile/track/pay";
const FREE_API =
  "http://mobile.ximalaya.com/fmobile-track/fmobile/track/playpage";
const CACHE_TTL = 60 * 60 * 1000;
const CACHE_KEY_UTILS = "XM_Utils_Code";
const CACHE_KEY_COOKIE = "XM_Cookie_Data";

class EParser {
  static decodeBase64(value) {
    const normalized = value.replace(/[\r\n\s]/g, "");
    if (typeof atob === "function") {
      return Uint8Array.from(
        atob(normalized),
        (char) => char.charCodeAt(0) & 0xff,
      );
    }
    const alphabet =
      "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
    const bytes = [];
    let buffer = 0;
    let bits = 0;
    for (const char of normalized.replace(/=+$/, "")) {
      const index = alphabet.indexOf(char);
      if (index < 0) continue;
      buffer = (buffer << 6) | index;
      bits += 6;
      if (bits >= 8) {
        bits -= 8;
        bytes.push((buffer >> bits) & 0xff);
      }
    }
    return Uint8Array.from(bytes);
  }

  static decodeUtf8(bytes) {
    if (typeof TextDecoder !== "undefined") {
      return new TextDecoder("utf-8").decode(bytes);
    }
    let binary = "";
    for (const byte of bytes) binary += String.fromCharCode(byte);
    return decodeURIComponent(escape(binary));
  }

  static transformKey(key) {
    return Array.from(key, (char) => {
      const index = char.charCodeAt(0) - (char >= "a" && char <= "z" ? 97 : 22);
      const mapped =
        index >= 0 && index < 36 ? EP_KEY.permutation[index] : index;
      return String.fromCharCode(mapped <= 25 ? mapped + 97 : mapped + 22);
    }).join("");
  }

  static decrypt(payload) {
    try {
      const keyText = this.transformKey(EP_KEY.key);
      const keyBytes =
        typeof TextEncoder !== "undefined"
          ? new TextEncoder().encode(keyText)
          : Uint8Array.from(keyText, (char) => char.charCodeAt(0) & 0xff);
      const state = Uint8Array.from({ length: 256 }, (_, index) => index);
      for (let i = 0, j = 0; i < 256; i++) {
        j = (j + state[i] + keyBytes[i % keyBytes.length]) & 0xff;
        [state[i], state[j]] = [state[j], state[i]];
      }
      const input = this.decodeBase64(payload);
      const output = new Uint8Array(input.length);
      for (let n = 0, i = 0, j = 0; n < input.length; n++) {
        i = (i + 1) & 0xff;
        j = (j + state[i]) & 0xff;
        [state[i], state[j]] = [state[j], state[i]];
        output[n] = input[n] ^ state[(state[i] + state[j]) & 0xff];
      }
      return this.decodeUtf8(output);
    } catch (error) {
      $.log("【喜马拉雅】EP解密失败:" + error);
      return null;
    }
  }

  static parse(payload) {
    const decoded = this.decrypt(payload);
    if (!decoded) throw new Error("EP解密失败");
    const parts = decoded.split("-");
    if (parts.length !== 4) throw new Error("EP格式无效");
    return parts;
  }
}

async function loadCryptoJS() {
  const cached = $.getdata(CACHE_KEY_UTILS);
  if (cached) {
    try {
      const { code, timestamp } = JSON.parse(cached);
      if (Date.now() - timestamp < CACHE_TTL) {
        eval(code);
        if (typeof creatUtils === "function") return creatUtils();
        if (typeof createUtils === "function") return createUtils();
      }
    } catch (_) {}
  }

  try {
    const response = await $.http.get({ url: UTILS_URL });
    if (!response.body) return null;
    eval(response.body);
    let utils = null;
    if (typeof creatUtils === "function") utils = creatUtils();
    else if (typeof createUtils === "function") utils = createUtils();
    if (utils) {
      $.setdata(
        JSON.stringify({ code: response.body, timestamp: Date.now() }),
        CACHE_KEY_UTILS,
      );
    }
    return utils;
  } catch (error) {
    $.log("【喜马拉雅】加载CryptoJS失败:" + error);
    return null;
  }
}

async function aesDecrypt(fileId) {
  const utils = await loadCryptoJS();
  if (!utils) {
    $.log("【喜马拉雅】CryptoJS未加载，无法解密fileId");
    return null;
  }
  try {
    const CryptoJS = utils.createCryptoJS();
    const key = CryptoJS.enc.Utf8.parse(AES_KEY);
    const decrypted = CryptoJS.AES.decrypt(fileId, key, {
      mode: CryptoJS.mode.ECB,
      padding: CryptoJS.pad.Pkcs7,
    }).toString(CryptoJS.enc.Utf8);
    try {
      return JSON.parse(decrypted);
    } catch (_) {
      return decrypted;
    }
  } catch (error) {
    $.log("【喜马拉雅】AES解密异常:" + error);
    return null;
  }
}

function getUrlParam(url, name) {
  const match = url.match(new RegExp(name + "=(\\d+)"));
  if (!match) return null;
  return name === "trackQualityLevel" ? parseInt(match[1], 10) : match[1];
}

function getQualityCode(level) {
  return (
    { 0: "M4A_48", 1: "M4A_128", 2: "FLAC_16", 3: "FLAC_24", 12: "ATMOS_24" }[
      level
    ] || "M4A_128"
  );
}

async function getCookie() {
  const cached = $.getdata(CACHE_KEY_COOKIE);
  if (cached) {
    try {
      const { cookie, timestamp } = JSON.parse(cached);
      if (Date.now() - timestamp < CACHE_TTL && cookie) {
        $.log("【喜马拉雅】使用缓存的Cookie");
        return cookie;
      }
    } catch (_) {}
  }
  try {
    const response = await $.http.get({
      url: COOKIE_URL,
      headers: {
        "User-Agent":
          "Mozilla/5.0 (iPhone; CPU iPhone OS 16_2 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.2 Mobile/15E148 Safari/604.1",
      },
    });
    const cookie = $.toObj(response.body)?.cookie;
    if (!cookie) {
      $.log("【喜马拉雅】获取Cookie为空");
      return null;
    }
    $.setdata(
      JSON.stringify({ cookie, timestamp: Date.now() }),
      CACHE_KEY_COOKIE,
    );
    $.log("【喜马拉雅】获取并缓存新Cookie");
    return cookie;
  } catch (error) {
    $.log("【喜马拉雅】获取Cookie失败:" + error);
    return null;
  }
}

const VipHandler = {
  home(body) {
    const result = $.toObj(body);
    if (!result?.data) return body;
    const data = result.data;
    const vipInfo = { isVip: true, level: 5, status: 4 };
    if (data.vipInfo) data.vipInfo = { ...vipInfo };
    if (data.svipInfo) data.svipInfo = { ...vipInfo };
    if (data.platinumVipInfo) data.platinumVipInfo = { ...vipInfo };
    if (data.anchorVipInfo) data.anchorVipInfo.isVip = true;
    Object.assign(data, {
      isVip: true,
      vipStatus: 4,
      nickname: "t.me/GieGie777",
    });
    if (data.childTag) {
      data.childTag = {
        isChild: true,
        isShadowChild: true,
        icon: "https://imagev2.xmcdn.com/storages/32a2-audiofreehighqps/85/11/GArMeBMKi3dVAAAVcwL9beDx.png!op_type=0&magick=webp&xmagick=webp",
      };
    }
    Object.assign(data, {
      vLogoType: 2,
      mobileMiddleLogo:
        "http://ykhp-user-imges.yikaobang.com.cn/Uploads/Avatar/2024/08/18/66c188e2d4fab.jpg",
    });
    if (data.userGradeInfo) {
      data.userGradeInfo.level = 8;
      data.userGradeInfo.icon =
        "https://imagev2.xmcdn.com/storages/25b2-audiofreehighqps/D2/85/GAqhQ6cL8dSjAAAMawOpSwKq.png!xmagick=webp";
    }
    delete data.serviceModule;
    $.log("【喜马拉雅】个人页面会员解锁成功");
    return JSON.stringify(result);
  },

  product(body) {
    const result = body
      .replace(/isFree":\w+/g, 'isFree":true')
      .replace(/isPaid":\w+/g, 'isPaid":false')
      .replace(/"activityInfo":[^}]+../g, "")
      .replace(/"extraInfo"/g, '"null"');
    $.log("【喜马拉雅】商品详情付费内容解锁成功");
    return result;
  },

  album(body) {
    const result = body
      .replace(/isFree":\w+/g, 'isFree":true')
      .replace(/isPaid":\w+/g, 'isPaid":false');
    $.log("【喜马拉雅】专辑音频付费内容解锁成功");
    return result;
  },

  playpage(body) {
    const result = $.toObj(body);
    if (result?.data?.playpage) delete result.data.playpage.authorizeInfo;
    $.log("【喜马拉雅】播放页限制项解锁成功");
    return JSON.stringify(result);
  },

  quality(body) {
    const result = $.toObj(body);
    const data = result?.data;
    data?.soundEffectInfo?.soundEffects?.forEach((effect) => {
      Object.assign(effect, {
        isAuthorized: true,
        isNeedVip: false,
        canLowDevice: true,
      });
    });
    data?.trackQualityVoInfo?.trackQualities?.forEach((quality) => {
      quality.canChoose = true;
    });
    $.log("【喜马拉雅】音质&音效全部解锁成功");
    return JSON.stringify(result);
  },

  download(body) {
    const result = $.toObj(body);
    if (result?.ret === -1) result.ret = 0;
    $.log("【喜马拉雅】音频下载限制解锁成功");
    return JSON.stringify(result);
  },

  playerSkin(body) {
    const result = $.toObj(body);
    result?.data?.forEach((item) => {
      if (![3, 5].includes(item.source)) return;
      item.source = 1;
      item.code = item.code?.replace(/^S[35]/, "S1");
      item.suitCode = item.suitCode?.replace(/^S[35]/, "S1");
      item.intro = "免费佩戴";
      item.categoryIds = [31];
      item.wearCondition = true;
    });
    $.log("【喜马拉雅】播放器皮肤全部解锁成功");
    return JSON.stringify(result);
  },
};

async function resolveAudio(trackId, qualityLevel, cookie) {
  const timestamp = Date.now();
  const headers = {
    cookie,
    "User-Agent":
      "ting_v3.0.3_c5(CFNetwork, iOS 16.2, iPhone13,4) ;xmly(lite)/3.0.3/ios_1",
    "Accept-Language":
      "zh-Hans-US;q=1, en-GB;q=0.9, en-US;q=0.8, zh-Hant-US;q=0.7",
  };
  try {
    const url =
      PAID_API +
      "/" +
      trackId +
      "/ts-" +
      timestamp +
      "?device=iPhone&trackQualityLevel=" +
      qualityLevel;
    const response = await $.http.get({ url, headers });
    const data = $.toObj(response.body);
    if (data?.ret === 0 && data.fileId) {
      const decrypted = await aesDecrypt(data.fileId);
      const path =
        typeof decrypted === "string"
          ? decrypted
          : decrypted?.path || decrypted?.data || "";
      if (path) {
        const [buyKey, sign, token, epTimestamp] = EParser.parse(data.ep);
        return {
          success: true,
          isPaid: true,
          playUrl:
            data.domain +
            "/download/1.0.0/" +
            path +
            "?buy_key=" +
            buyKey +
            "&sign=" +
            sign +
            "&timestamp=" +
            epTimestamp +
            "&token=" +
            token +
            "&duration=" +
            data.duration,
          quality: data.highestQualityLevel || qualityLevel,
          title: data.title,
          duration: data.duration,
          albumId: data.albumId,
          fileSize: data.totalLength,
        };
      }
    }
  } catch (error) {
    $.log("【喜马拉雅】付费接口异常: " + error);
  }
  try {
    const url =
      FREE_API +
      "/" +
      trackId +
      "/ts-" +
      timestamp +
      "&qualityLevel=" +
      qualityLevel;
    const response = await $.http.get({ url, headers });
    const data = $.toObj(response.body);
    if (data?.ret === 0 && data.trackInfo) {
      const track = data.trackInfo;
      const playKey = [
        "playPathAacv164",
        "playUrl64",
        "playPathAacv224",
        "playUrl32",
      ].find((key) => track[key]);
      if (playKey) {
        return {
          success: true,
          isPaid: false,
          playUrl: track[playKey],
          quality: ["playPathAacv164", "playUrl64"].includes(playKey) ? 1 : 0,
          title: track.title,
          duration: track.duration,
          albumId: track.albumId,
          fileSize: track.downloadSize,
        };
      }
    }
  } catch (error) {
    $.log("【喜马拉雅】免费接口异常: " + error);
  }
  return { success: false, error: "音频解析失败" };
}

async function handleTrackBaseInfo(url) {
  const trackId = getUrlParam(url, "trackId");
  const requestedQuality = getUrlParam(url, "trackQualityLevel") || 1;
  $.log(
    "【喜马拉雅】开始解析音频，TrackId: " +
      trackId +
      "，请求音质等级: " +
      requestedQuality,
  );
  if (!trackId) {
    $.log("【喜马拉雅】音频解析失败：未获取到TrackId");
    return $done({ body: $response.body });
  }
  const cookie = await getCookie();
  if (!cookie) {
    $.log("【喜马拉雅】音频解析失败：Cookie获取失败/为空，TrackId: " + trackId);
    return $done({ body: $response.body });
  }
  const audio = await resolveAudio(trackId, requestedQuality, cookie);
  if (!audio.success) {
    $.log("【喜马拉雅】音频解析失败：" + audio.error + "，TrackId: " + trackId);
    return $done({ body: $response.body });
  }
  $.log(
    "【喜马拉雅】音频解析成功，TrackId: " +
      trackId +
      "，音频类型: " +
      (audio.isPaid ? "付费" : "免费") +
      "，实际音质等级: " +
      audio.quality +
      "（" +
      getQualityCode(audio.quality) +
      "）",
  );
  const result = {
    playUrlInfos: [
      {
        qualityLevel: audio.quality,
        url: audio.playUrl,
        type: getQualityCode(audio.quality),
        fileSize: audio.fileSize || 0,
      },
    ],
    trackBaseVO: {
      ret: 0,
      trackInfo: {
        isFree: true,
        trackId: parseInt(trackId, 10),
        isPaid: audio.isPaid,
        isAuthorized: true,
        title: audio.title || "音频ID:" + trackId,
        duration: audio.duration || 0,
        isVipFree: false,
      },
      albumInfo: {
        status: 1,
        title: "专辑ID:" + audio.albumId,
        albumId: audio.albumId,
        isPaid: audio.isPaid,
        vipFreeType: 1,
      },
    },
  };
  return $done({ body: JSON.stringify(result) });
}

const routes = [
  {
    path: "/mobile-playpage/track/v4/baseInfo/ts",
    handler: handleTrackBaseInfo,
    passUrl: true,
  },
  {
    path: "/mobile-user/v2/homePage",
    handler: () => $done({ body: VipHandler.home($response.body) }),
  },
  {
    path: "/product/detail/v1/",
    handler: () => $done({ body: VipHandler.product($response.body) }),
  },
  {
    path: "/mobile-album/album/plant/grass",
    handler: () => $done({ body: VipHandler.product($response.body) }),
  },
  {
    path: "/v1/album/track/ts",
    handler: () => $done({ body: VipHandler.album($response.body) }),
  },
  {
    path: "/mobile-playpage/playpage/tabs/v2/",
    handler: () => $done({ body: VipHandler.playpage($response.body) }),
  },
  {
    path: "/mobile-playpage/playpage/track/qualityAndEffect/",
    handler: () => $done({ body: VipHandler.quality($response.body) }),
  },
  {
    path: "/mobile/download/v2/track/",
    handler: () => $done({ body: VipHandler.download($response.body) }),
  },
  {
    path: "/mobile-user-grade/decoratorV2/decorationDetails/page",
    handler: () => $done({ body: VipHandler.playerSkin($response.body) }),
  },
];

function main() {
  const url = $request?.url;
  if (!url) return $done({ body: $response.body });
  const route = routes.find((item) => url.includes(item.path));
  if (!route) return $done({ body: $response.body });
  return route.passUrl ? route.handler(url) : route.handler();
}

typeof $response !== "undefined" ? main() : $done();

function Env(e, t) {
  class s {
    constructor(e) {
      this.env = e;
    }
    send(e, t = "GET") {
      e =
        "string" == typeof e
          ? {
              url: e,
            }
          : e;
      let s = this.get;
      "POST" === t && (s = this.post);
      const i = new Promise((t, i) => {
        s.call(this, e, (e, s, o) => {
          e ? i(e) : t(s);
        });
      });
      return e.timeout
        ? ((e, t = 1e3) =>
            Promise.race([
              e,
              new Promise((e, s) => {
                setTimeout(() => {
                  s(new Error("请求超时"));
                }, t);
              }),
            ]))(i, e.timeout)
        : i;
    }
    get(e) {
      return this.send.call(this.env, e);
    }
    post(e) {
      return this.send.call(this.env, e, "POST");
    }
  }
  return new (class {
    constructor(e, t) {
      ((this.logLevels = {
        debug: 0,
        info: 1,
        warn: 2,
        error: 3,
      }),
        (this.logLevelPrefixs = {
          debug: "[DEBUG] ",
          info: "[INFO] ",
          warn: "[WARN] ",
          error: "[ERROR] ",
        }),
        (this.logLevel = "info"),
        (this.name = e),
        (this.http = new s(this)),
        (this.data = null),
        (this.dataFile = "box.dat"),
        (this.logs = []),
        (this.isMute = !1),
        (this.isNeedRewrite = !1),
        (this.logSeparator = "\n"),
        (this.encoding = "utf-8"),
        (this.startTime = new Date().getTime()),
        Object.assign(this, t),
        this.log("", `🔔${this.name}, 开始!`));
    }
    getEnv() {
      return "undefined" != typeof $environment && $environment["surge-version"]
        ? "Surge"
        : "undefined" != typeof $environment && $environment["stash-version"]
          ? "Stash"
          : "undefined" != typeof module && module.exports
            ? "Node.js"
            : "undefined" != typeof $task
              ? "Quantumult X"
              : "undefined" != typeof $loon
                ? "Loon"
                : "undefined" != typeof $rocket
                  ? "Shadowrocket"
                  : void 0;
    }
    isNode() {
      return "Node.js" === this.getEnv();
    }
    isQuanX() {
      return "Quantumult X" === this.getEnv();
    }
    isSurge() {
      return "Surge" === this.getEnv();
    }
    isLoon() {
      return "Loon" === this.getEnv();
    }
    isShadowrocket() {
      return "Shadowrocket" === this.getEnv();
    }
    isStash() {
      return "Stash" === this.getEnv();
    }
    toObj(e, t = null) {
      try {
        return JSON.parse(e);
      } catch {
        return t;
      }
    }
    toStr(e, t = null, ...s) {
      try {
        return JSON.stringify(e, ...s);
      } catch {
        return t;
      }
    }
    getjson(e, t) {
      let s = t;
      if (this.getdata(e))
        try {
          s = JSON.parse(this.getdata(e));
        } catch {}
      return s;
    }
    setjson(e, t) {
      try {
        return this.setdata(JSON.stringify(e), t);
      } catch {
        return !1;
      }
    }
    getScript(e) {
      return new Promise((t) => {
        this.get(
          {
            url: e,
          },
          (e, s, i) => t(i),
        );
      });
    }
    runScript(e, t) {
      return new Promise((s) => {
        let i = this.getdata("@chavy_boxjs_userCfgs.httpapi");
        i = i ? i.replace(/\n/g, "").trim() : i;
        let o = this.getdata("@chavy_boxjs_userCfgs.httpapi_timeout");
        ((o = o ? 1 * o : 20), (o = t && t.timeout ? t.timeout : o));
        const [r, a] = i.split("@"),
          n = {
            url: `http://${a}/v1/scripting/evaluate`,
            body: {
              script_text: e,
              mock_type: "cron",
              timeout: o,
            },
            headers: {
              "X-Key": r,
              Accept: "*/*",
            },
            policy: "DIRECT",
            timeout: o,
          };
        this.post(n, (e, t, i) => s(i));
      }).catch((e) => this.logErr(e));
    }
    loaddata() {
      if (!this.isNode()) return {};
      {
        ((this.fs = this.fs ? this.fs : require("fs")),
          (this.path = this.path ? this.path : require("path")));
        const e = this.path.resolve(this.dataFile),
          t = this.path.resolve(process.cwd(), this.dataFile),
          s = this.fs.existsSync(e),
          i = !s && this.fs.existsSync(t);
        if (!s && !i) return {};
        {
          const i = s ? e : t;
          try {
            return JSON.parse(this.fs.readFileSync(i));
          } catch (e) {
            return {};
          }
        }
      }
    }
    writedata() {
      if (this.isNode()) {
        ((this.fs = this.fs ? this.fs : require("fs")),
          (this.path = this.path ? this.path : require("path")));
        const e = this.path.resolve(this.dataFile),
          t = this.path.resolve(process.cwd(), this.dataFile),
          s = this.fs.existsSync(e),
          i = !s && this.fs.existsSync(t),
          o = JSON.stringify(this.data);
        s
          ? this.fs.writeFileSync(e, o)
          : i
            ? this.fs.writeFileSync(t, o)
            : this.fs.writeFileSync(e, o);
      }
    }
    lodash_get(e, t, s) {
      const i = t.replace(/\[(\d+)\]/g, ".$1").split(".");
      let o = e;
      for (const e of i) if (((o = Object(o)[e]), void 0 === o)) return s;
      return o;
    }
    lodash_set(e, t, s) {
      return (
        Object(e) !== e ||
          (Array.isArray(t) || (t = t.toString().match(/[^.[\]]+/g) || []),
          (t
            .slice(0, -1)
            .reduce(
              (e, s, i) =>
                Object(e[s]) === e[s]
                  ? e[s]
                  : (e[s] = (0 | Math.abs(t[i + 1])) == +t[i + 1] ? [] : {}),
              e,
            )[t[t.length - 1]] = s)),
        e
      );
    }
    getdata(e) {
      let t = this.getval(e);
      if (/^@/.test(e)) {
        const [, s, i] = /^@(.*?)\.(.*?)$/.exec(e),
          o = s ? this.getval(s) : "";
        if (o)
          try {
            const e = JSON.parse(o);
            t = e ? this.lodash_get(e, i, "") : t;
          } catch (e) {
            t = "";
          }
      }
      return t;
    }
    setdata(e, t) {
      let s = !1;
      if (/^@/.test(t)) {
        const [, i, o] = /^@(.*?)\.(.*?)$/.exec(t),
          r = this.getval(i),
          a = i ? ("null" === r ? null : r || "{}") : "{}";
        try {
          const t = JSON.parse(a);
          (this.lodash_set(t, o, e), (s = this.setval(JSON.stringify(t), i)));
        } catch (t) {
          const r = {};
          (this.lodash_set(r, o, e), (s = this.setval(JSON.stringify(r), i)));
        }
      } else s = this.setval(e, t);
      return s;
    }
    getval(e) {
      switch (this.getEnv()) {
        case "Surge":
        case "Loon":
        case "Stash":
        case "Shadowrocket":
          return $persistentStore.read(e);
        case "Quantumult X":
          return $prefs.valueForKey(e);
        case "Node.js":
          return ((this.data = this.loaddata()), this.data[e]);
        default:
          return (this.data && this.data[e]) || null;
      }
    }
    setval(e, t) {
      switch (this.getEnv()) {
        case "Surge":
        case "Loon":
        case "Stash":
        case "Shadowrocket":
          return $persistentStore.write(e, t);
        case "Quantumult X":
          return $prefs.setValueForKey(e, t);
        case "Node.js":
          return (
            (this.data = this.loaddata()),
            (this.data[t] = e),
            this.writedata(),
            !0
          );
        default:
          return (this.data && this.data[t]) || null;
      }
    }
    initGotEnv(e) {
      ((this.got = this.got ? this.got : require("got")),
        (this.cktough = this.cktough ? this.cktough : require("tough-cookie")),
        (this.ckjar = this.ckjar ? this.ckjar : new this.cktough.CookieJar()),
        e &&
          ((e.headers = e.headers ? e.headers : {}),
          e &&
            ((e.headers = e.headers ? e.headers : {}),
            void 0 === e.headers.cookie &&
              void 0 === e.headers.Cookie &&
              void 0 === e.cookieJar &&
              (e.cookieJar = this.ckjar))));
    }
    get(e, t = () => {}) {
      switch (
        (e.headers &&
          (delete e.headers["Content-Type"],
          delete e.headers["Content-Length"],
          delete e.headers["content-type"],
          delete e.headers["content-length"]),
        e.params && (e.url += "?" + this.queryStr(e.params)),
        void 0 === e.followRedirect ||
          e.followRedirect ||
          ((this.isSurge() || this.isLoon()) && (e["auto-redirect"] = !1),
          this.isQuanX() &&
            (e.opts
              ? (e.opts.redirection = !1)
              : (e.opts = {
                  redirection: !1,
                }))),
        this.getEnv())
      ) {
        case "Surge":
        case "Loon":
        case "Stash":
        case "Shadowrocket":
        default:
          (this.isSurge() &&
            this.isNeedRewrite &&
            ((e.headers = e.headers || {}),
            Object.assign(e.headers, {
              "X-Surge-Skip-Scripting": !1,
            })),
            $httpClient.get(e, (e, s, i) => {
              (!e &&
                s &&
                ((s.body = i),
                (s.statusCode = s.status ? s.status : s.statusCode),
                (s.status = s.statusCode)),
                t(e, s, i));
            }));
          break;
        case "Quantumult X":
          (this.isNeedRewrite &&
            ((e.opts = e.opts || {}),
            Object.assign(e.opts, {
              hints: !1,
            })),
            $task.fetch(e).then(
              (e) => {
                const {
                  statusCode: s,
                  statusCode: i,
                  headers: o,
                  body: r,
                  bodyBytes: a,
                } = e;
                t(
                  null,
                  {
                    status: s,
                    statusCode: i,
                    headers: o,
                    body: r,
                    bodyBytes: a,
                  },
                  r,
                  a,
                );
              },
              (e) => t((e && e.error) || "UndefinedError"),
            ));
          break;
        case "Node.js":
          let s = require("iconv-lite");
          (this.initGotEnv(e),
            this.got(e)
              .on("redirect", (e, t) => {
                try {
                  if (e.headers["set-cookie"]) {
                    const s = e.headers["set-cookie"]
                      .map(this.cktough.Cookie.parse)
                      .toString();
                    (s && this.ckjar.setCookieSync(s, null),
                      (t.cookieJar = this.ckjar));
                  }
                } catch (e) {
                  this.logErr(e);
                }
              })
              .then(
                (e) => {
                  const {
                      statusCode: i,
                      statusCode: o,
                      headers: r,
                      rawBody: a,
                    } = e,
                    n = s.decode(a, this.encoding);
                  t(
                    null,
                    {
                      status: i,
                      statusCode: o,
                      headers: r,
                      rawBody: a,
                      body: n,
                    },
                    n,
                  );
                },
                (e) => {
                  const { message: i, response: o } = e;
                  t(i, o, o && s.decode(o.rawBody, this.encoding));
                },
              ));
      }
    }
    post(e, t = () => {}) {
      const s = e.method ? e.method.toLocaleLowerCase() : "post";
      switch (
        (e.body &&
          e.headers &&
          !e.headers["Content-Type"] &&
          !e.headers["content-type"] &&
          (e.headers["content-type"] = "application/x-www-form-urlencoded"),
        e.headers &&
          (delete e.headers["Content-Length"],
          delete e.headers["content-length"]),
        void 0 === e.followRedirect ||
          e.followRedirect ||
          ((this.isSurge() || this.isLoon()) && (e["auto-redirect"] = !1),
          this.isQuanX() &&
            (e.opts
              ? (e.opts.redirection = !1)
              : (e.opts = {
                  redirection: !1,
                }))),
        this.getEnv())
      ) {
        case "Surge":
        case "Loon":
        case "Stash":
        case "Shadowrocket":
        default:
          (this.isSurge() &&
            this.isNeedRewrite &&
            ((e.headers = e.headers || {}),
            Object.assign(e.headers, {
              "X-Surge-Skip-Scripting": !1,
            })),
            $httpClient[s](e, (e, s, i) => {
              (!e &&
                s &&
                ((s.body = i),
                (s.statusCode = s.status ? s.status : s.statusCode),
                (s.status = s.statusCode)),
                t(e, s, i));
            }));
          break;
        case "Quantumult X":
          ((e.method = s),
            this.isNeedRewrite &&
              ((e.opts = e.opts || {}),
              Object.assign(e.opts, {
                hints: !1,
              })),
            $task.fetch(e).then(
              (e) => {
                const {
                  statusCode: s,
                  statusCode: i,
                  headers: o,
                  body: r,
                  bodyBytes: a,
                } = e;
                t(
                  null,
                  {
                    status: s,
                    statusCode: i,
                    headers: o,
                    body: r,
                    bodyBytes: a,
                  },
                  r,
                  a,
                );
              },
              (e) => t((e && e.error) || "UndefinedError"),
            ));
          break;
        case "Node.js":
          let i = require("iconv-lite");
          this.initGotEnv(e);
          const { url: o, ...r } = e;
          this.got[s](o, r).then(
            (e) => {
              const {
                  statusCode: s,
                  statusCode: o,
                  headers: r,
                  rawBody: a,
                } = e,
                n = i.decode(a, this.encoding);
              t(
                null,
                {
                  status: s,
                  statusCode: o,
                  headers: r,
                  rawBody: a,
                  body: n,
                },
                n,
              );
            },
            (e) => {
              const { message: s, response: o } = e;
              t(s, o, o && s.decode(o.rawBody, this.encoding));
            },
          );
      }
    }
    time(e, t = null) {
      const s = t ? new Date(t) : new Date();
      let i = {
        "M+": s.getMonth() + 1,
        "d+": s.getDate(),
        "H+": s.getHours(),
        "m+": s.getMinutes(),
        "s+": s.getSeconds(),
        "q+": Math.floor((s.getMonth() + 3) / 3),
        S: s.getMilliseconds(),
      };
      /(y+)/.test(e) &&
        (e = e.replace(
          RegExp.$1,
          (s.getFullYear() + "").substr(4 - RegExp.$1.length),
        ));
      for (let t in i)
        new RegExp("(" + t + ")").test(e) &&
          (e = e.replace(
            RegExp.$1,
            1 == RegExp.$1.length
              ? i[t]
              : ("00" + i[t]).substr(("" + i[t]).length),
          ));
      return e;
    }
    queryStr(e) {
      let t = "";
      for (const s in e) {
        let i = e[s];
        null != i &&
          "" !== i &&
          ("object" == typeof i && (i = JSON.stringify(i)),
          (t += `${s}=${i}&`));
      }
      return ((t = t.substring(0, t.length - 1)), t);
    }
    msg(t = e, s = "", i = "", o = {}) {
      const r = (e) => {
        const { $open: t, $copy: s, $media: i, $mediaMime: o } = e;
        switch (typeof e) {
          case void 0:
            return e;
          case "string":
            switch (this.getEnv()) {
              case "Surge":
              case "Stash":
              default:
                return {
                  url: e,
                };
              case "Loon":
              case "Shadowrocket":
                return e;
              case "Quantumult X":
                return {
                  "open-url": e,
                };
              case "Node.js":
                return;
            }
          case "object":
            switch (this.getEnv()) {
              case "Surge":
              case "Stash":
              case "Shadowrocket":
              default: {
                const r = {};
                let a = e.openUrl || e.url || e["open-url"] || t;
                a &&
                  Object.assign(r, {
                    action: "open-url",
                    url: a,
                  });
                let n = e["update-pasteboard"] || e.updatePasteboard || s;
                n &&
                  Object.assign(r, {
                    action: "clipboard",
                    text: n,
                  });
                let h = e.mediaUrl || e["media-url"] || i;
                if (h) {
                  let e, t;
                  if (h.startsWith("http"));
                  else if (h.startsWith("data:")) {
                    const [s] = h.split(";"),
                      [, i] = h.split(",");
                    ((e = i), (t = s.replace("data:", "")));
                  } else
                    ((e = h),
                      (t = ((e) => {
                        const t = {
                          JVBERi0: "application/pdf",
                          R0lGODdh: "image/gif",
                          R0lGODlh: "image/gif",
                          iVBORw0KGgo: "image/png",
                          "/9j/": "image/jpg",
                        };
                        for (var s in t) if (0 === e.indexOf(s)) return t[s];
                        return null;
                      })(h)));
                  Object.assign(r, {
                    "media-url": h,
                    "media-base64": e,
                    "media-base64-mime": o ?? t,
                  });
                }
                return (
                  Object.assign(r, {
                    "auto-dismiss": e["auto-dismiss"],
                    sound: e.sound,
                  }),
                  r
                );
              }
              case "Loon": {
                const s = {};
                let o = e.openUrl || e.url || e["open-url"] || t;
                o &&
                  Object.assign(s, {
                    openUrl: o,
                  });
                let r = e.mediaUrl || e["media-url"] || i;
                return (
                  r &&
                    Object.assign(s, {
                      mediaUrl: r,
                    }),
                  console.log(JSON.stringify(s)),
                  s
                );
              }
              case "Quantumult X": {
                const o = {};
                let r = e["open-url"] || e.url || e.openUrl || t;
                r &&
                  Object.assign(o, {
                    "open-url": r,
                  });
                let a = e.mediaUrl || e["media-url"] || i;
                a &&
                  Object.assign(o, {
                    "media-url": a,
                  });
                let n = e["update-pasteboard"] || e.updatePasteboard || s;
                return (
                  n &&
                    Object.assign(o, {
                      "update-pasteboard": n,
                    }),
                  console.log(JSON.stringify(o)),
                  o
                );
              }
              case "Node.js":
                return;
            }
          default:
            return;
        }
      };
      if (!this.isMute)
        switch (this.getEnv()) {
          case "Surge":
          case "Loon":
          case "Stash":
          case "Shadowrocket":
          default:
            $notification.post(t, s, i, r(o));
            break;
          case "Quantumult X":
            $notify(t, s, i, r(o));
          case "Node.js":
        }
      if (!this.isMuteLog) {
        let e = ["", "==============📣系统通知📣=============="];
        (e.push(t),
          s && e.push(s),
          i && e.push(i),
          console.log(e.join("\n")),
          (this.logs = this.logs.concat(e)));
      }
    }
    debug(...e) {
      this.logLevels[this.logLevel] <= this.logLevels.debug &&
        (e.length > 0 && (this.logs = [...this.logs, ...e]),
        console.log(
          `${this.logLevelPrefixs.debug}${e.map((e) => e ?? String(e)).join(this.logSeparator)}`,
        ));
    }
    info(...e) {
      this.logLevels[this.logLevel] <= this.logLevels.info &&
        (e.length > 0 && (this.logs = [...this.logs, ...e]),
        console.log(
          `${this.logLevelPrefixs.info}${e.map((e) => e ?? String(e)).join(this.logSeparator)}`,
        ));
    }
    warn(...e) {
      this.logLevels[this.logLevel] <= this.logLevels.warn &&
        (e.length > 0 && (this.logs = [...this.logs, ...e]),
        console.log(
          `${this.logLevelPrefixs.warn}${e.map((e) => e ?? String(e)).join(this.logSeparator)}`,
        ));
    }
    error(...e) {
      this.logLevels[this.logLevel] <= this.logLevels.error &&
        (e.length > 0 && (this.logs = [...this.logs, ...e]),
        console.log(
          `${this.logLevelPrefixs.error}${e.map((e) => e ?? String(e)).join(this.logSeparator)}`,
        ));
    }
    log(...e) {
      (e.length > 0 && (this.logs = [...this.logs, ...e]),
        console.log(e.map((e) => e ?? String(e)).join(this.logSeparator)));
    }
    logErr(e, t) {
      switch (this.getEnv()) {
        case "Surge":
        case "Loon":
        case "Stash":
        case "Shadowrocket":
        case "Quantumult X":
        default:
          this.log("", `❗️${this.name}, 错误!`, t, e);
          break;
        case "Node.js":
          this.log(
            "",
            `❗️${this.name}, 错误!`,
            t,
            void 0 !== e.message ? e.message : e,
            e.stack,
          );
      }
    }
    wait(e) {
      return new Promise((t) => setTimeout(t, e));
    }
    done(e = {}) {
      const t = (new Date().getTime() - this.startTime) / 1e3;
      switch (
        (this.log("", `🔔${this.name}, 结束! 🕛 ${t} 秒`),
        this.log(),
        this.getEnv())
      ) {
        case "Surge":
        case "Loon":
        case "Stash":
        case "Shadowrocket":
        case "Quantumult X":
        default:
          $done(e);
          break;
        case "Node.js":
          process.exit(1);
      }
    }
  })(e, t);
}
