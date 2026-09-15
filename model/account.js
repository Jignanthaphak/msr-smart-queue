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

export async function modelAccountByPidOrUsername(pid) {
  if (!pid) return null;
  const cleanPid = String(pid).trim();
  let user = null;

  // 1) ค้นหาจากคอลัมน์ citizen_id เป็นลำดับแรก (ตามที่ลูกรักสร้างไว้ในฐานข้อมูล)
  try {
    user = await tbl_account.query()
      .where('citizen_id', cleanPid)
      .withGraphFetched('[role]')
      .first();
  } catch (err) {
    console.warn("modelAccountByPidOrUsername query with 'citizen_id' fallback:", err?.message);
  }

  // 2) ตรวจสอบเผื่อมีคอลัมน์ pid
  if (!user) {
    try {
      user = await tbl_account.query()
        .where('pid', cleanPid)
        .withGraphFetched('[role]')
        .first();
    } catch (err) {
      // ignore
    }
  }

  // 3) ตรวจสอบเผื่อกรณีตั้ง username เป็นเลขบัตรประชาชน
  if (!user) {
    try {
      user = await tbl_account.query()
        .where('username', cleanPid)
        .withGraphFetched('[role]')
        .first();
    } catch (err) {
      console.warn("modelAccountByPidOrUsername query with 'username' fallback:", err?.message);
    }
  }

  return user || null;
}

