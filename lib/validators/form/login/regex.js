export const defaultValue = {
  username: null, 
  password: null,
  newPassword: null,
};

export const regex = {
  username: /^[a-z0-9]{5,12}$/,
  password: /^[a-z0-9]{6,12}$/,
  newPassword: /^[a-z0-9]{6,12}$/,
};

export const replacePattern = {
  username: /[^a-z0-9]/gi,
  password: /[^a-z0-9]/gi,
  newPassword: /[^a-z0-9]/gi,
};

export const regexMessage = {
  type: {
    username: "ประเภทข้อมูล Username ไม่ถูกต้อง",
    password: "ประเภทข้อมูล Password ไม่ถูกต้อง",
    newPassword: "ประเภทข้อมูล Password ใหม่ ไม่ถูกต้อง",
  },
  format: {
    username: "Username ต้องเป็นตัวเลขและตัวอักษรภาษาอังกฤษ 5-12 ตัวอักษร เท่านั้น",
    password: "Password ต้องเป็นตัวเลขและตัวอักษรภาษาอังกฤษ 6-12 ตัวอักษร เท่านั้น",
    newPassword: "Password ใหม่ต้องเป็นตัวเลขและตัวอักษรภาษาอังกฤษ 6-12 ตัวอักษร เท่านั้น",
  }
};
