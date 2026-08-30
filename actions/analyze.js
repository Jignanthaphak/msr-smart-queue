"use server";

import { GoogleGenerativeAI } from "@google/generative-ai";
import { modelScreening } from "@/model/screening";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// 👉 เพิ่มพารามิเตอร์ customPrompt รับค่ามาจากหน้าเว็บ (ตั้งค่าเริ่มต้นเป็น null)
export async function analyzeHealthDataAction(screening_id, customPrompt = null) {
  try {
    const where = {
        whereScreening: [
          { type: 'and', field: 'screening_id', operator: '=', value: screening_id },
        ],
        includePerson: true, 
        mustHavePerson: false 
    };

    const screening = await modelScreening(where);

    if (!screening) {
        return { status: "error", message: "ไม่พบข้อมูลการประเมิน" };
    }

    // ดึงข้อมูล
    const age = screening.person?.age || "ไม่ระบุ";
    const sex = screening.person?.sex?.title_th || "ไม่ระบุ";
    const occupation = screening.person?.occupation?.title_th || "ไม่ระบุ";
    const bio = Array.isArray(screening.biofeedback) ? screening.biofeedback[0] : (screening.biofeedback || {});
    const consult = Array.isArray(screening.consult) ? screening.consult[0] : (screening.consult || {});

    const stressFactors = [];
    const stressKeys = {
        stress_narcotics: "สารเสพติด", stress_psychiatry: "ปัญหาสุขภาพจิต", stress_economy: "เศรษฐกิจ/การเงิน",
        stress_family: "ครอบครัว", stress_relationship: "ความสัมพันธ์", stress_love: "ความรัก",
        stress_unplanned: "ตั้งครรภ์ไม่พร้อม", stress_learning: "การเรียน", stress_gambling: "การพนัน",
        stress_games: "ติดเกม", stress_sex: "ปัญหาทางเพศ", stress_work: "การทำงาน",
        stress_health: "สุขภาพ", stress_sleep: "การนอนหลับ", stress_healthfamily: "สุขภาพคนในครอบครัว",
        stress_loss: "ความสูญเสีย", stress_other: "อื่นๆ"
    };
    for (const [key, label] of Object.entries(stressKeys)) {
        if (Number(consult[key]) === 1) {
            let text = label;
            if (key === 'stress_other' && consult.stress_other_detail) {
                text += ` (${consult.stress_other_detail})`;
            }
            stressFactors.push(text);
        }
    }
    const stressText = stressFactors.length > 0 ? stressFactors.join(", ") : "ไม่พบสาเหตุความเครียดที่ระบุชัดเจน";
    
    // 💡 1. ตัวแปรที่ 1: ข้อมูลที่จะแสดงให้ User เห็นและแก้ไขได้ในหน้า Modal
    const basePrompt = `
    ในฐานะผู้เชี่ยวชาญด้านสุขภาพจิตและสุขภาพกายประจำศูนย์สุขภาพจิต 
    โปรดวิเคราะห์ข้อมูลการประเมินของผู้รับบริการรายนี้ และสรุปผลเป็นภาษาไทยด้วยความเห็นอกเห็นใจและเป็นมืออาชีพ

    [ข้อมูลทั่วไปของผู้รับบริการ]
    - เพศ: ${sex}
    - อายุ: ${age} ปี
    - อาชีพ: ${occupation}
    - ข้อมูลสำคัญ (ถ้ามี): ${bio.important_information || "-"}

    [1. ผลการตรวจ Biofeedback (เครื่องวัดความเครียดทางสรีรวิทยา)]
    - ความสมดุลของระบบประสาทอัตโนมัติ (ANS Balance): ${bio.ans_balance || "-"}
    - ระดับการทำงานของระบบประสาทอัตโนมัติ (ANS Activity): ${bio.ans_activity || "-"}
    - ความต้านทานต่อความเครียด (Stress Resistance): ${bio.stress_resistance || "-"}
    - ดัชนีความเครียด (Stress Index): ${bio.stress_index || "-"}
    - ดัชนีความเหนื่อยล้า (Fatigue Index): ${bio.fatigue_index || "-"}
    - อัตราการเต้นของหัวใจเฉลี่ย (Mean Heart Rate): ${bio.mean_heart_rate || "-"}
    - ความเสถียรของคลื่นหัวใจ (Electro Cardiac Stability): ${bio.electro_cardiac_stability || "-"}

    [2. ข้อมูลการให้คำปรึกษาและประเมินความเสี่ยง (Consult & Risk)]
    - ข้อมูลการให้คำปรึกษาเบื้องต้น: ${consult.consulting || "-"}
    - สาเหตุความเครียดที่พบ: ${stressText}
    
    [คะแนนประเมินความเสี่ยง (ถ้ามี)]
    - พลังใจ (RQ): ${consult.risk_rq || "-"}
    - ภาวะหมดไฟ (Burn Out): ${consult.risk_burn_out || "-"}
    - ประเมินความเครียด (ST5): ${consult.risk_st5 || "-"}
    - คัดกรองซึมเศร้า (2Q+): ${consult.risk_depressed_2qplus || "-"}
    - ประเมินซึมเศร้า (9Q): ${consult.risk_depressed_9q || "-"}
    - ประเมินเสี่ยงฆ่าตัวตาย (8Q): ${consult.risk_suicide || "-"}

    โดยให้แบ่งรูปแบบการตอบกลับออกเป็น 3 หัวข้อดังนี้:
    1. สรุปภาวะสุขภาพและผลประเมินต่างๆ (เชื่อมโยงความสอดคล้องระหว่างค่า Bio ทางกายภาพ และค่าความเครียด/ความเสี่ยงทางจิตใจ)
    2. ข้อควรระวัง (ความเสี่ยงที่น่ากังวลที่สุดจากข้อมูล)
    3. คำแนะนำเบื้องต้น (ทั้งการจัดการตัวเอง และแนวทางการดูแลสำหรับเจ้าหน้าที่)
    `;

    // 💡 2. ตัวแปรที่ 2: คำสั่งซ่อน (Hidden Instructions) จะแอบต่อท้ายเสมอ
    const hiddenInstructions = `
    ⚠️ คำสั่งบังคับสูงสุด (STRICT INSTRUCTION):
    คุณต้องตอบกลับมาเป็นโค้ด "HTML เท่านั้น" ห้ามมีข้อความเกริ่นนำ ห้ามมี Markdown (เช่น \`\`\`html) ครอบ
    โดยให้ออกแบบเป็น "Dashboard Infographic" สวยงามโดยใช้คลาสของ Tailwind CSS 
    
    ข้อกำหนดในการออกแบบ HTML:
    1. ใช้ <div className="grid grid-cols-1 md:grid-cols-2 gap-4"> แบ่งสัดส่วนให้สวยงาม
    2. ใช้สีพื้นหลังและสีขอบ (เช่น bg-red-50, border-red-200, text-red-700) เพื่อบ่งบอกระดับความรุนแรง
    3. มีหัวข้อ 3 ส่วนหลัก: 
       - 📊 วิเคราะห์ภาพรวม (จัดให้อยู่ในกล่องสีฟ้า/เทา)
       - 🚨 จุดแจ้งเตือนความเสี่ยง (เน้นกล่องสีแดง/ส้ม ถ้ามีความเสี่ยงสูง)
       - 💡 แผนการดูแล (กล่องสีเขียว)
    4. ใช้สัญลักษณ์ Emoji ช่วยนำสายตา
    `;

   // 👉 ถ้ามีการส่ง customPrompt มา ให้ใช้ของที่ User พิมพ์แก้ ถ้าไม่มี ให้ใช้ basePrompt
    const displayPrompt = customPrompt ? customPrompt : basePrompt;

    // 👉 เอาข้อมูล (ที่ User เห็น) มาเชื่อมกับ คำสั่งจัดหน้าตา (ที่ User ไม่เห็น)
    const promptForAPI = displayPrompt + "\n\n" + hiddenInstructions;
  
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
    const result = await model.generateContent(promptForAPI);
    const responseText = await result.response.text();
    
    // ส่ง displayPrompt กลับไปด้วย เพื่อให้หน้าเว็บรู้ว่าใช้ Prompt อะไรยิงไป
    return { status: "success", data: responseText, prompt: displayPrompt };
    
  } catch (error) {
    console.error("AI Analysis Error:", error);
    return { status: "error", message: error.message || "เกิดข้อผิดพลาด ไม่สามารถวิเคราะห์ได้ในขณะนี้" };
  }
}