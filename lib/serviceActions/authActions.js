// lib/serviceActions/authActions.js
"use server"
import "server-only";
import { insertAndReturn, updateAndReturn} from "@/model/utils";
import { date, datetime, times, day, nowMs, nowSec, nowDate } from "@/lib/utils/dateFormat";
import {modelAccount} from '@/model/account'; 
import { modelAuthLog, modelAuthLogs} from "@/model/authlog";

export async function getAuthLogs(where = {}) {

  try {

    const whereAuthLog = where?.whereAuthLog || null;
    const orderBy = where?.orderBy || false;

    const authlogs = await modelAuthLogs({ whereAuthLog, orderBy });
    if (Array.isArray(authlogs) ? authlogs.length === 0 : !authlogs) throw Object.assign(new Error("ไม่พบข้อมูล"), { status: 404 });

    return authlogs;

  } catch (err) {
    console.error("getAuthLogs error:", err);
    throw err;
  }

}

export async function createAuthLog(payload) {

    try {

        const data = {
            user_id: payload.userId ?? null,
            username: payload.userName ?? null,
            user_data: payload.user_data ?? null,
            session_id: payload.sessionId ?? null,
            ip_address: payload.ip ?? null,
            user_agent: payload.ua ?? null,
            event_type: payload.event_type ?? null,
            reason: payload.reason ?? null,
            create_date: datetime(),
        };
     
        await insertAndReturn({
            table: "auth_logs",
            dataObj: data,
        });

        const whereAccount = [{ type: 'and', field: 'user_id', operator: '=', value: payload.userId }]

        const result = await modelAccount({whereAccount});

        return result;

    } catch (err) {

        console.error("createAuthLog transaction error:", err);
        throw err;

    }
    
}



