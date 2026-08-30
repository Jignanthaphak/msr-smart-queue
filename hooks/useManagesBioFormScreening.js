// /hooks/useManagesBioFormScreening.js
'use client';

import { useState } from "react";
import cloneDeep from 'lodash/cloneDeep';
import { updatebio, patchbio } from "@/services/screening/bio"; // API call สำหรับ bio
import { date } from "@/lib/utils/dateFormat"; // แปลงวันที่ให้อยู่ใน format ที่อ่านง่าย
import { useAlert } from '@/lib/utils/useAlert'; // hook สำหรับ show alert/confirm/loading
import { useBioData } from "@/hooks/useBioData"; // low-level hook จัดการฟอร์ม bio
import useHistoryScreeningHook from "@/stores/useHistoryScreeningHook"; // store สำหรับ history screening
import { Modal, Input, Button, Spin, Form, Switch, message, Select, Typography } from "antd";
/**
 * useManagesBioFormScreening
 * High-level hook สำหรับ TabBio
 * - ใช้ useBioData เป็น low-level hook
 * - จัดการ UI state, mode, btnState
 * - จัดการ API: updatebio, patchbio
 */
export function useManagesBioFormScreening() {

  // ----------- alert system -------------
  // ใช้ showAlert เพื่อ popup confirm/alert/loading
  const { showAlert, AlertComponent } = useAlert();

  // ----------- history screening store -------------
  const { setHnHistory, getHistoryScreening, clearHistoryScreening } = useHistoryScreeningHook();

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
    screeningStatus: null,      // สถานะ screening (รอ, ส่งแล้ว, ฯลฯ)
    screeningStatusName: null,  // ชื่อสถานะ
    screeningDate: null,        // วันที่ screening
    disabledForm: true,         // form editable หรือไม่
    disabledBtn: false,         // ปุ่มสามารถกดได้หรือไม่
    mode: null,                 // mode: waitingsend, editing
    btnState: null,             // ปุ่ม state ใช้ควบคุม BtnForm
  };
  const [uiState, setUIState] = useState(initialUIState);

  // ----------- bio data state -------------
  const [bioData, setBioData] = useState(null);     // ข้อมูล bio ปัจจุบัน
  const [bioDataBK, setBioDataBK] = useState(null); // backup ข้อมูล bio ก่อนแก้ไข

  // ----------- helper: btn state -------------
  // กำหนด btnState ตาม status ของ screening
  const btnCondition = (status) => status >= 2 ? 7 : 5;

  // ----------- reset form state -------------
  // คืนค่า UI state + data + reset form child
  const resetFormState = () => {
    setBioData(null);
    setBioDataBK(null);
    setUIState(prev => ({ ...initialUIState, resetKey: prev.resetKey + 1 }));
    if (refFormBio.current?.resetForm) refFormBio.current.resetForm(); // reset ฟอร์มลูก
    window.scrollTo({ top: 0, behavior: 'smooth' });
    clearHistoryScreening?.(); // ล้าง history การคัดกรอง
  };

  // ----------- select from search -------------
  // เมื่อเลือก bio จาก search panel
  const onSelectedSearchCallback = (data) => {

    if (!data) return; // ไม่มีข้อมูล -> return

    const clone = cloneDeep(data); // deep copy เพื่อป้องกัน mutation
    setBioData(clone);
    setBioDataBK(clone);

    // ดึงค่า screening info
    const hn = clone?.hn;
    const screeningId = clone?.screenings?.screening_id;
    const screeningStatus = clone?.screenings?.status_id;
    const screeningStatusName = clone?.screenings?.screening_status?.status_name;
    const screeningDate = clone?.screenings?.date ? date(clone?.screenings?.date) : null;

    setHnHistory?.(hn); // set HN history
    getHistoryScreening?.(); // fetch history

    // อัพเดท UI state
    setUIState(prev => ({
      ...prev,
      screeningId,
      screeningStatus,
      screeningStatusName,
      screeningDate,
      disabledForm: true,
      disabledBtn: false,
      mode: "waitingsend",
      btnState: btnCondition(screeningStatus),
    }));
  };

  // ----------- edit API call -------------
  // ใช้เมื่อแก้ไข bio
  const editBio = async () => {
    try {
      const isCheck = await validateAndScrollToError(); // validate ฟอร์ม
      if(!isCheck) return;

      // confirm ก่อนแก้ไข
      const confirm = await showAlert({
        title: 'ยืนยันการบันทึกข้อมูล Bio!',
        message: "กรุณาตรวจสอบข้อมูลก่อนการบันทึกข้อมูล Bio",
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

      setUIState(prev => ({ ...prev, disabledBtn: true })); // disable ปุ่ม
      const result = await updatebio(uiState.screeningId, formData); // call API

      message.success("ส่งข้อมูล Bio เรียบร้อย");
      //await showAlert({ title: 'ส่งข้อมูล Bio', message: "ส่งข้อมูล Bio เรียบร้อย", type: 'alert', icon: 'success' });
      onSelectedSearchCallback(result?.data || null); // refresh ข้อมูลหลังแก้ไข
    } catch (err) {
      await showAlert({ title: 'เกิดข้อผิดพลาด', message: err.message, type: 'alert', icon: 'error' });
    } finally {
      setUIState(prev => ({ ...prev, disabledBtn: false })); // enable ปุ่ม
    }
  };

  // ----------- send API call -------------
  // ใช้ส่ง bio ไปยัง server (patch)
  const sendBio = async () => {
    try {
      const isCheck = await validateAndScrollToError(); // validate ฟอร์ม
      if(!isCheck) {
        setUIState(prev => ({
          ...prev,
          disabledForm: false,
          mode: "editing",
          btnState: 6,
        }));
        await showAlert({ title: 'กรุณาตรวจสอบ!', message: "ยังกรอกข้อมูลยังไม่ครบ", type: 'alert', icon: 'warning' });
        return;
      }

      // confirm ส่งตรวจ
      const confirm = await showAlert({
        title: 'ยืนยันการส่งตรวจ',
        message: "ตรวจสอบข้อมูลก่อนส่งตรวจ",
        icon: 'info',
        type: 'confirm',
        loadingStyle: 'modal',
        confirmText: "ส่งตรวจ",
        cancelText: "ยกเลิก",
        allowOutsideClick: false,
        allowEscapeKey: false,
        allowEnterKey: false,
      });
      if (!confirm) return;

      // loading
      await showAlert({
        title: 'กำลังส่งตรวจ',
        icon: 'loading',
        type: 'loading',
        duration:1000,
        loadingStyle: 'modal',
        allowOutsideClick: false,
        allowEscapeKey: false,
        allowEnterKey: false,
      });

      setUIState(prev => ({ ...prev, disabledBtn: true }));
      await patchbio(uiState.screeningId); // call API ส่งตรวจ

      message.success("ส่งตรวจเรียบร้อยแล้ว");
      //await showAlert({ title: 'ส่งตรวจ', message: "ส่งตรวจเรียบร้อยแล้ว", type: 'alert', icon: 'success' });

      resetFormState(); // reset form หลังส่ง
    } catch (err) {
      await showAlert({ title: 'เกิดข้อผิดพลาด', message: err.message, type: 'alert', icon: 'error' });
    } finally {
      setUIState(prev => ({ ...prev, disabledBtn: false })); // enable ปุ่ม
    }
  };

  // ----------- handle button click -------------
  // action: edit, save, cancel, send
  const onClickBtnCallback = async (action) => {
    switch(action) {
      case "edit":
        if(uiState.mode === "waitingsend") {
          setUIState(prev => ({ ...prev, disabledForm: false, mode: "editing", btnState: 6 }));
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
              mode: "waitingsend",
              btnState: btnCondition(uiState.screeningStatus),
            }));
            setBioData(cloneDeep(bioDataBK));
          }
        } else if(uiState.mode === "waitingsend") {
          
          const confirm = await showAlert?.({
            title: "ยื่นยันการยกเลิกตรวจ Bio",
            message: "คุณต้องการยกเลิกตรวจ Bio ใช่ไหม ?",
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

         // กรณียกเลิกใน mode waitingsend -> reset form
        }
        break;
      case "send":
        await sendBio(); // call send API
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
    onSelectedSearchCallback,
    onChangeFormBioCallback,
    onClickBtnCallback,
    AlertComponent,
    resetFormState,
  };
}
