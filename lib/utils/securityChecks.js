// /lib/utils/securityChecks.js
import "server-only";
import { NextResponse } from 'next/server'
import { getSession } from "@/lib/session";
import serverConfig from "@/config/Server";
import clientConfig from "@/config/Client";
import { UAParser } from "ua-parser-js";

const apiSessionBypassPaths = serverConfig.middleware.api_session_bypass_paths;
const uiSessionBypassPaths = serverConfig.middleware.ui_session_bypass_paths;
const allowedOrigins = serverConfig.middleware.allowed_origins  // เปลี่ยนเป็นโดเมนจริงของคุณ

/*
..######..########.########..##.....##.########.########.
.##....##.##.......##.....##.##.....##.##.......##.....##
.##.......##.......##.....##.##.....##.##.......##.....##
..######..######...########..##.....##.######...########.
.......##.##.......##...##....##...##..##.......##...##..
.##....##.##.......##....##....##.##...##.......##....##.
..######..########.##.....##....###....########.##.....##
*/
// ตรวจสอบ CORS origin
export function checkCorsOrigin(request) {
    const origin = request.headers.get("origin") || ""

    if (origin && allowedOrigins.length > 0 && !allowedOrigins.includes(origin)) {
        return new NextResponse(
            JSON.stringify({ error: "CORS: Origin not allowed" }),
            {
            status: 403,
            headers: { "Content-Type": serverConfig.middleware.content_type_response },
            }
        )
    }
    return null
}

// สร้าง response พร้อม header CORS
export function createCorsResponse(request) {
    const origin = request.headers.get("origin") || ""
    const res = NextResponse.next()

    if (origin && allowedOrigins.length > 0 && allowedOrigins.includes(origin)) {
        res.headers.set("Access-Control-Allow-Origin", origin)
        res.headers.set("Access-Control-Allow-Methods", "GET,POST,PUT,PATCH,DELETE,OPTIONS")
        res.headers.set("Access-Control-Allow-Headers", "Content-Type, Authorization")
    }

    return res
}

// ไม่ต้องเช็ค Session
export function isSessionBypassedApi(pathname) {
    return apiSessionBypassPaths.some(p => pathname === p || pathname.endsWith(p));
}

// เช็ค content-type
export function checkContentType(request) {
    const method = request.method
    const contentType = request.headers.get("content-type") || ""

    if (["POST", "PUT", "PATCH"].includes(method)) {
        // ตรวจสอบว่า contentType เริ่มต้นด้วยตัวใดตัวหนึ่งที่อนุญาต
        const allowedTypes = serverConfig.middleware.allowed_request_content_types;

        // ตัวอย่าง: contentType เป็น "multipart/form-data; boundary=----xxx" ให้ตรวจสอบแค่ prefix
        const isAllowed = allowedTypes.some(type => contentType.startsWith(type));

        if (!isAllowed) {
            return new NextResponse(
                JSON.stringify({ error: "Invalid content-type" }),
                {
                    status: 400,
                    headers: { "Content-Type": serverConfig.response.content_type },
                }
            )
        }
    }

    return null
}

// เช็ค checkInternalHeader
export function checkInternalHeader(request) {

    const internalHeader = request.headers.get('x-middleware-subrequest');
    if (internalHeader) {
  
        return new NextResponse(
            JSON.stringify({ error: "Forbidden" }),
            {
                status: 403,
                headers: { "Content-Type": serverConfig.response.content_type },
            }
        )
    }

    return null
}

// เช็ค session ว่ามี user หรือไม่
export async function checkSession(request, res) {
    
    const session = await getSession(request, res)
    if (!session?.user) {
        return {
            errorResponse: new NextResponse(
                JSON.stringify({ error: "Unauthorized: missing session middleware" }),
                {
                    status: 401,
                    headers: { "Content-Type": serverConfig.middleware.content_type_response },
                }
            ),
            session: null
        }
    }
    return { errorResponse: null, session }
}

// --- ฟังก์ชันช่วยตรวจสอบ CSRF token ---
export async function checkCsrfToken(request, session) {

  const csrfTokenFromHeader = request.headers.get("X-csrf-token");

  const csrfTokenInSession = session?.csrfToken;

  const method = request.method.toUpperCase();
  if (["POST", "PUT", "PATCH", "DELETE"].includes(method)) {
    if (!csrfTokenFromHeader) {
      return new NextResponse(
        JSON.stringify({ error: "CSRF token missing" }),
        {
          status: 403,
          headers: { "Content-Type": serverConfig.middleware.content_type_response },
        }
      );
    }

    if (csrfTokenFromHeader !== csrfTokenInSession) {
      return new NextResponse(
        JSON.stringify({ error: "CSRF token invalid" }),
        {
          status: 403,
          headers: { "Content-Type": serverConfig.middleware.content_type_response },
        }
      );
    }
  }

  return null;
}

// ตรวจสอบ IP prefix และ User-Agent จาก session เทียบกับ request
export function verifySessionDetails(session, request) {
    try {
        const parsed = typeof session === "string" ? JSON.parse(session) : session

        const ipRaw = request.ip || request.headers.get("x-forwarded-for") || ""
        const ip = ipRaw.split(',')[0].trim() // กรณี x-forwarded-for มีหลาย IP

        const ipPrefix = getIpPrefix(ip)
        const sessionIpPrefix = getIpPrefix(parsed.user?.ip)

        const rawUA = getUserAgent(request);
        const parsedUA = new UAParser(rawUA);
        const userAgent = {
            browser: parsedUA.getBrowser().name || "",
            os: parsedUA.getOS().name || ""
        };
        
        const sessionUa = parsed.user?.ua 

        if (ipPrefix !== sessionIpPrefix) {
            return new NextResponse(
                JSON.stringify({ error: "Session mismatch ip "+ipPrefix+" != "+sessionIpPrefix }),
                {
                    status: 401,
                    headers: { "Content-Type": serverConfig.middleware.content_type_response },
                }
            )
        }

        // if (
        //     userAgent.browser !== sessionUa?.browser ||
        //     userAgent.os !== sessionUa?.os
        // ) {
        //     return new NextResponse(
        //         JSON.stringify({ error: "Session mismatch  userAgent.browser "+userAgent.browser+" userAgent.os"+userAgent.os+" != sessionUa.browser"+sessionUa.browser+" sessionUa.os"+sessionUa.os }),
        //         {
        //             status: 401,
        //             headers: { "Content-Type": serverConfig.middleware.content_type_response },
        //         }
        //     )
        // }

    } catch (e) {
        return new NextResponse(
            JSON.stringify({ error: "Invalid session format" }),
            {
                status: 400,
                headers: { "Content-Type": serverConfig.middleware.content_type_response },
            }
        )
    }

    return null
}


export function getIpPrefix(rawIp) {
    if (!rawIp || typeof rawIp !== 'string') return null

    let ip = rawIp.trim();

    // 1. ล้าง Port และวงเล็บของ IPv6 (เช่น "[::1]:50619" -> "::1")
    if (ip.startsWith('[')) {
        ip = ip.split(']')[0].substring(1);
    } 
    // 2. ล้าง Port ของ IPv4 (เช่น "127.0.0.1:50619" -> "127.0.0.1")
    else if (ip.includes('.') && ip.includes(':')) {
        ip = ip.split(':')[0];
    }

    // -- จากนี้คือโค้ดเดิมของพี่ เอา IP ที่สะอาดแล้วมาหา Prefix --
    if (ip.includes('.')) {
        const parts = ip.split('.')
        if (parts.length !== 4) return null
        return parts.slice(0, 3).join('.') // IPv4 /24
    }

    if (ip.includes(':')) {
        const parts = ip.split(':')
        while (parts.length < 8) {
            parts.push('0')
        }
        return parts.slice(0, 4).join(':') // IPv6 /64
    }

    return null
}


// ดึง user-agent จาก request headers
export function getUserAgent(request) {
    return request.headers.get("user-agent") || null
}


/*
.##.....##.####
.##.....##..##.
.##.....##..##.
.##.....##..##.
.##.....##..##.
.##.....##..##.
..#######..####
*/
export function createResponseUi() {
    const res = NextResponse.next()
    return res
}

export function isSessionBypassedUi(pathname) {
    return uiSessionBypassPaths.some(p => pathname === p || pathname.startsWith(p));
}

export function checkRedirectUi(request, session) {

    const { pathname } = request.nextUrl;
  
    const isLoginPage = pathname === clientConfig.login_url;

    console.log("checkRedirectUi", pathname)
    console.log("checkRedirectUi", clientConfig.login_url)

    if (isLoginPage && session?.user) {
        // โคลน URL เดิมมา แล้วเปลี่ยนแค่หน้าปลายทางเป็น "/" (หน้าแรก)
        const redirectUrl = request.nextUrl.clone();
        redirectUrl.pathname = "/"; 
        return NextResponse.redirect(redirectUrl);
    }

    if (!isLoginPage && !session?.user) {
        // โคลน URL เดิมมา แล้วเปลี่ยนแค่หน้าปลายทางเป็นหน้า Login
        const redirectUrl = request.nextUrl.clone();
        redirectUrl.pathname = clientConfig.login_url; 
        return NextResponse.redirect(redirectUrl);
    }

    return null
}