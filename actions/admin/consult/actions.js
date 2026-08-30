// actions/consult/actions.js
"use server";
import "server-only";
import { updateConsult } from "@/lib/serviceActions/consultActions";
import { checkAccountPermission } from "@/lib/utils/permissionRouteCheck";

export async function editConsultAction(payload, req) {
  try {
  
    const {ok, session, account, error} = await checkAccountPermission(req, "/actions/admin/consult/editConsultAction", "PUT")

    const screening_id = payload?.screening_id || "";

    const where = {
      whereScreening: [{ type: 'and', field: 'screening_id', operator: '=', value: screening_id }],
      includeScreening: true,
      mustHaveScreening: true,
    }
    
    payload.session_id = session.user.sessionId;
    payload.create_by = session.user.userId;
    payload.source_file = "actions/consult/actions.js";

    const result = await updateConsult(payload, where);

    const plainData = JSON.parse(JSON.stringify(result));

    return { ok: true, data: plainData };

  } catch (err) {
    console.error("editConsultAction error:", err);
    const status = err.status || 500;
    return { ok: false, error: status && status !== 500  ? err.message : "Server error" };
  }
}
