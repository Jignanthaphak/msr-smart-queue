// /lib/serviceActions/dashboardAiActions.js
// AI ข้อเสนอแนะเชิงนโยบาย สำหรับ "แดชบอร์ดสรุปผลการคัดกรองสุขภาพจิต"
// *** แยกขาดจากระบบวิเคราะห์ consult รายเคส (aiAnalyzeActions.js) — ไม่แตะ consult / ai_analysis_logs ***
"use server";
import "server-only";

const CANDIDATE_MODELS = [
  process.env.GEMINI_MODEL,
  "gemini-2.5-flash",
  "gemini-flash-latest",
  "gemini-2.5-flash-lite",
  "gemini-2.5-pro",
].filter(Boolean);

const RETRYABLE_STATUS = new Set([429, 500, 503]);
const MAX_RETRIES = 2;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// ---------- เรียก Gemini ผ่าน REST (พร้อม retry และ auto-fallback หากเจอรุ่น 404) ----------
async function callGemini(prompt) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw Object.assign(new Error("ไม่พบ GEMINI_API_KEY"), { status: 500 });

  const body = {
    contents: [{ role: "user", parts: [{ text: prompt }] }],
    generationConfig: {
      temperature: 0.2,
      maxOutputTokens: 700,
      thinkingConfig: { thinkingBudget: 0 },
    },
  };

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
        if (attempt < MAX_RETRIES) { await sleep(700 * Math.pow(2, attempt)); continue; }
        break;
      }

      if (res.ok) {
        const json = await res.json();
        return (
          json?.candidates?.[0]?.content?.parts?.map((x) => x.text).filter(Boolean).join("\n") || ""
        );
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

/**
 * สร้างข้อเสนอแนะเชิงนโยบายจากสถิติแดชบอร์ด
 * @param {object} payload
 * @param {object} payload.stats - { total, highRiskCount, highRiskPercent, forwardCount, overall, byProvince }
 * @returns {Promise<{recommendations: {title:string, detail:string}[]}>}
 */
export async function generatePolicyRecommendation({ stats } = {}) {
  const prompt = buildPolicyPrompt(stats);
  const raw = await callGemini(prompt);

  let recommendations = [];
  try {
    const parsed = parseJsonLoose(raw);
    if (Array.isArray(parsed)) {
      recommendations = parsed
        .map((x) => ({
          title: String(x?.title || "").trim(),
          detail: String(x?.detail || "").trim(),
        }))
        .filter((x) => x.title || x.detail);
    }
  } catch (e) {
    // fallback: คืนข้อความดิบเป็น 1 การ์ด ถ้า parse ไม่ได้
    recommendations = [{ title: "ข้อเสนอแนะจาก AI", detail: (raw || "").trim() }];
  }

  if (recommendations.length === 0) {
    recommendations = [{ title: "ข้อเสนอแนะจาก AI", detail: (raw || "").trim() || "ไม่สามารถสร้างข้อเสนอแนะได้" }];
  }

  return { recommendations };
}
