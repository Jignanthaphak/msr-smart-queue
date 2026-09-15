// /hooks/useManagesConsultFormScreening.js
'use client';
// ระบุว่าไฟล์นี้เป็น Client Component ของ Next.js
// เนื่องจากใช้ React hook และทำงานฝั่ง client

import { useState } from 'react';
import cloneDeep from 'lodash/cloneDeep'; 
// ใช้สำหรับ deep copy object เพื่อไม่ให้ reference เดียวกัน
import { useAlert } from '@/lib/utils/useAlert'; 
// custom hook สำหรับแสดง alert
import { useConsultData } from '@/hooks/useConsultData'; 
// low-level hook สำหรับจัดการ state ของแต่ละ subform
import { startconsult, closeconsult, updateconsult, patchconsult } from "@/services/screening/consult"; 
// API service สำหรับ consult
import useHistoryScreeningHook from "@/stores/useHistoryScreeningHook"; 
// store สำหรับเก็บและจัดการ history ของ screening
import { date } from "@/lib/utils/dateFormat"; // ฟังก์ชันแปลงวันที่

import { Modal, Input, Button, Spin, Form, Switch, message, Select, Typography } from "antd";

/**
 * useManagesConsultFormScreening
 * High-level hook สำหรับ TabConsult
 * - ใช้ useConsultData เป็น low-level hook
 * - จัดการ UI state, mode, btnState
 * - จัดการ API call: startconsult, closeconsult, updateconsult, patchconsult
 */
export function useManagesConsultFormScreening() {

  // ---------- alert ----------
  const { showAlert, AlertComponent } = useAlert();
  // showAlert: ฟังก์ชันเรียก alert / confirm / loading
  // AlertComponent: component สำหรับ render alert

  // ---------- history screening store ----------
  const { setHnHistory, getHistoryScreening, clearHistoryScreening } = useHistoryScreeningHook();
  // ใช้จัดการ HN history และเรียกข้อมูล history จาก store

  // ---------- ใช้ low-level hook ของ form ----------
  const {
    formData,
    formComplete,
    refs,
    validateAndScrollToError,
    onChangeFormCallback,
    setFormData,
    setFormComplete,
    initialFormData,
    initialFormComplete,
  } = useConsultData();

  // ---------- initial UI state ----------
  const initialUIState = {
    activeTab: 1,             // tab ที่เปิดอยู่
    resetKey: 0,              // ใช้สำหรับ force reset component
    screeningId: null,        // ID ของ screening
    screeningStatus: null,    // status ของ screening
    screeningStatusName: null,// ชื่อ status
    screeningDate: null,      // วันที่ screening
    showFormConsult: false,   // show/hide form consult
    disabledForm: true,       // form สามารถแก้ไขได้หรือไม่
    disabledBtn: false,       // ปุ่มถูก disable หรือไม่
    showBtnConsult: false,    // ปุ่ม consult
    showBtnCloseCase: false,  // ปุ่ม close case
    showBtnAIConsult: false,   // ปุ่ม consult
    mode: null,               // mode ของ form (waitingsend / editing)
    btnState: null,           // state ของปุ่ม
  }

  // ---------- React state ----------
  const [uiState, setUIState] = useState(initialUIState);
  const [personData, setPersonData] = useState(null); 
  // ข้อมูลผู้ป่วย / คนที่เลือกจาก search
  const [consultData, setConsultData] = useState(null); 
  // ข้อมูล consult ปัจจุบัน
  const [consultDataBK, setConsultDataBK] = useState(null); 
  // backup ข้อมูล consult ป้องกันการแก้ไขผิดพลาด

  // ----------- reset form -------------
  const resetFormState = () => {
    setFormData(initialFormData || {});          // ล้าง formData
    setFormComplete(initialFormComplete || {});  // ล้าง formComplete (ทุกแท็บเป็น false)
    setConsultData(null);     // ล้าง consultData
    setConsultDataBK(null);   // ล้าง backup
    setPersonData(null);      // ล้าง personData
    setUIState(prev => ({ ...initialUIState, resetKey: prev.resetKey + 1 })); 
    // เพิ่ม resetKey เพื่อ trigger re-render
    Object.values(refs).forEach(r => r.current = null); 
    // ล้าง refs ของแต่ละ subform
    window.scrollTo({ top: 0, behavior: 'smooth' }); 
    clearHistoryScreening?.(); 
    // ล้าง history ของ screening ใน store
  }

  // ----------- helper btn state -------------
  const btnCondition = (status) => {
    // กำหนด state ของปุ่มตาม status
    // status 4,5 => btnState 7
    // status 3 => btnState 5
    return [4,5].includes(status) ? 7 : status === 3 ? 5 : null;
  }

  // ----------- handle search select -------------
  const onSelectedSearchCallback = (data) => {

    if(!data) return;

    const clone = data ? cloneDeep(data) : null;
     
    setConsultData(clone?.screenings || null);
    setConsultDataBK(clone?.screenings || null);
    setPersonData(clone);
    setFormData(initialFormData || {});
    setFormComplete(initialFormComplete || {});
    
    // ดึงข้อมูล screening
    const hn = clone?.hn;
    const screeningId = clone?.screenings?.screening_id || null;
    const screeningStatus = clone?.screenings?.status_id || null;
    const screeningStatusName = clone?.screenings?.screening_status?.status_name || null;
    const screeningDate  = clone?.screenings?.date ? date(clone?.screenings?.date) : null;

    // กำหนด show/hide form และปุ่ม
    const showFormConsult = [3,4,5].includes(screeningStatus);
    const showBtnConsult = [2,5].includes(screeningStatus);
    const showBtnAIConsult = [3,4].includes(screeningStatus);
    const showBtnCloseCase = ![4,5].includes(screeningStatus);
    const mode = "waitingsend";
    const btnState = btnCondition(screeningStatus);
    
    // จัดการ HN history
    setHnHistory?.(hn);
    getHistoryScreening?.();

    // update UI state
    setUIState(prev => ({
      ...prev,
      screeningId,
      screeningStatus,
      screeningStatusName,
      screeningDate,
      showFormConsult,
      disabledForm: true,
      disabledBtn: false,
      showBtnConsult,
      showBtnCloseCase,
      showBtnAIConsult,
      mode,
      btnState,
    }));
  }

  const TAB_INFOS = [
    { key: "consulting", formKey: "ConsultingForm", tabIndex: 1, name: "ข้อมูลการให้คำปรึกษา" },
    { key: "stress", formKey: "StressForm", tabIndex: 2, name: "สาเหตุความเครียด" },
    { key: "risk", formKey: "RiskForm", tabIndex: 3, name: "ความเสี่ยง" },
    { key: "assist", formKey: "AssistForm", tabIndex: 4, name: "การให้ความช่วยเหลือ" },
    { key: "follow", formKey: "FollowForm", tabIndex: 5, name: "การติดตาม" },
    { key: "pdx", formKey: "PdxForm", tabIndex: 6, name: "รหัส PDx" },
    { key: "satisfaction", formKey: "SatisfactionForm", tabIndex: 7, name: "ความพึงพอใจ" },
  ];

  // ----------- validate และ scroll ไป field แรกที่ error -------------
  const handleValidateAndScroll = async () => {
    const validation = await validateAndScrollToError();

    // หาแท็บทั้งหมดที่ยังไม่ผ่าน validation หรือยังไม่ได้กรอก
    const missingTabs = TAB_INFOS.filter(item => !validation[item.key]);

    if (missingTabs.length > 0) {
      const firstMissing = missingTabs[0];
      setUIState(prev => ({ ...prev, activeTab: firstMissing.tabIndex }));
      setTimeout(() => {
        refs[firstMissing.key]?.current?.validateAndFocus?.(true);
      }, 100);

      return {
        isValid: false,
        missingTabs,
      };
    }

    return {
      isValid: true,
      missingTabs: [],
    };
  };

  // ----------- API call handlers -------------

  const handleStartConsult = async () => {

    try {

      if(!uiState.screeningId) return showAlert({ title: 'ไม่พบ Screening ID', type:'alert', icon:'error' });

      const confirm = await showAlert({
        title: 'ยืนยันการเริ่ม Consult!',
        message: "กรุณาตรวจสอบข้อมูลก่อนเริ่ม Consult",
        icon: 'info',
        type: 'confirm',
        loadingStyle: 'modal',
        confirmText: "เริ่ม Consult",
        cancelText: "ยกเลิก",
        allowOutsideClick: false,
        allowEscapeKey: false,
        allowEnterKey: false,
      });
      if(!confirm) return;

      await showAlert({ title:'กำลังส่งข้อมูลเริ่ม Consult', icon:'loading', type:'loading', duration:500 });

      const result = await startconsult(uiState.screeningId);
   
      onSelectedSearchCallback(result.data);

    } catch (err) {

      await showAlert({ title: 'เกิดข้อผิดพลาด', message: err.message, type: 'alert', icon: 'error' });

    }

  }

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

      await showAlert({ title:'กำลังปิดเคส Consult', icon:'loading', type:'loading', duration:500 });
      await closeconsult(uiState.screeningId);

      message.success("ปิดเคสเรียบร้อย");
      //await showAlert({ title:'ปิดเคส Consult', message:"ปิดเคสเรียบร้อย", type:'alert', icon:'success' });
      resetFormState();

    } catch (err) {

      await showAlert({ title: 'เกิดข้อผิดพลาด', message: err.message, type: 'alert', icon: 'error' });

    }

  }

  const editConsult = async () => {

     try {
      
      const checkResult = await handleValidateAndScroll();
      if (!checkResult.isValid) {
        const missingList = checkResult.missingTabs.map((t, idx) => `${idx + 1}. ${t.name}`).join("\n");
        await showAlert({
          title: "ยังกรอกข้อมูลไม่ครบทุกแท็บ!",
          message: `กรุณากรอกข้อมูลให้ครบทุกแท็บก่อนบันทึก\n\nแท็บที่ยังไม่ได้กรอก:\n${missingList}`,
          type: "alert",
          icon: "warning",
        });
        return;
      }

      const confirm = await showAlert({
        title: 'ยืนยันการบันทึกข้อมูล Consult!',
        message: "กรุณาตรวจสอบข้อมูล Consult ก่อนบันทึก",
        icon: 'info',
        type: 'confirm',
        loadingStyle: 'modal',
        confirmText: "บันทึกข้อมูล",
        cancelText: "ยกเลิก",
        allowOutsideClick: false,
        allowEscapeKey: false,
        allowEnterKey: false,
      });
      if(!confirm) return;

      setUIState(prev => ({...prev, disabledBtn: true}));
     
      const result = await updateconsult(uiState.screeningId, formData);
      message.success("บันทึกข้อมูล Consult เรียบร้อย");
      //await showAlert({ title:'บันทึกข้อมูล Consult เรียบร้อย', type:'alert', icon:'success' });
      onSelectedSearchCallback(result.data);

    } catch (err) {

      await showAlert({ title: 'เกิดข้อผิดพลาด', message: err.message, type: 'alert', icon: 'error' });

    } finally {

      setUIState(prev => ({ ...prev, disabledBtn: false }));

    }

  }

  const sendConsult = async () => {

    try {
      
      const checkResult = await handleValidateAndScroll();
      if (!checkResult.isValid) {
        setUIState(prev => ({ ...prev, disabledForm: false, mode: "editing", btnState: 6 }));
        const missingList = checkResult.missingTabs.map((t, idx) => `${idx + 1}. ${t.name}`).join("\n");
        await showAlert({
          title: "ยังกรอกข้อมูลไม่ครบทุกแท็บ!",
          message: `กรุณากรอกข้อมูลให้ครบทุกแท็บก่อนยืนยันส่งตรวจ\n\nแท็บที่ยังไม่ได้กรอก:\n${missingList}`,
          type: "alert",
          icon: "warning",
        });
        return;
      }

      const confirm = await showAlert({
        title: 'ยืนยันส่งตรวจ',
        message: "กรุณาตรวจสอบข้อมูลก่อนยืนยันส่งตรวจ",
        type: 'confirm'
      });
      if(!confirm) return;

      setUIState(prev => ({ ...prev, disabledBtn: true }));
      await patchconsult(uiState.screeningId);

      message.success("ส่งตรวจเรียบร้อย");
      //await showAlert({ title:'ส่งตรวจเรียบร้อย', type:'alert', icon:'success' });
      resetFormState();

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
          setUIState(prev => ({ ...prev, disabledForm:false, mode:"editing", btnState:6 }));
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
            setUIState(prev => ({ ...prev, disabledForm:true, mode:"waitingsend", btnState:btnCondition(uiState.screeningStatus) }));
            setConsultData(cloneDeep(consultDataBK)); // restore backup
          }
        } else if(uiState.mode === "waitingsend"){

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
            resetFormState();
          }

        } 
        break;
      case "send":
        sendConsult();
        break;
    }
  }

  // ---------- return ----------
  return {
    uiState,
    setUIState,
    personData,
    consultData,
    formData,
    formComplete,
    refs,
    onChangeFormCallback,
    handleValidateAndScroll,
    onSelectedSearchCallback,
    onClickBtnCallback,
    resetFormState,
    handleStartConsult,
    handleCloseConsult,
    AlertComponent
  }
}
