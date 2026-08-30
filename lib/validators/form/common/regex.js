
  export const defaultValue = {
    screening_id: null, 
    hn: null,
    input: null
  };

  export const regex = {
    screening_id : /^[0-9]+$/,
    hn : /^[0-9]+$/,
    input: /^[a-zA-Z0-9ก-๙\s.,\-_/()@]+$/ 
  };

  export const replacePattern = {
    screening_id : /[^0-9]/g,
    hn : /[^0-9]/g,
    input: /[^a-zA-Z0-9ก-๙\s.,\-_/()@]/g
  };
  
  export const regexMessage = {
    type: {
      screening_id: "ประเภทข้อมูล Screening ID ไม่ถูกต้อง",
      hn: "ประเภทข้อมูล HN ไม่ถูกต้อง",
      input: "ประเภทข้อมูลไม่ถูกต้อง",
    },
    format: {
      screening_id: "รูปแบบข้อมูลต้องเป็น Screening ID ตัวเลข เท่านั้น",
      hn: "รูปแบบข้อมูลต้องเป็น HN ตัวเลข เท่านั้น",
      input: "มีอักขระพิเศษที่ไม่อนุญาต เช่น ', \", ;, <, >, = ฯลฯ",
    },
  };
  