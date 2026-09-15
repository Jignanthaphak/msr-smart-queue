// /hooks/useConsultFormSatisfaction.js
'use client';

import { useState, useRef, useEffect, useMemo, useCallback } from "react";
import { BaseSchemaSatisfaction, FullSchemaSatisfaction, defaultValue } from "@/lib/validators/form/screening/consult/schema";
import { gradeFns } from "@/lib/validators/form/screening/consult/regex";

export const SATISFACTION_LEVELS = [
  {
    value: "ไม่พอใจ",
    score: 1,
    label: "ไม่พอใจ",
    description: "ไม่ได้รับความสะดวก / ควรปรับปรุง",
    color: "red",
    activeClass: "border-rose-500 bg-rose-50 text-rose-800 shadow-md ring-2 ring-rose-400/40",
    badgeClass: "bg-rose-100 text-rose-800 border-rose-300",
    radioClass: "text-rose-600 focus:ring-rose-500",
  },
  {
    value: "พอใจ",
    score: 2,
    label: "พอใจ",
    description: "ได้รับบริการตามเกณฑ์มาตรฐาน / เหมาะสม",
    color: "blue",
    activeClass: "border-blue-500 bg-blue-50 text-blue-800 shadow-md ring-2 ring-blue-400/40",
    badgeClass: "bg-blue-100 text-blue-800 border-blue-300",
    radioClass: "text-blue-600 focus:ring-blue-500",
  },
  {
    value: "พอใจมาก",
    score: 3,
    label: "พอใจมาก",
    description: "บริการดีเยี่ยม / ประทับใจมาก",
    color: "green",
    activeClass: "border-emerald-500 bg-emerald-50 text-emerald-800 shadow-md ring-2 ring-emerald-400/40",
    badgeClass: "bg-emerald-100 text-emerald-800 border-emerald-300",
    radioClass: "text-emerald-600 focus:ring-emerald-500",
  },
];

export function useConsultFormSatisfaction({ consultData, disabledForm = true, onChangeFormSatisfaction }) {
  const isNotProcess = useRef(true);
  const sanitizeTimeouts = useRef({});

  const [level, setLevel] = useState("");
  const [note, setNote] = useState("");
  const [warnFields, setWarnFields] = useState({});

  const setWarnWithTimeout = useCallback((name, message) => {
    setWarnFields(prev => prev[name] === message ? prev : { ...prev, [name]: message });
    if (sanitizeTimeouts.current[name]) clearTimeout(sanitizeTimeouts.current[name]);
    sanitizeTimeouts.current[name] = setTimeout(() => {
      setWarnFields(prev => ({ ...prev, [name]: null }));
      sanitizeTimeouts.current[name] = null;
    }, 1500);
  }, []);

  // โหลดค่าจาก consultData
  useEffect(() => {
    isNotProcess.current = !consultData?.consult;
    if (isNotProcess.current) return;

    const data = consultData.consult;
    let lvl = data?.satisfaction_level || "";
    if (!lvl && data?.satisfaction_score !== null && data?.satisfaction_score !== undefined) {
      const s = Number(data.satisfaction_score);
      if (s === 1 || (s > 0 && s < 50)) lvl = "ไม่พอใจ";
      else if (s === 2 || (s >= 50 && s < 80)) lvl = "พอใจ";
      else if (s === 3 || s >= 80) lvl = "พอใจมาก";
    }

    setLevel(lvl);
    setNote(data?.satisfaction_note || "");
  }, [consultData]);

  // คะแนนที่สอดคล้องกับระดับ
  const score = useMemo(() => {
    if (level === "ไม่พอใจ") return 1;
    if (level === "พอใจ") return 2;
    if (level === "พอใจมาก") return 3;
    return null;
  }, [level]);

  // ข้อมูลระดับความพึงพอใจ
  const currentLevelConfig = useMemo(() => {
    return SATISFACTION_LEVELS.find(item => item.value === level) || null;
  }, [level]);

  // จัดการเลือกหรือสลับระดับ
  const handleSelectLevel = (selectedLevel) => {
    if (disabledForm) return;
    setLevel(prev => prev === selectedLevel ? "" : selectedLevel);
    setWarnFields(prev => ({ ...prev, satisfaction_level: null }));
    isNotProcess.current = false;
  };

  // ล้างการเลือก
  const handleClearLevel = () => {
    if (disabledForm) return;
    setLevel("");
    setWarnFields(prev => ({ ...prev, satisfaction_level: null }));
    isNotProcess.current = false;
  };

  // จัดการเปลี่ยนข้อเสนอแนะ
  const handleChangeNote = (e) => {
    if (disabledForm) return;
    const val = e.target.value;
    setNote(val);
    isNotProcess.current = false;
  };

  const onChangeRef = useRef(onChangeFormSatisfaction);
  onChangeRef.current = onChangeFormSatisfaction;

  // แจ้ง parent component
  useEffect(() => {
    if (isNotProcess.current) return;

    const currentScore = level === "ไม่พอใจ" ? 1 : level === "พอใจ" ? 2 : level === "พอใจมาก" ? 3 : null;
    const isComplete = Boolean(level && ["ไม่พอใจ", "พอใจ", "พอใจมาก"].includes(level));

    onChangeRef.current?.({
      formData: {
        satisfaction_score: currentScore,
        satisfaction_level: level || null,
        satisfaction_note: note,
      },
      isComplete,
    });
  }, [level, note]);

  const validateForm = (focus = false) => {
    if (!level || !["ไม่พอใจ", "พอใจ", "พอใจมาก"].includes(level)) {
      if (focus) {
        setWarnWithTimeout("satisfaction_level", "กรุณาเลือกระดับความพึงพอใจ (ไม่พอใจ, พอใจ หรือ พอใจมาก)");
        const el = document.querySelector('.consult-satisfaction-container') || document.querySelector('[name="satisfaction_level"]');
        if (el) {
          try {
            el.scrollIntoView({ behavior: "smooth", block: "center" });
          } catch (err) {}
        }
      }
      return false;
    }

    setWarnFields(prev => ({ ...prev, satisfaction_level: null }));
    return true;
  };

  return {
    level,
    score,
    currentLevelConfig,
    note,
    warnFields,
    handleSelectLevel,
    handleClearLevel,
    handleChangeNote,
    validateForm,
  };
}
