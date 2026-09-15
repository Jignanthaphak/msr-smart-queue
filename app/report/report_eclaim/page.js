"use client";

import { useState, useEffect, useMemo } from "react";
import useDefaultDataStore from "@/stores/useDefaultDataStore";
import useAuthStore from "@/stores/useAuthStore";
import { getreporteclaim } from "@/services/report";
import { PDX_GROUPS } from "@/hooks/useConsultFormPdx";
import Swal from "sweetalert2";
import { saveAs } from "file-saver";
import ExcelJS from "exceljs";
import "@ant-design/v5-patch-for-react-19";
import { DatePicker, Select, Button, Space, Input, Card } from "antd";
import { Search, Download, Eye, Building2, User, Mail, ShieldCheck } from "lucide-react";
import dayjs from "dayjs";
import ModalHistoryScreening from "@/components/monitor/HistoryScreening/ModalHistoryScreening";

const { Option } = Select;

export default function ReportEClaim() {
  const currentUser = useAuthStore((state) => state.user);
  const defaultData = useDefaultDataStore((state) => state.defaultData);

  const today = new Date().toISOString().slice(0, 10);
  const [startdate, setStartDate] = useState(today);
  const [enddate, setEndDate] = useState(today);

  // ฟิลเตอร์
  const [organization_id, setOrganizationId] = useState("");
  const [healthcare_right_id, setHealthcareRightId] = useState("");
  const [pdx_code, setPdxCode] = useState("");
  const [follow_type, setFollowType] = useState("");
  const [satisfaction_level, setSatisfactionLevel] = useState("");

  // ข้อมูลส่วนบนก่อนถึงตาราง
  const [responsiblePerson, setResponsiblePerson] = useState("");

  const [disableBtnSearch, setDisableBtnSearch] = useState(false);
  const [dataSearch, setDataSearch] = useState([]);
  const [searched, setSearched] = useState(false);

  // Modal ดูรายละเอียด
  const [dataViewModal, setDataViewModal] = useState({ isOpenModal: false, screeningId: null });

  // ดึงชื่อผู้รับผิดชอบเริ่มต้นจากผู้ใช้ที่เข้าสู่ระบบ
  useEffect(() => {
    if (currentUser?.nickname) {
      setResponsiblePerson(currentUser.nickname);
    } else if (currentUser?.username) {
      setResponsiblePerson(currentUser.username);
    }
  }, [currentUser]);

  // รายการรหัส PDx ทั้งหมดจาก 7 กลุ่ม
  const allPdxItems = useMemo(() => {
    return PDX_GROUPS.flatMap((group) => group.items);
  }, []);

  // แปลงวันที่เป็น พ.ศ. (DD/MM/YYYY) เช่น 02/02/2569
  const formatServiceDate = (dateStr) => {
    if (!dateStr) return "-";
    const d = dayjs(dateStr);
    if (!d.isValid()) return "-";
    const thaiYear = d.year() + 543;
    return `${d.format("DD/MM")}/${thaiYear}`;
  };

  // ดึงรหัส/ชื่อบริการ PDx
  const formatPdx = (item) => {
    if (Number(item?.pdx_no_check) === 1) return "ไม่พบรหัส PDx";
    let code = null;
    if (item?.pdx_codes) {
      if (Array.isArray(item.pdx_codes)) {
        code = item.pdx_codes[0];
      } else if (typeof item.pdx_codes === "string") {
        try {
          const arr = JSON.parse(item.pdx_codes);
          if (Array.isArray(arr) && arr.length > 0) code = arr[0];
          else code = item.pdx_codes;
        } catch {
          code = item.pdx_codes;
        }
      }
    }
    if (!code && item?.pdx_other) {
      return item.pdx_other;
    }
    if (!code) return "-";

    const found = allPdxItems.find((p) => p.code === code);
    return found ? found.label : code;
  };

  // ดึงเฉพาะรหัส PDx สำหรับ Export Excel
  const formatPdxCodeOnly = (item) => {
    if (Number(item?.pdx_no_check) === 1) return "";
    let code = null;
    if (item?.pdx_codes) {
      if (Array.isArray(item.pdx_codes)) {
        code = item.pdx_codes[0];
      } else if (typeof item.pdx_codes === "string") {
        try {
          const arr = JSON.parse(item.pdx_codes);
          if (Array.isArray(arr) && arr.length > 0) code = arr[0];
          else code = item.pdx_codes;
        } catch {
          code = item.pdx_codes;
        }
      }
    }
    if (!code && item?.pdx_other) {
      code = item.pdx_other;
    }
    if (!code) return "";
    return String(code).split(":")[0].trim();
  };

  // ดึงผลการให้บริการ (การติดตาม / ส่งต่อ)
  // ปกติ (1), เฝ้าระวัง (2), ส่งต่อ (4) -> ยุติการปรึกษา
  // นัดหมาย (3) -> นัดติดตามต่อ
  const formatFollow = (item) => {
    const followId = Number(item?.follow_id);
    if (followId === 1 || followId === 2 || followId === 4) {
      return "ยุติการปรึกษา";
    }
    if (followId === 3) {
      return "นัดติดตามต่อ";
    }
    return "";
  };

  // ดึงผลการประเมินความพึงพอใจ (ระดับเท่านั้น ไม่ใส่ข้อเสนอแนะ)
  const formatSatisfaction = (item) => {
    return item?.satisfaction_level || "";
  };

  // ค้นหาข้อมูล
  const handleSearch = async (e) => {
    if (e && e.preventDefault) e.preventDefault();

    Swal.fire({
      title: "กำลังค้นหาข้อมูล...",
      didOpen: () => {
        Swal.showLoading();
      },
      allowOutsideClick: false,
      allowEscapeKey: false,
      showConfirmButton: false,
    });

    setDisableBtnSearch(true);

    try {
      const params = new URLSearchParams();
      if (startdate) params.append("startdate", startdate);
      if (enddate) params.append("enddate", enddate);
      if (organization_id) params.append("organization_id", organization_id);
      if (healthcare_right_id) params.append("healthcare_right_id", healthcare_right_id);
      if (pdx_code) params.append("pdx_code", pdx_code);
      if (follow_type) params.append("follow_type", follow_type);
      if (satisfaction_level) params.append("satisfaction_level", satisfaction_level);

      const result = await getreporteclaim(params.toString());

      if (result?.ok && Array.isArray(result.data)) {
        setDataSearch(result.data);
        setSearched(true);
        Swal.close();
      } else {
        setDataSearch([]);
        setSearched(true);
        Swal.fire({
          title: "ไม่พบข้อมูล",
          text: result?.error || "ไม่พบข้อมูลตามเงื่อนไขที่เลือก",
          icon: "info",
          confirmButtonText: "ตกลง",
        });
      }
    } catch (err) {
      Swal.fire({
        title: "เกิดข้อผิดพลาด!",
        text: err?.message || "ไม่สามารถดึงข้อมูลได้",
        icon: "error",
        confirmButtonText: "ตกลง",
      });
    } finally {
      setDisableBtnSearch(false);
    }
  };

  // ส่งออกไฟล์ Excel
  const exportExcel = async () => {
    if (!dataSearch || dataSearch.length === 0) {
      Swal.fire("แจ้งเตือน", "ไม่มีข้อมูลสำหรับ Export Excel", "warning");
      return;
    }

    const workbook = new ExcelJS.Workbook();
    const ws = workbook.addWorksheet("e-Claim");

    // กำหนดความกว้างคอลัมน์ A ถึง H
    ws.columns = [
      { key: "no", width: 8 },
      { key: "idcard", width: 22 },
      { key: "service_date", width: 18 },
      { key: "service_unit", width: 26 },
      { key: "pdx", width: 45 },
      { key: "follow", width: 35 },
      { key: "satisfaction", width: 22 },
      { key: "note", width: 18 },
    ];

    // แถวที่ 1: หัวข้อหน่วยงาน
    ws.mergeCells("A1:H1");
    const r1 = ws.getCell("A1");
    r1.value = "หน่วยงาน : ศูนย์สุขภาพจิตที่ 4";
    r1.font = { name: "TH SarabunPSK", size: 16, bold: true };
    r1.alignment = { vertical: "middle", horizontal: "left" };
    ws.getRow(1).height = 28;

    // แถวที่ 2: ผู้รับผิดชอบ
    ws.mergeCells("A2:H2");
    const r2 = ws.getCell("A2");
    r2.value = `ผู้รับผิดชอบ : ${responsiblePerson || ""}`;
    r2.font = { name: "TH SarabunPSK", size: 16 };
    r2.alignment = { vertical: "middle", horizontal: "left" };
    ws.getRow(2).height = 26;

    // แถวที่ 3: ช่องทางติดต่อกลับ
    ws.mergeCells("A3:H3");
    const r3 = ws.getCell("A3");
    r3.value = "ช่องทางติดต่อกลับ : mhcr4@dmh.mail.go.th";
    r3.font = { name: "TH SarabunPSK", size: 16 };
    r3.alignment = { vertical: "middle", horizontal: "left" };
    ws.getRow(3).height = 26;

    // แถวที่ 4 & 5: เว้นว่าง
    ws.getRow(4).height = 14;
    ws.getRow(5).height = 14;

    // แถวที่ 6: หัวคอลัมน์เริ่มที่แถวที่ 6
    const headers = [
      "No.",
      "ID 13 หลักผู้รับบริการ",
      "วันที่รับบริการ (Service date)",
      "หน่วยบริการ",
      "รายการบริการให้การปรึกษาสุขภาพจิต (รหัส PDx)",
      "ผลการให้บริการ (การติดตาม / ส่งต่อ)",
      "ผลการประเมินความพึงพอใจ (ของผู้รับบริการ)",
      "หมายเหตุ",
    ];

    const headerRow = ws.getRow(6);
    headerRow.height = 36;

    headers.forEach((title, idx) => {
      const cell = headerRow.getCell(idx + 1);
      cell.value = title;
      cell.font = { name: "TH SarabunPSK", size: 16, bold: true, color: { argb: "FFFFFFFF" } };
      cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF2E7D32" } }; // สีเขียวสุขภาพ
      cell.alignment = { vertical: "middle", horizontal: "center", wrapText: true };
      cell.border = {
        top: { style: "thin", color: { argb: "FFCCCCCC" } },
        left: { style: "thin", color: { argb: "FFCCCCCC" } },
        bottom: { style: "thin", color: { argb: "FFCCCCCC" } },
        right: { style: "thin", color: { argb: "FFCCCCCC" } },
      };
    });

    // แถวที่ 7 เป็นต้นไป: ข้อมูล
    dataSearch.forEach((item, idx) => {
      const rowIndex = 7 + idx;
      const row = ws.getRow(rowIndex);
      row.height = 26;

      // 1. No.
      const cellA = row.getCell(1);
      cellA.value = idx + 1;
      cellA.alignment = { vertical: "middle", horizontal: "center" };

      // 2. ID 13 หลัก (ตั้งค่าเป็น text)
      const cellB = row.getCell(2);
      cellB.value = item?.idcard ? String(item.idcard) : "";
      cellB.numFmt = "@";
      cellB.alignment = { vertical: "middle", horizontal: "center" };

      // 3. วันที่รับบริการ
      const cellC = row.getCell(3);
      cellC.value = formatServiceDate(item?.service_date || item?.consult_create_date);
      cellC.alignment = { vertical: "middle", horizontal: "center" };

      // 4. หน่วยบริการ
      const cellD = row.getCell(4);
      cellD.value = "ศูนย์สุขภาพจิตที่ 4";
      cellD.alignment = { vertical: "middle", horizontal: "center" };

      // 5. รายการบริการ PDx (ใส่เฉพาะรหัส)
      const cellE = row.getCell(5);
      cellE.value = formatPdxCodeOnly(item);
      cellE.alignment = { vertical: "middle", horizontal: "center" };

      // 6. ผลการให้บริการ (การติดตาม/ส่งต่อ)
      const cellF = row.getCell(6);
      cellF.value = formatFollow(item);
      cellF.alignment = { vertical: "middle", horizontal: "center" };

      // 7. ความพึงพอใจ
      const cellG = row.getCell(7);
      cellG.value = formatSatisfaction(item);
      cellG.alignment = { vertical: "middle", horizontal: "center" };

      // 8. หมายเหตุ
      const cellH = row.getCell(8);
      cellH.value = "";
      cellH.alignment = { vertical: "middle", horizontal: "left" };

      // สไตล์เส้นขอบและฟอนต์ทุกเซลล์ในแถว
      for (let c = 1; c <= 8; c++) {
        const cell = row.getCell(c);
        cell.font = { name: "TH SarabunPSK", size: 16 };
        cell.border = {
          top: { style: "thin", color: { argb: "FFE0E0E0" } },
          left: { style: "thin", color: { argb: "FFE0E0E0" } },
          bottom: { style: "thin", color: { argb: "FFE0E0E0" } },
          right: { style: "thin", color: { argb: "FFE0E0E0" } },
        };
      }
    });

    const buffer = await workbook.xlsx.writeBuffer();
    saveAs(new Blob([buffer]), `รายงาน_eClaim_${startdate}_${enddate}.xlsx`);
  };

  const filterOption = (input, option) =>
    (option?.children ?? "").toLowerCase().includes(input.toLowerCase());

  return (
    <div className="p-4 max-w-[1400px] mx-auto min-h-screen">
      {/* Title */}
      <div className="flex items-center justify-between mb-4 pb-2 border-b border-gray-200">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-emerald-600 text-white rounded-xl shadow-sm">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-800 mb-0">รายงาน e-Claim</h1>
            <p className="text-xs text-gray-500 mb-0">
              รายงานข้อมูลบริการให้การปรึกษาสุขภาพจิตสำหรับระบบ e-Claim
            </p>
          </div>
        </div>
      </div>

      {/* ส่วนบนก่อนถึงตาราง (Header Metadata Card) */}
      <Card className="mb-4 shadow-sm border-emerald-100 bg-gradient-to-r from-emerald-50/50 via-teal-50/30 to-white">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-emerald-100 text-emerald-700 rounded-lg shrink-0">
              <Building2 className="w-4 h-4" />
            </div>
            <div>
              <span className="text-xs text-gray-500 block">หน่วยงาน</span>
              <span className="text-sm font-bold text-gray-800">ศูนย์สุขภาพจิตที่ 4</span>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-blue-100 text-blue-700 rounded-lg shrink-0">
              <User className="w-4 h-4" />
            </div>
            <div className="flex-1">
              <span className="text-xs text-gray-500 block">ผู้รับผิดชอบ</span>
              <Input
                size="small"
                placeholder="ระบุชื่อผู้รับผิดชอบ..."
                value={responsiblePerson}
                onChange={(e) => setResponsiblePerson(e.target.value)}
                className="text-sm font-semibold text-gray-800 max-w-[240px]"
              />
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-purple-100 text-purple-700 rounded-lg shrink-0">
              <Mail className="w-4 h-4" />
            </div>
            <div>
              <span className="text-xs text-gray-500 block">ช่องทางติดต่อกลับ</span>
              <span className="text-sm font-semibold text-gray-800">mhcr4@dmh.mail.go.th</span>
            </div>
          </div>
        </div>
      </Card>

      {/* ฟิลเตอร์ กรองการค้นหา */}
      <Card className="mb-4 shadow-sm">
        <div className="flex flex-wrap gap-3 items-end">
          {/* จากวันที่ - วันที่ */}
          <div className="flex flex-col gap-1">
            <span className="text-xs font-semibold text-gray-600">จากวันที่ - วันที่</span>
            <Space>
              <DatePicker
                value={startdate ? dayjs(startdate, "YYYY-MM-DD") : null}
                onChange={(date, dateString) => setStartDate(dateString)}
                format="YYYY-MM-DD"
                allowClear={false}
                placeholder="วันที่เริ่มต้น"
              />
              <span className="text-gray-400">-</span>
              <DatePicker
                value={enddate ? dayjs(enddate, "YYYY-MM-DD") : null}
                onChange={(date, dateString) => setEndDate(dateString)}
                format="YYYY-MM-DD"
                allowClear={false}
                placeholder="วันที่สิ้นสุด"
              />
            </Space>
          </div>

          {/* หน่วยงาน */}
          <div className="flex flex-col gap-1">
            <span className="text-xs font-semibold text-gray-600">หน่วยงาน</span>
            <Select
              showSearch
              placeholder="-- หน่วยงานทั้งหมด --"
              value={organization_id || undefined}
              onChange={(val) => setOrganizationId(val ?? "")}
              style={{ minWidth: 200 }}
              allowClear
              optionFilterProp="children"
              filterOption={filterOption}
            >
              <Option value="">-- หน่วยงานทั้งหมด --</Option>
              {defaultData?.organizations?.map((org) => (
                <Option key={org.organization_id} value={org.organization_id}>
                  {org.title_th}
                </Option>
              ))}
            </Select>
          </div>

          {/* สิทธิการรักษาพยาบาล */}
          <div className="flex flex-col gap-1">
            <span className="text-xs font-semibold text-gray-600">สิทธิการรักษาพยาบาล</span>
            <Select
              showSearch
              placeholder="-- สิทธิการรักษาทั้งหมด --"
              value={healthcare_right_id || undefined}
              onChange={(val) => setHealthcareRightId(val ?? "")}
              style={{ minWidth: 200 }}
              allowClear
              optionFilterProp="children"
              filterOption={filterOption}
            >
              <Option value="">-- สิทธิการรักษาทั้งหมด --</Option>
              {defaultData?.healthcare_right?.map((hr) => (
                <Option key={hr.healthcare_right_id} value={hr.healthcare_right_id}>
                  {hr.title_th}
                </Option>
              ))}
            </Select>
          </div>

          {/* รหัส PDx */}
          <div className="flex flex-col gap-1">
            <span className="text-xs font-semibold text-gray-600">รหัส PDx</span>
            <Select
              showSearch
              placeholder="-- รหัส PDx ทั้งหมด --"
              value={pdx_code || undefined}
              onChange={(val) => setPdxCode(val ?? "")}
              style={{ minWidth: 220 }}
              allowClear
              optionFilterProp="children"
              filterOption={filterOption}
            >
              <Option value="">-- รหัส PDx ทั้งหมด --</Option>
              {allPdxItems.map((item) => (
                <Option key={item.code} value={item.code}>
                  {item.label}
                </Option>
              ))}
            </Select>
          </div>

          {/* การติดตาม / ส่งต่อ */}
          <div className="flex flex-col gap-1">
            <span className="text-xs font-semibold text-gray-600">การติดตาม/ส่งต่อ</span>
            <Select
              placeholder="-- ทั้งหมด --"
              value={follow_type || undefined}
              onChange={(val) => setFollowType(val ?? "")}
              style={{ minWidth: 160 }}
              allowClear
            >
              <Option value="">-- ทั้งหมด --</Option>
              <Option value="end">ยุติการปรึกษา</Option>
              <Option value="appointment">นัดติดตามต่อ</Option>
            </Select>
          </div>

          {/* ความพึงพอใจ */}
          <div className="flex flex-col gap-1">
            <span className="text-xs font-semibold text-gray-600">ความพึงพอใจ</span>
            <Select
              placeholder="-- ทั้งหมด --"
              value={satisfaction_level || undefined}
              onChange={(val) => setSatisfactionLevel(val ?? "")}
              style={{ minWidth: 140 }}
              allowClear
            >
              <Option value="">-- ทั้งหมด --</Option>
              <Option value="พอใจมาก">พอใจมาก</Option>
              <Option value="พอใจ">พอใจ</Option>
              <Option value="ไม่พอใจ">ไม่พอใจ</Option>
            </Select>
          </div>

          {/* ปุ่มค้นหา และ Export */}
          <Space className="ml-auto">
            <Button
              type="primary"
              icon={<Search className="w-4 h-4 inline mr-1" />}
              onClick={handleSearch}
              disabled={disableBtnSearch}
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold"
            >
              ค้นหา
            </Button>
            <Button
              icon={<Download className="w-4 h-4 inline mr-1 text-emerald-700" />}
              onClick={exportExcel}
              className="border-emerald-500 text-emerald-700 font-semibold hover:bg-emerald-50"
            >
              Export Excel
            </Button>
          </Space>
        </div>
      </Card>

      {/* สรุปจำนวนรายการ */}
      {searched && (
        <div className="flex items-center justify-between mb-3 px-1 text-sm text-gray-600">
          <span>
            ผลการค้นหา: พบทั้งหมด{" "}
            <strong className="text-emerald-700 text-base">{dataSearch.length}</strong> รายการ
          </span>
        </div>
      )}

      {/* ตารางแสดงผล 8 คอลัมน์ */}
      <div className="overflow-x-auto bg-white rounded-xl shadow-sm border border-gray-200">
        <table className="table-auto w-full border-collapse text-sm">
          <thead>
            <tr className="bg-emerald-700 text-white font-bold text-center">
              <th className="border border-emerald-800 px-3 py-3 w-14">No.</th>
              <th className="border border-emerald-800 px-3 py-3 w-36">ID 13 หลักผู้รับบริการ</th>
              <th className="border border-emerald-800 px-3 py-3 w-32">วันที่รับบริการ<br />(Service date)</th>
              <th className="border border-emerald-800 px-3 py-3 w-40">หน่วยบริการ</th>
              <th className="border border-emerald-800 px-3 py-3">รายการบริการให้การปรึกษาสุขภาพจิต<br />(รหัส PDx)</th>
              <th className="border border-emerald-800 px-3 py-3 w-48">ผลการให้บริการ<br />(การติดตาม / ส่งต่อ)</th>
              <th className="border border-emerald-800 px-3 py-3 w-32">ผลการประเมินความพึงพอใจ<br />(ของผู้รับบริการ)</th>
              <th className="border border-emerald-800 px-3 py-3 w-28">หมายเหตุ</th>
              <th className="border border-emerald-800 px-2 py-3 w-16">ดูข้อมูล</th>
            </tr>
          </thead>
          <tbody>
            {dataSearch.length > 0 ? (
              dataSearch.map((item, idx) => (
                <tr
                  key={item?.consult_id ?? item?.screening_id ?? idx}
                  className="hover:bg-emerald-50/40 transition-colors even:bg-gray-50/50"
                >
                  <td className="border border-gray-200 px-3 py-2.5 text-center font-semibold text-gray-600">
                    {idx + 1}
                  </td>
                  <td className="border border-gray-200 px-3 py-2.5 text-center font-mono text-gray-800 tracking-wider">
                    {item?.idcard || "-"}
                  </td>
                  <td className="border border-gray-200 px-3 py-2.5 text-center whitespace-nowrap text-gray-700">
                    {formatServiceDate(item?.service_date || item?.consult_create_date)}
                  </td>
                  <td className="border border-gray-200 px-3 py-2.5 text-center whitespace-nowrap text-gray-700">
                    ศูนย์สุขภาพจิตที่ 4
                  </td>
                  <td className="border border-gray-200 px-3 py-2.5 text-gray-800">
                    {formatPdx(item)}
                  </td>
                  <td className="border border-gray-200 px-3 py-2.5 text-center whitespace-nowrap">
                    {formatFollow(item) ? (
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${
                          formatFollow(item) === "ยุติการปรึกษา"
                            ? "bg-slate-100 text-slate-700 border-slate-300"
                            : "bg-blue-100 text-blue-800 border-blue-200"
                        }`}
                      >
                        {formatFollow(item)}
                      </span>
                    ) : (
                      ""
                    )}
                  </td>
                  <td className="border border-gray-200 px-3 py-2.5 text-center whitespace-nowrap">
                    {formatSatisfaction(item) ? (
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${
                          formatSatisfaction(item) === "พอใจมาก"
                            ? "bg-emerald-100 text-emerald-800 border-emerald-300"
                            : formatSatisfaction(item) === "พอใจ"
                            ? "bg-blue-100 text-blue-800 border-blue-300"
                            : "bg-rose-100 text-rose-800 border-rose-300"
                        }`}
                      >
                        {formatSatisfaction(item)}
                      </span>
                    ) : (
                      "-"
                    )}
                  </td>
                  <td className="border border-gray-200 px-3 py-2.5 text-gray-500"></td>
                  <td className="border border-gray-200 px-2 py-2.5 text-center">
                    <button
                      type="button"
                      className="p-1.5 text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition"
                      title="ดูรายละเอียดการตรวจ"
                      onClick={() => setDataViewModal({ isOpenModal: true, screeningId: item?.screening_id })}
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={9} className="border border-gray-200 p-12 text-center text-gray-400">
                  {searched ? "ไม่พบข้อมูลตามเงื่อนไขที่เลือก" : "กรุณาเลือกช่วงวันที่และกดปุ่ม 'ค้นหา'"}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Modal ดูรายละเอียดการตรวจ */}
      {dataViewModal.isOpenModal && (
        <ModalHistoryScreening
          isOpen={dataViewModal.isOpenModal}
          onClose={() => setDataViewModal({ isOpenModal: false, screeningId: null })}
          screeningId={dataViewModal.screeningId}
        />
      )}
    </div>
  );
}
