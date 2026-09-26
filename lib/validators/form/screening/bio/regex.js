import { 
  regex as regex_person, 
  replacePattern as replacePattern_person, 
  regexMessage as regexMessage_person, 
  defaultValue as defaultValue_person 
} from "@/lib/validators/form/screening/person/regex";

import { 
  regex as regex_common, 
  replacePattern as replacePattern_common, 
  regexMessage as regexMessage_common, 
  defaultValue as defaultValue_common 
} from "@/lib/validators/form/common/regex";


export const defaultValue = {
  screening_id: defaultValue_common.screening_id,
  not_check_assessments: null, 
  ans_activity: null,
  ans_balance: null,
  stress_resistance: null,
  stress_index: null,
  fatigue_index: null,
  mean_heart_rate: null,
  electro_cardiac_stability: null,
  ectopic_beat: null,
  wave_level: null,
  cause: null,
  important_information: defaultValue_person.important_information,
};

export const regex = {
  screening_id: regex_common.screening_id,
  not_check_assessments: /^[0-1]+$/,
  ans_activity: /^[0-9]+(?:\.[0-9]+)?$/,
  ans_balance: /^[0-9]+(?:\.[0-9]+)?$/,
  stress_resistance: /^[0-9]+(?:\.[0-9]+)?$/,
  stress_index: /^[0-9]+(?:\.[0-9]+)?$/,
  fatigue_index: /^[0-9]+(?:\.[0-9]+)?$/,
  mean_heart_rate: /^[0-9]+(?:\.[0-9]+)?$/,
  electro_cardiac_stability: /^[0-9]+(?:\.[0-9]+)?$/,
  ectopic_beat: /^[0-9]+(?:\.[0-9]+)?$/,
  wave_level: /^[0-9]+(?:\.[0-9]+)?$/,
  cause: /^(?:[\p{Script=Thai}a-zA-Z0-9\s./-])+$/u,
  important_information: regex_person.important_information,
};

export const replacePattern = {
  screening_id: replacePattern_common.screening_id,
  not_check_assessments: /[^0-1]/g,
  ans_activity: /[^0-9.]/g,
  ans_balance: /[^0-9.]/g,
  stress_resistance: /[^0-9.]/g,
  stress_index: /[^0-9.]/g,
  fatigue_index: /[^0-9.]/g,
  mean_heart_rate: /[^0-9.]/g,
  electro_cardiac_stability: /[^0-9.]/g,
  ectopic_beat: /[^0-9.]/g,
  wave_level: /[^0-9.]/g,
  cause: /[^\p{Script=Thai}a-zA-Z0-9\s./-]/gu,
  important_information: replacePattern_person.important_information,
};

export const range = {
  ans_activity: { min: 50, max: 150 },
  ans_balance: { min: 0, max: 150 },
  stress_resistance: { min: 50, max: 150 },
  stress_index: { min: 50, max: 150 },
  fatigue_index: { min: 50, max: 150 },
  mean_heart_rate: { min: 40, max: 140 },
  electro_cardiac_stability: { min: 50, max: 150 },
  ectopic_beat: { min: 0, max: 999 },
  wave_level: { min: 1, max: 7 },
};

export const regexMessage = {
  type: {
    screening_id: regexMessage_common.type.screening_id,
    not_check_assessments:"ประเภทข้อมูล ไม่ตรวจประเมิน Biofeedback ไม่ถูกต้อง",
    ans_activity: "ประเภทข้อมูล ANS Activity (การทำงานของระบบประสาทอัตโนมัติ) ไม่ถูกต้อง",
    ans_balance: "ประเภทข้อมูล ANS Balance (ความสมดุลของระบบประสาทอัตโนมัติ) ไม่ถูกต้อง",
    stress_resistance: "ประเภทข้อมูล Stress Resistance (ความทนทานต่อความเครียด) ไม่ถูกต้อง",
    stress_index: "ประเภทข้อมูล Stress Index (ระดับความเครียด) ไม่ถูกต้อง",
    fatigue_index: "ประเภทข้อมูล Fatigue Index (ระดับความเหนื่อยล้า) ไม่ถูกต้อง",
    mean_heart_rate: "ประเภทข้อมูล Mean Heart Rate (อัตราการเต้นของหัวใจเฉลี่ย) ไม่ถูกต้อง",
    electro_cardiac_stability: "ประเภทข้อมูล Electro-Cardiac Stability (ความเสถียรของกระแสไฟฟ้าหัวใจ) ไม่ถูกต้อง",
    ectopic_beat: "ประเภทข้อมูล Ectopic Beat (การเต้นของหัวใจผิดจังหวะ) ไม่ถูกต้อง",
    wave_level: "ประเภทข้อมูล Wave Level (การเต้นของหัวใจผิดจังหวะ) ไม่ถูกต้อง",
    cause: "ประเภทข้อมูล สาเหตุ ไม่ถูกต้อง",
    important_information: regexMessage_person.type.important_information,
  },
  format: {
    screening_id: regexMessage_common.format.screening_id,
    not_check_assessments: "ข้อมูลไม่ตรวจประเมิน Biofedback ต้องเป็น 0 หรือ 1 เท่านั้น",
    ans_activity: "ANS Activity (การทำงานของระบบประสาทอัตโนมัติ) ต้องเป็นตัวเลข เท่านั้น",
    ans_balance: "ANS Balance (ความสมดุลของระบบประสาทอัตโนมัติ) ต้องเป็นตัวเลข เท่านั้น",
    stress_resistance: "Stress Resistance (ความทนทานต่อความเครียด) ต้องเป็นตัวเลข เท่านั้น",
    stress_index: "Stress Index (ระดับความเครียด) ต้องเป็นตัวเลข เท่านั้น",
    fatigue_index: "Fatigue Index (ระดับความเหนื่อยล้า) ต้องเป็นตัวเลข เท่านั้น",
    mean_heart_rate: "Mean Heart Rate (อัตราการเต้นของหัวใจเฉลี่ย) ต้องเป็นตัวเลข เท่านั้น",
    electro_cardiac_stability: "Electro-Cardiac Stability (ความเสถียรของกระแสไฟฟ้าหัวใจ) ต้องเป็นตัวเลข เท่านั้น",
    ectopic_beat: "Ectopic Beat (การเต้นของหัวใจผิดจังหวะ) ต้องเป็นตัวเลข เท่านั้น",
    wave_level: "Wave Level (การเต้นของหัวใจผิดจังหวะ) ต้องเป็นตัวเลข เท่านั้น",
    cause: "สาเหตุ ต้องห้ามมีสัญลักษณ์พิเศษ อนุญาติให้กรอก เว้นวรรค, ., -, / ได้ เท่านั้น",
    important_information: regexMessage_person.format.important_information,
  },
  range: {
    ans_activity: "ค่าคะแนนต้องอยู่ระหว่าง 50-150",
    ans_balance: "ค่าคะแนนต้องอยู่ระหว่าง 0-150",
    stress_resistance: "ค่าคะแนนต้องอยู่ระหว่าง 50-150",
    stress_index: "ค่าคะแนนต้องอยู่ระหว่าง 50-150",
    fatigue_index: "ค่าคะแนนต้องอยู่ระหว่าง 50-150",
    mean_heart_rate: "ค่าคะแนนต้องอยู่ระหว่าง 40-140",
    electro_cardiac_stability: "ค่าคะแนนต้องอยู่ระหว่าง 50-150",
    ectopic_beat: "จำนวนครั้งต้องไม่เกิน 999",
    wave_level: "ระดับต้องอยู่ระหว่าง 1-7",
  }
};

export const gradeFns = {
  ans_activity: (v) => {
    if (v >= 130 && v <= 150) return { id: 1, label: "Excellent", color: "green" };
    if (v >= 110) return { id: 2, label: "Good", color: "blue" };
    if (v >= 90) return { id: 3, label: "Normal", color: "gray" };
    if (v >= 70) return { id: 4, label: "Poor", color: "orange" };
    if (v >= 50) return { id: 5, label: "Bad", color: "red" };
    return { id: 0, label: "กรอกข้อมูลไม่ถูกต้อง", color: "red"  };
  },
  ans_balance: (v) => {
    if (v <= 49) return { id: 1, label: "Balanced", color: "green" };
    if (v <= 99) return { id: 2, label: "Unbalanced", color: "gray" };
    if (v <= 150) return { id: 3, label: "Highly Unbalanced", color: "red" };
    return { id: 0, label: "กรอกข้อมูลไม่ถูกต้อง", color: "red"  };
  },
  stress_resistance: (v) => {
    if (v >= 130) return { id: 1, label: "Excellent", color: "green" };
    if (v >= 110) return { id: 2, label: "Good", color: "blue" };
    if (v >= 90) return { id: 3, label: "Normal", color: "gray" };
    if (v >= 70) return { id: 4, label: "Poor", color: "orange" };
    if (v >= 50) return { id: 5, label: "Bad",  color: "red" };
    return { id: 0, label: "กรอกข้อมูลไม่ถูกต้อง", color: "red"  };
  },
  stress_index: (v) => {
    if (v >= 130) return { id: 5, label: "Bad", color: "red" };
    if (v >= 110) return { id: 4, label: "Poor", color: "orange" };
    if (v >= 90) return { id: 3, label: "Normal", color: "gray" };
    if (v >= 70) return { id: 2, label: "Good", color: "blue" };
    if (v >= 50) return { id: 1, label: "Excellent", color: "green" };
    return { id: 0, label: "กรอกข้อมูลไม่ถูกต้อง", color: "red"  };
  },
  fatigue_index: (v) => {
    if (v >= 130) return { id: 5, label: "Bad", color: "red" };
    if (v >= 110) return { id: 4, label: "Poor", color: "orange" };
    if (v >= 90) return { id: 3, label: "Normal", color: "gray" };
    if (v >= 70) return { id: 2, label: "Good", color: "blue" };
    if (v >= 50) return { id: 1, label: "Excellent", color: "green" };
    return { id: 0, label: "กรอกข้อมูลไม่ถูกต้อง", color: "red"  };
  },
  mean_heart_rate: (v) => {
    if (v >= 120) return { id: 5, label: "Very High", color: "red" };
    if (v >= 100) return { id: 4, label: "High", color: "orange" };
    if (v >= 70) return { id: 3, label: "Normal", color: "gray" };
    if (v >= 60) return { id: 2, label: "Low", color: "blue" };
    if (v >= 0) return { id: 1, label: "Very Low", color: "green" };
    return { id: 0, label: "กรอกข้อมูลไม่ถูกต้อง", color: "red"  };
  },
  electro_cardiac_stability: (v) => {
    if (v >= 130) return { id: 5, label: "Bad", color: "red" };
    if (v >= 110) return { id: 4, label: "Poor", color: "orange" };
    if (v >= 90) return { id: 3, label: "Normal", color: "gray" };
    if (v >= 70) return { id: 2, label: "Good", color: "blue" };
    if (v >= 50) return { id: 1, label: "Excellent", color: "green" };
    return { id: 0, label: "กรอกข้อมูลไม่ถูกต้อง", color: "red"  };
  },
  
  ectopic_beat: (v) => ({ id: 1, label: `${v} ครั้ง`, color: "green" }),

  wave_level: (v) => {
    switch (v) {
      case 1: return { id: 1, label: "Level 1 Excellence", color: "green" };
      case 2: return { id: 2, label: "Level 2 Good", color: "blue" };
      case 3: return { id: 3, label: "Level 3 Careful", color: "orange" };
      case 4: return { id: 4, label: "Level 4 Warning", color: "red" };
      case 5: return { id: 5, label: "Level 5 Bad", color: "darkred" };
      case 6: return { id: 6, label: "Level 6 Very Bad", color: "purple" };
      case 7: return { id: 7, label: "Level 7 Very Bad", color: "maroon" };
      default: return { id: 0, label: "กรอกข้อมูลไม่ถูกต้อง", color: "red"};
    }
  },
};
