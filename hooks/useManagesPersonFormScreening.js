// /hooks/useManagesPersonFormScreening.js
'use client';

// ---------- import ----------
import { useState, useRef } from "react"; // useState สำหรับ state, useRef สำหรับ reference ไปฟอร์มลูก
import cloneDeep from "lodash/cloneDeep"; // cloneDeep ใช้ทำ deep copy object
import { createhn, saveperson, updateperson } from "@/services/screening/person"; // API call สำหรับ person
import { startscreening } from "@/services/screening/start"; // API call สำหรับส่งตรวจ
import { date } from "@/lib/utils/dateFormat"; // ฟังก์ชันแปลงวันที่
import { usePersonData } from "@/hooks/usePersonData"; // low-level hook จัดการฟอร์ม
import { useAlert } from '@/lib/utils/useAlert';
import useHistoryScreeningHook from "@/stores/useHistoryScreeningHook";
import useDefaultDataStore from "@/stores/useDefaultDataStore";
import { Modal, Input, Button, Spin, Form, Switch, message, Select, Typography } from "antd";

/**
 * useManagesPersonFormScreening
 * Hook จัดการฟอร์มข้อมูลผู้ป่วย (high-level)
 * - ใช้ usePersonData เป็น low-level hook
 * - handle CRUD, UI state, ปุ่ม
 */
export function useManagesPersonFormScreening() {

  const { showAlert, AlertComponent } = useAlert();

  const { setHnHistory, getHistoryScreening, clearHistoryScreening } = useHistoryScreeningHook();

  // 👉 ดึง store เพื่อเอาข้อมูล master data มาเทียบ ID
  const defaultData = useDefaultDataStore((state) => state.defaultData);

  // ----------- low-level hook for form -------------
  const { 
    formData,              // ข้อมูลฟอร์มทั้งหมด
    formComplete,          // boolean ฟอร์มกรอกครบหรือไม่
    refFormPerson,         // ref ไปยัง child form สำหรับ validate
    onChangeFormPersonCallback, // callback ให้ child update state
    validateAndScrollToError      // validate + scroll ไปยัง error field
  } = usePersonData();

  // ----------- State UI -------------
  const initialUIState = {
    resetKey: 0,           // ใช้ trigger ให้ component ลูก reset ค่า
    hn: null,              // เลข HN ของผู้ป่วย
    screeningId: null,     // ไอดีการคัดกรอง
    screeningStatus: null, // สถานะการคัดกรอง
    screeningStatusName: null, // ชื่อสถานะการคัดกรอง
    screeningDate: null,   // วันที่คัดกรอง
    showFormPerson: false, // แสดงฟอร์มหรือไม่
    disabledForm: true,    // ฟอร์มแก้ไขได้หรือไม่
    disabledBtn: false,    // ปุ่มใช้งานได้หรือไม่
    mode: "idle",          // idle, creating, editing, waitingsend
    btnState: 1,           // state ปุ่ม (ควบคุม UI ของ BtnForm)
  };
  const [uiState, setUIState] = useState(initialUIState);

  // ----------- State person data -------------
  const [personData, setPersonData] = useState(null); // ข้อมูลผู้ป่วยปัจจุบัน
  const [personDataBK, setPersonDataBK] = useState(null); // backup ข้อมูลก่อนแก้ไข

  // ----------- Helper ปุ่ม -------------
  const btnCondition = (status) => (!status ? 3 : 8); 
  // ถ้า status ไม่มี -> 3, มี -> 8 (ใช้ควบคุม btnState)

  // ----------- Reset form state -------------
  const resetFormState = () => {
    // คืนค่า UI state ไปค่าเริ่มต้น + เพิ่ม resetKey ให้ trigger re-render ลูก
    setUIState(prev => ({ ...initialUIState, resetKey: prev.resetKey + 1 }));
    setPersonData(null);
    setPersonDataBK(null);
    window.scrollTo({ top: 0, behavior: "smooth" }); // scroll ไป top
    clearHistoryScreening?.(); // ล้าง history การคัดกรอง
  };

  // ----------- Callback: เลือกจาก search -------------
  const onSelectedSearchCallback = (data) => {
    if (!data) return; // ถ้าไม่มีข้อมูล return
    
    const clone = cloneDeep(data); // clone เพื่อป้องกัน mutation

    // ดึงค่า HN, screening info
    const hn = clone?.hn;
    const screeningId = clone?.screenings?.screening_id;
    const screeningStatus = clone?.screenings?.status_id;
    const screeningStatusName = clone?.screenings?.screening_status?.status_name;
    const screeningDate = clone?.screenings?.date ? date(clone?.screenings?.date) : null;

    setHnHistory?.(hn); // set HN history
    getHistoryScreening?.(); // fetch history

    // เก็บข้อมูลคนที่เลือก
    setPersonData(clone);
    setPersonDataBK(clone); // backup ข้อมูล

    // อัพเดท UI state
    setUIState(prev => ({
      ...prev,
      hn,
      screeningId,
      screeningStatus,
      screeningStatusName,
      screeningDate,
      showFormPerson: true,
      disabledForm: true,
      disabledBtn: false,
      mode: "waitingsend",
      btnState: btnCondition(screeningStatus),
    }));
  };

  // ----------- CRUD & send -------------
  
  // สร้าง HN ใหม่ (reserve) ก่อนกรอกข้อมูล
  const addReserveHN = async () => {
    try {
      const confirm = await showAlert?.({
        title: "ยื่นยันการเพิ่มข้อมูลใหม่",
        message: "คุณต้องการเพิ่มข้อมูลใหม่ใช่ไหม ?",
        icon: "warning",
        type: "confirm",
        duration: 500,
        loadingStyle: "modal",
        confirmText: "ยืนยัน",
        cancelText: "ยกเลิก",
      });
      if (!confirm) return; // ถ้า user กดยกเลิก return

      resetFormState(); // reset state ฟอร์มทั้งหมด
      setUIState(prev => ({ ...prev, disabledBtn: true })); // ปุ่มกำลังทำงาน

      await showAlert?.({ title: "กำลังเตรียมข้อมูลเพื่อสร้างใหม่", icon: "loading", type: "loading", duration: 500, loadingStyle: "modal" });

      const result = await createhn(); // call API สร้าง HN
      if (result.ok && result?.data?.hn && result?.data?.hn_index) {
        setUIState(prev => ({
          ...prev,
          hn: result.data.hn,
          disabledForm: false, // เปิดให้กรอกข้อมูล
          mode: "creating", // mode creating
          btnState: 2, // ปุ่มปรับ state
        }));
        setPersonData({ hn: result.data.hn, hn_index: result.data.hn_index }); // เก็บ HN ใหม่
      }
    } catch (err) {
      await showAlert?.({ title: "เกิดข้อผิดพลาด", message: err.message, type: "alert", icon: "error" });
    } finally {
      setUIState(prev => ({ ...prev, disabledBtn: false })); // เปิดปุ่ม
    }
  };

  // เพิ่มข้อมูลผู้ป่วยใหม่
  const addPerson = async () => {
    try {
      const isCheck = await validateAndScrollToError(); // validate ฟอร์ม
      if (!isCheck) return;

      const confirm = await showAlert?.({
        title: "ยืนยันการเพิ่มข้อมูลผู้รับบริการ",
        message: "ตรวจสอบข้อมูลให้ถูกต้องก่อนเพิ่มข้อมูล",
        icon: "warning",
        type: "confirm",
        duration: 500,
        loadingStyle: "modal",
        confirmText: "เพิ่มข้อมูล",
        cancelText: "ยกเลิก",
      });
      if (!confirm) return;

      setUIState(prev => ({ ...prev, disabledBtn: true }));
      const result = await saveperson(formData); // call API save person

      message.success("เพิ่มข้อมูลสำเร็จ");
      //await showAlert?.({ title: "เพิ่มข้อมูลผู้รับบริการ", message: "เพิ่มข้อมูลสำเร็จ", type: "alert", icon: "success" });
      onSelectedSearchCallback(result.data); // refresh data หลัง save
    } catch (err) {
      await showAlert?.({ title: "เกิดข้อผิดพลาด", message: err.message, type: "alert", icon: "error" });
    } finally {
      setUIState(prev => ({ ...prev, disabledBtn: false }));
    }
  };

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

      setUIState(prev => ({ ...prev, disabledBtn: true }));
      const result = await updateperson(uiState.hn, formData); // call API update

      message.success("แก้ไขข้อมูลสำเร็จ");
     // await showAlert?.({ title: "แก้ไขข้อมูลผู้รับบริการ", message: "แก้ไขข้อมูลสำเร็จ", type: "alert", icon: "success" });
      onSelectedSearchCallback(result.data); // refresh data
    } catch (err) {
      await showAlert?.({ title: "เกิดข้อผิดพลาด", message: err.message || "ไม่สามารถค้นหาได้", type: "alert", icon: "error" });
    } finally {
      setUIState(prev => ({ ...prev, disabledBtn: false }));
    }
  };

  // ส่งตรวจ
  const sendScreening = async () => {
    try {
      const isCheck = await validateAndScrollToError(); // validate ฟอร์ม
      if (!isCheck) {
        setUIState(prev => ({ ...prev, disabledForm: false, mode: "editing", btnState: 2 }));
        await showAlert?.({ title: "กรุณาตรวจสอบ!", message: "ยังกรอกข้อมูลยังไม่ครบ", type: "alert", icon: "warning" });
        return;
      }

      const confirm = await showAlert?.({
        title: "ยืนยันการส่งตรวจ",
        message: "ตรวจสอบข้อมูลก่อนส่งตรวจ",
        icon: "info",
        type: "confirm",
        loadingStyle: "modal",
        confirmText: "ส่งตรวจ",
        cancelText: "ยกเลิก",
      });
      if (!confirm) return;

      setUIState(prev => ({ ...prev, disabledBtn: true }));
      await showAlert?.({ title: "กำลังส่งตรวจ", icon: "loading", type: "loading", duration: 1000, loadingStyle: "modal" });
      await startscreening(uiState.hn); // call API ส่งตรวจ

      message.success("ส่งตรวจเรียบร้อยแล้ว");
      //await showAlert?.({ title: "ส่งตรวจ", message: "ส่งตรวจเรียบร้อยแล้ว", type: "alert", icon: "success" });
      resetFormState(); // reset form หลังส่ง
    } catch (err) {
      await showAlert?.({ title: "เกิดข้อผิดพลาด", message: err.message || "ไม่สามารถส่งข้อมูลได้", type: "alert", icon: "error" });
    } finally {
      setUIState(prev => ({ ...prev, disabledBtn: false }));
    }
  };

  // ----------- ปุ่มหลัก -------------
  const onClickBtnCallback = async (action) => {
    switch (action) {
      case "new": // กดปุ่มเพิ่ม
        addReserveHN();
        break;
      case "edit": // กดแก้ไข
        if (uiState.mode === "waitingsend") {
          setUIState(prev => ({ ...prev, disabledForm: false, mode: "editing", btnState: 2 }));
        }
        break;
      case "save": // กด save
        if (uiState.mode === "creating") addPerson();
        else if (uiState.mode === "editing") editPerson();
        break;
      case "cancel": // กดยกเลิก
        if (["creating", "idle", "waitingsend"].includes(uiState.mode)) {
          const confirm = await showAlert?.({
            title: "ยื่นยันการยกเลิกการทำรายการ",
            message: "คุณต้องการยกเลิกการทำรายการใช่ไหม ?",
            icon: "warning",
            type: "confirm",
            duration: 500,
            loadingStyle: "modal",
            confirmText: "ยืนยัน",
            cancelText: "ยกเลิก",
          });
          if (confirm) resetFormState();
        } else if (uiState.mode === "editing") {
          setUIState(prev => ({
            ...prev,
            disabledForm: true,
            mode: "waitingsend",
            btnState: btnCondition(uiState.screeningStatus),
          }));
          setPersonData(cloneDeep(personDataBK)); // คืนข้อมูลก่อนแก้ไข
        }
        break;
      case "send": // กดส่งตรวจ
        sendScreening();
        break;
    }
  };

  // ----------- รับข้อมูลจากเครื่องอ่านบัตร -------------
 const onReadCardSuccess = (cardData) => {
    
    // 1. จัดการแยกชื่อ จังหวัด อำเภอ ตำบล ให้กลายเป็น ID
    let province_id = null, district_id = null, subdistrict_id = null, zip_code = null;
    const addr = cardData.addressObj; // รับ Object ที่ส่งมาจาก Python

    if (addr && defaultData?.provinces) {
      // แมปจังหวัด
      const p = defaultData.provinces.find(x => x.name_in_thai.includes(addr.province));
      if (p) {
        province_id = p.id;
        // แมปอำเภอ
        const d = defaultData.districts.find(x => x.province_id === p.id && x.name_in_thai.includes(addr.district));
        if (d) {
          district_id = d.id;
          // แมปตำบล
          const s = defaultData.subdistricts.find(x => x.district_id === d.id && x.name_in_thai.includes(addr.subdistrict));
          if (s) {
            subdistrict_id = s.id;
            zip_code = s.zip_code;
          }
        }
      }
    }

    // 👉 2. แมปคำนำหน้าชื่อ (Prefix) ไทย และ อังกฤษ ให้เป็น ID
    let prefix_id = null;
    let prefix_en_id = null;

    // หา ID คำนำหน้าไทย (เทียบจากฟิลด์ title)
    if (cardData.prefixTH && defaultData?.name_prefixes_th) {
      const matchTH = defaultData.name_prefixes_th.find(
        x => x.title === cardData.prefixTH
      );
      if (matchTH) prefix_id = matchTH.prefix_id; // ดึงค่าจาก prefix_id
    }

    // หา ID คำนำหน้าอังกฤษ (เทียบจากฟิลด์ title)
    
    if (cardData.prefixEN && defaultData?.name_prefixes_en) {
      const matchEN = defaultData.name_prefixes_en.find(
        x => x.title == cardData.prefixEN
      
      );

      if (matchEN) prefix_en_id = matchEN.prefix_id; // ดึงค่าจาก prefix_id
    }

    // 2. เอาข้อมูลใหม่ไปทับ personData เดิม
    setPersonData((prev) => {
      // ดึง array ที่อยู่เดิมออกมา (ถ้าไม่มีสร้างเป็น array ว่าง)
      let newAddresses = prev?.persons_address ? cloneDeep(prev.persons_address) : [];
      
      // หาตำแหน่งของที่อยู่ "ตามทะเบียนบ้าน/ตามบัตร" (มักจะใช้ address_type_id = 1)
      const cardAddrIndex = newAddresses.findIndex(a => a.address_type_id === 1);
      
      const newCardAddress = {
          type: 1, 
          houseno: addr?.houseno || "",
          villagenno: addr?.moo || "",
          road: addr?.road || addr?.soi || addr?.trok || "", // รวมซอย/ถนน ไว้ช่องเดียวกัน
          province_id: province_id,
          district_id: district_id,
          subdistrict_id: subdistrict_id,
          zip_code: zip_code
      };

      if (cardAddrIndex >= 0) {
          // ถ้ามีอยู่แล้วให้อัปเดต
          newAddresses[cardAddrIndex] = { ...newAddresses[cardAddrIndex], ...newCardAddress };
      } else {
          // ถ้าเป็นเคสใหม่ ให้ push เข้าไปเลย
          newAddresses.push(newCardAddress);
      }

      return {
        ...prev,
        prefix_id: prefix_id || prev?.prefix_id,
        prefix_id_en: prefix_en_id || prev?.prefix_id_en,
        idcard: cardData.citizenId || prev?.idcard,
        firstname: cardData.firstNameTH || prev?.firstname,
        lastname: cardData.lastNameTH || prev?.lastname,
        firstname_en: cardData.firstNameEN || prev?.firstname_en,
        lastname_en: cardData.lastNameEN || prev?.lastname_en,
        birthday: cardData.birthday || prev?.birthday, 
        sex_id: Number(cardData.gender) || prev?.sex_id,
        persons_addresses: newAddresses
      };
    });

    message.success("ดึงข้อมูลและที่อยู่จากบัตรประชาชนสำเร็จ");
  };

  // ----------- return state & callbacks -------------
  return {
    formData,                      // ข้อมูลฟอร์ม
    formComplete,                  // boolean ฟอร์มครบไหม
    personData,                    // ข้อมูลคนปัจจุบัน
    uiState,                        // state UI
    refFormPerson,                  // ref ไป form child
    onSelectedSearchCallback,       // callback เลือก search
    onChangeFormPersonCallback,     // callback update form data
    onClickBtnCallback,             // callback ปุ่มหลัก
    addReserveHN,
    AlertComponent,
    onReadCardSuccess
  };
}
