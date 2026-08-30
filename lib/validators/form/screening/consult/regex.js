export const defaultValue = {
  consulting: null,
  stress_check: null,
  stress_other: null,
  risk_not_found: null,
  risk_rq: null,
  risk_burn_out: null,
  risk_st5: null,
  risk_depressed_2qplus: null,
  risk_depressed_9q: null,
  risk_suicide: null,

  assist_stress: null,
  assist_stress_relief_techniques: null,
  assist_first_aid: null,
  assist_changing_perspectives: null,
  assist_stress_relief_breathing_exercises: null,
  assist_initial_consultation: null,
  assist_sleep: null,
  assist_exercise: null,
  assist_other:null,
  assist_other_detail: null,

  follow_id: null,
  follow_agree: null,
  follow_date: null,
  follow_detail: null,
  follow_tel: null,
  forward_problem: null,
  forward_hospital: null,
  forward_how_to_follow: null

};

export const regex = {

  consulting: /^(?:[\p{Script=Thai}a-zA-Z0-9\s./-])+$/u,
  stress_check: /^[0-1]+$/,
  stress_other: /^(?:[\p{Script=Thai}a-zA-Z0-9\s./-])+$/u,
  risk_not_found: /^[0-1]+$/,
  risk_rq: /^[0-9]+$/,
  risk_burn_out: /^[0-9]+$/,
  risk_st5: /^[0-9]+$/,
  risk_depressed_2qplus: /^[0-2]+$/,
  risk_depressed_9q: /^[0-2]+$/,
  risk_suicide: /^[0-9]+$/,

  assist_stress: /^[0-1]+$/,
  assist_stress_relief_techniques: /^[0-1]+$/,
  assist_first_aid: /^[0-1]+$/,
  assist_changing_perspectives: /^[0-1]+$/,
  assist_stress_relief_breathing_exercises: /^[0-1]+$/,
  assist_initial_consultation: /^[0-1]+$/,
  assist_sleep: /^[0-1]+$/,
  assist_exercise: /^[0-1]+$/,
  assist_other: /^[0-1]+$/,
  assist_other_detail: /^(?:[\p{Script=Thai}a-zA-Z0-9\s./-])+$/u,

  follow_id: /^[0-9]+$/,
  follow_agree: /^[0-1]+$/,
  follow_date: /^[0-9]{4}-[0-9]{2}-[0-9]{2}(?:[T ][0-9]{2}:[0-9]{2}(?::[0-9]{2})?)?$/,
  follow_detail: /^(?:[\p{Script=Thai}a-zA-Z0-9\s./-])+$/u,
  follow_tel: /^[0-9-+]+$/,
  forward_problem: /^(?:[\p{Script=Thai}a-zA-Z0-9\s./-])+$/u,
  forward_hospital: /^(?:[\p{Script=Thai}a-zA-Z0-9\s./-])+$/u,
  forward_how_to_follow: /^(?:[\p{Script=Thai}a-zA-Z0-9\s./-])+$/u,

};

export const replacePattern = {

  consulting: /[^\p{Script=Thai}a-zA-Z0-9\s./-]/gu,
  stress_check: /[^0-1]/g,
  stress_other: /[^\p{Script=Thai}a-zA-Z0-9\s./-]/gu,
  risk_not_found: /[^0-1]/g,
  risk_rq: /[^0-9]/g,
  risk_burn_out: /[^0-9]/g,
  risk_st5: /[^0-9]/g,
  risk_depressed_2qplus: /[^0-2]/g,
  risk_depressed_9q: /[^0-2]/g,
  risk_suicide: /[^0-9]/g,

  assist_stress: /[^0-9]/g,
  assist_stress_relief_techniques: /[^0-9]/g,
  assist_first_aid: /[^0-9]/g,
  assist_changing_perspectives: /[^0-9]/g,
  assist_stress_relief_breathing_exercises: /[^0-9]/g,
  assist_initial_consultation: /[^0-9]/g,
  assist_sleep: /[^0-9]/g,
  assist_exercise: /[^0-9]/g,
  assist_other: /[^0-9]/g,
  assist_other_detail: /[^\p{Script=Thai}a-zA-Z0-9\s./-]/gu,

  follow_id: /[^0-9]/g,
  follow_agree: /[^0-1]/g,
  follow_date: /[^0-9\-T: ]/g,
  follow_detail: /[^\p{Script=Thai}a-zA-Z0-9\s./-]/gu,
  follow_tel: /[^0-9\-\+]/g,
  forward_problem: /[^\p{Script=Thai}a-zA-Z0-9\s./-]/gu,
  forward_hospital: /[^\p{Script=Thai}a-zA-Z0-9\s./-]/gu,
  forward_how_to_follow: /[^\p{Script=Thai}a-zA-Z0-9\s./-]/gu,

};

export const range = {
  risk_rq: { min: 3, max: 30 },
  risk_burn_out: { min: 3, max: 12 },
  risk_st5: { min: 0, max: 15 },
  risk_depressed: { min: 0, max: 150 },
  risk_suicide: { min: 0, max: 150 },
};

export const regexMessage = {
  type: {
    consulting: "ประเภทข้อมูล ข้อมูลการให้คำปรึกษา ไม่ถูกต้อง",
    stress_check: "ประเภทข้อมูล ตัวเลือก ไม่ถูกต้อง",
    stress_other: "ประเภทข้อมูล รายละเอียดอื่นๆ ไม่ถูกต้อง",
    risk_not_found: "ประเภทข้อมูล ไม่พบความเสี่ยง ไม่ถูกต้อง",
    risk_rq: "ประเภทข้อมูล แบบประเมินพลังใจ ( RQ ) ไม่ถูกต้อง",
    risk_burn_out: "ประเภทข้อมูล แบบประเมินภาวะหมดไฟ ( Burn Out ) ไม่ถูกต้อง",
    risk_st5: "ประเภทข้อมูล แบบประเมินความเครียด ( ST-5 ) ไม่ถูกต้อง",
    risk_depressed_2qplus: "ประเภทข้อมูล แบบคัดกรองโรคซึมเศร้า 2Q+ ไม่ถูกต้อง",
    risk_depressed_9q: "ประเภทข้อมูล แบบคัดกรองโรคซึมเศร้า 9Q ไม่ถูกต้อง",
    risk_suicide: "ประเภทข้อมูล แบบประเมินเสี่ยงฆ่าตัวตาย ไม่ถูกต้อง",

    assist_stress: "ประเภทข้อมูล การจัดการความเครียด ไม่ถูกต้อง",
    assist_stress_relief_techniques: "ประเภทข้อมูล เทคนิคคลายเครียด ไม่ถูกต้อง",
    assist_first_aid: "ประเภทข้อมูล การปฐมพยาบาลทางใจเบื้องต้น (PFA) ไม่ถูกต้อง",
    assist_changing_perspectives: "ประเภทข้อมูล การปรับเปลี่ยนมุมมองและทัศนคติ ไม่ถูกต้อง",
    assist_stress_relief_breathing_exercises: "ประเภทข้อมูล การฝึกหายใจคลายเครียด ไม่ถูกต้อง",
    assist_initial_consultation: "ประเภทข้อมูล การให้คำปรึกษาเบื้องต้น ไม่ถูกต้อง",
    assist_sleep: "ประเภทข้อมูล การนอนหลับ ไม่ถูกต้อง",
    assist_exercise: "ประเภทข้อมูล การออกกำลังกาย ไม่ถูกต้อง",
    assist_other:"ประเภทข้อมูล อื่นๆ ไม่ถูกต้อง",
    assist_other_detail: "ประเภทข้อมูล รายละเอียดอื่นๆ ไม่ถูกต้อง",

    follow_id: "ประเภทข้อมูล การติดตาม ไม่ถูกต้อง",
    follow_agree: "ประเภทข้อมูล การติดตาม ไม่ถูกต้อง",
    follow_date: "ประเภทข้อมูล วันนัดหมาย ไม่ถูกต้อง",
    follow_detail:"ประเภทข้อมูล รายละเอียด ไม่ถูกต้อง",
    follow_tel:"ประเภทข้อมูล เบอร์โทรติดต่อ ไม่ถูกต้อง",
    forward_problem: "ประเภทข้อมูล ระบุปัญหา ไม่ถูกต้อง",
    forward_hospital:"ประเภทข้อมูล หน่วยที่รับส่งต่อ ไม่ถูกต้อง",
    forward_how_to_follow:"ประเภทข้อมูล ระบุวิธีติดตาม ไม่ถูกต้อง",
  },
  format: {
    consulting: "ข้อมูลการให้คำปรึกษา ต้องห้ามมีสัญลักษณ์พิเศษ อนุญาติให้กรอก เว้นวรรค, ., -, / ได้ เท่านั้น",
    stress_check: "ข้อมูล ตัวเลือก ต้องเป็นตัวเลข 1 หรือ 0 เท่านั้น",
    stress_other: "ข้อมูล รายละเอียดอื่นๆ ต้องห้ามมีสัญลักษณ์พิเศษ อนุญาติให้กรอก เว้นวรรค, ., -, / ได้ เท่านั้น",
    risk_not_found: "ข้อมูล ไม่พบความเสี่ยง ต้องเป็นตัวเลข 1 หรือ 0 เท่านั้น",
    risk_rq: "ข้อมูล แบบประเมินพลังใจ ( RQ ) ต้องเป็นตัวเลข เท่านั้น",
    risk_burn_out: "ข้อมูล แบบประเมินภาวะหมดไฟ ( Burn Out ) ต้องเป็นตัวเลข เท่านั้น",
    risk_st5: "ข้อมูล แบบประเมินความเครียด ( ST-5 ) ต้องเป็นตัวเลข เท่านั้น",
    risk_depressed_2qplus: "ข้อมูล แบบคัดกรองโรคซึมเศร้า 2Q+ ต้องเป็นตัวเลข เท่านั้น",
    risk_depressed_9q: "ข้อมูล แบบคัดกรองโรคซึมเศร้า 9Q ต้องเป็นตัวเลข เท่านั้น",
    risk_suicide: "ข้อมูล แบบประเมินเสี่ยงฆ่าตัวตาย ต้องเป็นตัวเลข เท่านั้น",

    assist_stress: "ข้อมูล การจัดการความเครียด ต้องเป็นตัวเลข 1 หรือ 0 เท่านั้น",
    assist_stress_relief_techniques: "ข้อมูล เทคนิคคลายเครียด ต้องเป็นตัวเลข 1 หรือ 0 เท่านั้น",
    assist_first_aid: "ข้อมูล การปฐมพยาบาลทางใจเบื้องต้น (PFA) ต้องเป็นตัวเลข 1 หรือ 0 เท่านั้น",
    assist_changing_perspectives: "ข้อมูล การปรับเปลี่ยนมุมมองและทัศนคติ ต้องเป็นตัวเลข 1 หรือ 0 เท่านั้น",
    assist_stress_relief_breathing_exercises: "ข้อมูล การฝึกหายใจคลายเครียด ต้องเป็นตัวเลข 1 หรือ 0 เท่านั้น",
    assist_initial_consultation: "ข้อมูล การให้คำปรึกษาเบื้องต้น ต้องเป็นตัวเลข 1 หรือ 0 เท่านั้น",
    assist_sleep: "ข้อมูล การนอนหลับ ต้องเป็นตัวเลข 1 หรือ 0 เท่านั้น",
    assist_exercise: "ข้อมูล การออกกำลังกาย ต้องเป็นตัวเลข 1 หรือ 0 เท่านั้น",
    assist_other:"ข้อมูล อื่นๆ ต้องเป็นตัวเลข 1 หรือ 0 เท่านั้น",
    assist_other_detail: "ข้อมูล รายละเอียดอื่นๆ ต้องห้ามมีสัญลักษณ์พิเศษ อนุญาติให้กรอก เว้นวรรค, ., -, / ได้ เท่านั้น",

    follow_id: "ข้อมูล การติดตาม ต้องเป็นตัวเลข เท่านั้น",
    follow_agree: "ข้อมูล การยินยอม ต้องเป็นตัวเลข เท่านั้น",
    follow_date: "ข้อมูล วันนัดหมาย ต้องเป็นรูปแบบ YYYY-mm-dd HH:mm เท่านั้น",
    follow_detail:"ข้อมูล  รายละเอียด ต้องห้ามมีสัญลักษณ์พิเศษ อนุญาติให้กรอก เว้นวรรค, ., -, / ได้ เท่านั้น",
    follow_tel:"เบอร์โทรติดต่อ อนุญาติให้กรอก ตัวเลข,-,+ ได้ เท่านั้น",
    forward_problem: "ข้อมูล ระบุปัญหา ต้องห้ามมีสัญลักษณ์พิเศษ อนุญาติให้กรอก เว้นวรรค, ., -, / ได้ เท่านั้น",
    forward_hospital:"ข้อมูล หน่วยที่รับส่งต่อ ต้องห้ามมีสัญลักษณ์พิเศษ อนุญาติให้กรอก เว้นวรรค, ., -, / ได้ เท่านั้น",
    forward_how_to_follow:"ข้อมูล ระบุวิธีติดตาม ต้องห้ามมีสัญลักษณ์พิเศษ อนุญาติให้กรอก เว้นวรรค, ., -, / ได้ เท่านั้น",
  },

  range: {
    ans_activity: "ค่าคะแนนต้องอยู่ระหว่าง 50-150",
    risk_rq: "แบบประเมินพลังใจ ( RQ ) ค่าคะแนนต้องอยู่ระหว่าง 3-30",
    risk_burn_out: "แบบประเมินภาวะหมดไฟ ( Burn Out ) ค่าคะแนนต้องอยู่ระหว่าง 3-12",
    risk_st5: "ประเภทข้อมูล แบบประเมินความเครียด ( ST-5 ) ค่าคะแนนต้องอยู่ระหว่าง 0-15",
  }
};

export const gradeFns = {
  risk_rq: (v) => {
    if (v >= 23 && v <= 30) return { id: 3, label: "มาก", color: "red" };
    if (v >= 15) return { id: 2, label: "ปานกลาง", color: "gray" };
    if (v >= 3) return { id: 1, label: "น้อย" , color: "green" };
    return { id: 0, label: "กรอกข้อมูลไม่ถูกต้อง", color: "red"  };
  },

  risk_burn_out: (v) => {
    if (v >= 9 && v <= 12) return { id: 3, label: "มาก", color: "red" };
    if (v >= 7) return { id: 2, label: "ปานกลาง", color: "gray" };
    if (v >= 3) return { id: 1, label: "น้อย", color: "green" };
    return { id: 0, label: "กรอกข้อมูลไม่ถูกต้อง", color: "red"  };
  },

  risk_st5: (v) => {
    if (v >= 10 && v <= 15) return { id: 4, label: "เครียดมากที่สุด", color: "red" };
    if (v >= 9) return { id: 3, label: "เครียดมาก", color: "orange" };
    if (v >= 5) return { id: 2, label: "เครียดปานกลาง", color: "gray" };
    if (v >= 0) return { id: 1, label: "เครียดน้อย", color: "green" };
    return { id: 0, label: "กรอกข้อมูลไม่ถูกต้อง", color: "red"};
  },
};

