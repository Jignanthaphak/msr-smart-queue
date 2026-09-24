'use client';
import { useState, useEffect, useCallback } from 'react';
import {
  Sparkles, X, Maximize2, Minimize2, User, ShieldAlert,
  Send, ClipboardCheck, MessageSquareText, Hospital, RefreshCw, CheckCircle2, Quote
} from 'lucide-react';
import { analyzeConsultAI } from '@/services/screening/aiAnalyze';

// 9 ตัวเลือกการให้ความช่วยเหลือ (ต้องตรงกับ ASSIST_OPTIONS ฝั่ง server)
const ASSIST_OPTIONS = [
  "การจัดการความเครียด",
  "เทคนิคคลายเครียด",
  "การปฐมพยาบาลทางใจเบื้องต้น (PFA)",
  "การปรับเปลี่ยนมุมมองและทัศนคติ",
  "การฝึกหายใจคลายเครียด",
  "การให้คำปรึกษาเบื้องต้น",
  "การนอนหลับ",
  "การออกกำลังกาย",
  "อื่นๆ",
];

// map ระดับความเสี่ยง -> สี/มุมเข็ม
const RISK_META = {
  low: { label: "เสี่ยงต่ำ", en: "Low", color: "#10b981", angle: -50 },
  moderate: { label: "เสี่ยงปานกลาง", en: "Moderate", color: "#f59e0b", angle: 0 },
  high: { label: "เสี่ยงสูง", en: "High", color: "#ef4444", angle: 50 },
};

const ACTION_META = {
  normal: { label: "ปกติ", cls: "bg-emerald-50 border-emerald-200 text-emerald-700", dot: "bg-emerald-500" },
  watch: { label: "เฝ้าระวัง", cls: "bg-amber-50 border-amber-200 text-amber-700", dot: "bg-amber-500" },
  refer: { label: "ส่งต่อ", cls: "bg-red-50 border-red-200 text-red-700", dot: "bg-red-500" },
};

function RiskGauge({ riskLevel }) {
  const meta = RISK_META[riskLevel] || RISK_META.moderate;
  return (
    <div className="flex flex-col items-center">
      <span className="text-lg font-bold" style={{ color: meta.color }}>{meta.label}</span>
      <span className="text-xs text-slate-400 mb-1">({meta.en})</span>
      <svg viewBox="0 0 200 120" className="w-44 overflow-visible">
        <path d="M20,100 A80,80 0 0,1 58.8,31.4" fill="none" stroke="#10b981" strokeWidth="16" />
        <path d="M61.2,30 A80,80 0 0,1 138.8,30" fill="none" stroke="#f59e0b" strokeWidth="16" />
        <path d="M141.2,31.4 A80,80 0 0,1 180,100" fill="none" stroke="#ef4444" strokeWidth="16" />
        <circle cx="100" cy="100" r="10" fill="#64748b" />
        <circle cx="100" cy="100" r="4" fill="#f8fafc" />
        <g style={{ transformOrigin: '100px 100px', transform: `rotate(${meta.angle}deg)`, transition: 'transform 1s ease' }}>
          <polygon points="97,100 103,100 100,28" fill="#475569" />
        </g>
      </svg>
      <div className="flex justify-between w-48 -mt-1 text-[10px] font-semibold px-1">
        <span className="text-emerald-500">เสี่ยงต่ำ</span>
        <span className="text-amber-500">ปานกลาง</span>
        <span className="text-red-500">เสี่ยงสูง</span>
      </div>
    </div>
  );
}

function Card({ icon, title, children, className = '' }) {
  return (
    <section className={`bg-white/80 border border-blue-100 rounded-2xl shadow-sm overflow-hidden flex flex-col ${className}`}>
      <div className="px-4 py-3 bg-gradient-to-r from-blue-100/60 to-blue-100/20 border-b border-blue-100 text-sm font-bold text-blue-800 flex items-center gap-2">
        {icon}{title}
      </div>
      <div className="p-4 flex-grow">{children}</div>
    </section>
  );
}

export default function AiAnalysisModal({ isOpen, onClose, screeningId, consultData }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [data, setData] = useState(null);
  const [meta, setMeta] = useState(null);
  const [maximized, setMaximized] = useState(false);

  const runAnalyze = useCallback(async (isForce = false) => {
    if (!screeningId) return;
    setLoading(true);
    setError("");
    setData(null);
    setMeta(null);
    try {
      const res = await analyzeConsultAI(screeningId, consultData || {}, isForce);
      if (res?.ok) {
        setData(res.data);
        setMeta(res.meta);
      } else {
        setError(res?.error || "ไม่สามารถวิเคราะห์ได้");
      }
    } catch (e) {
      setError(e?.message || "เกิดข้อผิดพลาดในการวิเคราะห์");
    } finally {
      setLoading(false);
    }
  }, [screeningId, consultData]);

  useEffect(() => {
    if (isOpen) runAnalyze(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  if (!isOpen) return null;

  const action = data ? (ACTION_META[data.actionType] || ACTION_META.watch) : null;
  const assistsSet = new Set(data?.assists || []);

  return (
    <div className={`fixed inset-0 z-[9999] flex justify-center items-center bg-black/50 backdrop-blur-sm transition-all ${maximized ? 'p-0' : 'p-4'}`}>
      <div className={`bg-gradient-to-br from-slate-50 to-blue-50 flex flex-col shadow-2xl border-t-4 border-purple-600 transition-all ${maximized ? 'w-full h-full rounded-none' : 'max-w-6xl w-full max-h-[92vh] rounded-2xl'}`}>

        {/* Header */}
        <div className="flex justify-between items-center px-6 py-4 border-b border-blue-100">
          <h3 className="text-xl font-bold text-purple-700 flex items-center gap-2">
            <Sparkles className="w-6 h-6" />
            ระบบวิเคราะห์ข้อมูล AI (Gemini)
          </h3>
          <div className="flex items-center gap-1">
            <button type="button" onClick={() => runAnalyze(true)} disabled={loading}
              className="text-slate-400 hover:text-purple-700 p-2 rounded-lg hover:bg-slate-100 disabled:opacity-40 flex items-center gap-1"
              title="วิเคราะห์อีกครั้ง">
              <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
            </button>
            <button type="button" onClick={() => setMaximized(!maximized)}
              className="text-slate-400 hover:text-purple-700 p-2 rounded-lg hover:bg-slate-100"
              title={maximized ? "ย่อหน้าต่าง" : "ขยายเต็มจอ"}>
              {maximized ? <Minimize2 className="w-5 h-5" /> : <Maximize2 className="w-5 h-5" />}
            </button>
            <button type="button" onClick={onClose} disabled={loading}
              className="text-slate-400 hover:text-red-600 p-2 rounded-lg hover:bg-slate-100 disabled:opacity-40"
              title="ปิด">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="flex-grow overflow-y-auto p-5">

          {loading && (
            <div className="flex flex-col items-center justify-center h-full min-h-[400px] gap-4 text-slate-500">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-700"></div>
              <span className="animate-pulse">AI กำลังวิเคราะห์ข้อมูล โปรดรอสักครู่...</span>
            </div>
          )}

          {!loading && error && (
            <div className="flex flex-col items-center justify-center h-full min-h-[400px] gap-3 text-red-600">
              <ShieldAlert className="w-10 h-10" />
              <span className="font-semibold">{error}</span>
              <button onClick={() => runAnalyze(true)} className="mt-2 bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 text-sm">
                ลองใหม่อีกครั้ง
              </button>
            </div>
          )}

          {!loading && !error && data && (
            <div className="grid grid-cols-1 lg:grid-cols-[320px_1fr] gap-4">

              {/* ซ้าย */}
              <div className="flex flex-col gap-4">
                {/* การ์ด 1: ข้อมูลนิรนาม */}
                <Card icon={<User className="w-4 h-4" />} title="ข้อมูลผู้รับบริการ (นิรนาม)">
                  <ul className="flex flex-col gap-2 text-[13px]">
                    <InfoRow label="Case ID" value={meta?.caseId} />
                    <InfoRow label="เพศ" value={meta?.sex} />
                    <InfoRow label="อายุ" value={meta?.age ? `${meta.age} ปี` : "-"} />
                    <InfoRow label="หน่วยงาน (จังหวัด)" value={meta?.orgProvince || "-"} />
                    <InfoRow label="ที่อยู่ (จังหวัด)" value={meta?.addressProvince || "-"} />
                    <InfoRow label="วันที่บันทึก" value={meta?.recordedAt || "-"} />
                    <InfoRow label="ผู้บันทึก" value={meta?.recordedBy || "-"} />
                  </ul>
                  <div className="mt-3 text-[11px] text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-md px-2 py-1 flex items-center gap-1">
                    <ShieldAlert className="w-3.5 h-3.5" /> ข้อมูลนี้เป็นข้อมูลนิรนาม (ตัดข้อมูลส่วนบุคคลออกก่อนวิเคราะห์)
                  </div>
                </Card>

                {/* การ์ด 4: การให้ความช่วยเหลือ */}
                <Card icon={<ClipboardCheck className="w-4 h-4" />} title="การให้ความช่วยเหลือ (AI แนะนำ)">
                  <div className="flex flex-col gap-1.5">
                    {ASSIST_OPTIONS.map((opt) => {
                      const checked = assistsSet.has(opt);
                      return (
                        <div key={opt} className={`flex items-center gap-2 px-2.5 py-1.5 rounded-md border text-[13px] ${checked ? 'bg-purple-50 border-purple-200 text-purple-800 font-medium' : 'bg-white/40 border-slate-200 text-slate-500'}`}>
                          {checked
                            ? <CheckCircle2 className="w-4 h-4 text-purple-600 shrink-0" />
                            : <span className="w-4 h-4 rounded border border-slate-300 shrink-0" />}
                          <span>{opt}</span>
                        </div>
                      );
                    })}
                    {data.assistOther && (
                      <div className="mt-1 text-[12px] text-slate-600 bg-slate-50 border border-slate-200 rounded-md px-2 py-1">
                        อื่นๆ: {data.assistOther}
                      </div>
                    )}
                  </div>
                </Card>
              </div>

              {/* ขวา */}
              <div className="flex flex-col gap-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* การ์ด 2: ความเสี่ยง */}
                  <Card icon={<ShieldAlert className="w-4 h-4" />} title="การประเมินความเสี่ยง">
                    <div className="flex flex-col gap-3">
                      <RiskGauge riskLevel={data.riskLevel} />
                      <div className="text-[13px] text-slate-600 bg-blue-50/50 border border-dashed border-blue-200 rounded-lg p-3 leading-relaxed">
                        {data.riskAnalysis || "-"}
                      </div>
                    </div>
                  </Card>

                  {/* การ์ด 3: คำแนะนำและการส่งต่อ */}
                  <Card icon={<Send className="w-4 h-4" />} title="คำแนะนำและการส่งต่อ">
                    <div className="flex flex-col gap-3">
                      <div className={`rounded-xl border px-4 py-3 flex items-center gap-2 font-bold ${action.cls}`}>
                        <span className={`w-3 h-3 rounded-full ${action.dot}`} />
                        {action.label}
                      </div>

                      {data.actionType === 'refer' && data.referral && (
                        <div className="flex flex-col gap-2 text-[12px]">
                          <ReferralList
                            title={`โรงพยาบาลที่มีแผนกจิตเวช ในจังหวัด ${data.referral.orgProvince || '-'} (หน่วยงาน)`}
                            items={data.referral.hospitalsByOrgProvince}
                          />
                          {data.referral.addressProvince &&
                            data.referral.addressProvince !== data.referral.orgProvince && (
                            <ReferralList
                              title={`โรงพยาบาลที่มีแผนกจิตเวช ในจังหวัด ${data.referral.addressProvince} (ที่อยู่)`}
                              items={data.referral.hospitalsByAddressProvince}
                            />
                          )}
                          {data.referral.error && (
                            <div className="text-amber-600">{data.referral.error}</div>
                          )}
                          <div className="text-[11px] text-slate-400 italic mt-1">
                            * รายชื่อจาก AI ควรตรวจสอบความถูกต้องก่อนส่งต่อจริง
                          </div>
                        </div>
                      )}
                    </div>
                  </Card>
                </div>

                {/* การ์ด 5: ข้อเสนอแนะ AI */}
                <Card icon={<MessageSquareText className="w-4 h-4" />} title="ข้อเสนอแนะการให้คำปรึกษาจาก AI">
                  <p className="text-[13px] text-slate-700 leading-relaxed whitespace-pre-line">
                    {data.aiSuggestion || "-"}
                  </p>

                  {Array.isArray(data.counselingExamples) && data.counselingExamples.length > 0 && (
                    <div className="mt-4">
                      <div className="flex items-center gap-1.5 text-[12px] font-bold text-purple-700 mb-2">
                        <Quote className="w-3.5 h-3.5" />
                        ตัวอย่างคำพูดการให้คำปรึกษา (นักจิตวิทยาคลินิก)
                      </div>
                      <ul className="flex flex-col gap-2">
                        {data.counselingExamples.map((ex, i) => (
                          <li key={i} className="text-[13px] text-slate-700 bg-purple-50/60 border-l-4 border-purple-300 rounded-r-md px-3 py-2 leading-relaxed italic">
                            “{ex}”
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </Card>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-blue-100 flex justify-end">
          <button type="button" onClick={onClose} disabled={loading}
            className="bg-slate-800 text-white px-8 py-2 rounded-lg hover:bg-slate-700 disabled:opacity-40 font-bold text-sm">
            ปิดหน้าต่าง
          </button>
        </div>
      </div>
    </div>
  );
}

function InfoRow({ label, value }) {
  return (
    <li className="flex items-center gap-2">
      <span className="font-semibold text-slate-700 whitespace-nowrap">{label}:</span>
      <span className="text-blue-600 bg-blue-500/5 px-1.5 py-0.5 rounded w-full truncate">{value ?? "-"}</span>
    </li>
  );
}

function ReferralList({ title, items }) {
  return (
    <div>
      <div className="font-semibold text-slate-700 mb-1">{title}</div>
      {Array.isArray(items) && items.length > 0 ? (
        <ul className="flex flex-col gap-1">
          {items.map((h, i) => (
            <li key={i} className="flex items-start gap-1.5 text-slate-600">
              <Hospital className="w-3.5 h-3.5 text-blue-500 mt-0.5 shrink-0" />
              <span>{h.name}{h.note ? ` — ${h.note}` : ''}</span>
            </li>
          ))}
        </ul>
      ) : (
        <div className="text-slate-400">ไม่พบรายชื่อโรงพยาบาล</div>
      )}
    </div>
  );
}
