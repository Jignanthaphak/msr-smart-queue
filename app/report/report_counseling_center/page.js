"use client"
import { useState, useEffect } from "react";
import useDefaultDataStore from "@/stores/useDefaultDataStore";
import { getreportcounselingcenter } from "@/services/report";
import Swal from 'sweetalert2';
import { saveAs } from 'file-saver';
import ExcelJS from 'exceljs';
import "jspdf-autotable";
import '@ant-design/v5-patch-for-react-19';
import { DatePicker, Select, Button, Space, Form } from "antd";
import dayjs from 'dayjs';

const { Option } = Select;

export default function Report() {

  const sarabunNormalBase64 = "AAEAAAASAQAABAAgR0RFRrRCsIIAA...";

  const today = new Date().toISOString().slice(0, 10);
  const [startdate, setStartDate] = useState(today);
  const [enddate, setEndDate] = useState(today);
  const [organization_id, setOrganizationId] = useState("");

  const [disableBntSearch, setDisableBntSearch] = useState(false);
  const [dataSearch, setDataSearch] = useState([]);

  const [loadingData, setLoadingData] = useState(true);
  
  const defaultData = useDefaultDataStore((state) => state.defaultData)

  // แปลงวันที่ให้อยู่ในรูปแบบวันที่ภาษาไทย (ถ้าต้องการ)
  function formatDateTH(dateStr) {
    if (!dateStr) return "-"
    const date = new Date(dateStr)
    return date.toLocaleDateString("th-TH", {
      year: "numeric",
      month: "long",
      day: "numeric",
    })
  }

  const dateText =
    startdate === enddate
      ? `วันที่ ${formatDateTH(startdate)}`
      : `วันที่ ${formatDateTH(startdate)} - ${formatDateTH(enddate)}`

  useEffect(() => {
    const timer = setTimeout(() => {
      setLoadingData(false);
    }, 500);
    return () => clearTimeout(timer);
  }, [loadingData]);

  const handleSearch = async (e) => {

    Swal.fire({
      title: 'กำลังค้นหาข้อมูล...',
      didOpen: () => {
        Swal.showLoading();
      },
      allowOutsideClick: false,
      allowEscapeKey: false,
      allowEnterKey: false,
      showConfirmButton: false,
    });

    setLoadingData(true)

    await new Promise((resolve) => setTimeout(resolve, 1000));
    
    try {

      if (e && e.preventDefault) {
        e.preventDefault();
      }

      setDisableBntSearch(true);

      const params = new URLSearchParams();

      params.append("startdate", startdate);
      params.append("enddate", enddate);
      params.append("organization_id", organization_id);
      
      const queryString = params.toString();
      const result = await getreportcounselingcenter(queryString)

      if (result?.ok && result?.data && result?.data?.length > 0) {
        setDataSearch(result.data);
      } else {
        setDataSearch([]);
      }

      Swal.close();

      setLoadingData(false)
      
    } catch (err) {

      setDataSearch([]);

      Swal.fire('เกิดข้อผิดพลาด!', err.message, 'error');

    } finally {
      
      setDisableBntSearch(false);

      console.log(dataSearch)

    }

  }

  const filterOrgOption = (input, option) => {
    const label = (option?.children ?? "").toString().toLowerCase();
    return label.includes(input.toLowerCase());
  }

  // helper: render checkbox สำหรับ cell ต่าง ๆ
  const renderCheckbox = (checked) => (
    <input
      type="checkbox"
      checked={!!checked}
      readOnly
      className="disabled checkbox-lg"
    />
  );


  // ✅ ฟังก์ชัน Export Excel ตามโครงสร้าง table ตอนนี้
  const exportExcelFromData = async () => {
  if (!dataSearch || dataSearch.length === 0) {
    alert('ไม่มีข้อมูลสำหรับ export');
    return;
  }

  try {
    Swal.fire({
      title: 'กำลังสร้างไฟล์ Excel...',
      didOpen: () => Swal.showLoading(),
      allowOutsideClick: false,
      allowEscapeKey: false,
      allowEnterKey: false,
      showConfirmButton: false,
    });

    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'ระบบบันทึกรายงานการให้คำปรึกษา';
    workbook.created = new Date();

    const worksheet = workbook.addWorksheet('รายงานศูนย์ให้คำปรึกษา', {
      views: [{ state: 'frozen', ySplit: 3 }],
    });

    // -----------------------------
    // กำหนดความกว้างคอลัมน์
    // -----------------------------
    const colWidths = [
      10, // A HN
      15, // B ชื่อ
      15, // C สกุล
      20, // D เลขบัตร
      8,  // E เพศ
      8,  // F อายุ
      30, // G หน่วยงาน
      15, // H เบอร์โทร
      40, // I รายละเอียดปรึกษา
      // สาเหตุความเครียด 19 ช่อง J–AB
      12, 12, 16, 14, 14, 14, 16, 14, 12, 12,
      12, 14, 12, 12, 14, 22, 22, 14, 16,
      // ความเสี่ยง RQ 3 (AC–AE)
      12, 12, 12,
      // Burn out 3 (AF–AH)
      12, 12, 12,
      // ST-5 4 (AI–AL)
      14, 14, 14, 16,
      // คัดกรองซึมเศร้า 4 (AM–AP)
      12, 12, 14, 14,
      // 8Q (AQ)
      22,
      // เฝ้าระวัง / นัดหมาย / ส่งต่อ (AR)
      22,
      // รายละเอียดส่งต่อ 3 ช่อง (AS–AU)
      22, 22, 22,
      // การช่วยเหลือ (AV)
      30,
      // เจ้าหน้าที่ (AW)
      14,
      // หมายเหตุ (AX)
      22,
      // โรคประจำตัว (AY)
      22,
    ];

    colWidths.forEach((w, idx) => {
      worksheet.getColumn(idx + 1).width = w;
    });

    // -----------------------------
    // Header Row 1 (กลุ่มบนสุด)
    // -----------------------------
    worksheet.mergeCells('A1:H1'); // ช่องว่าง
    worksheet.mergeCells('J1:AA1'); // สาเหตุความเครียด
    worksheet.mergeCells('AB1:AP1'); // ความเสี่ยงที่พบ (คน)
    worksheet.mergeCells('AQ1:AQ3'); // เฝ้าระวัง / นัดหมาย / ส่งต่อ
    worksheet.mergeCells('AR1:AT1'); // รายละเอียดการส่งต่อ
    worksheet.mergeCells('AU1:AU3'); // การให้ความช่วยเหลือ
    worksheet.mergeCells('AV1:AV3'); // เจ้าหน้าที่
    worksheet.mergeCells('AW1:AW3'); // หมายเหตุ


    worksheet.getCell('I1').value  = 'ข้อมูลการให้คำปรึกษา';
    worksheet.getCell('J1').value  = 'สาเหตุความเครียด';
    worksheet.getCell('AB1').value = 'ความเสี่ยงที่พบ (คน)';
    worksheet.getCell('AQ1').value = 'เฝ้าระวัง / นัดหมาย / ส่งต่อ';
    worksheet.getCell('AR1').value = 'รายละเอียดการส่งต่อ';
    worksheet.getCell('AU1').value = 'การให้ความช่วยเหลือ';
    worksheet.getCell('AV1').value = 'เจ้าหน้าที่';
    worksheet.getCell('AW1').value = 'หมายเหตุ';

    // -----------------------------
    // Header Row 2 (หัวหลัก)
    // -----------------------------
    worksheet.mergeCells('A2:A3');
    worksheet.mergeCells('B2:B3');
    worksheet.mergeCells('C2:C3');
    worksheet.mergeCells('D2:D3');
    worksheet.mergeCells('E2:E3');
    worksheet.mergeCells('F2:F3');
    worksheet.mergeCells('G2:G3');
    worksheet.mergeCells('H2:H3');
    worksheet.mergeCells('I2:I3');

    worksheet.mergeCells('J2:AA2');   // ประเด็นที่พบ...
    worksheet.mergeCells('AB2:AD2');  // RQ
    worksheet.mergeCells('AE2:AG2');  // Burn out
    worksheet.mergeCells('AH2:AK2');  // ST-5
    worksheet.mergeCells('AL2:AO2');  // คัดกรองโรคซึมเศร้า
    // AQ2 แถวเดียว
    worksheet.mergeCells('AR2:AR3');
    worksheet.mergeCells('AS2:AS3');
    worksheet.mergeCells('AT2:AT3');

    const r2 = worksheet.getRow(2);
    r2.getCell('A').value = 'HN';
    r2.getCell('B').value = 'ชื่อ';
    r2.getCell('C').value = 'สกุล';
    r2.getCell('D').value = 'เลขบัตรประจำตัวประชาชน';
    r2.getCell('E').value = 'เพศ';
    r2.getCell('F').value = 'อายุ';
    r2.getCell('G').value = 'หน่วยงาน';
    r2.getCell('H').value = 'เบอร์โทรศัพท์';
    r2.getCell('I').value = 'รายละเอียด ข้อมูลการให้คำปรึกษา';

    r2.getCell('J').value  = 'ประเด็นที่พบจากการให้บริการปรึกษาทางด้านสุขภาพจิต';
    r2.getCell('AC').value = 'พลังใจ ( RQ )';
    r2.getCell('AF').value = 'ภาวะหมดไฟ ( Burn Out )';
    r2.getCell('AI').value = 'ความเครียด ( ST-5 )';
    r2.getCell('AM').value = 'คัดกรองโรคซึมเศร้า';
    r2.getCell('AP').value = 'เสี่ยงฆ่าตัวตาย';
    r2.getCell('AR').value = 'ระบุปัญหา';
    r2.getCell('AS').value = 'หน่วยงานที่รับส่งต่อ';
    r2.getCell('AT').value = 'การติดตาม/ระบุวิธีติดตาม';

    // -----------------------------
    // Header Row 3 (หัวรายย่อย)
    // -----------------------------
    const r3 = worksheet.getRow(3);

    // J–AA สาเหตุความเครียด
    r3.getCell('J').value  = 'ยาเสพติด';
    r3.getCell('K').value  = 'จิตเวช';
    r3.getCell('L').value  = 'เศรษฐกิจ/หนี้สิน';
    r3.getCell('M').value  = 'ครอบครัว';
    r3.getCell('N').value  = 'ความสัมพันธ์';
    r3.getCell('O').value  = 'ปัญหาความรัก';
    r3.getCell('P').value  = 'ตั้งครรภ์ไม่พร้อม';
    r3.getCell('Q').value  = 'การเรียน';
    r3.getCell('R').value  = 'การพนัน';
    r3.getCell('S').value  = 'ติดเกมส์';
    r3.getCell('T').value  = 'เรื่องเพศ';
    r3.getCell('U').value  = 'การทำงาน';
    r3.getCell('V').value  = 'สุขภาพ';
    r3.getCell('W').value  = 'การนอน';
    // r3.getCell('X').value  = 'วิตกกังวล';
    r3.getCell('X').value  = 'สูญเสีย คนในครอบครัว คนรัก สัตว์เลี้ยง';
    r3.getCell('Y').value  = 'สุขภาพ คนในครอบครัว คนรัก สัตว์เลี้ยง';
    r3.getCell('Z').value = 'ไม่มีเรื่องเครียด';
    r3.getCell('AA').value = 'อื่นๆ ระบุ';

    // AA–AD RQ
    r3.getCell('AB').value = 'น้อย \n(3 - 14 คะแนน)';
    r3.getCell('AC').value = 'ปานกลาง \n(15 - 23 คะแนน)';
    r3.getCell('AD').value = 'มาก \n(24 - 30 คะแนน)';

    // AE–AG Burn out
    r3.getCell('AE').value = 'น้อย \n(3 - 6 คะแนน)';
    r3.getCell('AF').value = 'ปานกลาง \n(7 - 8 คะแนน)';
    r3.getCell('AG').value = 'มาก \n(9 - 12 คะแนน)';

    // AH–AK ST-5
    r3.getCell('AH').value = 'เครียดน้อย \n(0 - 4 คะแนน)';
    r3.getCell('AI').value = 'เครียดปานกลาง \n(5 - 7 คะแนน)';
    r3.getCell('AJ').value = 'เครียดมาก \n(8 - 9 คะแนน)';
    r3.getCell('AK').value = 'เครียดมากที่สุด \n(10 - 15 คะแนน)';

    // AL–AO คัดกรองโรคซึมเศร้า
    r3.getCell('AL').value = '2Q ( มี )';
    r3.getCell('AM').value = '2Q ( ไม่มี )';
    r3.getCell('AN').value = '9Q ( ≤ 7 คะแนน)';
    r3.getCell('AO').value = '9Q ( > 7 คะแนน)';

    // AP 8Q
    r3.getCell('AP').value = '8Q ( ถ้า ≥ 17 คะแนนส่งต่อ รพ.ที่มีจิตแพทย์ด่วน )';

    // -----------------------------
    // style header ทั้ง 3 แถว
    // -----------------------------
    for (let r = 1; r <= 3; r++) {
      const row = worksheet.getRow(r);
      row.eachCell((cell) => {
        cell.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
        cell.font = { bold: true, name: 'TH Sarabun New', size: 12 };
        cell.border = {
          top: { style: 'thin' },
          left: { style: 'thin' },
          bottom: { style: 'thin' },
          right: { style: 'thin' },
        };
      });
    }

    // helper checkbox
    const mark = (val) => (val ? '✓' : '');

    // -----------------------------
    // เติมข้อมูลแถวตั้งแต่ row 4
    // -----------------------------
    let dataRowIndex = 4;

    dataSearch.forEach((person) => {
      const screening = person.screenings || {};
      const consult = screening.consult || {};

      // การติดตาม / ส่งต่อ
      let followText = "";
      if (consult.follow_id === 1) followText = "ปกติ";
      else if (consult.follow_id === 2) followText = "เฝ้าระวัง";
      else if (consult.follow_id === 3) followText = "นัดหมาย";
      else if (consult.follow_id === 4) followText = "ส่งต่อ";

      if (consult.follow_date) {
        followText += ` ${formatDateTH(consult.follow_date)}`;
      }

      // การให้ความช่วยเหลือ
      const assistList = [
        consult.assist_stress && "การจัดการความเครียด",
        consult.assist_stress_relief_techniques && "เทคนิคคลายเครียด",
        consult.assist_first_aid && "การปฐมพยาบาลทางใจเบื้องต้น (PFA)",
        consult.assist_changing_perspectives && "การปรับเปลี่ยนมุมมองและทัศนคติ",
        consult.assist_stress_relief_breathing_exercises && "การฝึกหายใจคลายเครียด",
        consult.assist_initial_consultation && "การให้คำปรึกษาเบื้องต้น",
        consult.assist_sleep && "การนอนหลับ",
        consult.assist_exercise && "การออกกำลังกาย",
        consult.assist_other && `อื่นๆ: ${consult.assist_other_detail || ""}`,
      ].filter(Boolean);

      const assistText =
        assistList.length > 0 ? assistList.join(" / ") : "-";

      const tel = consult.follow_counseling_center_tel
        ? consult.follow_counseling_center_tel
        : person.tel
        ? person.tel
        : "-";

      const row = worksheet.getRow(dataRowIndex++);

      // A–H
      row.getCell('A').value = person.hn;
      row.getCell('B').value = person.firstname;
      row.getCell('C').value = person.lastname;
      row.getCell('D').value = person.idcard || "-";
      row.getCell('E').value = person.sex?.title_th || "-";
      row.getCell('F').value = person.age ?? "-";
      row.getCell('G').value = person.organization?.title_th || "-";
      row.getCell('H').value = tel;

      // I รายละเอียดปรึกษา
      row.getCell('I').value = consult.consulting || "-";

      // J–AB สาเหตุความเครียด
      row.getCell('J').value  = mark(consult.stress_narcotics);
      row.getCell('K').value  = mark(consult.stress_psychiatry);
      row.getCell('L').value  = mark(consult.stress_economy);
      row.getCell('M').value  = mark(consult.stress_family);
      row.getCell('N').value  = mark(consult.stress_relationship);
      row.getCell('O').value  = mark(consult.stress_love);
      row.getCell('P').value  = mark(consult.stress_unplanned);
      row.getCell('Q').value  = mark(consult.stress_learning);
      row.getCell('R').value  = mark(consult.stress_gambling);
      row.getCell('S').value  = mark(consult.stress_games);
      row.getCell('T').value  = mark(consult.stress_sex);
      row.getCell('U').value  = mark(consult.stress_work);
      row.getCell('V').value  = mark(consult.stress_health);
      row.getCell('W').value  = mark(consult.stress_sleep);
      // row.getCell('X').value  = mark(consult.stress_anxious);
      row.getCell('X').value  = mark(consult.stress_loss);
      row.getCell('Y').value  = mark(consult.stress_healthfamily);
      row.getCell('Z').value = mark(consult.stress_no_check);
      row.getCell('AA').value = consult.stress_other
        ? `✓ ${consult.stress_other}`
        : "";

      // AC–AD RQ
      row.getCell('AB').value = mark(consult.risk_rq_id === 1);
      row.getCell('AC').value = mark(consult.risk_rq_id === 2);
      row.getCell('AD').value = mark(consult.risk_rq_id === 3);

      // AF–AG Burn out
      row.getCell('AE').value = mark(consult.risk_burn_out_id === 1);
      row.getCell('AF').value = mark(consult.risk_burn_out_id === 2);
      row.getCell('AG').value = mark(consult.risk_burn_out_id === 3);

      // AI–AK ST-5
      row.getCell('AH').value = mark(consult.risk_st5_id === 1);
      row.getCell('AI').value = mark(consult.risk_st5_id === 2);
      row.getCell('AJ').value = mark(consult.risk_st5_id === 3);
      row.getCell('AK').value = mark(consult.risk_st5_id === 4);

      // AM–AO ซึมเศร้า
      row.getCell('AL').value = mark(consult.risk_depressed_2qplus === 2); // มี
      row.getCell('AM').value = mark(consult.risk_depressed_2qplus === 1); // ไม่มี
      row.getCell('AN').value = mark(consult.risk_depressed_9q === 1);
      row.getCell('AO').value = mark(consult.risk_depressed_9q === 2);

      // AP 8Q (ตอนนี้ใช้เงื่อนไขเดียวกับ 9Q > 7 ที่คุณใช้บนเว็บ)
      row.getCell('AP').value = mark(consult.risk_depressed_9q === 2);

      // AQ–AT การส่งต่อ/ติดตาม
      row.getCell('AQ').value = followText || "-";
      row.getCell('AR').value = consult.forward_problem || "-";
      row.getCell('AS').value = consult.forward_hospital || "-";
      row.getCell('AT').value = consult.forward_how_to_follow || "-";

      // AU การช่วยเหลือ
      row.getCell('AU').value = assistText;

      // AV เจ้าหน้าที่
      row.getCell('AV').value = consult.create_by_account?.nickname || "-";

      // AW หมายเหตุ
      row.getCell('AW').value = person.important_information || "-";

      // AX โรคประจำตัว (ถ้ามี field ก็ map ตรงนี้เลย)
      row.getCell('AX').value = ""; // ตอนนี้ปล่อยว่าง

      // style แต่ละ cell ในแถวข้อมูล
      row.eachCell((cell) => {
        cell.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
        cell.border = {
          top: { style: 'thin' },
          left: { style: 'thin' },
          bottom: { style: 'thin' },
          right: { style: 'thin' },
        };
        cell.font = { name: 'TH Sarabun New', size: 12 };
      });
    });

    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    });

    const fileName = `รายงานศูนย์ให้คำปรึกษา_${startdate}_${enddate}.xlsx`;
    saveAs(blob, fileName);

    Swal.close();
  } catch (err) {
    console.error(err);
    Swal.close();
    Swal.fire('เกิดข้อผิดพลาด!', err.message || 'ไม่สามารถสร้างไฟล์ Excel ได้', 'error');
  }
};




  return (
    <>
      <div className="justify-center w-[95%] min-h-screen m-auto ">
     
        <div className="w-[95%] md:w-[70%] m-auto p-4 bg-base-200 border border-base-300 rounded-lg">
          <h3 className="text-[20px] mb-4">ค้นหา</h3>
          
          <Form layout="vertical">
            <Space wrap size="middle" className="w-full justify-center">

              {/* Date Range */}
              <Space>
                <label>เริ่ม</label>
                <DatePicker
                  value={startdate ? dayjs(startdate, "YYYY-MM-DD") : null}
                  onChange={(date, dateString) => setStartDate(dateString)}
                  format="YYYY-MM-DD"
                />
                <label>-</label>
                <label>สิ้นสุด</label>
                <DatePicker
                  value={enddate ? dayjs(enddate, "YYYY-MM-DD") : null}
                  onChange={(date, dateString) => setEndDate(dateString)}
                  format="YYYY-MM-DD"
                />
              </Space>

              {/* Organization Select */}
              <Select
                showSearch                           // ✅ เปิด Search
                placeholder="-- หน่วยงาน --"
                value={organization_id || undefined}
                onChange={(value) => setOrganizationId(value)}
                style={{ minWidth: 300, whiteSpace:"nowrap" }}
                allowClear
                optionFilterProp="children"
                filterOption={filterOrgOption}
              >
                <Option key={0} value={""}>-- หน่วยงานทั้งหมด --</Option>
                {defaultData?.organizations?.map((org) => (
                  <Option key={org.organization_id} value={org.organization_id}>
                    {org.title_th}
                  </Option>
                ))}
              </Select>

              {/* Buttons */}
              <Button
                type="primary"
                onClick={handleSearch}
                disabled={disableBntSearch}
              >
                ค้นหา
              </Button>

              <Button
                onClick={exportExcelFromData}
              >
                Export Excel
              </Button>

            </Space>
          </Form>
        </div>

        <div className="w-[95%] md:w-full mt-5 m-auto">
          <div className="w-full text-center p-[20px]">
            
            {loadingData ? (
        
              <span className="loading loading-bars loading-xl"></span>

            ) : dataSearch && dataSearch.length === 0 ? (
            
              <label>ไม่มีข้อมูล </label>

            ) : (

              <>
                <div
                  id="excel-box"
                  className="excel-box overflow-x-auto border border-base-300"
                >
                  <table className="table table-normal border-collapse w-full text-center whitespace-nowrap">
                    <thead>
                      {/* แถวที่ 1 (หัวกลุ่มบนสุด) */}
                      <tr className="relative  sticky top-0">
                        {/* A1:F1 เดิม merge ว่าง ๆ → ปล่อยว่างแต่ colSpan ให้เท่ากัน */}
                        <th colSpan={8} className="border border-base-300 bg-base-200"></th>

                        {/* I1 */}
                        <th className="border border-base-300 bg-base-200">
                          ข้อมูลการให้คำปรึกษา
                        </th>

                        {/* J1:AB1 */}
                        <th
                          colSpan={18}
                          className="border border-base-300 bg-base-200"
                        >
                          สาเหตุความเครียด
                        </th>

                        {/* AC1:AQ1 */}
                        <th
                          colSpan={15}
                          className="border border-base-300 bg-base-200"
                        >
                          ความเสี่ยงที่พบ (คน)
                        </th>

                        {/* AR1:AR3 */}
                        <th
                          rowSpan={3}
                          className="border border-base-300 bg-base-200"
                        >
                          เฝ้าระวัง / นัดหมาย / ส่งต่อ
                        </th>

                        {/* AS1:AU1 */}
                        <th
                          colSpan={3}
                          className="border border-base-300 bg-base-200"
                        >
                          รายละเอียดการส่งต่อ
                        </th>

                        {/* AV1:AV3 */}
                        <th
                          rowSpan={3}
                          className="border border-base-300 bg-base-200"
                        >
                          การให้ความช่วยเหลือ
                        </th>

                        {/* AW1:AW3 */}
                        <th
                          rowSpan={3}
                          className="border border-base-300 bg-base-200"
                        >
                          เจ้าหน้าที่
                        </th>

                        {/* AX1:AX3 */}
                        <th
                          rowSpan={3}
                          className="border border-base-300 bg-base-200"
                        >
                          หมายเหตุ
                        </th>

                        
                      </tr>

                      {/* แถวที่ 2 (หัวหลัก) */}
                      <tr>
                        {/* A2:A3 - H2:H3 */}
                        <th
                          rowSpan={2}
                          className="border border-base-300 bg-base-200"
                        >
                          HN
                        </th>
                        <th
                          rowSpan={2}
                          className="border border-base-300 bg-base-200"
                        >
                          ชื่อ
                        </th>
                        <th
                          rowSpan={2}
                          className="border border-base-300 bg-base-200"
                        >
                          สกุล
                        </th>
                        <th
                          rowSpan={2}
                          className="border border-base-300 bg-base-200"
                        >
                          เลขบัตรประจำตัวประชาชน
                        </th>
                        <th
                          rowSpan={2}
                          className="border border-base-300 bg-base-200"
                        >
                          เพศ
                        </th>
                        <th
                          rowSpan={2}
                          className="border border-base-300 bg-base-200"
                        >
                          อายุ
                        </th>
                        <th
                          rowSpan={2}
                          className="border border-base-300 bg-base-200"
                        >
                          หน่วยงาน
                        </th>
                        <th
                          rowSpan={2}
                          className="border border-base-300 bg-base-200"
                        >
                          เบอร์โทรศัพท์
                        </th>

                        {/* I2:I3 */}
                        <th
                          rowSpan={2}
                          className="border border-base-300 bg-base-200"
                        >
                          รายละเอียด ข้อมูลการให้คำปรึกษา
                        </th>

                        {/* J2:AB2 */}
                        <th
                          colSpan={18}
                          className="border border-base-300 bg-base-200"
                        >
                          ประเด็นที่พบจากการให้บริการปรึกษาทางด้านสุขภาพจิต
                        </th>

                        {/* AC2:AE2 */}
                        <th
                          colSpan={3}
                          className="border border-base-300 bg-base-200"
                        >
                          พลังใจ ( RQ )
                        </th>

                        {/* AF2:AH2 */}
                        <th
                          colSpan={3}
                          className="border border-base-300 bg-base-200"
                        >
                          ภาวะหมดไฟ ( Burn Out )
                        </th>

                        {/* AI2:AL2 */}
                        <th
                          colSpan={4}
                          className="border border-base-300 bg-base-200"
                        >
                          ความเครียด ( ST-5 )
                        </th>

                        {/* AM2:AP2 */}
                        <th
                          colSpan={4}
                          className="border border-base-300 bg-base-200"
                        >
                          คัดกรองโรคซึมเศร้า
                        </th>

                        {/* AQ2 (ไม่มี merge) */}
                        <th
                          rowSpan={1}
                          className="border border-base-300 bg-base-200"
                        >
                          เสี่ยงฆ่าตัวตาย
                        </th>

                        {/* AR2 ไม่มี เพราะใช้ rowSpan จากแถวที่ 1 แล้ว */}

                        {/* AS2:AS3, AT2:AT3, AU2:AU3 */}
                        <th
                          rowSpan={2}
                          className="border border-base-300 bg-base-200"
                        >
                          ระบุปัญหา
                        </th>
                        <th
                          rowSpan={2}
                          className="border border-base-300 bg-base-200"
                        >
                          หน่วยงานที่รับส่งต่อ
                        </th>
                        <th
                          rowSpan={2}
                          className="border border-base-300 bg-base-200"
                        >
                          การติดตาม<br />ระบุวิธีติดตาม
                        </th>

                        {/* AV2–AY2 ไม่มี เพราะใช้ rowSpan จากแถวที่ 1 แล้ว */}
                      </tr>

                      {/* แถวที่ 3 (หัวรายย่อย) */}
                      <tr>
                        {/* สาเหตุความเครียด (J3:AB3) */}
                        <th className="border border-base-300 bg-base-200">
                          ยาเสพติด
                        </th>
                        <th className="border border-base-300 bg-base-200">
                          จิตเวช
                        </th>
                        <th className="border border-base-300 bg-base-200">
                          เศรษฐกิจ/หนี้สิน
                        </th>
                        <th className="border border-base-300 bg-base-200">
                          ครอบครัว
                        </th>
                        <th className="border border-base-300 bg-base-200">
                          ความสัมพันธ์
                        </th>
                        <th className="border border-base-300 bg-base-200">
                          ปัญหาความรัก
                        </th>
                        <th className="border border-base-300 bg-base-200">
                          ตั้งครรภ์ไม่พร้อม
                        </th>
                        <th className="border border-base-300 bg-base-200">
                          การเรียน
                        </th>
                        <th className="border border-base-300 bg-base-200">
                          การพนัน
                        </th>
                        <th className="border border-base-300 bg-base-200">
                          ติดเกมส์
                        </th>
                        <th className="border border-base-300 bg-base-200">
                          เรื่องเพศ
                        </th>
                        <th className="border border-base-300 bg-base-200">
                          การทำงาน
                        </th>
                        <th className="border border-base-300 bg-base-200">
                          สุขภาพ
                        </th>
                        <th className="border border-base-300 bg-base-200">
                          การนอน
                        </th>
                        {/* <th className="border border-base-300 bg-base-200">
                          วิตกกังวล
                        </th> */}
                        <th className="border border-base-300 bg-base-200">
                          สูญเสีย คนในครอบครัว คนรัก สัตว์เลี้ยง
                        </th>
                        <th className="border border-base-300 bg-base-200">
                          สุขภาพ คนในครอบครัว คนรัก สัตว์เลี้ยง
                        </th>
                        <th className="border border-base-300 bg-base-200">
                          ไม่มีเรื่องเครียด
                        </th>
                        <th className="border border-base-300 bg-base-200">
                          อื่นๆ ระบุ
                        </th>

                        {/* พลังใจ (RQ) AC3:AE3 */}
                        <th className="border border-base-300 bg-base-200">
                          น้อย <br />( 3 - 14 คะแนน)
                        </th>
                        <th className="border border-base-300 bg-base-200">
                          ปานกลาง <br />( 15 - 23 คะแนน)
                        </th>
                        <th className="border border-base-300 bg-base-200">
                          มาก <br />( 24 - 30 คะแนน)
                        </th>

                        {/* Burn out AF3:AH3 */}
                        <th className="border border-base-300 bg-base-200">
                          น้อย <br />( 3 - 6 คะแนน)
                        </th>
                        <th className="border border-base-300 bg-base-200">
                          ปานกลาง <br />( 7 - 8 คะแนน)
                        </th>
                        <th className="border border-base-300 bg-base-200">
                          มาก <br />( 9 - 12 คะแนน)
                        </th>

                        {/* ST-5 AI3:AL3 */}
                        <th className="border border-base-300 bg-base-200">
                          เครียดน้อย <br />( 0 - 4 คะแนน)
                        </th>
                        <th className="border border-base-300 bg-base-200">
                          เครียดปานกลาง <br />( 5 - 7 คะแนน)
                        </th>
                        <th className="border border-base-300 bg-base-200">
                          เครียดมาก <br />( 8 - 9 คะแนน)
                        </th>
                        <th className="border border-base-300 bg-base-200">
                          เครียดมากที่สุด <br />( 10 - 15 คะแนน)
                        </th>

                        {/* คัดกรองโรคซึมเศร้า AM3:AP3 */}
                        <th className="border border-base-300 bg-base-200">
                          2Q ( มี )
                        </th>
                        <th className="border border-base-300 bg-base-200">
                          2Q ( ไม่มี )
                        </th>
                        <th className="border border-base-300 bg-base-200">
                          9Q ( ≤ 7 คะแนน)
                        </th>
                        <th className="border border-base-300 bg-base-200">
                          9Q ( &gt; 7 คะแนน)
                        </th>

                        {/* AQ3 (8Q) */}
                        <th className="border border-base-300 bg-base-200">
                          8Q ( ถ้า ≥ 17 คะแนนส่งต่อ รพ.ที่มีจิตแพทย์ด่วน )
                        </th>

                        {/* AR3 ใช้ rowSpan เกมแล้ว */}
                        {/* AS3~AU3 ใช้ rowSpan จากแถวที่ 2 */}
                      </tr>
                    </thead>

                    <tbody>
                      {dataSearch.map((person, index) => {
                        const screening = person.screenings || {};
                        const consult = screening.consult || {};

                        // การติดตาม / ส่งต่อ
                        let followText = "";
                        if (consult.follow_id === 1) followText = "ปกติ";
                        else if (consult.follow_id === 2) followText = "เฝ้าระวัง";
                        else if (consult.follow_id === 3) followText = "นัดหมาย";
                        else if (consult.follow_id === 3) followText = "ส่งต่อ";

                        if (consult.follow_date) {
                          followText += ` ${formatDateTH(consult.follow_date)}`;
                        }

                        // การให้ความช่วยเหลือ
                        const assistList = [
                          consult.assist_stress && "การจัดการความเครียด",
                          consult.assist_stress_relief_techniques && "เทคนิคคลายเครียด",
                          consult.assist_first_aid && "การปฐมพยาบาลทางใจเบื้องต้น (PFA)",
                          consult.assist_changing_perspectives && "การปรับเปลี่ยนมุมมองและทัศนคติ",
                          consult.assist_stress_relief_breathing_exercises && "การฝึกหายใจคลายเครียด",
                          consult.assist_initial_consultation && "การให้คำปรึกษาเบื้องต้น",
                          consult.assist_sleep && "การนอนหลับ",
                          consult.assist_exercise && "การออกกำลังกาย",
                          consult.assist_other && `อื่นๆ: ${consult.assist_other_detail || ""}`,
                        ].filter(Boolean);

                        const assistText = assistList.length > 0 ? assistList.join(" / ") : "-";

                        const tel = consult.follow_counseling_center_tel ? consult.follow_counseling_center_tel : person.tel ? person.tel : "-";

                        return (
                          <tr key={index}>
                            {/* 1 HN */}
                            <td className="border border-base-300 px-3 py-3 text-center">
                              {person.hn}
                            </td>

                            {/* 2 ชื่อ */}
                            <td className="border border-base-300 px-3 py-3">
                              {person.firstname}
                            </td>

                            {/* 3 สกุล */}
                            <td className="border border-base-300 px-3 py-3">
                              {person.lastname}
                            </td>

                            {/* 4 เลขบัตรประจำตัวประชาชน */}
                            <td className="border border-base-300 px-3 py-3 text-center">
                              {person.idcard || "-"}
                            </td>

                            {/* 5 เพศ */}
                            <td className="border border-base-300 px-3 py-3 text-center">
                              {person.sex?.title_th || "-"}
                            </td>

                            {/* 6 อายุ */}
                            <td className="border border-base-300 px-3 py-3 text-center">
                              {person.age ?? "-"}
                            </td>

                            {/* 7 หน่วยงาน */}
                            <td className="border border-base-300 px-3 py-3">
                              {person.organization?.title_th || "-"}
                            </td>

                            {/* 8 เบอร์โทรศัพท์ */}
                            <td className="border border-base-300 px-3 py-3 text-center">
                              {tel}
                            </td>

                            {/* 9 รายละเอียด ข้อมูลการให้คำปรึกษา */}
                            <td className="border border-base-300 px-3 py-3 text-center">
                              {consult.consulting || "-"}
                            </td>

                            {/* 10–28 สาเหตุความเครียด → checkbox */}
                            <td className="border border-base-300 px-3 py-3 text-center">
                              {renderCheckbox(consult.stress_narcotics)}
                            </td>
                            <td className="border border-base-300 px-3 py-3 text-center">
                              {renderCheckbox(consult.stress_psychiatry)}
                            </td>
                            <td className="border border-base-300 px-3 py-3 text-center">
                              {renderCheckbox(consult.stress_economy)}
                            </td>
                            <td className="border border-base-300 px-3 py-3 text-center">
                              {renderCheckbox(consult.stress_family)}
                            </td>
                            <td className="border border-base-300 px-3 py-3 text-center">
                              {renderCheckbox(consult.stress_relationship)}
                            </td>
                            <td className="border border-base-300 px-3 py-3 text-center">
                              {renderCheckbox(consult.stress_love)}
                            </td>
                            <td className="border border-base-300 px-3 py-3 text-center">
                              {renderCheckbox(consult.stress_unplanned)}
                            </td>
                            <td className="border border-base-300 px-3 py-3 text-center">
                              {renderCheckbox(consult.stress_learning)}
                            </td>
                            <td className="border border-base-300 px-3 py-3 text-center">
                              {renderCheckbox(consult.stress_gambling)}
                            </td>
                            <td className="border border-base-300 px-3 py-3 text-center">
                              {renderCheckbox(consult.stress_games)}
                            </td>
                            <td className="border border-base-300 px-3 py-3 text-center">
                              {renderCheckbox(consult.stress_sex)}
                            </td>
                            <td className="border border-base-300 px-3 py-3 text-center">
                              {renderCheckbox(consult.stress_work)}
                            </td>
                            <td className="border border-base-300 px-3 py-3 text-center">
                              {renderCheckbox(consult.stress_health)}
                            </td>
                            <td className="border border-base-300 px-3 py-3 text-center">
                              {renderCheckbox(consult.stress_sleep)}
                            </td>
                            {/* <td className="border border-base-300 px-3 py-3 text-center">
                              {renderCheckbox(consult.stress_anxious)}
                            </td> */}
                            <td className="border border-base-300 px-3 py-3 text-center">
                              {renderCheckbox(consult.stress_loss)}
                            </td>
                            <td className="border border-base-300 px-3 py-3 text-center">
                              {renderCheckbox(consult.stress_healthfamily)}
                            </td>
                            <td className="border border-base-300 px-3 py-3 text-center">
                              {renderCheckbox(consult.stress_no_check)}
                            </td>
                             <td className="border border-base-300 px-3 py-3 text-center">
                              {consult.stress_other}
                            </td>
                            

                            {/* 29–31 พลังใจ (RQ) */}
                            <td className="border border-base-300 px-3 py-3 text-center">
                              {renderCheckbox(consult.risk_rq_id === 1)}
                            </td>
                            <td className="border border-base-300 px-3 py-3 text-center">
                              {renderCheckbox(consult.risk_rq_id  === 2)}
                            </td>
                            <td className="border border-base-300 px-3 py-3 text-center">
                              {renderCheckbox(consult.risk_rq_id  === 3)}
                            </td>

                            {/* 32–34 Burn Out */}
                            <td className="border border-base-300 px-3 py-3 text-center">
                              {renderCheckbox(consult.risk_burn_out_id === 1)}
                            </td>
                            <td className="border border-base-300 px-3 py-3 text-center">
                              {renderCheckbox(consult.risk_burn_out_id === 2)}
                            </td>
                            <td className="border border-base-300 px-3 py-3 text-center">
                              {renderCheckbox(consult.risk_burn_out_id === 3)}
                            </td>

                            {/* 35–38 ST-5 */}
                            <td className="border border-base-300 px-3 py-3 text-center">
                              {renderCheckbox(consult.risk_st5_id === 1)}
                            </td>
                            <td className="border border-base-300 px-3 py-3 text-center">
                              {renderCheckbox(consult.risk_st5_id === 2)}
                            </td>
                            <td className="border border-base-300 px-3 py-3 text-center">
                              {renderCheckbox(consult.risk_st5_id === 3)}
                            </td>
                            <td className="border border-base-300 px-3 py-3 text-center">
                              {renderCheckbox(consult.risk_st5_id === 4)}
                            </td>

                            {/* 39–42 คัดกรองโรคซึมเศร้า */}
                            <td className="border border-base-300 px-3 py-3 text-center">
                              {renderCheckbox(consult.risk_depressed_2qplus === 2)}
                            </td>
                            <td className="border border-base-300 px-3 py-3 text-center">
                              {renderCheckbox(consult.risk_depressed_2qplus === 1)}
                            </td>
                            <td className="border border-base-300 px-3 py-3 text-center">
                              {renderCheckbox(
                               consult.risk_depressed_9q === 1
                              )}
                            </td>
                            <td className="border border-base-300 px-3 py-3 text-center">
                              {renderCheckbox(
                                consult.risk_depressed_9q === 2
                              )}
                            </td>

                            {/* 43 8Q (suicide risk) */}
                            <td className="border border-base-300 px-3 py-3 text-center">
                              {renderCheckbox(
                                consult.risk_depressed_9q === 2
                              )}
                            </td>

                            {/* 44 เฝ้าระวัง / นัดหมาย / ส่งต่อ */}
                            <td className="border border-base-300 px-3 py-3 text-center">
                              {followText || "-"}
                            </td>

                            {/* 45 ระบุปัญหา */}
                            <td className="border border-base-300 px-3 py-3 text-center">
                              {consult.forward_problem || "-"}
                            </td>

                            {/* 46 หน่วยงานที่รับส่งต่อ */}
                            <td className="border border-base-300 px-3 py-3 text-center">
                              {consult.forward_hospital || "-"}
                            </td>

                            {/* 47 การติดตาม / ระบุวิธีติดตาม */}
                            <td className="border border-base-300 px-3 py-3 text-center">
                              {consult.forward_how_to_follow || "-"}
                            </td>

                            {/* 48 การให้ความช่วยเหลือ */}
                            <td className="border border-base-300 px-3 py-3 text-center">
                              {assistText}
                            </td>

                            {/* 49 เจ้าหน้าที่ */}
                            <td className="border border-base-300 px-3 py-3 text-center">
                              {consult.create_by_account?.nickname || "-"}
                            </td>

                            {/* 50 หมายเหตุ */}
                            <td className="border border-base-300 px-3 py-3 text-center">
                              {person.important_information || "-"}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </>

            )}

          </div>
        </div>
      </div>
    </>
  );

}
