// /model/account.js
"use server";
import "server-only";
import tbl_account from "@/lib/Knex/model/tbl_account";
import {applyConditions} from "@/model/utils";

function baseAccountsQuery({
  whereAccount = [],
  orderBy = {},
  trx = null, 
}) {

  let query = tbl_account.query(trx);
  query.where(builder => applyConditions(builder, whereAccount));

  Object.entries(orderBy).forEach(([column, direction]) => {
    query.orderBy(column, direction);
  });

  query = query.withGraphFetched(`
    [
      role
    ]
  `).modifiers({

  });

  return query;
}

export async function modelAccounts(options = {}) {

  let query = baseAccountsQuery(options);
  let result = await query;

  return result;
}

export async function modelAccount(options = {}) {

  const query = baseAccountsQuery(options);
  let result = await query.first();

  return result;
}
