// actions/admin/bio/actions.js
"use server";
import "server-only";
import { updateBio } from "@/lib/serviceActions/bioActions";
import { checkAccountPermission } from "@/lib/utils/permissionRouteCheck";

export async function editBioAction(payload, req) {
  try {

    const {ok, session, account, error} = await checkAccountPermission(req, "/actions/admin/bio/editBioAction", "PUT")

    const screening_id = payload?.screening_id || "";
  
    const where = {
      whereScreening: [{ type: 'and', field: 'screening_id', operator: '=', value: screening_id }],
      includeScreening: true,
      mustHaveScreening: true,
    }
    
    payload.session_id = session.user.sessionId;
    payload.create_by = session.user.userId;
    payload.source_file = "actions/bio/actions.js";

    const result = await updateBio(payload, where);

    const plainData = JSON.parse(JSON.stringify(result));

    return { ok: true, data: plainData };

  } catch (err) {
    console.error("editBioAction error:", err);
    const status = err.status || 500;
    return { ok: false, error: status && status !== 500  ? err.message : "Server error" };
  }
}
