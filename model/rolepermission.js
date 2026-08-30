// /model/rolepermission.js
"use server";
import "server-only";
import Tbl_role_permission from "@/lib/Knex/model/tbl_role_permission";
import {applyConditions} from "@/model/utils";


function baseRolePermissionQuery({
  whereRolePermission = {},
  includeRole = false,
  includePermission = false,
  orderBy = {},
  trx = null,
}) {

  let query = Tbl_role_permission.query(trx);

  query.where(builder => applyConditions(builder, whereRolePermission));
  
  Object.entries(orderBy).forEach(([column, direction]) => {
    query.orderBy(column, direction);
  });

  query = query.withGraphFetched(`
    [ 
      ${includePermission ? `
      permission` : ""}
      ${includeRole ? `
      role` : ""}
    ]
  `).modifiers({
    
  });

  return query;
}

export async function modelRolePermissions(options = {}) {
  const query = baseRolePermissionQuery(options);
  return await query;
}

export async function modelRolePermission(options = {}) {
  const query = baseRolePermissionQuery(options);
  return await query.first();
}



