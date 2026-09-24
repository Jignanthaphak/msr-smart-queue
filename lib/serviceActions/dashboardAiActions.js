// /lib/serviceActions/dashboardAiActions.js
// AI ข้อเสนอแนะเชิงนโยบาย สำหรับ "แดชบอร์ดสรุปผลการคัดกรองสุขภาพจิต"
// *** แยกขาดจากระบบวิเคราะห์ consult รายเคส (aiAnalyzeActions.js) — ไม่แตะ consult / ai_analysis_logs ***
"use server";
import "server-only";

// ลิสต์โมเดลที่ใช้งานได้จริง (ตัดรุ่นเก่าที่ deprecated/404 ออก)
const CANDIDATE_MODELS = [
  process.env.GEMINI_MODEL,
  "gemini-3.5-flash",
  "gemini-3-flash-preview",
  "gemini-2.5-flash",
].filter(Boolean);

const RETRYABLE_STATUS = new Set([500, 503]);
const MAX_RETRIES = 2;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// แคชผลลัพธ์ในหน่วยความจำ 5 นาที ช่วยให้โหลดซ้ำได้ทันที (0ms) และประหยัดโควตา API
const policyCache = new Map();
const CACHE_TTL_MS = 5 * 60 * 1000;

function getCacheKey(stats) {
  const s = stats || {};
  const provSummary = (Array.isArray(s.byProvince) ? s.byProvince : [])
    .map((r) => `${r?.province || ""}:${r?.high || 0}`)
    .sort()
    .join(",");
  return `${s.total || 0}_${s.highRiskCount || 0}_${s.forwardCount || 0}_${provSummary}`;
}

// ---------- เรียก Gemini ผ่าน REST (พร้อม auto-fallback และ fast configuration) ----------
async function callGemini(prompt) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw Object.assign(new Error("ไม่พบ GEMINI_API_KEY"), { status: 500 });

  let lastErr = null;

  for (const model of CANDIDATE_MODELS) {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

    for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
      let res;
      try {
        // ใช้ thinkingBudget: 0 เพื่อความรวดเร็วสูงสุด (2-3 วินาที)
        res = await fetch(url, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{ role: "user", parts: [{ text: prompt }] }],
            generationConfig: {
              temperature: 0.2,
              maxOutputTokens: 1000,
              thinkingConfig: { thinkingBudget: 0 },
            },
          }),
        });

        // ถ้าโมเดลบางรุ่นไม่รองรับ thinkingConfig (400) ให้ส่งแบบปกติทันที
        if (res.status === 400) {
          res = await fetch(url, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              contents: [{ role: "user", parts: [{ text: prompt }] }],
              generationConfig: {
                temperature: 0.2,
                maxOutputTokens: 1200,
              },
            }),
          });
        }
      } catch (netErr) {
        lastErr = Object.assign(new Error(`Gemini network error: ${netErr?.message || netErr}`), { status: 502 });
        if (attempt < MAX_RETRIES) { await sleep(500 * Math.pow(2, attempt)); continue; }
        break;
      }

      if (res.ok) {
        const json = await res.json();
        return (
          json?.candidates?.[0]?.content?.parts?.map((x) => x.text).filter(Boolean).join("\n") || ""
        );
      }

      // ถ้าเป็น 429 (Quota exceeded / Rate limit) ให้สลับไปลองโมเดลตัวถัดไปทันที
      if (res.status === 429) {
        console.warn(`Gemini model "${model}" quota exceeded (429), switching to next model...`);
        lastErr = Object.assign(new Error(`Gemini API error 429 (${model})`), { status: 429 });
        break;
      }

      // ถ้าเป็น 404 (Model deprecated) ให้ข้ามไปลองโมเดลตัวถัดไป
      if (res.status === 404) {
        console.warn(`Gemini model "${model}" returned 404, falling back to next candidate...`);
        lastErr = Object.assign(new Error(`Gemini API error 404 (${model})`), { status: 502 });
        break;
      }

      const errText = await res.text().catch(() => "");
      lastErr = Object.assign(new Error(`Gemini API error ${res.status}`), {
        status: 502,
        extra: { geminiStatus: res.status, geminiBody: errText?.slice(0, 1000) },
      });

      if (RETRYABLE_STATUS.has(res.status) && attempt < MAX_RETRIES) {
        await sleep(600 * Math.pow(2, attempt));
        continue;
      }
      break;
    }
  }

  throw lastErr || Object.assign(new Error("Gemini API error"), { status: 502 });
}

// ---------- parse JSON แบบทนต่อ markdown fence (รองรับ array) ----------
function parseJsonLoose(text) {
  if (!text || !text.trim()) throw new Error("AI ตอบกลับว่าง");
  let t = text.trim().replace(/^```(?:json)?/i, "").replace(/```$/i, "").trim();
  const s = t.indexOf("[");
  const e = t.lastIndexOf("]");
  if (s !== -1 && e !== -1 && e > s) t = t.slice(s, e + 1);
  return JSON.parse(t);
}

// ---------- สร้าง prompt จากสถิติภาพรวม ----------
function buildPolicyPrompt(stats) {
  const s = stats || {};
  // ตัดจังหวัดที่ยังไม่มีข้อมูลออก (กราฟแสดงครบ 9 แถวเสมอ แต่ AI ไม่ควรเสนอแนะจากแถวที่เป็น 0)
  const byProvince = (Array.isArray(s.byProvince) ? s.byProvince : []).filter(
    (r) => (Number(r?.normal) || 0) + (Number(r?.risk) || 0) + (Number(r?.high) || 0) > 0
  );
  const provinceText = byProvince.length
    ? byProvince
        .map((r) => `- ${r.province}: ปกติ ${r.normal} / เสี่ยง ${r.risk} / เสี่ยงสูง ${r.high} คน`)
        .join("\n")
    : "- (ไม่มีข้อมูลรายจังหวัด)";

  return `คุณเป็นที่ปรึกษาด้านนโยบายสาธารณสุข (สุขภาพจิต) ระดับเขต วิเคราะห์ข้อมูลสรุปการคัดกรองสุขภาพจิตต่อไปนี้ แล้วเสนอ "การวางแผนการทำงานเชิงรุก" เพื่อแก้ปัญหาสุขภาพจิตรายพื้นที่

[ภาพรวม]
- ผู้รับบริการสะสมทั้งหมด: ${s.total ?? 0} คน
- กลุ่มเสี่ยงสูง: ${s.highRiskCount ?? 0} คน (ร้อยละ ${s.highRiskPercent ?? 0})
- ส่งต่อตามสิทธิการรักษา: ${s.forwardCount ?? 0} คน
- ภาพรวมระดับความเสี่ยง: ปกติ ${s.overall?.normal ?? 0} / เสี่ยง ${s.overall?.risk ?? 0} / เสี่ยงสูง ${s.overall?.high ?? 0} คน

[สถิติรายจังหวัด (ปกติ/เสี่ยง/เสี่ยงสูง)]
${provinceText}

จงตอบกลับเป็น "JSON เท่านั้น" (ห้ามมีข้อความอื่น ห้าม markdown) เป็น array ของข้อเสนอแนะ 2-4 ข้อ ตามโครงสร้างนี้:
[
  { "title": "หัวข้อข้อเสนอแนะสั้นๆ", "detail": "รายละเอียดเชิงปฏิบัติ 1-3 ประโยค ระบุพื้นที่/กลุ่มเป้าหมายที่ควรเน้นเป็นรูปธรรม" }
]

ข้อกำหนด: อ้างอิงจังหวัดที่มีสัดส่วนกลุ่มเสี่ยงสูงมากเป็นพิเศษ; ข้อเสนอต้องนำไปปฏิบัติได้จริง (จัดสรรทรัพยากร/ทีมเยียวยาจิตใจ/เชิงรุกในพื้นที่); เขียนเป็นภาษาไทย`;
}

// ---------- Smart Heuristic Fallback (วิเคราะห์จากตัวเลขจริงกรณีระบบภายนอกขัดข้อง) ----------
function generateHeuristicPolicy(stats) {
  const s = stats || {};
  const total = Number(s.total) || 0;
  const highRisk = Number(s.highRiskCount) || 0;
  const forward = Number(s.forwardCount) || 0;
  const percent = total > 0 ? ((highRisk / total) * 100).toFixed(1) : "0.0";
  const forwardPercent = highRisk > 0 ? ((forward / highRisk) * 100).toFixed(1) : "0.0";

  const provinces = (Array.isArray(s.byProvince) ? s.byProvince : [])
    .filter((r) => (Number(r?.normal) || 0) + (Number(r?.risk) || 0) + (Number(r?.high) || 0) > 0)
    .sort((a, b) => (Number(b?.high) || 0) - (Number(a?.high) || 0));

  const topProvince = provinces[0]?.province || "ในพื้นที่ที่มีความเสี่ยงสูง";

  return [
    {
      title: "เร่งรัดการส่งต่อและติดตามกลุ่มเสี่ยงสูง",
      detail: `จากข้อมูลพบกลุ่มเสี่ยงสูง ${highRisk} คน (ร้อยละ ${percent}) และส่งต่อไปแล้ว ${forward} คน (${forwardPercent}%) ควรมีระบบ Case Manager ติดตามการดูแลต่อเนื่องให้ครอบคลุม 100% โดยเฉพาะในพื้นที่ ${topProvince}`,
    },
    {
      title: "จัดทีมเยียวยาจิตใจเชิงรุก (MCATT) ลงพื้นที่เป้าหมาย",
      detail: `มุ่งเน้นการลงพื้นที่เชิงรุกในจังหวัดที่มีสัดส่วนผู้มีความเสี่ยงสูง เช่น ${topProvince} เพื่อคัดกรองซ้ำและให้การปฐมพยาบาลทางใจเบื้องต้น (PFA) แก่กลุ่มเปราะบาง`,
    },
    {
      title: "ขยายเครือข่ายแกนนำสุขภาพจิตและระบบคัดกรองชุมชน",
      detail: `พัฒนาศักยภาพ อสม. และเจ้าหน้าที่สาธารณสุขระดับปฐมภูมิ เพื่อเฝ้าระวังและค้นหากลุ่มเสี่ยงในชุมชนตั้งแต่ระยะแรกเริ่ม ช่วยลดอัตราการเข้าสู่ภาวะเสี่ยงสูง`,
    },
  ];
}

/**
 * สร้างข้อเสนอแนะเชิงนโยบายจากสถิติแดชบอร์ด
 * @param {object} payload
 * @param {object} payload.stats - { total, highRiskCount, highRiskPercent, forwardCount, overall, byProvince }
 * @returns {Promise<{recommendations: {title:string, detail:string}[]}>}
 */
export async function generatePolicyRecommendation({ stats } = {}) {
  // 1. ตรวจสอบใน Cache ก่อน หากมีข้อมูลเดิมที่ตรงกัน คืนค่าทันที (0ms)
  const cacheKey = getCacheKey(stats);
  const cached = policyCache.get(cacheKey);
  if (cached && Date.now() - cached.ts < CACHE_TTL_MS) {
    return { recommendations: cached.data };
  }

  let recommendations = [];
  try {
    const prompt = buildPolicyPrompt(stats);
    const raw = await callGemini(prompt);

    const parsed = parseJsonLoose(raw);
    if (Array.isArray(parsed) && parsed.length > 0) {
      recommendations = parsed
        .map((x) => ({
          title: String(x?.title || "").trim(),
          detail: String(x?.detail || "").trim(),
        }))
        .filter((x) => x.title || x.detail);
    }
  } catch (err) {
    console.warn("Gemini call failed or timed out, applying heuristic policy fallback:", err?.message || err);
    // 2. หาก Gemini API ติดขัดหรือไม่ตอบสนอง ให้ใช้ Heuristic Fallback จากข้อมูลจริง เพื่อไม่ให้หน้าเว็บล่ม
    recommendations = generateHeuristicPolicy(stats);
  }

  if (recommendations.length === 0) {
    recommendations = generateHeuristicPolicy(stats);
  }

  // บันทึกผลลง Cache
  policyCache.set(cacheKey, { ts: Date.now(), data: recommendations });

  return { recommendations };
}
