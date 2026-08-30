// actions/admin/account/actions.js
"use server";
import "server-only";
import { getAccounts, insertAccount, deleteAccount, updateStatusAccount, updateIsAdminAccount } from "@/lib/serviceActions/admin/accountActions";
import { checkAccountPermission } from "@/lib/utils/permissionRouteCheck";
import { InputSchema } from "@/lib/validators/form/common/schema"; 

export async function listAccount(payload, req) {
  try {
   
    const {ok, session, account, error} = await checkAccountPermission(req, "/actions/admin/account/listAccount", "GET")

    const parse = InputSchema.safeParse(payload);
    if (!parse.success) throw Object.assign(new Error(parse.error.issues[0].message), { status: 400 });

    const parseData = parse.data;

    const result = await getAccounts();

    const plainData = JSON.parse(JSON.stringify(result));

    return { ok: true, data: plainData };

  } catch (err) {
    console.error("listAccount error:", err);
    const status = err.status || 500;
    return { ok: false, error: status && status !== 500  ? err.message : "Server error" };
  }
}

export async function getAccount(payload, req) {
  try {
   
    const {ok, session, account, error} = await checkAccountPermission(req, "/actions/admin/account/getAccount", "GET")

    const parse = InputSchema.safeParse(payload);
    if (!parse.success) throw Object.assign(new Error(parse.error.issues[0].message), { status: 400 });

    const parseData = parse.data;
 
    const where = {
      whereAccount: [
        { type: 'and', field: 'user_id', operator: '=', value: parseData.user_id },
      ],
    }

    const result = await getAccounts(where);

    const plainData = JSON.parse(JSON.stringify(result));

    return { ok: true, data: plainData };

  } catch (err) {
    console.error("getAccount error:", err);
    const status = err.status || 500;
    return { ok: false, error: status && status !== 500  ? err.message : "Server error" };
  }
}

export async function saveAccount(payload, req) {
  try {
   
    const {ok, session, account, error} = await checkAccountPermission(req, "/actions/admin/account/saveAccount", "POST")

    const parse = InputSchema.safeParse(payload);
    if (!parse.success) throw Object.assign(new Error(parse.error.issues[0].message), { status: 400 });

    const parseData = parse.data;
 
    payload.session_id = session.user.sessionId;
    payload.create_by = session.user.userId;
    payload.source_file = "actions/admin/account/actions.js";

    const result = await insertAccount(payload);

    return { ok: true };

  } catch (err) {
    console.error("saveAccount error:", err);
    const status = err.status || 500;
    return { ok: false, error: status && status !== 500  ? err.message : "Server error" };
  }
}

export async function removeAccount(payload, req) {
  try {
   
    const {ok, session, account, error} = await checkAccountPermission(req, "/actions/admin/account/removeAccount", "DELETE")

    const parse = InputSchema.safeParse(payload);
    if (!parse.success) throw Object.assign(new Error(parse.error.issues[0].message), { status: 400 });

    const parseData = parse.data;

    payload.session_id = session.user.sessionId;
    payload.create_by = session.user.userId;
    payload.source_file = "actions/admin/account/actions.js";

    const where = {
      whereAccount: [
        { type: 'and', field: 'user_id', operator: '=', value: parseData.user_id },
      ],
    }

    const result = await deleteAccount(payload, where);

    return { ok: true};

  } catch (err) {
    console.error("removeAccount error:", err);
    const status = err.status || 500;
    return { ok: false, error: status && status !== 500  ? err.message : "Server error" };
  }
}


export async function changeStatusAccount(payload, req) {
  try {
   
    const {ok, session, account, error} = await checkAccountPermission(req, "/actions/admin/account/changeStatusAccount", "PATCH")

    const parse = InputSchema.safeParse(payload);
    if (!parse.success) throw Object.assign(new Error(parse.error.issues[0].message), { status: 400 });

    const parseData = parse.data;

    payload.session_id = session.user.sessionId;
    payload.create_by = session.user.userId;
    payload.source_file = "actions/admin/account/actions.js";
 
    const where = {
      whereAccount: [
        { type: 'and', field: 'user_id', operator: '=', value: parseData.user_id },
      ],
    }

    const result = await updateStatusAccount(payload, where);

    return { ok: true};

  } catch (err) {
    console.error("changeStatusAccount error:", err);
    const status = err.status || 500;
    return { ok: false, error: status && status !== 500  ? err.message : "Server error" };
  }
}

export async function changeIsAdminAccount(payload, req) {
  try {
   
    const {ok, session, account, error} = await checkAccountPermission(req, "/actions/admin/account/changeIsAdminAccount", "PATCH")

    const parse = InputSchema.safeParse(payload);
    if (!parse.success) throw Object.assign(new Error(parse.error.issues[0].message), { status: 400 });

    const parseData = parse.data;

    payload.session_id = session.user.sessionId;
    payload.create_by = session.user.userId;
    payload.source_file = "actions/admin/account/actions.js";
 
    const where = {
      whereAccount: [
        { type: 'and', field: 'user_id', operator: '=', value: parseData.user_id },
      ],
    }

    const result = await updateIsAdminAccount(payload, where);

    return { ok: true};

  } catch (err) {
    console.error("changeIsAdminAccount error:", err);
    const status = err.status || 500;
    return { ok: false, error: status && status !== 500  ? err.message : "Server error" };
  }
}







