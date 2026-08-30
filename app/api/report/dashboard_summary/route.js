// app/api/report/dashboard_summary/route.js
"use server"
import "server-only";
import { checkAccountPermission } from "@/lib/utils/permissionRouteCheck";
import { NextResponse } from "next/server";
import requestValidationApi from "@/lib/validators/request/requestValidationApi";
import { InputSchema } from "@/lib/validators/form/common/schema";
import { db } from "@/lib/db";

// Dashboard สรุปผลการคัดกรองสุขภาพจิต — นับเป็น "คน" (distinct hn)
// ระดับความเสี่ยงจาก raw biofeedback.stress_index: 50-110 ปกติ / 111-130 เสี่ยง / 131-150 เสี่ยงสูง
// ใช้ Bio ครั้งล่าสุดต่อคน (MAX(screening_id) ที่มี bio)

// 8 จังหวัดในเขตสุขภาพที่ 4 (provinces.id) — กราฟต้องแสดงครบทุกจังหวัดเสมอ ถึงจะไม่มีคนก็ตาม
const REGION4 = [
  { id: 4, name: "ปทุมธานี" },
  { id: 3, name: "นนทบุรี" },
  { id: 5, name: "พระนครศรีอยุธยา" },
  { id: 8, name: "สิงห์บุรี" },
  { id: 7, name: "ลพบุรี" },
  { id: 10, name: "สระบุรี" },
  { id: 6, name: "อ่างทอง" },
  { id: 17, name: "นครนายก" },
];
// bucket 0 = จังหวัดนอกเขตสุขภาพที่ 4 หรือระบุจังหวัดไม่ได้เลย
const OUTSIDE_ID = 0;
const OUTSIDE_LABEL = "นอกเขตสุขภาพ/ประชากรแฝง";

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

    // ---------- filter คน (ตามหน่วยงาน/จังหวัดของหน่วยงาน) ----------
    const pConditions = [];
    const pValues = [];
    if (p.organization_id) { pConditions.push("p.organization_id = ?"); pValues.push(p.organization_id); }
    if (p.province_id) { pConditions.push("o.province_id = ?"); pValues.push(p.province_id); }
    const pWhere = pConditions.length ? "WHERE " + pConditions.join(" AND ") : "";

    // ---------- 1) ผู้รับบริการสะสมทั้งหมด (distinct hn) ----------
    const [totalRows] = await db.execute(
      `SELECT COUNT(DISTINCT s.hn) AS total
       FROM screening s
       JOIN persons p ON p.hn = s.hn
       LEFT JOIN organizations o ON o.organization_id = p.organization_id
       ${pWhere}`,
      [...pValues]
    );
    const total = Number(totalRows[0]?.total) || 0;

    // ---------- 2) ส่งต่อตามสิทธิการรักษา (distinct hn ที่มี consult.follow_id = 4) ----------
    const [forwardRows] = await db.execute(
      `SELECT COUNT(DISTINCT s.hn) AS forwardCount
       FROM screening s
       JOIN consult c ON c.screening_id = s.screening_id AND c.follow_id = 4
       JOIN persons p ON p.hn = s.hn
       LEFT JOIN organizations o ON o.organization_id = p.organization_id
       ${pWhere}`,
      [...pValues]
    );
    const forwardCount = Number(forwardRows[0]?.forwardCount) || 0;

    // ---------- 3) จัดระดับความเสี่ยงจาก Bio ครั้งล่าสุดต่อคน — รายจังหวัด ----------
    // จังหวัดของแต่ละคน: หน่วยงาน -> ที่อยู่ปัจจุบัน (type 2) -> ที่อยู่ตามบัตร ปชช. (type 1)
    // ถ้าไม่อยู่ใน 8 จังหวัดเขตสุขภาพที่ 4 หรือหาไม่ได้เลย -> bucket 0 (นอกเขตสุขภาพ/ประชากรแฝง)
    // NOTE: คำนวณ bucket ใน subquery ชั้นใน เพื่อให้ชั้นนอก GROUP BY คอลัมน์ธรรมดา (prod มี only_full_group_by)
    const region4Ids = REGION4.map((x) => x.id).join(",");
    const [provinceRows] = await db.execute(
      `SELECT t.province_id AS province_id,
         SUM(CASE WHEN t.si BETWEEN 50 AND 110 THEN 1 ELSE 0 END) AS normal,
         SUM(CASE WHEN t.si BETWEEN 111 AND 130 THEN 1 ELSE 0 END) AS risk,
         SUM(CASE WHEN t.si BETWEEN 131 AND 150 THEN 1 ELSE 0 END) AS high
       FROM (
         SELECT
           CASE WHEN COALESCE(o.province_id, pa2.province_id, pa1.province_id) IN (${region4Ids})
                THEN COALESCE(o.province_id, pa2.province_id, pa1.province_id)
                ELSE ${OUTSIDE_ID} END AS province_id,
           b.stress_index AS si
         FROM (
           SELECT s.hn, MAX(s.screening_id) AS sid
           FROM screening s
           JOIN biofeedback b ON b.screening_id = s.screening_id
           WHERE b.stress_index IS NOT NULL
           GROUP BY s.hn
         ) latest
         JOIN biofeedback b ON b.screening_id = latest.sid
         JOIN persons p ON p.hn = latest.hn
         LEFT JOIN organizations o ON o.organization_id = p.organization_id
         LEFT JOIN persons_address pa2 ON pa2.hn = p.hn AND pa2.type = 2
         LEFT JOIN persons_address pa1 ON pa1.hn = p.hn AND pa1.type = 1
         ${pWhere}
       ) t
       GROUP BY t.province_id`,
      [...pValues]
    );

    // ---------- ประกอบเป็น 9 แถวคงที่: 8 จังหวัดเรียงมาก->น้อย + นอกเขตสุขภาพต่อท้ายเสมอ ----------
    const countMap = new Map(provinceRows.map((r) => [Number(r.province_id), r]));
    const toRow = (id, name) => {
      const r = countMap.get(id);
      const normal = Number(r?.normal) || 0;
      const risk = Number(r?.risk) || 0;
      const high = Number(r?.high) || 0;
      return { province_id: id, province: name, normal, risk, high, total: normal + risk + high };
    };

    const byProvince = REGION4.map((x) => toRow(x.id, x.name)).sort((a, b) => b.total - a.total);
    byProvince.push(toRow(OUTSIDE_ID, OUTSIDE_LABEL));

    // ---------- overall + highRiskPercent ----------
    const overall = byProvince.reduce(
      (acc, r) => ({ normal: acc.normal + r.normal, risk: acc.risk + r.risk, high: acc.high + r.high }),
      { normal: 0, risk: 0, high: 0 }
    );
    const highRiskCount = overall.high;
    const highRiskPercent = total > 0 ? Math.round((highRiskCount * 100) / total * 10) / 10 : 0;

    return NextResponse.json({
      ok: true,
      data: {
        total,
        forwardCount,
        highRiskCount,
        highRiskPercent,
        overall,
        byProvince,
      },
    });
  } catch (err) {
    console.error(err);
    const status = err.status || 500;
    return NextResponse.json({ error: status && status !== 500 ? err.message : "Server error" }, { status });
  }
}
