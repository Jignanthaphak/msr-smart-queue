// /lib/serviceActions/aiAnalyzeActions.js
"use server";
import "server-only";

import { modelScreening } from "@/model/screening";
import { insertAndReturn, updateAndReturn } from "@/model/utils";
import knex from "@/lib/Knex/dbKnex";
import { datetime, nowMs } from "@/lib/utils/dateFormat";
import { gradeFns } from "@/lib/validators/form/screening/consult/regex";

const GEMINI_MODEL = "gemini-2.5-flash";
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`;

// ---------- ตารางแปลง key -> label ภาษาไทย ----------
const STRESS_LABELS = {
  stress_narcotics: "ยาเสพติด",
  stress_psychiatry: "ปัญหาสุขภาพจิต/จิตเวช",
  stress_economy: "เศรษฐกิจ/หนี้สิน",
  stress_family: "ครอบครัว",
  stress_relationship: "ความสัมพันธ์",
  stress_love: "ปัญหาความรัก",
  stress_unplanned: "ตั้งครรภ์ไม่พร้อม",
  stress_learning: "การเรียน",
  stress_gambling: "การพนัน",
  stress_games: "ติดเกม",
  stress_sex: "เรื่องเพศ",
  stress_work: "การทำงาน",
  stress_colleague: "หัวหน้างาน/เพื่อนร่วมงาน",
  stress_health: "สุขภาพ",
  stress_sleep: "การนอนหลับ",
  stress_healthfamily: "สุขภาพคนในครอบครัว/คนรัก/สัตว์เลี้ยง",
  stress_loss: "การสูญเสียคนในครอบครัว/คนรัก/สัตว์เลี้ยง",
};

// 9 ตัวเลือกการให้ความช่วยเหลือ (การ์ด 4) — AI ต้องเลือกจากรายการนี้เท่านั้น
const ASSIST_OPTIONS = [
  "การจัดการความเครียด",
  "เทคนิคคลายเครียด",
  "การปฐมพยาบาลทางใจเบื้องต้น (PFA)",
  "การปรับเปลี่ยนมุมมองและทัศนคติ",
  "การฝึกหายใจคลายเครียด",
  "การให้คำปรึกษาเบื้องต้น",
  "การนอนหลับ",
  "การออกกำลังกาย",
  "อื่นๆ",
];

const CANDIDATE_MODELS = [
  process.env.GEMINI_MODEL,
  "gemini-3.5-flash",
  "gemini-3-flash-preview",
  "gemini-2.5-flash",
].filter(Boolean);

// ---------- helper: เรียก Gemini แบบติดสปีด (Fast Failover + Timeout 3.5s) ----------
async function callGemini(prompt) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw Object.assign(new Error("ไม่พบ GEMINI_API_KEY"), { status: 500 });

  let lastErr = null;

  for (const model of CANDIDATE_MODELS) {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3500);

    try {
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        signal: controller.signal,
        body: JSON.stringify({
          contents: [{ role: "user", parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0.2,
            maxOutputTokens: 800,
            thinkingConfig: { thinkingBudget: 0 },
          },
        }),
      });

      clearTimeout(timeoutId);

      if (res.ok) {
        const json = await res.json();
        return (
          json?.candidates?.[0]?.content?.parts?.map((x) => x.text).filter(Boolean).join("\n") || ""
        );
      }

      // ถ้าเป็น 400 (เช่น ไม่รองรับ thinkingBudget) ให้ลองแบบมาตรฐาน 1 ครั้ง
      if (res.status === 400) {
        const resStd = await fetch(url, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{ role: "user", parts: [{ text: prompt }] }],
            generationConfig: {
              temperature: 0.2,
              maxOutputTokens: 800,
            },
          }),
        });
        if (resStd.ok) {
          const json = await resStd.json();
          return (
            json?.candidates?.[0]?.content?.parts?.map((x) => x.text).filter(Boolean).join("\n") || ""
          );
        }
      }

      // ถ้าเจอ 429, 503, 404 ให้สลับไปลองโมเดลตัวถัดไปทันที (ไม่รอ sleep ซ้ำ)
      console.warn(`Gemini model "${model}" status ${res.status}, failover to next candidate...`);
      lastErr = Object.assign(new Error(`Gemini API error ${res.status} (${model})`), { status: 502 });
      continue;
    } catch (netErr) {
      clearTimeout(timeoutId);
      console.warn(`Gemini model "${model}" network/timeout:`, netErr?.message || netErr);
      lastErr = Object.assign(new Error(`Gemini API error: ${netErr?.message || netErr}`), { status: 502 });
      continue;
    }
  }

  throw lastErr || Object.assign(new Error("Gemini API error"), { status: 502 });
}

// ---------- helper: parse JSON แบบทนต่อ markdown fence ----------
function parseJsonLoose(text) {
  if (!text || !text.trim()) throw new Error("AI ตอบกลับว่าง");
  let t = text.trim();
  t = t.replace(/^```(?:json)?/i, "").replace(/```$/i, "").trim();
  const start = t.indexOf("{");
  const end = t.lastIndexOf("}");
  if (start !== -1 && end !== -1 && end > start) t = t.slice(start, end + 1);
  return JSON.parse(t);
}

// ---------- helper: sanitize ตัวเลข ----------
function toIntOrNull(v) {
  if (v === null || v === undefined || v === "") return null;
  const n = Number(v);
  return Number.isFinite(n) ? Math.trunc(n) : null;
}

// ---------- ประกอบข้อมูลนิรนามจาก consult (client) + person/bio (DB) ----------
function buildAnonymizedPayload({ screening, person, bio, consultFlat, caseId }) {
  const orgProvince = person?.organization?.province?.name_in_thai || null;

  const addrs = Array.isArray(person?.persons_addresses) ? person.persons_addresses : [];
  // type 2 = ที่อยู่ปัจจุบัน, type 1 = ตามบัตร ปชช.
  const addr = addrs.find((a) => Number(a.type) === 2) || addrs.find((a) => Number(a.type) === 1) || null;
  const addressProvince = addr?.province?.name_in_thai || null;

  // สาเหตุความเครียด (เลือกเฉพาะที่ติ๊ก)
  const stressFactors = [];
  if (Number(consultFlat.stress_no_check) === 1) {
    stressFactors.push("ไม่มีเรื่องเครียดกังวล");
  } else {
    for (const [key, label] of Object.entries(STRESS_LABELS)) {
      if (Number(consultFlat[key]) === 1) stressFactors.push(label);
    }
    if (consultFlat.stress_other && String(consultFlat.stress_other).trim()) {
      stressFactors.push(`อื่นๆ: ${String(consultFlat.stress_other).trim()}`);
    }
  }

  // ความเสี่ยง + เกรด
  const gradeOf = (field, v) => {
    const n = toIntOrNull(v);
    if (n === null) return null;
    return gradeFns[field] ? gradeFns[field](n) : null;
  };
  const risk = Number(consultFlat.risk_not_found) === 1
    ? { notFound: true }
    : {
        notFound: false,
        rq: { score: toIntOrNull(consultFlat.risk_rq), grade: gradeOf("risk_rq", consultFlat.risk_rq)?.label || null },
        burnOut: { score: toIntOrNull(consultFlat.risk_burn_out), grade: gradeOf("risk_burn_out", consultFlat.risk_burn_out)?.label || null },
        st5: { score: toIntOrNull(consultFlat.risk_st5), grade: gradeOf("risk_st5", consultFlat.risk_st5)?.label || null },
        depressed2q: toIntOrNull(consultFlat.risk_depressed_2qplus) === 2 ? "มีแนวโน้มซึมเศร้า (2Q+ เป็นบวก)" : (toIntOrNull(consultFlat.risk_depressed_2qplus) === 1 ? "ไม่มี" : null),
        depressed9q: toIntOrNull(consultFlat.risk_depressed_9q) === 2 ? "คะแนน 9Q ≥ 7 (มีภาวะซึมเศร้า)" : (toIntOrNull(consultFlat.risk_depressed_9q) === 1 ? "คะแนน 9Q ≤ 7" : null),
        suicide: toIntOrNull(consultFlat.risk_suicide) === 2 ? "8Q ≥ 17 (เสี่ยงฆ่าตัวตายสูง ควรส่งต่อด่วน)" : (toIntOrNull(consultFlat.risk_suicide) === 1 ? "8Q ≤ 17" : null),
      };

  return {
    caseId,
    // *** ไม่มี ชื่อ/นามสกุล/idcard/passport/ที่อยู่ละเอียด ***
    sex: person?.sex?.title_th || "ไม่ระบุ",
    age: person?.age ?? "ไม่ระบุ",
    orgProvince,
    addressProvince,
    biofeedback: {
      stress_index: bio?.stress_index ?? null,
      fatigue_index: bio?.fatigue_index ?? null,
      mean_heart_rate: bio?.mean_heart_rate ?? null,
      wave_level: bio?.wave_level ?? null,
    },
    consulting: consultFlat.consulting || null,
    stressFactors,
    risk,
  };
}

// ---------- prompt ขั้นที่ 1: วิเคราะห์ + จัดระดับ + แนะนำ ----------
function buildAnalysisPrompt(a) {
  return `คุณเป็นผู้เชี่ยวชาญด้านสุขภาพจิตประจำศูนย์สุขภาพจิต วิเคราะห์ข้อมูลการคัดกรอง (ข้อมูลนิรนาม) ของผู้รับบริการต่อไปนี้ด้วยความเป็นมืออาชีพและเห็นอกเห็นใจ

[ข้อมูลผู้รับบริการ (นิรนาม)]
- รหัสเคส: ${a.caseId}
- เพศ: ${a.sex}
- อายุ: ${a.age} ปี
- จังหวัดหน่วยงาน: ${a.orgProvince || "-"}
- จังหวัดที่อยู่: ${a.addressProvince || "-"}

[ผลตรวจ Biofeedback]
- ดัชนีความเครียด (Stress Index): ${a.biofeedback.stress_index ?? "-"}
- ดัชนีความเหนื่อยล้า (Fatigue Index): ${a.biofeedback.fatigue_index ?? "-"}
- อัตราการเต้นหัวใจเฉลี่ย (Mean Heart Rate): ${a.biofeedback.mean_heart_rate ?? "-"}
- ระดับคลื่น (Wave Level): ${a.biofeedback.wave_level ?? "-"}

[ข้อมูลการให้คำปรึกษา]
${a.consulting || "-"}

[สาเหตุความเครียด]
${a.stressFactors.length ? a.stressFactors.join(", ") : "-"}

[ผลประเมินความเสี่ยง]
${JSON.stringify(a.risk, null, 2)}

จงตอบกลับเป็น "JSON เท่านั้น" (ห้ามมีข้อความอื่น ห้ามมี markdown) ตามโครงสร้างนี้:
{
  "riskLevel": "low | moderate | high",              // ระดับความเสี่ยงรวม: low=เขียว, moderate=เหลือง, high=แดง
  "riskLabel": "เสี่ยงต่ำ | เสี่ยงปานกลาง | เสี่ยงสูง",
  "riskAnalysis": "สรุปการวิเคราะห์ 2-4 ประโยค เชื่อมโยงค่า Bio กับความเครียด/ความเสี่ยงทางจิตใจ",
  "actionType": "normal | watch | refer",            // normal=ปกติ, watch=เฝ้าระวัง, refer=ส่งต่อ (เลือก refer เมื่อเสี่ยงสูง เช่น 8Q≥17 หรือ 9Q สูง)
  "assists": ["เลือกอย่างน้อย 1 ข้อจากรายการนี้เท่านั้น: ${ASSIST_OPTIONS.join(" / ")}"],
  "assistOther": "ระบุข้อความถ้าเลือก 'อื่นๆ' มิฉะนั้นเป็น null",
  "aiSuggestion": "ข้อเสนอแนะการให้คำปรึกษาสำหรับเจ้าหน้าที่ 2-4 ประโยค",
  "counselingExamples": ["ตัวอย่างประโยค/คำพูดที่นักจิตวิทยาคลินิกสามารถใช้พูดกับผู้รับบริการรายนี้จริง 3-5 ประโยค เขียนเป็นคำพูดโดยตรง (เชิงเห็นอกเห็นใจ สะท้อนความรู้สึก เปิดประเด็นอย่างปลอดภัย) เหมาะกับระดับความเสี่ยงและบริบทของเคส"]
}

ข้อกำหนด: ค่าใน "assists" ต้องตรงกับตัวเลือกที่ให้ไว้เป๊ะๆ; ถ้าไม่มีความเสี่ยงเด่นชัดให้ actionType เป็น "normal"; "counselingExamples" ต้องเป็นประโยคคำพูดจริงในมุมมองนักจิตวิทยาคลินิก (ไม่ใช่คำอธิบาย)`;
}

// ---------- รายชื่อโรงพยาบาลที่มีแผนกจิตเวช/กลุ่มงานจิตเวช (ครอบคลุมทุกจังหวัด) ----------
const PSYCHIATRIC_HOSPITALS_BY_PROVINCE = {
  "นนทบุรี": [
    { name: "โรงพยาบาลศรีธัญญา", note: "อ.เมืองนนทบุรี (รพ.จิตเวชเฉพาะทาง กรมสุขภาพจิต) โทร 0-2528-7800" },
    { name: "สถาบันบำราศนราดูร", note: "อ.เมืองนนทบุรี แผนกสุขภาพจิต" },
    { name: "โรงพยาบาลพระนั่งเกล้า", note: "อ.เมืองนนทบุรี กลุ่มงานจิตเวชและยาเสพติด" },
    { name: "โรงพยาบาลชลประทาน", note: "อ.ปากเกร็ด แผนกจิตเวช" }
  ],
  "ปทุมธานี": [
    { name: "สถาบันบำบัดรักษาและฟื้นฟูผู้ติดยาเสพติดแห่งชาติบรมราชชนนี (สบยช.)", note: "อ.ธัญบุรี โทร 0-2531-0080" },
    { name: "โรงพยาบาลปทุมธานี", note: "อ.เมืองปทุมธานี กลุ่มงานจิตเวช โทร 0-2587-0101" },
    { name: "โรงพยาบาลธรรมศาสตร์เฉลิมพระเกียรติ", note: "อ.คลองหลวง แผนกจิตเวชศาสตร์" }
  ],
  "พระนครศรีอยุธยา": [
    { name: "โรงพยาบาลพระนครศรีอยุธยา", note: "อ.พระนครศรีอยุธยา กลุ่มงานจิตเวช โทร 0-3521-1888" },
    { name: "โรงพยาบาลเสนา", note: "อ.เสนา กลุ่มงานจิตเวช" }
  ],
  "สระบุรี": [
    { name: "โรงพยาบาลสระบุรี", note: "อ.เมืองสระบุรี กลุ่มงานจิตเวชและยาเสพติด โทร 0-3634-3500" },
    { name: "โรงพยาบาลพระพุทธบาท", note: "อ.พระพุทธบาท กลุ่มงานจิตเวช" }
  ],
  "ลพบุรี": [
    { name: "โรงพยาบาลพระนารายณ์มหาราช", note: "อ.เมืองลพบุรี กลุ่มงานจิตเวช โทร 0-3678-5444" },
    { name: "โรงพยาบาลอานันทมหิดล", note: "อ.เมืองลพบุรี แผนกจิตเวช" }
  ],
  "สิงห์บุรี": [
    { name: "โรงพยาบาลสิงห์บุรี", note: "อ.เมืองสิงห์บุรี กลุ่มงานจิตเวช โทร 0-3652-2555" }
  ],
  "อ่างทอง": [
    { name: "โรงพยาบาลอ่างทอง", note: "อ.เมืองอ่างทอง กลุ่มงานจิตเวช โทร 0-3561-1212" }
  ],
  "นครนายก": [
    { name: "โรงพยาบาลนครนายก", note: "อ.เมืองนครนายก กลุ่มงานจิตเวช โทร 0-3731-1151" },
    { name: "ศูนย์การแพทย์สมเด็จพระเทพฯ (มศว องครักษ์)", note: "อ.องครักษ์ แผนกจิตเวช" }
  ],
  "กรุงเทพมหานคร": [
    { name: "โรงพยาบาลสมเด็จเจ้าพระยา", note: "เขตคลองสาน (รพ.จิตเวช กรมสุขภาพจิต) โทร 0-2437-0200" },
    { name: "โรงพยาบาลศรีธัญญา", note: "นนทบุรี/กทม. โทร 0-2528-7800" },
    { name: "โรงพยาบาลศิริราช", note: "เขตบางกอกน้อย ภาควิชาจิตเวชศาสตร์" },
    { name: "โรงพยาบาลจุฬาลงกรณ์", note: "เขตปทุมวัน ฝ่ายจิตเวชศาสตร์" },
    { name: "โรงพยาบาลรามาธิบดี", note: "เขตราชเทวี ภาควิชาจิตเวชศาสตร์" }
  ]
};

function resolveHospitals(province) {
  if (!province) return [];
  const clean = String(province).replace(/^(จังหวัด|จ\.)/, "").trim();
  if (PSYCHIATRIC_HOSPITALS_BY_PROVINCE[clean]) return PSYCHIATRIC_HOSPITALS_BY_PROVINCE[clean];
  for (const [k, v] of Object.entries(PSYCHIATRIC_HOSPITALS_BY_PROVINCE)) {
    if (k.includes(clean) || clean.includes(k)) return v;
  }
  return [
    { name: `โรงพยาบาลศูนย์/ทั่วไป ประจำจังหวัด${clean}`, note: "กลุ่มงานจิตเวชและยาเสพติด" },
    { name: "สายด่วนสุขภาพจิต 1323 (กรมสุขภาพจิต)", note: "โทรฟรีตลอด 24 ชั่วโมง ให้คำปรึกษาวิกฤตสุขภาพจิต" }
  ];
}

// ---------- validate/normalize ผลลัพธ์ ----------
function normalizeAnalysis(raw) {
  const riskLevel = ["low", "moderate", "high"].includes(raw?.riskLevel) ? raw.riskLevel : "moderate";
  const actionType = ["normal", "watch", "refer"].includes(raw?.actionType) ? raw.actionType : "watch";
  const riskLabelMap = { low: "เสี่ยงต่ำ", moderate: "เสี่ยงปานกลาง", high: "เสี่ยงสูง" };
  let assists = Array.isArray(raw?.assists) ? raw.assists.filter((x) => ASSIST_OPTIONS.includes(x)) : [];
  if (assists.length === 0) assists = ["การให้คำปรึกษาเบื้องต้น"]; // อย่างน้อย 1
  return {
    riskLevel,
    riskLabel: typeof raw?.riskLabel === "string" && raw.riskLabel.trim() ? raw.riskLabel : riskLabelMap[riskLevel],
    riskAnalysis: typeof raw?.riskAnalysis === "string" ? raw.riskAnalysis : "",
    actionType,
    assists,
    assistOther: raw?.assistOther && String(raw.assistOther).trim() ? String(raw.assistOther).trim() : null,
    aiSuggestion: typeof raw?.aiSuggestion === "string" ? raw.aiSuggestion : "",
    counselingExamples: Array.isArray(raw?.counselingExamples)
      ? raw.counselingExamples.map((x) => String(x).trim()).filter(Boolean)
      : (typeof raw?.counselingExamples === "string" && raw.counselingExamples.trim() ? [raw.counselingExamples.trim()] : []),
  };
}

// ---------- Clinical Fallback (วิเคราะห์ตามแนวทางกรมสุขภาพจิตเมื่อ AI ภายนอกขัดข้อง/โควตาหมด) ----------
function generateClinicalFallback(anon) {
  const r = anon?.risk || {};
  const bio = anon?.biofeedback || {};

  const isSuicideHigh = String(r.suicide || "").includes("เสี่ยงฆ่าตัวตายสูง") || String(r.suicide || "").includes("≥ 17");
  const isDepressed9q = String(r.depressed9q || "").includes("มีภาวะซึมเศร้า") || String(r.depressed9q || "").includes("≥ 7");
  const isDepressed2q = String(r.depressed2q || "").includes("เป็นบวก") || String(r.depressed2q || "").includes("มีแนวโน้ม");
  const isStressHigh = String(r?.st5?.grade || "").includes("สูง") || Number(r?.st5?.score) >= 8;
  const isBurnoutHigh = String(r?.burnOut?.grade || "").includes("สูง") || Number(r?.burnOut?.score) >= 30;

  let riskLevel = "low";
  let riskLabel = "เสี่ยงต่ำ";
  let actionType = "normal";

  if (isSuicideHigh || isDepressed9q) {
    riskLevel = "high";
    riskLabel = "เสี่ยงสูง";
    actionType = "refer";
  } else if (isDepressed2q || isStressHigh || isBurnoutHigh) {
    riskLevel = "moderate";
    riskLabel = "เสี่ยงปานกลาง";
    actionType = "watch";
  }

  const assists = [];
  if (isSuicideHigh || isDepressed9q) {
    assists.push("การปฐมพยาบาลทางใจเบื้องต้น (PFA)", "การให้คำปรึกษาเบื้องต้น");
  } else if (isStressHigh || isBurnoutHigh) {
    assists.push("การจัดการความเครียด", "เทคนิคคลายเครียด", "การฝึกหายใจคลายเครียด");
  } else {
    assists.push("การให้คำปรึกษาเบื้องต้น", "การปรับเปลี่ยนมุมมองและทัศนคติ");
  }

  const bioDesc = [];
  if (bio.stress_index) bioDesc.push(`ดัชนีความเครียด ${bio.stress_index}`);
  if (bio.fatigue_index) bioDesc.push(`ความเหนื่อยล้า ${bio.fatigue_index}`);
  if (bio.mean_heart_rate) bioDesc.push(`อัตราการเต้นหัวใจเฉลี่ย ${bio.mean_heart_rate} bpm`);
  const bioText = bioDesc.length ? `ผล Biofeedback (${bioDesc.join(", ")}) สอดคล้องกับสภาวะอารมณ์` : "ผลการประเมินทางสรีรวิทยาอยู่ในเกณฑ์ที่สอดคล้องกับแบบประเมิน";

  const riskAnalysis = `ผู้รับบริการได้รับการประเมินระดับความเสี่ยงอยู่ในกลุ่ม ${riskLabel} โดย ${bioText} ${
    isSuicideHigh
      ? "พบความเสี่ยงด้านความคิดทำร้ายตนเองที่ต้องเฝ้าระวังอย่างใกล้ชิดและส่งต่อรับการรักษาเฉพาะทาง"
      : isDepressed9q
      ? "พบภาวะซึมเศร้าที่ควรได้รับการปรึกษาและติดตามต่อเนื่อง"
      : "มีภาวะความเครียดสะสมที่ควรได้รับการสนับสนุนทางจิตใจและการผ่อนคลาย"
  }`;

  const aiSuggestion =
    actionType === "refer"
      ? "แนะนำให้ประสานงานส่งต่อผู้รับบริการเพื่อรับการประเมินและดูแลรักษาโดยจิตแพทย์หรือทีมผู้เชี่ยวชาญด้านสุขภาพจิต พร้อมติดตามผลอย่างใกล้ชิด"
      : actionType === "watch"
      ? "แนะนำให้เจ้าหน้าที่ติดตามอาการอย่างต่อเนื่อง ให้คำปรึกษาเสริมสร้างพลังใจ และฝึกทักษะการจัดการความเครียดในชีวิตประจำวัน"
      : "ส่งเสริมการดูแลสุขภาพจิตตนเอง การออกกำลังกาย และการนอนหลับที่มีคุณภาพ";

  const counselingExamples = [
    "รับฟังด้วยความเข้าใจว่าช่วงนี้คุณอาจจะกำลังเผชิญกับเรื่องที่หนักหนาและเหนื่อยล้ามากจริงๆ",
    "เราพร้อมที่จะรับฟังและอยู่เคียงข้างคุณเพื่อช่วยกันหาทางออกที่ปลอดภัยและดีที่สุดนะคะ",
    "คุณรู้สึกอย่างไรบ้างกับสิ่งต่างๆ ที่เกิดขึ้นในตอนนี้ อยากเล่าให้ฟังเพิ่มเติมไหมคะ",
  ];

  return {
    riskLevel,
    riskLabel,
    riskAnalysis,
    actionType,
    assists,
    assistOther: null,
    aiSuggestion,
    counselingExamples,
  };
}

/**
 * วิเคราะห์ผล consult ด้วย AI
 * @param {object} payload
 * @param {number|string} payload.screening_id
 * @param {object} payload.consult  - client formData { ConsultingForm, StressForm, RiskForm } หรือ flat
 * @param {boolean} [payload.force_refresh] - บังคับวิเคราะห์ใหม่แม้มีผลเดิม
 * @param {number} payload.create_by
 * @param {string} payload.session_id
 * @param {string} payload.source_file
 * @param {string} [payload.recordedBy] - ชื่อผู้บันทึก (nickname) สำหรับการ์ด 1
 */
export async function analyzeConsult(payload) {
  const started = nowMs();
  const {
    screening_id,
    consult = {},
    force_refresh = false,
    create_by = null,
    session_id = null,
    source_file = "lib/serviceActions/aiAnalyzeActions.js",
    recordedBy = null,
  } = payload || {};

  // flatten consult (รองรับทั้ง nested subform และ flat)
  const consultFlat = {
    ...(consult.ConsultingForm || {}),
    ...(consult.StressForm || {}),
    ...(consult.RiskForm || {}),
    ...consult,
  };
  delete consultFlat.ConsultingForm;
  delete consultFlat.StressForm;
  delete consultFlat.RiskForm;

  // ---------- ดึงข้อมูลจาก DB ----------
  const where = {
    whereScreening: [{ type: "and", field: "screening_id", operator: "=", value: screening_id }],
    includePerson: true,
    mustHavePerson: false,
  };
  const screening = await modelScreening(where);
  if (!screening) throw Object.assign(new Error("ไม่พบข้อมูลการคัดกรอง"), { status: 404 });

  const person = screening.person || null;
  const bio = Array.isArray(screening.biofeedback) ? screening.biofeedback[0] : screening.biofeedback || {};
  const hn = person?.hn || screening?.hn || null;
  const caseId = `SCR-${screening_id}`;

  const anon = buildAnonymizedPayload({ screening, person, bio, consultFlat, caseId });

  // 1. ตรวจสอบใน DB: ถ้าเคยวิเคราะห์ไว้แล้ว และไม่ได้สั่ง force_refresh ให้คืนผลทันที (0.01s)
  if (!force_refresh) {
    try {
      const existing = await knex("consult")
        .where({ screening_id })
        .select("ai_analysis", "ai_analyzed_at")
        .first();

      if (existing?.ai_analysis) {
        const cachedResult = typeof existing.ai_analysis === "string" ? JSON.parse(existing.ai_analysis) : existing.ai_analysis;
        if (cachedResult && cachedResult.riskLevel) {
          return {
            status: "success",
            cached: true,
            meta: {
              caseId,
              orgProvince: anon.orgProvince,
              addressProvince: anon.addressProvince,
              sex: anon.sex,
              age: anon.age,
              recordedAt: existing.ai_analyzed_at || screening?.date || null,
              recordedBy: recordedBy || screening?.create_by_account?.nickname || null,
              anonymized: true,
            },
            data: cachedResult,
          };
        }
      }
    } catch (e) {
      // ข้ามไปวิเคราะห์สด
    }
  }

  const analysisPrompt = buildAnalysisPrompt(anon);

  // state สำหรับ log (เก็บเสมอ)
  let responseRawParts = [];
  let groundingUsed = 0;
  let result = null;
  let logStatus = "success";
  let errorMessage = null;

  try {
    // ---------- ขั้นที่ 1: วิเคราะห์ (พร้อม Fast Failover + Clinical Rule Fallback) ----------
    let analysis;
    try {
      const rawText1 = await callGemini(analysisPrompt);
      responseRawParts.push("[STEP1]\n" + rawText1);
      analysis = normalizeAnalysis(parseJsonLoose(rawText1));
    } catch (geminiErr) {
      console.warn("AI generation failed or quota reached, using clinical rule fallback:", geminiErr?.message || geminiErr);
      analysis = generateClinicalFallback(anon);
      responseRawParts.push("[STEP1-FALLBACK]\n" + JSON.stringify(analysis));
    }

    // ---------- ขั้นที่ 2: ดึงรายชื่อ รพ. จิตเวชทันที (0ms - ไม่ต้องยิง API ซ้ำ) ----------
    let referral = null;
    if (analysis.actionType === "refer") {
      referral = {
        orgProvince: anon.orgProvince,
        addressProvince: anon.addressProvince,
        hospitalsByOrgProvince: resolveHospitals(anon.orgProvince),
        hospitalsByAddressProvince: anon.addressProvince && anon.addressProvince !== anon.orgProvince
          ? resolveHospitals(anon.addressProvince)
          : [],
      };
    }

    result = { ...analysis, referral };

    // ---------- บันทึกผลล่าสุดลง consult ----------
    await saveToConsult({ screening_id, create_by, result });

    return {
      status: "success",
      meta: {
        caseId,
        orgProvince: anon.orgProvince,
        addressProvince: anon.addressProvince,
        sex: anon.sex,
        age: anon.age,
        recordedAt: screening?.date || null,
        recordedBy: recordedBy || screening?.create_by_account?.nickname || null,
        anonymized: true,
      },
      data: result,
    };
  } catch (err) {
    logStatus = "error";
    errorMessage = err?.message || "AI analysis error";
    throw err;
  } finally {
    // ---------- เขียน log ประวัติเสมอ (success/error) ----------
    try {
      await insertAndReturn({
        table: "ai_analysis_logs",
        dataObj: {
          screening_id: toIntOrNull(screening_id),
          hn,
          create_by,
          session_id,
          model: GEMINI_MODEL,
          grounding_used: groundingUsed,
          request_payload: JSON.stringify(anon),
          request_prompt: analysisPrompt,
          response_raw: responseRawParts.join("\n\n").slice(0, 60000) || null,
          response_parsed: result ? JSON.stringify(result) : null,
          risk_level: result?.riskLevel || null,
          action_type: result?.actionType || null,
          status: logStatus,
          error_message: errorMessage ? String(errorMessage).slice(0, 500) : null,
          duration_ms: nowMs() - started,
          source_file,
          create_date: datetime(),
        },
      });
    } catch (logErr) {
      console.error("ai_analysis_logs insert error:", logErr);
    }
  }
}

// ---------- upsert ผลล่าสุดลงตาราง consult ----------
async function saveToConsult({ screening_id, create_by, result }) {
  const dataObj = {
    ai_analysis: JSON.stringify(result),
    ai_analyzed_at: datetime(),
  };
  await knex.transaction(async (trx) => {
    const existing = await trx("consult").where({ screening_id }).first();
    if (existing) {
      await updateAndReturn({ table: "consult", dataObj, whereObj: { screening_id }, trx });
    } else {
      await insertAndReturn({
        table: "consult",
        dataObj: { screening_id, create_by: create_by ?? 0, ...dataObj },
        whereObj: { screening_id },
        trx,
      });
    }
  });
}
