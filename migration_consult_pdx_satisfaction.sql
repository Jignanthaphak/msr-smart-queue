-- Migration: เพิ่มคอลัมน์รหัส PDx และความพึงพอใจในตาราง consult
-- Database: jigwork

ALTER TABLE `consult`
  ADD COLUMN `pdx_codes` TEXT DEFAULT NULL COMMENT 'JSON Array ของรหัส PDx ที่เลือก เช่น ["Z73.0", "Z72.1"]' AFTER `follow_counseling_center_tel`,
  ADD COLUMN `pdx_no_check` INT DEFAULT NULL COMMENT '1 = ไม่พบรหัส PDx / ไม่มีรหัสที่เข้าเกณฑ์' AFTER `pdx_codes`,
  ADD COLUMN `pdx_other` VARCHAR(255) DEFAULT NULL COMMENT 'รหัส PDx อื่นๆ หรือรายละเอียดเพิ่มเติม' AFTER `pdx_no_check`,
  ADD COLUMN `satisfaction_score` INT(11) DEFAULT NULL COMMENT 'คะแนนความพึงพอใจ (1=ไม่พอใจ, 2=พอใจ, 3=พอใจมาก)' AFTER `pdx_other`,
  ADD COLUMN `satisfaction_level` VARCHAR(50) DEFAULT NULL COMMENT 'ระดับความพึงพอใจ (ไม่พอใจ, พอใจ, พอใจมาก)' AFTER `satisfaction_score`,
  ADD COLUMN `satisfaction_note` TEXT DEFAULT NULL COMMENT 'ข้อเสนอแนะความพึงพอใจเพิ่มเติม' AFTER `satisfaction_level`;

