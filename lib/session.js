// /lib/session.js
import "server-only";
import { getIronSession } from "iron-session";
import { cookies } from "next/headers";
import  serverConfig  from "@/config/Server";

export const sessionOptions = {
  cookieName: serverConfig.session.cookiename,
  password: serverConfig.session.session_password,
  cookieOptions: {
    secure: serverConfig.session.isprod,
    httpOnly: serverConfig.session.httponly,
    sameSite: serverConfig.session.samesite,
    path: serverConfig.session.path,
    maxAge: serverConfig.session.maxage,
  },
};

// สำหรับ Server Component (ใช้กับ next/headers)
export async function getSessionServer() {
  const cookieStore = await cookies();
  const req = {
    headers: {
      cookie: cookieStore.toString(),
    },
  };
  const res = {
    getHeader() {},
    setHeader() {},
  };
  return await getIronSession(req, res, sessionOptions);
}

// สำหรับ API Route (รับ req/res)
export async function getSession(req, res) {
  return await getIronSession(req, res, sessionOptions);
}
