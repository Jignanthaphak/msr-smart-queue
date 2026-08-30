'use client';
import { Sparkles } from 'lucide-react';
import Button from '@/components/common/Form/Button';

/**
 * ปุ่ม "วิเคราะห์ด้วย AI" (แยกออกมาจาก TabConsult)
 * แสดงเฉพาะเมื่อ:
 *  - showBtnAIConsult === true (status 3,4)
 *  - กรอกครบ 3 tab: ConsultingForm, StressForm, RiskForm
 *
 * @param {object} props
 * @param {boolean} props.showBtnAIConsult
 * @param {object}  props.formComplete  - { ConsultingForm, StressForm, RiskForm, ... }
 * @param {boolean} props.isAnalyzing
 * @param {Function} props.onClick
 */
export default function BtnAnalyzeAI({ showBtnAIConsult, formComplete = {}, isAnalyzing = false, onClick }) {

  const complete3Tab =
    !!formComplete?.ConsultingForm &&
    !!formComplete?.StressForm &&
    !!formComplete?.RiskForm;

  if (!showBtnAIConsult || !complete3Tab) return null;

  return (
    <Button
      type="button"
      className={`action-btn ${isAnalyzing
        ? 'bg-purple-400 border-purple-400'
        : 'bg-purple-600 border-purple-600 hover:bg-purple-700'} !text-white`}
      disabled={isAnalyzing}
      onClick={onClick}
    >
      {isAnalyzing ? (
        <span className="animate-pulse">⏳ กำลังประมวลผล...</span>
      ) : (
        <>
          <Sparkles className="show-in-modern mr-1 w-4 h-4" />
          วิเคราะห์ด้วย AI
        </>
      )}
    </Button>
  );
}
