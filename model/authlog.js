// /model/authlog.js
"use server";
import "server-only";
import Auth_logs from "@/lib/Knex/model/auth_logs";
import {applyConditions} from "@/model/utils";

function baseAuthLogQuery({
  whereAuthLog = {},
  orderBy = {},
  trx = null,
}) {

  let query = Auth_logs.query(trx);

  query.where(builder => applyConditions(builder, whereAuthLog));
  
  Object.entries(orderBy).forEach(([column, direction]) => {
    query.orderBy(column, direction);
  });

  query = query.withGraphFetched(`
    [ 
      create_by_account
    ]
  `).modifiers({
    
  });

  return query;
}

export async function modelAuthLogs(options = {}) {
  const query = baseAuthLogQuery(options);
  return await query;
}

export async function modelAuthLog(options = {}) {
  const query = baseAuthLogQuery(options);
  return await query.first();
}



