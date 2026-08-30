// components/admin/ai-dashboard/charts/ChartCards.js
"use client";
import {
  ResponsiveContainer,
  AreaChart, Area,
  BarChart, Bar,
  PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend,
} from "recharts";
import { PALETTE } from "../theme";

const axisStyle = { fontSize: 12, fill: "hsl(215, 16%, 47%)" };
const gridStroke = "hsl(220, 13%, 91%)";

// การ์ดครอบกราฟ (ใช้ .card / .card-header / .card-title / .card-content จาก globals.css)
export function ChartCard({ title, icon, children, height = 300, empty }) {
  return (
    <div className="card">
      <div className="card-header">
        <div className="card-title" style={{ marginBottom: "0.75rem" }}>
          {icon} {title}
        </div>
      </div>
      <div className="card-content">
        {empty ? (
          <div style={{ height, display: "flex", alignItems: "center", justifyContent: "center", color: "hsl(215,16%,47%)" }}>
            ไม่มีข้อมูลในช่วงที่เลือก
          </div>
        ) : (
          <div style={{ width: "100%", height }}>
            <ResponsiveContainer width="100%" height="100%">
              {children}
            </ResponsiveContainer>
          </div>
        )}
      </div>
    </div>
  );
}

// กราฟพื้นที่รายวัน (total + error)
export function TrendChart({ data }) {
  return (
    <AreaChart data={data} margin={{ top: 10, right: 20, left: -10, bottom: 0 }}>
      <defs>
        <linearGradient id="gTotal" x1="0" y1="0" x2="0" y2="1">
          <stop offset="5%" stopColor={PALETTE[0]} stopOpacity={0.5} />
          <stop offset="95%" stopColor={PALETTE[0]} stopOpacity={0} />
        </linearGradient>
      </defs>
      <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} />
      <XAxis dataKey="d" tick={axisStyle} tickFormatter={(v) => String(v).slice(5)} />
      <YAxis tick={axisStyle} allowDecimals={false} />
      <Tooltip />
      <Legend />
      <Area type="monotone" dataKey="total" name="เรียกใช้" stroke={PALETTE[0]} fill="url(#gTotal)" strokeWidth={2} />
      <Area type="monotone" dataKey="error" name="ล้มเหลว" stroke={PALETTE[5]} fill="none" strokeWidth={2} />
    </AreaChart>
  );
}

// กราฟแท่ง (แนวตั้ง/แนวนอน)
export function SimpleBar({ data, dataKey = "value", nameKey = "name", horizontal = false, colorFn }) {
  if (horizontal) {
    return (
      <BarChart data={data} layout="vertical" margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} horizontal={false} />
        <XAxis type="number" tick={axisStyle} allowDecimals={false} />
        <YAxis type="category" dataKey={nameKey} tick={axisStyle} width={140} />
        <Tooltip />
        <Bar dataKey={dataKey} name="จำนวน" radius={[0, 4, 4, 0]}>
          {data.map((e, i) => (
            <Cell key={i} fill={colorFn ? colorFn(e, i) : PALETTE[i % PALETTE.length]} />
          ))}
        </Bar>
      </BarChart>
    );
  }
  return (
    <BarChart data={data} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
      <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} vertical={false} />
      <XAxis dataKey={nameKey} tick={axisStyle} />
      <YAxis tick={axisStyle} allowDecimals={false} />
      <Tooltip />
      <Bar dataKey={dataKey} name="จำนวน" radius={[4, 4, 0, 0]}>
        {data.map((e, i) => (
          <Cell key={i} fill={colorFn ? colorFn(e, i) : PALETTE[i % PALETTE.length]} />
        ))}
      </Bar>
    </BarChart>
  );
}

// กราฟวงกลม / โดนัท
export function SimplePie({ data, donut = false, colorFn }) {
  return (
    <PieChart>
      <Pie
        data={data}
        dataKey="value"
        nameKey="name"
        cx="50%"
        cy="50%"
        innerRadius={donut ? 60 : 0}
        outerRadius={95}
        paddingAngle={2}
        label={(e) => `${e.name}: ${e.value}`}
        labelLine={false}
      >
        {data.map((e, i) => (
          <Cell key={i} fill={colorFn ? colorFn(e, i) : PALETTE[i % PALETTE.length]} />
        ))}
      </Pie>
      <Tooltip />
      <Legend />
    </PieChart>
  );
}
