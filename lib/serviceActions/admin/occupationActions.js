// lib/serviceActions/admin/occupationActions.js
"use server";
import "server-only";
import { insertAndReturn, updateAndReturn, deleteAndReturn } from "@/model/utils";
import knex from "@/lib/Knex/dbKnex";
import { modelOccupations, modelOccupation} from "@/model/occupation";
import { date, datetime, times, day, nowMs, nowSec, nowDate } from "@/lib/utils/dateFormat";
import { InputSchema } from "@/lib/validators/form/common/schema"; 


export async function getOccupations(where = {}) {
  try {

    const whereOccupation = where?.whereOccupation || null;

    const occupations = await modelOccupations({ whereOccupation });
    if (Array.isArray(occupations) ? occupations.length === 0 : !occupations) throw Object.assign(new Error("ไม่พบข้อมูล"), { status: 404 });
    
    return occupations;

  } catch (err) {
    console.error("getOccupations error:", err);
    throw err;
  }
}

export async function insertOccupation(payload) {

  try {

    const parse = InputSchema.safeParse(payload);
    if (!parse.success) throw Object.assign(new Error(parse.error.issues[0].message), { status: 400 });

    const parseData = parse.data;

    const occupation_id = parseData.occupation_id;
    const title_th = parseData.title_th;
    const is_active = parseData.is_active;
    const create_by = parseData.create_by;
    const session_id = parseData.session_id;
    const source_file = parseData.source_file;
  
    const occupationData = {
      title_th: title_th,
      is_active: is_active,
    };


    await knex.transaction(async (trx) => {

      let occupationId = occupation_id;
      let typeAction = "insert";

      let newData;
      let oldData;

      const existingOccupation = await modelOccupation({
        whereOccupation: [
          { type: 'and', field: 'title_th', operator: '=', value: title_th },
          { type: 'and', field: 'occupation_id', operator: '!=', value: occupation_id },
        ],
        trx}
      );
      if (Array.isArray(existingOccupation) ? existingOccupation.length > 0 : !!existingOccupation) throw Object.assign(new Error(`หน่วยงาน "${existingOccupation.title_th}" มีอยู่แล้ว`), { status: 404 });

      if (!occupationId) {

        newData = await insertAndReturn({
            table: "occupations", 
            dataObj: occupationData, 
            pkField: "occupation_id", 
            trx
        });

        occupationId = newData.occupation_id;
    
      } else {
      
        typeAction = "update";

        oldData = await modelOccupation({
          whereOccupation: [
            { type: 'and', field: 'occupation_id', operator: '=', value: occupationId },
          ],
          trx
        });

        if (Array.isArray(oldData) ? oldData.length === 0 : !oldData) throw Object.assign(new Error(`ไม่พบข้อมูลที่จะแก้ไข`), { status: 404 });

        await updateAndReturn({
            table: "occupations",
            dataObj: occupationData,
            whereObj: { occupation_id: occupationId },
            trx
        });
      
      }

      newData = await modelOccupation({
          whereOccupation: [
            { type: 'and', field: 'occupation_id', operator: '=', value: occupationId },
          ],
          trx
        });


      await insertAndReturn({
          table: "action_logs", 
          dataObj: {
              entity_type: 'occupations',
              entity_id: occupationId,
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

    console.error("insertOccupation error:", err);
    throw err;

  }
}

export async function deleteOccupation(payload, where = {}) {

  try {

    const parse = InputSchema.safeParse(payload);
    if (!parse.success) throw Object.assign(new Error(parse.error.issues[0].message), { status: 400 });

    const parseData = parse.data;
  
    const occupation_id = parseData.occupation_id;
    const create_by = parseData.create_by;
    const session_id = parseData.session_id;
    const source_file = parseData.source_file;

    const whereOccupation = where?.whereOccupation || null;

    await knex.transaction(async (trx) => {


      const existingOccupation = await modelOccupation({
        whereOccupation,
        trx
      });
      if (Array.isArray(existingOccupation) ? existingOccupation.length === 0 : !existingOccupation) throw Object.assign(new Error(`ไม่พบข้อมูลที่จะลบ`), { status: 404 });
    
      await deleteAndReturn({
          table: "occupations", 
          whereObj:{ occupation_id: occupation_id}, 
          trx
      });

      await insertAndReturn({
          table: "action_logs", 
          dataObj: {
              entity_type: 'occupations',
              entity_id: occupation_id,
              action: "delete",
              create_by: create_by,
              session_id,
              old_data: JSON.stringify(existingOccupation),
              new_data: null,
              source_file: source_file,
          },
          trx
      });

    });

  } catch (err) {
    console.error("deleteOccupation error:", err);
    throw err;
  }

}

export async function updateStatusOccupation(payload, where = {}) {

  try {

    const parse = InputSchema.safeParse(payload);
    if (!parse.success) throw Object.assign(new Error(parse.error.issues[0].message), { status: 400 });

    const parseData = parse.data;
  
    const occupation_id = parseData.occupation_id;
    const status = parseData.status;
    const create_by = parseData.create_by;
    const session_id = parseData.session_id;
    const source_file = parseData.source_file;

    const whereOccupation = where?.whereOccupation || null;

    await knex.transaction(async (trx) => {

      const oldData = await modelOccupation({
        whereOccupation,
        trx
      });
      if (Array.isArray(oldData) ? oldData.length === 0 : !oldData) throw Object.assign(new Error(`ไม่พบข้อมูลที่จะปรับสถานะ`), { status: 404 });

      await updateAndReturn({
          table: "occupations",
          dataObj:{ is_active: status, update_date: datetime() },
          whereObj: { occupation_id: occupation_id},
          trx
      });

      const newData = await modelOccupation({
        whereOccupation,
        trx
      });

      await insertAndReturn({
          table: "action_logs", 
          dataObj: {
              entity_type: 'occupations',
              entity_id: occupation_id,
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
    console.error("updateStatusOccupation error:", err);
    throw err;
  }

}
