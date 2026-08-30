// /hooks/useBioForm.js
'use client';
import { useState, useEffect, useRef } from "react";
import { BaseSchema, FullSchema, replace, defaultValue } from "@/lib/validators/form/screening/bio/schema";

export const useBioForm = ( bioData, disabledForm = true, onChangeFormBio, containerSelector = null ) => {

    const isNotProcess = useRef(true);
    const sanitizeTimeouts = useRef({});

    const [formData, setFormData] = useState({
        screening_id: defaultValue.screening_id, 
        not_check_assessments: defaultValue.not_check_assessments,  
        cause: defaultValue.cause,  
        ans_activity: defaultValue.ans_activity, 
        ans_balance: defaultValue.ans_balance, 
        stress_resistance: defaultValue.stress_resistance, 
        stress_index: defaultValue.stress_index, 
        fatigue_index: defaultValue.fatigue_index, 
        mean_heart_rate: defaultValue.mean_heart_rate, 
        electro_cardiac_stability: defaultValue.electro_cardiac_stability, 
        ectopic_beat: defaultValue.ectopic_beat, 
        wave_level: defaultValue.wave_level, 
        important_information: defaultValue.important_information, 
    });

    const [warnFields, setWarnFields] = useState({});
    const [gradeFields, setGradeFields] = useState({});

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

    useEffect(() => {

        const screeningData = bioData?.screenings || null;
        const bioDataExtra = bioData?.screenings?.biofeedback || null;
     
        isNotProcess.current = !screeningData;
        if (isNotProcess.current) return;

        const schemaShape = BaseSchema.omit({ screening_id: true, not_check_assessments: true, cause: true, important_information: true }).shape;

        const newFormData = {
            screening_id: screeningData?.screening_id ?? defaultValue.screening_id,
            not_check_assessments: bioDataExtra?.not_check_assessments ?? defaultValue.not_check_assessments,
            cause: bioDataExtra?.cause ?? defaultValue.cause,
            important_information: bioData?.important_information ?? defaultValue.important_information
        };

        const newGradeFields = {};

        for (const key of Object.keys(schemaShape)) {
            const value = bioDataExtra?.[key] ?? defaultValue[key];
            if(value && value !== ""){
                const fieldSchema = BaseSchema.pick({ [key]: true });
                const parsed = fieldSchema.safeParse({ [key]: value });

                newGradeFields[key] = { status: parsed?.success || false, msg: null, color: null};

                if (parsed.success) {
                    const parsedValue = parsed.data[key];
                    newFormData[key] = parsedValue?.value ?? value;
                    newGradeFields[key].msg = parsedValue?.grade?.label ?? null;
                    newGradeFields[key].color = parsedValue?.grade?.color ?? null;
                } else {
                    newFormData[key] = value ?? "";
                    newGradeFields[key].msg = parsed?.error?.issues[0]?.message;
                    newGradeFields[key].color = "red";
                }
            } else {
                newFormData[key] = value ?? "";
                newGradeFields[key] = { status:false, msg: null, color: null};
            }
        }

        setFormData(newFormData);
        setGradeFields(newGradeFields);

    }, [bioData]);

    const handleChange = (e) => {
        if(disabledForm) return;

        const { name, value, checked, type } = e.target;
        let newValue = type === "checkbox" ? (checked ? 1 : 0) : value;
        const oldValue = formData[name];

        const validator = replace[name];
        const partialObj = { [name]: newValue };
        const parsed = BaseSchema.pick({ [name]: true }).safeParse(partialObj);

        if (!parsed.success) {
            const isFormatError = parsed?.error?.errors[0]?.message;
            if (isFormatError && validator) {
                newValue = newValue.replace(validator, '');
                setWarnWithTimeout(name, isFormatError);
                if(newValue !== ""){
                    setGradeFields((prev) => ({
                        ...prev,
                        [name]: { status: parsed.success, msg: isFormatError, color: "red" }
                    }));
                }
            }
        } else {
          
            setGradeFields((prev) => ({
                ...prev,
                [name]: { status: parsed.success, msg: parsed?.data[name]?.grade?.label, color: parsed?.data[name]?.grade?.color }
            }));
            setWarnWithTimeout(name, null);
        }

        if (oldValue !== newValue) {
            setFormData(prev => ({ ...prev, [name]: newValue }));
        }

        isNotProcess.current = false;
    };

    const handleBlur = (e) => {
        if(disabledForm || isNotProcess.current) return;
        const { name } = e.target;
        setWarnFields(prev => ({ ...prev, [name]: null }));
    };

    useEffect(() => {
        if (isNotProcess.current) return;

        if (formData.not_check_assessments === 1) {
            const clearedFields = [
                "ans_activity", "ans_balance", "stress_resistance", "stress_index",
                "fatigue_index", "mean_heart_rate", "electro_cardiac_stability",
                "ectopic_beat", "wave_level"
            ];

            const newFormData = { ...formData };
            clearedFields.forEach(key => { newFormData[key] = "" });
            setFormData(newFormData);

            const clearedObj = clearedFields.reduce((acc, key) => { acc[key] = null; return acc; }, {});
            setWarnFields(prev => ({ ...prev, ...clearedObj }));
            setGradeFields(prev => ({ ...prev, ...clearedObj }));
        } else {
            setFormData(prev => ({ ...prev, cause: "" }));
            setWarnWithTimeout("cause", null);
        }
    }, [formData.not_check_assessments]);

    useEffect(() => {
        if (isNotProcess.current) return;
        
        const isComplete = validateForm(false);
        onChangeFormBio({ formData, isComplete });
    }, [formData]);

    const validateForm = (focus = false) => {
        
        const result = FullSchema.safeParse(formData);
        
        if (!result.success) {
            if(focus){
                const errorIssue = result?.error?.errors[0];
                const fieldName = errorIssue?.path?.[0];

                setWarnWithTimeout(fieldName, errorIssue?.message);
                setGradeFields(prev => ({
                    ...prev,
                    [fieldName]: { status: result.success, msg: errorIssue?.message, color:"red" }
                }));

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
        return () => {
            Object.values(sanitizeTimeouts.current).forEach(t => { if(t) clearTimeout(t); });
        };
    }, []);

    return {
        formData,
        warnFields,
        gradeFields,
        handleChange,
        handleBlur,
        validateForm,
    };
};
