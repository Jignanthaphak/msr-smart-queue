-- ============================================================
-- Migration — 2026-07-26 (รอบที่ 2 ของวัน)
-- เพิ่มช่อง "เบอร์โทรติดต่อ" ในหัวข้อนัดหมาย หน้า consult
-- ต้องรันก่อน copy ไฟล์ขึ้น prod
-- ============================================================

ALTER TABLE `consult`
  ADD COLUMN `follow_tel` varchar(50) DEFAULT NULL AFTER `follow_detail`;

-- ตรวจสอบ
-- SHOW COLUMNS FROM consult LIKE 'follow%';

-- หมายเหตุ: ไม่ลบคอลัมน์ `follow_counseling_center` และ `follow_counseling_center_tel`
-- ถึงแม้หัวข้อ "ศูนย์ให้คำปรึกษา" จะถูกลบออกจากฟอร์มแล้ว
-- เพราะยังต้องเก็บข้อมูลเดิม และหน้ารายงาน /report/report_counseling_center ยังอ่านคอลัมน์นี้อยู่
