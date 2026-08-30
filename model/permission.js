// /model/permission.js
"use server";
import "server-only";
import Tbl_permission from "@/lib/Knex/model/tbl_permission";
import {applyConditions} from "@/model/utils";


function basePermissionQuery({
  wherePermission = {},
  orderBy = {},
  trx = null,
}) {

  let query = Tbl_permission.query(trx);

  query.where(builder => applyConditions(builder, wherePermission));
  
  Object.entries(orderBy).forEach(([column, direction]) => {
    query.orderBy(column, direction);
  });

  query = query.withGraphFetched(`
    [ 
     
    ]
  `).modifiers({
    
  });

  return query;
}

export async function modelPermissions(options = {}) {
  const query = basePermissionQuery(options);
  return await query;
}

export async function modelPermission(options = {}) {
  const query = basePermissionQuery(options);
  return await query.first();
}



