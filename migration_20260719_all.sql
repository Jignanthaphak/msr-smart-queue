-- =====================================================================
--  MIGRATION รวมงานวันที่ 2026-07-19 (รันทีเดียวจบ)
--  DB: jigwork
--  ปลอดภัยต่อการรันซ้ำ (idempotent) — ถ้ามีอยู่แล้วจะข้ามให้เอง
--
--  งานวันนี้:
--   1) follow_date (Consult) เพิ่มเวลาได้ -> ไม่มี DB change (คอลัมน์เป็น datetime อยู่แล้ว)
--   2) รายงานใหม่ "ตารางนัดหมาย" -> เพิ่มสิทธิ์เข้าถึง API route ใหม่
--   3) สถานะการติดตาม (โทรตามนัด) -> เพิ่ม 3 คอลัมน์ใน consult + สิทธิ์ route ปุ่มสิ้นสุดการติดตาม
--
--  วิธีรัน (ตัวอย่าง):
--    mysql -h <host> -u <user> -p jigwork < migration_20260719_all.sql
-- =====================================================================

-- ---------------------------------------------------------------------
-- ตาราง consult : เพิ่ม 3 คอลัมน์สำหรับ "สถานะการติดตาม" (ต่อท้าย follow_detail)
--   - follow_status      : 0 = รอติดตาม, 1 = สิ้นสุดการติดตาม
--   - follow_status_by   : user_id ของคนที่กดสิ้นสุดการติดตาม
--   - follow_status_date : เวลาที่กดสิ้นสุดการติดตาม
-- ---------------------------------------------------------------------
ALTER TABLE `consult`
  ADD COLUMN IF NOT EXISTS `follow_status` int(11) DEFAULT 0 AFTER `follow_detail`;

ALTER TABLE `consult`
  ADD COLUMN IF NOT EXISTS `follow_status_by` int(11) DEFAULT NULL AFTER `follow_status`;

ALTER TABLE `consult`
  ADD COLUMN IF NOT EXISTS `follow_status_date` datetime DEFAULT NULL AFTER `follow_status_by`;

-- ---------------------------------------------------------------------
-- สิทธิ์ (tbl_permission + tbl_role_permission)
--   เพิ่ม 1 สิทธิ์ แล้วผูกกับ role 1 & 2
--   - GET /api/report/report_appointment  (รายงาน ตารางนัดหมาย)
--   ไม่ผูก permission_id ตายตัว -> ใช้ NOT EXISTS กันซ้ำ (รันซ้ำได้)
-- ---------------------------------------------------------------------

-- 1) permission: report_appointment (GET)
INSERT INTO `tbl_permission` (`route_path`, `method`, `title`, `description`, `status`, `is_admin`)
SELECT '/api/report/report_appointment', 'GET', 'รายงาน ตารางนัดหมาย', 'ดูรายงานตารางนัดหมาย (consult follow_date)', 1, 0
FROM DUAL
WHERE NOT EXISTS (
  SELECT 1 FROM `tbl_permission`
  WHERE `route_path` = '/api/report/report_appointment' AND `method` = 'GET'
);

-- 2) ผูกสิทธิ์เข้ากับ role 1 และ 2 (ข้ามอันที่มีอยู่แล้ว)
INSERT INTO `tbl_role_permission` (`role_id`, `permission_id`, `can_access`)
SELECT r.role_id, p.permission_id, 1
FROM (SELECT 1 AS role_id UNION SELECT 2 AS role_id) r
JOIN `tbl_permission` p
  ON p.`route_path` = '/api/report/report_appointment' AND p.`method` = 'GET'
WHERE NOT EXISTS (
  SELECT 1 FROM `tbl_role_permission` rp
  WHERE rp.`role_id` = r.role_id AND rp.`permission_id` = p.`permission_id`
);

-- 3) permission: finish-follow (PATCH) — ปุ่มสิ้นสุดการติดตามในรายงาน
INSERT INTO `tbl_permission` (`route_path`, `method`, `title`, `description`, `status`, `is_admin`)
SELECT '/api/screening/consult/:screening_id/finish-follow', 'PATCH', 'สิ้นสุดการติดตาม', 'บันทึกสิ้นสุดการติดตามผู้ป่วยจากรายงานตารางนัดหมาย', 1, 0
FROM DUAL
WHERE NOT EXISTS (
  SELECT 1 FROM `tbl_permission`
  WHERE `route_path` = '/api/screening/consult/:screening_id/finish-follow' AND `method` = 'PATCH'
);

-- 4) ผูกสิทธิ์ finish-follow เข้ากับ role 1 และ 2 (ข้ามอันที่มีอยู่แล้ว)
INSERT INTO `tbl_role_permission` (`role_id`, `permission_id`, `can_access`)
SELECT r.role_id, p.permission_id, 1
FROM (SELECT 1 AS role_id UNION SELECT 2 AS role_id) r
JOIN `tbl_permission` p
  ON p.`route_path` = '/api/screening/consult/:screening_id/finish-follow' AND p.`method` = 'PATCH'
WHERE NOT EXISTS (
  SELECT 1 FROM `tbl_role_permission` rp
  WHERE rp.`role_id` = r.role_id AND rp.`permission_id` = p.`permission_id`
);

-- 5) permission: dashboard_summary (GET) + dashboard_ai (POST) — หน้าแดชบอร์ดสรุปผลคัดกรอง
INSERT INTO `tbl_permission` (`route_path`, `method`, `title`, `description`, `status`, `is_admin`)
SELECT '/api/report/dashboard_summary', 'GET', 'แดชบอร์ดคัดกรองสุขภาพจิต', 'ดูสรุปผลการคัดกรองสุขภาพจิต (รายพื้นที่)', 1, 0
FROM DUAL
WHERE NOT EXISTS (
  SELECT 1 FROM `tbl_permission`
  WHERE `route_path` = '/api/report/dashboard_summary' AND `method` = 'GET'
);

INSERT INTO `tbl_permission` (`route_path`, `method`, `title`, `description`, `status`, `is_admin`)
SELECT '/api/report/dashboard_ai', 'POST', 'ข้อเสนอแนะเชิงนโยบายจาก AI', 'วิเคราะห์ข้อเสนอแนะเชิงนโยบายจากสถิติแดชบอร์ด', 1, 0
FROM DUAL
WHERE NOT EXISTS (
  SELECT 1 FROM `tbl_permission`
  WHERE `route_path` = '/api/report/dashboard_ai' AND `method` = 'POST'
);

-- 6) ผูกสิทธิ์ dashboard ทั้ง 2 route เข้ากับ role 1 และ 2 (ข้ามอันที่มีอยู่แล้ว)
INSERT INTO `tbl_role_permission` (`role_id`, `permission_id`, `can_access`)
SELECT r.role_id, p.permission_id, 1
FROM (SELECT 1 AS role_id UNION SELECT 2 AS role_id) r
JOIN `tbl_permission` p
  ON (p.`route_path` = '/api/report/dashboard_summary' AND p.`method` = 'GET')
  OR (p.`route_path` = '/api/report/dashboard_ai' AND p.`method` = 'POST')
WHERE NOT EXISTS (
  SELECT 1 FROM `tbl_role_permission` rp
  WHERE rp.`role_id` = r.role_id AND rp.`permission_id` = p.`permission_id`
);


-- =====================================================================
-- ตรวจสอบผลหลังรัน (เอา comment ออกเพื่อรันดู)
-- =====================================================================
-- SELECT rp.role_id, p.route_path, p.method, rp.can_access
--   FROM tbl_role_permission rp JOIN tbl_permission p ON rp.permission_id = p.permission_id
--   WHERE p.route_path = '/api/report/report_appointment'
--   ORDER BY rp.role_id;
