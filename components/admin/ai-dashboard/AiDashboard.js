"use client";
import "@ant-design/v5-patch-for-react-19";
import { useState } from "react";
import { DatePicker, Select, Button, Space, Table } from "antd";
import dayjs from "dayjs";
import { Activity, TrendingUp, PieChart as PieIcon, BarChart3, Users, Clock, AlertTriangle, Cpu } from "lucide-react";
import { date } from "@/lib/utils/dateFormat";
import { useAlert } from "@/lib/utils/useAlert";
import { getaistats } from "@/services/report";
import StatCards from "./StatCards";
import { ChartCard, TrendChart, SimpleBar, SimplePie } from "./charts/ChartCards";
import {
  STATUS_COLORS, RISK_COLORS, ACTION_COLORS, PALETTE,
  STATUS_LABEL, RISK_LABEL, ACTION_LABEL, C,
} from "./theme";

const { Option } = Select;

export default function AiDashboard() {
  const { showAlert, AlertComponent } = useAlert();

  const [startdate, setStartDate] = useState(date);
  const [enddate, setEndDate] = useState(date);
  const [status, setStatus] = useState("");
  const [model, setModel] = useState("");
  const [modelOptions, setModelOptions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState(null);

  const handleSearch = async () => {
    try {
      setLoading(true);
      await showAlert({ title: "กำลังโหลดข้อมูล", icon: "loading", type: "loading", duration: 400, loadingStyle: "modal", allowOutsideClick: false, allowEscapeKey: false, allowEnterKey: false });

      const params = new URLSearchParams();
      params.append("startdate", startdate);
      params.append("enddate", enddate);
      if (status) params.append("status", status);
      if (model) params.append("model", model);

      const result = await getaistats(params.toString());
      if (result?.ok && result?.data) {
        setData(result.data);
        if (Array.isArray(result.data.modelOptions)) setModelOptions(result.data.modelOptions);
      }
    } catch (err) {
      await showAlert({ title: "เกิดข้อผิดพลาด", message: err.message, type: "alert", icon: "error" });
    } finally {
      setLoading(false);
    }
  };

  // ---------- เตรียมข้อมูลสำหรับกราฟ (map label ไทย) ----------
  const d = data || {};
  const total = Number(d.summary?.total) || 0;

  const statusData = (d.byStatus || []).map((r) => ({ name: STATUS_LABEL[r.name] || r.name, key: r.name, value: Number(r.value) }));
  const riskData = (d.byRisk || []).map((r) => ({ name: RISK_LABEL[r.name] || r.name, key: r.name, value: Number(r.value) }));
  const actionData = (d.byAction || []).map((r) => ({ name: ACTION_LABEL[r.name] || r.name, key: r.name, value: Number(r.value) }));
  const modelData = (d.byModel || []).map((r) => ({ name: r.name, value: Number(r.value) }));
  const userData = (d.byUser || []).map((r) => ({ name: r.name, value: Number(r.value) }));
  const hourData = (d.byHour || []).map((r) => ({ name: `${String(r.hour).padStart(2, "0")}:00`, value: Number(r.value) }));
  const durationData = d.durationBuckets || [];
  const dailyData = (d.daily || []).map((r) => ({ d: r.d, total: Number(r.total), error: Number(r.error) }));

  const errorColumns = [
    { title: "เวลา", dataIndex: "create_date", key: "create_date", width: 170, render: (v) => (v ? dayjs(v).format("YYYY-MM-DD HH:mm:ss") : "-") },
    { title: "HN", dataIndex: "hn", key: "hn", width: 100, render: (v) => v || "-" },
    { title: "ข้อความ error", dataIndex: "error_message", key: "error_message", render: (v) => v || "-" },
  ];

  return (
    <div style={{ padding: "0.5rem" }}>
      <h1 style={{ fontSize: "1.5rem", fontWeight: 700, marginBottom: "1rem", display: "flex", alignItems: "center", gap: 8 }}>
        <Activity color={C.primary} /> สถิติการใช้งาน AI
      </h1>

      {/* Filter bar */}
      <fieldset className="flex flex-col w-full mb-6 p-4 border rounded-box bg-base-200 border-base-300">
        <legend className="fieldset-legend text-[18px]">ตัวกรอง</legend>
        <Space wrap className="w-full gap-4">
          <div>
            <label className="block text-sm">เริ่ม</label>
            <DatePicker value={startdate ? dayjs(startdate) : null} onChange={(_, ds) => setStartDate(ds)} format="YYYY-MM-DD" allowClear />
          </div>
          <div>
            <label className="block text-sm">สิ้นสุด</label>
            <DatePicker value={enddate ? dayjs(enddate) : null} onChange={(_, ds) => setEndDate(ds)} format="YYYY-MM-DD" allowClear />
          </div>
          <div>
            <label className="block text-sm">สถานะ</label>
            <Select value={status || ""} onChange={setStatus} style={{ width: 150 }}>
              <Option value="">ทั้งหมด</Option>
              <Option value="success">สำเร็จ</Option>
              <Option value="error">ล้มเหลว</Option>
            </Select>
          </div>
          <div>
            <label className="block text-sm">โมเดล</label>
            <Select value={model || ""} onChange={setModel} style={{ width: 200 }}>
              <Option value="">ทั้งหมด</Option>
              {modelOptions.map((m) => (
                <Option key={m} value={m}>{m}</Option>
              ))}
            </Select>
          </div>
          <div style={{ alignSelf: "flex-end" }}>
            <Button type="primary" onClick={handleSearch} loading={loading}>ค้นหา</Button>
          </div>
        </Space>
      </fieldset>

      {!data ? (
        <div style={{ textAlign: "center", color: "hsl(215,16%,47%)", padding: "3rem" }}>
          เลือกช่วงวันที่แล้วกด "ค้นหา" เพื่อดูสถิติ
        </div>
      ) : total === 0 ? (
        <div style={{ textAlign: "center", color: "hsl(215,16%,47%)", padding: "3rem" }}>
          ไม่มีข้อมูลการใช้งาน AI ในช่วงที่เลือก
        </div>
      ) : (
        <>
          <StatCards summary={d.summary} />

          {/* แถวกราฟ 1: แนวโน้มรายวัน (กว้าง) */}
          <div style={{ marginBottom: "1.5rem" }}>
            <ChartCard title="การใช้งานรายวัน" icon={<TrendingUp size={18} />} height={300} empty={dailyData.length === 0}>
              <TrendChart data={dailyData} />
            </ChartCard>
          </div>

          {/* แถวกราฟ 2: 3 คอลัมน์ */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "1.5rem", marginBottom: "1.5rem" }}>
            <ChartCard title="สถานะการเรียกใช้" icon={<PieIcon size={18} />} empty={statusData.length === 0}>
              <SimplePie data={statusData} donut colorFn={(e) => STATUS_COLORS[e.key] || PALETTE[0]} />
            </ChartCard>
            <ChartCard title="ระดับความเสี่ยงที่ AI ประเมิน" icon={<PieIcon size={18} />} empty={riskData.length === 0}>
              <SimplePie data={riskData} colorFn={(e) => RISK_COLORS[e.key] || PALETTE[0]} />
            </ChartCard>
            <ChartCard title="ผลการแนะนำ (Action)" icon={<BarChart3 size={18} />} empty={actionData.length === 0}>
              <SimpleBar data={actionData} colorFn={(e) => ACTION_COLORS[e.key] || PALETTE[0]} />
            </ChartCard>
          </div>

          {/* แถวกราฟ 3: 3 คอลัมน์ */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "1.5rem", marginBottom: "1.5rem" }}>
            <ChartCard title="ผู้ใช้ AI สูงสุด (Top 10)" icon={<Users size={18} />} empty={userData.length === 0}>
              <SimpleBar data={userData} horizontal />
            </ChartCard>
            <ChartCard title="ช่วงเวลาที่ใช้งาน (รายชั่วโมง)" icon={<Clock size={18} />} empty={hourData.length === 0}>
              <SimpleBar data={hourData} />
            </ChartCard>
            <ChartCard title="เวลาตอบสนอง" icon={<Clock size={18} />} empty={durationData.every((x) => !x.value)}>
              <SimpleBar data={durationData} />
            </ChartCard>
          </div>

          {/* แถวกราฟ 4: โมเดล + ตาราง error */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "1.5rem" }}>
            <ChartCard title="โมเดลที่ใช้" icon={<Cpu size={18} />} empty={modelData.length === 0}>
              <SimplePie data={modelData} donut />
            </ChartCard>
            <div className="card" style={{ gridColumn: "span 2", minWidth: 0 }}>
              <div className="card-header">
                <div className="card-title" style={{ marginBottom: "0.75rem" }}>
                  <AlertTriangle size={18} /> ข้อผิดพลาดล่าสุด
                </div>
              </div>
              <div className="card-content" style={{ overflowX: "auto" }}>
                <Table
                  size="small"
                  rowKey={(r, i) => i}
                  columns={errorColumns}
                  dataSource={d.recentErrors || []}
                  pagination={{ pageSize: 5 }}
                  locale={{ emptyText: "ไม่มีข้อผิดพลาด 🎉" }}
                />
              </div>
            </div>
          </div>
        </>
      )}

      {AlertComponent}
    </div>
  );
}
