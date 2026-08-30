
export const defaultValue = {
  startdate: null, 
  enddate: null,
  organization_id: null,
};

export const regex = {
  startdate: /^[0-9]{4}-[0-9]{2}-[0-9]{2}$/,
  enddate: /^[0-9]{4}-[0-9]{2}-[0-9]{2}$/,
  organization_id: /^[0-9]+$/,

};

export const replacePattern = {
  startdate: /[^0-9\-]/g,
  enddate: /[^0-9\-]/g,
  organization_id: /[^0-9]/g,

};
export const regexMessage = {
  type: {
    startdate: "ประเภทข้อมูล วันที่เริ่ม ไม่ถูกต้อง",
    enddate: "ประเภทข้อมูล วันที่เริ่ม ไม่ถูกต้อง",
    organization_id: "ประเภทข้อมูล หน่วยงาน ไม่ถูกต้อง",

  },
  format: {
    startdate: "วัน-เดือน-ปี ต้องเป็นรูปแบบ YYYY-mm-dd เท่านั้น",
    enddate: "วัน-เดือน-ปี ต้องเป็นรูปแบบ YYYY-mm-dd เท่านั้น",
    organization_id: "ID หน่วยงาน ต้องเป็นตัวเลข เท่านั้น",
  }
};
