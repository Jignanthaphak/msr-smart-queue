// components/admin/ai-dashboard/StatCards.js
"use client";
import {
  Sparkles, CheckCircle2, Timer, Hospital, Users, ClipboardList,
} from "lucide-react";

function Card({ title, value, subtitle, icon, bg = "primary-bg" }) {
  return (
    <div className="stats-card">
      <div className="stats-content">
        <div className="stats-info">
          <div className="stats-title">{title}</div>
          <div className="stats-value">{value}</div>
          {subtitle ? <div className="stats-subtitle">{subtitle}</div> : null}
        </div>
        <div className={`stats-icon ${bg}`}>{icon}</div>
      </div>
    </div>
  );
}

export default function StatCards({ summary }) {
  const s = summary || {};
  const total = Number(s.total) || 0;
  const success = Number(s.success) || 0;
  const error = Number(s.error) || 0;
  const successRate = total ? Math.round((success / total) * 100) : 0;
  const avgSec = s.avg_duration_ms ? (Number(s.avg_duration_ms) / 1000).toFixed(1) : "-";

  return (
    <div className="ai-stat-grid" style={{ marginBottom: "1.5rem" }}>
      <Card
        title="เรียกใช้ AI ทั้งหมด"
        value={total.toLocaleString()}
        subtitle={`สำเร็จ ${success} · ล้มเหลว ${error}`}
        icon={<Sparkles size={22} />}
        bg="primary-bg"
      />
      <Card
        title="อัตราสำเร็จ"
        value={`${successRate}%`}
        subtitle={`${success}/${total} ครั้ง`}
        icon={<CheckCircle2 size={22} />}
        bg="success-bg"
      />
      <Card
        title="เวลาตอบสนองเฉลี่ย"
        value={avgSec === "-" ? "-" : `${avgSec} วิ`}
        subtitle={s.max_duration_ms ? `สูงสุด ${(Number(s.max_duration_ms) / 1000).toFixed(1)} วิ` : ""}
        icon={<Timer size={22} />}
        bg="accent-bg"
      />
      <Card
        title="ค้นหา รพ. (ส่งต่อ)"
        value={(Number(s.grounding) || 0).toLocaleString()}
        subtitle="ครั้งที่ใช้ Google Search"
        icon={<Hospital size={22} />}
        bg="emergency-bg"
      />
      <Card
        title="ผู้ใช้ AI"
        value={(Number(s.unique_users) || 0).toLocaleString()}
        subtitle="จำนวนเจ้าหน้าที่"
        icon={<Users size={22} />}
        bg="accent-bg"
      />
      <Card
        title="เคสที่วิเคราะห์"
        value={(Number(s.unique_screenings) || 0).toLocaleString()}
        subtitle="จำนวนเคส (ไม่ซ้ำ)"
        icon={<ClipboardList size={22} />}
        bg="primary-bg"
      />
    </div>
  );
}
