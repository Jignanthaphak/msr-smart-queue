// /hooks/useConsultFormRisk.js
import { useState, useRef, useEffect } from "react";
import { BaseSchemaRisk, FullSchemaRisk, replace, defaultValue } from "@/lib/validators/form/screening/consult/schema";
import { color } from "framer-motion";

export function useConsultFormRisk({ consultData, disabledForm = true, onChangeFormRisk, containerSelector = null }) {
  const isNotProcess = useRef(true);
  const sanitizeTimeouts = useRef({});
  
  const [formData, setFormData] = useState({
    risk_not_found: defaultValue.risk_not_found,
    risk_rq: defaultValue.risk_rq,
    risk_burn_out: defaultValue.risk_burn_out,
    risk_st5: defaultValue.risk_st5,
    risk_depressed_2qplus: defaultValue.risk_depressed_2qplus,
    risk_depressed_9q: defaultValue.risk_depressed_9q,
    risk_suicide: defaultValue.risk_suicide,
  });

  const [warnFields, setWarnFields] = useState({});
  const [gradeFields, setGradeFields] = useState({});

  const setWarnWithTimeout = (name, message) => {
    setWarnFields(prev => prev[name] === message ? prev : { ...prev, [name]: message });
    if (sanitizeTimeouts.current[name]) clearTimeout(sanitizeTimeouts.current[name]);
    sanitizeTimeouts.current[name] = setTimeout(() => {
      setWarnFields(prev => ({ ...prev, [name]: null }));
      sanitizeTimeouts.current[name] = null;
    }, 1500);
  };

  // โหลดข้อมูล consultData
  useEffect(() => {

    isNotProcess.current = !consultData?.consult;
    if (isNotProcess.current) return;

    const riskData = consultData.consult;

    const schemaShape = BaseSchemaRisk.omit({ 
      risk_not_found: true, risk_suicide: true, risk_depressed_2qplus: true, risk_depressed_9q: true 
    }).shape;

    const newFormData = {
      risk_not_found: riskData?.risk_not_found ?? defaultValue.risk_not_found,
      risk_depressed_2qplus: riskData?.risk_depressed_2qplus ?? defaultValue.risk_depressed_2qplus,
      risk_depressed_9q: riskData?.risk_depressed_9q ?? defaultValue.risk_depressed_9q,
      risk_suicide: riskData?.risk_suicide ?? defaultValue.risk_suicide,
    };

    const newGradeFields = {};

    for (const key of Object.keys(schemaShape)) {
      const value = riskData?.[key] ?? defaultValue[key];
      if (value !== undefined && value !== "") {
        const parsed = BaseSchemaRisk.pick({ [key]: true }).safeParse({ [key]: value });
        newGradeFields[key] = {
          status: parsed?.success || false,
          msg: parsed.success ? parsed.data[key]?.grade?.label ?? null : parsed?.error?.issues[0]?.message,
          color: parsed.success ? parsed.data[key]?.grade?.color ?? null : null
        };
        newFormData[key] = parsed.success ? parsed.data[key]?.value ?? value : value;
      } else {
        newFormData[key] = value ?? "";
        newGradeFields[key] = { status: false, msg: null, color: null };
      }
    }

    setFormData(newFormData);
    setGradeFields(newGradeFields);

  }, [consultData]);

  useEffect(() => {
          
    let newFormData = { ...formData };

    if (formData.risk_not_found === 1) {

        const clearedFields = [
            "risk_rq", "risk_burn_out", "risk_st5", "risk_depressed_2qplus", "risk_depressed_9q", "risk_suicide"
        ];
          
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
        
        setGradeFields(prev => ({
            ...prev,
            ...clearedObj,
        }));

    }
      
  }, [formData.risk_not_found]);

  const handleChange = (e) => {

    if(disabledForm) return

    const { name, value, checked, type } = e.target;
  
    let newValue = value;
    const oldValue = formData[name];

    if (type === "checkbox" && name === "risk_not_found") {
        newValue = checked ? 1 : 0;
    } else if (type === "checkbox"  && name !== "risk_not_found") {
        newValue = Number(newValue);
        if(newValue === 1 && oldValue === 1){
            newValue = defaultValue[name];
        }else if(newValue === 2 && oldValue === 2){
            newValue = defaultValue[name];
        }
    }
    
    const validator = replace[name];
    const partialObj = { [name]: newValue };
    const parsed = BaseSchemaRisk.pick({ [name]: true }).safeParse(partialObj);

    if (!parsed.success) {

      const isFormatError = parsed?.error?.errors[0]?.message;
  
      if (isFormatError && validator) {

          newValue = value.replace(validator, '');

          setWarnWithTimeout(name, isFormatError)

          if(newValue !== ""){
              setGradeFields((prev) => ({
                  ...prev,
                  [name]: {
                      status: parsed.success,
                      msg: isFormatError
                  }
              }));
          }
          
      }

  }else{
      
      setWarnWithTimeout(name, null)

      setGradeFields((prev) => ({
          ...prev,
          [name]: {
              status: parsed.success,
              msg: parsed?.data[name]?.grade?.label,
              color: parsed?.data[name]?.grade?.color
          }
      }));
        
    }
    
    if(newValue !== oldValue){
        setFormData((prev) => ({
            ...prev,
            [name]: newValue,
        }));
    }

    isNotProcess.current = false
          
  };

  const handleBlur = (e) => {
    if (disabledForm || isNotProcess.current) return;
    const { name } = e.target;
    setWarnFields(prev => ({ ...prev, [name]: null }));
  };

  const validateForm = (focus = false) => {
    const result = FullSchemaRisk.safeParse(formData);
    if (!result.success) {
      if (focus) {
        const fieldName = result.error.errors[0].path[0];
        setWarnWithTimeout(fieldName, result.error.errors[0].message);

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

  // ส่งกลับ formData ให้แม่
  useEffect(() => {
    if (isNotProcess.current) return;
    const isComplete = validateForm(false);
    
    onChangeFormRisk?.({ formData, isComplete });
  }, [formData]);

  // clear timeouts on unmount
  useEffect(() => () => {
    Object.values(sanitizeTimeouts.current).forEach(t => t && clearTimeout(t));
  }, []);

  return {
    formData,
    consultData,
    warnFields,
    gradeFields,
    handleChange,
    handleBlur,
    validateForm
  };
}
