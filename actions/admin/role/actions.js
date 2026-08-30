// actions/admin/role/actions.js
"use server";
import "server-only";
import { getRoles, deleteRole, updateStatueRole, insertRolePermissions } from "@/lib/serviceActions/admin/roleActions";
import { checkAccountPermission } from "@/lib/utils/permissionRouteCheck";
import { InputSchema } from "@/lib/validators/form/common/schema"; 

export async function listRoles(payload, req) {
  try {
   
    const {ok, session, account, error} = await checkAccountPermission(req, "/actions/admin/role/listRoles", "GET")

    const parse = InputSchema.safeParse(payload);
    if (!parse.success) throw Object.assign(new Error(parse.error.issues[0].message), { status: 400 });

    const parseData = parse.data;

    const result = await getRoles();

    const plainData = JSON.parse(JSON.stringify(result));

    return { ok: true, data: plainData };

  } catch (err) {
    console.error("listRoles error:", err);
    const status = err.status || 500;
    return { ok: false, error: status && status !== 500  ? err.message : "Server error" };
  }
}

export async function getRole(payload, req) {
  try {
   
    const {ok, session, account, error} = await checkAccountPermission(req, "/actions/admin/role/getRole", "GET")

    const parse = InputSchema.safeParse(payload);
    if (!parse.success) throw Object.assign(new Error(parse.error.issues[0].message), { status: 400 });

    const parseData = parse.data;

    const where = {
      whereRole: [
        { type: 'and', field: 'role_id', operator: '=', value: parseData.role_id },
      ],
      includePermission: true,
    }

    const result = await getRoles(where);

    if(result.length === 0) throw new Error("ไม่พบข้อมูล");

    const plainData = JSON.parse(JSON.stringify(result));

    return { ok: true, data: plainData };

  } catch (err) {
    console.error("getRole error:", err);
    const status = err.status || 500;
    return { ok: false, error: status && status !== 500  ? err.message : "Server error" };
  }
}

export async function saveRolePermissions(payload, req) {
  try {
   
    const {ok, session, account, error} = await checkAccountPermission(req, "/actions/admin/role/saveRolePermissions", "POST")

    const parse = InputSchema.safeParse(payload);
    if (!parse.success) throw Object.assign(new Error(parse.error.issues[0].message), { status: 400 });

    const parseData = parse.data;

     
    payload.session_id = session.user.sessionId;
    payload.create_by = session.user.userId;
    payload.source_file = "actions/admin/role/actions.js";

    const result = await insertRolePermissions(payload);

    return { ok: true };

  } catch (err) {
    console.error("saveRolePermissions error:", err);
    const status = err.status || 500;
    return { ok: false, error: status && status !== 500  ? err.message : "Server error" };
  }
}

export async function removeRole(payload, req) {
  try {
   
    const {ok, session, account, error} = await checkAccountPermission(req, "/actions/admin/role/removeRole", "DELETE")

    const parse = InputSchema.safeParse(payload);
    if (!parse.success) throw Object.assign(new Error(parse.error.issues[0].message), { status: 400 });

    const parseData = parse.data;

    payload.session_id = session.user.sessionId;
    payload.create_by = session.user.userId;
    payload.source_file = "actions/admin/role/actions.js";

    const where = {
      whereRole: [
        { type: 'and', field: 'role_id', operator: '=', value: parseData.role_id },
      ],
      includePermission: true,
    }

    const result = await deleteRole(payload, where);

    return { ok: true};

  } catch (err) {
    console.error("removeRole error:", err);
    const status = err.status || 500;
    return { ok: false, error: status && status !== 500  ? err.message : "Server error" };
  }
}

export async function changeStatusRole(payload, req) {
  try {
   
    const {ok, session, account, error} = await checkAccountPermission(req, "/actions/admin/role/changeStatusRole", "PATCH")

    const parse = InputSchema.safeParse(payload);
    if (!parse.success) throw Object.assign(new Error(parse.error.issues[0].message), { status: 400 });

    const parseData = parse.data;

    payload.session_id = session.user.sessionId;
    payload.create_by = session.user.userId;
    payload.source_file = "actions/admin/role/actions.js";
 
    const where = {
      whereRole: [
        { type: 'and', field: 'role_id', operator: '=', value: parseData.role_id },
      ],
    }

    const result = await updateStatueRole(payload, where);

    return { ok: true};

  } catch (err) {
    console.error("changeStatusRole error:", err);
    const status = err.status || 500;
    return { ok: false, error: status && status !== 500  ? err.message : "Server error" };
  }
}


