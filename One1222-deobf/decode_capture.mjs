import fs from "fs";
import path from "path";
import { createRequire } from "module";
import { fileURLToPath } from "url";

const require = createRequire(import.meta.url);
let CryptoJS;
try {
  CryptoJS = require("C:/Users/admin/deobf-one1222/node_modules/crypto-js");
} catch {
  CryptoJS = require("crypto-js");
}

const KEY = CryptoJS.enc.Utf8.parse("l*bv%Ziq000Biaog");
const IV = CryptoJS.enc.Utf8.parse("8597506002939249");
const ROOT = "C:/Users/admin/Desktop/One1222-deobf/capture_102";
const OUT = "C:/Users/admin/Desktop/One1222-deobf/capture_102_decoded";
fs.mkdirSync(OUT, { recursive: true });

function parseReq(txt) {
  const lines = txt.split(/\r?\n/);
  const pseudo = {};
  for (const L of lines) {
    if (L.startsWith(":")) {
      const parts = L.split(":");
      // :method: GET
      if (parts.length >= 3) pseudo[parts[1]] = parts.slice(2).join(":").trim();
    } else if (/^host:/i.test(L)) {
      pseudo.authority = L.split(":").slice(1).join(":").trim();
    } else {
      const m = L.match(/^([A-Z]+)\s+(\S+)\s+HTTP/);
      if (m) {
        pseudo.method = m[1];
        pseudo.path = m[2];
      }
    }
  }
  return pseudo;
}

function tryDecrypt(buf) {
  let text = buf.toString("utf8").trim();
  if (
    (text.startsWith('"') && text.endsWith('"')) ||
    (text.startsWith("'") && text.endsWith("'"))
  ) {
    text = text.slice(1, -1);
  }
  // direct AES-CBC base64
  try {
    const bytes = CryptoJS.AES.decrypt(text, KEY, {
      iv: IV,
      mode: CryptoJS.mode.CBC,
      padding: CryptoJS.pad.Pkcs7,
    });
    const plain = bytes.toString(CryptoJS.enc.Utf8);
    if (plain && /[\{\[]/.test(plain)) return plain;
  } catch {}
  // maybe already json
  if (text.startsWith("{") || text.startsWith("[")) return text;
  return null;
}

function summarizeAds(obj, pathHint = "") {
  const hits = [];
  const walk = (n, p) => {
    if (!n || typeof n !== "object") return;
    if (Array.isArray(n)) {
      n.forEach((x, i) => walk(x, `${p}[${i}]`));
      return;
    }
    for (const [k, v] of Object.entries(n)) {
      const key = `${p}.${k}`;
      const kl = k.toLowerCase();
      if (
        /ad|banner|popup|splash|commercial|skip|interval|space|vip|switch/.test(
          kl
        )
      ) {
        const preview =
          typeof v === "object"
            ? JSON.stringify(v).slice(0, 300)
            : String(v).slice(0, 200);
        hits.push({ path: key, type: typeof v, preview });
      }
      if (v && typeof v === "object") walk(v, key);
    }
  };
  walk(obj, pathHint || "$");
  return hits;
}

const interest =
  /ad\/space|bootstrap|popup|vip\/getVipGiftPopup|panda\/popup|navigation|userExtraInfo|unread|upgrade/;

const rows = [];
for (const name of fs.readdirSync(ROOT)) {
  const d = path.join(ROOT, name);
  if (!fs.statSync(d).isDirectory()) continue;
  const rh = path.join(d, "request_header_raw.txt");
  if (!fs.existsSync(rh)) continue;
  const pseudo = parseReq(fs.readFileSync(rh, "utf8"));
  const host = pseudo.authority || "";
  const pth = pseudo.path || "";
  const full = host + pth;
  if (!interest.test(pth) && !/ad\/space|bootstrap|popup/.test(pth)) continue;

  const rb = path.join(d, "response_body_raw");
  if (!fs.existsSync(rb)) continue;
  const buf = fs.readFileSync(rb);
  const plain = tryDecrypt(buf);
  const ts = Number(name.split("_").pop());
  const item = {
    id: name,
    ts,
    method: pseudo.method || "?",
    url: `https://${host}${pth}`,
    respBytes: buf.length,
    decrypted: !!plain,
  };
  if (plain) {
    const outFile = path.join(OUT, `${name}.json`);
    fs.writeFileSync(outFile, plain);
    item.out = outFile;
    try {
      const j = JSON.parse(plain);
      item.code = j.code;
      item.message = j.message;
      item.adHits = summarizeAds(j).slice(0, 80);
      // special extracts
      if (/ad\/space/.test(pth) && j.data) {
        item.adSpaceKeys = Object.keys(j.data);
        item.adSpaceSummary = {};
        for (const [k, v] of Object.entries(j.data)) {
          if (!v || typeof v !== "object") {
            item.adSpaceSummary[k] = v;
            continue;
          }
          const ads = v.ads || v.list || (Array.isArray(v) ? v : null);
          item.adSpaceSummary[k] = {
            type: Array.isArray(v) ? "array" : "object",
            adsCount: Array.isArray(ads) ? ads.length : undefined,
            params: v.parameters || undefined,
            sample:
              Array.isArray(ads) && ads[0]
                ? {
                    id: ads[0].id || ads[0].ad_id,
                    title: ads[0].title || ads[0].name,
                    type: ads[0].type || ads[0].ad_type,
                    url: ads[0].url || ads[0].link || ads[0].jump_url,
                    image: ads[0].image || ads[0].img || ads[0].cover,
                  }
                : Object.keys(v).slice(0, 12),
          };
        }
      }
      if (/bootstrap/.test(pth) && j.data) {
        item.bootstrapUser = j.data.user
          ? {
              nickname: j.data.user.nickname,
              vip_level: j.data.user.vip_level,
              vip_status: j.data.user.vip_status,
              vip_expiry: j.data.user.vip_expiry,
              active_level: j.data.user.active_level,
            }
          : null;
        item.bootstrapSwitches = j.data.switches || null;
        item.bootstrapVip = j.data.vip || null;
        item.bootstrapAdFields = {
          article_ads_gap_interval: j.data.article_ads_gap_interval,
          advert_interval: j.data.advert_interval,
          video_advert_interval: j.data.video_advert_interval,
          buy: j.data.buy,
          vip_coin: j.data.vip_coin,
          is_show_webp: j.data.is_show_webp,
        };
      }
      if (/popup/.test(pth)) {
        item.popupPreview = JSON.stringify(j).slice(0, 800);
      }
    } catch (e) {
      item.parseError = String(e.message || e);
    }
  } else {
    // save hex head
    item.headHex = buf.slice(0, 32).toString("hex");
    item.headText = buf.toString("utf8").slice(0, 80);
  }
  rows.push(item);
}

rows.sort((a, b) => a.ts - b.ts);
fs.writeFileSync(
  path.join(OUT, "_summary.json"),
  JSON.stringify(rows, null, 2)
);
console.log("decoded", rows.filter((r) => r.decrypted).length, "/", rows.length);
for (const r of rows) {
  console.log(
    "\n====",
    r.ts,
    r.method,
    r.url,
    "bytes",
    r.respBytes,
    "decrypted",
    r.decrypted
  );
  if (r.bootstrapUser) console.log("user", r.bootstrapUser);
  if (r.bootstrapSwitches) console.log("switches", r.bootstrapSwitches);
  if (r.bootstrapVip) console.log("vip", r.bootstrapVip);
  if (r.bootstrapAdFields) console.log("adFields", r.bootstrapAdFields);
  if (r.adSpaceKeys) console.log("adSpace keys", r.adSpaceKeys);
  if (r.adSpaceSummary) console.log(JSON.stringify(r.adSpaceSummary, null, 2));
  if (r.popupPreview) console.log("popup", r.popupPreview);
  if (r.adHits && r.adHits.length && !r.adSpaceSummary) {
    console.log(
      "hits",
      r.adHits.slice(0, 20).map((h) => h.path + "=" + h.preview.slice(0, 80))
    );
  }
  if (!r.decrypted) console.log("raw", r.headText, r.headHex);
}
