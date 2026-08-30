// app/api/screening/[hn]/route.js "success Refactor Code"
"use server"
import "server-only";
import { checkAccountPermission } from "@/lib/utils/permissionRouteCheck";
import { NextResponse } from "next/server";
import requestValidationApi from "@/lib/validators/request/requestValidationApi";
import { createScreenings } from "@/lib/serviceActions/screeningActions"; 
import { notifyClients } from "@/app/api/monitor/route";
import { date, datetime, times, day, nowMs, nowSec, nowDate } from "@/lib/utils/dateFormat";

export async function POST(req, { params }) {

  try {

    const validationResponse = await requestValidationApi(req);
    if (validationResponse) return validationResponse;
    
    const { session } = await checkAccountPermission(req)

    const data = await params;
    const create_by = session.user.userId;
    const session_id = session.user.sessionId;
    const source_file = "app/api/screening/[hn]/route.js";

    const where = {
      whereScreening: [
        { type: 'and', field: 'hn', operator: '=', value: data.hn },
        { type: 'and', field: 'date', operator: '=', value: date() },
      ],
    }
  
    const result = await createScreenings({ create_by, session_id, source_file,  ...data }, where);
      
    await notifyClients();

    return NextResponse.json({ ok: true, data: result });

  } catch (err) {

    console.error(err);
    const status = err.status || 500;
    return NextResponse.json({ error: status && status !== 500  ? err.message : "Server error" }, { status });

  }
}
