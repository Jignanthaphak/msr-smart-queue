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

export function parseThaIDAddress(userInfo) {
  let raw = "";
  if (typeof userInfo.house_address === "string") {
    raw = userInfo.house_address;
  } else if (userInfo.house_address?.raw) {
    raw = userInfo.house_address.raw;
  } else if (typeof userInfo.address === "string") {
    raw = userInfo.address;
  } else if (userInfo.address?.raw) {
    raw = userInfo.address.raw;
  }

  if (raw && raw.includes("#")) {
    const parts = raw.split("#").map((s) => (s || "").trim());
    return {
      houseno: parts[0] || "",
      moo: parts[1] ? parts[1].replace(/^(หมู่ที่|หมู่)\s*/, "") || parts[1] : "",
      trok: parts[2] || "",
      soi: parts[3] || "",
      road: parts[4] || "",
      subdistrict: parts[5] ? parts[5].replace(/^(ตำบล|แขวง)\s*/, "") : "",
      district: parts[6] ? parts[6].replace(/^(อำเภอ|เขต)\s*/, "") : "",
      province: parts[7] ? parts[7].replace(/^(จังหวัด)\s*/, "") : "",
    };
  }

  return {
    houseno: userInfo.house_no || userInfo.houseNo || "",
    moo: userInfo.moo || userInfo.village_no || "",
    trok: userInfo.trok || "",
    soi: userInfo.soi || "",
    road: userInfo.road || "",
    subdistrict: userInfo.subdistrict || userInfo.tumbol || "",
    district: userInfo.district || userInfo.amphur || "",
    province: userInfo.province || userInfo.changwat || "",
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
  let prefixTH = userInfo.title || "";
  let firstNameTH = userInfo.given_name || "";
  let lastNameTH = userInfo.family_name || "";
  let prefixEN = userInfo.title_en || "";
  let firstNameEN = userInfo.given_name_en || "";
  let lastNameEN = userInfo.family_name_en || "";

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
    citizenId: pid,
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

export async function createRegRequest() {
  const clientId = process.env.THAID_CLIENT_ID || "clN3cIFTUtaTDZtSXdtSWN5Nno0OXcxdkg1YXVLa2g";
  const redirectUri = process.env.THAID_REDIRECT_URI || "https://mhc4.dmh.go.th/msr/api/auth/thaid/callback";
  const authUrlBase = process.env.THAID_AUTH_URL || "https://imauth.bora.dopa.go.th/api/v2/oauth2/auth/";
  const scope =
    process.env.THAID_SCOPE ||
    "openid pid title given_name family_name name title_en given_name_en family_name_en name_en birthdate gender address house_address ial";

  const requestId = "reg_" + randomBytes(16).toString("hex");

  const authUrl = new URL(authUrlBase);
  authUrl.searchParams.set("response_type", "code");
  authUrl.searchParams.set("client_id", clientId);
  authUrl.searchParams.set("redirect_uri", redirectUri);
  authUrl.searchParams.set("scope", scope);
  authUrl.searchParams.set("state", requestId);

  const finalUrl = authUrl.toString();

  // สร้าง QR Code เป็น Base64 Data URL แบบ Local 100% ไม่พึ่งพา Server ภายนอก
  const qrDataUrl = await QRCode.toDataURL(finalUrl, {
    width: 280,
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
    data: null,
  });

  return {
    requestId,
    authUrl: finalUrl,
    qrDataUrl,
    expiresAt,
  };
}

export function getRegStatus(requestId) {
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
