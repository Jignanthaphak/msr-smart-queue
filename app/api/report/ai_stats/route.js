// app/api/report/ai_stats/route.js
"use server"
import "server-only";
import { checkAccountPermission } from "@/lib/utils/permissionRouteCheck";
import { NextResponse } from "next/server";
import requestValidationApi from "@/lib/validators/request/requestValidationApi";
import { InputSchema } from "@/lib/validators/form/common/schema";
import { db } from "@/lib/db";

export async function GET(req) {
  try {
    const validationResponse = await requestValidationApi(req);
    if (validationResponse) return validationResponse;

    await checkAccountPermission(req);

    const { searchParams } = new URL(req.url);
    const param = Object.fromEntries(searchParams.entries());

    const parse = InputSchema.safeParse(param);
    if (!parse.success) throw Object.assign(new Error(parse.error.issues[0].message), { status: 400 });
    const p = parse.data;

    // ---------- WHERE (กรอง create_date + status/model ถ้ามี) ----------
    const conditions = [];
    const values = [];

    if (p.startdate) {
      conditions.push("l.create_date >= ?");
      values.push(`${p.startdate} 00:00:00`);
    }
    if (p.enddate) {
      conditions.push("l.create_date <= ?");
      values.push(`${p.enddate} 23:59:59`);
    }
    if (p.status) {
      conditions.push("l.status = ?");
      values.push(p.status);
    }
    if (p.model) {
      conditions.push("l.model = ?");
      values.push(p.model);
    }

    if (conditions.length === 0) {
      return NextResponse.json({ error: "กรุณาเลือกช่วงวันที่ที่ต้องการค้นหา" }, { status: 400 });
    }

    const whereClause = "WHERE " + conditions.join(" AND ");

    // ---------- 1) summary (single row) ----------
    const [summaryRows] = await db.execute(
      `SELECT
        COUNT(*) AS total,
        COUNT(IF(l.status = 'success', 1, NULL)) AS success,
        COUNT(IF(l.status = 'error', 1, NULL)) AS error,
        COUNT(IF(l.grounding_used = 1, 1, NULL)) AS grounding,
        ROUND(AVG(IF(l.status = 'success', l.duration_ms, NULL))) AS avg_duration_ms,
        MIN(IF(l.status = 'success', l.duration_ms, NULL)) AS min_duration_ms,
        MAX(IF(l.status = 'success', l.duration_ms, NULL)) AS max_duration_ms,
        COUNT(DISTINCT l.screening_id) AS unique_screenings,
        COUNT(DISTINCT l.create_by) AS unique_users
      FROM ai_analysis_logs AS l
      ${whereClause}`,
      values
    );

    // ---------- 2) daily time-series ----------
    const [daily] = await db.execute(
      `SELECT
        DATE(l.create_date) AS d,
        COUNT(*) AS total,
        COUNT(IF(l.status = 'error', 1, NULL)) AS error,
        ROUND(AVG(l.duration_ms)) AS avg_ms
      FROM ai_analysis_logs AS l
      ${whereClause}
      GROUP BY DATE(l.create_date)
      ORDER BY d ASC`,
      values
    );

    // ---------- 3) by status ----------
    const [byStatus] = await db.execute(
      `SELECT COALESCE(l.status, 'unknown') AS name, COUNT(*) AS value
      FROM ai_analysis_logs AS l ${whereClause}
      GROUP BY l.status ORDER BY value DESC`,
      values
    );

    // ---------- 4) by risk_level ----------
    const [byRisk] = await db.execute(
      `SELECT COALESCE(l.risk_level, 'ไม่ระบุ') AS name, COUNT(*) AS value
      FROM ai_analysis_logs AS l ${whereClause}
      GROUP BY l.risk_level ORDER BY value DESC`,
      values
    );

    // ---------- 5) by action_type ----------
    const [byAction] = await db.execute(
      `SELECT COALESCE(l.action_type, 'ไม่ระบุ') AS name, COUNT(*) AS value
      FROM ai_analysis_logs AS l ${whereClause}
      GROUP BY l.action_type ORDER BY value DESC`,
      values
    );

    // ---------- 6) by model ----------
    const [byModel] = await db.execute(
      `SELECT COALESCE(l.model, 'ไม่ระบุ') AS name, COUNT(*) AS value
      FROM ai_analysis_logs AS l ${whereClause}
      GROUP BY l.model ORDER BY value DESC`,
      values
    );

    // ---------- 7) by user (top 10) ----------
    const [byUser] = await db.execute(
      `SELECT
        l.create_by AS user_id,
        COALESCE(a.nickname, CONCAT('user#', l.create_by)) AS name,
        COUNT(*) AS value
      FROM ai_analysis_logs AS l
      LEFT JOIN tbl_account AS a ON l.create_by = a.user_id
      ${whereClause}
      GROUP BY l.create_by, a.nickname
      ORDER BY value DESC
      LIMIT 10`,
      values
    );

    // ---------- 8) by hour of day ----------
    const [byHour] = await db.execute(
      `SELECT HOUR(l.create_date) AS hour, COUNT(*) AS value
      FROM ai_analysis_logs AS l ${whereClause}
      GROUP BY HOUR(l.create_date) ORDER BY hour ASC`,
      values
    );

    // ---------- 9) duration buckets (histogram) ----------
    const [durationRows] = await db.execute(
      `SELECT
        COUNT(IF(l.duration_ms < 5000, 1, NULL)) AS b0_5,
        COUNT(IF(l.duration_ms >= 5000 AND l.duration_ms < 15000, 1, NULL)) AS b5_15,
        COUNT(IF(l.duration_ms >= 15000 AND l.duration_ms < 30000, 1, NULL)) AS b15_30,
        COUNT(IF(l.duration_ms >= 30000, 1, NULL)) AS b30
      FROM ai_analysis_logs AS l
      ${whereClause} AND l.duration_ms IS NOT NULL`,
      values
    );
    const dr = durationRows[0] || {};
    const durationBuckets = [
      { name: "< 5 วิ", value: Number(dr.b0_5) || 0 },
      { name: "5-15 วิ", value: Number(dr.b5_15) || 0 },
      { name: "15-30 วิ", value: Number(dr.b15_30) || 0 },
      { name: "≥ 30 วิ", value: Number(dr.b30) || 0 },
    ];

    // ---------- 10) recent errors (top 20) ----------
    const [recentErrors] = await db.execute(
      `SELECT l.create_date, l.hn, l.error_message
      FROM ai_analysis_logs AS l
      ${whereClause} AND l.status = 'error'
      ORDER BY l.create_date DESC
      LIMIT 20`,
      values
    );

    // ---------- 11) filter options (model list — ไม่ผูก status/model filter) ----------
    const optConditions = [];
    const optValues = [];
    if (p.startdate) { optConditions.push("l.create_date >= ?"); optValues.push(`${p.startdate} 00:00:00`); }
    if (p.enddate) { optConditions.push("l.create_date <= ?"); optValues.push(`${p.enddate} 23:59:59`); }
    const optWhere = optConditions.length ? "WHERE " + optConditions.join(" AND ") : "";
    const [modelOptions] = await db.execute(
      `SELECT DISTINCT l.model AS model FROM ai_analysis_logs AS l ${optWhere}
       ${optWhere ? "AND" : "WHERE"} l.model IS NOT NULL ORDER BY l.model ASC`,
      optValues
    );

    return NextResponse.json({
      ok: true,
      data: {
        summary: summaryRows[0] || {},
        daily,
        byStatus,
        byRisk,
        byAction,
        byModel,
        byUser,
        byHour,
        durationBuckets,
        recentErrors,
        modelOptions: modelOptions.map((r) => r.model),
      },
    });
  } catch (err) {
    console.error(err);
    const status = err.status || 500;
    return NextResponse.json({ error: status && status !== 500 ? err.message : "Server error" }, { status });
  }
}
