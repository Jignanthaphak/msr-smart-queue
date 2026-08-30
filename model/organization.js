// /model/organization.js
"use server";
import "server-only";
import Organizations from "@/lib/Knex/model/organizations";
import {applyConditions} from "@/model/utils";

function baseOrganizationsQuery({
  whereOrganization = [],
  orderBy = {},
  trx = null, 
}) {

  let query = Organizations.query(trx);
  query.where(builder => applyConditions(builder, whereOrganization));

  Object.entries(orderBy).forEach(([column, direction]) => {
    query.orderBy(column, direction);
  });

  query = query.withGraphFetched(`
    [
      province,
      district,
      subdistrict
    ]
  `).modifiers({

   
  });

  return query;
}

export async function modelOrganizations(options = {}) {
 
  let query = baseOrganizationsQuery(options);
  let result = await query;

  return result;
}

export async function modelOrganization(options = {}) {

  const query = baseOrganizationsQuery(options);
  let result = await query.first();

  return result;
}
