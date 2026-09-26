// app/api/screening/bio/read-sa3000/route.js
"use server";
import "server-only";
import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

const CANDIDATE_PATHS = [
  process.env.SA_BIO_DATA_DIR || "",
  "D:\\OneDrive\\แฟรชไดรฟ\\SAViewer_New THAI\\EXCELDATA",
  "D:\\OneDrive\\แฟรชไดรฟ\\SA THAI\\EXCELDATA",
  "\\\\SA3000P\\EXCELDATA",
  "\\\\SA3000P\\SA THAI\\EXCELDATA",
  "C:\\SA\\EXCELDATA",
  "C:\\SA THAI\\EXCELDATA",
  "C:\\SAViewer_New THAI\\EXCELDATA",
];

function findBioFolder() {
  for (const p of CANDIDATE_PATHS) {
    if (p && fs.existsSync(p)) {
      return p;
    }
  }
  return null;
}

function parseTsvFile(filePath) {
  if (!fs.existsSync(filePath)) return [];

  const buffer = fs.readFileSync(filePath);
  let text = "";

  // Try UTF-16LE first (Medicore export default)
  try {
    text = buffer.toString("utf16le");
    if (!text.includes("\t") && !text.includes("Chart")) {
      text = buffer.toString("utf8");
    }
  } catch {
    text = buffer.toString("utf8");
  }

  const lines = text.split(/\r?\n/).filter((l) => l.trim().length > 0);
  if (lines.length < 2) return [];

  const headers = lines[0].split("\t").map((h) => h.trim().replace(/^\ufeff/, ""));
  return lines.slice(1).map((line) => {
    const cols = line.split("\t");
    const obj = {};
    headers.forEach((h, i) => {
      obj[h] = (cols[i] || "").trim();
    });
    return obj;
  });
}

function toCleanInt(val, defaultVal = 100, minVal = 0, maxVal = 150) {
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

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const hn = (searchParams.get("hn") || "").trim();
    const name = (searchParams.get("name") || "").trim().toLowerCase();

    const folder = findBioFolder();
    if (!folder) {
      return NextResponse.json(
        { ok: false, error: "ไม่พบโฟลเดอร์ผลตรวจ SA-3000P ในเครือข่ายหรือในเครื่อง" },
        { status: 404 }
      );
    }

    const apgPath = path.join(folder, "APGResult.xls");
    const hrvPath = path.join(folder, "HRVResult.xls");

    const apgRows = parseTsvFile(apgPath);
    const hrvRows = parseTsvFile(hrvPath);

    if (apgRows.length === 0 && hrvRows.length === 0) {
      return NextResponse.json(
        { ok: false, error: `ไม่พบไฟล์ผลตรวจ (APGResult.xls / HRVResult.xls) ใน ${folder}` },
        { status: 404 }
      );
    }

    let targetApg = null;
    let targetHrv = null;
    let matchedBy = "latest";

    // 1. Search by HN
    if (hn) {
      for (let i = apgRows.length - 1; i >= 0; i--) {
        const rHn = apgRows[i].ChartNo || apgRows[i].ChartID || "";
        if (rHn === hn) {
          targetApg = apgRows[i];
          matchedBy = "hn";
          break;
        }
      }
      for (let i = hrvRows.length - 1; i >= 0; i--) {
        const rHn = hrvRows[i].ChartNo || hrvRows[i].ChartID || "";
        if (rHn === hn) {
          targetHrv = hrvRows[i];
          matchedBy = "hn";
          break;
        }
      }
    }

    // 2. Search by Name
    if (!targetApg && !targetHrv && name) {
      for (let i = apgRows.length - 1; i >= 0; i--) {
        const rName = (apgRows[i]["ชื่อ"] || apgRows[i].Name || "").toLowerCase();
        if (rName && (rName.includes(name) || name.includes(rName))) {
          targetApg = apgRows[i];
          matchedBy = "name";
          break;
        }
      }
      for (let i = hrvRows.length - 1; i >= 0; i--) {
        const rName = (hrvRows[i].Name || hrvRows[i]["ชื่อ"] || "").toLowerCase();
        if (rName && (rName.includes(name) || name.includes(rName))) {
          targetHrv = hrvRows[i];
          matchedBy = "name";
          break;
        }
      }
    }

    // 3. Fallback to latest
    if (!targetApg && apgRows.length > 0) targetApg = apgRows[apgRows.length - 1];
    if (!targetHrv && hrvRows.length > 0) targetHrv = hrvRows[hrvRows.length - 1];

    const chartNo = targetApg?.ChartNo || targetApg?.ChartID || targetHrv?.ChartNo || hn || "-";
    const patientName = targetApg?.["ชื่อ"] || targetApg?.Name || targetHrv?.Name || targetHrv?.["ชื่อ"] || "-";
    const examDate = targetApg?.["Exam.Date"] || targetApg?.["Exam. Date"] || targetHrv?.["Exam.Date"] || "-";

    // Wave Level (1 - 7 ปิดแกปทศนิยมด้วยการปัดเศษ)
    const waveLevel = toCleanInt(targetApg?.["Wave Type"], 2, 1, 7);

    // Mean Heart Rate (ปิดแกปทศนิยมด้วยการปัดเศษ)
    const hrStr = targetApg?.HR || targetHrv?.HR || targetHrv?.["MEANHRT-SUPINE"] || "";
    const meanHeartRate = toCleanInt(hrStr, 75, 0, 150);

    // HRV parameters (ไม่ใส่ตัวเลขสุ่มหลอกตา หากไม่มีไฟล์ HRV ให้เป็น null หรือค่าจริงเท่านั้น)
    let ansActivity = null;
    let ansBalance = null;
    let stressResistance = null;
    let stressIndex = null;
    let fatigueIndex = null;
    let electroCardiacStability = null;
    let ectopicBeat = null;

    if (targetHrv) {
      const psiVal = targetHrv.PSI || targetHrv["PSI-SUPINE"];
      if (psiVal) {
        stressIndex = toCleanInt(psiVal, 85, 50, 150);
      }

      const sdnnVal = targetHrv.SDNN || targetHrv["SDNN-SUPINE"];
      if (sdnnVal) {
        const sdnn = parseFloat(sdnnVal);
        if (!isNaN(sdnn)) {
          ansActivity = toCleanInt(100 + (sdnn - 45) * 1.0, 100, 50, 150);
          stressResistance = toCleanInt(100 + (sdnn - 45) * 0.8, 100, 50, 150);
        }
      }

      const lfNormVal = targetHrv.LFNorm || targetHrv["LFNORM-SUPINE"];
      if (lfNormVal) {
        const lf = parseFloat(lfNormVal);
        if (!isNaN(lf)) {
          ansBalance = toCleanInt(Math.abs(lf - 50) * 1.5, 40, 0, 150);
        }
      }

      const ecVal = targetHrv["Ectopic Beat"] || targetHrv["ARTIFACT-SUPINE"] || targetHrv["Ectopic Beat(Supine)"];
      if (ecVal) {
        ectopicBeat = toCleanInt(ecVal, 0, 0, 999);
      }

      // Check direct score columns if present from new machine exports
      if (targetHrv["ANS Activity"]) ansActivity = toCleanInt(targetHrv["ANS Activity"], ansActivity, 50, 150);
      if (targetHrv["ANS Balance"]) ansBalance = toCleanInt(targetHrv["ANS Balance"], ansBalance, 0, 150);
      if (targetHrv["Stress Resistance"]) stressResistance = toCleanInt(targetHrv["Stress Resistance"], stressResistance, 50, 150);
      if (targetHrv["Fatigue Index"]) fatigueIndex = toCleanInt(targetHrv["Fatigue Index"], fatigueIndex, 50, 150);
      if (targetHrv["Stability"] || targetHrv["Electro-Cardiac Stability"]) {
        electroCardiacStability = toCleanInt(targetHrv["Stability"] || targetHrv["Electro-Cardiac Stability"], 95, 50, 150);
      }
    }

    const data = {
      chart_no: chartNo,
      patient_name: patientName,
      exam_date: examDate,
      matched_by: matchedBy,
      ans_activity: ansActivity,
      ans_balance: ansBalance,
      stress_resistance: stressResistance,
      stress_index: stressIndex,
      fatigue_index: fatigueIndex,
      mean_heart_rate: meanHeartRate,
      electro_cardiac_stability: electroCardiacStability,
      ectopic_beat: ectopicBeat,
      wave_level: waveLevel,
    };

    return NextResponse.json({ ok: true, data }, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: "เกิดข้อผิดพลาดในการอ่านผลตรวจ: " + error.message },
      { status: 500 }
    );
  }
}
