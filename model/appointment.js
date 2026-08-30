// /model/appointment.js
"use server";
import "server-only";
import Screening from "@/lib/Knex/model/screening";

/**
 * ดึงรายการ "นัดหมาย" (consult.follow_id = 3 และมี follow_date)
 * root ที่ screening + inner join consult/person เพื่อให้ได้ 1 แถวต่อ 1 นัดหมาย
 * กรองด้วยช่วงวันเวลานัดหมาย (follow_date), หน่วยงาน (person.organization_id), คน consult (consult.create_by)
 * และสถานะการติดตาม (consult.follow_status: 0=รอติดตาม, 1=สิ้นสุดแล้ว)
 */
export async function modelAppointments({
  startdatetime = null,
  enddatetime = null,
  organization_id = null,
  consult_by = null,
  follow_status = null,
} = {}) {

  let query = Screening.query()
    .select("screening.*")
    .joinRelated("[consult, person]")
    .where("consult.follow_id", 3)
    .whereNotNull("consult.follow_date");

  if (startdatetime) {
    query = query.where("consult.follow_date", ">=", startdatetime);
  }
  if (enddatetime) {
    query = query.where("consult.follow_date", "<=", enddatetime);
  }
  if (organization_id) {
    query = query.where("person.organization_id", organization_id);
  }
  if (consult_by) {
    query = query.where("consult.create_by", consult_by);
  }
  if (follow_status !== null && follow_status !== undefined && follow_status !== "") {
    query = query.where("consult.follow_status", Number(follow_status));
  }

  query = query
    .withGraphFetched(`[
      screening_status(screeningStatusSelect),
      consult(consultSelect).[
        create_by_account(accountSelect),
        follow_status_by_account(accountSelect)
      ],
      person(personSelect).[
        name_prefixes(namePrefixSelect),
        organization(organizationSelect)
      ]
    ]`)
    .modifiers({
      screeningStatusSelect(b) { b.select("status_name"); },
      consultSelect(b) { b.select("consult_id", "screening_id", "follow_id", "follow_date", "follow_detail", "follow_tel", "follow_status", "follow_status_by", "follow_status_date", "create_by"); },
      accountSelect(b) { b.select("nickname"); },
      personSelect(b) { b.select("hn", "prefix_id", "firstname", "lastname", "organization_id", "tel"); },
      namePrefixSelect(b) { b.select("title"); },
      organizationSelect(b) { b.select("title_th"); },
    })
    .orderBy("consult.follow_date", "asc");

  return await query;
}
