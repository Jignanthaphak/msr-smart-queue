// /conponents/common/Navbar.js
"use client"
import Link from "next/link";
import { Stethoscope, FileText, MonitorCog, CalendarClock } from 'lucide-react';
export default function Navbar() {
  return (
    <>
       <nav className="navigation">
            <div className="nav-content">
                <Link href="/" className="nav-item">
               
                    <span className="show-in-modern">
                        <Stethoscope />
                    </span>
                    <span className="hide-in-modern">
                        🩺
                    </span>
                   การตรวจ
                </Link>
                <Link href="/report/report_excel" className="nav-item">
                    <span className="show-in-modern">
                        <FileText />
                    </span>
                    <span className="hide-in-modern">
                        📊
                    </span>
                    รายงาน Excel
                </Link>
                <Link href="/report/report_pdf" className="nav-item">
                
                    <span className="show-in-modern">
                        <FileText />
                    </span>
                    <span className="hide-in-modern">
                        📊
                    </span>
                   รายงาน PDF
                </Link>
                {/* ปิดเมนู "รายงาน ศูนย์ให้คำปรึกษา" ชั่วคราว (2026-07-26) — ไม่ได้ลบ เปิดคืนได้โดยเอาคอมเมนต์ออก
                <Link href="/report/report_counseling_center" className="nav-item">

                    <span className="show-in-modern">
                        <FileText />
                    </span>
                    <span className="hide-in-modern">
                        📊
                    </span>
                   รายงาน ศูนย์ให้คำปรึกษา
                </Link>
                */}
                <Link href="/report/report_appointment" className="nav-item">

                    <span className="show-in-modern">
                        <CalendarClock />
                    </span>
                    <span className="hide-in-modern">
                        📅
                    </span>
                   รายงาน ตารางนัดหมาย
                </Link>
                <Link href="/report/dashboard" className="nav-item">

                    <span className="show-in-modern">
                        <MonitorCog />
                    </span>
                    <span className="hide-in-modern">
                        📈
                    </span>
                   แดชบอร์ด
                </Link>
            </div>
        </nav>
    </>
  );
}