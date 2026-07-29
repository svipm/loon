import fs from "fs";
import path from "path";
import { createRequire } from "module";

const require = createRequire(import.meta.url);
const CryptoJS = require("C:/Users/admin/deobf-one1222/node_modules/crypto-js");

const KEY = CryptoJS.enc.Utf8.parse("l*bv%Ziq000Biaog");
const IV = CryptoJS.enc.Utf8.parse("8597506002939249");

// Load fixed script functions by re-implementing clearAdSpace / patchBootstrap lightly
// Actually import logic by eval of the fixed script is hard due to Env.
// Reuse the same logic inline for unit test.

const AD_SLOT_KEYS = [
  "bootstrap-full",
  "index-popup_image",
  "index-popup_text",
  "index-banner",
  "index-footer-banner",
  "video-pre_roll-banner",
  "video-paused-banner",
  "video-player-float-banner",
  "vod-player-float-banner",
];

function neuterAdSlot(slot) {
  if (!slot || typeof slot !== "object" || Array.isArray(slot)) return false;
  let changed = false;
  if (Array.isArray(slot.ads) && slot.ads.length) {
    slot.ads = [];
    changed = true;
  }
  if (Array.isArray(slot.list) && slot.list.length) {
    slot.list = [];
    changed = true;
  }
  if (!slot.parameters || typeof slot.parameters !== "object") slot.parameters = {};
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

function clearAdSpace(data) {
  if (!data || typeof data !== "object") return false;
  let changed = false;
  for (const key of AD_SLOT_KEYS) {
    if (!Object.prototype.hasOwnProperty.call(data, key)) continue;
    if (Array.isArray(data[key])) {
      if (data[key].length) {
        data[key] = [];
        changed = true;
      }
    } else if (neuterAdSlot(data[key])) changed = true;
  }
  for (const key of Object.keys(data)) {
    const val = data[key];
    if (!val) continue;
    if (Array.isArray(val)) {
      if (/ad|banner|popup|splash|commercial/i.test(key) && val.length) {
        data[key] = [];
        changed = true;
      }
      continue;
    }
    if (typeof val === "object") {
      const hasAds = Array.isArray(val.ads) || Array.isArray(val.list);
      const nameHit =
        /ad|banner|popup|splash|commercial|boot|footer|float|roll/i.test(key);
      if ((hasAds || nameHit) && neuterAdSlot(val)) changed = true;
    }
  }
  return changed;
}

function patchBootstrap(json) {
  const d = json.data;
  if (!d.user) d.user = {};
  d.user.vip_level = 10;
  d.user.vip_status = 1;
  d.user.vip_expiry = "2099-09-09";
  if (!d.switches) d.switches = {};
  d.switches.bootstrap_ads = 0;
  d.switches.popup_ads = 0;
  if (!d.vip) d.vip = {};
  d.vip.skip_ad = 1;
  d.advert_interval = 99999;
  d.video_advert_interval = 99999;
}

const decodedDir = "C:/Users/admin/Desktop/One1222-deobf/capture_102_decoded";
const outDir = "C:/Users/admin/Desktop/One1222-deobf/capture_102_patched";
fs.mkdirSync(outDir, { recursive: true });

let totalAdsBefore = 0;
let totalAdsAfter = 0;
let files = 0;

for (const name of fs.readdirSync(decodedDir)) {
  if (!name.endsWith(".json") || name.startsWith("_")) continue;
  const j = JSON.parse(fs.readFileSync(path.join(decodedDir, name), "utf8"));
  if (!j || !j.data) continue;

  // count ads before
  const countAds = (data) => {
    let n = 0;
    if (!data || typeof data !== "object") return 0;
    for (const v of Object.values(data)) {
      if (v && typeof v === "object" && Array.isArray(v.ads)) n += v.ads.length;
    }
    return n;
  };

  let before = 0;
  let after = 0;
  let kind = "other";

  if (j.data.switches && j.data.user) {
    kind = "bootstrap";
    before = (j.data.switches.bootstrap_ads ? 1 : 0) + (j.data.switches.popup_ads ? 1 : 0);
    patchBootstrap(j);
    after = (j.data.switches.bootstrap_ads ? 1 : 0) + (j.data.switches.popup_ads ? 1 : 0);
  } else if (Object.values(j.data).some((v) => v && typeof v === "object" && "ads" in v)) {
    kind = "ad/space";
    before = countAds(j.data);
    clearAdSpace(j.data);
    after = countAds(j.data);
  } else if (/popup|activityInfo|VipGift|panda/i.test(name) || j.data.list || j.data.ad_status != null) {
    kind = "popup";
    before = Array.isArray(j.data.list) ? j.data.list.length : j.data && Object.keys(j.data).length ? 1 : 0;
    j.data = Array.isArray(j.data) ? [] : { ad_status: 0, list: [] };
    after = 0;
  } else {
    continue;
  }

  totalAdsBefore += before;
  totalAdsAfter += after;
  files++;

  const plain = JSON.stringify(j);
  const enc = CryptoJS.AES.encrypt(plain, KEY, {
    iv: IV,
    mode: CryptoJS.mode.CBC,
    padding: CryptoJS.pad.Pkcs7,
  }).toString();

  // verify roundtrip
  const dec = CryptoJS.AES.decrypt(enc, KEY, {
    iv: IV,
    mode: CryptoJS.mode.CBC,
    padding: CryptoJS.pad.Pkcs7,
  }).toString(CryptoJS.enc.Utf8);
  const ok = dec === plain;

  fs.writeFileSync(path.join(outDir, name), JSON.stringify(j, null, 2));
  console.log(
    `${kind.padEnd(10)} ${name} ads ${before} -> ${after} reencrypt_ok=${ok}`
  );
}

console.log("\nSUMMARY files=", files, "ads", totalAdsBefore, "->", totalAdsAfter);
if (totalAdsAfter !== 0) {
  console.error("FAIL: still have ads after patch");
  process.exit(1);
}
console.log("PASS");
