// app/api/person/route.js
import { checkAccountPermission } from "@/lib/utils/permissionRouteCheck";
import { NextResponse } from "next/server";
import requestValidationApi from "@/lib/validators/request/requestValidationApi";
import { db } from "@/lib/db";
import { InputSchema } from "@/lib/validators/form/common/schema"; 

// Get Person BY Param
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

    conditions.push("c.date >= ?");
    values.push(data_parse.startdate);
    conditions.push("c.date <= ?");
    values.push(data_parse.enddate);

    // เลือกหน่วยงาน = กรองเฉพาะหน่วยงานนั้น, ไม่เลือก = รวมทุกหน่วยงาน
    const hasOrganization = data_parse.organization_id !== undefined && data_parse.organization_id !== null && String(data_parse.organization_id) !== "";
    if (hasOrganization) {
      conditions.push("a.organization_id = ?");
      values.push(data_parse.organization_id);
    }

    if (conditions.length === 0) return NextResponse.json({ error: "กรุณาเลือกข้อมูลที่ต้องการค้นหาอย่างใดอย่างหนึ่ง" }, { status: 400 });

    const whereClause = conditions.length > 0 ? "WHERE " + conditions.join(" AND ") : "";

    // ชื่อหน่วยงานที่จะแสดงหัวรายงาน (ถ้าไม่ได้เลือกหน่วยงานให้ระบุว่าทุกหน่วยงาน)
    const organizationNameSelect = hasOrganization ? "MIN(a.title_th)" : "'ทุกหน่วยงาน'";

    // นับเฉพาะคนที่ "ทำเครื่อง" จริง (ไม่นับคนที่ติ๊ก ไม่ตรวจประเมิน Biofeedback)
    const bioDone = "d.biofeedback_id IS NOT NULL AND IFNULL(d.not_check_assessments, 0) <> 1";

    const sql = `SELECT
    ${organizationNameSelect} AS organization_name,
    COUNT(c.screening_id) AS cnt_all,
    COUNT(IF(b.sex_id = 1 , 1, null)) AS cnt_male,
    COUNT(IF(b.sex_id = 2 , 1, null)) AS cnt_female,
    COUNT(IF(b.sex_id = 3 , 1, null)) AS cnt_alternative,
    COUNT(IF(${bioDone} , 1, null)) AS cnt_bio_done,
    COUNT(IF(d.biofeedback_id IS NOT NULL , 1, null)) AS cnt_bio_all,
    COUNT(IF(d.biofeedback_id IS NOT NULL AND b.sex_id = 1 , 1, null)) AS cnt_bio_male,
    COUNT(IF(d.biofeedback_id IS NOT NULL AND b.sex_id = 2 , 1, null)) AS cnt_bio_female,
    COUNT(IF(d.biofeedback_id IS NOT NULL AND b.sex_id = 3 , 1, null)) AS cnt_bio_alternative,

    COUNT(IF(d.biofeedback_id IS NOT NULL AND d.ans_activity_id = 1 , 1, null)) AS cnt_bio_ans_activity_excellent,
    COUNT(IF(d.biofeedback_id IS NOT NULL AND d.ans_activity_id = 2 , 1, null)) AS cnt_bio_ans_activity_good,
    COUNT(IF(d.biofeedback_id IS NOT NULL AND d.ans_activity_id = 3 , 1, null)) AS cnt_bio_ans_activity_normal,
    COUNT(IF(d.biofeedback_id IS NOT NULL AND d.ans_activity_id = 4 , 1, null)) AS cnt_bio_ans_activity_poor,
    COUNT(IF(d.biofeedback_id IS NOT NULL AND d.ans_activity_id = 5 , 1, null)) AS cnt_bio_ans_activity_bad,

    COUNT(IF(d.biofeedback_id IS NOT NULL AND d.ans_balance_id = 1 , 1, null)) AS cnt_bio_ans_balance_balanced,
    COUNT(IF(d.biofeedback_id IS NOT NULL AND d.ans_balance_id = 2 , 1, null)) AS cnt_bio_ans_balance_unbalanced,
    COUNT(IF(d.biofeedback_id IS NOT NULL AND d.ans_balance_id = 3 , 1, null)) AS cnt_bio_ans_balance_highly_unbalanced,

    COUNT(IF(d.biofeedback_id IS NOT NULL AND d.stress_resistance_id = 1 , 1, null)) AS cnt_bio_stress_resistance_excellent,
    COUNT(IF(d.biofeedback_id IS NOT NULL AND d.stress_resistance_id = 2 , 1, null)) AS cnt_bio_stress_resistance_good,
    COUNT(IF(d.biofeedback_id IS NOT NULL AND d.stress_resistance_id = 3 , 1, null)) AS cnt_bio_stress_resistance_normal,
    COUNT(IF(d.biofeedback_id IS NOT NULL AND d.stress_resistance_id = 4 , 1, null)) AS cnt_bio_stress_resistance_poor,
    COUNT(IF(d.biofeedback_id IS NOT NULL AND d.stress_resistance_id = 5 , 1, null)) AS cnt_bio_stress_resistance_bad,

    COUNT(IF(d.biofeedback_id IS NOT NULL AND d.stress_index_id = 1 , 1, null)) AS cnt_bio_stress_index_excellent,
    COUNT(IF(d.biofeedback_id IS NOT NULL AND d.stress_index_id = 2 , 1, null)) AS cnt_bio_stress_index_good,
    COUNT(IF(d.biofeedback_id IS NOT NULL AND d.stress_index_id = 3 , 1, null)) AS cnt_bio_stress_index_normal,
    COUNT(IF(d.biofeedback_id IS NOT NULL AND d.stress_index_id = 4 , 1, null)) AS cnt_bio_stress_index_poor,
    COUNT(IF(d.biofeedback_id IS NOT NULL AND d.stress_index_id = 5 , 1, null)) AS cnt_bio_stress_index_bad,

    COUNT(IF(d.biofeedback_id IS NOT NULL AND d.fatigue_index_id = 1 , 1, null)) AS cnt_bio_fatigue_index_excellent,
    COUNT(IF(d.biofeedback_id IS NOT NULL AND d.fatigue_index_id = 2 , 1, null)) AS cnt_bio_fatigue_index_good,
    COUNT(IF(d.biofeedback_id IS NOT NULL AND d.fatigue_index_id = 3 , 1, null)) AS cnt_bio_fatigue_index_normal,
    COUNT(IF(d.biofeedback_id IS NOT NULL AND d.fatigue_index_id = 4 , 1, null)) AS cnt_bio_fatigue_index_poor,
    COUNT(IF(d.biofeedback_id IS NOT NULL AND d.fatigue_index_id = 5 , 1, null)) AS cnt_bio_fatigue_index_bad,

    COUNT(IF(d.biofeedback_id IS NOT NULL AND d.wave_level_id = 1 , 1, null)) AS cnt_bio_wave_level_level1,
    COUNT(IF(d.biofeedback_id IS NOT NULL AND d.wave_level_id = 2 , 1, null)) AS cnt_bio_wave_level_level2,
    COUNT(IF(d.biofeedback_id IS NOT NULL AND d.wave_level_id = 3 , 1, null)) AS cnt_bio_wave_level_level3,
    COUNT(IF(d.biofeedback_id IS NOT NULL AND d.wave_level_id = 4 , 1, null)) AS cnt_bio_wave_level_level4,
    COUNT(IF(d.biofeedback_id IS NOT NULL AND d.wave_level_id = 5 , 1, null)) AS cnt_bio_wave_level_level5,
    COUNT(IF(d.biofeedback_id IS NOT NULL AND d.wave_level_id = 6 , 1, null)) AS cnt_bio_wave_level_level6,
    COUNT(IF(d.biofeedback_id IS NOT NULL AND d.wave_level_id = 7 , 1, null)) AS cnt_bio_wave_level_level7,

    COUNT(IF(e.consult_id IS NOT NULL AND e.follow_id = 4 , 1, null)) AS cnt_consult_forward,
    COUNT(IF(e.consult_id IS NOT NULL AND e.follow_id = 2 , 1, null)) AS cnt_consult_watchout,

    COUNT(IF(e.consult_id IS NOT NULL AND e.stress_narcotics = 1 , 1, null)) AS cnt_consult_stress_narcotics,
    COUNT(IF(e.consult_id IS NOT NULL AND e.stress_psychiatry = 1 , 1, null)) AS cnt_consult_stress_psychiatry,
    COUNT(IF(e.consult_id IS NOT NULL AND e.stress_economy = 1 , 1, null)) AS cnt_consult_stress_economy,
    COUNT(IF(e.consult_id IS NOT NULL AND e.stress_family = 1 , 1, null)) AS cnt_consult_stress_family,
    COUNT(IF(e.consult_id IS NOT NULL AND e.stress_relationship = 1 , 1, null)) AS cnt_consult_stress_relationship,   
    COUNT(IF(e.consult_id IS NOT NULL AND e.stress_love = 1 , 1, null)) AS cnt_consult_stress_love,  
    COUNT(IF(e.consult_id IS NOT NULL AND e.stress_unplanned = 1 , 1, null)) AS cnt_consult_stress_unplanned,   
    COUNT(IF(e.consult_id IS NOT NULL AND e.stress_learning = 1 , 1, null)) AS cnt_consult_stress_learning,    
    COUNT(IF(e.consult_id IS NOT NULL AND e.stress_gambling = 1 , 1, null)) AS cnt_consult_stress_gambling,    
    COUNT(IF(e.consult_id IS NOT NULL AND e.stress_games = 1 , 1, null)) AS cnt_consult_stress_games,  
    COUNT(IF(e.consult_id IS NOT NULL AND e.stress_sex = 1 , 1, null)) AS cnt_consult_stress_sex,  
    COUNT(IF(e.consult_id IS NOT NULL AND e.stress_work = 1 , 1, null)) AS cnt_consult_stress_work,
    COUNT(IF(e.consult_id IS NOT NULL AND e.stress_colleague = 1 , 1, null)) AS cnt_consult_stress_colleague,
    COUNT(IF(e.consult_id IS NOT NULL AND e.stress_health = 1 , 1, null)) AS cnt_consult_stress_health,
    COUNT(IF(e.consult_id IS NOT NULL AND e.stress_anxious = 1 , 1, null)) AS cnt_consult_stress_anxious,  
    COUNT(IF(e.consult_id IS NOT NULL AND e.stress_sleep = 1 , 1, null)) AS cnt_consult_stress_sleep,
    COUNT(IF(e.consult_id IS NOT NULL AND e.stress_healthfamily = 1 , 1, null)) AS cnt_consult_stress_healthfamily,
    COUNT(IF(e.consult_id IS NOT NULL AND e.stress_loss = 1 , 1, null)) AS cnt_consult_stress_loss,
    COUNT(IF(e.consult_id IS NOT NULL AND e.stress_other IS NOT NULL AND TRIM(e.stress_other) <> '' , 1, null)) AS cnt_consult_stress_other,
    GROUP_CONCAT(
    IF(e.consult_id IS NOT NULL AND e.stress_other IS NOT NULL AND TRIM(e.stress_other) <> '', e.stress_other, NULL)
    SEPARATOR '\n'
    ) AS list_stress_other
    FROM organizations AS a
    INNER JOIN persons AS b ON a.organization_id = b.organization_id
    INNER JOIN screening AS c ON b.hn = c.hn
    LEFT JOIN biofeedback AS d ON c.screening_id = d.screening_id
    LEFT JOIN consult AS e ON c.screening_id = e.screening_id
    ${whereClause}
    LIMIT 1`;
    const [rs] = await db.execute(sql, values);

    if (rs.length === 0 || Number(rs[0]?.cnt_all ?? 0) === 0) {
      return NextResponse.json({ error: "ไม่พบข้อมูลที่ค้นหา" }, { status: 404 });
    }

    // รายละเอียด "อื่นๆ" ของข้อ 10 : รวมข้อความที่ซ้ำกันแล้วนับจำนวนคน เรียงจากมากไปน้อย
    const sqlOther = `SELECT TRIM(e.stress_other) AS text, COUNT(*) AS cnt
    FROM organizations AS a
    INNER JOIN persons AS b ON a.organization_id = b.organization_id
    INNER JOIN screening AS c ON b.hn = c.hn
    INNER JOIN consult AS e ON c.screening_id = e.screening_id
    ${whereClause}
    AND e.stress_other IS NOT NULL AND TRIM(e.stress_other) <> ''
    GROUP BY TRIM(e.stress_other)
    ORDER BY cnt DESC, text ASC`;

    const [rsOther] = await db.execute(sqlOther, values);

    rs[0].list_stress_other_detail = rsOther;

    return NextResponse.json({ ok: true, data: rs });

  } catch (err) {
    console.error(err);
    const status = err.status || 500;
    return NextResponse.json({ error: status && status !== 500  ? err.message : "Server error" }, { status });
  }

}

