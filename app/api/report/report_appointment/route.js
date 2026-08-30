// app/api/report/report_appointment/route.js
import { checkAccountPermission } from "@/lib/utils/permissionRouteCheck";
import { NextResponse } from "next/server";
import requestValidationApi from "@/lib/validators/request/requestValidationApi";
import { InputSchema } from "@/lib/validators/form/common/schema";
import { searchAppointments } from "@/lib/serviceActions/screeningActions";

// รายงาน ตารางนัดหมาย : ดึงเฉพาะคนที่มีนัด (consult.follow_id = 3 + follow_date)
export async function GET(req) {

  try {

    const validationResponse = await requestValidationApi(req);
    if (validationResponse) return validationResponse;

    const { session } = await checkAccountPermission(req);

    const { searchParams } = new URL(req.url);
    const param = Object.fromEntries(searchParams.entries());

    const parse = InputSchema.safeParse(param);
    if (!parse.success) throw Object.assign(new Error(parse.error.issues[0].message), { status: 400 });

    const data_parse = parse.data;

    const where = {
      startdatetime: data_parse.startdate ? `${data_parse.startdate} 00:00:00` : null,
      enddatetime: data_parse.enddate ? `${data_parse.enddate} 23:59:59` : null,
      organization_id: data_parse.organization_id || null,
      consult_by: data_parse.consult_by || null,
      follow_status: (data_parse.follow_status === "0" || data_parse.follow_status === "1") ? data_parse.follow_status : null,
    };

    const result = await searchAppointments(where);

    return NextResponse.json({ ok: true, data: result });

  } catch (err) {
    console.error(err);
    const status = err.status || 500;
    return NextResponse.json({ error: status && status !== 500 ? err.message : "Server error" }, { status });
  }

}
