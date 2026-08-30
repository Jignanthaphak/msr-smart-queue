// /model/role.js
"use server";
import "server-only";
import Tbl_role from "@/lib/Knex/model/tbl_role";
import {applyConditions} from "@/model/utils";


function baseRoleQuery({
  whereRole = {},
  includePermission = false,
  orderBy = {},
  trx = null,
}) {

  let query = Tbl_role.query(trx);

  query.where(builder => applyConditions(builder, whereRole));
  
  Object.entries(orderBy).forEach(([column, direction]) => {
    query.orderBy(column, direction);
  });

  query = query.withGraphFetched(`
    [ 
      ${includePermission ? `
      permissions.[
        permission
      ]` : ""}
    ]
  `).modifiers({
    
  });

  return query;
}

export async function modelRoles(options = {}) {
  const query = baseRoleQuery(options);
  return await query;
}

export async function modelRole(options = {}) {
  const query = baseRoleQuery(options);
  return await query.first();
}



