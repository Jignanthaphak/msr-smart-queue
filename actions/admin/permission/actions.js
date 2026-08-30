// actions/ad,in/permission/actions.js
"use server";
import "server-only";
import { getPermissions, insertPermission, deletePermission, updateStatusPermission, updateTypePermission } from "@/lib/serviceActions/admin/permissionActions";
import { checkAccountPermission } from "@/lib/utils/permissionRouteCheck";
import { InputSchema } from "@/lib/validators/form/common/schema"; 


export async function listPermission(payload, req) {
  try {
   
    const {ok, session, account, error} = await checkAccountPermission(req, "/actions/admin/permission/listPermission", "GET")

    const parse = InputSchema.safeParse(payload);
    if (!parse.success) throw Object.assign(new Error(parse.error.issues[0].message), { status: 400 });

    const parseData = parse.data;

    const result = await getPermissions();

    const plainData = JSON.parse(JSON.stringify(result));

    return { ok: true, data: plainData };

  } catch (err) {
    console.error("listPermission error:", err);
    const status = err.status || 500;
    return { ok: false, error: status && status !== 500  ? err.message : "Server error" };
  }
}

export async function getPermission(payload, req) {
  try {
   
    const {ok, session, account, error} = await checkAccountPermission(req, "/actions/admin/permission/getPermission", "GET")

    const parse = InputSchema.safeParse(payload);
    if (!parse.success) throw Object.assign(new Error(parse.error.issues[0].message), { status: 400 });

    const parseData = parse.data;
 
    const where = {
      wherePermission: [
        { type: 'and', field: 'permission_id', operator: '=', value: parseData.permission_id },
      ],
    }

    const result = await getPermissions(where);

    const plainData = JSON.parse(JSON.stringify(result));

    return { ok: true, data: plainData };

  } catch (err) {
    console.error("getPermission error:", err);
    const status = err.status || 500;
    return { ok: false, error: status && status !== 500  ? err.message : "Server error" };
  }
}

export async function savePermission(payload, req) {
  try {
   
    const {ok, session, account, error} = await checkAccountPermission(req, "/actions/admin/permission/savePermission", "POST")

    const parse = InputSchema.safeParse(payload);
    if (!parse.success) throw Object.assign(new Error(parse.error.issues[0].message), { status: 400 });

    const parseData = parse.data;
  
    payload.session_id = session.user.sessionId;
    payload.create_by = session.user.userId;
    payload.source_file = "actions/admin/permission/actions.js";

    const result = await insertPermission(payload);

    return { ok: true };

  } catch (err) {
    console.error("savePermission error:", err);
    const status = err.status || 500;
    return { ok: false, error: status && status !== 500  ? err.message : "Server error" };
  }
}

export async function removePermission(payload, req) {
  try {
   
    const {ok, session, account, error} = await checkAccountPermission(req, "/actions/admin/permission/removePermission", "DELETE")

    const parse = InputSchema.safeParse(payload);
    if (!parse.success) throw Object.assign(new Error(parse.error.issues[0].message), { status: 400 });

    const parseData = parse.data;

    payload.session_id = session.user.sessionId;
    payload.create_by = session.user.userId;
    payload.source_file = "actions/admin/permission/actions.js";

    const where = {
      wherePermission: [
        { type: 'and', field: 'permission_id', operator: '=', value: parseData.permission_id },
      ],
    }

    const result = await deletePermission(payload, where);

    return { ok: true};

  } catch (err) {
    console.error("removePermission error:", err);
    const status = err.status || 500;
    return { ok: false, error: status && status !== 500  ? err.message : "Server error" };
  }
}


export async function changeStatusPermission(payload, req) {
  try {
   
    const {ok, session, account, error} = await checkAccountPermission(req, "/actions/admin/permission/changeStatusPermission", "PATCH")

    const parse = InputSchema.safeParse(payload);
    if (!parse.success) throw Object.assign(new Error(parse.error.issues[0].message), { status: 400 });

    const parseData = parse.data;

    payload.session_id = session.user.sessionId;
    payload.create_by = session.user.userId;
    payload.source_file = "actions/admin/permission/actions.js";
 
    const where = {
      wherePermission: [
        { type: 'and', field: 'permission_id', operator: '=', value: parseData.permission_id },
      ],
    }

    const result = await updateStatusPermission(payload, where);

    return { ok: true};

  } catch (err) {
    console.error("changeStatusPermission error:", err);
    const status = err.status || 500;
    return { ok: false, error: status && status !== 500  ? err.message : "Server error" };
  }
}

export async function changeTypePermission(payload, req) {
  try {
   
    const {ok, session, account, error} = await checkAccountPermission(req, "/actions/admin/permission/changeTypePermission", "PATCH")

    const parse = InputSchema.safeParse(payload);
    if (!parse.success) throw Object.assign(new Error(parse.error.issues[0].message), { status: 400 });

    const parseData = parse.data;

    payload.session_id = session.user.sessionId;
    payload.create_by = session.user.userId;
    payload.source_file = "actions/admin/permission/actions.js";
 
    const where = {
      wherePermission: [
        { type: 'and', field: 'permission_id', operator: '=', value: parseData.permission_id },
      ],
    }

    const result = await updateTypePermission(payload, where);

    return { ok: true};

  } catch (err) {
    console.error("changeTypePermission error:", err);
    const status = err.status || 500;
    return { ok: false, error: status && status !== 500  ? err.message : "Server error" };
  }
}




