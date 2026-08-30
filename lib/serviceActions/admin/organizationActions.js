// lib/serviceActions/admin/organizationActions.js
"use server";
import "server-only";
import { insertAndReturn, updateAndReturn, deleteAndReturn } from "@/model/utils";
import knex from "@/lib/Knex/dbKnex";
import { modelOrganizations, modelOrganization} from "@/model/organization";
import { date, datetime, times, day, nowMs, nowSec, nowDate } from "@/lib/utils/dateFormat";
import { InputSchema } from "@/lib/validators/form/common/schema"; 


export async function getOrganizations(where = {}) {
  try {

    const whereOrganization = where?.whereOrganization || null;

    const organizations = await modelOrganizations({ whereOrganization });
    if (Array.isArray(organizations) ? organizations.length === 0 : !organizations) throw Object.assign(new Error("ไม่พบข้อมูล"), { status: 404 });
    
    return organizations;

  } catch (err) {
    console.error("getOrganizations error:", err);
    throw err;
  }
}

export async function insertOrganization(payload) {

  try {

    const parse = InputSchema.safeParse(payload);
    if (!parse.success) throw Object.assign(new Error(parse.error.issues[0].message), { status: 400 });

    const parseData = parse.data;

    const organization_id = parseData.organization_id;
    const title_th = parseData.title_th;
    const address = parseData.address;
    const province_id = parseData.province_id;
    const district_id = parseData.district_id;
    const subdistrict_id = parseData.subdistrict_id;
    const zipcode = parseData.zipcode;
    const is_active = parseData.is_active;
    const create_by = parseData.create_by;
    const session_id = parseData.session_id;
    const source_file = parseData.source_file;
  
    const organizationData = {
      title_th: title_th,
      address: address,
      province_id: province_id,
      district_id: district_id,
      subdistrict_id: subdistrict_id,
      zipcode: zipcode,
      is_active: is_active,
    };


    await knex.transaction(async (trx) => {

      let organizationId = organization_id;
      let typeAction = "insert";

      let newData;
      let oldData;

      const existingOrganization = await modelOrganization({
        whereOrganization: [
          { type: 'and', field: 'title_th', operator: '=', value: title_th },
          { type: 'and', field: 'organization_id', operator: '!=', value: organization_id },
        ],
        trx}
      );
      if (Array.isArray(existingOrganization) ? existingOrganization.length > 0 : !!existingOrganization) throw Object.assign(new Error(`หน่วยงาน "${existingOrganization.title_th}" มีอยู่แล้ว`), { status: 404 });

      if (!organizationId) {

        newData = await insertAndReturn({
            table: "organizations", 
            dataObj: organizationData, 
            pkField: "organization_id", 
            trx
        });

        organizationId = newData.organization_id;
    
      } else {
      
        typeAction = "update";

        oldData = await modelOrganization({
          whereOrganization: [
            { type: 'and', field: 'organization_id', operator: '=', value: organizationId },
          ],
          trx
        });

        if (Array.isArray(oldData) ? oldData.length === 0 : !oldData) throw Object.assign(new Error(`ไม่พบข้อมูลที่จะแก้ไข`), { status: 404 });

        await updateAndReturn({
            table: "organizations",
            dataObj: organizationData,
            whereObj: { organization_id: organizationId },
            trx
        });
      
      }

      newData = await modelOrganization({
          whereOrganization: [
            { type: 'and', field: 'organization_id', operator: '=', value: organizationId },
          ],
          trx
        });


      await insertAndReturn({
          table: "action_logs", 
          dataObj: {
              entity_type: 'organizations',
              entity_id: organizationId,
              action: typeAction,
              create_by: create_by,
              session_id,
              old_data: oldData ? JSON.stringify(oldData) : null,
              new_data: JSON.stringify(newData),
              source_file: source_file,
          },
          trx
      });
          
    });


  } catch (err) {

    console.error("insertOrganization error:", err);
    throw err;

  }
}

export async function deleteOrganization(payload, where = {}) {

  try {

    const parse = InputSchema.safeParse(payload);
    if (!parse.success) throw Object.assign(new Error(parse.error.issues[0].message), { status: 400 });

    const parseData = parse.data;
  
    const organization_id = parseData.organization_id;
    const create_by = parseData.create_by;
    const session_id = parseData.session_id;
    const source_file = parseData.source_file;

    const whereOrganization = where?.whereOrganization || null;

    await knex.transaction(async (trx) => {


      const existingOrganization = await modelOrganization({
        whereOrganization,
        trx
      });
      if (Array.isArray(existingOrganization) ? existingOrganization.length === 0 : !existingOrganization) throw Object.assign(new Error(`ไม่พบข้อมูลที่จะลบ`), { status: 404 });
    
      await deleteAndReturn({
          table: "organizations", 
          whereObj:{ organization_id: organization_id}, 
          trx
      });

      await insertAndReturn({
          table: "action_logs", 
          dataObj: {
              entity_type: 'organizations',
              entity_id: organization_id,
              action: "delete",
              create_by: create_by,
              session_id,
              old_data: JSON.stringify(existingOrganization),
              new_data: null,
              source_file: source_file,
          },
          trx
      });

    });

  } catch (err) {
    console.error("deleteOrganization error:", err);
    throw err;
  }

}

export async function updateStatusOrganization(payload, where = {}) {

  try {

    const parse = InputSchema.safeParse(payload);
    if (!parse.success) throw Object.assign(new Error(parse.error.issues[0].message), { status: 400 });

    const parseData = parse.data;
  
    const organization_id = parseData.organization_id;
    const status = parseData.status;
    const create_by = parseData.create_by;
    const session_id = parseData.session_id;
    const source_file = parseData.source_file;

    const whereOrganization = where?.whereOrganization || null;

    await knex.transaction(async (trx) => {

      const oldData = await modelOrganization({
        whereOrganization,
        trx
      });
      if (Array.isArray(oldData) ? oldData.length === 0 : !oldData) throw Object.assign(new Error(`ไม่พบข้อมูลที่จะปรับสถานะ`), { status: 404 });

      await updateAndReturn({
          table: "organizations",
          dataObj:{ is_active: status, update_date: datetime() },
          whereObj: { organization_id: organization_id},
          trx
      });

      const newData = await modelOrganization({
        whereOrganization,
        trx
      });

      await insertAndReturn({
          table: "action_logs", 
          dataObj: {
              entity_type: 'organizations',
              entity_id: organization_id,
              action: "update",
              create_by: create_by,
              session_id,
              old_data: JSON.stringify(oldData),
              new_data: JSON.stringify(newData),
              source_file: source_file,
          },
          trx
      });

    });
  

  } catch (err) {
    console.error("updateStatusOrganization error:", err);
    throw err;
  }

}
