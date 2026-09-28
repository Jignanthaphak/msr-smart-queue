// lib/services/thaidRegistrationStore.js
import { randomBytes } from "crypto";
import QRCode from "qrcode";

if (!global.thaidRegStore) {
  global.thaidRegStore = new Map();
}

// ล้างคำขอที่หมดอายุทุก 2 นาที
if (!global.thaidRegCleanupTimer) {
  global.thaidRegCleanupTimer = setInterval(() => {
    const now = Date.now();
    for (const [key, value] of global.thaidRegStore.entries()) {
      if (value.expiresAt < now) {
        global.thaidRegStore.delete(key);
      }
    }
  }, 120000);
}

function decodeJwtPayload(token) {
  if (!token || typeof token !== "string") return null;
  const parts = token.split(".");
  if (parts.length < 2) return null;
  try {
    const json = Buffer.from(parts[1], "base64url").toString("utf8");
    return JSON.parse(json);
  } catch (e1) {
    try {
      let b64 = parts[1].replace(/-/g, "+").replace(/_/g, "/");
      while (b64.length % 4) b64 += "=";
      const json = Buffer.from(b64, "base64").toString("utf8");
      return JSON.parse(json);
    } catch (e2) {
      console.warn("decodeJwtPayload failed:", e2);
      return null;
    }
  }
}

export function parseThaIDAddress(userInfo) {
  let raw = "";
  if (typeof userInfo.house_address === "string") {
    raw = userInfo.house_address;
  } else if (userInfo.house_address?.raw) {
    raw = userInfo.house_address.raw;
  } else if (userInfo.house_address?.formatted) {
    raw = userInfo.house_address.formatted;
  } else if (typeof userInfo.address === "string") {
    raw = userInfo.address;
  } else if (userInfo.address?.raw) {
    raw = userInfo.address.raw;
  } else if (userInfo.address?.formatted) {
    raw = userInfo.address.formatted;
  }

  // 1) กรณีรูปแบบมาตรฐาน DOPA คั่นด้วย # (เช่น บ้านเลขที่#หมู่ที่#ตรอก#ซอย#ถนน#ตำบล#อำเภอ#จังหวัด)
  if (raw && raw.includes("#")) {
    const parts = raw.split("#").map((s) => (s || "").trim());
    return {
      houseno: parts[0] || "",
      moo: parts[1] ? parts[1].replace(/^(หมู่ที่|หมู่|ม\.)\s*/, "") || parts[1] : "",
      trok: parts[2] || "",
      soi: parts[3] ? parts[3].replace(/^(ซอย|ซ\.)\s*/, "") || parts[3] : "",
      road: parts[4] ? parts[4].replace(/^(ถนน|ถ\.)\s*/, "") || parts[4] : "",
      subdistrict: parts[5] ? parts[5].replace(/^(ตำบล|แขวง|ต\.)\s*/, "") : "",
      district: parts[6] ? parts[6].replace(/^(อำเภอ|เขต|อ\.)\s*/, "") : "",
      province: parts[7] ? parts[7].replace(/^(จังหวัด|จ\.)\s*/, "") : "",
    };
  }

  // 2) กรณีที่อยู่เป็นข้อความภาษาไทยต่อเนื่อง
  if (raw && typeof raw === "string" && raw.trim().length > 0) {
    let text = raw.trim();
    let houseno = "", moo = "", soi = "", road = "", subdistrict = "", district = "", province = "";

    const provMatch = text.match(/(?:จังหวัด|จ\.)\s*([ก-๙a-zA-Z\s]+)$/);
    if (provMatch) {
      province = provMatch[1].trim();
      text = text.substring(0, provMatch.index).trim();
    }
    const distMatch = text.match(/(?:อำเภอ|เขต|อ\.)\s*([ก-๙a-zA-Z\s]+)$/);
    if (distMatch) {
      district = distMatch[1].trim();
      text = text.substring(0, distMatch.index).trim();
    }
    const subMatch = text.match(/(?:ตำบล|แขวง|ต\.)\s*([ก-๙a-zA-Z\s]+)$/);
    if (subMatch) {
      subdistrict = subMatch[1].trim();
      text = text.substring(0, subMatch.index).trim();
    }
    const roadMatch = text.match(/(?:ถนน|ถ\.)\s*([^\s]+)/);
    if (roadMatch) road = roadMatch[1].trim();
    const soiMatch = text.match(/(?:ซอย|ซ\.)\s*([^\s]+)/);
    if (soiMatch) soi = soiMatch[1].trim();
    const mooMatch = text.match(/(?:หมู่ที่|หมู่|ม\.)\s*([0-9]+)/);
    if (mooMatch) moo = mooMatch[1].trim();
    const houseMatch = text.match(/^([0-9]+(?:\/[0-9]+)?)/);
    if (houseMatch) houseno = houseMatch[1].trim();

    if (province || district || subdistrict || houseno) {
      return { houseno, moo, trok: "", soi, road, subdistrict, district, province };
    }
  }

  const addrObj = typeof userInfo.address === "object" && userInfo.address !== null ? userInfo.address : {};
  const houseObj = typeof userInfo.house_address === "object" && userInfo.house_address !== null ? userInfo.house_address : {};

  return {
    houseno: userInfo.house_no || userInfo.houseNo || addrObj.house_no || houseObj.house_no || "",
    moo: userInfo.moo || userInfo.village_no || addrObj.moo || houseObj.moo || "",
    trok: userInfo.trok || addrObj.trok || houseObj.trok || "",
    soi: userInfo.soi || addrObj.soi || houseObj.soi || "",
    road: userInfo.road || addrObj.road || houseObj.road || "",
    subdistrict: userInfo.subdistrict || userInfo.tumbol || addrObj.subdistrict || houseObj.subdistrict || "",
    district: userInfo.district || userInfo.amphur || addrObj.district || houseObj.district || "",
    province: userInfo.province || userInfo.changwat || addrObj.province || houseObj.province || "",
  };
}

export function formatThaIDToCardData(userInfo, pid) {
  // Gender: 1=ชาย, 2=หญิง
  let gender = "1";
  if (
    userInfo.gender === 2 ||
    userInfo.gender === "2" ||
    userInfo.gender === "female" ||
    userInfo.gender === "หญิง"
  ) {
    gender = "2";
  } else if (
    userInfo.gender === 1 ||
    userInfo.gender === "1" ||
    userInfo.gender === "male" ||
    userInfo.gender === "ชาย"
  ) {
    gender = "1";
  }

  // Birthday: YYYY-MM-DD
  let birthday = userInfo.birthdate || userInfo.date_of_birth || "";
  if (birthday && /^\d{8}$/.test(birthday)) {
    const y = parseInt(birthday.substring(0, 4), 10);
    const m = birthday.substring(4, 6);
    const d = birthday.substring(6, 8);
    const yearCE = y > 2400 ? y - 543 : y;
    birthday = `${yearCE}-${m}-${d}`;
  } else if (birthday && /^\d{4}-\d{2}-\d{2}$/.test(birthday)) {
    const parts = birthday.split("-");
    const y = parseInt(parts[0], 10);
    if (y > 2400) {
      birthday = `${y - 543}-${parts[1]}-${parts[2]}`;
    }
  }

  // คำนำหน้า และ ชื่อ-สกุล
  let prefixTH = userInfo.title || userInfo.prefix || "";
  let firstNameTH = userInfo.given_name || userInfo.first_name || "";
  let lastNameTH = userInfo.family_name || userInfo.last_name || "";
  let prefixEN = userInfo.title_en || userInfo.prefix_en || "";
  let firstNameEN = userInfo.given_name_en || userInfo.first_name_en || "";
  let lastNameEN = userInfo.family_name_en || userInfo.last_name_en || "";

  if (!firstNameTH && userInfo.name) {
    const parts = userInfo.name.trim().split(/\s+/);
    firstNameTH = parts[0] || "";
    lastNameTH = parts.slice(1).join(" ") || "";
  }

  if (!firstNameEN && userInfo.name_en) {
    const parts = userInfo.name_en.trim().split(/\s+/);
    firstNameEN = parts[0] || "";
    lastNameEN = parts.slice(1).join(" ") || "";
  }

  const addressObj = parseThaIDAddress(userInfo);

  return {
    citizenId: pid ? String(pid).trim() : "",
    prefixTH,
    firstNameTH,
    lastNameTH,
    prefixEN,
    firstNameEN,
    lastNameEN,
    birthday,
    gender,
    addressObj,
  };
}

const VERIFIED_CLIENT_ID = "clN3cXlFTUtaTDZtSXdtSWN5Nno0OXcxdkg1YXVLa2g";
const VERIFIED_CLIENT_SECRET = "alNFeDJwQTV4YXAxRVNlQjB2em9pQUtIcFluSEY0SUtZQmxCNE9lVg";
const VERIFIED_API_KEY = "WP5KkTWML653rEiy6RI2Stx7a5M90cyl9ZNS7XQA";

export async function createRegRequest() {
  let clientId = process.env.THAID_CLIENT_ID || VERIFIED_CLIENT_ID;
  if (!clientId || clientId.includes("clN3cIFTU")) {
    clientId = VERIFIED_CLIENT_ID;
  }

  const redirectUri = process.env.THAID_REDIRECT_URI || "https://mhc4.dmh.go.th/msr/api/auth/thaid/callback";
  const authUrlBase = process.env.THAID_AUTH_URL || "https://imauth.bora.dopa.go.th/api/v2/oauth2/auth/";
  const scope =
    process.env.THAID_SCOPE ||
    "openid pid title given_name family_name title_en given_name_en family_name_en birthdate gender address ial";

  const requestId = "reg_" + randomBytes(16).toString("hex");

  const authUrl = new URL(authUrlBase);
  authUrl.searchParams.set("response_type", "code");
  authUrl.searchParams.set("client_id", clientId);
  authUrl.searchParams.set("redirect_uri", redirectUri);
  authUrl.searchParams.set("scope", scope);
  authUrl.searchParams.set("state", requestId);

  const finalUrl = authUrl.toString();

  // ดึงค่า Location จาก DOPA เพื่อรับรหัสสแกนมาตรฐาน AUTHEN- และรหัสอ้างอิง (refCode)
  let qrCodePayload = finalUrl;
  let refCode = "";
  let dopaTxId = "";
  let dopaWebUrl = finalUrl;

  try {
    const dopaRes = await fetch(finalUrl, { redirect: "manual" });
    const location = dopaRes.headers.get("location");
    if (location) {
      dopaWebUrl = location;
      const locUrl = new URL(location);
      const dopaQrcode = locUrl.searchParams.get("qrcode");
      if (dopaQrcode) {
        qrCodePayload = dopaQrcode;
      }
      refCode = locUrl.searchParams.get("refCode") || "";
      dopaTxId = locUrl.searchParams.get("txID") || "";
    } else if (dopaRes.status >= 400) {
      const errText = await dopaRes.text();
      console.error("DOPA Auth Error:", dopaRes.status, errText);
    }
  } catch (e) {
    console.error("Error fetching DOPA auth location, fallback to direct URL:", e);
  }

  // สร้าง QR Code จาก payload (AUTHEN-xxx) ที่แอป ThaID รองรับโดยตรง 100%
  const qrDataUrl = await QRCode.toDataURL(qrCodePayload, {
    width: 300,
    margin: 2,
    color: {
      dark: "#0F172A",
      light: "#FFFFFF",
    },
  });

  const expiresAt = Date.now() + 5 * 60 * 1000; // 5 นาที

  global.thaidRegStore.set(requestId, {
    status: "pending",
    createdAt: Date.now(),
    expiresAt,
    refCode,
    dopaTxId,
    data: null,
  });

  return {
    requestId,
    authUrl: dopaWebUrl,
    qrDataUrl,
    refCode,
    expiresAt,
  };
}

export async function exchangeCodeAndComplete(requestId, code) {
  const entry = global.thaidRegStore.get(requestId);
  if (!entry || entry.status === "completed") return false;

  let clientId = process.env.THAID_CLIENT_ID || VERIFIED_CLIENT_ID;
  if (!clientId || clientId.includes("clN3cIFTU")) {
    clientId = VERIFIED_CLIENT_ID;
  }

  let clientSecret = process.env.THAID_CLIENT_SECRET || VERIFIED_CLIENT_SECRET;
  if (!clientSecret || clientSecret.includes("QUtlcFluSEYw") || clientSecret.includes("SEYw")) {
    clientSecret = VERIFIED_CLIENT_SECRET;
  }

  let apiKey = process.env.THAID_API_KEY || VERIFIED_API_KEY;
  const redirectUri = process.env.THAID_REDIRECT_URI || "https://mhc4.dmh.go.th/msr/api/auth/thaid/callback";
  const tokenUrl = process.env.THAID_TOKEN_URL || "https://imauth.bora.dopa.go.th/api/v2/oauth2/token/";
  const userInfoUrl = process.env.THAID_USERINFO_URL || "https://imauth.bora.dopa.go.th/api/v2/oauth2/userinfo/";

  try {
    const authHeader = `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString("base64")}`;
    const tokenBody = new URLSearchParams({
      grant_type: "authorization_code",
      code: code,
      redirect_uri: redirectUri,
      client_id: clientId,
      client_secret: clientSecret,
    });

    const tokenHeaders = {
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization: authHeader,
    };
    if (apiKey) {
      tokenHeaders["x-api-key"] = apiKey;
    }

    const tokenResponse = await fetch(tokenUrl, {
      method: "POST",
      headers: tokenHeaders,
      body: tokenBody.toString(),
    });

    if (!tokenResponse.ok) {
      const errText = await tokenResponse.text();
      console.error("Auto exchange token failed:", tokenResponse.status, errText);
      return false;
    }

    const tokenData = await tokenResponse.json();
    const accessToken = tokenData.access_token;
    let pid = tokenData.pid || tokenData.sub || tokenData.citizen_id || null;
    let userInfo = {};

    // 1) ดึงข้อมูลและเลขบัตรประชาชน (pid) จาก id_token (JWT) ของ DOPA
    if (tokenData.id_token) {
      const decoded = decodeJwtPayload(tokenData.id_token);
      if (decoded) {
        userInfo = { ...userInfo, ...decoded };
        pid = pid || decoded.pid || decoded.sub || decoded.citizen_id || decoded.id_card;
      }
    }

    // 2) ตรวจสอบข้อมูลใน userinfo object หากมีส่งกลับมา
    if (tokenData.userinfo) {
      if (typeof tokenData.userinfo === "object") {
        userInfo = { ...userInfo, ...tokenData.userinfo };
        pid = pid || tokenData.userinfo.pid || tokenData.userinfo.sub || tokenData.userinfo.citizen_id;
      } else if (typeof tokenData.userinfo === "string") {
        try {
          const parsed = JSON.parse(tokenData.userinfo);
          userInfo = { ...userInfo, ...parsed };
          pid = pid || parsed.pid || parsed.sub || parsed.citizen_id;
        } catch (e) {}
      }
    }

    // 3) หากมี access token ดึงข้อมูลจาก UserInfo endpoint เพิ่มเติม
    if (accessToken) {
      try {
        const uiHeaders = { Authorization: `Bearer ${accessToken}` };
        if (apiKey) uiHeaders["x-api-key"] = apiKey;
        const uiRes = await fetch(userInfoUrl, { method: "GET", headers: uiHeaders });
        if (uiRes.ok) {
          const info = await uiRes.json();
          userInfo = { ...userInfo, ...info };
          pid = pid || info.pid || info.sub || info.citizen_id;
        }
      } catch (uiErr) {
        console.warn("Auto exchange userInfo error:", uiErr);
      }
    }

    console.log("ThaID Exchange completed. PID:", pid, "Fields:", Object.keys(userInfo));

    completeRegRequest(requestId, userInfo, pid || "");
    return true;
  } catch (err) {
    console.error("exchangeCodeAndComplete error:", err);
  }
  return false;
}

export async function getRegStatus(requestId) {
  if (!requestId) return { status: "not_found" };
  const entry = global.thaidRegStore.get(requestId);
  if (!entry) return { status: "not_found" };

  if (Date.now() > entry.expiresAt) {
    global.thaidRegStore.delete(requestId);
    return { status: "expired" };
  }

  if (entry.status === "completed") {
    return { status: "completed", data: entry.data };
  }

  // หากอยู่ในสถานะ pending ให้ตรวจสอบ transaction กับทาง DOPA โดยตรง
  if (entry.dopaTxId && !entry.isExchanging) {
    try {
      const dopaRes = await fetch(
        `https://imauth.bora.dopa.go.th/api/v2/oauth2/public/transactions/${entry.dopaTxId}/`,
        { cache: "no-store" }
      );
      
      const dopaJson = await dopaRes.json().catch(() => null);
      const isApproved =
        dopaRes.status === 201 ||
        Boolean(dopaJson?.data?.redirectUri) ||
        Boolean(dopaJson?.data?.code);

      console.log(`[ThaID-Poll] req: ${requestId.substring(0, 10)}... | DOPA HTTP: ${dopaRes.status} | isApproved: ${isApproved} | scan: ${dopaJson?.data?.isScan}`);

      if (isApproved && dopaJson) {
        console.log("[ThaID] Transaction APPROVED by citizen for:", requestId, dopaJson);
        const code =
          dopaJson.data?.code ||
          (dopaJson.data?.redirectUri ? new URL(dopaJson.data.redirectUri).searchParams.get("code") : null);

        if (code) {
          entry.isExchanging = true;
          try {
            await exchangeCodeAndComplete(requestId, code);
          } finally {
            entry.isExchanging = false;
          }
          const updated = global.thaidRegStore.get(requestId);
          if (updated && updated.status === "completed") {
            return { status: "completed", data: updated.data };
          }
        }
      }
    } catch (dopaErr) {
      console.warn("[ThaID-Poll] Check DOPA error:", dopaErr.message);
    }
  }

  return { status: "pending", expiresAt: entry.expiresAt };
}

export function completeRegRequest(requestId, userInfo, pid) {
  if (!requestId) return false;
  const entry = global.thaidRegStore.get(requestId);
  if (!entry) return false;

  const cardData = formatThaIDToCardData(userInfo, pid);
  entry.status = "completed";
  entry.data = cardData;
  entry.completedAt = Date.now();
  global.thaidRegStore.set(requestId, entry);
  return true;
}
