// /services/screening/aiAnalyze.js
import clientConfig from "@/config/Client";
import { POST } from "@/lib/utils/request";

/**
 * ส่งข้อมูล consult (จาก client formData) + screening_id ไปวิเคราะห์ด้วย AI
 * @param {number|string} screening_id
 * @param {object} consult - { ConsultingForm, StressForm, RiskForm }
 */
export function analyzeConsultAI(screening_id, consult, force_refresh = false) {
  return POST(clientConfig.backend_url + "/screening/consult/ai-analyze", {
    screening_id,
    consult,
    force_refresh,
  });
}
