-- =====================================================================
--  MIGRATION รวมงานวันที่ 2026-07-05 (รันทีเดียวจบ)
--  DB: jigwork
--  ปลอดภัยต่อการรันซ้ำ (idempotent) — ถ้าบางส่วนมีอยู่แล้วจะข้ามให้เอง
--  รองรับ MySQL 8.0+ / MariaDB 10.2+ (ใช้ ADD COLUMN IF NOT EXISTS)
--
--  วิธีรัน (ตัวอย่าง):
--    mysql -h <host> -u <user> -p jigwork < migration_20260705_all.sql
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1) ตาราง consult : เพิ่ม 3 คอลัมน์
--    - stress_colleague : สาเหตุความเครียด "หัวหน้างาน/เพื่อนร่วมงาน"
--    - ai_analysis      : เก็บผลวิเคราะห์ AI (JSON string)
--    - ai_analyzed_at   : เวลาที่วิเคราะห์ล่าสุด
-- ---------------------------------------------------------------------
ALTER TABLE `consult`
  ADD COLUMN IF NOT EXISTS `stress_colleague` int(11) DEFAULT NULL AFTER `stress_work`;

ALTER TABLE `consult`
  ADD COLUMN IF NOT EXISTS `ai_analysis` longtext DEFAULT NULL;

ALTER TABLE `consult`
  ADD COLUMN IF NOT EXISTS `ai_analyzed_at` datetime DEFAULT NULL;


-- ---------------------------------------------------------------------
-- 2) ตาราง ai_analysis_logs : เก็บ log การเรียกใช้ AI ทุกครั้ง
--    (ใช้เป็นแหล่งข้อมูลของหน้า /admin/ai-dashboard)
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `ai_analysis_logs` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `screening_id` int(11) DEFAULT NULL,
  `hn` varchar(50) DEFAULT NULL,
  `create_by` int(11) DEFAULT NULL,
  `session_id` varchar(255) DEFAULT NULL,
  `model` varchar(100) DEFAULT NULL,
  `grounding_used` tinyint(1) DEFAULT NULL,
  `request_payload` longtext DEFAULT NULL,
  `request_prompt` longtext DEFAULT NULL,
  `response_raw` longtext DEFAULT NULL,
  `response_parsed` longtext DEFAULT NULL,
  `risk_level` varchar(20) DEFAULT NULL,
  `action_type` varchar(20) DEFAULT NULL,
  `status` varchar(20) DEFAULT NULL,
  `error_message` varchar(500) DEFAULT NULL,
  `duration_ms` int(11) DEFAULT NULL,
  `source_file` varchar(255) DEFAULT NULL,
  `create_date` datetime DEFAULT current_timestamp(),
  PRIMARY KEY (`id`) USING BTREE,
  KEY `idx_screening_id` (`screening_id`),
  KEY `idx_create_by` (`create_by`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;


-- ---------------------------------------------------------------------
-- 3) สิทธิ์ (tbl_permission + tbl_role_permission)
--    เพิ่ม 2 สิทธิ์ แล้วผูกกับ role 1 & 2 (แอดมิน)
--    - POST /api/screening/consult/ai-analyze  (ปุ่มวิเคราะห์ AI ในแท็บ Consult)
--    - GET  /api/report/ai_stats               (หน้า /admin/ai-dashboard)
--    ไม่ผูก permission_id ตายตัว -> ใช้ NOT EXISTS กันซ้ำ (รันซ้ำได้)
-- ---------------------------------------------------------------------

-- 3.1 permission: ai-analyze (POST)
INSERT INTO `tbl_permission` (`route_path`, `method`, `title`, `description`, `status`, `is_admin`)
SELECT '/api/screening/consult/ai-analyze', 'POST', 'วิเคราะห์ด้วย AI (Consult)', 'วิเคราะห์ Consult ด้วย AI จาก screening', 1, 0
FROM DUAL
WHERE NOT EXISTS (
  SELECT 1 FROM `tbl_permission`
  WHERE `route_path` = '/api/screening/consult/ai-analyze' AND `method` = 'POST'
);

-- 3.2 permission: ai_stats (GET)
INSERT INTO `tbl_permission` (`route_path`, `method`, `title`, `description`, `status`, `is_admin`)
SELECT '/api/report/ai_stats', 'GET', 'สถิติการใช้ AI', 'ดูสถิติการใช้งาน AI (ai_analysis_logs)', 1, 0
FROM DUAL
WHERE NOT EXISTS (
  SELECT 1 FROM `tbl_permission`
  WHERE `route_path` = '/api/report/ai_stats' AND `method` = 'GET'
);

-- 3.3 ผูกทั้ง 2 สิทธิ์เข้ากับ role 1 และ 2 (ข้ามอันที่มีอยู่แล้ว)
INSERT INTO `tbl_role_permission` (`role_id`, `permission_id`, `can_access`)
SELECT r.role_id, p.permission_id, 1
FROM (SELECT 1 AS role_id UNION SELECT 2 AS role_id) r
JOIN `tbl_permission` p
  ON p.`route_path` IN ('/api/screening/consult/ai-analyze', '/api/report/ai_stats')
WHERE NOT EXISTS (
  SELECT 1 FROM `tbl_role_permission` rp
  WHERE rp.`role_id` = r.role_id AND rp.`permission_id` = p.`permission_id`
);


-- =====================================================================
-- ตรวจสอบผลหลังรัน (เอา comment ออกเพื่อรันดู)
-- =====================================================================
-- SHOW COLUMNS FROM `consult` LIKE 'stress_colleague';
-- SHOW COLUMNS FROM `consult` LIKE 'ai_analy%';
-- SHOW TABLES LIKE 'ai_analysis_logs';
-- SELECT rp.role_id, p.route_path, p.method, rp.can_access
--   FROM tbl_role_permission rp JOIN tbl_permission p ON rp.permission_id = p.permission_id
--   WHERE p.route_path IN ('/api/screening/consult/ai-analyze', '/api/report/ai_stats')
--   ORDER BY p.route_path, rp.role_id;
