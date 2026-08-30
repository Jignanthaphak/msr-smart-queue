// /hooks/useManagesBioFormDetail.js
'use client';

import { useState, useEffect } from "react";
import cloneDeep from 'lodash/cloneDeep';
import { editBioAction } from "@/actions/admin/bio/actions"; // API call สำหรับ bio
import { date } from "@/lib/utils/dateFormat"; // แปลงวันที่ให้อยู่ใน format ที่อ่านง่าย
import { useAlert } from '@/lib/utils/useAlert'; // hook สำหรับ show alert/confirm/loading
import { useBioData } from "@/hooks/useBioData"; // low-level hook จัดการฟอร์ม bio

/**
 * useManagesBioFormDetail
 * High-level hook สำหรับ TabBio
 * - ใช้ useBioData เป็น low-level hook
 * - จัดการ UI state, mode, btnState
 * - จัดการ API: updatebio, patchbio
 */
export function useManagesBioFormDetail(data, onEdit) {

  // ----------- alert system -------------
  // ใช้ showAlert เพื่อ popup confirm/alert/loading
  const { showAlert, AlertComponent } = useAlert();

  // ----------- low-level hook for form -------------
  // ใช้ useBioData เป็นตัวจัดการฟอร์ม:
  // - formData: ข้อมูลฟอร์มทั้งหมด
  // - formComplete: boolean ฟอร์มครบไหม
  // - refFormBio: ref ไปยัง form child
  // - onChangeFormBioCallback: callback ให้ child update state
  // - validateAndScrollToError: validate ฟอร์ม + scroll ไปยัง field ที่ error
  const {
    formData, 
    formComplete, 
    refFormBio, 
    onChangeFormBioCallback, 
    validateAndScrollToError
  } = useBioData();

  // ----------- UI state -------------
  // state ควบคุม mode, ปุ่ม, การ disable form, การ reset form
  const initialUIState = {
    resetKey: 0,               // trigger re-render form child
    screeningId: null,          // id ของ screening
    disabledForm: true,         // form editable หรือไม่
    disabledBtn: false,         // ปุ่มสามารถกดได้หรือไม่
    isEdit: false,
    mode: "waitingsend",      // mode: waitingsend, editing
    btnState: 9,             // ปุ่ม state ใช้ควบคุม BtnForm
  };
  const [uiState, setUIState] = useState(initialUIState);

  // ----------- bio data state -------------
  const [bioData, setBioData] = useState(null);     // ข้อมูล bio ปัจจุบัน
  const [bioDataBK, setBioDataBK] = useState(null); // backup ข้อมูล bio ก่อนแก้ไข

  // ----------- reset form state -------------
  // คืนค่า UI state + data + reset form child
  const resetFormState = () => {
    setBioData(null);
    setBioDataBK(null);
    setUIState(prev => ({ ...initialUIState, resetKey: prev.resetKey + 1 }));
    if (refFormBio.current?.resetForm) refFormBio.current.resetForm(); // reset ฟอร์มลูก
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

   useEffect(() => {
  
      if (!data) return;
     
      const clone = cloneDeep(data); 
       
      const hn = clone?.hn || null;
      const screeningId = clone?.screenings?.screening_id || null;
  
      setBioData(clone);
      setBioDataBK(clone);
       
      setUIState(prev => ({
        ...prev,
        hn,
        screeningId,
        isEdit: false,
        disabledForm: true,
        disabledBtn: false,
        mode: "waitingsend",
        btnState: 9,
      }));
  
    }, [data]);

  // ----------- edit API call -------------
  // ใช้เมื่อแก้ไข bio
  const editBio = async () => {
    try {
      const isCheck = await validateAndScrollToError(); // validate ฟอร์ม
      if(!isCheck) return;

      // confirm ก่อนแก้ไข
      const confirm = await showAlert({
        title: 'ยืนยันการส่งข้อมูล Bio!',
        message: "กรุณาตรวจสอบข้อมูลก่อนส่ง Bio",
        icon: 'info',
        type: 'confirm',
        loadingStyle: 'modal',
        confirmText: "ส่งข้อมูล",
        cancelText: "ยกเลิก",
        allowOutsideClick: false,
        allowEscapeKey: false,
        allowEnterKey: false,
      });
      if(!confirm) return;

      setUIState(prev => ({ ...prev, disabledForm: true, disabledBtn: true }));

      const payload = {
        screening_id: uiState.screeningId,
        bio: formData,
      };
      
      const result = await editBioAction(payload);
      
      if(!result?.ok) {
        throw new Error(result?.error || "แก้ไขข้อมูลไม่สำเร็จ");
      }

      if (!result?.data) {
        throw new Error("ไม่พบข้อมูลจาก API");
      }

      setBioDataBK(result.data);

      setUIState(prev => ({
        ...prev,
        isEdit: false,
        disabledBtn: false,
        disabledForm: true,
        mode: "waitingsend",
        btnState: 9,
      }));

      await showAlert?.({ title: "แก้ไขข้อมูล Bio", message: "แก้ไขข้อมูล Bio สำเร็จ", type: "alert", icon: "success" });

      onEdit?.()
    
    } catch (err) {

      await showAlert({ title: 'เกิดข้อผิดพลาด', message: err.message, type: 'alert', icon: 'error' });

    } finally {

      setUIState(prev => ({
        ...prev,
        disabledBtn: false,
      }));
    }
  };

  // ----------- handle button click -------------
  // action: edit, save, cancel, send
  const onClickBtnCallback = async (action) => {
  
    switch(action) {
      case "edit":
        if(uiState.mode === "waitingsend") {
          setUIState(prev => ({ ...prev, disabledForm: false, isEdit: true, mode: "editing", btnState: 2 }));
        }
        break;
      case "save":
        if(uiState.mode === "editing") await editBio(); // call edit API
        break;
      case "cancel":
        if(uiState.mode === "editing") {
          // คืนค่า formData เป็นค่า backup

          const confirm = await showAlert?.({
            title: "ยื่นยันการยกเลิกแก้ไขข้อมูล Bio",
            message: "คุณต้องการยกเลิกแก้ไขข้อมูล Bio ใช่ไหม ?",
            icon: "warning",
            type: "confirm",
            duration: 500,
            loadingStyle: "modal",
            confirmText: "ยืนยัน",
            cancelText: "ยกเลิก",
          });
          if (confirm){
            setUIState(prev => ({
              ...prev,
              disabledForm: true,
              isEdit: false,
              mode: "waitingsend",
              btnState: 9,
            }));
            setBioData(cloneDeep(bioDataBK));
          }
        } 

        break;
    }
  };

  // ----------- return state & callbacks -------------
  // return ทั้งหมดให้ component ใช้งาน
  return {
    formData,
    formComplete,
    bioData,
    uiState,
    refFormBio,
    onChangeFormBioCallback,
    onClickBtnCallback,
    AlertComponent,
    resetFormState,
  };
}
