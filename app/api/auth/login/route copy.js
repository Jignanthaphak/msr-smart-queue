// FILE: app/api/auth/login/route.js
"use server";
import "server-only";

import { NextResponse } from "next/server";
import { randomBytes, randomUUID } from "crypto";
import bcrypt from "bcryptjs";

import { getSession, sessionOptions } from "@/lib/session";
import { BaseSchema } from "@/lib/validators/form/login/schema";
import { UAParser } from "ua-parser-js";
import { createAuthLog } from "@/lib/serviceActions/authActions";
import { nowMs } from "@/lib/utils/dateFormat";
import { modelAccount } from "@/model/account";

import { ApiError } from "@/lib/utils/apiError";
import { withApiLogging } from "@/lib/utils/apiLogging";

const ROUTE_PATH = "/api/auth/login";

async function verifyPassword(plainPassword, storedHash) {
  if (!storedHash) return false;

  const isBcrypt =
    storedHash.startsWith("$2a$") ||
    storedHash.startsWith("$2b$") ||
    storedHash.startsWith("$2y$");

  if (!isBcrypt) {
    // ถ้าไม่ใช่ bcrypt ให้ถือว่าไม่ปลอดภัย → login ไม่ผ่าน
    return false;
  }

  return bcrypt.compare(plainPassword, storedHash);
}

/**
 * ตัว handler หลัก (ไม่มี try/catch/finally แล้ว)
 * ปล่อยให้ withApiLogging จัดการ error + logging
 *
 * @param {Request} req
 * @param {ReturnType<createApiContext>} ctx
 * @returns {Promise<Response>}
 */
async function loginHandler(req, ctx) {
  // 1) เช็ก content-type
  const contentType = req.headers.get("content-type") || "";
  if (!contentType.includes("application/json")) {
    throw ApiError.badRequest("Bad Request", {
      reason: "content-type must be application/json",
    });
  }

  // 2) อ่าน body + validate ด้วย Zod
  const body = await req.json();
  const parse = BaseSchema.omit({ new_password: true }).safeParse(body);
  if (!parse.success) {
    const msg = parse.error.issues[0]?.message || "Validation error";
    throw ApiError.badRequest(msg, { reason: "zod validation failed" });
  }

  const { username, password } = parse.data;

  // 3) ดึง account จาก DB
  const whereAccount = [
    { type: "and", field: "username", operator: "=", value: username },
  ];

  const data = await modelAccount({ whereAccount });
  const account = Array.isArray(data) ? data[0] : data || null;

  // 4) เตรียมข้อมูล session base
  const expiredAt = nowMs() + sessionOptions.cookieOptions.maxAge * 1000;
  const csrfToken = randomBytes(32).toString("hex");

  const ipHeader = req.headers.get("x-forwarded-for") || "";
  const ip = ipHeader.split(",")[0].trim() || ipHeader || "";
  const rawUA = req.headers.get("user-agent") || "";
  const parsedUA = new UAParser(rawUA);
  const userAgent = {
    browser: parsedUA.getBrowser().name || "",
    os: parsedUA.getOS().name || "",
  };

  const sessionId = randomUUID();

  const dataSession = {
    sessionId,
    userId: account?.user_id || null,
    userName: account?.username || username,
    nickName: account?.nickname || null,
    isLoggedIn: true,
    isAdminPanel: account?.is_admin_panel || false,
    isRole: account?.role_id || null,
    expiredAt,
    csrfToken,
    ip,
    ua: userAgent,
  };

  // response กลับไปไม่ควรมี ip / ua
  const responseData = { ...dataSession };
  delete responseData.ip;
  delete responseData.ua;

  const user_data = JSON.stringify(account);

  // 5) ตรวจสอบว่าเจอ account ไหม
  if (!account) {
    const reason = "ไม่พบบัญชีผู้ใช้";

    await createAuthLog({
      event_type: "login_failed",
      reason,
      user_data,
      ...dataSession,
    });

    throw ApiError.unauthorized(reason, { username });
  }

  // 6) ตรวจสอบรหัสผ่าน
  const passwordOk = await verifyPassword(password, account.password);
  if (!passwordOk) {
    const isHashNotBcrypt =
      account.password &&
      !(
        account.password.startsWith("$2a$") ||
        account.password.startsWith("$2b$") ||
        account.password.startsWith("$2y$")
      );

    let reason;
    let hashType;
    if (isHashNotBcrypt) {
      reason =
        "รูปแบบรหัสผ่านไม่ปลอดภัย กรุณาติดต่อผู้ดูแลระบบเพื่อเปลี่ยนรหัสผ่าน";
      hashType = "legacy";
    } else {
      reason = "รหัสผ่านไม่ถูกต้อง";
      hashType = "bcrypt";
    }

    await createAuthLog({
      event_type: "login_failed",
      reason,
      user_data,
      ...dataSession,
    });

    throw ApiError.unauthorized(reason, {
      username,
      hashType,
    });
  }

  // 7) login success → บันทึก auth log
  await createAuthLog({
    event_type: "login_success",
    reason: null,
    user_data,
    ...dataSession,
  });

  // 8) สร้าง response + session
  const res = NextResponse.json(responseData, { status: 200 });
  const session = await getSession(req, res);

  session.user = dataSession;
  session.csrfToken = csrfToken;
  await session.save();

  // 9) ตั้งค่าข้อมูลสำหรับ log ผ่าน ctx
  ctx.statusCode = 200;
  ctx.level = "info";
  ctx.message = "login success";
  ctx.session = { user: dataSession };
  ctx.extra = { username, userId: account.user_id };

  return res;
}

// export แบบใช้ HOF
export const POST = withApiLogging(loginHandler, {
  routePath: ROUTE_PATH,
  defaultMessage: "login",
  defaultLevel: "info",
});
