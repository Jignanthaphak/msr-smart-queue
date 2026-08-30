// /model/occupations.js
"use server";
import "server-only";
import Occupations from "@/lib/Knex/model/occupations";
import {applyConditions} from "@/model/utils";

function baseOccupationsQuery({
  whereOccupation = [],
  orderBy = {},
  trx = null, 
}) {

  let query = Occupations.query(trx);
  query.where(builder => applyConditions(builder, whereOccupation));

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

export async function modelOccupations(options = {}) {
 
  let query = baseOccupationsQuery(options);
  let result = await query;

  return result;
}

export async function modelOccupation(options = {}) {

  const query = baseOccupationsQuery(options);
  let result = await query.first();

  return result;
}
