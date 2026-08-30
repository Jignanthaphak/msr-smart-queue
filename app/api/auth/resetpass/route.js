// FILE: app/api/auth/resetpass/route.js
"use server"
import "server-only";
import { NextResponse } from "next/server";
import { BaseSchema } from "@/lib/validators/form/login/schema";
import { checkAccountPermission } from "@/lib/utils/permissionRouteCheck";
import requestValidationApi from "@/lib/validators/request/requestValidationApi";
import { resetPassAccount } from "@/lib/serviceActions/admin/accountActions"; 
import { withApiLogging } from "@/lib/utils/apiLogging";

const ROUTE_PATH = "/api/auth/resetpass";

async function resetpassHandler(req, ctx) {

  const validationResponse = await requestValidationApi(req);
  if (validationResponse) {
    const data = await validationResponse.clone().json();
    const msg = data?.error || "";
    throw Object.assign(new Error(msg), { status: validationResponse.status }, {extra:{phase: "requestValidationApi"}});
  }

  let session;
  try {
    const result = await checkAccountPermission(req);
    session = result.session;
  } catch (error) {

    throw Object.assign(new Error(error.message), { status: error.status }, {extra:{phase: "checkAccountPermission"}});
    
  }

  const body = await req.json();
  const create_by = session.user.userId;
  const session_id = session.user.sessionId;
  const source_file = "app/api/auth/resetpass/route.js";

  const parse = BaseSchema.omit({ username: true }).safeParse(body);
  if (!parse.success) {
    const msg = parse.error.issues[0]?.message || "รูปแบบข้อมูลไม่ถูกต้อง";
    throw Object.assign(new Error(msg), { status: 400 }, {extra:{phase: "zod-validate-resetpass"}});
  }

  await resetPassAccount({ create_by, session_id, source_file,  ...body });
  
  ctx.session = { user: session?.user || null };

  return NextResponse.json({ ok: true }, { status: 200 });

}

// export แบบใช้ HOF
export const POST = withApiLogging(resetpassHandler, {
  routePath: ROUTE_PATH,
  defaultMessage: "",
  defaultLevel: "info",
});
