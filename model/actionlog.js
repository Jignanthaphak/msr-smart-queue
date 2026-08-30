// /model/actionlog.js
"use server";
import "server-only";
import Action_log from "@/lib/Knex/model/action_log";
import {applyConditions} from "@/model/utils";

function baseActionLogQuery({
  whereActionLog = {},
  orderBy = {},
  trx = null,
}) {

  let query = Action_log.query(trx);

  query.where(builder => applyConditions(builder, whereActionLog));
  
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

export async function modelActionLogs(options = {}) {
  const query = baseActionLogQuery(options);
  return await query;
}

export async function modelActionLog(options = {}) {
  const query = baseActionLogQuery(options);
  return await query.first();
}



