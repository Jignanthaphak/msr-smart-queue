/// app/api/screening/history/screening/[screening_id]/route.js "success Refactor Code"
"use server"
import "server-only";
import { checkAccountPermission } from "@/lib/utils/permissionRouteCheck";
import { NextResponse } from "next/server";
import requestValidationApi from "@/lib/validators/request/requestValidationApi";
import { BaseSchema } from "@/lib/validators/form/common/schema";
import { searchPersonsHistory } from "@/lib/serviceActions/personActions";

export async function GET(req, { params }) {
  try {
    
    const validationResponse = await requestValidationApi(req);
    if (validationResponse) return validationResponse;
    
    const { session } = await checkAccountPermission(req)

    const data = await params;
    const parse_screening_id = BaseSchema.pick({ screening_id: true }).safeParse({ screening_id: data.screening_id });
    if (!parse_screening_id.success) return NextResponse.json({ error: parse_screening_id.error.issues[0].message }, { status: 400  });

    const screening_id = parse_screening_id.data.screening_id;

    const where = {
      wherePerson: [],
      whereScreening: [{ type: 'and', field: 'screening_id', operator: '=', value: screening_id }],
      includeScreening: true,
      mustHaveScreening: true,
    }
  
    const result = await searchPersonsHistory(where);
   
    return NextResponse.json({ ok: true, data: result });

   } catch (err) {
    console.error(err);
    const status = err.status || 500;
    return NextResponse.json({ error: status && status !== 500  ? err.message : "Server error" }, { status });
  }
}
