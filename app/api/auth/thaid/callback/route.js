// FILE: app/api/auth/thaid/callback/route.js
"use server";
import "server-only";

import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getIronSession } from "iron-session";
import { randomBytes, randomUUID } from "crypto";
import { UAParser } from "ua-parser-js";

import { sessionOptions } from "@/lib/session";
import { createAuthLog } from "@/lib/serviceActions/authActions";
import { nowMs } from "@/lib/utils/dateFormat";
import { modelAccountByPidOrUsername } from "@/model/account";

function getPublicOrigin(req) {
  const forwardedProto = req?.headers?.get("x-forwarded-proto") || "https";
  const forwardedHost = req?.headers?.get("x-forwarded-host") || req?.headers?.get("host");

  if (forwardedHost && !forwardedHost.includes("localhost") && !forwardedHost.includes("127.0.0.1")) {
    return `${forwardedProto}://${forwardedHost}`;
  }

  if (process.env.APP_URL) {
    return process.env.APP_URL.replace(/\/$/, "");
  }

  return "https://mhc4.dmh.go.th";
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

export async function GET(req) {
  const basePath = process.env.NEXT_PUBLIC_BASE_PATH || "/msr";
  const origin = getPublicOrigin(req);

  // Helper redirect to login with error
  const redirectToLogin = (errorType, message = "") => {
    let target = `${basePath}/login?error=${encodeURIComponent(errorType)}`;
    if (message) {
      target += `&message=${encodeURIComponent(message)}`;
    }
    const res = NextResponse.redirect(new URL(target, origin));
    res.cookies.delete("thaid_oauth_state");
    return res;
  };

  try {
    const { searchParams } = req.nextUrl;
    const code = searchParams.get("code");
    const state = searchParams.get("state");
    const error = searchParams.get("error");
    const errorDescription = searchParams.get("error_description");

    if (error) {
      console.error("ThaID returned error:", error, errorDescription);
      return redirectToLogin("thaid_failed", errorDescription || error);
    }

    if (!code) {
      return redirectToLogin("thaid_failed", "ไม่ได้รับ Authorization Code จาก ThaID");
    }

    // Verify state against cookie
    const savedState = req.cookies.get("thaid_oauth_state")?.value;
    if (!savedState || savedState !== state) {
      console.warn("ThaID state mismatch:", { savedState, state });
      return redirectToLogin("thaid_invalid_state");
    }

    const clientId = process.env.THAID_CLIENT_ID;
    const clientSecret = process.env.THAID_CLIENT_SECRET;
    const apiKey = process.env.THAID_API_KEY;
    const redirectUri = process.env.THAID_REDIRECT_URI || "https://mhc4.dmh.go.th/msr";
    const tokenUrl = process.env.THAID_TOKEN_URL || "https://imauth.bora.dopa.go.th/api/v2/oauth2/token/";
    const userInfoUrl = process.env.THAID_USERINFO_URL || "https://imauth.bora.dopa.go.th/api/v2/oauth2/userinfo/";

    if (!clientId || !clientSecret) {
      return redirectToLogin("thaid_failed", "ระบบยังไม่ได้ตั้งค่า THAID_CLIENT_ID หรือ THAID_CLIENT_SECRET");
    }

    // 1) Exchange Authorization Code for Access Token
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
      console.error("ThaID Token Exchange Failed:", tokenResponse.status, errText);
      return redirectToLogin("thaid_failed", `แลกเปลี่ยน Token ไม่สำเร็จ (${tokenResponse.status})`);
    }

    const tokenData = await tokenResponse.json();
    const accessToken = tokenData.access_token;
    if (!accessToken) {
      return redirectToLogin("thaid_failed", "ไม่พบ Access Token ในการตอบกลับจาก ThaID");
    }

    // 2) Extract User Information (from id_token, tokenData, and UserInfo endpoint)
    let pid = tokenData.pid || null;
    let userInfo = {};

    if (tokenData.userinfo && typeof tokenData.userinfo === "object") {
      userInfo = { ...tokenData.userinfo };
      pid = pid || tokenData.userinfo.pid || tokenData.userinfo.sub;
    }

    // Decode id_token if present
    if (tokenData.id_token) {
      const decoded = decodeJwtPayload(tokenData.id_token);
      if (decoded) {
        userInfo = { ...userInfo, ...decoded };
        pid = pid || decoded.pid || decoded.sub;
      }
    }

    // Fetch UserInfo endpoint
    try {
      let userinfoResponse = await fetch(userInfoUrl, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      if (!userinfoResponse.ok && apiKey) {
        userinfoResponse = await fetch(userInfoUrl, {
          method: "GET",
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "x-api-key": apiKey,
          },
        });
      }

      if (userinfoResponse.ok) {
        const info = await userinfoResponse.json();
        userInfo = { ...userInfo, ...info };
        pid = pid || info.pid || info.sub;
      } else {
        const errText = await userinfoResponse.text();
        console.warn("ThaID UserInfo fetch status:", userinfoResponse.status, errText);
      }
    } catch (uiErr) {
      console.warn("ThaID UserInfo fetch error:", uiErr);
    }

    if (!pid) {
      console.error("ThaID missing pid:", { tokenDataKeys: Object.keys(tokenData), userInfo });
      const availableKeys = Object.keys(userInfo).length > 0 ? Object.keys(userInfo).join(", ") : Object.keys(tokenData).join(", ");
      return redirectToLogin("thaid_failed", `ไม่พบเลขประจำตัวประชาชน (pid) จาก ThaID (ข้อมูลที่พบ: ${availableKeys || "ไม่มี"})`);
    }

    // 3) Prepare Session & Log Metadata
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

    // 4) Lookup user in tbl_account by citizen_id (or pid / username)
    const account = await modelAccountByPidOrUsername(pid);

    if (!account) {
      // Log failed login attempt
      try {
        await createAuthLog({
          event_type: "login_failed",
          reason: `ThaID ไม่พบบัญชีผู้ใช้ที่มีเลขบัตรประชาชน (citizen_id): ${pid}`,
          user_data: JSON.stringify({ pid, userInfo }),
          sessionId,
          userId: null,
          userName: pid,
          nickName: userInfo.name || `${userInfo.given_name || ''} ${userInfo.family_name || ''}`.trim() || null,
          isLoggedIn: false,
          isAdminPanel: false,
          isRole: null,
          expiredAt,
          csrfToken,
          ip,
          ua: userAgent,
        });
      } catch (logErr) {
        console.warn("createAuthLog error:", logErr);
      }

      return redirectToLogin("thaid_not_found");
    }

    // 5) Build session data
    const dataSession = {
      sessionId,
      userId: account.user_id || null,
      userName: account.username || pid,
      nickName: account.nickname || userInfo.name || null,
      citizenId: account.citizen_id || pid,
      isLoggedIn: true,
      isAdminPanel: account.is_admin_panel || false,
      isRole: account.role_id || null,
      expiredAt,
      csrfToken,
      ip,
      ua: userAgent,
    };

    // 6) Log success
    try {
      await createAuthLog({
        event_type: "login_success",
        reason: "ThaID Login",
        user_data: JSON.stringify({
          account,
          thaid: {
            pid,
            citizen_id: account.citizen_id || pid,
            name: userInfo.name,
            ial: userInfo.ial,
          },
        }),
        ...dataSession,
      });
    } catch (logErr) {
      console.warn("createAuthLog error:", logErr);
    }

    // 7) Set session and redirect to home / dashboard
    // ใช้ cookieStore บันทึก session โดยตรง เพื่อความเข้ากันได้กับ Next.js 16
    const cookieStore = await cookies();
    cookieStore.delete("thaid_oauth_state");

    const session = await getIronSession(cookieStore, {
      ...sessionOptions,
      cookieOptions: {
        ...sessionOptions.cookieOptions,
        path: "/",
        sameSite: "lax",
      },
    });

    session.user = dataSession;
    session.csrfToken = csrfToken;
    await session.save();

    const sealedSession = cookieStore.get(sessionOptions.cookieName)?.value;

    const redirectRes = NextResponse.redirect(new URL(`${basePath}/`, origin));
    
    // ตั้งค่า Cookie ลงใน Response ตรงๆ ด้วย path="/" และ sameSite="lax" เพื่อป้องกันปัญหา Cookie หาย
    if (sealedSession) {
      redirectRes.cookies.set(sessionOptions.cookieName, sealedSession, {
        ...sessionOptions.cookieOptions,
        path: "/",
        sameSite: "lax",
      });
    }

    return redirectRes;
  } catch (err) {
    console.error("ThaID Callback Exception:", err);
    return redirectToLogin("thaid_failed", err.message || "เกิดข้อผิดพลาดในการประมวลผล ThaID");
  }
}
