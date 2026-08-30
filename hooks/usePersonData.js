// /hooks/usePersonData.js
'use client';
import { useState, useRef } from "react";

/**
 * usePersonData
 * Low-level hook สำหรับจัดการฟอร์มข้อมูลผู้ป่วย
 * - แยกข้อมูลเป็น info / address / currentAddress
 * - จัดการ state formData และ formComplete
 * - มี ref ไปยังฟอร์มลูกเพื่อ validate
 */
export function usePersonData(initial = { info: {}, address: {}, currentAddress: {} }) {
  
  // ----------- state form data -------------
  const [formData, setFormData] = useState(initial); // ข้อมูลฟอร์มทั้งหมด
  const [formComplete, setFormComplete] = useState(false); // boolean ฟอร์มกรอกครบหรือไม่
  const refFormPerson = useRef(); // ref ไปยัง component form จริง (ใช้ validate/scroll)

  // ----------- callback เวลา child form เปลี่ยน -------------
  const onChangeFormPersonCallback = ({ formData, isComplete }) => {

    // รับข้อมูลจากฟอร์มลูก แล้วแยก field ให้ state ของ hook
    setFormData({
      info: formData?.info,                        // ข้อมูลส่วนตัว
      address: formData?.address?.[1] || {},       // ที่อยู่ตามบัตร (index 1)
      currentAddress: formData?.address?.[2] || {},// ที่อยู่ปัจจุบัน (index 2)
    });
    setFormComplete(isComplete); // set ว่าฟอร์มครบหรือไม่
  };

  // ----------- validate + scroll ไปยัง error field -------------
  const validateAndScrollToError = async () => {
    // เรียกฟังก์ชัน validate ในฟอร์มลูก (ref)
    const isValid = await refFormPerson.current?.validateAndFocus?.();
    if (!isValid) {
      // ถ้ายังไม่ครบ ให้ scroll ไป field แรกที่ error อีกครั้ง หลัง 100ms
      setTimeout(() => refFormPerson.current?.validateAndFocus?.(true), 100);
      return false;
    }
    return true; // ฟอร์มถูกต้อง
  };

  // ----------- return state & callbacks -------------
  return {
    formData,                    // ข้อมูลฟอร์ม
    formComplete,                // ฟอร์มกรอกครบไหม
    refFormPerson,               // ref ไปยังฟอร์มลูก
    onChangeFormPersonCallback,  // callback update ข้อมูลจากฟอร์มลูก
    validateAndScrollToError,    // validate ฟอร์ม + scroll error
  };
}
