// app/api/report/report_excel/route.js "success Refactor Code"
"use server"
import "server-only";
import { checkAccountPermission } from "@/lib/utils/permissionRouteCheck";
import { NextResponse } from "next/server";
import requestValidationApi from "@/lib/validators/request/requestValidationApi";
import { InputSchema } from "@/lib/validators/form/common/schema"; 
import { modelScreenings } from "@/model/screening";
import { db } from "@/lib/db";

export async function GET(req) {
  try {
    
    const validationResponse = await requestValidationApi(req);
    if (validationResponse) return validationResponse;
    
    const { session } = await checkAccountPermission(req)

    const { searchParams } = new URL(req.url);
    const param = Object.fromEntries(searchParams.entries());


    const parse = InputSchema.safeParse(param);
    if (!parse.success) throw Object.assign(new Error(parse.error.issues[0].message), { status: 400 });

    const data_parse = parse.data;

    const conditions = [];
    const values = [];

    conditions.push("a.date >= ?");
    values.push(data_parse.startdate);
    conditions.push("a.date <= ?");
    values.push(data_parse.enddate);

    if (data_parse.organization_id) {
        conditions.push("c.organization_id = ?");
        values.push(data_parse.organization_id);
    }

    if (data_parse.province_id) {
        conditions.push("c.province_id = ? ");
        values.push(data_parse.province_id);
    }

    if (data_parse.district_id) {
        conditions.push("c.district_id = ? ");
        values.push(data_parse.district_id);
    }

    if (data_parse.subdistrict_id) {
        conditions.push("c.subdistrict_id = ? ");
        values.push(data_parse.subdistrict_id);
    }

    if (conditions.length === 0) return NextResponse.json({ error: "กรุณาเลือกข้อมูลที่ต้องการค้นหาอย่างใดอย่างหนึ่ง" }, { status: 400 });

    const whereClause = conditions.length > 0 ? "WHERE " + conditions.join(" AND ") : "";

    const sql = `SELECT COUNT(*) AS cnt_all,
    count(IF(e.follow_id = 3 , 1, NULL)) AS  cnt_appointment,
    count(IF(e.follow_id = 4 , 1, null)) AS cnt_forward,
    count(IF(e.stress_narcotics = 1 , 1, null)) AS cnt_narcotics,
    count(IF(e.stress_psychiatry = 1 , 1, null)) AS cnt_psychiatry,
    count(IF(e.stress_economy = 1 , 1, null)) AS cnt_economy,
    count(IF(e.stress_family = 1 , 1, null)) AS cnt_family,
    count(IF(e.stress_relationship = 1 , 1, null)) AS cnt_relationship,
    count(IF(e.stress_love = 1 , 1, null)) AS cnt_love,
    count(IF(e.stress_unplanned = 1 , 1, null)) AS cnt_unplanned,
    count(IF(e.stress_learning = 1 , 1, null)) AS cnt_learning,
    count(IF(e.stress_gambling = 1 , 1, null)) AS cnt_gambling,
    count(IF(e.stress_games = 1 , 1, null)) AS cnt_games,
    count(IF(e.stress_sex = 1 , 1, null)) AS cnt_sex,
    count(IF(e.stress_work = 1 , 1, null)) AS cnt_work,
    count(IF(e.stress_colleague = 1 , 1, null)) AS cnt_colleague,
    count(IF(e.stress_health = 1 , 1, null)) AS cnt_health,
    count(IF(e.stress_anxious = 1 , 1, null)) AS cnt_anxious,
    count(IF(e.stress_sleep = 1 , 1, null)) AS cnt_sleep,
    count(IF(e.stress_healthfamily = 1 , 1, null)) AS cnt_healthfamily,
    count(IF(e.stress_loss = 1 , 1, null)) AS cnt_loss,
    count(IF(e.stress_other IS NOT NULL , 1, null)) AS cnt_other,

    count(IF(e.risk_rq >= 3 AND e.risk_rq <= 14 , 1, null)) AS cnt_qr_little,
    count(IF(e.risk_rq >= 15 AND e.risk_rq <= 23 , 1, null)) AS cnt_qr_moderate,
    count(IF(e.risk_rq >= 24 AND e.risk_rq <= 30 , 1, null)) AS cnt_qr_high,

    count(IF(e.risk_burn_out >= 3 AND e.risk_burn_out <= 6 , 1, null)) AS cnt_bo_little,
    count(IF(e.risk_burn_out >= 7 AND e.risk_burn_out <= 8 , 1, null)) AS cnt_bo_moderate,
    count(IF(e.risk_burn_out >= 9 AND e.risk_burn_out <= 12 , 1, null)) AS cnt_bo_high,

    count(IF(e.risk_st5 >= 0 AND e.risk_st5 <= 4 , 1, null)) AS cnt_st5_little,
    count(IF(e.risk_st5 >= 5 AND e.risk_st5 <= 7 , 1, null)) AS cnt_st5_moderate,
    count(IF(e.risk_st5 >= 8 AND e.risk_st5 <= 9 , 1, null)) AS cnt_st5_high,
    count(IF(e.risk_st5 >= 10 AND e.risk_st5 <= 15 , 1, null)) AS cnt_st5_veryhigh,

    count(IF(e.risk_depressed_2qplus = 1  , 1, null)) AS cnt_depressed_q2plus_not,
    count(IF(e.risk_depressed_2qplus = 2  , 1, null)) AS cnt_depressed_q2plus_check,

    count(IF(e.risk_depressed_9q = 1  , 1, null)) AS cnt_depressed_9q_not,
    count(IF(e.risk_depressed_9q = 2  , 1, null)) AS cnt_depressed_9q_check,

    count(IF(e.risk_suicide = 2  , 1, null)) AS cnt_suicide_check,

    count(IF(e.follow_id = 4  , 1, null)) AS cnt_forward,

    GROUP_CONCAT(
    IF(e.forward_problem IS NOT NULL, CONCAT('- ', e.forward_problem), NULL)
    SEPARATOR '\n'
    ) AS list_follow_problem,

    GROUP_CONCAT(
    IF(e.forward_hospital IS NOT NULL, CONCAT('- ', e.forward_hospital), NULL)
    SEPARATOR '\n'
    ) AS list_forward_hospital,

    GROUP_CONCAT(
    IF(e.forward_how_to_follow IS NOT NULL, CONCAT('- ', e.forward_how_to_follow), NULL)
    SEPARATOR '\n'
    ) AS list_how_to_follow

    FROM screening AS a
    INNER JOIN persons AS b ON a.hn = b.hn
    LEFT JOIN organizations AS c ON b.organization_id = c.organization_id
    LEFT JOIN biofeedback AS d ON a.screening_id = d.screening_id
    LEFT JOIN consult AS e ON a.screening_id = e.screening_id
    ${whereClause}`;
    const [rs] = await db.execute(sql, values);
    if (rs.length === 0) {
      return NextResponse.json({ error: "ไม่พบข้อมูลที่ค้นหา" }, { status: 404 });
    }
 
    return NextResponse.json({ ok: true, data: rs });

  } catch (err) {
    console.error(err);
    const status = err.status || 500;
    return NextResponse.json({ error: status && status !== 500  ? err.message : "Server error" }, { status });
  }
}
