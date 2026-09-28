// app/api/screening/consult/[screening_id]/start/route.js "success Refactor Code"
"use server"
import "server-only";
import { checkAccountPermission } from "@/lib/utils/permissionRouteCheck";
import { NextResponse } from "next/server";
import requestValidationApi from "@/lib/validators/request/requestValidationApi";
import { startConsultScreenings } from "@/lib/serviceActions/screeningActions"; 
import { notifyClients } from "@/app/api/monitor/route";

export async function PATCH(req, {params}) {

  try {

    const validationResponse = await requestValidationApi(req);
    if (validationResponse) return validationResponse;
    
    const { session } = await checkAccountPermission(req)

    const data = await params;
    const session_id = session.user.sessionId;
    const create_by = session.user.userId;
    const source_file = "app/api/screening/consult/[screening_id]/start/route.js";

    const where = {
      whereScreening: [
        { type: 'and', field: 'screening_id', operator: '=', value: data.screening_id },
      ],
    }

    const result = await startConsultScreenings({ create_by, session_id, source_file,  ...data }, where);
        
    // Reset staff break status upon taking a patient consultation
    if (global.staffBreakStore) {
      global.staffBreakStore.set(Number(create_by), 0);
    }
    try {
      const dbKnex = (await import("@/lib/Knex/dbKnex")).default;
      await dbKnex('tbl_account').where('user_id', create_by).update({ is_break: 0 });
    } catch (e) {}

    await notifyClients();
    if (global.notifyQueueClients) {
      await global.notifyQueueClients();
    }

    return NextResponse.json({ ok: true, data: result });

  } catch (err) {
    console.error(err);
    const status = err.status || 500;
    return NextResponse.json({ error: status && status !== 500  ? err.message : "Server error" }, { status });
  }
}

