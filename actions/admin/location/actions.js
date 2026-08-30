// actions/admin/location/actions.js
"use server";
import "server-only";
import { checkAccountPermission } from "@/lib/utils/permissionRouteCheck";
import Provinces from "@/lib/Knex/model/provinces";
import Districts from "@/lib/Knex/model/districts";
import Subdistricts from "@/lib/Knex/model/subdistricts";
import { InputSchema } from "@/lib/validators/form/common/schema"; 


export async function listLocation(payload, req) {
  try {
   
    // const {ok, session, account, error} = await checkAccountPermission(req, "/actions/admin/account/listAccount", "GET")

    const parse = InputSchema.safeParse(payload);
    if (!parse.success) throw Object.assign(new Error(parse.error.issues[0].message), { status: 400 });

    const parseData = parse.data;

    const provinces = await Provinces.query()
        .select("id", "code", "name_in_thai")
        .orderBy("code", "asc");

    const districts = await Districts.query()
        .select("id", "code", "name_in_thai", "province_id")
        .orderBy("code", "asc");

    const subdistricts = await Subdistricts.query()
        .select("id", "code", "name_in_thai", "district_id", "zip_code")
        .orderBy("code", "asc");

   return { ok: true, data: JSON.parse(JSON.stringify({ provinces, districts, subdistricts })) };

  } catch (err) {
    console.error("listLocation error:", err);
    const status = err.status || 500;
    return { ok: false, error: status && status !== 500  ? err.message : "Server error" };
  }
}
