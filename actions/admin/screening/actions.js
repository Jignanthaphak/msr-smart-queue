// actions/screening/actions.js
"use server";
import "server-only";
import { searchHome, closeConsultScreenings } from "@/lib/serviceActions/screeningActions";
import { searchPersonsHistory } from "@/lib/serviceActions/personActions";
import { checkAccountPermission } from "@/lib/utils/permissionRouteCheck";
import { InputSchema } from "@/lib/validators/form/common/schema"; 
import { date, datetime } from "@/lib/utils/dateFormat";

export async function listScreening(payload, req) {
  try {
   
    const {ok, session, account, error} = await checkAccountPermission(req, "/actions/admin/screening/listScreening", "GET")

    console.log("payload", payload)
    
    const parse = InputSchema.safeParse(payload);
    if (!parse.success) throw Object.assign(new Error(parse.error.issues[0].message), { status: 400 });
  
    const parseData = parse.data;

    const startdate = parse.data?.start_date || date();
    const enddate = parse.data?.end_date || date();
    const organization_id = parse.data?.organization_id || null;
 
    const orConditions = [];

    const orConditionsPerson = [];
    
    orConditions.push({ type: 'and', field: 'date', operator: '>=', value: startdate })
    orConditions.push({ type: 'and', field: 'date', operator: '<=', value: enddate })

    if(organization_id){
      orConditionsPerson.push({ type: 'and', field: 'organization_id', operator: '=', value: organization_id })
    }
    
    const where = {
      whereScreening: orConditions,
      wherePerson: orConditionsPerson,
      includePerson: true,
      mustHavePerson: true,
    }
  
    const result = await searchHome(where);

    const plainData = JSON.parse(JSON.stringify(result));

    return { ok: true, data: plainData };

  } catch (err) {
    console.error("listScreening error:", err);
    const status = err.status || 500;
    return { ok: false, error: status && status !== 500  ? err.message : "Server error" };
  }
}

export async function getScreening(payload, req) {
  try {
   
    const {ok, session, account, error} = await checkAccountPermission(req, "/actions/admin/screening/getScreening", "GET")

    const parse = InputSchema.safeParse(payload);
    if (!parse.success) throw Object.assign(new Error(parse.error.issues[0].message), { status: 400 });

    const parseData = parse.data;

    const screening_id = parseData.screening_id;
 
    const where = {
      wherePerson: [],
      whereScreening: [{ type: 'and', field: 'screening_id', operator: '=', value: screening_id }],
      includeScreening: true,
      mustHaveScreening: true,
    }

    const result = await searchPersonsHistory(where);

    const plainData = JSON.parse(JSON.stringify(result));

    return { ok: true, data: plainData };

  } catch (err) {
    console.error("getScreening error:", err);
    const status = err.status || 500;
    return { ok: false, error: status && status !== 500  ? err.message : "Server error" };
  }
}

export async function closeConsultAction(payload, req) {
  try {

    const {ok, session, account, error} = await checkAccountPermission(req, "/actions/admin/screening/closeConsultAction", "PATCH")

    const screening_id = payload?.screening_id || "";

    payload.session_id = session.user.sessionId;
    payload.create_by = session.user.userId;
    payload.source_file = "actions/admin/screening/actions.js";

    const where = {
      whereScreening: [
        { type: 'and', field: 'screening_id', operator: '=', value: screening_id },
      ],
    }

    const result = await closeConsultScreenings(payload, where);

    const plainData = JSON.parse(JSON.stringify(result));

    return { ok: true, data: plainData };

  } catch (err) {
    console.error("closeConsultAction error:", err);
    const status = err.status || 500;
    return { ok: false, error: status && status !== 500  ? err.message : "Server error" };
  }
}
