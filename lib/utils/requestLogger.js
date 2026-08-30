// FILE: /lib/utils/requestLogger.js
"use server";
import "server-only";

import fs from "fs";
import path from "path";
import { randomUUID } from "crypto";
import { getClientInfo } from "@/lib/utils/getHeaderRequest";
import { date, datetime, nowDate } from "@/lib/utils/dateFormat";

// กำหนด ROOT ของโปรเจค (จุดที่รัน next)
const PROJECT_ROOT = process.cwd();

/**
 * LOG_ROOT ใช้ตามลำดับ:
 * 1) ถ้ามี process.env.LOG_ROOT:
 *    - ถ้าเป็น path แบบ absolute → ใช้ตรง ๆ
 *    - ถ้าเป็น path แบบ relative → join กับ PROJECT_ROOT
 * 2) ถ้าไม่มี → default = <project root>/logs
 */
const LOG_ROOT = (() => {
  const envRoot = process.env.LOG_ROOT;
  if (envRoot) {
    if (path.isAbsolute(envRoot)) {
      return envRoot;
    }
    return path.join(PROJECT_ROOT, envRoot);
  }
  return path.join(PROJECT_ROOT, "logs");
})();

function getLogFilePath(kind = "api", level = "access") {
  const dateStr = date(); // YYYY-MM-DD
  return path.join(LOG_ROOT, kind, `${level}-${dateStr}.log`);
}

async function appendLogLine(filePath, data) {
  try {
    await fs.promises.mkdir(path.dirname(filePath), { recursive: true });
    await fs.promises.appendFile(filePath, JSON.stringify(data) + "\n", "utf8");
  } catch (err) {
    // ห้ามให้การเขียน log ทำให้ request ล้ม
    console.error("write log error:", err);
  }
}

/**
 * helper: ดึงค่า header แบบยืดหยุ่น
 * รองรับ:
 *  - Request (มี .headers.get)
 *  - Headers
 *  - object ธรรมดา { "user-agent": "...", "x-real-ip": "..." }
 */
function getHeaderValue(input, name) {
  if (!input) return "";

  // ถ้าเป็น Request ที่มี .headers.get()
  if (input.headers && typeof input.headers.get === "function") {
    return input.headers.get(name) || "";
  }

  // ถ้าเป็น Headers ที่มี .get()
  if (typeof input.get === "function") {
    return input.get(name) || "";
  }

  // ถ้าเป็น object ธรรมดา
  if (typeof input === "object") {
    const lower = name.toLowerCase();
    const val = input[name] ?? input[lower];
    if (val == null) return "";
    if (Array.isArray(val)) return String(val[0] ?? "");
    return String(val);
  }

  return "";
}

/**
 * log สำหรับ API Route (app/api/...)
 *
 * @param {Object} params
 * @param {Request|Headers|Object} params.req - NextRequest, Request หรือ header object
 * @param {string} params.route - path หรือชื่อ handler เช่น "/api/person"
 * @param {string} params.method - HTTP method เช่น "GET"
 * @param {number} params.statusCode
 * @param {string} [params.level="info"] - "info" | "error"
 * @param {string} [params.message]
 * @param {number} [params.durationMs]
 * @param {Object} [params.session] - session object (optional)
 * @param {Object} [params.extra] - field เพิ่มเติม เช่น { hn, resultCount }
 */
export async function logApiRequest({
  req,
  route,
  method,
  statusCode,
  level = "info",
  message = "",
  durationMs,
  session,
  extra = {},
}) {
  const now = new Date();

  // ใช้ req เป็น source ของ header (รองรับทั้ง Request, Headers, obj)
  const headerSource = req || null;

  const userAgent = getHeaderValue(headerSource, "user-agent");
  const referer = getHeaderValue(headerSource, "referer");

  // ใช้ util รวมในการดึง ip, os, platform, browser
  const clientInfo = getClientInfo(headerSource);
  const { ip, os, platform, browser } = clientInfo;

  const logItem = {
    datetime: datetime(),
    source: "api",
    level,
    route,
    method,
    statusCode,
    message,
    durationMs,
    requestId: randomUUID(),

    client: {
      ip,
      userAgent,
      referer,
      os,
      platform,
      browser,
    },

    user: session?.user
      ? {
          userId: session.user.userId,
          roleId: session.user.roleId,
          sessionId: session.user.sessionId,
        }
      : null,

    extra,
  };

  const accessFile = getLogFilePath("api", level === "error" ? "error" : "access");
  const combinedFile = getLogFilePath("combined", "combined");

  await Promise.all([
    appendLogLine(accessFile, logItem),
    appendLogLine(combinedFile, logItem),
  ]);
}

/**
 * log สำหรับ Server Action
 *
 * @param {Object} params
 * @param {Request|Headers|Object} [params.req] - ถ้า server action รับ req หรือ headers มาด้วยให้ส่งมา จะได้ log client ได้
 * @param {string} params.actionName - ชื่อ action เช่น "actions/admin/person/editPersonAction"
 * @param {string} [params.method="SERVER_ACTION"]
 * @param {number} params.statusCode
 * @param {string} [params.level="info"]
 * @param {string} [params.message]
 * @param {number} [params.durationMs]
 * @param {Object} [params.session]
 * @param {Object} [params.extra]
 */
export async function logActionCall({
  req,
  actionName,
  method = "SERVER_ACTION",
  statusCode,
  level = "info",
  message = "",
  durationMs,
  session,
  extra = {},
}) {
  const now = new Date();
  const headerSource = req || null;

  const userAgent = headerSource ? getHeaderValue(headerSource, "user-agent") : "";
  const referer = headerSource ? getHeaderValue(headerSource, "referer") : "";

  const clientInfo = headerSource ? getClientInfo(headerSource) : null;
  const ip = clientInfo?.ip ?? null;
  const os = clientInfo?.os ?? "Unknown";
  const platform = clientInfo?.platform ?? "unknown";
  const browser = clientInfo?.browser ?? "Unknown";

  const logItem = {
    datetime: datetime(),
    source: "action",
    level,
    actionName,
    method,
    statusCode,
    message,
    durationMs,
    requestId: randomUUID(),

    client: headerSource
      ? {
          ip,
          userAgent,
          referer,
          os,
          platform,
          browser,
        }
      : null,

    user: session?.user
      ? {
          userId: session.user.userId,
          roleId: session.user.roleId,
          sessionId: session.user.sessionId,
        }
      : null,

    extra,
  };

  const accessFile = getLogFilePath("action", level === "error" ? "error" : "access");
  const combinedFile = getLogFilePath("combined", "combined");

  await Promise.all([
    appendLogLine(accessFile, logItem),
    appendLogLine(combinedFile, logItem),
  ]);
}
