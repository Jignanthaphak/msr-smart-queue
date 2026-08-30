// /hooks/useManagesPersonFormDetail.js
'use client';

// ---------- import ----------
import { useState, useEffect } from "react"; // useState สำหรับ state, useRef สำหรับ reference ไปฟอร์มลูก
import cloneDeep from "lodash/cloneDeep"; // cloneDeep ใช้ทำ deep copy object
import { editPersonAction } from "@/actions/admin/person/actions"; // Action Server สำหรับ person
import { date } from "@/lib/utils/dateFormat"; // ฟังก์ชันแปลงวันที่
import { usePersonData } from "@/hooks/usePersonData"; // low-level hook จัดการฟอร์ม
import { useAlert } from '@/lib/utils/useAlert';

/**
 * useManagesPersonFormDetail
 * Hook จัดการฟอร์มข้อมูลผู้ป่วย (high-level)
 * - ใช้ usePersonData เป็น low-level hook
 * - handle CRUD, UI state, ปุ่ม
 */
export function useManagesPersonFormDetail(data, onEdit) {

  const { showAlert, AlertComponent } = useAlert();

  // ----------- low-level hook for form -------------
  const { 
    formData,              // ข้อมูลฟอร์มทั้งหมด
    formComplete,          // boolean ฟอร์มกรอกครบหรือไม่
    refFormPerson,
    onChangeFormPersonCallback, // callback ให้ child update state
    validateAndScrollToError      // validate + scroll ไปยัง error field
  } = usePersonData();

  // ----------- State UI -------------
  const initialUIState = {
    resetKey: 0,           // ใช้ trigger ให้ component ลูก reset ค่า
    hn: null,              // เลข HN ของผู้ป่วย
    screeningId: null,              // เลข screening_id ของผู้ป่วย
    disabledForm: true,    // ฟอร์มแก้ไขได้หรือไม่
    disabledBtn: false,    // ปุ่มใช้งานได้หรือไม่
    isEdit: false,         // โหมดแก้ไขหรือไม่
    mode: "waitingsend",          // idle, creating, editing, waitingsend
    btnState: 9,           // state ปุ่ม (ควบคุม UI ของ BtnForm)
  };
  const [uiState, setUIState] = useState(initialUIState);

  // ----------- State person data -------------
  const [personData, setPersonData] = useState(null); // ข้อมูลผู้ป่วยปัจจุบัน
  const [personDataBK, setPersonDataBK] = useState(null); // backup ข้อมูลก่อนแก้ไข

  // ----------- Reset form state -------------
  const resetFormState = () => {
    // คืนค่า UI state ไปค่าเริ่มต้น + เพิ่ม resetKey ให้ trigger re-render ลูก
    setUIState(prev => ({ ...initialUIState, resetKey: prev.resetKey + 1 }));
    setPersonData(null);
    setPersonDataBK(null);
    window.scrollTo({ top: 0, behavior: "smooth" }); // scroll ไป top
  };

  useEffect(() => {

    if (!data) return;
  
    const clone = cloneDeep(data); 

    const hn = clone?.hn || null;
    const screeningId = clone?.screenings?.screening_id || null;
   
    setPersonData(clone || null);
    setPersonDataBK(clone || null);
     
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

  // แก้ไขข้อมูลผู้ป่วย
  const editPerson = async () => {
    try {
      const isCheck = await validateAndScrollToError();
      if (!isCheck) return;

      const confirm = await showAlert?.({
        title: "ยืนยันการแก้ไขข้อมูลผู้รับบริการ",
        message: "คุณแน่ใจที่จะแก้ไขข้อมูลนี้หรือไม่",
        icon: "warning",
        type: "confirm",
        duration: 500,
        loadingStyle: "modal",
        confirmText: "แก้ไข",
        cancelText: "ยกเลิก",
      });
      if (!confirm) return;

      setUIState(prev => ({ ...prev, disabledForm: true, disabledBtn: true }));

      const payload = {
        hn: uiState.hn,
        screening_id: uiState.screeningId,
        info: formData.info,
        address: formData.address,
        currentAddress: formData.currentAddress,
      };
      
      const result = await editPersonAction(payload);
     
      if(!result?.ok) {
        throw new Error(result?.error || "แก้ไขข้อมูลไม่สำเร็จ");
      }
    
      setPersonDataBK(result?.data || null);
     
      setUIState(prev => ({
        ...prev,
        isEdit: false,
        disabledBtn: false,
        disabledForm: true,
        mode: "waitingsend",
        btnState: 9,
      }));

      await showAlert?.({ title: "แก้ไขข้อมูล", message: "แก้ไขข้อมูลสำเร็จ", type: "alert", icon: "success" });

      onEdit?.()
     
    } catch (err) {
      await showAlert?.({ title: "เกิดข้อผิดพลาด", message: err.message || "ไม่สามารถค้นหาได้", type: "alert", icon: "error" });
    } finally {

       setUIState(prev => ({
        ...prev,
        disabledBtn: false,
      }));
     
    }
  };

  // ----------- ปุ่มหลัก -------------
  const onClickBtnCallback = async (action) => {
   
    switch (action) {
      
      case "edit": // กดแก้ไข
        if (uiState.mode === "waitingsend") {
          setUIState(prev => ({ ...prev, disabledForm: false, isEdit: true, mode: "editing", btnState: 2 }));
        }
        break;
      case "save": // กด save
        if (uiState.mode === "editing") editPerson();
        break;
      case "cancel": // กดยกเลิก
        if (uiState.mode === "editing") {
          
          setUIState(prev => ({
            ...prev,
            disabledForm: true,
            isEdit: false,
            mode: "waitingsend",
            btnState: 9,
          }));
          setPersonData(cloneDeep(personDataBK)); // คืนข้อมูลก่อนแก้ไข
         
        }
        break;
    }
  };

  // ----------- return state & callbacks -------------
  return {
    formData,                      // ข้อมูลฟอร์ม
    formComplete,                  // boolean ฟอร์มครบไหม
    refFormPerson,
    personData,                    // ข้อมูลคนปัจจุบัน
    uiState,                        // state UI
  
    onChangeFormPersonCallback,     // callback update form data
    onClickBtnCallback,             // callback ปุ่มหลัก
    AlertComponent
  };
}
