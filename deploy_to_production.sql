-- =====================================================================
-- สคริปต์ SQL สำหรับนำขึ้นระบบจริง (Production Database Migration)
-- ระบบ: Mental Health Screening Record (MSR)
-- ศูนย์สุขภาพจิตที่ ๔ กรมสุขภาพจิต
-- =====================================================================

-- ---------------------------------------------------------------------
-- ส่วนที่ 1: เพิ่ม 6 คอลัมน์ใหม่ในตาราง `consult` (รหัส PDx และความพึงพอใจ)
-- ---------------------------------------------------------------------
ALTER TABLE `consult`
  ADD COLUMN `pdx_codes` TEXT DEFAULT NULL COMMENT 'JSON Array ของรหัส PDx เช่น ["Z73.0"]' AFTER `follow_counseling_center_tel`,
  ADD COLUMN `pdx_no_check` INT DEFAULT NULL COMMENT '1 = ไม่พบรหัส PDx / ไม่มีรหัสที่เข้าเกณฑ์' AFTER `pdx_codes`,
  ADD COLUMN `pdx_other` VARCHAR(255) DEFAULT NULL COMMENT 'รหัส PDx อื่นๆ หรือรายละเอียดเพิ่มเติม' AFTER `pdx_no_check`,
  ADD COLUMN `satisfaction_score` INT(11) DEFAULT NULL COMMENT 'คะแนนความพึงพอใจ (1=ไม่พอใจ, 2=พอใจ, 3=พอใจมาก)' AFTER `pdx_other`,
  ADD COLUMN `satisfaction_level` VARCHAR(50) DEFAULT NULL COMMENT 'ระดับความพึงพอใจ (ไม่พอใจ, พอใจ, พอใจมาก)' AFTER `satisfaction_score`,
  ADD COLUMN `satisfaction_note` TEXT DEFAULT NULL COMMENT 'ข้อเสนอแนะความพึงพอใจเพิ่มเติม' AFTER `satisfaction_level`;

-- ---------------------------------------------------------------------
-- ส่วนที่ 2: เพิ่มสิทธิ์รายงาน e-Claim ใน `tbl_permission` และ `tbl_role_permission`
-- ---------------------------------------------------------------------
INSERT INTO `tbl_permission` (`route_path`, `method`, `title`, `description`, `status`, `is_admin`)
SELECT '/api/report/report_eclaim', 'GET', 'รายงาน e-Claim', 'ดูรายงานข้อมูลบริการให้การปรึกษาสุขภาพจิต e-Claim', 1, 0
FROM DUAL
WHERE NOT EXISTS (
  SELECT 1 FROM `tbl_permission`
  WHERE `route_path` = '/api/report/report_eclaim' AND `method` = 'GET'
);

INSERT INTO `tbl_role_permission` (`role_id`, `permission_id`, `can_access`)
SELECT r.role_id, p.permission_id, 1
FROM (SELECT 1 AS role_id UNION SELECT 2 AS role_id) r
JOIN `tbl_permission` p
  ON p.`route_path` = '/api/report/report_eclaim' AND p.`method` = 'GET'
WHERE NOT EXISTS (
  SELECT 1 FROM `tbl_role_permission` rp
  WHERE rp.`role_id` = r.role_id AND rp.`permission_id` = p.`permission_id`
);

-- ---------------------------------------------------------------------
-- ส่วนที่ 3: เพิ่มคอลัมน์ citizen_id ใน `tbl_account` (สำหรับ ThaID ถ้ายังไม่มี)
-- ---------------------------------------------------------------------
-- ALTER TABLE `tbl_account` ADD COLUMN `citizen_id` VARCHAR(13) NULL UNIQUE AFTER `username`;
