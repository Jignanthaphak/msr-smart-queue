// actions/admin/person/actions.js
"use server";
import "server-only";
import { searchPersons, searchPersonsHistory, updatePerson } from "@/lib/serviceActions/personActions";
import { checkAccountPermission } from "@/lib/utils/permissionRouteCheck";
import { InputSchema } from "@/lib/validators/form/common/schema"; 
import { BaseSchema as BaseCommonSchema } from "@/lib/validators/form/common/schema"; 

export async function listPerson(payload, req) {
  try {
   
    const {ok, session, account, error} = await checkAccountPermission(req, "/actions/admin/person/listPerson", "GET")
    
    const parse = InputSchema.safeParse(payload);
    if (!parse.success) throw Object.assign(new Error(parse.error.issues[0].message), { status: 400 });
  
    const parseData = parse.data;
 
    const orConditions = [];

    if (parseData?.organization_id) {
      orConditions.push({ type: 'or', field: 'organization_id', operator: '=', value: parseData.organization_id })
    }

    const where = {
      wherePerson: orConditions,
    }

    const result = await searchPersons(where);

    const plainData = JSON.parse(JSON.stringify(result));

    return { ok: true, data: plainData };

  } catch (err) {
    console.error("listPerson error:", err);
    const status = err.status || 500;
    return { ok: false, error: status && status !== 500  ? err.message : "Server error" };
  }
}

export async function getPerson(payload, req) {
  try {
   
    const {ok, session, account, error} = await checkAccountPermission(req, "/actions/admin/person/getPerson", "GET")

    const parse = InputSchema.safeParse(payload);
    if (!parse.success) throw Object.assign(new Error(parse.error.issues[0].message), { status: 400 });

    const parseData = parse.data;
 
    const where = {
      wherePerson: [{ type: 'and', field: 'hn', operator: '=', value: parseData.hn }],
    }

    const result = await searchPersonsHistory(where);

    const plainData = JSON.parse(JSON.stringify(result));

    return { ok: true, data: plainData };

  } catch (err) {
    console.error("getPerson error:", err);
    const status = err.status || 500;
    return { ok: false, error: status && status !== 500  ? err.message : "Server error" };
  }
}

export async function editPersonAction(payload, req) {
  
  try {
   
    const {ok, session, account, error} = await checkAccountPermission(req, "/actions/person/editPersonAction", "PUT")

    const hn = payload?.hn || null;
   
    const parse_hn = BaseCommonSchema.pick({ hn: true }).safeParse({hn: hn});
    if (!parse_hn.success) return { ok: false, error: parse_hn.error.issues[0].message };

    const where = {
      wherePerson: [{ type: "and", field: "hn", operator: "=", value: payload.hn }],
    };
    
    payload.session_id = session.user.sessionId;
    payload.create_by = session.user.userId;
    payload.source_file = "actions/admin/person/actions.js";

    const result = await updatePerson(payload, where);

    console.log("result", result)

    const plainData = JSON.parse(JSON.stringify(result));

    return { ok: true, data: plainData };

  } catch (err) {

    console.error("editPerson error:", err);
    const status = err.status || 500;
    return { ok: false, error: status && status !== 500  ? err.message : "Server error" };

  }

}







