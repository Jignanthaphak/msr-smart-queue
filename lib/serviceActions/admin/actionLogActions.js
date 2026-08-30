// lib/serviceActions/admin/actionLogActions.js
"use server";
import "server-only";
import { modelActionLogs, modelActionLog} from "@/model/actionlog";
import { insertAndReturn, updateAndReturn, deleteAndReturn } from "@/model/utils";
import knex from "@/lib/Knex/dbKnex";
import { date, datetime, times, day, nowMs, nowSec, nowDate } from "@/lib/utils/dateFormat";
import { InputSchema } from "@/lib/validators/form/common/schema"; 

export async function getActionLogs(where = {}) {

  try {

    const whereActionLog = where?.whereActionLog || null;
    const orderBy = where?.orderBy || false;

    const authlogs = await modelActionLogs({ whereActionLog, orderBy });
    if (Array.isArray(authlogs) ? authlogs.length === 0 : !authlogs) throw Object.assign(new Error("ไม่พบข้อมูล"), { status: 404 });

    return authlogs;

  } catch (err) {
    console.error("getActionLogs error:", err);
    throw err;
  }

}


