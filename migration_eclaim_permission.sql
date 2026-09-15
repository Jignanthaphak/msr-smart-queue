-- ---------------------------------------------------------------------
-- สิทธิ์ (tbl_permission + tbl_role_permission) สำหรับรายงาน e-Claim
-- ---------------------------------------------------------------------

-- 1) permission: report_eclaim (GET)
INSERT INTO `tbl_permission` (`route_path`, `method`, `title`, `description`, `status`, `is_admin`)
SELECT '/api/report/report_eclaim', 'GET', 'รายงาน e-Claim', 'ดูรายงานข้อมูลบริการให้การปรึกษาสุขภาพจิต e-Claim', 1, 0
FROM DUAL
WHERE NOT EXISTS (
  SELECT 1 FROM `tbl_permission`
  WHERE `route_path` = '/api/report/report_eclaim' AND `method` = 'GET'
);

-- 2) ผูกสิทธิ์เข้ากับ role 1 (Admin) และ 2 (User)
INSERT INTO `tbl_role_permission` (`role_id`, `permission_id`, `can_access`)
SELECT r.role_id, p.permission_id, 1
FROM (SELECT 1 AS role_id UNION SELECT 2 AS role_id) r
JOIN `tbl_permission` p
  ON p.`route_path` = '/api/report/report_eclaim' AND p.`method` = 'GET'
WHERE NOT EXISTS (
  SELECT 1 FROM `tbl_role_permission` rp
  WHERE rp.`role_id` = r.role_id AND rp.`permission_id` = p.`permission_id`
);
