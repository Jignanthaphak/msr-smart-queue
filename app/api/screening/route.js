// app/api/screening/route.js "success Refactor Code"
"use server"
import "server-only";
import { checkAccountPermission } from "@/lib/utils/permissionRouteCheck";
import { NextResponse } from "next/server";
import requestValidationApi from "@/lib/validators/request/requestValidationApi";
import { BaseSchema as SearchSchema } from "@/lib/validators/form/screening/home/schema";
import { searchHome } from "@/lib/serviceActions/screeningActions"; 

export async function GET(req) {
  try {
    
    const validationResponse = await requestValidationApi(req);
    if (validationResponse) return validationResponse;
    
    const { session } = await checkAccountPermission(req)

    const { searchParams } = new URL(req.url);
    const param = Object.fromEntries(searchParams.entries());

    const parse = SearchSchema.safeParse(param);
    if (!parse.success) return NextResponse.json({ error: parse.error.issues[0].message }, { status: 400 });

    const { startdate, enddate } = parse.data;
  
    const where = {
      whereScreening: [
        { type: 'and', field: 'date', operator: '>=', value: startdate },
        { type: 'and', field: 'date', operator: '<=', value: enddate },
      ],
      includePerson: true,
    }

    const result = await searchHome(where);

    return NextResponse.json({ ok: true, data: result });

  } catch (err) {

    console.error(err);
    const status = err.status || 500;
    return NextResponse.json({ error: status && status !== 500  ? err.message : "Server error" }, { status });
    
  }
}
