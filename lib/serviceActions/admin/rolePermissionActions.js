// lib/serviceActions/admin/rolePermissionActions.js
"use server";
import "server-only";
import { insertAndReturn, updateAndReturn } from "@/model/utils";
import knex from "@/lib/Knex/dbKnex";
import { datetime } from "@/lib/utils/dateFormat";
import { InputSchema } from "@/lib/validators/form/common/schema"; 
import { modelRoles, modelRole} from "@/model/role";
import { modelRolePermission, modelRolePermissions} from "@/model/rolepermission";

export async function insertRolePermissions(payload) {

  try {

    const parse = InputSchema.safeParse(payload);
    if (!parse.success) throw Object.assign(new Error(parse.error.issues[0].message), { status: 400 });

    const parseData = parse.data;

    const role_id = parseData.role_id;
    const role_name = parseData.role_name;
    const permissions_admin = parseData.permissions_admin;
    const permissions_frontend = parseData.permissions_frontend;
    const create_by = parseData.create_by;
    const session_id = parseData.session_id;
    const source_file = parseData.source_file;

    await knex.transaction(async (trx) => {

      let currentRoleId = role_id;
      let typeAction = "insert";

      console.log("================", currentRoleId)

      let newData;
      let oldData;
      
      let newDataPermission;
      let oldDataPermission;

      if (!currentRoleId) {

        const existingRole = await modelRole({
          whereRole: [
            { type: 'and', field: 'role_name', operator: '=', value: role_name },
          ],
        
          trx}
        );
        if (Array.isArray(existingRole) ? existingRole.length > 0 : !!existingRole) throw Object.assign(new Error(`Role "${role_name}" มีอยู่แล้ว`), { status: 404 });

        newData = await insertAndReturn({
            table: "tbl_role", 
            dataObj: { role_name, role_status: true }, 
            pkField: "role_id", 
            trx
        });

        currentRoleId = newData.role_id;
    
      } else {
      
        typeAction = "update";

        oldData = await modelRole({
          whereRole: [
            { type: 'and', field: 'role_id', operator: '=', value: currentRoleId },
          ],
          trx
        });

        if (Array.isArray(oldData) ? oldData.length === 0 : !oldData) throw Object.assign(new Error(`ไม่พบข้อมูลที่จะแก้ไข`), { status: 404 });

        newData = await updateAndReturn({
            table: "tbl_role",
            dataObj: { role_name, update_date: datetime() },
            whereObj: { role_id: currentRoleId },
            trx
        });
        
      
      }

      await insertAndReturn({
          table: "action_logs", 
          dataObj: {
              entity_type: 'tbl_role',
              entity_id: currentRoleId,
              action: typeAction,
              create_by: create_by,
              session_id,
              old_data: oldData ? JSON.stringify(oldData) : null,
              new_data: JSON.stringify(newData),
              source_file: source_file,
          },
          trx
      });

      oldDataPermission = await modelRolePermissions({
        whereRolePermission: [
          { type: 'and', field: 'role_id', operator: '=', value: currentRoleId },
        ],
        trx
      });
      if (Array.isArray(oldDataPermission) ? oldDataPermission.length > 0 : !!oldDataPermission){

        await updateAndReturn({
            table: "tbl_role_permission",
            dataObj: { can_access: false, update_date: datetime() },
            whereObj: { role_id: currentRoleId },
            trx
        });
      
      }

      const allPermissions = [
        ...permissions_admin.map(id => ({ permission_id: id, is_admin: true })),
        ...permissions_frontend.map(id => ({ permission_id: id, is_admin: false }))
      ];

      for (const perm of allPermissions) {
        const exists = await trx("tbl_role_permission")
          .where({ role_id: currentRoleId, permission_id: perm.permission_id })
          .first();

        if (exists) {

           await updateAndReturn({
              table: "tbl_role_permission",
              dataObj:{ can_access: true, update_date: datetime() },
              whereObj: { role_id: currentRoleId, permission_id: perm.permission_id },
              trx
          });

        } else {

          await insertAndReturn({
              table: "tbl_role_permission", 
              dataObj: { role_id: currentRoleId, permission_id: perm.permission_id, can_access: true }, 
              trx
          });

        }
      }

      newDataPermission = await modelRolePermissions({
        whereRolePermission: [
          { type: 'and', field: 'role_id', operator: '=', value: currentRoleId },
        ],
        trx
      });

      await insertAndReturn({
          table: "action_logs", 
          dataObj: {
              entity_type: 'tbl_role_permission',
              entity_id: currentRoleId,
              action: typeAction,
              create_by: create_by,
              session_id,
              old_data: oldDataPermission ? JSON.stringify(oldDataPermission) : null,
              new_data: JSON.stringify(newDataPermission),
              source_file: source_file,
          },
          trx
      });

          
    });


  } catch (err) {

    console.error("insertRolePermissions error:", err);
    throw err;

  }
}
