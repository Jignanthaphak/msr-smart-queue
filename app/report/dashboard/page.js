"use client"
import { useState } from "react";
import clientConfig from "@/config/Client";
import useDefaultDataStore from "@/stores/useDefaultDataStore";
import { getdashboardsummary, getdashboardai } from "@/services/report";
import Swal from 'sweetalert2';
import '@ant-design/v5-patch-for-react-19';
import { Select, Button, Space, Form, Spin } from "antd";
import { Sparkles } from 'lucide-react';
import {
  ResponsiveContainer, PieChart, Pie, Cell, Tooltip, Legend,
  BarChart, Bar, XAxis, YAxis, CartesianGrid, LabelList,
} from "recharts";

const { Option } = Select;

const COLOR = { normal: "#1f9d55", risk: "#f4c20d", high: "#e23b3b" };
const NAVY = "#16305c";
const IMG = `${clientConfig.base_path}/images/dashboard`;

// แผนที่ชื่อแถว -> รูปเอกลักษณ์
const PROV_IMG = {
  "ปทุมธานี": `${IMG}/prov/pathumthani.png`,
  "นนทบุรี": `${IMG}/prov/nonthaburi.png`,
  "พระนครศรีอยุธยา": `${IMG}/prov/ayutthaya.png`,
  "อ่างทอง": `${IMG}/prov/angthong.png`,
  "สิงห์บุรี": `${IMG}/prov/singburi.png`,
  "ลพบุรี": `${IMG}/prov/lopburi.png`,
  "สระบุรี": `${IMG}/prov/saraburi.png`,
  "นครนายก": `${IMG}/prov/nakhonnayok.png`,
  "นอกเขตสุขภาพ/ประชากรแฝง": `${IMG}/prov/outside.png`,
};

// รูปที่พื้นหลังเป็นสีเข้มเต็มจัตุรัส — ต้องซูมแล้วครอบวงกลม ให้เหลือเฉพาะตัวไอคอน (ไม่งั้นจะเป็นสี่เหลี่ยมดำ)
// 0.60 = สัดส่วนเส้นผ่านศูนย์กลางของวงไอคอน เทียบกับความกว้างไฟล์ต้นฉบับ
const CIRCLE_CROP = { "นอกเขตสุขภาพ/ประชากรแฝง": 0.6 };

const AXIS_WIDTH = 210;
const ICON = 42; // ขนาดกล่องไอคอนบนแกน Y — เท่ากันทุกแถว
// ตราจังหวัดเป็นโล่ที่มีขอบขาวรอบๆ ส่วนไอคอนวงกลมเต็มกรอบพอดี ถ้าใช้ขนาดเดียวกันวงกลมจะดูใหญ่กว่า จึงย่อลงอีกนิด
const CIRCLE_SCALE = 0.72;

// donut ภาพรวม — cy กำหนดเป็น px ตายตัว เพื่อให้ข้อความตรงกลางล็อกตำแหน่งกับวงได้แน่นอน
// ขนาดคุมไว้ให้ความสูงการ์ดใกล้เคียงกับการ์ดกราฟรายพื้นที่ (9 แถว × 56px) จะได้ไม่มีช่องว่างเหลือข้างใดข้างหนึ่ง
const DONUT_BOX = 405;
const DONUT_CY = 187;
const DONUT_R_IN = 102;
const DONUT_R_OUT = 155;

// YAxis tick แบบมีรูปเอกลักษณ์จังหวัด (ชื่อยาวที่มี "/" ตัดเป็น 2 บรรทัด)
// NOTE: totals ใช้วาดเลข "0" ให้แถวที่ไม่มีข้อมูล เพราะ Recharts ไม่ render LabelList ให้แท่งที่กว้างเป็นศูนย์
function ProvinceTick({ x, y, payload, totals }) {
  const name = payload?.value ?? "";
  const img = PROV_IMG[name];
  const lines = name.includes("/") ? name.split("/").map((s, i) => (i === 0 ? `${s}/` : s)) : [name];
  const iconX = -(AXIS_WIDTH - 26);
  const textX = img ? iconX + ICON + 8 : -8;
  const dy0 = lines.length > 1 ? -2 : 4;

  // รูปที่ต้องครอบวงกลม: ขยายรูปแล้ว clip เป็นวงกลม โดยจัดให้ศูนย์กลางตรงกับกล่องไอคอน
  const crop = CIRCLE_CROP[name];
  const cx = iconX + ICON / 2;
  const diameter = ICON * CIRCLE_SCALE;
  const size = crop ? diameter / crop : ICON;
  const clipId = crop ? `provclip-${Math.round(x)}-${Math.round(y)}` : null;

  return (
    <g transform={`translate(${x},${y})`}>
      {img && crop && (
        <>
          <defs>
            <clipPath id={clipId}>
              <circle cx={cx} cy={0} r={diameter / 2} />
            </clipPath>
          </defs>
          <image
            href={img}
            x={cx - size / 2}
            y={-size / 2}
            width={size}
            height={size}
            clipPath={`url(#${clipId})`}
            preserveAspectRatio="xMidYMid meet"
          />
        </>
      )}
      {img && !crop && (
        <image href={img} x={iconX} y={-ICON / 2} width={ICON} height={ICON} preserveAspectRatio="xMidYMid meet" />
      )}
      <text x={textX} y={0} textAnchor={img ? "start" : "end"} fontSize={15} fill="#374151">
        {lines.map((ln, i) => (
          <tspan key={i} x={textX} dy={i === 0 ? dy0 : 17}>{ln}</tspan>
        ))}
      </text>
      {totals?.[name] === 0 && (
        <text x={8} y={0} dy={5} textAnchor="start" fontSize={14} fill="#6b7280">0</text>
      )}
    </g>
  );
}

// Tooltip กราฟรายพื้นที่: ชื่อจังหวัด + จำนวนคนรวม แล้วแยกแต่ละระดับพร้อม %
function ProvinceTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  const row = payload[0]?.payload || {};
  const total = Number(row.total) || 0;
  const percent = (v) => (total > 0 ? `${Math.round((v * 1000) / total) / 10}%` : "0%");
  const levels = [
    { key: "normal", name: "ปกติ", color: COLOR.normal },
    { key: "risk", name: "เสี่ยง", color: COLOR.risk },
    { key: "high", name: "เสี่ยงสูง", color: COLOR.high },
  ];
  return (
    <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 10, padding: "10px 14px", boxShadow: "0 4px 14px rgba(0,0,0,.12)" }}>
      <div className="font-bold text-lg mb-2" style={{ color: NAVY }}>
        {label} <span className="font-normal text-gray-500">{total.toLocaleString()} คน</span>
      </div>
      {levels.map((lv) => {
        const v = Number(row[lv.key]) || 0;
        return (
          <div key={lv.key} className="flex items-center gap-2 text-base leading-7">
            <span className="inline-block rounded-sm shrink-0" style={{ width: 13, height: 13, background: lv.color }} />
            <span style={{ color: lv.color }}>{lv.name} :</span>
            <span className="text-gray-700">{v.toLocaleString()} คน</span>
            <span className="text-gray-500">{percent(v)}</span>
          </div>
        );
      })}
    </div>
  );
}

// Tooltip กราฟโดนัท: สถานะ + จำนวนคน + % ของภาพรวม
function DonutTooltip({ active, payload, total }) {
  if (!active || !payload?.length) return null;
  const p = payload[0];
  const value = Number(p?.value) || 0;
  const color = p?.payload?.color || NAVY;
  const pct = total > 0 ? Math.round((value * 1000) / total) / 10 : 0;
  return (
    <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 10, padding: "8px 14px", boxShadow: "0 4px 14px rgba(0,0,0,.12)" }}>
      <div className="flex items-center gap-2 text-base">
        <span className="inline-block rounded-sm shrink-0" style={{ width: 13, height: 13, background: color }} />
        <span className="font-bold" style={{ color }}>{p?.name} :</span>
        <span className="text-gray-700">{value.toLocaleString()} คน</span>
        <span className="text-gray-500">({pct}%)</span>
      </div>
    </div>
  );
}

export default function DashboardScreening() {

  const defaultData = useDefaultDataStore((state) => state.defaultData);

  const [organization_id, setOrganizationId] = useState("");

  const [loading, setLoading] = useState(false);
  const [data, setData] = useState(null);
  const [searched, setSearched] = useState(false);

  const [aiLoading, setAiLoading] = useState(false);
  const [recommendations, setRecommendations] = useState([]);

  const filterOption = (input, option) => {
    const label = (option?.children ?? "").toString().toLowerCase();
    return label.includes(input.toLowerCase());
  };

  const fetchAi = async (stats) => {
    setAiLoading(true);
    setRecommendations([]);
    try {
      const res = await getdashboardai({ stats });
      if (res?.ok && Array.isArray(res.recommendations)) setRecommendations(res.recommendations);
      else setRecommendations([]);
    } catch (err) {
      setRecommendations([{ title: "ไม่สามารถวิเคราะห์ด้วย AI ได้", detail: err?.message || "" }]);
    } finally {
      setAiLoading(false);
    }
  };

  const handleSearch = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.append("organization_id", organization_id);
      const res = await getdashboardsummary(params.toString());
      if (res?.ok && res?.data) {
        setData(res.data);
        setSearched(true);
        fetchAi(res.data);
      } else { setData(null); setSearched(true); }
    } catch (err) {
      setData(null); setSearched(true);
      Swal.fire('เกิดข้อผิดพลาด!', err?.message || 'โหลดข้อมูลไม่สำเร็จ', 'error');
    } finally { setLoading(false); }
  };

  const provinces = data?.byProvince || [];
  // ยอดรวมรายจังหวัด ส่งให้ tick ไว้วาดเลข "0" ในแถวที่ยังไม่มีข้อมูล
  const totalByProvince = Object.fromEntries(provinces.map((r) => [r.province, r.total]));

  const donutData = data ? [
    { name: "ปกติ", value: data.overall?.normal || 0, color: COLOR.normal },
    { name: "เสี่ยง", value: data.overall?.risk || 0, color: COLOR.risk },
    { name: "เสี่ยงสูง", value: data.overall?.high || 0, color: COLOR.high },
  ] : [];

  // ---------- คำอธิบายกราฟโดนัท (คิดจากข้อมูลจริง ไม่ใช่ข้อความตายตัว) ----------
  const donutTotal = donutData.reduce((s, d) => s + d.value, 0);
  const donutPct = (v) => (donutTotal > 0 ? Math.round((v * 1000) / donutTotal) / 10 : 0);
  const topLevel = donutData.reduce((a, b) => (b.value > a.value ? b : a), donutData[0] || { name: "", value: 0 });
  // ข้อความ + สี ของหัวข้อสรุป เปลี่ยนตามระดับที่มีคนมากที่สุด (ใช้สีเดียวกับกราฟ)
  const donutSummary =
    donutTotal === 0
      ? { text: "ยังไม่มีผลตรวจ Biofeedback ในเงื่อนไขที่เลือก", color: "#9ca3af" }
      : topLevel.name === "ปกติ"
      ? { text: "สภาวะสุขภาพจิตส่วนใหญ่อยู่ในเกณฑ์ปกติ", color: COLOR.normal }
      : topLevel.name === "เสี่ยง"
      ? { text: "สภาวะสุขภาพจิตส่วนใหญ่อยู่ในเกณฑ์เสี่ยง", color: COLOR.risk }
      : { text: "สภาวะสุขภาพจิตส่วนใหญ่อยู่ในเกณฑ์เสี่ยงสูง", color: COLOR.high };

  const aiImgs = [`${IMG}/icon-enterprise.png`, `${IMG}/icon-geospatial.png`];

  return (
    <div className="w-full" style={{ flex: 1, background: "linear-gradient(180deg,#e8f0f9 0%,#f3f7fc 55%,#eef4fb 100%)", minHeight: "100%", borderRadius: 16 }}>
      <div className="mx-auto px-5 py-6" style={{ maxWidth: 1800 }}>

        {/* หัวเรื่อง */}
        <div className="flex items-center justify-center gap-4 mb-6">
          <img src={`${IMG}/icon-title.png`} alt="" style={{ width: 72, height: 72, objectFit: "contain", mixBlendMode: "multiply" }} />
          <div className="text-center">
            <h1 className="font-extrabold"
                style={{ color: NAVY, fontSize: "clamp(22px,2.7vw,36px)", letterSpacing: "-.3px", lineHeight: 1.2 }}>
              ระบบสนับสนุนการตัดสินใจอัจฉริยะ{" "}
              {/* 0.6em = เล็กกว่าหัวข้อ และย่อ-ขยายตามหัวข้อเองเมื่อจอเปลี่ยนขนาด */}
              <span className="font-semibold text-gray-500" style={{ fontSize: "0.6em", letterSpacing: 0 }}>
                (Intelligent Decision Support System)
              </span>
            </h1>
            <p className="text-gray-500 mt-1" style={{ fontSize: "clamp(14px,1.2vw,19px)" }}>
              แสดงสถิติสภาวะสุขภาพจิตภาพรวมของผู้รับบริการในเขตสุขภาพที่ 4 ผ่านแผนภูมิสารสนเทศ
            </p>
          </div>
        </div>

        {/* ฟิลเตอร์ */}
        <div className="mb-6">
          <Form layout="vertical">
            <Space wrap size="middle" className="w-full justify-center">
              <Select showSearch placeholder="-- หน่วยงาน --" value={organization_id || undefined}
                onChange={(v) => setOrganizationId(v ?? "")} style={{ minWidth: 260 }} allowClear
                optionFilterProp="children" filterOption={filterOption}>
                <Option value={""}>-- หน่วยงานทั้งหมด --</Option>
                {defaultData?.organizations?.map((org) => (
                  <Option key={org.organization_id} value={org.organization_id}>{org.title_th}</Option>
                ))}
              </Select>
              <Button type="primary" size="large" onClick={handleSearch} loading={loading}>ค้นหา</Button>
            </Space>
          </Form>
        </div>

        {!searched ? (
          <div className="text-center text-gray-400 text-lg py-16 bg-white rounded-2xl shadow-sm">
            เลือกเงื่อนไขแล้วกด "ค้นหา" เพื่อแสดงแดชบอร์ด
          </div>
        ) : !data ? (
          <div className="text-center text-gray-400 text-lg py-16 bg-white rounded-2xl shadow-sm">ไม่พบข้อมูล</div>
        ) : (
          <>
            {/* การ์ดสรุป 3 ใบ */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-5">
              <InfoCard img={`${IMG}/icon-total.png`}
                title={`ผู้รับบริการสะสมทั้งหมด ${(data.total || 0).toLocaleString()} คน`}
                desc="จำนวนประชากรในเขตสุขภาพที่ 4 ที่เข้าถึงบริการคัดกรองผ่านระบบ Mental Health Screening Record" />
              <InfoCard img={`${IMG}/icon-risk.png`}
                title={`กลุ่มเสี่ยงสูงร้อยละ ${data.highRiskPercent ?? 0}`}
                desc={`สัดส่วนผู้รับบริการที่ AI วิเคราะห์ว่าอยู่ในระดับ "สีแดง" ซึ่งจำเป็นต้องได้รับการดูแลอย่างใกล้ชิด (${(data.highRiskCount || 0).toLocaleString()} คน)`} />
              <InfoCard img={`${IMG}/icon-refer.png`}
                title={`ส่งต่อผู้เชี่ยวชาญ ${(data.forwardCount || 0).toLocaleString()} คน`}
                desc="จำนวนผู้รับบริการที่มีสภาวะวิกฤตและได้รับการส่งต่อไปยังสถานพยาบาลตามคำแนะนำของระบบ" />
            </div>

            {/* 2 พาเนล */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-5">

              {/* กราฟแท่ง diverging รายจังหวัด */}
              <div className="bg-white rounded-2xl shadow-sm p-6">
                <h3 className="text-center font-bold text-2xl" style={{ color: NAVY }}>สถิติสภาวะสุขภาพจิตรายพื้นที่</h3>
                <p className="text-center text-gray-500 mb-4 text-base">การจำแนกความเสี่ยงรายจังหวัด</p>

                <div style={{ width: "100%", height: Math.max(340, provinces.length * 56) }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart layout="vertical" data={provinces} margin={{ top: 5, right: 48, left: 10, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                      <XAxis type="number" allowDecimals={false} tick={{ fontSize: 14 }} />
                      <YAxis type="category" dataKey="province" width={AXIS_WIDTH} tick={<ProvinceTick totals={totalByProvince} />} interval={0} />
                      <Tooltip content={<ProvinceTooltip />} cursor={{ fill: "rgba(22,48,92,.06)" }} />
                      <Legend wrapperStyle={{ fontSize: 16 }} />
                      <Bar dataKey="normal" stackId="a" name="ปกติ" fill={COLOR.normal}>
                        <LabelList dataKey="normal" position="center" fill="#fff" fontSize={13} formatter={(v) => (v ? v : "")} />
                      </Bar>
                      <Bar dataKey="risk" stackId="a" name="เสี่ยง" fill={COLOR.risk}>
                        <LabelList dataKey="risk" position="center" fill="#333" fontSize={13} formatter={(v) => (v ? v : "")} />
                      </Bar>
                      <Bar dataKey="high" stackId="a" name="เสี่ยงสูง" fill={COLOR.high}>
                        <LabelList dataKey="high" position="center" fill="#fff" fontSize={13} formatter={(v) => (v ? v : "")} />
                        {/* ยอดรวมท้ายแท่ง — แสดงทุกแถวรวมถึงจังหวัดที่ยังไม่มีข้อมูล (เห็นเลข 0) */}
                        <LabelList dataKey="total" position="right" fill="#6b7280" fontSize={14} />
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Donut ภาพรวม */}
              <div className="bg-white rounded-2xl shadow-sm p-6">
                {/* เรียงกึ่งกลางจากบนลงล่าง: หัวข้อ -> โดนัท -> คำอธิบาย */}
                <h3 className="text-center font-bold text-2xl mb-3" style={{ color: NAVY }}>สัดส่วนระดับความเสี่ยงภาพรวม</h3>
                <div style={{ position: "relative", width: "100%", height: DONUT_BOX }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={donutData} dataKey="value" nameKey="name" cx="50%" cy={DONUT_CY}
                        innerRadius={DONUT_R_IN} outerRadius={DONUT_R_OUT} paddingAngle={2} startAngle={90} endAngle={-270}>
                        {donutData.map((e, i) => <Cell key={i} fill={e.color} stroke="#fff" strokeWidth={2} />)}
                      </Pie>
                      {/* zIndex ต้องสูงกว่ากล่องข้อความตรงกลางโดนัท ไม่งั้น tooltip จะไปอยู่ใต้ไอคอน AI */}
                      <Tooltip content={<DonutTooltip total={donutTotal} />} wrapperStyle={{ zIndex: 20 }} />
                      <Legend wrapperStyle={{ fontSize: 16 }} />
                    </PieChart>
                  </ResponsiveContainer>
                  {/* center — ล็อกตำแหน่งให้ตรงกับ cy ของ donut */}
                  <div style={{ position: "absolute", top: DONUT_CY, left: 0, right: 0, transform: "translateY(-50%)", textAlign: "center", pointerEvents: "none", zIndex: 1 }}>
                    <div className="flex justify-center mb-1">
                      <img src={`${IMG}/icon-donut-ai.png`} alt="" style={{ width: 96, height: 96, objectFit: "contain" }} />
                    </div>
                    <div className="font-bold" style={{ color: NAVY, lineHeight: 1.15, fontSize: 18 }}>ภาพรวม<br/>สุขภาพจิต</div>
                  </div>
                </div>
                <div className="text-center mx-auto mt-4" style={{ maxWidth: 780 }}>
                  <div className="font-bold text-xl mb-1" style={{ color: donutSummary.color }}>{donutSummary.text}</div>
                  <div className="text-gray-600 text-base leading-relaxed">
                    <div>
                      จากผู้รับบริการที่มีผลตรวจ Biofeedback ทั้งหมด{" "}
                      <b style={{ color: NAVY }}>{donutTotal.toLocaleString()} คน</b>
                    </div>
                    <div>
                      แบ่งเป็นกลุ่ม <span style={{ color: COLOR.normal }}>ปกติ</span> {(data.overall?.normal || 0).toLocaleString()} คน ({donutPct(data.overall?.normal || 0)}%) ·{" "}
                      <span style={{ color: COLOR.risk }}>เสี่ยง</span> {(data.overall?.risk || 0).toLocaleString()} คน ({donutPct(data.overall?.risk || 0)}%) ·{" "}
                      <span style={{ color: COLOR.high }}>เสี่ยงสูง</span> {(data.overall?.high || 0).toLocaleString()} คน ({donutPct(data.overall?.high || 0)}%)
                    </div>
                    <div>ซึ่งเป็นกลุ่มที่ควรได้รับการติดตามและส่งต่อผู้เชี่ยวชาญ</div>
                  </div>
                </div>
              </div>
            </div>

            {/* ข้อเสนอแนะเชิงนโยบายจาก AI */}
            <div className="bg-white rounded-2xl shadow-sm p-6">
              <h3 className="text-center font-bold text-2xl mb-5 flex items-center justify-center gap-2" style={{ color: NAVY }}>
                <Sparkles size={24} /> ข้อเสนอแนะเชิงนโยบายจาก AI
              </h3>
              {aiLoading ? (
                <div className="text-center py-8 text-gray-500 text-lg"><Spin /> <span className="ml-2">กำลังวิเคราะห์ด้วย AI...</span></div>
              ) : recommendations.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {recommendations.map((r, i) => (
                    <div key={i} className="flex gap-4">
                      <img src={aiImgs[i % aiImgs.length]} alt="" className="shrink-0 self-start" style={{ width: 104, height: 104, objectFit: "contain" }} />
                      <div>
                        <div className="font-bold text-lg mb-1" style={{ color: NAVY }}>{r.title}</div>
                        <div className="text-base text-gray-600 leading-relaxed">{r.detail}</div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center text-gray-400 text-lg py-4">ไม่มีข้อเสนอแนะ</div>
              )}
            </div>
          </>
        )}

      </div>
    </div>
  );
}

function InfoCard({ img, title, desc }) {
  return (
    <div className="bg-white rounded-2xl shadow-sm p-5 flex gap-4 items-center">
      <img src={img} alt="" className="shrink-0" style={{ width: 112, height: 112, objectFit: "contain" }} />
      <div>
        <div className="font-bold text-lg mb-1" style={{ color: "#1f2937" }}>{title}</div>
        <div className="text-sm text-gray-500 leading-relaxed">{desc}</div>
      </div>
    </div>
  );
}

function LegendDot({ color, label }) {
  return (
    <span className="flex items-center gap-1.5">
      <span className="inline-block rounded-sm" style={{ width: 14, height: 14, background: color }} />
      <span className="text-gray-700">{label}</span>
    </span>
  );
}
