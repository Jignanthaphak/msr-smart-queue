// /model/healthcareright.js
"use server";
import "server-only";
import Healthcare_right from "@/lib/Knex/model/healthcare_right";
import {applyConditions} from "@/model/utils";

function baseHealthcaresQuery({
  whereHealthcare = [],
  orderBy = {},
  trx = null, 
}) {

  let query = Healthcare_right.query(trx);
  query.where(builder => applyConditions(builder, whereHealthcare));

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

export async function modelHealthcares(options = {}) {
 
  let query = baseHealthcaresQuery(options);
  let result = await query;

  return result;
}

export async function modelHealthcare(options = {}) {

  const query = baseHealthcaresQuery(options);
  let result = await query.first();

  return result;
}
