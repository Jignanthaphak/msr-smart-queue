// /hooks/useManagesConsultFormDetail.js
'use client';
// ระบุว่าไฟล์นี้เป็น Client Component ของ Next.js
// เนื่องจากใช้ React hook และทำงานฝั่ง client

import { useState, useEffect, useRef  } from 'react';
import cloneDeep from 'lodash/cloneDeep'; 
// ใช้สำหรับ deep copy object เพื่อไม่ให้ reference เดียวกัน
import { useAlert } from '@/lib/utils/useAlert'; 
// custom hook สำหรับแสดง alert
import { useConsultData, initialFormData, initialFormComplete } from '@/hooks/useConsultData'; 
import { editConsultAction } from "@/actions/admin/consult/actions";
import {  closeConsultAction } from "@/actions/admin/screening/actions"; 
// store สำหรับเก็บและจัดการ history ของ screening

/**
 * useManagesConsultFormDetail
 * High-level hook สำหรับ TabConsult
 * - ใช้ useConsultData เป็น low-level hook
 * - จัดการ UI state, mode, btnState
 * - จัดการ API call: startconsult, closeconsult, updateconsult, patchconsult
 */
export function useManagesConsultFormDetail(data, onEdit) {

  // ---------- alert ----------
  const { showAlert, AlertComponent } = useAlert();
  // showAlert: ฟังก์ชันเรียก alert / confirm / loading
  // AlertComponent: component สำหรับ render alert

   const formRef = useRef(null)

  // ---------- ใช้ low-level hook ของ form ----------
  const {
    formData,
    formComplete,
    refs,
    validateAndScrollToError,
    onChangeFormCallback,
    setFormData,
    setFormComplete
  } = useConsultData();

  // ---------- initial UI state ----------
  const initialUIState = {
    resetKey: 0,              // ใช้สำหรับ force reset component
    screeningId: null,        // ID ของ screening
    disabledForm: true,       // form สามารถแก้ไขได้หรือไม่
    disabledBtn: false,       // ปุ่มถูก disable หรือไม่
    showBtnConsult: false,    // ปุ่ม consult
    showBtnCloseCase: false,  // ปุ่ม close case
    isEdit: false,            // โหมดแก้ไขหรือไม่
    mode: "waitingsend",      // idle, creating, editing, waitingsend
    btnState: 9,              // state ปุ่ม (ควบคุม UI ของ BtnForm)
  }

  // ---------- React state ----------
  const [uiState, setUIState] = useState(initialUIState);
  // ข้อมูลผู้ป่วย / คนที่เลือกจาก search
  const [consultData, setConsultData] = useState(null); 
  // ข้อมูล consult ปัจจุบัน
  const [consultDataBK, setConsultDataBK] = useState(null); 
  // backup ข้อมูล consult ป้องกันการแก้ไขผิดพลาด

  // ----------- reset form -------------
  const resetFormState = () => {
    setFormData(initialFormData);          // ล้าง formData
    setFormComplete(initialFormComplete);  // ล้าง formComplete
    setConsultData(null);     // ล้าง consultData
    setConsultDataBK(null);   // ล้าง backup
    setUIState(prev => ({ ...initialUIState, resetKey: prev.resetKey + 1 })); 
    // เพิ่ม resetKey เพื่อ trigger re-render
    Object.values(refs).forEach(r => r.current = null); 
    // ล้าง refs ของแต่ละ subform
    window.scrollTo({ top: 0, behavior: 'smooth' }); 
  }

  useEffect(() => {
  
    if (!data) return;
  
    const clone = data ? cloneDeep(data) : null;

    console.log("useManagesConsultFormDetail", clone?.screenings)

    setConsultData(clone?.screenings || null);
    setConsultDataBK(clone?.screenings || null);

    setFormData(initialFormData);
    setFormComplete(initialFormComplete);

    const hn = clone?.hn || null;
    const screeningId = clone?.screenings?.screening_id || null;
      
    setUIState(prev => ({
      ...prev,
      hn,
      screeningId,
      isEdit: false,
      disabledForm: true,
      disabledBtn: false,
      showBtnConsult: false,
      showBtnCloseCase: false, 
      mode: "waitingsend",
      btnState: 9,
    }));
     
 }, [data]);
  
  const SECTION_INFOS = [
    { key: "consulting", name: "ข้อมูลการให้คำปรึกษา" },
    { key: "stress", name: "สาเหตุความเครียด" },
    { key: "risk", name: "ความเสี่ยง" },
    { key: "assist", name: "การให้ความช่วยเหลือ" },
    { key: "follow", name: "การติดตาม" },
    { key: "pdx", name: "รหัส PDx" },
    { key: "satisfaction", name: "ความพึงพอใจ" },
  ];

  // ----------- validate และ scroll ไป field แรกที่ error -------------
  const handleValidateAndScroll = async () => {
    const ref = formRef.current;
    if (!ref) return { isValid: false, missingSections: [] };
   
    const missingSections = [];

    for (const sec of SECTION_INFOS) {
      const result = await ref.validateAndFocusSection?.(sec.key);
      if (!result) {
        missingSections.push(sec);
      }
    }

    if (missingSections.length > 0) {
      return { isValid: false, missingSections };
    }

    return { isValid: true, missingSections: [] };
  };

  // ----------- API call handlers -------------
  const handleCloseConsult = async () => {
  
      try {
  
        if(!uiState.screeningId) return showAlert({ title: 'ไม่พบ Screening ID', type:'alert', icon:'error' });
  
        const confirm = await showAlert({
          title: 'ยืนยันการปิดเคส Consult',
          message: "กรุณาตรวจสอบข้อมูลก่อนปิดเคส Consult",
          icon: 'info',
          type: 'confirm',
          loadingStyle: 'modal',
          confirmText: "ปิดเคส Consult",
          cancelText: "ยกเลิก",
          allowOutsideClick: false,
          allowEscapeKey: false,
          allowEnterKey: false,
        });
        if(!confirm) return;

         const payload = {
          screening_id: uiState.screeningId,
        };
  
        await showAlert({ title:'กำลังปิดเคส Consult', icon:'loading', type:'loading', duration:500 });
        const result = await closeConsultAction(payload);
        if(!result?.ok) {
          throw new Error(result?.error || "ปิดเคส Consult ไม่สำเร็จ");
        }
       
        await showAlert({ title:'ปิดเคส Consult', message:"ปิดเคสเรียบร้อย", type:'alert', icon:'success' });
       
        setConsultData(result.data || null);
        setConsultDataBK(result.data || null);
  
      } catch (err) {
  
        await showAlert({ title: 'เกิดข้อผิดพลาด', message: err.message, type: 'alert', icon: 'error' });
  
      }
  
    }
  
    const editConsult = async () => {
  
       try {
        
        const checkResult = await handleValidateAndScroll();
        if (!checkResult.isValid) {
          const missingList = checkResult.missingSections.map((s, idx) => `${idx + 1}. ${s.name}`).join("\n");
          await showAlert({
            title: "ยังกรอกข้อมูลไม่ครบทุกส่วน!",
            message: `กรุณากรอกข้อมูลให้ครบทุกส่วนก่อนบันทึก\n\nส่วนที่ยังไม่ได้กรอก:\n${missingList}`,
            type: "alert",
            icon: "warning",
          });
          return;
        }

        const confirm = await showAlert({title: 'ยืนยันการแก้ไขข้อมูล Consult!', message: "กรุณาตรวจสอบข้อมูลก่อนแก้ไข Consult", icon: 'info', type: 'confirm', loadingStyle: 'modal', confirmText: "แก้ไขข้อมูล", cancelText: "ยกเลิก", allowOutsideClick: false, allowEscapeKey: false, allowEnterKey: false });
        if(!confirm) return;
  
        setUIState(prev => ({...prev, disabledBtn: true}))

        const payload = {
          screening_id: uiState.screeningId,
          consult: formData,
        };
      
        const result = await editConsultAction(payload);
    
        if(!result?.ok) {
          throw new Error(result?.error || "แก้ไขข้อมูลไม่สำเร็จ");
        }

        if (!result?.data) {
          throw new Error("ไม่พบข้อมูลจาก API");
        }
   
        setConsultDataBK(result.data?.screenings);

        setUIState(prev => ({
          ...prev,
          isEdit: false,
          disabledBtn: false,
          disabledForm: true,
          mode: "waitingsend",
          btnState: 9,
        }));

        await showAlert?.({ title: "แก้ไขข้อมูล Consult", message: "แก้ไขข้อมูลสำเร็จ Consult", type: "alert", icon: "success" });

        onEdit?.()
  
      } catch (err) {
  
        await showAlert({ title: 'เกิดข้อผิดพลาด', message: err.message, type: 'alert', icon: 'error' });
  
      } finally {
  
        setUIState(prev => ({ ...prev, disabledBtn: false }));
  
      }
  
    }

  // ----------- handle btn actions -------------
  const onClickBtnCallback = async (action) => {
    switch(action){
      case "edit":
        if(uiState.mode === "waitingsend") 
          setUIState(prev => ({ ...prev, disabledForm: false, isEdit: true, mode: "editing", btnState: 2 }));
        break;
      case "save":
        if(uiState.mode === "editing") editConsult();
        break;
      case "cancel":
        
        if(uiState.mode === "editing"){

          const confirm = await showAlert?.({
            title: "ยื่นยันการยกเลิกตรวจ Consult",
            message: "คุณต้องการยกเลิกตรวจ Consult ใช่ไหม ?",
            icon: "warning",
            type: "confirm",
            duration: 500,
            loadingStyle: "modal",
            confirmText: "ยืนยัน",
            cancelText: "ยกเลิก",
          });
          if (confirm){
            setUIState(prev => ({ ...prev, disabledForm: true, isEdit: false, mode:"waitingsend", btnState:9 }));
            setConsultData(cloneDeep(consultDataBK)); // restore backup
          }
        }
        break;
    }
  }

  // ---------- return ----------
  return {
    uiState,
    setUIState,
    consultData,
    formData,
    formComplete,
    formRef,
    onChangeFormCallback,
    handleValidateAndScroll,
    onClickBtnCallback,
    handleCloseConsult,
    AlertComponent
  }
}
