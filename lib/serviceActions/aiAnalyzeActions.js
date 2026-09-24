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
  "gemini-2.5-flash",
  "gemini-flash-latest",
  "gemini-2.5-flash-lite",
  "gemini-2.5-pro",
].filter(Boolean);

// สถานะที่ลองซ้ำได้ (ฝั่ง Gemini ชั่วคราว): 429=rate limit, 500/503=overloaded/unavailable
const RETRYABLE_STATUS = new Set([429, 500, 503]);
const MAX_RETRIES = 2;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// ---------- helper: เรียก Gemini ผ่าน REST (มี retry + auto-fallback หากเจอรุ่น 404) ----------
async function callGemini(prompt, { grounding = false } = {}) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw Object.assign(new Error("ไม่พบ GEMINI_API_KEY"), { status: 500 });

  const body = {
    contents: [{ role: "user", parts: [{ text: prompt }] }],
    generationConfig: {
      temperature: 0.3,
      maxOutputTokens: 1200,
      thinkingConfig: { thinkingBudget: 0 },
    },
  };
  if (grounding) body.tools = [{ google_search: {} }];

  let lastErr = null;

  for (const model of CANDIDATE_MODELS) {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

    for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
      let res;
      try {
        res = await fetch(url, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
      } catch (netErr) {
        lastErr = Object.assign(new Error(`Gemini network error: ${netErr?.message || netErr}`), { status: 502 });
        if (attempt < MAX_RETRIES) {
          await sleep(700 * Math.pow(2, attempt));
          continue;
        }
        break;
      }

      if (res.ok) {
        const json = await res.json();
        const text =
          json?.candidates?.[0]?.content?.parts
            ?.map((p) => p.text)
            .filter(Boolean)
            .join("\n") || "";
        return text;
      }

      // ถ้าเป็น 404 (Model not found / deprecated) ให้ลองโมเดลตัวถัดไปใน CANDIDATE_MODELS
      if (res.status === 404) {
        console.warn(`Gemini model "${model}" returned 404, falling back to next model...`);
        lastErr = Object.assign(new Error(`Gemini API error 404 (${model})`), {
          status: 502,
        });
        break;
      }

      const errText = await res.text().catch(() => "");
      lastErr = Object.assign(new Error(`Gemini API error ${res.status}`), {
        status: 502,
        extra: { geminiStatus: res.status, geminiBody: errText?.slice(0, 1000) },
      });

      if (RETRYABLE_STATUS.has(res.status) && attempt < MAX_RETRIES) {
        await sleep(700 * Math.pow(2, attempt));
        continue;
      }
      break;
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

// ---------- prompt ขั้นที่ 2: ค้นหา รพ.ที่มีแผนกจิตเวช (ใช้ Google Search grounding) ----------
function buildHospitalPrompt({ orgProvince, addressProvince }) {
  const provinces = [orgProvince, addressProvince].filter(Boolean);
  return `ค้นหารายชื่อโรงพยาบาลที่มีแผนก/บริการจิตเวช (สุขภาพจิต) ในจังหวัดต่อไปนี้ของประเทศไทย: ${provinces.join(", ")}

ให้ค้นข้อมูลจริงและตอบกลับเป็น "JSON เท่านั้น" (ห้ามข้อความอื่น ห้าม markdown) ตามโครงสร้าง:
{
  "hospitalsByOrgProvince": [ { "name": "ชื่อโรงพยาบาล", "note": "อำเภอ/ข้อมูลติดต่อถ้ามี" } ],
  "hospitalsByAddressProvince": [ { "name": "ชื่อโรงพยาบาล", "note": "อำเภอ/ข้อมูลติดต่อถ้ามี" } ]
}

- hospitalsByOrgProvince = โรงพยาบาลในจังหวัด "${orgProvince || "-"}"
- hospitalsByAddressProvince = โรงพยาบาลในจังหวัด "${addressProvince || "-"}" (ถ้าไม่มีจังหวัดที่อยู่ หรือซ้ำกับจังหวัดหน่วยงาน ให้เป็น [])
- ระบุเฉพาะโรงพยาบาลที่มีแผนกจิตเวชจริง สูงสุดจังหวัดละ 5 แห่ง`;
}

// ---------- validate/normalize ผลลัพธ์ขั้นที่ 1 ----------
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

/**
 * วิเคราะห์ผล consult ด้วย AI
 * @param {object} payload
 * @param {number|string} payload.screening_id
 * @param {object} payload.consult  - client formData { ConsultingForm, StressForm, RiskForm } หรือ flat
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
    ...consult, // เผื่อกรณีส่ง flat มาแล้ว (key ระดับบนจะทับ)
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

  const analysisPrompt = buildAnalysisPrompt(anon);

  // state สำหรับ log (เก็บเสมอ)
  let responseRawParts = [];
  let groundingUsed = 0;
  let result = null;
  let logStatus = "success";
  let errorMessage = null;

  try {
    // ---------- ขั้นที่ 1: วิเคราะห์ ----------
    const rawText1 = await callGemini(analysisPrompt);
    responseRawParts.push("[STEP1]\n" + rawText1);
    const analysis = normalizeAnalysis(parseJsonLoose(rawText1));

    // ---------- ขั้นที่ 2: ค้น รพ. เฉพาะเมื่อ refer ----------
    let referral = null;
    if (analysis.actionType === "refer") {
      groundingUsed = 1;
      const hospitalPrompt = buildHospitalPrompt({
        orgProvince: anon.orgProvince,
        addressProvince: anon.addressProvince,
      });
      try {
        const rawText2 = await callGemini(hospitalPrompt, { grounding: true });
        responseRawParts.push("[STEP2]\n" + rawText2);
        const hosp = parseJsonLoose(rawText2);
        referral = {
          orgProvince: anon.orgProvince,
          addressProvince: anon.addressProvince,
          hospitalsByOrgProvince: Array.isArray(hosp?.hospitalsByOrgProvince) ? hosp.hospitalsByOrgProvince : [],
          hospitalsByAddressProvince: Array.isArray(hosp?.hospitalsByAddressProvince) ? hosp.hospitalsByAddressProvince : [],
        };
      } catch (e2) {
        // ถ้า grounding ล้มเหลว ยังคืนผลวิเคราะห์ได้ พร้อมแจ้งว่าค้น รพ.ไม่สำเร็จ
        responseRawParts.push("[STEP2-ERROR]\n" + (e2?.message || String(e2)));
        referral = {
          orgProvince: anon.orgProvince,
          addressProvince: anon.addressProvince,
          hospitalsByOrgProvince: [],
          hospitalsByAddressProvince: [],
          error: "ไม่สามารถค้นหารายชื่อโรงพยาบาลอัตโนมัติได้ กรุณาตรวจสอบด้วยตนเอง",
        };
      }
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
