// /hooks/useConsultData.js
'use client'; 
// ระบุว่าไฟล์นี้เป็น Client Component ของ Next.js 
// เนื่องจากใช้ React hook เช่น useState, useRef

import { useState, useRef, useMemo, forwardRef, useImperativeHandle } from 'react';
// นำเข้า React hook หลัก
// Note: forwardRef และ useImperativeHandle ยังไม่ได้ใช้จริงใน hook นี้

export const initialFormData = {
  ConsultingForm: {},      // ค่าของฟอร์ม ConsultingForm
  StressForm: {},          // ค่าของฟอร์ม StressForm
  RiskForm: {},            // ค่าของฟอร์ม RiskForm
  AssistForm: {},          // ค่าของฟอร์ม AssistForm
  FollowForm: {},          // ค่าของฟอร์ม FollowForm
  PdxForm: {},             // ค่าของฟอร์ม PdxForm (รหัส PDx)
  SatisfactionForm: {},    // ค่าของฟอร์ม SatisfactionForm (ความพึงพอใจ)
};

export const initialFormComplete = {
  ConsultingForm: false,  
  StressForm: false,  
  RiskForm: false,  
  AssistForm: false, 
  FollowForm: false,
  PdxForm: false,
  SatisfactionForm: false,
};

/**
 * useConsultData
 * Low-level hook สำหรับจัดการ state ของฟอร์ม TabConsult
 * - formData: เก็บค่าของ subform ทุกตัว
 * - formComplete: เก็บสถานะว่า subform แต่ละตัวกรอกครบหรือไม่
 * - validateAndScrollToError: ฟังก์ชันตรวจสอบ validation พร้อม scroll ไป field แรกที่ error
 */
export function useConsultData() {

  // ---------- สร้าง state ของ formData และ formComplete ----------
  const [formData, setFormData] = useState(initialFormData);
  const [formComplete, setFormComplete] = useState(initialFormComplete);

  // ---------- สร้าง refs สำหรับแต่ละ subform ----------
  // refs ใช้สำหรับเรียก method validateAndFocus ของ subform แต่ละตัว
  const refs = {
    consulting: useRef(),    // ref ของ ConsultingForm
    stress: useRef(),        // ref ของ StressForm
    risk: useRef(),          // ref ของ RiskForm
    assist: useRef(),        // ref ของ AssistForm
    follow: useRef(),        // ref ของ FollowForm
    pdx: useRef(),           // ref ของ PdxForm
    satisfaction: useRef(),  // ref ของ SatisfactionForm
  }

  // ----------- validate ทั้งหมดพร้อม scroll ไป field แรกที่ error -------------
  const validateAndScrollToError = async () => {
    const results = {
      consulting: await refs.consulting.current?.validateAndFocus?.(),
      stress: await refs.stress.current?.validateAndFocus?.(),
      risk: await refs.risk.current?.validateAndFocus?.(),
      assist: await refs.assist.current?.validateAndFocus?.(),
      follow: await refs.follow.current?.validateAndFocus?.(),
      pdx: await refs.pdx.current?.validateAndFocus?.(),
      satisfaction: await refs.satisfaction.current?.validateAndFocus?.(),
    };
    // คืนค่า object ของผล validation ของแต่ละ form
    // เช่น { consulting: true/false, stress: true/false, ... }
    return results;
  };

  // ----------- callback สำหรับแต่ละ subform -------------
  // แต่ละ callback จะถูกเรียกจาก subform เมื่อค่าหรือสถานะ isComplete เปลี่ยน
  const onChangeFormCallback = useMemo(() => ({
    consulting: ({ formData: data, isComplete }) => {
      setFormData(prev => ({ ...prev, ConsultingForm: data }));
      setFormComplete(prev => ({ ...prev, ConsultingForm: isComplete }));
    },
    stress: ({ formData: data, isComplete }) => {
      setFormData(prev => ({ ...prev, StressForm: data }));
      setFormComplete(prev => ({ ...prev, StressForm: isComplete }));
    },
    risk: ({ formData: data, isComplete }) => {
      setFormData(prev => ({ ...prev, RiskForm: data }));
      setFormComplete(prev => ({ ...prev, RiskForm: isComplete }));
    },
    assist: ({ formData: data, isComplete }) => {
      setFormData(prev => ({ ...prev, AssistForm: data }));
      setFormComplete(prev => ({ ...prev, AssistForm: isComplete }));
    },
    follow: ({ formData: data, isComplete }) => {
      setFormData(prev => ({ ...prev, FollowForm: data }));
      setFormComplete(prev => ({ ...prev, FollowForm: isComplete }));
    },
    pdx: ({ formData: data, isComplete }) => {
      setFormData(prev => ({ ...prev, PdxForm: data }));
      setFormComplete(prev => ({ ...prev, PdxForm: isComplete }));
    },
    satisfaction: ({ formData: data, isComplete }) => {
      setFormData(prev => ({ ...prev, SatisfactionForm: data }));
      setFormComplete(prev => ({ ...prev, SatisfactionForm: isComplete }));
    },
  }), []);

  // ---------- return object ----------
  return {
    formData,                  // state ของค่าฟอร์มทั้งหมด
    formComplete,              // state ของสถานะ complete ของแต่ละฟอร์ม
    refs,                      // refs ของแต่ละ subform
    validateAndScrollToError,  // ฟังก์ชัน validate ทั้งหมดพร้อม scroll
    onChangeFormCallback,      // callback สำหรับ subform
    setFormData,               // setter ตรงสำหรับ formData (optional)
    setFormComplete,           // setter ตรงสำหรับ formComplete (optional)
    initialFormData,           // ค่าเริ่มต้นของ formData
    initialFormComplete,       // ค่าเริ่มต้นของ formComplete (false ทุกแท็บ)
  }
}
