// /hooks/useConsultFormConsulting.js
'use client';
import { useState, useEffect, useRef } from "react";
import { BaseSchemaConsult, replace, defaultValue } from "@/lib/validators/form/screening/consult/schema";

export const useConsultFormConsulting = ({ consultData, disabledForm = true, onChangeFormConsulting, containerSelector = null }) => {
  const isNotProcess = useRef(true);
  const sanitizeTimeouts = useRef({});

  const [formData, setFormData] = useState({
    consulting: defaultValue.consulting,
  });
  const [warnFields, setWarnFields] = useState({});

  const setWarnWithTimeout = (name, message) => {
    setWarnFields((prev) => {
      if (prev[name] === message) return prev;
      return { ...prev, [name]: message };
    });

    if (sanitizeTimeouts.current[name]) clearTimeout(sanitizeTimeouts.current[name]);

    sanitizeTimeouts.current[name] = setTimeout(() => {
      setWarnFields((prev) => ({ ...prev, [name]: null }));
      sanitizeTimeouts.current[name] = null;
    }, 1500);
  };

  // โหลดค่าเริ่มต้นจาก consultData
  useEffect(() => {
    
    isNotProcess.current = !consultData?.consult;
    if (isNotProcess.current) return;

    const consultingData = consultData.consult;

    setFormData((prev) => ({
      ...prev,
      consulting: consultingData?.consulting ?? defaultValue.consulting,
    }));
  }, [consultData]);

  const handleChange = (e) => {
    if (disabledForm) return;

    const { name, value } = e.target;
    let newValue = value;
    const oldValue = formData[name];
    const validator = replace[name];
    const partialObj = { [name]: newValue };
    const parsed = BaseSchemaConsult.safeParse(partialObj);

    if (!parsed.success) {
      const isFormatError = parsed?.error?.errors[0]?.message;
      if (validator) {
        newValue = value.replace(validator, "");
        setWarnWithTimeout(name, isFormatError);
      }
    } else {
      setWarnWithTimeout(name, null);
    }

    if (newValue !== oldValue) {
      setFormData((prev) => ({ ...prev, [name]: newValue }));
    }

    isNotProcess.current = false;
  };

  const handleBlur = (e) => {
    if (disabledForm || isNotProcess.current) return;
    const { name } = e.target;
    setWarnFields((prev) => ({ ...prev, [name]: null }));
  };

  useEffect(() => {
    if (isNotProcess.current) return;
    const isComplete = validateForm(false);
    onChangeFormConsulting({ formData, isComplete });
  }, [formData]);

  const validateForm = (focus = false) => {
    const parsed = BaseSchemaConsult.safeParse(formData);

    if (!parsed.success) {
      if (focus) {
        const errorIssue = parsed?.error?.errors[0];
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
  };
};
