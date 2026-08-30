// lib/utils/getHeaderRequest.js
import "server-only";

/**
 * แปลง input ให้กลายเป็น object ที่มี .get(headerName) ใช้ได้
 * รองรับทั้ง:
 *  - Request (มี .headers.get)
 *  - Headers
 *  - obj ธรรมดา { "user-agent": "...", "x-real-ip": "..." }
 */
function normalizeHeaders(input) {
  if (!input) return null;

  // ถ้าเป็น Headers หรือ Request-like ที่มี .get() อยู่แล้ว
  if (typeof input.get === "function") {
    return input;
  }

  // ถ้าเป็น Request ที่มี .headers.get()
  if (input.headers && typeof input.headers.get === "function") {
    return input.headers;
  }

  // ถ้าเป็น object ธรรมดา ให้สร้าง wrapper ที่มี .get()
  if (typeof input === "object") {
    const raw = input;
    return {
      get(name) {
        if (!raw) return null;
        const keyLower = name.toLowerCase();

        // รองรับทั้ง key ตรง ๆ และ key แบบ lower-case
        const direct = raw[name] ?? raw[keyLower];
        if (direct == null) return null;

        if (Array.isArray(direct)) return direct[0];
        return String(direct);
      },
    };
  }

  return null;
}

/**
 * ดึง IP จาก header (รองรับ Cloudflare / NGINX / Vercel)
 * @param {Request|Headers|Object} input - Request, Headers หรือ object header ธรรมดา
 * @returns {string|null}
 */
export function getIp(input) {
  const h = normalizeHeaders(input);
  if (!h) return null;

  const xForwardedFor = h.get("x-forwarded-for");

  const ip =
    h.get("cf-connecting-ip") || // Cloudflare
    h.get("x-real-ip") || // NGINX / Vercel
    (xForwardedFor ? xForwardedFor.split(",")[0].trim() : null) ||
    null;

  return ip;
}

/**
 * ดึง OS จาก User-Agent แบบง่าย ๆ
 * @param {Request|Headers|Object} input
 * @returns {string} - เช่น "Windows", "macOS", "Android", "iOS", "Linux", "Unknown"
 */
export function getOs(input) {
  const h = normalizeHeaders(input);
  if (!h) return "Unknown";

  const ua = (h.get("user-agent") || "").toLowerCase();
  if (!ua) return "Unknown";

  if (ua.includes("windows nt")) return "Windows";
  if (ua.includes("mac os x") || ua.includes("macintosh")) return "macOS";
  if (ua.includes("android")) return "Android";
  if (ua.includes("iphone") || ua.includes("ipad") || ua.includes("ipod")) return "iOS";
  if (ua.includes("linux")) return "Linux";

  return "Unknown";
}

/**
 * ดึง Platform จาก User-Agent
 * @param {Request|Headers|Object} input
 * @returns {string} - เช่น "mobile", "tablet", "desktop", "bot", "unknown"
 */
export function getPlatform(input) {
  const h = normalizeHeaders(input);
  if (!h) return "unknown";

  const ua = (h.get("user-agent") || "").toLowerCase();
  if (!ua) return "unknown";

  // bot / crawler
  if (
    ua.includes("bot") ||
    ua.includes("crawler") ||
    ua.includes("spider") ||
    ua.includes("crawling")
  ) {
    return "bot";
  }

  // mobile / tablet
  if (ua.includes("ipad") || ua.includes("tablet")) return "tablet";
  if (
    ua.includes("mobile") ||
    ua.includes("iphone") ||
    (ua.includes("android") && !ua.includes("tablet"))
  ) {
    return "mobile";
  }

  // ถ้าไม่เข้าเคสข้างบน ก็ถือเป็น desktop
  return "desktop";
}

/**
 * ดึง Browser จาก User-Agent
 * @param {Request|Headers|Object} input
 * @returns {string} - เช่น "Chrome", "Firefox", "Safari", "Edge", "Opera", "IE", "Unknown"
 */
export function getBrowser(input) {
  const h = normalizeHeaders(input);
  if (!h) return "Unknown";

  const ua = (h.get("user-agent") || "").toLowerCase();
  if (!ua) return "Unknown";

  // ลำดับสำคัญ เพราะ UA ของ Edge/Opera มีคำว่า chrome ด้วย
  if (ua.includes("edg/")) return "Edge"; // Chromium-based Edge
  if (ua.includes("opr/") || ua.includes("opera")) return "Opera";
  if (ua.includes("chrome") && !ua.includes("edg/") && !ua.includes("opr/")) return "Chrome";
  if (ua.includes("safari") && !ua.includes("chrome")) return "Safari";
  if (ua.includes("firefox")) return "Firefox";
  if (ua.includes("msie") || ua.includes("trident")) return "IE";

  return "Unknown";
}

/**
 * ฟังก์ชันรวม เผื่ออยากเรียกทีเดียวแล้วได้ข้อมูล client ครบชุด
 * @param {Request|Headers|Object} input
 * @returns {{ ip: string|null, os: string, platform: string, browser: string }}
 */
export function getClientInfo(input) {
  return {
    ip: getIp(input),
    os: getOs(input),
    platform: getPlatform(input),
    browser: getBrowser(input),
  };
}
