// /components/screening/Consult/SatisfactionForm.js
'use client';

import { forwardRef, useImperativeHandle } from "react";
import Textarea from '@/components/common/Form/Textarea';
import { useConsultFormSatisfaction, SATISFACTION_LEVELS } from "@/hooks/useConsultFormSatisfaction";
import { Smile, Frown, Sparkles, MessageSquare, X, CheckCircle2, AlertCircle } from 'lucide-react';

const SatisfactionForm = forwardRef(({ consultData, disabledForm, onChangeFormSatisfaction }, ref) => {
  const {
    level,
    score,
    currentLevelConfig,
    note,
    warnFields,
    handleSelectLevel,
    handleClearLevel,
    handleChangeNote,
    validateForm,
  } = useConsultFormSatisfaction({ consultData, disabledForm, onChangeFormSatisfaction });

  useImperativeHandle(ref, () => ({ validateAndFocus: validateForm }));

  const getLevelIcon = (val, isSelected) => {
    switch (val) {
      case "ไม่พอใจ":
        return <Frown className={`w-7 h-7 ${isSelected ? "text-rose-600" : "text-gray-400"}`} />;
      case "พอใจ":
        return <Smile className={`w-7 h-7 ${isSelected ? "text-blue-600" : "text-gray-400"}`} />;
      case "พอใจมาก":
        return <Sparkles className={`w-7 h-7 ${isSelected ? "text-emerald-600" : "text-gray-400"}`} />;
      default:
        return <Smile className="w-7 h-7 text-gray-400" />;
    }
  };

  return (
    <div className="consult-satisfaction-container p-4 space-y-6 max-w-4xl mx-auto">
      {/* Header Banner */}
      <div className="flex items-center gap-3 p-4 rounded-xl bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200">
        <div className="p-2.5 bg-amber-500 text-white rounded-lg shadow-sm">
          <Smile className="w-6 h-6" />
        </div>
        <div>
          <h4 className="text-base font-bold text-gray-800 mb-0">การประเมินความพึงพอใจต่อการรับบริการ</h4>
          <p className="text-xs text-gray-500 mb-0">เลือกระดับความพึงพอใจ 3 ระดับ และระบุข้อเสนอแนะเพื่อพัฒนาคุณภาพบริการ</p>
        </div>
      </div>

      {/* 3 Satisfaction Levels (ติ๊กเลือก 3 ระดับ) */}
      <div className="p-6 rounded-2xl bg-white border border-gray-200 shadow-sm space-y-5">
        <div className="flex items-center justify-between pb-3 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-amber-500" />
            <span className="font-bold text-base text-gray-800">
              เลือกระดับความพึงพอใจ <span className="text-xs font-normal text-gray-400">(เลือก 1 ระดับ)</span>
            </span>
          </div>
          {level && !disabledForm && (
            <button
              type="button"
              onClick={handleClearLevel}
              className="inline-flex items-center gap-1 text-xs text-gray-400 hover:text-rose-500 transition px-2 py-1 rounded hover:bg-gray-100"
              title="ล้างตัวเลือก"
            >
              <X className="w-3.5 h-3.5" />
              <span>ล้างตัวเลือก</span>
            </button>
          )}
        </div>

        {/* Warning Alert if not selected */}
        {warnFields?.satisfaction_level && (
          <div className="flex items-center gap-2 p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-sm font-semibold animate-pulse shadow-sm">
            <AlertCircle className="w-5 h-5 text-rose-500 shrink-0" />
            <span>{warnFields.satisfaction_level}</span>
          </div>
        )}

        {/* 3 Level Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {SATISFACTION_LEVELS.map((item) => {
            const isSelected = level === item.value;
            return (
              <div
                key={item.value}
                onClick={() => !disabledForm && handleSelectLevel(item.value)}
                role="button"
                tabIndex={disabledForm ? -1 : 0}
                onKeyDown={(e) => {
                  if (!disabledForm && (e.key === "Enter" || e.key === " ")) {
                    e.preventDefault();
                    handleSelectLevel(item.value);
                  }
                }}
                className={`relative flex flex-col items-center text-center p-5 rounded-xl border-2 transition-all select-none ${
                  disabledForm ? "cursor-not-allowed opacity-75" : "cursor-pointer"
                } ${
                  isSelected
                    ? item.activeClass
                    : "border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50/60 text-gray-700"
                }`}
              >
                {/* Radio Circle Top-Right */}
                <div className="absolute top-3.5 right-3.5">
                  <input
                    type="radio"
                    name="satisfaction_level"
                    value={item.value}
                    checked={isSelected}
                    onChange={() => {}} // handled by card onClick
                    disabled={disabledForm}
                    className={`w-4 h-4 cursor-pointer ${item.radioClass}`}
                  />
                </div>

                {/* Icon */}
                <div className="p-3 rounded-full bg-white shadow-sm mb-3">
                  {getLevelIcon(item.value, isSelected)}
                </div>

                {/* Title */}
                <span className="text-lg font-bold mb-1">{item.label}</span>

                {/* Description */}
                <span className="text-xs text-gray-500 leading-snug">{item.description}</span>
              </div>
            );
          })}
        </div>

        {/* Current Status Display */}
        <div className="flex items-center justify-center gap-2 pt-2 border-t border-gray-100">
          <span className="text-xs text-gray-400">สถานะการเลือก:</span>
          {currentLevelConfig ? (
            <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border shadow-sm ${currentLevelConfig.badgeClass}`}>
              <CheckCircle2 className="w-3.5 h-3.5" />
              {currentLevelConfig.label}
            </span>
          ) : (
            <span className="text-xs text-gray-400 italic">ยังไม่ได้เลือกระดับความพึงพอใจ</span>
          )}
        </div>
      </div>

      {/* Note Section */}
      <div className="p-6 rounded-2xl bg-white border border-gray-200 shadow-sm space-y-3">
        <div className="flex items-center gap-2 pb-2 border-b border-gray-100">
          <MessageSquare className="w-5 h-5 text-indigo-500" />
          <span className="font-bold text-base text-gray-800">ข้อเสนอแนะเพิ่มเติมจากผู้รับบริการ</span>
        </div>

        <label htmlFor="satisfaction_note" className="block text-xs text-gray-500">
          ระบุความคิดเห็น ข้อเสนอแนะ หรือความต้องการเพิ่มเติม (ถ้ามี):
        </label>
        <Textarea
          id="satisfaction_note"
          name="satisfaction_note"
          value={note}
          onChange={handleChangeNote}
          readOnly={disabledForm}
          placeholder="กรอกข้อเสนอแนะหรือความคิดเห็นเพิ่มเติมเพื่อการพัฒนาบริการ..."
          rows={4}
          warning={warnFields?.satisfaction_note}
          className="w-full"
        />
      </div>
    </div>
  );
});

SatisfactionForm.displayName = "SatisfactionForm";

export default SatisfactionForm;

