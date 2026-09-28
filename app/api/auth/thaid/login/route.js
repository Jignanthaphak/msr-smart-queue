// FILE: app/api/auth/thaid/login/route.js
"use server";
import "server-only";

import { NextResponse } from "next/server";
import { randomBytes } from "crypto";

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

export async function GET(req) {
  const basePath = process.env.NEXT_PUBLIC_BASE_PATH || "/msr";
  const origin = getPublicOrigin(req);

    const VERIFIED_CLIENT_ID = "clN3cXlFTUtaTDZtSXdtSWN5Nno0OXcxdkg1YXVLa2g";
    let clientId = process.env.THAID_CLIENT_ID || VERIFIED_CLIENT_ID;
    if (!clientId || clientId.includes("clN3cIFTU")) {
      clientId = VERIFIED_CLIENT_ID;
    }

    const redirectUri = process.env.THAID_REDIRECT_URI || "https://mhc4.dmh.go.th/msr/api/auth/thaid/callback";
    const authUrlBase = process.env.THAID_AUTH_URL || "https://imauth.bora.dopa.go.th/api/v2/oauth2/auth/";
    const scope =
      process.env.THAID_SCOPE ||
      "openid pid title given_name family_name title_en given_name_en family_name_en birthdate gender address ial";

    // Generate secure random state for CSRF protection
    const state = randomBytes(32).toString("hex");

    const authUrl = new URL(authUrlBase);
    authUrl.searchParams.set("response_type", "code");
    authUrl.searchParams.set("client_id", clientId);
    authUrl.searchParams.set("redirect_uri", redirectUri);
    authUrl.searchParams.set("scope", scope);
    authUrl.searchParams.set("state", state);

    const response = NextResponse.redirect(authUrl.toString());

    // Save state in secure HTTP-only cookie with 10-minute expiry
    response.cookies.set("thaid_oauth_state", state, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 600, // 10 minutes
      path: "/",
    });

    return response;
  } catch (error) {
    console.error("ThaID Login Route Error:", error);
    const loginUrl = new URL(
      `${basePath}/login?error=thaid_failed&message=` + encodeURIComponent(error.message || "เกิดข้อผิดพลาดในการเชื่อมต่อ ThaID"),
      origin
    );
    return NextResponse.redirect(loginUrl);
  }
}
