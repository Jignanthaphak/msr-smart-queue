// app/api/person/route.js
import { checkAccountPermission } from "@/lib/utils/permissionRouteCheck";
import { NextResponse } from "next/server";
import requestValidationApi from "@/lib/validators/request/requestValidationApi";
import { db } from "@/lib/db";
import { InputSchema } from "@/lib/validators/form/common/schema"; 
import { searchScreenings } from "@/lib/serviceActions/screeningActions"; 

// Get Person BY Param
export async function GET(req) {

  try {

    const validationResponse = await requestValidationApi(req);
    if (validationResponse) return validationResponse;
    
    const { session } = await checkAccountPermission(req)

    const { searchParams } = new URL(req.url);
    const param = Object.fromEntries(searchParams.entries());

    const parse = InputSchema.safeParse(param);
    if (!parse.success) throw Object.assign(new Error(parse.error.issues[0].message), { status: 400 });

    const data_parse = parse.data;

    const conditions = [];

    if (data_parse.organization_id) {
      conditions.push({ type: 'and', field: 'organization_id', operator: '=', value: data_parse.organization_id })
    }
   
    const where = {
      wherePerson:conditions,
      whereScreening: [
        { type: 'and', field: 'date', operator: '>=', value: data_parse.startdate },
        { type: 'and', field: 'date', operator: '<=', value: data_parse.enddate },
      ],
      whereConsult: [
        { type: 'and', field: 'follow_counseling_center', operator: '=', value: 1 },
      ],
      includeScreening: true, 
      mustHaveScreening: true,
      mustHaveConsult: true 
    }
  
    const result = await searchScreenings(where);
   
    return NextResponse.json({ ok: true, data: result });

  } catch (err) {
    console.error(err);
    const status = err.status || 500;
    return NextResponse.json({ error: status && status !== 500  ? err.message : "Server error" }, { status });
  }

}

