// app/api/queue/seed-test/route.js
"use server";
import "server-only";
import { NextResponse } from "next/server";
import dbKnex from "@/lib/Knex/dbKnex";
import { date } from "@/lib/utils/dateFormat";

const TEST_PATIENTS = [
  { hn: 9001, prefix_id: 1, firstname: "สมชาย", lastname: "ใจดี", sex_id: 1 },
  { hn: 9002, prefix_id: 2, firstname: "ศิริพร", lastname: "บุญรักษา", sex_id: 2 },
  { hn: 9003, prefix_id: 1, firstname: "ประสิทธิ์", lastname: "วงศ์สว่าง", sex_id: 1 },
  { hn: 9004, prefix_id: 3, firstname: "กัญญารัตน์", lastname: "รัตนเจริญ", sex_id: 2 },
  { hn: 9005, prefix_id: 1, firstname: "ธนพล", lastname: "สุขสมบูรณ์", sex_id: 1 },
  { hn: 9006, prefix_id: 2, firstname: "พิมพ์ชนก", lastname: "เจริญผล", sex_id: 2 },
  { hn: 9007, prefix_id: 1, firstname: "ณัฐวุฒิ", lastname: "มีสุข", sex_id: 1 },
  { hn: 9008, prefix_id: 3, firstname: "ดวงใจ", lastname: "ศรีวิชัย", sex_id: 2 },
  { hn: 9009, prefix_id: 1, firstname: "ธีรภัทร", lastname: "ชูชาติ", sex_id: 1 },
  { hn: 9010, prefix_id: 2, firstname: "ปวีณา", lastname: "คงมั่น", sex_id: 2 },
  { hn: 9011, prefix_id: 1, firstname: "อนันต์", lastname: "แสงทอง", sex_id: 1 },
  { hn: 9012, prefix_id: 2, firstname: "สุพัตรา", lastname: "สันติสุข", sex_id: 2 },
  { hn: 9013, prefix_id: 1, firstname: "วิชัย", lastname: "บุญทวี", sex_id: 1 },
  { hn: 9014, prefix_id: 3, firstname: "วรรณา", lastname: "รุ่งเรือง", sex_id: 2 },
  { hn: 9015, prefix_id: 1, firstname: "กิตติศักดิ์", lastname: "พูลสวัสดิ์", sex_id: 1 },
  { hn: 9016, prefix_id: 2, firstname: "วราภรณ์", lastname: "มิตรภาพ", sex_id: 2 },
  { hn: 9017, prefix_id: 1, firstname: "ชัยวัฒน์", lastname: "รักษ์ดี", sex_id: 1 },
  { hn: 9018, prefix_id: 3, firstname: "อรทัย", lastname: "สดใส", sex_id: 2 },
  { hn: 9019, prefix_id: 1, firstname: "พงษ์ศักดิ์", lastname: "ชัยชนะ", sex_id: 1 },
  { hn: 9020, prefix_id: 2, firstname: "กมลวรรณ", lastname: "บุญมี", sex_id: 2 },
];

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get("action");
    const today = date();

    // 1) Action: Clear test queues
    if (action === "clear") {
      await dbKnex("screening").whereBetween("hn", [9001, 9020]).del();
      await dbKnex("persons").whereBetween("hn", [9001, 9020]).del();

      if (global.smartQueueState) {
        global.smartQueueState.heldList = (global.smartQueueState.heldList || []).filter(
          (h) => Number(h.hn) < 9001 || Number(h.hn) > 9020
        );
        global.smartQueueState.priorityBypassedList = (global.smartQueueState.priorityBypassedList || []).filter(
          (p) => Number(p.hn) < 9001 || Number(p.hn) > 9020
        );
        Object.keys(global.smartQueueState.rooms || {}).forEach((roomNo) => {
          const r = global.smartQueueState.rooms[roomNo];
          if (r && Number(r.current_hn) >= 9001 && Number(r.current_hn) <= 9020) {
            r.current_hn = null;
            r.patient_name = null;
            r.current_screening_id = null;
            r.status = "empty";
            r.called_at = null;
          }
        });
      }

      if (typeof global.notifyQueueClients === "function") {
        await global.notifyQueueClients();
      }

      return NextResponse.json({
        success: true,
        message: "ล้างข้อมูลทดสอบคิว 20 คนเรียบร้อยแล้วค่ะ",
        total: 0,
      });
    }

    // 2) Action: Seed 20 test queues
    for (const p of TEST_PATIENTS) {
      // Upsert into persons
      const existingPerson = await dbKnex("persons").where("hn", p.hn).first();
      if (!existingPerson) {
        await dbKnex("persons").insert({
          hn: p.hn,
          hn_index: String(p.hn),
          prefix_id: p.prefix_id,
          firstname: p.firstname,
          lastname: p.lastname,
          sex_id: p.sex_id,
          create_by: 1,
        });
      } else {
        await dbKnex("persons").where("hn", p.hn).update({
          firstname: p.firstname,
          lastname: p.lastname,
          prefix_id: p.prefix_id,
          sex_id: p.sex_id,
        });
      }

      // Upsert into screening for today (status_id = 2 "รอตรวจ")
      const existingScreening = await dbKnex("screening")
        .where("hn", p.hn)
        .where("date", today)
        .first();

      if (!existingScreening) {
        await dbKnex("screening").insert({
          date: today,
          hn: p.hn,
          create_by: 1,
          status_id: 2, // รอตรวจ
        });
      } else {
        await dbKnex("screening")
          .where("screening_id", existingScreening.screening_id)
          .update({
            status_id: 2,
            update_date: dbKnex.fn.now(),
          });
      }
    }

    // Trigger real-time SSE push to all screens
    if (typeof global.notifyQueueClients === "function") {
      await global.notifyQueueClients();
    }

    return NextResponse.json({
      success: true,
      message: `สร้างข้อมูลทดสอบคิว 20 คน (HN 9001 - 9020) สถานะรอตรวจ วันที่ ${today} เรียบร้อยแล้วค่ะ! ระบบส่งสัญญาณอัปเดตหน้าจออัตโนมัติแล้ว`,
      total: TEST_PATIENTS.length,
      patients: TEST_PATIENTS.map((p) => ({ hn: p.hn, name: `${p.firstname} ${p.lastname}` })),
    });
  } catch (error) {
    console.error("Seed test queue error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message,
      },
      { status: 500 }
    );
  }
}
