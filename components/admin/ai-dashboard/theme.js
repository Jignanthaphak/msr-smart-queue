// components/admin/ai-dashboard/theme.js
// สีดึงจาก HSL tokens ใน globals.css เพื่อให้กราฟเข้าธีมเดียวกับระบบ
export const C = {
  primary: "hsl(158, 64%, 52%)",   // เขียวแบรนด์
  accent: "hsl(217, 91%, 60%)",    // ฟ้า
  success: "hsl(142, 76%, 36%)",
  warning: "hsl(45, 93%, 47%)",
  destructive: "hsl(0, 84%, 60%)",
  muted: "hsl(215, 16%, 47%)",
  purple: "hsl(262, 83%, 63%)",
  teal: "hsl(174, 62%, 47%)",
};

// พาเลตต์สำหรับ series ทั่วไป (bar/pie)
export const PALETTE = [
  C.primary, C.accent, C.warning, C.purple, C.teal, C.destructive, C.muted,
];

// map สีตามความหมาย
export const STATUS_COLORS = { success: C.success, error: C.destructive, unknown: C.muted };
export const RISK_COLORS = {
  low: C.success, moderate: C.warning, high: C.destructive,
  "เสี่ยงต่ำ": C.success, "เสี่ยงปานกลาง": C.warning, "เสี่ยงสูง": C.destructive,
  "ไม่ระบุ": C.muted,
};
export const ACTION_COLORS = {
  normal: C.success, watch: C.warning, refer: C.destructive, "ไม่ระบุ": C.muted,
};

// label ภาษาไทย
export const STATUS_LABEL = { success: "สำเร็จ", error: "ล้มเหลว", unknown: "ไม่ทราบ" };
export const RISK_LABEL = { low: "เสี่ยงต่ำ", moderate: "เสี่ยงปานกลาง", high: "เสี่ยงสูง" };
export const ACTION_LABEL = { normal: "ปกติ", watch: "เฝ้าระวัง", refer: "ส่งต่อ" };
