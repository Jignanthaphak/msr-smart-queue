// lib/utils/dateFormat.js
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";
import "dayjs/locale/th.js";

dayjs.extend(utc);
dayjs.extend(timezone);

// ตั้ง timezone ค่าเริ่มต้นเป็น Bangkok
dayjs.locale("th");
dayjs.tz.setDefault("Asia/Bangkok");

/**
 * คืนค่าเฉพาะวันที่ (YYYY-MM-DD)
 */
export function date(input = new Date()) {
  return input ? dayjs(input).format("YYYY-MM-DD") : null;
}

/**
 * คืนค่าวันที่ + เวลา (YYYY-MM-DD HH:mm:ss)
 */
export function datetime(input = new Date()) {
  return input ? dayjs(input).format("YYYY-MM-DD HH:mm:ss") : null;
}

/**
 * คืนค่าเวลาอย่างเดียว (HH:mm:ss)
 */
export function times(input = new Date()) {
  return input ? dayjs(input).format("HH:mm:ss") : null;
}

/**
 * คืนค่า object ของ dayjs (เผื่อเอาไปใช้ต่อ)
 */
export function day(input = new Date()) {
  return input ? dayjs(input) : null;
}

/**
 * เวลาปัจจุบัน (timestamp, มิลลิวินาที) แทน Date.now()
 */
export function nowMs() {
  return dayjs.tz().valueOf();
}

/**
 * เวลาปัจจุบัน (timestamp, วินาที) ใช้กับ JWT หรือ expiredAt
 */
export function nowSec() {
  return dayjs.tz().unix();
}

/**
 * เวลาปัจจุบันเป็น Date object
 */
export function nowDate() {
  return dayjs.tz().toDate();
}
