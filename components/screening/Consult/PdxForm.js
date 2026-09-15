// /components/screening/Consult/PdxForm.js
'use client';

import { forwardRef, useImperativeHandle } from "react";
import Checkbox from '@/components/common/Form/Checkbox';
import Input from '@/components/common/Form/Input';
import { useConsultFormPdx } from "@/hooks/useConsultFormPdx";
import { Stethoscope, CheckCircle2, AlertCircle } from 'lucide-react';

const PdxForm = forwardRef(({ consultData, disabledForm, onChangeFormPdx }, ref) => {
  const {
    selectedCodes,
    pdxNoCheck,
    pdxOther,
    warnFields,
    handleToggleCode,
    handleToggleNoCheck,
    handleChangeOther,
    validateForm,
    groups,
  } = useConsultFormPdx({ consultData, disabledForm, onChangeFormPdx });

  useImperativeHandle(ref, () => ({ validateAndFocus: validateForm }));

  return (
    <div className="consult-pdx-container p-4 space-y-6">
      {/* Top Banner: Status & No PDx option */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 rounded-xl bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-500 text-white rounded-lg shadow-sm">
            <Stethoscope className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-base font-bold text-gray-800 mb-0">รหัสการวินิจฉัยหลัก (Principle Diagnosis - PDx)</h4>
            <p className="text-xs text-gray-500 mb-0">เลือกหมวดหมู่รหัส ICD-10 Z-code ที่ตรงกับสภาวะของผู้รับบริการ (เลือกได้เพียง 1 รหัสเท่านั้น)</p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <label className="flex items-center gap-2 cursor-pointer select-none bg-white px-3 py-2 rounded-lg border border-gray-300 shadow-sm hover:border-blue-400 transition">
            <Checkbox
              type="checkbox"
              id="pdx_no_check"
              name="pdx_no_check"
              checked={pdxNoCheck === 1}
              onChange={handleToggleNoCheck}
              readOnly={disabledForm}
            />
            <span className="text-sm font-medium text-gray-700">ไม่พบรหัส PDx / ไม่มีรหัสที่เข้าเกณฑ์</span>
          </label>

          {selectedCodes.length > 0 && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-300">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              รหัสที่เลือก: <strong>{selectedCodes[0]}</strong>
            </span>
          )}
        </div>
      </div>

      {/* Warning Alert for missing selection */}
      {warnFields?.pdx_alert && (
        <div className="flex items-center gap-2 p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-sm font-semibold animate-pulse shadow-sm">
          <AlertCircle className="w-5 h-5 text-rose-500 shrink-0" />
          <span>{warnFields.pdx_alert}</span>
        </div>
      )}

      {/* 7 Groups of ICD-10 Z-codes */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {groups.map((group) => {
          const groupSelectedCount = group.items.filter(item => selectedCodes.includes(item.code)).length;

          return (
            <div
              key={group.id}
              className={`rounded-xl border p-4 transition-all ${
                groupSelectedCount > 0
                  ? "border-blue-400 bg-blue-50/30 shadow-sm ring-1 ring-blue-300"
                  : "border-gray-200 bg-white hover:border-gray-300"
              }`}
            >
              {/* Group Header */}
              <div className="flex items-center justify-between pb-3 mb-3 border-b border-gray-100">
                <span className="font-bold text-sm text-gray-800">{group.title}</span>
                {groupSelectedCount > 0 && (
                  <span className="text-xs px-2.5 py-0.5 rounded-full bg-blue-600 text-white font-semibold">
                    เลือกหมวดนี้
                  </span>
                )}
              </div>

              {/* Radio Items (เลือกได้เพียง 1 รหัส) */}
              <div className="space-y-2">
                {group.items.map((item) => {
                  const isChecked = selectedCodes.includes(item.code);

                  return (
                    <label
                      key={item.code}
                      htmlFor={`pdx_${item.code}`}
                      className={`flex items-start gap-2.5 p-2 rounded-lg cursor-pointer text-xs transition select-none ${
                        isChecked
                          ? "bg-blue-100/70 text-blue-950 font-semibold ring-1 ring-blue-400"
                          : "hover:bg-gray-50 text-gray-700"
                      } ${disabledForm || pdxNoCheck === 1 ? "opacity-60 cursor-not-allowed" : ""}`}
                      onClick={(e) => {
                        e.preventDefault();
                        if (disabledForm || pdxNoCheck === 1) return;
                        handleToggleCode(item.code);
                      }}
                    >
                      <input
                        type="radio"
                        id={`pdx_${item.code}`}
                        name="pdx_single_radio"
                        checked={isChecked}
                        readOnly
                        disabled={disabledForm || pdxNoCheck === 1}
                        className="radio radio-primary radio-sm mt-0.5 shrink-0"
                      />
                      <span className="leading-snug">{item.label}</span>
                    </label>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {/* Bottom: Other PDx Specification */}
      <div className="p-4 rounded-xl bg-gray-50 border border-gray-200">
        <label htmlFor="pdx_other" className="block text-sm font-semibold text-gray-700 mb-1.5">
          ระบุรหัส PDx อื่นๆ หรือรายละเอียดเพิ่มเติม (ถ้ามี):
        </label>
        <Input
          type="text"
          id="pdx_other"
          name="pdx_other"
          value={pdxOther}
          onChange={handleChangeOther}
          readOnly={disabledForm}
          placeholder="เช่น ระบุรหัส ICD-10 อื่น หรือบันทึกเพิ่มเติม..."
          warning={warnFields?.pdx_other}
          className="w-full"
        />
      </div>
    </div>
  );
});

PdxForm.displayName = "PdxForm";

export default PdxForm;
