// app/api/report/report_eclaim/route.js
import { checkAccountPermission } from "@/lib/utils/permissionRouteCheck";
import { NextResponse } from "next/server";
import requestValidationApi from "@/lib/validators/request/requestValidationApi";
import { modelEclaim } from "@/model/eclaim";

export async function GET(req) {
  try {
    const validationResponse = await requestValidationApi(req);
    if (validationResponse) return validationResponse;

    const { session } = await checkAccountPermission(req);

    const { searchParams } = new URL(req.url);
    const param = Object.fromEntries(searchParams.entries());

    const where = {
      startdate: param.startdate || null,
      enddate: param.enddate || null,
      organization_id: param.organization_id || null,
      healthcare_right_id: param.healthcare_right_id || null,
      pdx_code: param.pdx_code || null,
      follow_type: param.follow_type || null,
      satisfaction_level: param.satisfaction_level || null,
    };

    const result = await modelEclaim(where);

    return NextResponse.json({ ok: true, data: result });
  } catch (err) {
    console.error("API /api/report/report_eclaim error:", err);
    const status = err.status || 500;
    return NextResponse.json({ error: status && status !== 500 ? err.message : "Server error" }, { status });
  }
}
