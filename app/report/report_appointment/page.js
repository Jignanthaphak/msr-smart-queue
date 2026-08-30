"use client"
import { useState } from "react";
import useDefaultDataStore from "@/stores/useDefaultDataStore";
import { getreportappointment } from "@/services/report";
import { finishfollowup } from "@/services/screening/consult";
import Swal from 'sweetalert2';
import { saveAs } from 'file-saver';
import ExcelJS from 'exceljs';
import '@ant-design/v5-patch-for-react-19';
import { DatePicker, Select, Button, Space, Form } from "antd";
import { Search } from 'lucide-react';
import dayjs from 'dayjs';
import ModalHistoryScreening from '@/components/monitor/HistoryScreening/ModalHistoryScreening';

const { Option } = Select;

export default function ReportAppointment() {

  const today = new Date().toISOString().slice(0, 10);
  const [startdate, setStartDate] = useState(today);
  const [enddate, setEndDate] = useState(today);
  const [organization_id, setOrganizationId] = useState("");
  const [consult_by, setConsultBy] = useState("");
  const [follow_status, setFollowStatus] = useState("");

  const [disableBntSearch, setDisableBntSearch] = useState(false);
  const [dataSearch, setDataSearch] = useState([]);
  const [searched, setSearched] = useState(false);

  const [dataViewModal, setDataViewModal] = useState({ isOpenModal: false, screeningId: null });

  const handleClickView = (screeningId) => {
    setDataViewModal({ isOpenModal: true, screeningId });
  };

  const handleCloseView = () => {
    setDataViewModal({ isOpenModal: false, screeningId: null });
  };

  // กดปุ่ม "สิ้นสุดการติดตาม"
  const handleFinishFollow = async (screening_id) => {
    const confirm = await Swal.fire({
      title: 'ยืนยันสิ้นสุดการติดตาม',
      text: 'บันทึกว่าติดตามผู้ป่วยรายนี้เรียบร้อยแล้ว?',
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'สิ้นสุดการติดตาม',
      cancelButtonText: 'ยกเลิก',
    });
    if (!confirm.isConfirmed) return;

    try {
      Swal.fire({
        title: 'กำลังบันทึก...',
        didOpen: () => { Swal.showLoading(); },
        allowOutsideClick: false, allowEscapeKey: false, showConfirmButton: false,
      });

      const result = await finishfollowup(screening_id);
      if (!result?.ok) throw new Error(result?.error || 'บันทึกไม่สำเร็จ');

      await Swal.fire('สำเร็จ', 'บันทึกสิ้นสุดการติดตามเรียบร้อย', 'success');
      await handleSearch();

    } catch (err) {
      Swal.fire('เกิดข้อผิดพลาด!', err?.message || 'บันทึกไม่สำเร็จ', 'error');
    }
  };

  const defaultData = useDefaultDataStore((state) => state.defaultData);

  // แสดงวันเวลานัดหมาย
  const formatDateTime = (dateStr) => {
    if (!dateStr) return "-";
    const d = dayjs(dateStr);
    return d.isValid() ? d.format("DD/MM/YYYY HH:mm") + " น." : "-";
  };

  // เบอร์ติดต่อ: ใช้เบอร์ที่กรอกในหัวข้อ "นัดหมาย" หน้า consult เป็นหลัก
  // ถ้าไม่ได้กรอก (เช่น นัดหมายเก่าก่อนมีช่องนี้) ค่อย fallback ไปเบอร์ในข้อมูลบุคคล
  const contactTel = (item) => item?.consult?.follow_tel || item?.person?.tel || "-";

  const fullName = (person) => {
    if (!person) return "-";
    const prefix = person?.name_prefixes?.title ?? "";
    const first = person?.firstname ?? "";
    const last = person?.lastname ?? "";
    const name = `${prefix}${first} ${last}`.trim();
    return name || "-";
  };

  const handleSearch = async (e) => {

    if (e && e.preventDefault) e.preventDefault();

    Swal.fire({
      title: 'กำลังค้นหาข้อมูล...',
      didOpen: () => { Swal.showLoading(); },
      allowOutsideClick: false,
      allowEscapeKey: false,
      allowEnterKey: false,
      showConfirmButton: false,
    });

    try {

      setDisableBntSearch(true);

      const params = new URLSearchParams();
      params.append("startdate", startdate);
      params.append("enddate", enddate);
      params.append("organization_id", organization_id);
      params.append("consult_by", consult_by);
      params.append("follow_status", follow_status);

      const result = await getreportappointment(params.toString());

      if (result?.ok && result?.data && result?.data?.length > 0) {
        setDataSearch(result.data);
      } else {
        setDataSearch([]);
      }

      setSearched(true);
      Swal.close();

    } catch (err) {

      setDataSearch([]);
      setSearched(true);
      Swal.fire('เกิดข้อผิดพลาด!', err?.message || 'ไม่พบข้อมูล', 'error');

    } finally {
      setDisableBntSearch(false);
    }

  };

  const filterOption = (input, option) => {
    const label = (option?.children ?? "").toString().toLowerCase();
    return label.includes(input.toLowerCase());
  };

  // Export Excel ตามคอลัมน์ในตาราง (ไม่รวมช่อง icon)
  const exportExcel = async () => {

    if (!dataSearch.length) {
      Swal.fire('ไม่มีข้อมูล', 'กรุณาค้นหาข้อมูลก่อน Export', 'info');
      return;
    }

    const workbook = new ExcelJS.Workbook();
    const ws = workbook.addWorksheet('ตารางนัดหมาย');

    ws.columns = [
      { header: 'ลำดับ', key: 'no', width: 8 },
      { header: 'HN', key: 'hn', width: 12 },
      { header: 'ชื่อ-สกุล', key: 'name', width: 28 },
      { header: 'เบอร์ติดต่อ', key: 'tel', width: 16 },
      { header: 'หน่วยงาน', key: 'org', width: 28 },
      { header: 'วันเวลานัดหมาย', key: 'follow_date', width: 22 },
      { header: 'รายละเอียด', key: 'follow_detail', width: 36 },
      { header: 'คน Consult', key: 'consult_by', width: 18 },
      { header: 'สถานะตรวจ', key: 'screening_status', width: 14 },
      { header: 'สถานะติดตาม', key: 'follow_status', width: 14 },
      { header: 'ผู้ติดตาม', key: 'follow_by', width: 16 },
      { header: 'เวลาติดตาม', key: 'follow_at', width: 22 },
    ];

    ws.getRow(1).font = { bold: true };
    ws.getRow(1).alignment = { horizontal: 'center', vertical: 'middle' };

    dataSearch.forEach((item, idx) => {
      ws.addRow({
        no: idx + 1,
        hn: item?.person?.hn ?? '-',
        name: fullName(item?.person),
        tel: contactTel(item),
        org: item?.person?.organization?.title_th ?? '-',
        follow_date: formatDateTime(item?.consult?.follow_date),
        follow_detail: item?.consult?.follow_detail ?? '-',
        consult_by: item?.consult?.create_by_account?.nickname ?? '-',
        screening_status: item?.screening_status?.status_name ?? '-',
        follow_status: item?.consult?.follow_status === 1 ? 'สิ้นสุดแล้ว' : 'รอติดตาม',
        follow_by: item?.consult?.follow_status === 1 ? (item?.consult?.follow_status_by_account?.nickname ?? '-') : '-',
        follow_at: item?.consult?.follow_status === 1 ? formatDateTime(item?.consult?.follow_status_date) : '-',
      });
    });

    const buffer = await workbook.xlsx.writeBuffer();
    saveAs(new Blob([buffer]), `ตารางนัดหมาย_${startdate}_${enddate}.xlsx`);
  };

  return (
    <div className="p-4">

      <h1 className="text-xl font-bold text-center mb-4">รายงาน ตารางนัดหมาย</h1>

      <div className="report-filter mb-4">
        <Form layout="vertical">
          <Space wrap size="middle" className="w-full justify-center">

            <Space>
              <label>เริ่ม</label>
              <DatePicker
                value={startdate ? dayjs(startdate, "YYYY-MM-DD") : null}
                onChange={(date, dateString) => setStartDate(dateString)}
                format="YYYY-MM-DD"
                allowClear={false}
              />
              <label>-</label>
              <label>สิ้นสุด</label>
              <DatePicker
                value={enddate ? dayjs(enddate, "YYYY-MM-DD") : null}
                onChange={(date, dateString) => setEndDate(dateString)}
                format="YYYY-MM-DD"
                allowClear={false}
              />
            </Space>

            <Select
              showSearch
              placeholder="-- หน่วยงาน --"
              value={organization_id || undefined}
              onChange={(value) => setOrganizationId(value ?? "")}
              style={{ minWidth: 260, whiteSpace: "nowrap" }}
              allowClear
              optionFilterProp="children"
              filterOption={filterOption}
            >
              <Option key={0} value={""}>-- หน่วยงานทั้งหมด --</Option>
              {defaultData?.organizations?.map((org) => (
                <Option key={org.organization_id} value={org.organization_id}>
                  {org.title_th}
                </Option>
              ))}
            </Select>

            <Select
              showSearch
              placeholder="-- คน Consult --"
              value={consult_by || undefined}
              onChange={(value) => setConsultBy(value ?? "")}
              style={{ minWidth: 200, whiteSpace: "nowrap" }}
              allowClear
              optionFilterProp="children"
              filterOption={filterOption}
            >
              <Option key={0} value={""}>-- คน Consult ทั้งหมด --</Option>
              {defaultData?.accounts?.map((acc) => (
                <Option key={acc.user_id} value={acc.user_id}>
                  {acc.nickname}
                </Option>
              ))}
            </Select>

            <Select
              placeholder="-- สถานะการติดตาม --"
              value={follow_status !== "" ? follow_status : undefined}
              onChange={(value) => setFollowStatus(value ?? "")}
              style={{ minWidth: 180, whiteSpace: "nowrap" }}
              allowClear
            >
              <Option value={""}>-- การติดตามทั้งหมด --</Option>
              <Option value={"0"}>รอติดตาม</Option>
              <Option value={"1"}>สิ้นสุดแล้ว</Option>
            </Select>

            <Button type="primary" onClick={handleSearch} disabled={disableBntSearch}>ค้นหา</Button>
            <Button onClick={exportExcel}>Export Excel</Button>

          </Space>
        </Form>
      </div>

      <div className="overflow-x-auto">
        <table className="table-auto w-full border-collapse border border-gray-300 text-sm">
          <thead>
            <tr className="bg-gray-100">
              <th className="border border-gray-300 px-2 py-2 text-center">ลำดับ</th>
              <th className="border border-gray-300 px-2 py-2 text-center">HN</th>
              <th className="border border-gray-300 px-2 py-2 text-center">ชื่อ-สกุล</th>
              <th className="border border-gray-300 px-2 py-2 text-center">เบอร์ติดต่อ</th>
              <th className="border border-gray-300 px-2 py-2 text-center">หน่วยงาน</th>
              <th className="border border-gray-300 px-2 py-2 text-center">วันเวลานัดหมาย</th>
              <th className="border border-gray-300 px-2 py-2 text-center">รายละเอียด</th>
              <th className="border border-gray-300 px-2 py-2 text-center">คน Consult</th>
              <th className="border border-gray-300 px-2 py-2 text-center">สถานะตรวจ</th>
              <th className="border border-gray-300 px-2 py-2 text-center">สถานะติดตาม</th>
              <th className="border border-gray-300 px-2 py-2 text-center">ดูรายละเอียด</th>
              <th className="border border-gray-300 px-2 py-2 text-center">ติดตาม</th>
            </tr>
          </thead>
          <tbody>
            {dataSearch.length > 0 ? (
              dataSearch.map((item, idx) => (
                <tr key={item?.consult?.consult_id ?? item?.screening_id ?? idx} className="hover:bg-gray-50">
                  <td className="border border-gray-300 px-2 py-2 text-center">{idx + 1}</td>
                  <td className="border border-gray-300 px-2 py-2 text-center">{item?.person?.hn ?? "-"}</td>
                  <td className="border border-gray-300 px-2 py-2">{fullName(item?.person)}</td>
                  <td className="border border-gray-300 px-2 py-2 text-center whitespace-nowrap">{contactTel(item)}</td>
                  <td className="border border-gray-300 px-2 py-2">{item?.person?.organization?.title_th ?? "-"}</td>
                  <td className="border border-gray-300 px-2 py-2 text-center whitespace-nowrap">{formatDateTime(item?.consult?.follow_date)}</td>
                  <td className="border border-gray-300 px-2 py-2">{item?.consult?.follow_detail ?? "-"}</td>
                  <td className="border border-gray-300 px-2 py-2 text-center">{item?.consult?.create_by_account?.nickname ?? "-"}</td>
                  <td className="border border-gray-300 px-2 py-2 text-center whitespace-nowrap">
                    <span className={`status-badge ${item?.status_id ? `status_${item?.status_id}` : ""}`}>
                      {item?.screening_status?.status_name || "-"}
                    </span>
                  </td>
                  <td className="border border-gray-300 px-2 py-2 text-center whitespace-nowrap">
                    {item?.consult?.follow_status === 1 ? (
                      <div className="flex flex-col items-center">
                        <span className="text-green-600 font-semibold">สิ้นสุดแล้ว</span>
                        <span className="text-xs text-gray-500">
                          {item?.consult?.follow_status_by_account?.nickname ?? "-"}
                          {item?.consult?.follow_status_date ? ` · ${formatDateTime(item?.consult?.follow_status_date)}` : ""}
                        </span>
                      </div>
                    ) : (
                      <span className="text-orange-500">รอติดตาม</span>
                    )}
                  </td>
                  <td className="border border-gray-300 px-2 py-2 text-center">
                    <button
                      type="button"
                      className="text-gray-500 hover:text-blue-600"
                      title="ดูรายละเอียดการตรวจ"
                      onClick={() => handleClickView(item?.screening_id)}
                    >
                      <Search size={18} />
                    </button>
                  </td>
                  <td className="border border-gray-300 px-2 py-2 text-center">
                    {item?.consult?.follow_status === 1 ? (
                      <span className="text-gray-400">-</span>
                    ) : (
                      <Button size="small" type="primary" onClick={() => handleFinishFollow(item?.screening_id)}>
                        สิ้นสุดการติดตาม
                      </Button>
                    )}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={12} className="border border-gray-300 px-2 py-6 text-center text-gray-500">
                  {searched ? "ไม่พบข้อมูลนัดหมายในช่วงที่เลือก" : "กรุณาเลือกเงื่อนไขแล้วกดค้นหา"}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <ModalHistoryScreening
        isOpen={dataViewModal.isOpenModal}
        screeningId={dataViewModal.screeningId}
        onClose={handleCloseView}
      />

    </div>
  );
}
