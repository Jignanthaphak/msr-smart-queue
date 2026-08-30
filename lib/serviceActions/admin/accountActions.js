// lib/serviceActions/admin/accountActions.js
"use server";
import "server-only";
import { insertAndReturn, updateAndReturn, deleteAndReturn } from "@/model/utils";
import knex from "@/lib/Knex/dbKnex";
import { modelAccounts, modelAccount } from "@/model/account";
import { date, datetime, times, day, nowMs, nowSec, nowDate } from "@/lib/utils/dateFormat";
import bcrypt from "bcryptjs";
import { InputSchema } from "@/lib/validators/form/common/schema";
import { BaseSchema } from "@/lib/validators/form/login/schema";

export async function getAccounts(where = {}) {
  try {

    const whereAccount = where?.whereAccount || null;

    const accounts = await modelAccounts({ whereAccount });
    if (Array.isArray(accounts) ? accounts.length === 0 : !accounts) throw Object.assign(new Error("ไม่พบข้อมูล"), { status: 404 });
    
    return accounts;

  } catch (err) {
    console.error("getAccounts error:", err);
    throw err;
  }
}

export async function insertAccount(payload) {

  try {

    const parse = InputSchema.safeParse(payload);
    if (!parse.success) throw Object.assign(new Error(parse.error.issues[0].message), { status: 400 });

    const parseData = parse.data;

    const user_id = parseData.user_id;
    const nickname = parseData.nickname;
    const username = parseData.username;
    const password = parseData.password;
    const role_id = parseData.role_id;
    const status = parseData.status;
    const create_by = parseData.create_by;
    const session_id = parseData.session_id;
    const source_file = parseData.source_file;
  
    const accountData = {
      nickname: nickname,
      username: username,
      role_id: role_id,
      status: status,
    };

    // ถ้ามี password ให้ hash ด้วย bcrypt แล้วเพิ่มใน data
    if (password && password.trim() !== "") {
      const passwordHash = await bcrypt.hash(password, 12); // saltRounds 12
      accountData.password = passwordHash;
    }

    await knex.transaction(async (trx) => {

      let currentAccountId = user_id;
      let typeAction = "insert";

      let newData;
      let oldData;

      const existingAccount = await modelAccount({
        whereAccount: [
          { type: 'and', field: 'username', operator: '=', value: username },
          { type: 'and', field: 'user_id', operator: '!=', value: user_id },
        ],
        trx}
      );

      if (Array.isArray(existingAccount) ? existingAccount.length > 0 : !!existingAccount) throw Object.assign(new Error(`Account "${existingAccount.username}" มีอยู่แล้ว`), { status: 404 });

      if (!currentAccountId) {

        newData = await insertAndReturn({
            table: "tbl_account", 
            dataObj: accountData, 
            pkField: "user_id", 
            trx
        });

        currentAccountId = newData.user_id;
    
      } else {
      
        typeAction = "update";

        oldData = await modelAccount({
          whereAccount: [
            { type: 'and', field: 'user_id', operator: '=', value: currentAccountId },
          ],
          trx
        });

        if (Array.isArray(oldData) ? oldData.length === 0 : !oldData) throw Object.assign(new Error(`ไม่พบข้อมูลที่จะแก้ไข`), { status: 404 });

        newData = await updateAndReturn({
            table: "tbl_account",
            dataObj: accountData,
            whereObj: { user_id: currentAccountId },
            trx
        });
      
      }

      await insertAndReturn({
          table: "action_logs", 
          dataObj: {
              entity_type: 'tbl_account',
              entity_id: currentAccountId,
              action: typeAction,
              create_by: create_by,
              session_id,
              old_data: oldData ? JSON.stringify(oldData) : null,
              new_data: JSON.stringify(newData),
              source_file: source_file,
          },
          trx
      });
          
    });


  } catch (err) {

    console.error("insertAccount error:", err);
    throw err;

  }
}

export async function deleteAccount(payload, where = {}) {

  try {

    const parse = InputSchema.safeParse(payload);
    if (!parse.success) throw Object.assign(new Error(parse.error.issues[0].message), { status: 400 });

    const parseData = parse.data;
  
    const user_id = parseData.user_id;
    const create_by = parseData.create_by;
    const session_id = parseData.session_id;
    const source_file = parseData.source_file;

    const whereAccount = where?.whereAccount || null;

    await knex.transaction(async (trx) => {


      const existingAccount = await modelAccount({
        whereAccount,
        trx
      });
      if (Array.isArray(existingAccount) ? existingAccount.length === 0 : !existingAccount) throw Object.assign(new Error(`ไม่พบข้อมูลที่จะลบ`), { status: 404 });

      if(existingAccount.user_id === user_id) throw Object.assign(new Error(`ไม่สามารถลบข้อมูลตัวเองได้`), { status: 404 });

      await deleteAndReturn({
          table: "tbl_account", 
          whereObj:{ user_id: user_id}, 
          trx
      });

      await insertAndReturn({
          table: "action_logs", 
          dataObj: {
              entity_type: 'tbl_account',
              entity_id: user_id,
              action: "delete",
              create_by: create_by,
              session_id,
              old_data: JSON.stringify(existingAccount),
              new_data: null,
              source_file: source_file,
          },
          trx
      });

    });

  } catch (err) {
    console.error("deleteAccount error:", err);
    throw err;
  }

}

export async function updateStatusAccount(payload, where = {}) {

  try {

    const parse = InputSchema.safeParse(payload);
    if (!parse.success) throw Object.assign(new Error(parse.error.issues[0].message), { status: 400 });

    const parseData = parse.data;
  
    const user_id = parseData.user_id;
    const status = parseData.status;
    const create_by = parseData.create_by;
    const session_id = parseData.session_id;
    const source_file = parseData.source_file;

    const whereAccount = where?.whereAccount || null;

    await knex.transaction(async (trx) => {

      const oldData = await modelAccount({
        whereAccount,
        trx
      });
      if (Array.isArray(oldData) ? oldData.length === 0 : !oldData) throw Object.assign(new Error(`ไม่พบข้อมูลที่จะปรับสถานะ`), { status: 404 });

      const newData = await updateAndReturn({
          table: "tbl_account",
          dataObj:{ status: status, update_date: datetime() },
          whereObj: { user_id: user_id},
          trx
      });

      await insertAndReturn({
          table: "action_logs", 
          dataObj: {
              entity_type: 'tbl_account',
              entity_id: user_id,
              action: "update",
              create_by: create_by,
              session_id,
              old_data: JSON.stringify(oldData),
              new_data: JSON.stringify(newData),
              source_file: source_file,
          },
          trx
      });

    });
  

  } catch (err) {
    console.error("updateStatusAccount error:", err);
    throw err;
  }

}

export async function updateIsAdminAccount(payload, where = {}) {

  try {

    const parse = InputSchema.safeParse(payload);
    if (!parse.success) throw Object.assign(new Error(parse.error.issues[0].message), { status: 400 });

    const parseData = parse.data;
  
    const user_id = parseData.user_id;
    const status = parseData.status;
    const create_by = parseData.create_by;
    const session_id = parseData.session_id;
    const source_file = parseData.source_file;

    const whereAccount = where?.whereAccount || null;

    await knex.transaction(async (trx) => {

      const oldData = await modelAccount({
        whereAccount,
        trx
      });
      if (Array.isArray(oldData) ? oldData.length === 0 : !oldData) throw Object.assign(new Error(`ไม่พบข้อมูลที่จะปรับสถานะ`), { status: 404 });

      const newData = await updateAndReturn({
          table: "tbl_account",
          dataObj:{ is_admin_panel: status, update_date: datetime() },
          whereObj: { user_id: user_id},
          trx
      });

      await insertAndReturn({
          table: "action_logs", 
          dataObj: {
              entity_type: 'tbl_account',
              entity_id: user_id,
              action: "update",
              create_by: create_by,
              session_id,
              old_data: JSON.stringify(oldData),
              new_data: JSON.stringify(newData),
              source_file: source_file,
          },
          trx
      });

    });
  

  } catch (err) {
    console.error("updateStatusAccount error:", err);
    throw err;
  }

}

export async function resetPassAccount(payload) {

  try {

    const dataParse = {
      password: payload?.password || null,
      new_password: payload?.new_password || null
    }

    const parse = BaseSchema.omit({ username: true }).safeParse(dataParse);
    if (!parse.success) throw Object.assign(new Error(parse.error.issues[0].message), { status: 400 });

    const { password, new_password } = parse.data;

    const create_by = payload.create_by;
    const session_id = payload.session_id;
    const source_file = payload.source_file;

    const whereAccount = [
      { type: 'and', field: 'user_id', operator: '=', value: create_by },
    ]
    const accountRaw = await modelAccount({whereAccount});

    const account = Array.isArray(accountRaw) ? accountRaw[0] : accountRaw;

    if (!account) throw Object.assign(new Error("ไม่พบบัญชีผู้ใช้งาน"), { status: 400 });

    const storedHash = account.password || "";

    // ยอมรับเฉพาะ bcrypt เท่านั้น
    const isBcrypt =
      storedHash.startsWith("$2a$") ||
      storedHash.startsWith("$2b$") ||
      storedHash.startsWith("$2y$");

    if (!isBcrypt) {
      // ถ้า hash เดิมไม่ใช่ bcrypt แสดงว่ารหัสผ่านยังเป็นรูปแบบเก่า / ไม่ปลอดภัย
      throw Object.assign(
        new Error("รูปแบบรหัสผ่านเดิมไม่ปลอดภัย กรุณาติดต่อผู้ดูแลระบบ"),
        { status: 400 }
      );
    }

    // ตรวจรหัสผ่านเก่าด้วย bcrypt
    const oldOk = await bcrypt.compare(password, storedHash);
    if (!oldOk) {
      throw Object.assign(new Error("รหัสผ่านเก่าไม่ถูกต้อง"), { status: 401 });
    }

    // ตรวจว่ารหัสผ่านใหม่ไม่ซ้ำกับรหัสผ่านเดิม
    const sameAsOld = await bcrypt.compare(new_password, storedHash);
    if (sameAsOld) {
      throw Object.assign(
        new Error("รหัสผ่านใหม่ต้องไม่ซ้ำกับรหัสผ่านเดิม"),
        { status: 401 }
      );
    }

    // hash รหัสผ่านใหม่ด้วย bcrypt
    const newHash = await bcrypt.hash(new_password, 12);

    await knex.transaction(async (trx) => {

      const newData = await updateAndReturn({
          table: "tbl_account",
          dataObj: {password: newHash},
          whereObj: { user_id: create_by },
          trx
      });

      await insertAndReturn({
          table: "action_logs", 
          dataObj: {
              entity_type: 'tbl_account',
              entity_id: create_by,
              action: "update",
              create_by: create_by,
              session_id,
              old_data: JSON.stringify(account),
              new_data: JSON.stringify(newData),
              source_file: source_file,
          },
          trx
      });
          
    });

    return true;

  } catch (err) {

    console.error("resetPassAccount error:", err);
    throw err;

  }
}


