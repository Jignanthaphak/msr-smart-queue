// app/api/screening/consult/ai-analyze/route.js
"use server";
import "server-only";
import { NextResponse } from "next/server";
import requestValidationApi from "@/lib/validators/request/requestValidationApi";
import { checkAccountPermission } from "@/lib/utils/permissionRouteCheck";
import { analyzeConsult } from "@/lib/serviceActions/aiAnalyzeActions";

export async function POST(req) {
  try {
    const validationResponse = await requestValidationApi(req);
    if (validationResponse) return validationResponse;

    const { session } = await checkAccountPermission(req);

    const body = await req.json();
    const screening_id = body?.screening_id;
    const consult = body?.consult || {};
    const force_refresh = Boolean(body?.force_refresh);

    if (!screening_id) {
      throw Object.assign(new Error("ไม่พบ screening_id"), { status: 400 });
    }

    const result = await analyzeConsult({
      screening_id,
      consult,
      force_refresh,
      create_by: session.user.userId,
      session_id: session.user.sessionId,
      recordedBy: session.user.nickName || null,
      source_file: "app/api/screening/consult/ai-analyze/route.js",
    });

    return NextResponse.json({ ok: true, ...result });
  } catch (err) {
    console.error(err);
    const status = err.status || 500;
    return NextResponse.json(
      { error: err?.message || "Server error" },
      { status }
    );
  }
}
