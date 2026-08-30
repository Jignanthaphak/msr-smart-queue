// /model/utils.js 
"use server";
import "server-only";
import knex from "@/lib/Knex/dbKnex";

export async function insertAndReturn({
  table,
  dataObj,
  pkField = null,
  whereObj = null,
  trx = null,
}) {

  const db = trx || knex;

  let [insertId] = await db(table).insert(dataObj);

  if (!insertId && pkField) throw new Error("ไม่สามารถอัปเดตข้อมูลได้");

  if (pkField) {

    return await db(table).where(pkField, insertId).first();

  } else {

    if (whereObj) return await db(table).where(whereObj).first();

    return insertId;
  }

}

export async function updateAndReturn({
  table, 
  dataObj, 
  whereObj, 
  trx = null
}) {

  const db = trx || knex;

  const affectedRows = await db(table).where(whereObj).update(dataObj);

  if (!affectedRows) throw new Error("ไม่สามารถอัปเดตข้อมูลได้");

  const row = await db(table).where(whereObj).first();

  return row;

}

export async function deleteAndReturn({
  table,
  whereObj,
  trx = null,
}) {
  const db = trx || knex;

  if (!whereObj || Object.keys(whereObj).length === 0) {
    throw new Error("deleteAndReturn: ต้องมี Where เพื่อป้องกันการลบทั้งหมด!");
  }

  const row = await db(table).where(whereObj).first();
  if (!row) {
    throw new Error("ไม่พบข้อมูลที่ต้องการลบ");
  }

  const affectedRows = await db(table).where(whereObj).del();

  if (!affectedRows) {
    throw new Error("ไม่สามารถลบข้อมูลได้");
  }

  return row;
}

// /model/utils.js (หรือไฟล์ที่คุณมี applyConditions)
// export async function applyConditions(builder, conditions = []) {
//   if (!Array.isArray(conditions) || conditions.length === 0) return;

//   conditions.forEach(cond => {
//     // กรณีเป็น group (nested)
//     if (cond.group) {
//       // ใช้ cond.type เป็นตัวตั้ง ถ้าไม่กำหนดให้เป็น 'and'
//       const op = (cond.type && cond.type.toLowerCase() === 'or') ? 'orWhere' : 'where';
//       // สร้าง sub-builder แล้วเรียก recursive
//       builder[op](sub => {
//         applyConditions(sub, cond.group);
//       });
//       return;
//     }

//     // กรณีเป็น condition ธรรมดา
//     if (cond.value === undefined) return; // ข้ามถ้า value ไม่กำหนด

//     // ยอมรับได้ทั้ง cond.boolean หรือ cond.type สำหรับการต่อ (and/or)
//     const bool = (cond.boolean || cond.type || 'and').toString().toLowerCase();
//     const isOr = bool === 'or';
//     const field = cond.field;
//     const operator = (cond.operator || '=').toString().toLowerCase();
//     const value = cond.value;

//     if (value === null) {
//       // null handling
//       if (operator === 'is') {
//         if (isOr) builder.orWhereNull(field);
//         else builder.whereNull(field);
//       } else if (operator === 'is not' || operator === 'isnot' || operator === 'is_not') {
//         if (isOr) builder.orWhereNotNull(field);
//         else builder.whereNotNull(field);
//       } else {
//         // fallback: ถ้าใช้ operator อื่นแต่ value null ให้ใช้ whereNull
//         if (isOr) builder.orWhereNull(field);
//         else builder.whereNull(field);
//       }
//     } else {
//       // normal comparison
//       if (isOr) builder.orWhere(field, cond.operator, value);
//       else builder.where(field, cond.operator, value);
//     }
//   });
// }

export async function applyConditions(builder, conditions = []) {
  if (!Array.isArray(conditions) || conditions.length === 0) return;

  conditions.forEach(cond => {
    // กรณีเป็น group (nested)
    if (cond.group) {
      // ใช้ cond.type เป็นตัวตั้ง ถ้าไม่กำหนดให้เป็น 'and'
      const op = (cond.type && cond.type.toLowerCase() === 'or') ? 'orWhere' : 'where';
      // สร้าง sub-builder แล้วเรียก recursive
      builder[op](sub => {
        applyConditions(sub, cond.group);
      });
      return;
    }

    // กรณีเป็น condition ธรรมดา
    if (cond.value === undefined) return; // ข้ามถ้า value ไม่กำหนด

    // ยอมรับได้ทั้ง cond.boolean หรือ cond.type สำหรับการต่อ (and/or)
    const bool = (cond.boolean || cond.type || 'and').toString().toLowerCase();
    const isOr = bool === 'or';
    const field = cond.field;
    const operator = (cond.operator || '=').toString().toLowerCase();
    const value = cond.value;

    // ✅ ตรวจถ้า field มี "(" แปลว่าเป็นฟังก์ชัน เช่น DATE(create_date)
    const isRawField = field.includes("(") && field.includes(")");

    if (value === null) {
      if (operator === 'is') {
        isOr ? builder.orWhereNull(field) : builder.whereNull(field);
      } else if (['is not', 'isnot', 'is_not'].includes(operator)) {
        isOr ? builder.orWhereNotNull(field) : builder.whereNotNull(field);
      } else {
        isOr ? builder.orWhereNull(field) : builder.whereNull(field);
      }
    } else if (isRawField) {
      // ✅ ใช้ whereRaw() แทน
      const clause = `${field} ${cond.operator} ?`;
      if (isOr) builder.orWhereRaw(clause, [value]);
      else builder.whereRaw(clause, [value]);
    } else {
      // ✅ ปกติ
      if (isOr) builder.orWhere(field, cond.operator, value);
      else builder.where(field, cond.operator, value);
    }
  });
}

