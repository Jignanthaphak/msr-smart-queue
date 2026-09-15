// /model/eclaim.js
"use server";
import "server-only";
import knex from "@/lib/Knex/dbKnex";

/**
 * ดึงข้อมูลรายงาน e-Claim สำหรับบริการให้การปรึกษาสุขภาพจิต
 * เชื่อมโยง consult, screening, persons, organizations, healthcare_right
 */
export async function modelEclaim({
  startdate = null,
  enddate = null,
  organization_id = null,
  healthcare_right_id = null,
  pdx_code = null,
  follow_type = null,
  satisfaction_level = null,
} = {}) {

  let query = knex("consult as c")
    .join("screening as s", "c.screening_id", "s.screening_id")
    .join("persons as p", "s.hn", "p.hn")
    .leftJoin("organizations as o", "p.organization_id", "o.organization_id")
    .leftJoin("healthcare_right as hr", "p.healthcare_right_id", "hr.healthcare_right_id")
    .select(
      "c.consult_id",
      "s.screening_id",
      "s.date as service_date",
      "s.status_id",
      "p.hn",
      "p.idcard",
      "p.firstname",
      "p.lastname",
      "p.organization_id",
      "o.title_th as organization_name",
      "p.healthcare_right_id",
      "hr.title_th as healthcare_right_name",
      "c.pdx_codes",
      "c.pdx_no_check",
      "c.pdx_other",
      "c.follow_id",
      "c.forward_hospital",
      "c.forward_problem",
      "c.forward_how_to_follow",
      "c.satisfaction_score",
      "c.satisfaction_level",
      "c.create_date as consult_create_date",
      "c.update_date as consult_update_date"
    );

  // กรองช่วงวันที่ (ตามวันที่ screening s.date หรือ consult c.create_date)
  if (startdate) {
    query = query.where("s.date", ">=", startdate);
  }
  if (enddate) {
    query = query.where("s.date", "<=", enddate);
  }

  // กรองตามหน่วยงาน
  if (organization_id && organization_id !== "all" && organization_id !== "") {
    query = query.where("p.organization_id", organization_id);
  }

  // กรองตามสิทธิการรักษา
  if (healthcare_right_id && healthcare_right_id !== "all" && healthcare_right_id !== "") {
    query = query.where("p.healthcare_right_id", healthcare_right_id);
  }

  // กรองตามรหัส PDx
  if (pdx_code && pdx_code !== "all" && pdx_code !== "") {
    query = query.where(function() {
      this.where("c.pdx_codes", "like", `%"${pdx_code}"%`)
        .orWhere("c.pdx_codes", "like", `%${pdx_code}%`)
        .orWhere("c.pdx_other", "like", `%${pdx_code}%`);
    });
  }

  // กรองตามการติดตาม / ส่งต่อ
  if (follow_type === "end" || follow_type === "terminate" || follow_type === "ยุติการปรึกษา") {
    query = query.whereIn("c.follow_id", [1, 2, 4]);
  } else if (follow_type === "appointment" || follow_type === "followup" || follow_type === "3" || follow_type === "นัดติดตามต่อ") {
    query = query.where("c.follow_id", 3);
  } else if (follow_type === "forward" || follow_type === "4") {
    query = query.where("c.follow_id", 4);
  }

  // กรองตามระดับความพึงพอใจ ("มีให้เลือก 3 ระดับ")
  if (satisfaction_level && satisfaction_level !== "all" && satisfaction_level !== "") {
    query = query.where("c.satisfaction_level", satisfaction_level);
  }

  // ===== เงื่อนไขบังคับ (Mandatory Filters) สำหรับรายงาน e-Claim =====

  // 1. กรองเฉพาะผู้รับบริการที่มีเลขบัตรประชาชนครบ 13 หลักเท่านั้น
  query = query.whereRaw("CHAR_LENGTH(TRIM(p.idcard)) = 13");

  // 2. กรองเฉพาะรายการที่มีรหัส PDx (ไม่ใช่ "ไม่พบรหัส PDx" และต้องมีรหัสจริง)
  //    - c.pdx_no_check != 1 (ไม่ได้ติ๊กว่าไม่พบรหัส)
  //    - มี pdx_codes ที่ไม่ใช่ null/ว่าง/array ว่าง หรือมี pdx_other ที่ไม่ใช่ null/ว่าง
  query = query.where(function () {
    this.where(function () {
      // pdx_no_check ต้องไม่ใช่ 1 (ไม่ได้ติ๊กว่าไม่พบรหัส)
      this.where("c.pdx_no_check", "!=", 1).orWhereNull("c.pdx_no_check");
    }).where(function () {
      // ต้องมีรหัส PDx อย่างน้อยหนึ่งรหัส
      this.where(function () {
        // pdx_codes ไม่ว่าง และไม่ใช่ array ว่าง []
        this.whereNotNull("c.pdx_codes")
          .whereRaw("c.pdx_codes != ''")
          .whereRaw("c.pdx_codes != '[]'");
      }).orWhere(function () {
        // หรือมีค่า pdx_other ที่ไม่ใช่ null และไม่ใช่ค่าว่าง
        this.whereNotNull("c.pdx_other").whereRaw("TRIM(c.pdx_other) != ''");
      });
    });
  });

  // เรียงลำดับตามวันที่รับบริการ และ ID ล่าสุด
  query = query.orderBy("s.date", "desc").orderBy("c.consult_id", "desc");

  return await query;
}
