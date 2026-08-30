// FILE: app/api/auth/logout/route.js
"use server";
import "server-only";

import { NextResponse } from "next/server";
import { UAParser } from "ua-parser-js";

import { checkAccountPermission } from "@/lib/utils/permissionRouteCheck";
import { getSession } from "@/lib/session";
import { createAuthLog } from "@/lib/serviceActions/authActions";
import { withApiLogging } from "@/lib/utils/apiLogging";

const ROUTE_PATH = "/api/auth/logout";

async function logoutHandler(req, ctx) {

  // 1) ตรวจสิทธิ์การใช้งานก่อน (จะ throw ถ้าไม่มีสิทธิ์ / session หมดอายุ)
  //    withApiLogging จะจับ error นี้ไปแปลงเป็น JSON + log ให้
  const {account} = await checkAccountPermission(req);

  const user_data = JSON.stringify(account);

  // 2) เตรียม response สำหรับส่งออกไป
  const res = NextResponse.json(
    { message: "Logout สำเร็จ" },
    { status: 200 }
  );

  // 3) ผูก session กับ response นี้ เพื่อให้ iron-session ลบ cookie ให้ได้
  const session = await getSession(req, res);

  if (!session?.user) {
    throw Object.assign(new Error("ไม่พบข้อมูลการเข้าสู่ระบบ"), { status: 401 });
  }

  // 4) เตรียมข้อมูลสำหรับบันทึก auth log (ตาราง auth_logs)
  const ipHeader = req.headers.get("x-forwarded-for") || "";
  const ip = ipHeader.split(",")[0].trim() || ipHeader || "";

  const rawUA = req.headers.get("user-agent") || "";
  const parsedUA = new UAParser(rawUA);
  const userAgent = {
    browser: parsedUA.getBrowser().name || "",
    os: parsedUA.getOS().name || "",
  };

  const dataSession = {
    sessionId: session?.user?.sessionId || null,
    userId: session?.user?.userId || null,
    userName: session?.user?.userName || null,
    ip,          
    ua: userAgent,
    event_type: "logout",
    reason:null,
    user_data
  };

  // 5) ทำลาย session (iron-session จะล้าง cookie ให้ใน res)
  await session.destroy();

  // 6) บันทึก event logout ลง auth_logs
  await createAuthLog(dataSession);

  // 7) ตั้งค่าข้อมูลสำหรับเขียน log โดย withApiLogging
  ctx.session = { user: dataSession };

  // 8) คืน response นี้ (withApiLogging จะไป log ต่อให้เอง)
  return res;

}

// export แบบใช้ HOF
export const POST = withApiLogging(logoutHandler, {
  routePath: ROUTE_PATH,
  defaultMessage: "",
  defaultLevel: "info",
});