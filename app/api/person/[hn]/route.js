// app/api/person/[hn]/route.js "success Refactor Code"
"use server"
import "server-only";
import { checkAccountPermission } from "@/lib/utils/permissionRouteCheck";
import { NextResponse } from "next/server";
import requestValidationApi from "@/lib/validators/request/requestValidationApi";
import { updatePerson } from "@/lib/serviceActions/personActions";
import { date, datetime } from "@/lib/utils/dateFormat";

export async function PUT(req, {params}) {

  try {

    const validationResponse = await requestValidationApi(req);
    if (validationResponse) return validationResponse;
    
    const { session } = await checkAccountPermission(req)

    const data = await params;
    const body = await req.json();
    const hn = data.hn;
    const create_by = session.user.userId;
    const session_id = session.user.sessionId;
    const source_file = "app/api/person/[hn]/route.js";

    const where = {
        wherePerson: [{ type: 'and', field: 'hn', operator: '=', value: hn }],
        whereScreening: [{ type: 'and', field: 'date', operator: '=', value: date() }],
        includeScreening: true,
    }

    const result = await updatePerson({ hn, create_by, session_id, source_file,  ...body }, where);
    return NextResponse.json({ ok: true, data: result });

  } catch (err) {

    console.error(err);
    const status = err.status || 500;
    return NextResponse.json({ error: status && status !== 500  ? err.message : "Server error" }, { status });

  }
  
}
