// lib/serviceActions/admin/permissionActions.js
"use server";
import "server-only";
import { insertAndReturn, updateAndReturn, deleteAndReturn } from "@/model/utils";
import knex from "@/lib/Knex/dbKnex";
import { modelPermissions, modelPermission} from "@/model/permission";
import { modelRolePermission, modelRolePermissions} from "@/model/rolepermission";
import { date, datetime, times, day, nowMs, nowSec, nowDate } from "@/lib/utils/dateFormat";
import { InputSchema } from "@/lib/validators/form/common/schema"; 


export async function getPermissions(where = {}) {
  try {

    const wherePermission = where?.wherePermission || null;

    const permissions = await modelPermissions({ wherePermission });
    if (Array.isArray(permissions) ? permissions.length === 0 : !permissions) throw Object.assign(new Error("ไม่พบข้อมูล"), { status: 404 });
    
    return permissions;

  } catch (err) {
    console.error("getPermissions error:", err);
    throw err;
  }
}

export async function insertPermission(payload) {

  try {

    const parse = InputSchema.safeParse(payload);
    if (!parse.success) throw Object.assign(new Error(parse.error.issues[0].message), { status: 400 });

    const parseData = parse.data;

    const permission_id = parseData.permission_id;
    const route_path = parseData.route_path;
    const method = parseData.method;
    const title = parseData.title;
    const description = parseData.description;
    const status = parseData.status;
    const is_admin = parseData.is_admin;
    const create_by = parseData.create_by;
    const session_id = parseData.session_id;
    const source_file = parseData.source_file;

    const permissionData = {
      route_path: route_path,
      method: method,
      title: title,
      description: description,
      status: status,
      is_admin: is_admin,
    };


    await knex.transaction(async (trx) => {

      let currentPermissionId = permission_id;
      let typeAction = "insert";

      let newData;
      let oldData;

      if (!currentPermissionId) {

        const existingPermission = await modelPermission({
          wherePermission: [
            { type: 'and', field: 'route_path', operator: '=', value: route_path },
            { type: 'and', field: 'method', operator: '=', value: method },
          ],
        
          trx}
        );
        if (Array.isArray(existingPermission) ? existingPermission.length > 0 : !!existingPermission) throw Object.assign(new Error(`Permission "${route_path}" มีอยู่แล้ว`), { status: 404 });

        newData = await insertAndReturn({
            table: "tbl_permission", 
            dataObj: permissionData, 
            pkField: "permission_id", 
            trx
        });

        currentPermissionId = newData.permission_id;
    
      } else {
      
        typeAction = "update";

        oldData = await modelPermission({
          wherePermission: [
            { type: 'and', field: 'permission_id', operator: '=', value: currentPermissionId },
          ],
          trx
        });

        if (Array.isArray(oldData) ? oldData.length === 0 : !oldData) throw Object.assign(new Error(`ไม่พบข้อมูลที่จะแก้ไข`), { status: 404 });

        newData = await updateAndReturn({
            table: "tbl_permission",
            dataObj: permissionData,
            whereObj: { permission_id: currentPermissionId },
            trx
        });
      
      }

      await insertAndReturn({
          table: "action_logs", 
          dataObj: {
              entity_type: 'tbl_permission',
              entity_id: currentPermissionId,
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

    console.error("insertPermission error:", err);
    throw err;

  }
}

export async function deletePermission(payload, where = {}) {

  try {

    const parse = InputSchema.safeParse(payload);
    if (!parse.success) throw Object.assign(new Error(parse.error.issues[0].message), { status: 400 });

    const parseData = parse.data;
  
    const permission_id = parseData.permission_id;
    const create_by = parseData.create_by;
    const session_id = parseData.session_id;
    const source_file = parseData.source_file;

    const wherePermission = where?.wherePermission || null;

    await knex.transaction(async (trx) => {



     const oldDataPermission = await modelRolePermissions({
        whereRolePermission: [
          { type: 'and', field: 'permission_id', operator: '=', value: permission_id },
        ],
        trx
      });
      if(Array.isArray(oldDataPermission) ? oldDataPermission.length > 0 : !!oldDataPermission){

        await insertAndReturn({
            table: "action_logs", 
            dataObj: {
                entity_type: 'tbl_role_permission',
                entity_id: permission_id,
                action: "delete",
                create_by: create_by,
                session_id,
                old_data: oldDataPermission ? JSON.stringify(oldDataPermission) : null,
                new_data: null,
                source_file: source_file,
            },
            trx
        });

        await deleteAndReturn({
            table: "tbl_role_permission", 
            whereObj:{ permission_id: permission_id}, 
            trx
        });
        
      }

      const existingPermission = await modelPermission({
        wherePermission,
        trx
      });
      if (Array.isArray(existingPermission) ? existingPermission.length === 0 : !existingPermission) throw Object.assign(new Error(`ไม่พบข้อมูลที่จะลบ`), { status: 404 });

     await deleteAndReturn({
          table: "tbl_permission", 
          whereObj:{ permission_id: permission_id}, 
          trx
      });

      await insertAndReturn({
          table: "action_logs", 
          dataObj: {
              entity_type: 'tbl_permission',
              entity_id: permission_id,
              action: "delete",
              create_by: create_by,
              session_id,
              old_data: JSON.stringify(existingPermission),
              new_data: null,
              source_file: source_file,
          },
          trx
      });

    });

  } catch (err) {
    console.error("deletePermission error:", err);
    throw err;
  }

}

export async function updateStatusPermission(payload, where = {}) {

  try {

    const parse = InputSchema.safeParse(payload);
    if (!parse.success) throw Object.assign(new Error(parse.error.issues[0].message), { status: 400 });

    const parseData = parse.data;
  
    const permission_id = parseData.permission_id;
    const status = parseData.status;
    const create_by = parseData.create_by;
    const session_id = parseData.session_id;
    const source_file = parseData.source_file;

    const wherePermission = where?.wherePermission || null;

    await knex.transaction(async (trx) => {

      const oldData = await modelPermission({
        wherePermission,
        trx
      });
      if (Array.isArray(oldData) ? oldData.length === 0 : !oldData) throw Object.assign(new Error(`ไม่พบข้อมูลที่จะปรับสถานะ`), { status: 404 });

      const newData = await updateAndReturn({
          table: "tbl_permission",
          dataObj:{ status: status, update_date: datetime() },
          whereObj: { permission_id: permission_id},
          trx
      });

      await insertAndReturn({
          table: "action_logs", 
          dataObj: {
              entity_type: 'tbl_permission',
              entity_id: permission_id,
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
    console.error("updateStatusPermission error:", err);
    throw err;
  }

}

export async function updateTypePermission(payload, where = {}) {

  try {

    const parse = InputSchema.safeParse(payload);
    if (!parse.success) throw Object.assign(new Error(parse.error.issues[0].message), { status: 400 });

    const parseData = parse.data;
  
    const permission_id = parseData.permission_id;
    const status = parseData.status;
    const create_by = parseData.create_by;
    const session_id = parseData.session_id;
    const source_file = parseData.source_file;

    const wherePermission = where?.wherePermission || null;

    await knex.transaction(async (trx) => {

      const oldData = await modelPermission({
        wherePermission,
        trx
      });
      if (Array.isArray(oldData) ? oldData.length === 0 : !oldData) throw Object.assign(new Error(`ไม่พบข้อมูลที่จะปรับสถานะ`), { status: 404 });

      const newData = await updateAndReturn({
          table: "tbl_permission",
          dataObj:{ is_admin: status, update_date: datetime() },
          whereObj: { permission_id: permission_id},
          trx
      });

      await insertAndReturn({
          table: "action_logs", 
          dataObj: {
              entity_type: 'tbl_permission',
              entity_id: permission_id,
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
    console.error("updateTypePermission error:", err);
    throw err;
  }

}
