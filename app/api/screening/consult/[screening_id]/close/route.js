// app/api/screening/consult/[screening_id]/close/route.js "success Refactor Code"
"use server"
import "server-only";
import { checkAccountPermission } from "@/lib/utils/permissionRouteCheck";
import { NextResponse } from "next/server";
import requestValidationApi from "@/lib/validators/request/requestValidationApi";
import { closeConsultScreenings } from "@/lib/serviceActions/screeningActions"; 
import { notifyClients } from "@/app/api/monitor/route";

export async function PATCH(req, {params}) {

  try {

    const validationResponse = await requestValidationApi(req);
    if (validationResponse) return validationResponse;
    
    const { session } = await checkAccountPermission(req)

    const data = await params;
    const session_id = session.user.sessionId;
    const create_by = session.user.userId;
    const source_file = "app/api/screening/consult/[screening_id]/close/route.js";

    const where = {
      whereScreening: [
        { type: 'and', field: 'screening_id', operator: '=', value: data.screening_id },
      ],
    }

    const result = await closeConsultScreenings({ create_by, session_id, source_file,  ...data }, where);
        
    // Mark the room in Smart Queue state as entering post-consult cooldown ("ขอเวลาสักครู่")
    if (global.markRoomPostConsult) {
      global.markRoomPostConsult(data.screening_id, result?.hn, create_by);
    } else if (global.smartQueueState?.rooms) {
      Object.keys(global.smartQueueState.rooms).forEach((rNo) => {
        const r = global.smartQueueState.rooms[rNo];
        if (
          r &&
          (Number(r.current_screening_id) === Number(data.screening_id) ||
           String(r.current_hn).trim() === String(result?.hn || "").trim())
        ) {
          delete global.smartQueueState.rooms[rNo];
        }
      });
    }

    await notifyClients();
    if (global.notifyQueueClients) {
      await global.notifyQueueClients();
    }

    return NextResponse.json({ ok: true, data: result });


  } catch (err) {
    console.error(err);
    const status = err.status || 500;
    return NextResponse.json({ error: status && status !== 500  ? err.message : "Server error" }, { status });
  }
}

