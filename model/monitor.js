// /model/monitor.js
"use server";
import "server-only";
import Tbl_account from "@/lib/Knex/model/tbl_account";
import {applyConditions} from "@/model/utils";

export async function modelInspectorScreenings({
  whereAccount = [],
  whereScreening = [],
  trx = null, 
}) {

    let query = Tbl_account.query(trx);

    query.where(builder => applyConditions(builder, whereAccount)) 

    query = query.withGraphFetched(`
    [
        role(roleSelect),
        screenings(screeningsSelect).[ 
            screening_status(statusSelect), 
            biofeedback.create_by_account(bioCreateByAccountSelect), 
            consult.create_by_account(consultCreateByAccountSelect), 
            create_by_account(screeningCreateByAccountSelect)
        ]
    ]
    `).modifiers({
  
        roleSelect(builder) { builder.select('role_name'); },
        screeningsSelect(builder) {
        if (whereScreening?.length) {
            applyConditions(builder, whereScreening);
          }
        },
        statusSelect(builder) { builder.select('status_name'); },
        screeningCreateByAccountSelect(builder) { builder.select('nickname'); },
        bioCreateByAccountSelect(builder) { builder.select('nickname'); },
        consultCreateByAccountSelect(builder) { builder.select('nickname'); },
    });

    const result = await query;

  return result;

}