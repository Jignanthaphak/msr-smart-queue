// /hooks/useBioData.js
'use client';

import { useState, useRef } from "react";

/**
 * useBioData
 * Low-level hook สำหรับจัดการฟอร์ม Bio
 * - จัดการ state formData และ formComplete
 * - มี ref ไปยังฟอร์มลูกเพื่อ validate/scroll
 */
export function useBioData(initial = {}) {
  
  // ----------- state form data -------------
  const [formData, setFormData] = useState(initial); // ข้อมูลฟอร์มทั้งหมด
  const [formComplete, setFormComplete] = useState(false); // boolean ฟอร์มกรอกครบหรือไม่
  const refFormBio = useRef(); // ref ไปยัง component form จริง (ใช้ validate/scroll)

  // ----------- callback เวลา child form เปลี่ยน -------------
  const onChangeFormBioCallback = ({ formData, isComplete }) => {
    // รับข้อมูลจากฟอร์มลูก แล้ว update state ของ hook
    setFormData(formData || {});
    setFormComplete(isComplete || false);
  };

  // ----------- validate + scroll ไปยัง error field -------------
  const validateAndScrollToError = async () => {
    // เรียกฟังก์ชัน validate ในฟอร์มลูก (ref)
    const isValid = await refFormBio.current?.validateAndFocus?.();
    if (!isValid) {
      // ถ้ายังไม่ครบ ให้ scroll ไป field แรกที่ error อีกครั้ง หลัง 100ms
      setTimeout(() => refFormBio.current?.validateAndFocus?.(true), 100);
      return false;
    }
    return true; // ฟอร์มถูกต้อง
  };

  // ----------- return state & callbacks -------------
  return {
    formData,                   // ข้อมูลฟอร์ม
    formComplete,               // ฟอร์มกรอกครบไหม
    refFormBio,                 // ref ไปยังฟอร์มลูก
    onChangeFormBioCallback,    // callback update ข้อมูลจากฟอร์มลูก
    validateAndScrollToError,   // validate ฟอร์ม + scroll error
  };
}
