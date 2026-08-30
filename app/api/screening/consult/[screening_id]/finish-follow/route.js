// app/api/screening/consult/[screening_id]/finish-follow/route.js
"use server"
import "server-only";
import { checkAccountPermission } from "@/lib/utils/permissionRouteCheck";
import { NextResponse } from "next/server";
import requestValidationApi from "@/lib/validators/request/requestValidationApi";
import { finishFollowUp } from "@/lib/serviceActions/screeningActions";

// บันทึก "สิ้นสุดการติดตาม" ของการนัดหมาย (จากรายงานตารางนัดหมาย)
export async function PATCH(req, { params }) {

  try {

    const validationResponse = await requestValidationApi(req);
    if (validationResponse) return validationResponse;

    const { session } = await checkAccountPermission(req);

    const data = await params;
    const session_id = session.user.sessionId;
    const create_by = session.user.userId;
    const source_file = "app/api/screening/consult/[screening_id]/finish-follow/route.js";

    const where = {
      whereScreening: [
        { type: 'and', field: 'screening_id', operator: '=', value: data.screening_id },
      ],
    };

    const result = await finishFollowUp({ create_by, session_id, source_file, ...data }, where);

    return NextResponse.json({ ok: true, data: result });

  } catch (err) {
    console.error(err);
    const status = err.status || 500;
    return NextResponse.json({ error: status && status !== 500 ? err.message : "Server error" }, { status });
  }
}
