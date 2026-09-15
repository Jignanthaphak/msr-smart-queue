-- =========================================================
-- SQL Migration Script for ThaID Integration (tbl_account)
-- ศูนย์สุขภาพจิตที่ ๔ กรมสุขภาพจิต
-- =========================================================

-- หมายเหตุ: ลูกรักได้ทำการเพิ่มคอลัมน์ citizen_id ในตาราง tbl_account เรียบร้อยแล้ว
-- คำสั่งด้านล่างนี้ใช้เป็นเอกสารอ้างอิง:
-- ALTER TABLE `tbl_account` ADD COLUMN `citizen_id` VARCHAR(13) NULL UNIQUE AFTER `username`;

-- ตัวอย่างคำสั่งตรวจสอบข้อมูล:
-- SELECT user_id, nickname, username, citizen_id FROM tbl_account;

-- ตัวอย่างการอัปเดตผูกเลขบัตรประชาชนกับผู้ใช้งาน:
-- UPDATE `tbl_account` SET `citizen_id` = '1234567890123' WHERE `username` = 'adminjig';
