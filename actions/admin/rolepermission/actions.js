// actions/admin/rolepermission/actions.js
"use server";
import "server-only";
import { insertRolePermissions } from "@/lib/serviceActions/admin/rolePermissionActions";
import { checkAccountPermission } from "@/lib/utils/permissionRouteCheck";
import { InputSchema } from "@/lib/validators/form/common/schema"; 

export async function saveRolePermissions(payload, req) {
  try {
   
    const {ok, session, account, error} = await checkAccountPermission(req, "/actions/admin/rolepermission/saveRolePermissions", "POST")

    const parse = InputSchema.safeParse(payload);
    if (!parse.success) throw Object.assign(new Error(parse.error.issues[0].message), { status: 400 });

    const parseData = parse.data;

    payload.session_id = session.user.sessionId;
    payload.create_by = session.user.userId;
    payload.source_file = "actions/admin/rolepermission/actions.js";

    const result = await insertRolePermissions(payload);

    return { ok: true };

  } catch (err) {
    console.error("saveRolePermissions error:", err);
    const status = err.status || 500;
    return { ok: false, error: status && status !== 500  ? err.message : "Server error" };
  }
}
