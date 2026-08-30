// actions/admin/occupation/actions.js
"use server";
import "server-only";
import { getOccupations, insertOccupation, deleteOccupation, updateStatusOccupation } from "@/lib/serviceActions/admin/occupationActions";
import { checkAccountPermission } from "@/lib/utils/permissionRouteCheck";
import { InputSchema } from "@/lib/validators/form/common/schema"; 


export async function listOccupation(payload, req) {
  try {
   
    const {ok, session, account, error} = await checkAccountPermission(req, "/actions/admin/occupation/listOccupation", "GET")

    const parse = InputSchema.safeParse(payload);
    if (!parse.success) throw Object.assign(new Error(parse.error.issues[0].message), { status: 400 });

    const parseData = parse.data;

    const result = await getOccupations();

    const plainData = JSON.parse(JSON.stringify(result));

    return { ok: true, data: plainData };

  } catch (err) {
    console.error("listOccupation error:", err);
    const status = err.status || 500;
    return { ok: false, error: status && status !== 500  ? err.message : "Server error" };
  }
}

export async function getOccupation(payload, req) {
  try {
   
    const {ok, session, account, error} = await checkAccountPermission(req, "/actions/admin/occupation/getOccupation", "GET")

    const parse = InputSchema.safeParse(payload);
    if (!parse.success) throw Object.assign(new Error(parse.error.issues[0].message), { status: 400 });

    const parseData = parse.data;
 
    const where = {
      whereOccupation: [
        { type: 'and', field: 'occupation_id', operator: '=', value: parseData.occupation_id },
      ],
    }

    const result = await getOccupations(where);

    const plainData = JSON.parse(JSON.stringify(result));

    return { ok: true, data: plainData };

  } catch (err) {
    console.error("getOccupation error:", err);
    const status = err.status || 500;
    return { ok: false, error: status && status !== 500  ? err.message : "Server error" };
  }
}

export async function saveOccupation(payload, req) {
  try {
   
    const {ok, session, account, error} = await checkAccountPermission(req, "/actions/admin/occupation/saveOccupation", "POST")

    const parse = InputSchema.safeParse(payload);
    if (!parse.success) throw Object.assign(new Error(parse.error.issues[0].message), { status: 400 });

    const parseData = parse.data;
  
    payload.session_id = session.user.sessionId;
    payload.create_by = session.user.userId;
    payload.source_file = "actions/admin/occupation/actions.js";

    const result = await insertOccupation(payload);

    return { ok: true };

  } catch (err) {
    console.error("saveOccupation error:", err);
    const status = err.status || 500;
    return { ok: false, error: status && status !== 500  ? err.message : "Server error" };
  }
}

export async function removeOccupation(payload, req) {
  try {
   
    const {ok, session, account, error} = await checkAccountPermission(req, "/actions/admin/occupation/removeOccupation", "DELETE")

    payload.session_id = session.user.sessionId;
    payload.create_by = session.user.userId;
    payload.source_file = "actions/admin/occupation/actions.js";

    const where = {
      whereOccupation: [
        { type: 'and', field: 'occupation_id', operator: '=', value: payload.occupation_id },
      ],
    }

    const result = await deleteOccupation(payload, where);

    return { ok: true};

  } catch (err) {
    console.error("removeOccupation error:", err);
    const status = err.status || 500;
    return { ok: false, error: status && status !== 500  ? err.message : "Server error" };
  }
}

export async function changeStatusOccupation(payload, req) {
  try {
   
    const {ok, session, account, error} = await checkAccountPermission(req, "/actions/admin/occupation/changeStatusOccupation", "PATCH")

    const parse = InputSchema.safeParse(payload);
    if (!parse.success) throw Object.assign(new Error(parse.error.issues[0].message), { status: 400 });

    const parseData = parse.data;

    payload.session_id = session.user.sessionId;
    payload.create_by = session.user.userId;
    payload.source_file = "actions/admin/occupation/actions.js";
 
    const where = {
      whereOccupation: [
        { type: 'and', field: 'occupation_id', operator: '=', value: parseData.occupation_id },
      ],
    }

    const result = await updateStatusOccupation(payload, where);

    return { ok: true};

  } catch (err) {
    console.error("changeStatusOccupation error:", err);
    const status = err.status || 500;
    return { ok: false, error: status && status !== 500  ? err.message : "Server error" };
  }
}





