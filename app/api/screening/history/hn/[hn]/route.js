// app/api/screening/history/hn/[hn]/route.js "success Refactor Code"
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
    const parse_hn = BaseSchema.pick({ hn: true }).safeParse({ hn: data.hn });
    if (!parse_hn.success) return NextResponse.json({ error: parse_hn.error.issues[0].message }, { status: 400  });

    const hn = parse_hn.data.hn;
   
    const where = {
      wherePerson: [{ type: 'and', field: 'hn', operator: '=', value: hn }],
      includeScreening: true
    }

    const result = await searchPersonsHistory(where);

    return NextResponse.json({ ok: true, data: result });

  } catch (err) {
    console.error(err);
    const status = err.status || 500;
    return NextResponse.json({ error: status && status !== 500  ? err.message : "Server error" }, { status });
  }
}