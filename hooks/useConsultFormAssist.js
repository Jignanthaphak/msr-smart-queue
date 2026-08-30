// /hooks/useConsultFormAssist.js
import { useState, useRef, useEffect } from "react";
import { BaseSchemaAssist, FullSchemaAssist, replace, defaultValue } from "@/lib/validators/form/screening/consult/schema";

export function useConsultFormAssist({ consultData, disabledForm = true, onChangeFormAssist, containerSelector = null }) {
    const isNotProcess = useRef(true);
    const sanitizeTimeouts = useRef({});

    const checkboxFieldsAssist = [
      { name: "assist_stress", label: "การจัดการความเครียด" },
      { name: "assist_stress_relief_techniques", label: "เทคนิคคลายเครียด" },
      { name: "assist_first_aid", label: "การปฐมพยาบาลทางใจเบื้องต้น (PFA)" },
      { name: "assist_changing_perspectives", label: "การปรับเปลี่ยนมุมมองและทัศนคติ" },
      { name: "assist_stress_relief_breathing_exercises", label: "การฝึกหายใจคลายเครียด" },
      { name: "assist_initial_consultation", label: "การให้คำปรึกษาเบื้องต้น" },
      { name: "assist_sleep", label: "การนอนหลับ" },
      { name: "assist_exercise", label: "การออกกำลังกาย" },
      { name: "assist_other", label: "อื่นๆ" },
    ];

    const [formData, setFormData] = useState({
        assist_stress: defaultValue.assist_stress,
        assist_stress_relief_techniques: defaultValue.assist_stress_relief_techniques,
        assist_first_aid: defaultValue.assist_first_aid,
        assist_changing_perspectives: defaultValue.assist_changing_perspectives,
        assist_stress_relief_breathing_exercises: defaultValue.assist_stress_relief_breathing_exercises,
        assist_initial_consultation: defaultValue.assist_initial_consultation,
        assist_sleep: defaultValue.assist_sleep,
        assist_exercise: defaultValue.assist_exercise,
        assist_other: defaultValue.assist_other,
        assist_other_detail: defaultValue.assist_other_detail,
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

        const assistData = consultData.consult;

        setFormData({
            assist_stress: assistData?.assist_stress ?? defaultValue.assist_stress,
            assist_stress_relief_techniques: assistData?.assist_stress_relief_techniques ?? defaultValue.assist_stress_relief_techniques,
            assist_first_aid: assistData?.assist_first_aid ?? defaultValue.assist_first_aid,
            assist_changing_perspectives: assistData?.assist_changing_perspectives ?? defaultValue.assist_changing_perspectives,
            assist_stress_relief_breathing_exercises: assistData?.assist_stress_relief_breathing_exercises ?? defaultValue.assist_stress_relief_breathing_exercises,
            assist_initial_consultation: assistData?.assist_initial_consultation ?? defaultValue.assist_initial_consultation,
            assist_sleep: assistData?.assist_sleep ?? defaultValue.assist_sleep,
            assist_exercise: assistData?.assist_exercise ?? defaultValue.assist_exercise,
            assist_other: assistData?.assist_other ?? defaultValue.assist_other,
            assist_other_detail: assistData?.assist_other_detail ?? defaultValue.assist_other_detail,
        });
    }, [consultData]);

    const handleChange = (e) => {
        if (disabledForm) return;

        const { name, value, checked, type } = e.target;
        let newValue = type === "checkbox" ? (checked ? 1 : 0) : value;
        const oldValue = formData[name];

        const validator = replace[name];
        const parsed = BaseSchemaAssist.pick({ [name]: true }).safeParse({ [name]: newValue });

        if (!parsed.success) {
            const isFormatError = parsed?.error?.errors[0]?.message;
            if (isFormatError && validator) {
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

    // ล้าง assist_other_detail ถ้า assist_other ไม่ถูกติ๊ก
    useEffect(() => {
        if (formData.assist_other !== 1 && formData.assist_other_detail !== defaultValue.assist_other_detail) {
            setFormData(prev => ({ ...prev, assist_other_detail: defaultValue.assist_other_detail }));
            setWarnFields(prev => ({ ...prev, assist_other_detail: null }));
        }
    }, [formData.assist_other]);

    const validateForm = (focus = false) => {
        const result = FullSchemaAssist.safeParse(formData);
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

    // แจ้ง parent component ทุกครั้งที่ formData เปลี่ยน
    useEffect(() => {
        if (isNotProcess.current) return;
        const isComplete = validateForm(false);
        onChangeFormAssist?.({ formData, isComplete });
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
        checkboxFieldsAssist,
    };
}
