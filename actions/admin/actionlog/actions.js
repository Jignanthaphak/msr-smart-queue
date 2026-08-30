// actions/admin/actionlog/actions.js
"use server";
import "server-only";
import { getActionLogs } from "@/lib/serviceActions/admin/actionLogActions";
import { checkAccountPermission } from "@/lib/utils/permissionRouteCheck";
import { InputSchema } from "@/lib/validators/form/common/schema"; 
import { date, datetime } from "@/lib/utils/dateFormat";

export async function listActionLogs(payload, req) {
  try {
   
    const {ok, session, account, error} = await checkAccountPermission(req, "/actions/admin/actionlog/listActionLogs", "GET")

    const parse = InputSchema.safeParse(payload);
    if (!parse.success) throw Object.assign(new Error(parse.error.issues[0].message), { status: 400 });

    const parseData = parse.data;

    const startdate = parse.data?.start_date || date();
    const enddate = parse.data?.end_date || date();

    const orConditions = [];

    orConditions.push({ type: 'and', field: 'DATE(create_date)', operator: '>=', value: startdate })
    orConditions.push({ type: 'and', field: 'DATE(create_date)', operator: '<=', value: enddate })

    const where = {
      whereActionLog: orConditions,
      orderBy: { create_date: 'desc' }
    }

    const result = await getActionLogs(where);

    const plainData = JSON.parse(JSON.stringify(result));

    return { ok: true, data: plainData };

  } catch (err) {
    console.error("listActionLogs error:", err);
    const status = err.status || 500;
    return { ok: false, error: status && status !== 500  ? err.message : "Server error" };
  }
}




