// actions/admin/healthcare/actions.js
"use server";
import "server-only";
import { getHealthcares, insertHealthcare, deleteHealthcare, updateStatusHealthcare } from "@/lib/serviceActions/admin/healthcareActions";
import { checkAccountPermission } from "@/lib/utils/permissionRouteCheck";
import { InputSchema } from "@/lib/validators/form/common/schema"; 

export async function listHealthcare(payload, req) {
  try {
   
    const {ok, session, account, error} = await checkAccountPermission(req, "/actions/admin/healthcare/listHealthcare", "GET")
    
    const parse = InputSchema.safeParse(payload);
    if (!parse.success) throw Object.assign(new Error(parse.error.issues[0].message), { status: 400 });

    const parseData = parse.data;

    const result = await getHealthcares();

    const plainData = JSON.parse(JSON.stringify(result));

    return { ok: true, data: plainData };

  } catch (err) {
    console.error("listHealthcare error:", err);
    const status = err.status || 500;
    return { ok: false, error: status && status !== 500  ? err.message : "Server error" };
  }
}

export async function getHealthcare(payload, req) {
  try {
   
    const {ok, session, account, error} = await checkAccountPermission(req, "/actions/admin/healthcare/getHealthcare", "GET")

    const parse = InputSchema.safeParse(payload);
    if (!parse.success) throw Object.assign(new Error(parse.error.issues[0].message), { status: 400 });

    const parseData = parse.data;
  
    const where = {
      whereHealthcare: [
        { type: 'and', field: 'healthcare_right_id', operator: '=', value: parseData.healthcare_right_id },
      ],
    }

    const result = await getHealthcares(where);

    const plainData = JSON.parse(JSON.stringify(result));

    return { ok: true, data: plainData };

  } catch (err) {
    console.error("getHealthcare error:", err);
    const status = err.status || 500;
    return { ok: false, error: status && status !== 500  ? err.message : "Server error" };
  }
}

export async function saveHealthcare(payload, req) {
  try {
   
    const {ok, session, account, error} = await checkAccountPermission(req, "/actions/admin/healthcare/saveHealthcare", "POST")

    const parse = InputSchema.safeParse(payload);
    if (!parse.success) throw Object.assign(new Error(parse.error.issues[0].message), { status: 400 });

    const parseData = parse.data;
  
    payload.session_id = session.user.sessionId;
    payload.create_by = session.user.userId;
    payload.source_file = "actions/admin/healthcare/actions.js";

    const result = await insertHealthcare(payload);

    return { ok: true };

  } catch (err) {
    console.error("saveHealthcare error:", err);
    const status = err.status || 500;
    return { ok: false, error: status && status !== 500  ? err.message : "Server error" };
  }
}

export async function removeHealthcare(payload, req) {
  try {
   
    const {ok, session, account, error} = await checkAccountPermission(req, "/actions/admin/healthcare/removeHealthcare", "DELETE")

    const parse = InputSchema.safeParse(payload);
    if (!parse.success) throw Object.assign(new Error(parse.error.issues[0].message), { status: 400 });

    const parseData = parse.data;

    payload.session_id = session.user.sessionId;
    payload.create_by = session.user.userId;
    payload.source_file = "actions/admin/healthcare/actions.js";

    const where = {
      whereHealthcare: [
        { type: 'and', field: 'healthcare_right_id', operator: '=', value: parseData.healthcare_right_id },
      ],
    }

    const result = await deleteHealthcare(payload, where);

    return { ok: true};

  } catch (err) {
    console.error("removeHealthcare error:", err);
    const status = err.status || 500;
    return { ok: false, error: status && status !== 500  ? err.message : "Server error" };
  }
}

export async function changeStatusHealthcare(payload, req) {
  try {
   
    const {ok, session, account, error} = await checkAccountPermission(req, "/actions/admin/healthcare/changeStatusHealthcare", "PATCH")

    const parse = InputSchema.safeParse(payload);
    if (!parse.success) throw Object.assign(new Error(parse.error.issues[0].message), { status: 400 });

    const parseData = parse.data;

    payload.session_id = session.user.sessionId;
    payload.create_by = session.user.userId;
    payload.source_file = "actions/admin/healthcare/actions.js";
 
    const where = {
      whereHealthcare: [
        { type: 'and', field: 'healthcare_right_id', operator: '=', value: parseData.healthcare_right_id },
      ],
    }

    const result = await updateStatusHealthcare(payload, where);

    return { ok: true};

  } catch (err) {
    console.error("changeStatusHealthcare error:", err);
    const status = err.status || 500;
    return { ok: false, error: status && status !== 500  ? err.message : "Server error" };
  }
}





