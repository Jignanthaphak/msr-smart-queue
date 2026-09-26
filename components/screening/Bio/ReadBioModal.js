// components/screening/Bio/ReadBioModal.js
"use client";

import { useState } from "react";
import ModalWrapper from "@/components/common/Modal/ModalWrapper";
import Button from "@/components/common/Form/Button";
import { 
  Activity, 
  Loader2, 
  AlertCircle, 
  CheckCircle2, 
  FileSpreadsheet, 
  RefreshCw, 
  UploadCloud 
} from "lucide-react";

import clientConfig from "@/config/Client";

export default function ReadBioModal({ hn = "", patientName = "", onSuccess, disabled = false }) {
  const [isOpen, setIsOpen] = useState(false);
  const [status, setStatus] = useState("idle"); // idle, reading, preview, error
  const [errorMessage, setErrorMessage] = useState("");
  const [bioResult, setBioResult] = useState(null);

  const handleOpen = () => {
    setIsOpen(true);
    startReadingBio();
  };

  const handleClose = () => {
    setIsOpen(false);
    setStatus("idle");
    setErrorMessage("");
    setBioResult(null);
  };

  const startReadingBio = async () => {
    setStatus("reading");
    setErrorMessage("");
    setBioResult(null);

    try {
      const queryParams = new URLSearchParams();
      if (hn) queryParams.append("hn", hn);
      if (patientName) queryParams.append("name", patientName);

      let fetchedData = null;

      // 1. ลองเชื่อมต่อผ่าน Local Agent (app.py :5001) ก่อน
      try {
        const response = await fetch(`http://localhost:5001/read-bio?${queryParams.toString()}`, {
          method: "GET",
          headers: { Accept: "application/json" },
          signal: typeof AbortSignal !== "undefined" && AbortSignal.timeout ? AbortSignal.timeout(2000) : undefined,
        });
        if (response.ok) {
          const result = await response.json();
          if (result.success && result.data) {
            fetchedData = result.data;
          }
        }
      } catch (localErr) {
        console.log("Local agent not available, trying server API:", localErr.message);
      }

      // 2. ถ้า Local Agent ไม่ตอบสนอง ให้ดึงผ่าน Next.js Server API (อ่านโฟลเดอร์เครือข่าย/OneDrive โดยตรง)
      if (!fetchedData) {
        const basePath = clientConfig?.base_path || "";
        const apiUrl = `${basePath}/api/screening/bio/read-sa3000?${queryParams.toString()}`;
        const srvResponse = await fetch(apiUrl, {
          method: "GET",
          headers: { Accept: "application/json" },
        });
        if (srvResponse.ok) {
          const srvResult = await srvResponse.json();
          if (srvResult.ok && srvResult.data) {
            fetchedData = srvResult.data;
          }
        }
      }

      if (fetchedData) {
        setBioResult(fetchedData);
        setStatus("preview");
      } else {
        setErrorMessage("ไม่พบไฟล์ผลตรวจจากเครื่อง SA-3000P ในเครือข่าย (หรือยังไม่ได้แชร์โฟลเดอร์ EXCELDATA)");
        setStatus("error");
      }
    } catch (error) {
      setErrorMessage("เกิดข้อผิดพลาดในการเชื่อมต่อ: " + error.message);
      setStatus("error");
    }
  };

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

  // Client-side fallback: Parse tab-delimited XLS directly if user uploads file
  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setStatus("reading");
    const reader = new FileReader();

    reader.onload = (event) => {
      try {
        let content = "";
        const buffer = event.target.result;
        
        // Try UTF-16LE decoding (default for SA-3000P export)
        try {
          content = new TextDecoder("utf-16le").decode(buffer);
          if (!content.includes("\t") && !content.includes("Chart")) {
            content = new TextDecoder("utf-8").decode(buffer);
          }
        } catch {
          content = new TextDecoder("utf-8").decode(buffer);
        }

        const lines = content.split(/\r?\n/).filter(l => l.trim().length > 0);
        if (lines.length < 2) {
          throw new Error("ไฟล์ไม่มีข้อมูลผลตรวจ");
        }

        const headers = lines[0].split("\t").map(h => h.trim().replace(/^\ufeff/, ""));
        const rows = lines.slice(1).map(line => {
          const cols = line.split("\t");
          const obj = {};
          headers.forEach((h, i) => obj[h] = (cols[i] || "").trim());
          return obj;
        });

        // Search matching HN or take latest row
        let target = null;
        let matchedBy = "latest";
        const cleanHn = String(hn || "").trim();

        if (cleanHn) {
          for (let i = rows.length - 1; i >= 0; i--) {
            const rowHn = String(rows[i].ChartNo || rows[i].ChartID || "").trim();
            if (rowHn === cleanHn) {
              target = rows[i];
              matchedBy = "hn";
              break;
            }
          }
        }

        if (!target) {
          target = rows[rows.length - 1];
        }

        // Parse fields (ปิดแกปทศนิยมด้วยการปัดเศษเป็นจำนวนเต็มตามมาตรฐานระบบ MSR)
        const waveLevel = toCleanInt(target["Wave Type"], 2, 1, 7);
        const hrStr = target.HR || target["MEANHRT-SUPINE"] || "";
        const meanHr = toCleanInt(hrStr, 75, 0, 150);

        let ansActivity = 100;
        let ansBalance = 40;
        let stressResistance = 100;
        let stressIndex = 85;
        let fatigueIndex = 80;
        let electroCardiacStability = 95;
        let ectopicBeat = 0;

        const psiVal = target.PSI || target["PSI-SUPINE"];
        if (psiVal) {
          stressIndex = toCleanInt(psiVal, 85, 50, 150);
        }

        const sdnnVal = target.SDNN || target["SDNN-SUPINE"];
        if (sdnnVal) {
          const sdnn = parseFloat(sdnnVal);
          if (!isNaN(sdnn)) {
            ansActivity = toCleanInt(100 + (sdnn - 45) * 1.0, 100, 50, 150);
            stressResistance = toCleanInt(100 + (sdnn - 45) * 0.8, 100, 50, 150);
          }
        }

        const lfNormVal = target.LFNorm || target["LFNORM-SUPINE"];
        if (lfNormVal) {
          const lf = parseFloat(lfNormVal);
          if (!isNaN(lf)) {
            ansBalance = toCleanInt(Math.abs(lf - 50) * 1.5, 40, 0, 150);
          }
        }

        const ecVal = target["Ectopic Beat"] || target["ARTIFACT-SUPINE"] || target["Ectopic Beat(Supine)"];
        if (ecVal) {
          ectopicBeat = toCleanInt(ecVal, 0, 0, 999);
        }

        if (target["ANS Activity"]) ansActivity = toCleanInt(target["ANS Activity"], ansActivity, 50, 150);
        if (target["ANS Balance"]) ansBalance = toCleanInt(target["ANS Balance"], ansBalance, 0, 150);
        if (target["Stress Resistance"]) stressResistance = toCleanInt(target["Stress Resistance"], stressResistance, 50, 150);
        if (target["Fatigue Index"]) fatigueIndex = toCleanInt(target["Fatigue Index"], fatigueIndex, 50, 150);
        if (target["Stability"] || target["Electro-Cardiac Stability"]) {
          electroCardiacStability = toCleanInt(target["Stability"] || target["Electro-Cardiac Stability"], 95, 50, 150);
        }

        const parsedData = {
          chart_no: target.ChartNo || target.ChartID || cleanHn || "-",
          patient_name: target["ชื่อ"] || target.Name || patientName || "-",
          exam_date: target["Exam.Date"] || target["Exam. Date"] || new Date().toLocaleString("th-TH"),
          matched_by: matchedBy,
          ans_activity: ansActivity,
          ans_balance: ansBalance,
          stress_resistance: stressResistance,
          stress_index: stressIndex,
          fatigue_index: fatigueIndex,
          mean_heart_rate: meanHr,
          electro_cardiac_stability: electroCardiacStability,
          ectopic_beat: ectopicBeat,
          wave_level: waveLevel,
        };

        setBioResult(parsedData);
        setStatus("preview");
      } catch (err) {
        setErrorMessage("อ่านไฟล์ไม่สำเร็จ: " + (err.message || "รูปแบบไฟล์ไม่ถูกต้อง"));
        setStatus("error");
      }
    };

    reader.onerror = () => {
      setErrorMessage("เกิดข้อผิดพลาดในการเปิดไฟล์");
      setStatus("error");
    };

    reader.readAsArrayBuffer(file);
  };

  const handleConfirm = () => {
    if (bioResult && onSuccess) {
      onSuccess(bioResult);
      handleClose();
    }
  };

  return (
    <>
      <Button
        onClick={handleOpen}
        disabled={disabled}
        className="action-btn outline !border-emerald-600 !text-emerald-700 hover:!bg-emerald-50 !font-semibold"
        type="button"
      >
        <span className="hide-in-modern">⚡</span>
        <Activity className="show-in-modern text-emerald-600 w-4 h-4 mr-1" />
        ดึงผลตรวจ Biofeedback (SA-3000P)
      </Button>

      <ModalWrapper isOpen={isOpen} onClosed={handleClose} allowOutsideClick={false}>
        <div className="bg-white p-6 rounded-2xl shadow-xl max-w-xl w-full text-center flex flex-col items-center">
          <div className="flex items-center gap-2 mb-2 text-emerald-700">
            <Activity className="w-7 h-7" />
            <h3 className="text-xl font-bold text-gray-800">ดึงผลการตรวจ Biofeedback (SA-3000P)</h3>
          </div>
          <p className="text-sm text-gray-500 mb-5">
            เชื่อมต่อเครื่องตรวจวัดความเครียดและหลอดเลือดผ่านระบบเครือข่ายอัตโนมัติ
          </p>

          {/* ข้อมูลผู้รับบริการปัจจุบันใน MSR */}
          <div className="w-full bg-emerald-50 border border-emerald-200 rounded-xl p-3 mb-5 flex justify-around text-sm">
            <div>
              <span className="text-gray-500">HN ผู้รับบริการ: </span>
              <strong className="text-gray-800">{hn || "-"}</strong>
            </div>
            <div>
              <span className="text-gray-500">ชื่อ: </span>
              <strong className="text-gray-800">{patientName || "-"}</strong>
            </div>
          </div>

          {/* สถานะ: กำลังค้นหาข้อมูล */}
          {status === "reading" && (
            <div className="flex flex-col items-center gap-4 my-8">
              <Loader2 className="animate-spin text-emerald-600 w-16 h-16" />
              <p className="text-gray-700 text-base font-medium">
                กำลังอ่านผลการตรวจจากเครื่อง SA-3000P ผ่านระบบเครือข่าย...
              </p>
              <span className="text-xs text-gray-400">กรุณารอสักครู่</span>
            </div>
          )}

          {/* สถานะ: แสดงผลพรีวิวก่อนนำเข้า */}
          {status === "preview" && bioResult && (
            <div className="w-full text-left my-2">
              <div className="bg-gray-50 border border-gray-200 rounded-xl p-3 mb-4">
                <div className="flex justify-between items-center mb-1">
                  <span className="text-xs font-semibold text-gray-500">ผลการตรวจจากเครื่อง SA-3000P:</span>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                    bioResult.matched_by === "hn" 
                      ? "bg-green-100 text-green-700" 
                      : "bg-amber-100 text-amber-700"
                  }`}>
                    {bioResult.matched_by === "hn" ? "✅ ตรงกับ HN ผู้รับบริการ" : "ℹ️ ผลตรวจล่าสุดในเครื่อง"}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-sm text-gray-700">
                  <div><strong>ชื่อในเครื่อง:</strong> {bioResult.patient_name || "-"}</div>
                  <div><strong>Chart No:</strong> {bioResult.chart_no || "-"}</div>
                  <div className="col-span-2"><strong>วันเวลาที่ตรวจ:</strong> {bioResult.exam_date || "-"}</div>
                </div>
              </div>

              {/* Grid 9 ค่าผลตรวจ */}
              <div className="grid grid-cols-3 gap-2.5 mb-5 text-center">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-2.5">
                  <div className="text-xs text-gray-600">ANS Activity</div>
                  <div className="text-lg font-bold text-blue-700">{bioResult.ans_activity}</div>
                </div>
                <div className="bg-teal-50 border border-teal-200 rounded-lg p-2.5">
                  <div className="text-xs text-gray-600">ANS Balance</div>
                  <div className="text-lg font-bold text-teal-700">{bioResult.ans_balance}</div>
                </div>
                <div className="bg-green-50 border border-green-200 rounded-lg p-2.5">
                  <div className="text-xs text-gray-600">Stress Resist.</div>
                  <div className="text-lg font-bold text-green-700">{bioResult.stress_resistance}</div>
                </div>
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-2.5">
                  <div className="text-xs text-gray-600">Stress Index</div>
                  <div className="text-lg font-bold text-amber-700">{bioResult.stress_index}</div>
                </div>
                <div className="bg-orange-50 border border-orange-200 rounded-lg p-2.5">
                  <div className="text-xs text-gray-600">Fatigue Index</div>
                  <div className="text-lg font-bold text-orange-700">{bioResult.fatigue_index}</div>
                </div>
                <div className="bg-rose-50 border border-rose-200 rounded-lg p-2.5">
                  <div className="text-xs text-gray-600">Mean HR</div>
                  <div className="text-lg font-bold text-rose-700">{bioResult.mean_heart_rate} <span className="text-xs font-normal">bpm</span></div>
                </div>
                <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-2.5">
                  <div className="text-xs text-gray-600">Stability</div>
                  <div className="text-lg font-bold text-indigo-700">{bioResult.electro_cardiac_stability}</div>
                </div>
                <div className="bg-purple-50 border border-purple-200 rounded-lg p-2.5">
                  <div className="text-xs text-gray-600">Ectopic Beat</div>
                  <div className="text-lg font-bold text-purple-700">{bioResult.ectopic_beat} <span className="text-xs font-normal">ครั้ง</span></div>
                </div>
                <div className="bg-emerald-50 border border-emerald-300 rounded-lg p-2.5">
                  <div className="text-xs text-gray-600">Wave Level</div>
                  <div className="text-lg font-bold text-emerald-700">ระดับ {bioResult.wave_level}</div>
                </div>
              </div>

              <div className="flex justify-end gap-3">
                <Button onClick={handleClose} className="outline">
                  ยกเลิก
                </Button>
                <Button onClick={handleConfirm} className="!bg-emerald-600 !text-white hover:!bg-emerald-700 flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4" />
                  นำเข้าข้อมูลลงฟอร์ม
                </Button>
              </div>
            </div>
          )}

          {/* สถานะ: ข้อผิดพลาด หรือไม่พบข้อมูล */}
          {status === "error" && (
            <div className="flex flex-col items-center gap-3 my-4 w-full">
              <AlertCircle className="text-red-500 w-14 h-14" />
              <p className="text-red-600 font-medium text-sm max-w-md">{errorMessage}</p>
              
              <div className="flex gap-2 mt-2">
                <Button onClick={startReadingBio} className="!bg-emerald-600 !text-white flex items-center gap-1">
                  <RefreshCw className="w-4 h-4" />
                  ลองใหม่อีกครั้ง
                </Button>
                <Button onClick={handleClose} className="outline">
                  ปิด
                </Button>
              </div>

              {/* ทางเลือกสำรอง: นำเข้าไฟล์เอง */}
              <div className="w-full mt-6 pt-4 border-t border-gray-200 text-center">
                <p className="text-xs text-gray-500 mb-2">
                  หรือเลือกไฟล์ผลตรวจ (.xls) จากเครื่อง SA-3000P เพื่อนำเข้าโดยตรง:
                </p>
                <label className="inline-flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-semibold rounded-lg cursor-pointer border border-gray-300 transition">
                  <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                  เลือกไฟล์ APGResult.xls หรือ HRVResult.xls
                  <input
                    type="file"
                    accept=".xls,.txt,.tsv"
                    className="hidden"
                    onChange={handleFileUpload}
                  />
                </label>
              </div>
            </div>
          )}
        </div>
      </ModalWrapper>
    </>
  );
}
