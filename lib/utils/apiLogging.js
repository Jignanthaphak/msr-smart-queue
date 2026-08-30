// FILE: /lib/utils/apiLogging.js
import "server-only";

import { NextResponse } from "next/server";
import { logApiRequest } from "@/lib/utils/requestLogger";

/**
 * สร้าง context สำหรับใช้ใน API handler
 *
 * @param {Request} req
 * @param {object} [options]
 * @param {string} [options.routePath]
 * @param {string} [options.defaultMessage]
 * @param {"info"|"warning"|"error"} [options.defaultLevel]
 */
export function createApiContext(req, options = {}) {
  const { routePath, defaultMessage = "", defaultLevel = "info" } = options;

  return {
    req,
    routePath: routePath || req.nextUrl?.pathname || "",
    method: req.method || "GET",
    start: Date.now(),

    // ค่าเริ่มต้นของข้อมูล log
    statusCode: 200,
    level: defaultLevel,
    message: defaultMessage,
    extra: {},
    session: null, // ให้ handler ตั้งเป็น { user: dataSession } ถ้าต้องการ log user
  };
}

/**
 * ห่อ API handler ให้มี try/catch/finally และ log อัตโนมัติ
 *
 * ใช้แบบ:
 *   export const POST = withApiLogging(async (req, ctx) => { ... }, { routePath: "/api/..." })
 *
 * @param {(req: Request, ctx: ReturnType<typeof createApiContext>) => Promise<Response>} handler
 * @param {object} [options]
 * @param {string} [options.routePath]
 * @param {string} [options.defaultMessage]
 * @param {"info"|"warning"|"error"} [options.defaultLevel]
 */
export function withApiLogging(handler, options = {}) {
  const { routePath, defaultMessage = "", defaultLevel = "info" } = options;

  return async function wrapped(req, ...rest) {
    const ctx = createApiContext(req, {
      routePath,
      defaultMessage,
      defaultLevel,
    });

    let res;

    try {


      // ให้ handler ทำงานตามปกติ
      res = await handler(req, ctx, ...rest);

      if (!res) {
        // กัน handler ลืม return
        throw new Error("Handler did not return a Response or NextResponse");
      }

      // ถ้า handler ไม่ได้ตั้ง ctx.statusCode เอง ให้ sync จาก res
    
      ctx.statusCode = res.status;
      ctx.message = res.message;

    } catch (err) {
   
        // เคส unexpected error เช่น DB ล้ม, bug
        const status = err.status || 500;
        const extra = err.extra ? err.extra : ctx.extra ? ctx.extra : {};
        ctx.statusCode = status;
        ctx.level = status === 500 ? "error" : "warning";
        ctx.message = err.message || "Server error";
        ctx.extra = {
          ...(extra),
          errorName: err.name,
        };

        res = NextResponse.json(
          {
            error: status !== 500 ? err.message : "Server error",
          },
          { status }
        );
    

      
    } finally {


      // เขียน log เสมอไม่ว่าจะ success หรือ error
      try {
        await logApiRequest({
          req,
          route: ctx.routePath || req.nextUrl?.pathname || "",
          method: ctx.method,
          statusCode: ctx.statusCode,
          level: ctx.level,
          message: ctx.message,
          durationMs: Date.now() - ctx.start,
          session: ctx.session,
          extra: ctx.extra,
        });
      } catch (logErr) {
        console.error("logApiRequest error (withApiLogging):", logErr);
      }


    }

    return res;
  };
}
