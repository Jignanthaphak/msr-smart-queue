// app/api/default-data/route.js
"use server"
import "server-only";
import { NextResponse } from "next/server";
import { checkAccountPermission } from "@/lib/utils/permissionRouteCheck";
import requestValidationApi from "@/lib/validators/request/requestValidationApi";
import Sex from "@/lib/Knex/model/sex";
import NamePrefixes from "@/lib/Knex/model/name_prefixes";
import Bloodgroup from "@/lib/Knex/model/bloodgroup";
import Provinces from "@/lib/Knex/model/provinces";
import Districts from "@/lib/Knex/model/districts";
import Subdistricts from "@/lib/Knex/model/subdistricts";
import Nationalities from "@/lib/Knex/model/nationalities";
import Ethnicities from "@/lib/Knex/model/ethnicities";
import Occupations from "@/lib/Knex/model/occupations";
import Organizations from "@/lib/Knex/model/organizations";
import HealthcareRight from "@/lib/Knex/model/healthcare_right";
import ScreeningStatus from "@/lib/Knex/model/screening_status";
import Tbl_account from "@/lib/Knex/model/tbl_account";
import { withApiLogging } from "@/lib/utils/apiLogging";

const ROUTE_PATH = "/api/default-data";

async function defaultDataHandler(req, ctx) {

    const validationResponse = await requestValidationApi(req);
    if (validationResponse) {
      const data = await validationResponse.clone().json();
      const msg = data?.error || "";
      throw Object.assign(new Error(msg), { status: validationResponse.status }, {extra:{phase: "requestValidationApi"}});
    }

    let session
    try {
      const result = await checkAccountPermission(req);
      session = result.session;
    } catch (error) {
      throw Object.assign(new Error(error.message), { status: error.status }, {extra:{phase: "checkAccountPermission"}});
    }
    // ใช้ Objection แทน Knex
    const sex = await Sex.query()
      .select("sex_id", "title_th", "title_en")
      .where("is_active", true)
      .orderBy("sort_order", "asc");

    const name_prefixes = await NamePrefixes.query()
      .select("prefix_id", "title", "language_id")
      .where("is_active", true)
      .orderBy("sort_order", "asc");

    const bloodgroup = await Bloodgroup.query()
      .select("bloodgroup_id", "title")
      .where("is_active", true)
      .orderBy("sort_order", "asc");

    const provinces = await Provinces.query()
      .select("id", "code", "name_in_thai")
      .orderBy("code", "asc");

    const districts = await Districts.query()
      .select("id", "code", "name_in_thai", "province_id")
      .orderBy("code", "asc");

    const subdistricts = await Subdistricts.query()
      .select("id", "code", "name_in_thai", "district_id", "zip_code")
      .orderBy("code", "asc");

    const nationalities = await Nationalities.query()
      .select("nationalities_id", "title_th", "title_en")
      .where("is_active", true)
      .orderBy("sort_order", "asc");

    const ethnicities = await Ethnicities.query()
      .select("ethnicities_id", "title_th", "title_en")
      .where("is_active", true)
      .orderBy("sort_order", "asc");

    const occupations = await Occupations.query()
      .select("occupation_id", "title_th", "title_en")
      .where("is_active", true)
      .orderBy("sort_order", "asc");

    const organizations = await Organizations.query()
      .select("organization_id", "title_th", "title_en")
      .where("is_active", true)
      .orderBy("sort_order", "asc");

    const healthcare_right = await HealthcareRight.query()
      .select("healthcare_right_id", "title_th", "title_en")
      .where("is_active", true)
      .orderBy("sort_order", "asc");

    const screening_status = await ScreeningStatus.query()
      .select("status_id", "status_name")
      .where("is_active", true)
      .orderBy("status_id", "asc");

    // รายชื่อเจ้าหน้าที่ (สำหรับ dropdown "คน consult" ในรายงานตารางนัดหมาย)
    const accounts = await Tbl_account.query()
      .select("user_id", "nickname")
      .orderBy("nickname", "asc");

    const data = {
      sex,
      name_prefixes,
      bloodgroup,
      provinces,
      districts,
      subdistricts,
      nationalities,
      ethnicities,
      occupations,
      organizations,
      healthcare_right,
      screening_status,
      accounts,
    };
    
    ctx.session = { user: session?.user || null };

    return NextResponse.json(data);

}

// export แบบใช้ HOF
export const GET = withApiLogging(defaultDataHandler, {
  routePath: ROUTE_PATH,
  defaultMessage: "",
  defaultLevel: "info",
});

