// app/api/person/reserve-hn/route.js "success Refactor Code"
"use server"
import "server-only";
import { checkAccountPermission } from "@/lib/utils/permissionRouteCheck";
import { NextResponse } from "next/server";
import requestValidationApi from "@/lib/validators/request/requestValidationApi";
import { createHn } from "@/lib/serviceActions/personActions";

export async function POST(req) {
  
  try {

    const validationResponse = await requestValidationApi(req);
    if (validationResponse) return validationResponse;
    
    const { session, account } = await checkAccountPermission(req)

    const create_by = session.user.userId;
    const session_id = session.user.sessionId;
    const source_file = "app/api/person/reserve-hn/route.js";
    
    const {hn, hn_index} = await createHn({ create_by, session_id, source_file });

    return NextResponse.json({ ok: true, data: { hn, hn_index } }, { status: 201 });

  } catch (err) {
    console.error(err);
    const status = err.status || 500;
    return NextResponse.json({ error: status && status !== 500  ? err.message : "Server error" }, { status });
  }
}
