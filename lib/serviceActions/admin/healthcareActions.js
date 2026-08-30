// lib/serviceActions/admin/healthcareActions.js
"use server";
import "server-only";
import { insertAndReturn, updateAndReturn, deleteAndReturn } from "@/model/utils";
import knex from "@/lib/Knex/dbKnex";
import { modelHealthcares, modelHealthcare} from "@/model/healthcareright";
import { date, datetime, times, day, nowMs, nowSec, nowDate } from "@/lib/utils/dateFormat";
import { InputSchema } from "@/lib/validators/form/common/schema"; 


export async function getHealthcares(where = {}) {
  try {

    const whereHealthcare = where?.whereHealthcare || null;

    const healthcares = await modelHealthcares({ whereHealthcare });
    if (Array.isArray(healthcares) ? healthcares.length === 0 : !healthcares) throw Object.assign(new Error("ไม่พบข้อมูล"), { status: 404 });
    
    return healthcares;

  } catch (err) {
    console.error("getHealthcares error:", err);
    throw err;
  }
}

export async function insertHealthcare(payload) {

  try {

    const parse = InputSchema.safeParse(payload);
    if (!parse.success) throw Object.assign(new Error(parse.error.issues[0].message), { status: 400 });

    const parseData = parse.data;

    const healthcare_right_id = parseData.healthcare_right_id;
    const title_th = parseData.title_th;
    const is_active = parseData.is_active;
    const create_by = parseData.create_by;
    const session_id = parseData.session_id;
    const source_file = parseData.source_file;
  
    const healthcareData = {
      title_th: title_th,
      is_active: is_active,
    };

    await knex.transaction(async (trx) => {

      let healthcareId = healthcare_right_id;
      let typeAction = "insert";

      let newData;
      let oldData;

      const existingHealthcare = await modelHealthcare({
        whereHealthcare: [
          { type: 'and', field: 'title_th', operator: '=', value: title_th },
          { type: 'and', field: 'healthcare_right_id', operator: '!=', value: healthcare_right_id },
        ],
        trx}
      );
      if (Array.isArray(existingHealthcare) ? existingHealthcare.length > 0 : !!existingHealthcare) throw Object.assign(new Error(`หน่วยงาน "${existingHealthcare.title_th}" มีอยู่แล้ว`), { status: 404 });

      if (!healthcareId) {

        newData = await insertAndReturn({
            table: "healthcare_right", 
            dataObj: healthcareData, 
            pkField: "healthcare_right_id", 
            trx
        });

        healthcareId = newData.healthcare_right_id;
    
      } else {
      
        typeAction = "update";

        oldData = await modelHealthcare({
          whereHealthcare: [
            { type: 'and', field: 'healthcare_right_id', operator: '=', value: healthcareId },
          ],
          trx
        });

        if (Array.isArray(oldData) ? oldData.length === 0 : !oldData) throw Object.assign(new Error(`ไม่พบข้อมูลที่จะแก้ไข`), { status: 404 });

        await updateAndReturn({
            table: "healthcare_right",
            dataObj: healthcareData,
            whereObj: { healthcare_right_id: healthcareId },
            trx
        });
      
      }

      newData = await modelHealthcare({
          whereHealthcare: [
            { type: 'and', field: 'healthcare_right_id', operator: '=', value: healthcareId },
          ],
          trx
        });


      await insertAndReturn({
          table: "action_logs", 
          dataObj: {
              entity_type: 'healthcare_right',
              entity_id: healthcareId,
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

    console.error("insertHealthcare error:", err);
    throw err;

  }
}

export async function deleteHealthcare(payload, where = {}) {

  try {

    const parse = InputSchema.safeParse(payload);
    if (!parse.success) throw Object.assign(new Error(parse.error.issues[0].message), { status: 400 });

    const parseData = parse.data;
  
    const healthcare_right_id = parseData.healthcare_right_id;
    const create_by = parseData.create_by;
    const session_id = parseData.session_id;
    const source_file = parseData.source_file;

    const whereHealthcare = where?.whereHealthcare || null;

    await knex.transaction(async (trx) => {


      const existingHealthcare = await modelHealthcare({
        whereHealthcare,
        trx
      });
      if (Array.isArray(existingHealthcare) ? existingHealthcare.length === 0 : !existingHealthcare) throw Object.assign(new Error(`ไม่พบข้อมูลที่จะลบ`), { status: 404 });
    
      await deleteAndReturn({
          table: "healthcare_right", 
          whereObj:{ healthcare_right_id: healthcare_right_id}, 
          trx
      });

      await insertAndReturn({
          table: "action_logs", 
          dataObj: {
              entity_type: 'healthcare_right',
              entity_id: healthcare_right_id,
              action: "delete",
              create_by: create_by,
              session_id,
              old_data: JSON.stringify(existingHealthcare),
              new_data: null,
              source_file: source_file,
          },
          trx
      });

    });

  } catch (err) {
    console.error("deleteHealthcare error:", err);
    throw err;
  }

}

export async function updateStatusHealthcare(payload, where = {}) {

  try {

    const parse = InputSchema.safeParse(payload);
    if (!parse.success) throw Object.assign(new Error(parse.error.issues[0].message), { status: 400 });

    const parseData = parse.data;
  
    const healthcare_right_id = parseData.healthcare_right_id;
    const status = parseData.status;
    const create_by = parseData.create_by;
    const session_id = parseData.session_id;
    const source_file = parseData.source_file;

    const whereHealthcare = where?.whereHealthcare || null;

    await knex.transaction(async (trx) => {

      const oldData = await modelHealthcare({
        whereHealthcare,
        trx
      });
      if (Array.isArray(oldData) ? oldData.length === 0 : !oldData) throw Object.assign(new Error(`ไม่พบข้อมูลที่จะปรับสถานะ`), { status: 404 });

      await updateAndReturn({
          table: "healthcare_right",
          dataObj:{ is_active: status, update_date: datetime() },
          whereObj: { healthcare_right_id: healthcare_right_id},
          trx
      });

      const newData = await modelHealthcare({
        whereHealthcare,
        trx
      });

      await insertAndReturn({
          table: "action_logs", 
          dataObj: {
              entity_type: 'healthcare_right',
              entity_id: healthcare_right_id,
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
    console.error("updateStatusHealthcare error:", err);
    throw err;
  }

}
