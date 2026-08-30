// /hooks/useConsultFormFollow.js
import { useState, useEffect, useRef } from "react";
import dayjs from "dayjs";
import { BaseSchemaFollow, FullSchemaFollow, replace, defaultValue } from "@/lib/validators/form/screening/consult/schema";

export function useConsultFormFollow({ consultData, disabledForm = true, onChangeFormFollow, containerSelector = null }) {
    const isNotProcess = useRef(true);
    const sanitizeTimeouts = useRef({});

    const [formData, setFormData] = useState({
        follow_id: defaultValue.follow_id,
        follow_agree: defaultValue.follow_agree,
        follow_date: defaultValue.follow_date,
        follow_detail: defaultValue.follow_detail,
        follow_tel: defaultValue.follow_tel,
        forward_problem: defaultValue.forward_problem,
        forward_hospital: defaultValue.forward_hospital,
        forward_how_to_follow: defaultValue.forward_how_to_follow,
    });

    const [warnFields, setWarnFields] = useState({});

    const setWarnWithTimeout = (name, message) => {
        setWarnFields(prev => prev[name] === message ? prev : { ...prev, [name]: message });
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
      
        const followData = consultData?.consult;

        setFormData({
            follow_id: followData?.follow_id ?? defaultValue.follow_id,
            follow_agree: followData?.follow_agree ?? defaultValue.follow_agree,
            follow_date: followData?.follow_date ? dayjs(followData.follow_date).format("YYYY-MM-DDTHH:mm") : defaultValue.follow_date,
            follow_detail: followData?.follow_detail ?? defaultValue.follow_detail,
            follow_tel: followData?.follow_tel ?? defaultValue.follow_tel,
            forward_problem: followData?.forward_problem ?? defaultValue.forward_problem,
            forward_hospital: followData?.forward_hospital ?? defaultValue.forward_hospital,
            forward_how_to_follow: followData?.forward_how_to_follow ?? defaultValue.forward_how_to_follow,
        });
    }, [consultData]);

    const handleChange = (e) => {
        if (disabledForm) return;

        const { name, value, checked, type } = e.target;
        let newValue = value;
        const oldValue = formData[name];

        if (type === "checkbox" ) {

            if(name === "follow_id"){
                newValue = type === "checkbox" ? Number(value) : value;
            }else{
                newValue = checked ? 1 : 0;
            }
            
        }

        if (type === "checkbox" && Number(newValue) === oldValue) {
            newValue = null; 
        }
        const validator = replace[name];
        const parsed = BaseSchemaFollow.pick({ [name]: true }).safeParse({ [name]: newValue });

        if (!parsed.success) {
            const isFormatError = parsed?.error?.errors[0]?.message;
            if (isFormatError && validator && type !== "checkbox") {
                newValue = value.replace(validator, '');
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

    // ล้างฟิลด์ตาม follow_id
    useEffect(() => {
        let newFormData = { ...formData };
        let clearedWarn = { ...warnFields };
        let needUpdate = false;

         // helper function ล้างฟิลด์
        const clearFields = (fields) => {
            fields.forEach(field => {
            if (newFormData[field]) {
                newFormData[field] = "";
                clearedWarn[field] = null;
                needUpdate = true;
            }
            });
        };

        if (formData.follow_id === 4) {
            clearFields(["follow_date", "follow_detail", "follow_tel"]);
        }

         else if (formData.follow_id === 3) {
         
            clearFields(["forward_problem", "forward_hospital", "forward_how_to_follow", "follow_agree"]);
        } 

        else {
          
            clearFields([
            "forward_problem",
            "forward_hospital",
            "forward_how_to_follow",
            "follow_date",
            "follow_detail",
            "follow_tel",
            "follow_agree",
            ]);
        }

        if (needUpdate) {
            setFormData(newFormData);
            setWarnFields(clearedWarn);
        }
    }, [formData.follow_id]);

    const validateForm = (focus = false) => {
        const result = FullSchemaFollow.safeParse(formData);

        if (!result.success) {
            if (focus) {
                const errorIssue = result.error.errors[0];
                const fieldName = errorIssue.path[0];
                setWarnWithTimeout(fieldName, errorIssue.message);

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

    useEffect(() => {
        if (isNotProcess.current) return;
        const isComplete = validateForm(false);
        onChangeFormFollow?.({ formData, isComplete });
    }, [formData]);

    useEffect(() => {
        return () => {
            Object.values(sanitizeTimeouts.current).forEach(t => t && clearTimeout(t));
        };
    }, []);

    return {
        formData,
        consultData,
        warnFields,
        handleChange,
        handleBlur,
        validateForm,
        isNotProcess,
    };
}
