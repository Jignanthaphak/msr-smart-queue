// actions/admin/organization/actions.js
"use server";
import "server-only";
import { getOrganizations, insertOrganization, deleteOrganization, updateStatusOrganization } from "@/lib/serviceActions/admin/organizationActions";
import { checkAccountPermission } from "@/lib/utils/permissionRouteCheck";
import { InputSchema } from "@/lib/validators/form/common/schema"; 


export async function listOrganization(payload, req) {
  try {
   
    const {ok, session, account, error} = await checkAccountPermission(req, "/actions/admin/organization/listOrganization", "GET")

    const parse = InputSchema.safeParse(payload);
    if (!parse.success) throw Object.assign(new Error(parse.error.issues[0].message), { status: 400 });

    const parseData = parse.data;

    const result = await getOrganizations();

    const plainData = JSON.parse(JSON.stringify(result));

    return { ok: true, data: plainData };

  } catch (err) {
    console.error("listOrganization error:", err);
    const status = err.status || 500;
    return { ok: false, error: status && status !== 500  ? err.message : "Server error" };
  }
}

export async function getOrganization(payload, req) {
  try {
   
    const {ok, session, account, error} = await checkAccountPermission(req, "/actions/admin/organization/getOrganization", "GET")

    const parse = InputSchema.safeParse(payload);
    if (!parse.success) throw Object.assign(new Error(parse.error.issues[0].message), { status: 400 });

    const parseData = parse.data;
 
    const where = {
      whereOrganization: [
        { type: 'and', field: 'organization_id', operator: '=', value: parseData.organization_id },
      ],
    }

    const result = await getOrganizations(where);

    const plainData = JSON.parse(JSON.stringify(result));

    return { ok: true, data: plainData };

  } catch (err) {
    console.error("getOrganization error:", err);
    const status = err.status || 500;
    return { ok: false, error: status && status !== 500  ? err.message : "Server error" };
  }
}

export async function saveOrganization(payload, req) {
  try {
   
    const {ok, session, account, error} = await checkAccountPermission(req, "/actions/admin/organization/saveOrganization", "POST")

    const parse = InputSchema.safeParse(payload);
    if (!parse.success) throw Object.assign(new Error(parse.error.issues[0].message), { status: 400 });

    const parseData = parse.data;
  
    payload.session_id = session.user.sessionId;
    payload.create_by = session.user.userId;
    payload.source_file = "actions/admin/organization/actions.js";

    const result = await insertOrganization(payload);

    return { ok: true };

  } catch (err) {
    console.error("saveOrganization error:", err);
    const status = err.status || 500;
    return { ok: false, error: status && status !== 500  ? err.message : "Server error" };
  }
}

export async function removeOrganization(payload, req) {
  try {
   
    const {ok, session, account, error} = await checkAccountPermission(req, "/actions/admin/organization/removeOrganization", "DELETE")

    payload.session_id = session.user.sessionId;
    payload.create_by = session.user.userId;
    payload.source_file = "actions/admin/organization/actions.js";

    const where = {
      whereOrganization: [
        { type: 'and', field: 'organization_id', operator: '=', value: payload.organization_id },
      ],
    }

    const result = await deleteOrganization(payload, where);

    return { ok: true};

  } catch (err) {
    console.error("removeOrganization error:", err);
    const status = err.status || 500;
    return { ok: false, error: status && status !== 500  ? err.message : "Server error" };
  }
}

export async function changeStatusOrganization(payload, req) {
  try {
   
    const {ok, session, account, error} = await checkAccountPermission(req, "/actions/admin/organization/changeStatusOrganization", "PATCH")

    const parse = InputSchema.safeParse(payload);
    if (!parse.success) throw Object.assign(new Error(parse.error.issues[0].message), { status: 400 });

    const parseData = parse.data;

    payload.session_id = session.user.sessionId;
    payload.create_by = session.user.userId;
    payload.source_file = "actions/admin/organization/actions.js";
 
    const where = {
      whereOrganization: [
        { type: 'and', field: 'organization_id', operator: '=', value: parseData.organization_id },
      ],
    }

    const result = await updateStatusOrganization(payload, where);

    return { ok: true};

  } catch (err) {
    console.error("changeStatusOrganization error:", err);
    const status = err.status || 500;
    return { ok: false, error: status && status !== 500  ? err.message : "Server error" };
  }
}





