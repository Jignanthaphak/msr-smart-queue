// /hooks/useConsultFormPdx.js
'use client';

import { useState, useRef, useEffect, useMemo, useCallback } from "react";
import { BaseSchemaPdx, FullSchemaPdx, replace, defaultValue } from "@/lib/validators/form/screening/consult/schema";

export const PDX_GROUPS = [
  {
    id: "Z73",
    title: "หมวด Z73: ปัญหาเกี่ยวกับความลำบากในการจัดการชีวิต",
    items: [
      { code: "Z73.0", label: "Z73.0 : ภาวะหมดไฟในการทำงาน (Burn-out)" },
      { code: "Z73.1", label: "Z73.1 : การมีลักษณะบุคลิกภาพแบบ Type A" },
      { code: "Z73.2", label: "Z73.2 : ขาดการผ่อนคลายและการพักผ่อน" },
      { code: "Z73.3", label: "Z73.3 : ความเครียด มิได้จำแนกไว้ที่ใด" },
      { code: "Z73.4", label: "Z73.4 : ทักษะทางสังคมไม่เพียงพอ มิได้จำแนกไว้ที่ใด" },
      { code: "Z73.5", label: "Z73.5 : ความขัดแย้งในบทบาททางสังคม มิได้จำแนกไว้ที่ใด" },
      { code: "Z73.6", label: "Z73.6 : ข้อจำกัดในกิจกรรมเนื่องจากความพิการ" },
      { code: "Z73.8", label: "Z73.8 : ปัญหาอื่นเกี่ยวกับความลำบากในการจัดการชีวิต" },
      { code: "Z73.9", label: "Z73.9 : ปัญหาเกี่ยวกับความลำบากในการจัดการชีวิต ไม่ระบุรายละเอียด" },
    ]
  },
  {
    id: "Z55",
    title: "หมวด Z55: ปัญหาที่เกี่ยวข้องกับการศึกษาและการรู้หนังสือ",
    items: [
      { code: "Z55.0", label: "Z55.0 : การไม่รู้หนังสือและการรู้หนังสือเพียงเล็กน้อย" },
      { code: "Z55.1", label: "Z55.1 : ไม่สามารถเรียนหนังสือได้" },
      { code: "Z55.2", label: "Z55.2 : การสอบตก" },
      { code: "Z55.3", label: "Z55.3 : ระดับการเรียนต่ำกว่าเกณฑ์" },
      { code: "Z55.4", label: "Z55.4 : การปรับตัวผิดปกติทางการศึกษาและความขัดแย้งกับครูและเพื่อนร่วมชั้น" },
      { code: "Z55.6", label: "Z55.6 : ปัญหาอื่นเกี่ยวกับการศึกษา" },
      { code: "Z55.8", label: "Z55.8 : ปัญหาอื่นที่ระบุรายละเอียดเกี่ยวกับการศึกษาและการรู้หนังสือ" },
      { code: "Z55.9", label: "Z55.9 : ปัญหาเกี่ยวกับการศึกษาและการรู้หนังสือ ไม่ระบุรายละเอียด" },
    ]
  },
  {
    id: "Z60",
    title: "หมวด Z60: ปัญหาที่เกี่ยวข้องกับสภาพแวดล้อมทางสังคม",
    items: [
      { code: "Z60.0", label: "Z60.0 : ปัญหาการปรับตัวต่อการเปลี่ยนแปลงวิถีชีวิต (เกษียณอายุ, การย้ายที่อยู่, การถูกโดดเดี่ยว)" },
      { code: "Z60.1", label: "Z60.1 : สถานะผู้ปกครองนอกแบบ (เช่น การเลี้ยงดูเด็กคนเดียว)" },
      { code: "Z60.2", label: "Z60.2 : การอยู่คนเดียว" },
      { code: "Z60.3", label: "Z60.3 : ความยากลำบากในการปรับตัวเข้ากับวัฒนธรรม (เช่น การย้ายถิ่นฐาน)" },
      { code: "Z60.4", label: "Z60.4 : การถูกแบ่งแยกและปฏิเสธทางสังคม" },
      { code: "Z60.5", label: "Z60.5 : เป้าหมายของการแบ่งแยกและการถูกรังแก" },
      { code: "Z60.8", label: "Z60.8 : ปัญหาอื่นเกี่ยวกับสภาพแวดล้อมทางสังคม" },
      { code: "Z60.9", label: "Z60.9 : ปัญหาเกี่ยวกับสภาพแวดล้อมทางสังคม ไม่ระบุรายละเอียด" },
    ]
  },
  {
    id: "Z61",
    title: "หมวด Z61: ปัญหาที่เกี่ยวข้องกับเหตุการณ์เชิงลบในวัยเด็ก",
    items: [
      { code: "Z61.0", label: "Z61.0 : การสูญเสียผู้เป็นที่รักในวัยเด็ก" },
      { code: "Z61.1", label: "Z61.1 : การจากบ้านในวัยเด็ก" },
      { code: "Z61.2", label: "Z61.2 : การเปลี่ยนรูปแบบความสัมพันธ์ของครอบครัวในวัยเด็ก" },
      { code: "Z61.3", label: "Z61.3 : เหตุการณ์ที่ทำให้สูญเสียความภาคภูมิใจในตนเองในวัยเด็ก" },
      { code: "Z61.4", label: "Z61.4 : ปัญหาที่เกี่ยวข้องกับการถูกทำร้ายทางเพศในวัยเด็กโดยบุคคลในกลุ่มผู้ใกล้ชิด" },
      { code: "Z61.5", label: "Z61.5 : ปัญหาที่เกี่ยวข้องกับการถูกทำร้ายทางเพศในวัยเด็กโดยบุคคลภายนอกกลุ่มผู้ใกล้ชิด" },
      { code: "Z61.6", label: "Z61.6 : ปัญหาที่เกี่ยวข้องกับการถูกทำร้ายร่างกายในวัยเด็ก" },
      { code: "Z61.7", label: "Z61.7 : ประสบการณ์ในวัยเด็กที่ทำให้เกิดความกลัว" },
      { code: "Z61.8", label: "Z61.8 : เหตุการณ์เชิงลบอื่นในวัยเด็ก" },
      { code: "Z61.9", label: "Z61.9 : เหตุการณ์เชิงลบในวัยเด็ก ไม่ระบุรายละเอียด" },
    ]
  },
  {
    id: "Z63",
    title: "หมวด Z63: ปัญหาอื่นที่เกี่ยวกับกลุ่มผู้ใกล้ชิด รวมทั้งสภาวะครอบครัว",
    items: [
      { code: "Z63.0", label: "Z63.0 : ปัญหาความสัมพันธ์ระหว่างคู่สมรสหรือคู่นอน" },
      { code: "Z63.2", label: "Z63.2 : การได้รับการสนับสนุนจากครอบครัวไม่เพียงพอ" },
      { code: "Z63.3", label: "Z63.3 : การขาดสมาชิกในครอบครัว (เช่น การเสียชีวิตหรือสาบสูญ)" },
      { code: "Z63.5", label: "Z63.5 : ครอบครัวแตกแยกจากการหย่าร้างหรือแยกทาง" },
      { code: "Z63.6", label: "Z63.6 : ญาติที่ต้องพึ่งพาต้องการการดูแลที่บ้าน" },
      { code: "Z63.7", label: "Z63.7 : เหตุการณ์กดดันอื่นที่มีผลต่อครอบครัวและครัวเรือน" },
      { code: "Z63.8", label: "Z63.8 : ปัญหาอื่นที่ระบุรายละเอียดเกี่ยวกับกลุ่มผู้ใกล้ชิด" },
    ]
  },
  {
    id: "Z65",
    title: "หมวด Z65: ปัญหาอื่นๆ ที่เกี่ยวข้องกับสภาวะทางจิตสังคม",
    items: [
      { code: "Z65.0", label: "Z65.0 : การถูกตัดสินในคดีแพ่งและอาญาโดยไม่ถูกจำคุก" },
      { code: "Z65.1", label: "Z65.1 : การถูกจำคุกและการถูกจองจำอื่น" },
      { code: "Z65.2", label: "Z65.2 : ปัญหาที่เกี่ยวข้องกับการถูกปล่อยตัวจากเรือนจำ" },
      { code: "Z65.3", label: "Z65.3 : ปัญหาเกี่ยวกับสภาพแวดล้อมทางกฎหมายอื่น (เช่น การถูกจับกุม, ข้อพิพาท)" },
      { code: "Z65.4", label: "Z65.4 : เหยื่อของอาชญากรรมและการก่อการร้าย (รวมถึงการทรมาน)" },
      { code: "Z65.5", label: "Z65.5 : การเผชิญกับภัยพิบัติ สงคราม หรือความเป็นศัตรูอื่น" },
      { code: "Z65.8", label: "Z65.8 : ปัญหาอื่นทางจิตสังคมที่ระบุรายละเอียด" },
      { code: "Z65.9", label: "Z65.9 : ปัญหาเกี่ยวกับสภาพแวดล้อมทางจิตสังคม ไม่ระบุรายละเอียด" },
    ]
  },
  {
    id: "Z72",
    title: "หมวด Z72: ปัญหาเกี่ยวกับการดำเนินชีวิต",
    items: [
      { code: "Z72.0", label: "Z72.0 : การใช้ยาสูบ (การสูบบุหรี่)" },
      { code: "Z72.1", label: "Z72.1 : การใช้แอลกอฮอล์" },
      { code: "Z72.2", label: "Z72.2 : การใช้ยา (สารเสพติดหรือการใช้ยาในทางที่ผิด)" },
      { code: "Z72.5", label: "Z72.5 : พฤติกรรมทางเพศที่มีความเสี่ยงสูง" },
      { code: "Z72.6", label: "Z72.6 : การเล่นการพนันและการเดิมพัน" },
      { code: "Z72.8", label: "Z72.8 : ปัญหาอื่นเกี่ยวกับการดำเนินชีวิต" },
      { code: "Z72.9", label: "Z72.9 : ปัญหาเกี่ยวกับการดำเนินชีวิต ไม่ระบุรายละเอียด" },
    ]
  },
];

export function useConsultFormPdx({ consultData, disabledForm = true, onChangeFormPdx }) {
  const isNotProcess = useRef(true);
  const sanitizeTimeouts = useRef({});

  const [selectedCodes, setSelectedCodes] = useState([]);
  const [pdxNoCheck, setPdxNoCheck] = useState(0);
  const [pdxOther, setPdxOther] = useState("");
  const [warnFields, setWarnFields] = useState({});

  const setWarnWithTimeout = useCallback((name, message) => {
    setWarnFields(prev => prev[name] === message ? prev : { ...prev, [name]: message });
    if (sanitizeTimeouts.current[name]) clearTimeout(sanitizeTimeouts.current[name]);
    sanitizeTimeouts.current[name] = setTimeout(() => {
      setWarnFields(prev => ({ ...prev, [name]: null }));
      sanitizeTimeouts.current[name] = null;
    }, 1500);
  }, []);

  // โหลดค่าจาก consultData
  useEffect(() => {
    isNotProcess.current = !consultData?.consult;
    if (isNotProcess.current) return;

    const data = consultData.consult;
    let codes = [];
    if (data?.pdx_codes) {
      if (Array.isArray(data.pdx_codes)) {
        codes = data.pdx_codes;
      } else if (typeof data.pdx_codes === "string") {
        try {
          codes = JSON.parse(data.pdx_codes);
        } catch {
          codes = data.pdx_codes.split(",").map(s => s.trim()).filter(Boolean);
        }
      }
    }

    // กำหนดให้เลือกได้แค่ 1 รหัสเท่านั้น (หากมีข้อมูลเดิมหลายรหัส ให้ใช้ตัวแรก)
    const singleCode = Array.isArray(codes) && codes.length > 0 ? [codes[0]] : [];
    setSelectedCodes(singleCode);
    setPdxNoCheck(Number(data?.pdx_no_check) === 1 ? 1 : 0);
    setPdxOther(data?.pdx_other || "");
  }, [consultData]);

  // สลับเลือกรหัส PDx (เลือกได้เพียง 1 รหัสเท่านั้น)
  const handleToggleCode = (code) => {
    if (disabledForm) return;

    setSelectedCodes(prev => {
      // ถ้ากดรหัสเดิมซ้ำ ให้ยกเลิกการเลือก (toggle off)
      // ถ้ากดรหัสใหม่ ให้เลือกเฉพาะรหัสนั้นเพียง 1 รหัส (single-select)
      const next = prev.includes(code) ? [] : [code];
      if (next.length > 0) {
        setPdxNoCheck(0);
      }
      return next;
    });

    setWarnFields(prev => ({ ...prev, pdx_alert: null }));
    isNotProcess.current = false;
  };

  // ติ๊ก "ไม่พบรหัส PDx / ไม่มีรหัสที่เข้าเกณฑ์"
  const handleToggleNoCheck = (e) => {
    if (disabledForm) return;
    const checked = e.target.checked;
    setPdxNoCheck(checked ? 1 : 0);
    if (checked) {
      setSelectedCodes([]);
    }
    setWarnFields(prev => ({ ...prev, pdx_alert: null }));
    isNotProcess.current = false;
  };

  // จัดการเปลี่ยนค่าในช่อง pdx_other
  const handleChangeOther = (e) => {
    if (disabledForm) return;
    const { value } = e.target;
    const validator = replace?.pdx_other;
    const parsed = BaseSchemaPdx.pick({ pdx_other: true }).safeParse({ pdx_other: value });

    let sanitizedValue = value;
    if (!parsed.success) {
      const isFormatError = parsed?.error?.errors[0]?.message;
      if (isFormatError && validator) {
        sanitizedValue = value.replace(validator, '');
        setWarnWithTimeout("pdx_other", isFormatError);
      }
    } else {
      setWarnWithTimeout("pdx_other", null);
    }

    setPdxOther(sanitizedValue);
    setWarnFields(prev => ({ ...prev, pdx_alert: null }));
    isNotProcess.current = false;
  };

  const onChangeRef = useRef(onChangeFormPdx);
  onChangeRef.current = onChangeFormPdx;

  // แจ้ง parent component เมื่อข้อมูลเปลี่ยน
  useEffect(() => {
    if (isNotProcess.current) return;

    const isComplete = selectedCodes.length === 1 || pdxNoCheck === 1 || Boolean(pdxOther?.trim());

    onChangeRef.current?.({
      formData: {
        pdx_codes: selectedCodes.slice(0, 1),
        pdx_no_check: pdxNoCheck,
        pdx_other: pdxOther,
      },
      isComplete,
    });
  }, [selectedCodes, pdxNoCheck, pdxOther]);

  const validateForm = (focus = false) => {
    const hasCodes = selectedCodes.length > 0;
    const isNoCheck = pdxNoCheck === 1;
    const hasOther = Boolean(pdxOther?.trim());

    if (!hasCodes && !isNoCheck && !hasOther) {
      if (focus) {
        setWarnWithTimeout("pdx_alert", "กรุณาเลือกรหัส PDx 1 รหัส หรือเลือก 'ไม่พบรหัส PDx'");
        const el = document.querySelector('[name="pdx_no_check"]') || document.querySelector('.consult-pdx-container');
        if (el) {
          try {
            el.focus?.();
            el.scrollIntoView({ behavior: "smooth", block: "center" });
          } catch (err) {}
        }
      }
      return false;
    }

    if (hasCodes && selectedCodes.length > 1) {
      if (focus) {
        setWarnWithTimeout("pdx_alert", "รหัส PDx สามารถเลือกได้เพียง 1 รหัสเท่านั้น");
      }
      return false;
    }

    setWarnFields(prev => ({ ...prev, pdx_alert: null }));
    return true;
  };

  return {
    selectedCodes,
    pdxNoCheck,
    pdxOther,
    warnFields,
    handleToggleCode,
    handleToggleNoCheck,
    handleChangeOther,
    validateForm,
    groups: PDX_GROUPS,
  };
}
