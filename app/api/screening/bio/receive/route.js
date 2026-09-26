// app/api/screening/bio/receive/route.js
"use server";
import "server-only";
import { NextResponse } from "next/server";
import knex from "@/lib/Knex/dbKnex";
import { updateBio } from "@/lib/serviceActions/bioActions";
import { datetime } from "@/lib/utils/dateFormat";
import fs from "fs";
import path from "path";

// Global cache in memory for real-time frontend pickup
if (!global._bioPushCache) {
  global._bioPushCache = new Map();
}

function toCleanInt(val, defaultVal = 0, minVal = 0, maxVal = 999) {
  if (val === null || val === undefined || String(val).trim() === "") {
    return defaultVal;
  }
  const str = String(val).trim();
  const m = str.match(/[-+]?\d*\.?\d+/);
  if (m) {
    const num = parseFloat(m[0]);
    if (!isNaN(num)) {
      const rounded = Math.round(num);
      return Math.max(minVal, Math.min(maxVal, rounded));
    }
  }
  return defaultVal;
}

// GET: ให้หน้าเว็บ MSR ตรวจสอบว่ามีข้อมูลผลตรวจถูกยิงเข้ามาใหม่สำหรับ HN นี้หรือไม่
export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const hn = (searchParams.get("hn") || "").trim();

    if (!hn) {
      return NextResponse.json({ ok: false, error: "กรุณาระบุ HN" }, { status: 400 });
    }

    const cached = global._bioPushCache.get(hn);
    if (cached && !cached.consumed) {
      // ทำเครื่องหมายว่ารับไปแล้ว
      cached.consumed = true;
      return NextResponse.json({
        ok: true,
        hasNew: true,
        data: cached.data,
      });
    }

    return NextResponse.json({ ok: true, hasNew: false });
  } catch (error) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }
}

// POST: API สำหรับรับข้อมูลผลตรวจที่ส่งมาจากเครื่อง SA-3000P อัตโนมัติ
export async function POST(req) {
  try {
    const body = await req.json();
    const hn = String(body.hn || body.chart_no || body.ChartNo || "").trim();

    if (!hn) {
      return NextResponse.json({ ok: false, error: "กรุณาระบุ HN / Chart No" }, { status: 400 });
    }

    // 1. ดักจับและปัดเศษทศนิยมเป็นจำนวนเต็มตามมาตรฐานระบบ MSR (ไม่บังคับค่าเริ่มต้นปลอม)
    const ansActivity = toCleanInt(body.ans_activity ?? body.ansActivity, 0, 0, 999);
    const ansBalance = toCleanInt(body.ans_balance ?? body.ansBalance, 0, 0, 999);
    const stressResistance = toCleanInt(body.stress_resistance ?? body.stressResistance, 0, 0, 999);
    const stressIndex = toCleanInt(body.stress_index ?? body.stressIndex, 0, 0, 999);
    const fatigueIndex = toCleanInt(body.fatigue_index ?? body.fatigueIndex, 0, 0, 999);
    const meanHeartRate = toCleanInt(body.mean_heart_rate ?? body.meanHeartRate ?? body.hr, 0, 0, 250);
    const electroCardiacStability = toCleanInt(body.electro_cardiac_stability ?? body.electroCardiacStability ?? body.stability, 0, 0, 999);
    const ectopicBeat = toCleanInt(body.ectopic_beat ?? body.ectopicBeat, 0, 0, 999);
    const waveLevel = toCleanInt(body.wave_level ?? body.waveLevel ?? body.waveType, 0, 0, 7);

    // 2. จัดการไฟล์รูปภาพรายงานผลตรวจ (ถ้าส่งรูปมาด้วย)
    let ddrImageUrl = null;
    let apgImageUrl = null;

    try {
      if (body.ddr_image_base64 || body.apg_image_base64) {
        const uploadDir = path.join(process.cwd(), "public", "uploads", "bio");
        if (!fs.existsSync(uploadDir)) {
          fs.mkdirSync(uploadDir, { recursive: true });
        }
        const timeStamp = Date.now();
        if (body.ddr_image_base64) {
          const ddrBuffer = Buffer.from(body.ddr_image_base64.replace(/^data:image\/\w+;base64,/, ""), "base64");
          const ddrFileName = `${hn}_${timeStamp}_ddr.jpg`;
          fs.writeFileSync(path.join(uploadDir, ddrFileName), ddrBuffer);
          ddrImageUrl = `/msr/uploads/bio/${ddrFileName}`;
        }
        if (body.apg_image_base64) {
          const apgBuffer = Buffer.from(body.apg_image_base64.replace(/^data:image\/\w+;base64,/, ""), "base64");
          const apgFileName = `${hn}_${timeStamp}_apg.jpg`;
          fs.writeFileSync(path.join(uploadDir, apgFileName), apgBuffer);
          apgImageUrl = `/msr/uploads/bio/${apgFileName}`;
        }
      }
    } catch (imgErr) {
      console.error("Error saving bio images:", imgErr.message);
    }

    const bioPayload = {
      hn,
      chart_no: hn,
      patient_name: body.patient_name || body.name || "-",
      exam_date: body.exam_date || datetime(),
      matched_by: body.matched_by || "api_push",
      ans_activity: ansActivity,
      ans_balance: ansBalance,
      stress_resistance: stressResistance,
      stress_index: stressIndex,
      fatigue_index: fatigueIndex,
      mean_heart_rate: meanHeartRate,
      electro_cardiac_stability: electroCardiacStability,
      ectopic_beat: ectopicBeat,
      wave_level: waveLevel,
      ddr_image_url: ddrImageUrl,
      apg_image_url: apgImageUrl,
      received_at: new Date().toISOString(),
    };

    // 3. เก็บลง Memory Cache เพื่อให้หน้าเว็บ MSR ที่กำลังเปิดอยู่ ดึงไปแสดงผลทันที
    global._bioPushCache.set(hn, {
      consumed: false,
      data: bioPayload,
      timestamp: Date.now(),
    });

    // 3. พยายามค้นหา screening ล่าสุดของ HN นี้ เพื่อบันทึกลงฐานข้อมูลตรงๆ
    let savedToDb = false;
    let screeningId = body.screening_id || null;

    try {
      if (!screeningId) {
        // ค้นหา screening_id ล่าสุดของ HN นี้
        const screeningRow = await knex("screening")
          .where("hn", hn)
          .orderBy("create_date", "desc")
          .first();

        if (screeningRow) {
          screeningId = screeningRow.screening_id;
        }
      }

      if (screeningId) {
        const uploadDir = path.join(process.cwd(), "public", "uploads", "bio");
        try {
          if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
          }
          if (body.ddr_image_base64) {
            const ddrBuffer = Buffer.from(body.ddr_image_base64.replace(/^data:image\/\w+;base64,/, ""), "base64");
            fs.writeFileSync(path.join(uploadDir, `bio_${screeningId}_ddr.jpg`), ddrBuffer);
          }
          if (body.apg_image_base64) {
            const apgBuffer = Buffer.from(body.apg_image_base64.replace(/^data:image\/\w+;base64,/, ""), "base64");
            fs.writeFileSync(path.join(uploadDir, `bio_${screeningId}_apg.jpg`), apgBuffer);
          }
        } catch (copyErr) {
          console.error("Error linking images to screeningId:", copyErr.message);
        }

        const bioFormFormatted = {
          screening_id: String(screeningId),
          ans_activity: String(ansActivity),
          ans_balance: String(ansBalance),
          stress_resistance: String(stressResistance),
          stress_index: String(stressIndex),
          fatigue_index: String(fatigueIndex),
          mean_heart_rate: String(meanHeartRate),
          electro_cardiac_stability: String(electroCardiacStability),
          ectopic_beat: String(ectopicBeat),
          wave_level: String(waveLevel),
          not_check_assessments: 0,
          cause: null,
        };

        const where = {
          whereScreening: [{ type: "and", field: "screening_id", operator: "=", value: String(screeningId) }],
          includeScreening: true,
          mustHaveScreening: true,
        };

        await updateBio(
          {
            screening_id: String(screeningId),
            create_by: 1, // System / Auto service
            session_id: "sa3000p-auto-service",
            source_file: "app/api/screening/bio/receive/route.js",
            bio: bioFormFormatted,
          },
          where
        );

        savedToDb = true;
      }
    } catch (dbErr) {
      console.log("Auto-save to DB skipped or deferred:", dbErr.message);
    }

    return NextResponse.json(
      {
        ok: true,
        message: "รับข้อมูลผลตรวจ Biofeedback สำเร็จ",
        hn,
        screening_id: screeningId,
        saved_to_db: savedToDb,
        data: bioPayload,
      },
      { status: 200 }
    );
  } catch (error) {
    return NextResponse.json({ ok: false, error: "เกิดข้อผิดพลาด: " + error.message }, { status: 500 });
  }
}
