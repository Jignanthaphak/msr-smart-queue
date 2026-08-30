// app/api/screening/bio/[screening_id]/route.js "success Refactor Code"
"use server"
import "server-only";
import { checkAccountPermission } from "@/lib/utils/permissionRouteCheck";
import { NextResponse } from "next/server";
import requestValidationApi from "@/lib/validators/request/requestValidationApi";
import { notifyClients } from "@/app/api/monitor/route";
import { bioSendScreenings } from "@/lib/serviceActions/screeningActions"; 
import { updateBio } from "@/lib/serviceActions/bioActions"; 

export async function PUT(req, {params}) {

  try {

    const validationResponse = await requestValidationApi(req);
    if (validationResponse) return validationResponse;
    
    const { session } = await checkAccountPermission(req)

    const body = await req.json();
    const data = await params;
    const bio = body;
    const screening_id = data.screening_id;
    const session_id = session.user.sessionId;
    const create_by = session.user.userId;
    const source_file = "app/api/screening/bio/[screening_id]/route.js";

    const where = {
      whereScreening: [{ type: 'and', field: 'screening_id', operator: '=', value: screening_id }],
      includeScreening: true,
      mustHaveScreening: true,
    }
 
    const result = await updateBio({ screening_id, create_by, session_id, source_file, bio }, where);
    
    return NextResponse.json({ok:true, data:result}, { status: 201 } );

  } catch (err) {
    console.error(err);
    const status = err.status || 500;
    return NextResponse.json({ error: status && status !== 500  ? err.message : "Server error" }, { status });
  }
}

export async function PATCH(req, {params}) {

  try {

    const validationResponse = await requestValidationApi(req);
    if (validationResponse) return validationResponse;
    
    const { session } = await checkAccountPermission(req)

    const data = await params;
    const session_id = session.user.sessionId;
    const create_by = session.user.userId;
    const source_file = "app/api/screening/bio/[screening_id]/route.js";

    const where = {
      whereScreening: [
        { type: 'and', field: 'screening_id', operator: '=', value: data.screening_id },
      ],
    }

    const result = await bioSendScreenings({ create_by, session_id, source_file,  ...data }, where);
      
    await notifyClients();

    return NextResponse.json({ ok: true, data: result });

  } catch (err) {

    console.error(err);
    const status = err.status || 500;
    return NextResponse.json({ error: status && status !== 500  ? err.message : "Server error" }, { status });
 }

}

