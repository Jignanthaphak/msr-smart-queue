// /hooks/useConsultFormStress.js
'use client';
import { useState, useEffect, useRef } from "react";
import { BaseSchemaStress, FullSchemaStress, replace, defaultValue } from "@/lib/validators/form/screening/consult/schema";

export const useConsultFormStress = ({ consultData, disabledForm = true, onChangeFormStress, containerSelector = null }) => {
  const isNotProcess = useRef(true);
  const sanitizeTimeouts = useRef({});

  const checkboxFieldsStress = [
    { name: "stress_narcotics", label: "ยาเสพติด" },
    { name: "stress_psychiatry", label: "จิตเวช" },
    { name: "stress_economy", label: "เศรษฐกิจ/หนี้สิน" },
    { name: "stress_family", label: "ครอบครัว" },
    { name: "stress_relationship", label: "ความสัมพันธ์" },
    { name: "stress_love", label: "ปัญหาความรัก" },
    { name: "stress_unplanned", label: "ตั้งครรภ์ไม่พร้อม" },
    { name: "stress_learning", label: "การเรียน" },
    { name: "stress_gambling", label: "การพนัน" },
    { name: "stress_games", label: "ติดเกมส์" },
    { name: "stress_sex", label: "เรื่องเพศ" },
    { name: "stress_work", label: "การทำงาน" },
    { name: "stress_colleague", label: "หัวหน้างาน/เพื่อนร่วมงาน" },
    { name: "stress_health", label: "สุขภาพ" },
    // { name: "stress_anxious", label: "วิตกกังวล" },
    { name: "stress_sleep", label: "การนอน" },
    { name: "stress_healthfamily", label: "สุขภาพ(คนในครอบครัว/คนรัก/สัตว์เลี้ยง)" },
    { name: "stress_loss", label: "สูญเสีย(คนในครอบครัว/คนรัก/สัตว์เลี้ยง)" },
  ];

  const [formData, setFormData] = useState({
    stress_no_check: defaultValue.stress_check,
    stress_narcotics: defaultValue.stress_check,
    stress_psychiatry: defaultValue.stress_check,
    stress_economy: defaultValue.stress_check,
    stress_family: defaultValue.stress_check,
    stress_relationship: defaultValue.stress_check,
    stress_love: defaultValue.stress_check,
    stress_unplanned: defaultValue.stress_check,
    stress_learning: defaultValue.stress_check,
    stress_gambling: defaultValue.stress_check,
    stress_games: defaultValue.stress_check,
    stress_sex: defaultValue.stress_check,
    stress_work: defaultValue.stress_check,
    stress_colleague: defaultValue.stress_check,
    stress_health: defaultValue.stress_check,
    // stress_anxious: defaultValue.stress_check,
    stress_sleep: defaultValue.stress_check,
    stress_healthfamily: defaultValue.stress_check,
    stress_loss: defaultValue.stress_check,
    stress_other: defaultValue.stress_check,
  });

  const [warnFields, setWarnFields] = useState({});

  const setWarnWithTimeout = (name, message) => {
    setWarnFields(prev => {
      if (prev[name] === message) return prev;
      return { ...prev, [name]: message };
    });

    if (sanitizeTimeouts.current[name]) clearTimeout(sanitizeTimeouts.current[name]);

    sanitizeTimeouts.current[name] = setTimeout(() => {
      setWarnFields(prev => ({ ...prev, [name]: null }));
      sanitizeTimeouts.current[name] = null;
    }, 1500);
  };

  // โหลดค่าเริ่มต้นจาก consultData
  useEffect(() => {

    isNotProcess.current = !consultData?.consult;
    if (isNotProcess.current) return;
   
    const stressData = consultData.consult;

    setFormData({
      stress_no_check: stressData?.stress_no_check ?? defaultValue.stress_check,
      stress_narcotics: stressData?.stress_narcotics ?? defaultValue.stress_check,
      stress_psychiatry: stressData?.stress_psychiatry ?? defaultValue.stress_check,
      stress_economy: stressData?.stress_economy ?? defaultValue.stress_check,
      stress_family: stressData?.stress_family ?? defaultValue.stress_check,
      stress_relationship: stressData?.stress_relationship ?? defaultValue.stress_check,
      stress_love: stressData?.stress_love ?? defaultValue.stress_check,
      stress_unplanned: stressData?.stress_unplanned ?? defaultValue.stress_check,
      stress_learning: stressData?.stress_learning ?? defaultValue.stress_check,
      stress_gambling: stressData?.stress_gambling ?? defaultValue.stress_check,
      stress_games: stressData?.stress_games ?? defaultValue.stress_check,
      stress_sex: stressData?.stress_sex ?? defaultValue.stress_check,
      stress_work: stressData?.stress_work ?? defaultValue.stress_check,
      stress_colleague: stressData?.stress_colleague ?? defaultValue.stress_check,
      stress_health: stressData?.stress_health ?? defaultValue.stress_check,
      // stress_anxious: stressData?.stress_anxious ?? defaultValue.stress_check,
      stress_sleep: stressData?.stress_sleep ?? defaultValue.stress_check,
      stress_healthfamily: stressData?.stress_healthfamily ?? defaultValue.stress_check,
      stress_loss: stressData?.stress_loss ?? defaultValue.stress_check,
      stress_other: stressData?.stress_other ?? defaultValue.stress_other,
    });
  }, [consultData]);

  useEffect(() => {
   
    if (formData.stress_no_check === 1) {
     
      const excludedFields = ["stress_no_check"];
      
      let newFormData = { ...formData };

      const clearedFields = Object.keys(formData).filter(
        key => !excludedFields.includes(key)
      );
   
      clearedFields.forEach(key => {
        newFormData[key] = defaultValue[key];
      });
      
      setFormData(newFormData);

      const clearedObj = clearedFields.reduce((acc, key) => {
        acc[key] = null;
        return acc;
      }, {});
      
      setWarnFields(prev => ({
        ...prev,
        ...clearedObj,
      }));

    }
      
  }, [formData.stress_no_check]);

  const handleChange = (e) => {
    if (disabledForm) return;

    const { name, value, checked, type } = e.target;
    let newValue = value;
    let validator = replace[name];

    if (type === "checkbox") {
      newValue = checked ? 1 : 0;
      validator = replace["stress_check"];
    }

    const oldValue = formData[name];
    const partialObj = { [name]: newValue };
    const parsed = BaseSchemaStress.pick({ [name]: true }).safeParse(partialObj);

    if (!parsed.success) {
      const isFormatError = parsed?.error?.errors[0]?.message;
      if (isFormatError && validator) {
        newValue = value.replace(validator, "");
        setWarnWithTimeout(name, isFormatError);
      }
    } else {
      setWarnWithTimeout(name, null);
    }

    if (newValue !== oldValue) {
      setFormData(prev => ({ ...prev, [name]: newValue }));
    }

    isNotProcess.current = false;
  };

  const handleBlur = (e) => {
    if (disabledForm || isNotProcess.current) return;
    const { name } = e.target;
    setWarnFields(prev => ({ ...prev, [name]: null }));
  };

  useEffect(() => {
    if (isNotProcess.current) return;
    const isComplete = validateForm(false);
    onChangeFormStress({ formData, isComplete });
  }, [formData]);

  const validateForm = (focus = false) => {
    const result = FullSchemaStress.safeParse(formData);

    if (!result.success) {
      if (focus) {
        const errorIssue = result?.error?.errors[0];
        const fieldName = errorIssue?.path?.[0];
        setWarnWithTimeout(fieldName, errorIssue?.message);
     
        let el = null;
        if (containerSelector) {
        const container = document.querySelector(containerSelector);
        el = container?.querySelector(`[name="${fieldName}"]`);
        } else {
        el = document.querySelector(`[name="${fieldName}"]`);
        }
        if (el) {
        try {
            el.focus();
            el.scrollIntoView({ behavior: "smooth", block: "center" });
        } catch (err) {}
        }
      }
      return false;
    }

    return true;
  };

  // cleanup timeout
  useEffect(() => {
    return () => {
      Object.values(sanitizeTimeouts.current).forEach((t) => {
        if (t) clearTimeout(t);
      });
    };
  }, []);

  return {
    formData,
    consultData,
    warnFields,
    handleChange,
    handleBlur,
    validateForm,
    checkboxFieldsStress,
  };
};
