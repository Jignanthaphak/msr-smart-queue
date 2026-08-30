"use client"
import { useState, useEffect } from "react";
import useDefaultDataStore from "@/stores/useDefaultDataStore";
import { date, datetime, times, day, nowMs, nowSec, nowDate } from "@/lib/utils/dateFormat";
import { getreportexcel } from "@/services/report";
import { useAlert } from '@/lib/utils/useAlert';
import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';
import '@ant-design/v5-patch-for-react-19';
import { DatePicker, Select, Button, Space } from 'antd';
import dayjs from 'dayjs';

const { RangePicker } = DatePicker;
const { Option } = Select;

export default function Report() {

  const { showAlert, AlertComponent } = useAlert()
  const defaultData = useDefaultDataStore((state) => state.defaultData)
  
  const [startdate, setStartDate] = useState(date);
  const [enddate, setEndDate] = useState(date);
  const [province_id, setProvinceId] = useState("");
  const [district_id, setDistrictId] = useState("");
  const [subdistrict_id, setSubdistrictId] = useState("");
  const [organization_id, setOrganizationId] = useState("");
  const [districts, setDistricts] = useState([]);
  const [subdistricts, setSubdistricts] = useState([]);
  const [disableBntSearch, setDisableBntSearch] = useState(false);
  const [dataSearch, setDataSearch] = useState([]);
  const [loadingData, setLoadingData] = useState(false);

  useEffect(() => {

      setDistrictId("")
      setSubdistrictId("")

      const findDistricts = defaultData.districts?.filter(
        d => d.province_id === Number(province_id)
      )
      
      setDistricts(findDistricts)

    }, [province_id, defaultData]);

    useEffect(() => {
      
      setSubdistrictId("")

      const findSubdistricts = defaultData.subdistricts?.filter(
        d => d.district_id === Number(district_id)
      )
      setSubdistricts(findSubdistricts)

    }, [district_id, defaultData])

  const handleSearch = async (e)=>{

      try {

          e.preventDefault();
          setLoadingData(true)

          await showAlert({ title: 'กำลังค้นหาข้อมูล', icon: 'loading', type: 'loading', duration:500, loadingStyle: 'modal', allowOutsideClick: false, allowEscapeKey: false, allowEnterKey: false })

          e.preventDefault();

          setDisableBntSearch(true);

          const params = new URLSearchParams();

          params.append("startdate", startdate);
          params.append("enddate", enddate);
          params.append("organization_id", organization_id);
          params.append("province_id", province_id);
          params.append("district_id", district_id);
          params.append("subdistrict_id", subdistrict_id);
          
          const queryString = params.toString();

          const result = await getreportexcel(queryString)

       
          if (result?.ok && result?.data && result?.data?.length > 0) {
            setDataSearch(result.data);
          }

        } catch (err) {

          await showAlert({ title: 'เกิดข้อผิดพลาด', message: err.message, type: 'alert', icon: 'error' })

      } finally {

        setLoadingData(false)
        setDisableBntSearch(false)

      }

  }

  const exportExcelFromData = async ()=>{
    
    if (!dataSearch || dataSearch.length === 0) {
      alert('ไม่มีข้อมูลสำหรับ export');
      return;
    }
  
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('รายงาน Excel');
  
    // แถว 1
    worksheet.mergeCells('A1:C1');
    worksheet.getCell('A1').value = 'จำนวนผู้รับบริการ';
  
    worksheet.mergeCells('D1:U1');
    worksheet.getCell('D1').value = 'ผลการปฏิบัติงาน';

    worksheet.mergeCells('V1:AJ1');
    worksheet.getCell('V1').value = 'ความเสียง';

    worksheet.mergeCells('AK1:AN1');
    worksheet.getCell('AL1').value = 'การส่งต่อ';
  
    // แถว 2
    worksheet.mergeCells('A2:C2');
    worksheet.getCell('A2').value = 'Biofeedback';
  
    worksheet.mergeCells('D2:U2');
    worksheet.getCell('D2').value = 'สาเหตุตวามเครียด';

    // พลังใจ (RQ) V, W, X
    worksheet.mergeCells('V2:X2');
    worksheet.getCell('V2').value = 'พลังใจ (RQ)';

     // ภาวะหมดไฟ (Burn OUT) Y Z AA
    worksheet.mergeCells('Y2:AA2');
    worksheet.getCell('Y2').value = 'ภาวะหมดไฟ (Burn OUT)';

    // ความเครียด (ST-5) AB AC AD AE
    worksheet.mergeCells('AB2:AE2');
    worksheet.getCell('AB2').value = 'ความเครียด (ST-5)';

    // คัดกรองซึมเศร้า AF AG AH AI
    worksheet.mergeCells('AF2:AI2');
    worksheet.getCell('AF2').value = 'คัดกรองซึมเศร้า';

    // เสียงฆ่าตัวตาย (AJ)
    worksheet.getCell('AJ2').value = 'เสียงฆ่าตัวตาย';

    // การส่งต่อ (AK - AN) ถ้ามีข้อมูล list เป็นข้อความ ให้ใส่ในเซลล์ด้วย
    worksheet.mergeCells('AK2:AK4');
    worksheet.getCell('AK2').value = 'จำนวนส่งต่อทั้งหมด';

    worksheet.mergeCells('AL2:AL4');
    worksheet.getCell('AL2').value = 'ระบุปัญหา';

    worksheet.mergeCells('AM2:AM4');
    worksheet.getCell('AM2').value = 'หน่วยงานที่รับส่งต่อ';

    worksheet.mergeCells('AN2:AN4');
    worksheet.getCell('AN2').value = 'กาติดตาม';
  
    // แถว 3
    worksheet.mergeCells('A3:A4');
    worksheet.getCell('A4').value = 'รวม';
  
    worksheet.mergeCells('B3:B4');
    worksheet.getCell('B4').value = 'นัดหมายครั้งต่อไป';
  
    worksheet.mergeCells('C3:C4');
    worksheet.getCell('C4').value = 'ส่งต่อ';
  
    // สาเหตุตวามเครียดคอลัมน์ D3 ถึง S4
    const stressReasons = [
      'ยาเสพติด', 'จิดเวช', 'เศรษฐกิจ/หนี้สิน', 'ครอบครัว', 'ความสัมพันธ์',
      'ปัญหาความรัก', 'การตั้งครรภ์ไม่พร้อม', 'การเรียน', 'การพนัน', 'ติดเกมส์',
      'เรื่องเพศ', 'การทำงาน', 'หัวหน้างาน/เพื่อนร่วมงาน', 'สุขภาพ',
      // 'วิตกกังวล',
       'การนอน','สุขภาพ(คนในครอบครัว/คนรัก/สัตว์เลี้ยง)','สูญเสีย(คนในครอบครัว/คนรัก/สัตว์เลี้ยง)', 'อื่นๆ'
    ];
    for (let i = 0; i < stressReasons.length; i++) {
      const col = String.fromCharCode('D'.charCodeAt(0) + i);
      worksheet.mergeCells(`${col}3:${col}4`);
      worksheet.getCell(`${col}3`).value = stressReasons[i];
      worksheet.getCell(`${col}3`).alignment = { textRotation: 90, vertical: 'middle', horizontal: 'center' };
    }
  
     // พลังใจ (RQ)  V W X
    worksheet.getCell('V3').value = 'น้อย';
    worksheet.getCell('W3').value = 'ปานกลาง';
    worksheet.getCell('X3').value = 'มาก';

    // ภาวะหมดไฟ (Burn OUT)  Y Z AA
    worksheet.getCell('Y3').value = 'น้อย';
    worksheet.getCell('Z3').value = 'ปานกลาง';
    worksheet.getCell('AA3').value = 'มาก';

    // ความเครียด (ST-5) AB AC AD AE
    worksheet.getCell('AB3').value = 'เครียดน้อย';
    worksheet.getCell('AC3').value = 'เครียดปานกลาง';
    worksheet.getCell('AD3').value = 'เครียดมาก';
    worksheet.getCell('AE3').value = 'เครียดมากที่สุด';

    // คัดกรองซึมเศร้า AF AG AH AI
    worksheet.mergeCells('AF3:AG3');
    worksheet.getCell('AF3').value = '2Q+';
    worksheet.mergeCells('AH3:AI3');
    worksheet.getCell('AH3').value = '9Q';

    // เสียงฆ่าตัวตาย (AJ)
    worksheet.getCell('AJ3').value = '8Q';

    // แถว 4
    // พลังใจ (RQ)  V W X
    worksheet.getCell('V4').value = '3-14';
    worksheet.getCell('W4').value = '15-23';
    worksheet.getCell('X4').value = '24-30';

      // ภาวะหมดไฟ (Burn OUT)  Y Z AA
    worksheet.getCell('Y4').value = '3-6';
    worksheet.getCell('Z4').value = '7-8';
    worksheet.getCell('AA4').value = '9-12';

    // ความเครียด (ST-5) AB AC AD AE
    worksheet.getCell('AB4').value = '0-4';
    worksheet.getCell('AC4').value = '5-7';
    worksheet.getCell('AD4').value = '8-9';
    worksheet.getCell('AE4').value = '10-15';

    // คัดกรองซึมเศร้า AF AG AH AI
    worksheet.getCell('AF4').value = 'ไม่มี';
    worksheet.getCell('AG4').value = 'มี';
    worksheet.getCell('AH4').value = '≤7';
    worksheet.getCell('AI4').value = '≥7';

   // เสียงฆ่าตัวตาย (AJ)
    worksheet.getCell('AJ4').value = '≥17 ส่งต่อด่วน';
  
    // Style header 4 แถว
    for (let i = 1; i <= 4; i++) {
      const row = worksheet.getRow(i);
      row.height = 30;
      row.eachCell(cell => {
        cell.font = { name: 'TH Sarabun New', size: 14, bold: true, color: { argb: 'FFFFFFFF' } };
        cell.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: '39876d' } };
        cell.border = {
          top: { style: 'thin', color: { argb: 'FFFFFFFF' } },
          left: { style: 'thin', color: { argb: 'FFFFFFFF' } },
          bottom: { style: 'thin', color: { argb: 'FFFFFFFF' } },
          right: { style: 'thin', color: { argb: 'FFFFFFFF' } },
        };
      });
    }
  
    // --- 5. ปรับความกว้างคอลัมน์ ---
    worksheet.columns.forEach((col) => {
      let maxLength = 10;
      col.eachCell({ includeEmpty: true }, (cell) => {
        const cellValue = cell.value ? cell.value.toString() : '';
        maxLength = Math.max(maxLength, cellValue.length);
      });
      col.width = maxLength + 4;
    });

    let rowIndex = 5; 

    dataSearch.forEach(item => {
      const row = worksheet.getRow(rowIndex++);

      // กำหนดค่าตามคีย์ที่มี
      row.getCell('A').value = item.cnt_all ?? 0;             
      row.getCell('B').value = item.cnt_appointment ?? 0;     
      row.getCell('C').value = item.cnt_forward ?? 0;     

      // สาเหตุความเครียด (D ถึง S) 16 ค่า
      const stressKeys = [
        'cnt_narcotics', 'cnt_psychiatry', 'cnt_economy', 'cnt_family', 'cnt_relationship',
        'cnt_love', 'cnt_unplanned', 'cnt_learning', 'cnt_gambling', 'cnt_games',
        'cnt_sex', 'cnt_work', 'cnt_colleague', 'cnt_health',
        // 'cnt_anxious',
        'cnt_sleep', 'cnt_healthfamily', 'cnt_loss', 'cnt_other'
      ];
      for (let i = 0; i < stressKeys.length; i++) {
        const col = String.fromCharCode('D'.charCodeAt(0) + i);
        row.getCell(col).value = item[stressKeys[i]] ?? 0;
      }

      // พลังใจ (RQ) V, W, X
      row.getCell('V').value = item.cnt_qr_little ?? 0;
      row.getCell('W').value = item.cnt_qr_moderate ?? 0;
      row.getCell('X').value = item.cnt_qr_high ?? 0;

      // ภาวะหมดไฟ (Burn OUT) Y Z AA
      row.getCell('Y').value = item.cnt_bo_little ?? 0;
      row.getCell('Z').value = item.cnt_bo_moderate ?? 0;
      row.getCell('AA').value = item.cnt_bo_high ?? 0;

      // ความเครียด (ST-5) AB AC AD AE
      row.getCell('AB').value = item.cnt_st5_little ?? 0;
      row.getCell('AC').value = item.cnt_st5_moderate ?? 0;
      row.getCell('AD').value = item.cnt_st5_high ?? 0;
      row.getCell('AE').value = item.cnt_st5_veryhigh ?? 0;

      // คัดกรองซึมเศร้า AF AG AH AI
      row.getCell('AF').value = item.cnt_depressed_q2plus_not ?? 0;
      row.getCell('AG').value = item.cnt_depressed_q2plus_check ?? 0;

      row.getCell('AH').value = item.cnt_depressed_9q_not ?? 0;
      row.getCell('AI').value = item.cnt_depressed_9q_check ?? 0;

      // เสียงฆ่าตัวตาย (AJ)
      row.getCell('AJ').value = item.cnt_suicide_check ?? 0;

      // การส่งต่อ (AK - AN) ถ้ามีข้อมูล list เป็นข้อความ ให้ใส่ในเซลล์ด้วย
      row.getCell('AK').value = item.cnt_forward ?? 0;
      row.getCell('AL').value = item.list_follow_problem || '';
      row.getCell('AM').value = item.list_forward_hospital || '';
      row.getCell('AN').value = item.list_how_to_follow || '';

      // ตกแต่ง style แถวข้อมูล
      row.height = 20;
      row.eachCell(cell => {
        cell.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
        cell.font = { name: 'TH Sarabun New', size: 14 };
        cell.border = {
          top: { style: 'thin' },
          left: { style: 'thin' },
          bottom: { style: 'thin' },
          right: { style: 'thin' },
        };
      });
    });
    
      
    // --- 6. ดาวน์โหลดไฟล์ ---
    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });

    const now = new Date();

    // ฟอร์แมต YYYYMMDD_HHmmss (ปีเดือนวัน_ชั่วโมงนาทีวินาที)
    const pad = (n) => n.toString().padStart(2, '0');
    const dateStr = 
      now.getFullYear().toString() +
      pad(now.getMonth() + 1) +
      pad(now.getDate()) + '_' +
      pad(now.getHours()) +
      pad(now.getMinutes()) +
      pad(now.getSeconds());

    const filename = `รายงาน_Excel_${dateStr}.xlsx`;

    saveAs(blob, filename);

  }
    
  return (
    <>
      
      <div className="justify-center w-[95%] min-h-screen m-auto ">
      
      <fieldset className="flex flex-col max-w-[70%] w-full m-auto p-4 border rounded-box bg-base-200 border-base-300">
        <legend className="fieldset-legend text-[20px]">ค้นหา</legend>

      <Space wrap className="w-full justify-center gap-4">
        {/* Start Date */}
        <div>
          <label>เริ่ม</label>
          <DatePicker 
            value={startdate ? dayjs(startdate) : null} 
            onChange={(date, dateString) => setStartDate(dateString)} 
            format="YYYY-MM-DD"
            allowClear
          />
        </div>

        {/* End Date */}
        <div>
          <label>สิ้นสุด</label>
          <DatePicker 
            value={enddate ? dayjs(enddate) : null} 
            onChange={(date, dateString) => setEndDate(dateString)} 
            format="YYYY-MM-DD"
            allowClear
          />
        </div>

        {/* Organization */}
        <Select
          placeholder="-- หน่วยงาน --"
          value={organization_id || null}   // เริ่มต้นว่าง
          onChange={setOrganizationId}
          style={{ width: 180 }}
       
        >
          <Option key={0} value={""}>-- หน่วยงานทั้งหมด --</Option>
          {defaultData?.organizations?.map(org => (
            <Option key={org.organization_id} value={org.organization_id}>
              {org.title_th}
            </Option>
          ))}
        </Select>

        {/* Province */}
        <Select
          placeholder="-- เลือกจังหวัด --"
          value={province_id || null}       // เริ่มต้นว่าง
          onChange={setProvinceId}
          style={{ width: 180 }}
         
        >
          <Option key={0} value={""}>-- เลือกจังหวัดทั้งหมด --</Option>
          {defaultData?.provinces?.map(p => (
            <Option key={p.id} value={p.id}>{p.name_in_thai}</Option>
          ))}
        </Select>

        {/* District */}
        <Select
          placeholder="-- เลือกอำเภอ --"
          value={district_id || null}       // เริ่มต้นว่าง
          onChange={setDistrictId}
          style={{ width: 180 }}
       
        >
            <Option key={0} value={""}>-- เลือกอำเภอทั้งหมด --</Option>
          {districts?.map(d => (
            <Option key={d.id} value={d.id}>{d.name_in_thai}</Option>
          ))}
        </Select>

        {/* Subdistrict */}
        <Select
          placeholder="-- เลือกตำบล --"
          value={subdistrict_id || null}    // เริ่มต้นว่าง
          onChange={setSubdistrictId}
          style={{ width: 180 }}
        
        >
            <Option key={0} value={""}>-- เลือกตำบลทั้งหมด --</Option>
          {subdistricts?.map(s => (
            <Option key={s.id} value={s.id}>{s.name_in_thai}</Option>
          ))}
        </Select>

        {/* Buttons */}
        <Button 
          type="primary" 
          onClick={handleSearch} 
          loading={disableBntSearch}
        >
          ค้นหา
        </Button>

        <Button onClick={exportExcelFromData}>
          Export Excel
        </Button>
      </Space>

      </fieldset>

        <div  className="mt-5 overflow-x-auto rounded-lg ">

          <table id="reportTable" className="table bg-white report1">
         
            <thead>
              <tr>
                <th colSpan={3}> จำนวนผู้รับบริการ </th>
                <th colSpan={18}> ผลการปฏิบัติงาน </th>
                <th colSpan={15}> ความเสียง </th>
                <th colSpan={4}> การส่งต่อ </th>
              </tr>
              <tr>
                <th colSpan={3}> Biofeedback </th>
                <th colSpan={18}> สาเหตุตวามเครียด </th>

                <th colSpan={3}> พลังใจ (RQ) </th>
                <th colSpan={3}> ภาวะหมดไฟ (Burn OUT) </th>
                <th colSpan={4}> ความเครียด (ST-5) </th>
                <th colSpan={4}> คัดกรองซึมเศร้า </th>
                <th colSpan={1}> เสียงฆ่าตัวตาย </th>

                <th rowSpan={3}> จำนวนส่งต่อทั้งหมด </th>
                <th rowSpan={3}> ระบุปัญหา </th>
                <th rowSpan={3}> หน่วยงานที่รับส่งต่อ </th>
                <th rowSpan={3}> กาติดตาม </th>
              
              </tr>
              <tr>
                <th rowSpan={2}> รวม </th>
                <th rowSpan={2}> นัดหมายครั้งต่อไป </th>
                <th rowSpan={2}> ส่งต่อ </th>

                <th className="vertical" rowSpan={2}> ยาเสพติด </th>
                <th className="vertical" rowSpan={2}> จิดเวช </th>
                <th className="vertical" rowSpan={2}> เศรษฐกิจ/หนี้สิน </th>
                <th className="vertical" rowSpan={2}> ครอบครัว </th>
                <th className="vertical" rowSpan={2}> ความสัมพันธ์ </th>
                <th className="vertical" rowSpan={2}> ปัญหาความรัก </th>
                <th className="vertical" rowSpan={2}> การตั้งครรภ์ไม่พร้อม </th>
                <th className="vertical" rowSpan={2}> การเรียน </th>
                <th className="vertical" rowSpan={2}> การพนัน </th>
                <th className="vertical" rowSpan={2}> ติดเกมส์ </th>
                <th className="vertical" rowSpan={2}> เรื่องเพศ </th>
                <th className="vertical" rowSpan={2}> การทำงาน </th>
                <th className="vertical" rowSpan={2}> หัวหน้างาน/เพื่อนร่วมงาน </th>
                <th className="vertical" rowSpan={2}> สุขภาพ </th>
                {/* <th className="vertical" rowSpan={2}> วิตกกังวล </th> */}
                <th className="vertical" rowSpan={2}> การนอน </th>
                <th className="vertical" rowSpan={2}> สุขภาพ(คนในครอบครัว/คนรัก/สัตว์เลี้ยง) </th>
                <th className="vertical" rowSpan={2}> สูญเสีย(คนในครอบครัว/คนรัก/สัตว์เลี้ยง) </th>
                <th className="vertical" rowSpan={2}> อื่นๆ </th>

                <th rowSpan={1}> น้อย </th>
                <th rowSpan={1}> ปานกลาง </th>
                <th rowSpan={1}> มาก </th>

                <th rowSpan={1}> น้อย </th>
                <th rowSpan={1}> ปานกลาง </th>
                <th rowSpan={1}> มาก </th>

                <th rowSpan={1}> เครียดน้อย </th>
                <th rowSpan={1}> เครียดปานกลาง </th>
                <th rowSpan={1}> เครียดมาก </th>
                <th rowSpan={1}> เครียดมากที่สุด </th>

                <th colSpan={2}> 2Q+   </th>
                <th colSpan={2}> 9Q </th>

                <th rowSpan={1}> 8Q </th>
              
              </tr>
              <tr>
                <th rowSpan={1}> 3-14 </th>
                <th rowSpan={1}> 15-23 </th>
                <th rowSpan={1}> 24-30 </th>

                <th rowSpan={1}> 3-6 </th>
                <th rowSpan={1}> 7-8 </th>
                <th rowSpan={1}> 9-12 </th>

                <th rowSpan={1}> 0-4</th>
                <th rowSpan={1}> 5-7 </th>
                <th rowSpan={1}> 8-9 </th>
                <th rowSpan={1}> 10-15 </th>

                <th rowSpan={1}> ไม่มี </th>
                <th rowSpan={1}> มี </th>

                <th rowSpan={1}> ≤7 </th>
                <th rowSpan={1}> ≥7 </th>

                <th rowSpan={1}> ≥17 ส่งต่อด่วน </th>
                
              
              </tr>
            </thead>
            <tbody>

              {loadingData ? (
                
                <tr>
                  <td colSpan="100%"  className="text-center">
                    <span className="loading loading-bars loading-xl"></span>
                  </td>
                </tr>

              ) : dataSearch && dataSearch.length === 0 ? (

                <tr>
                  <td colSpan="100%" className="text-center text-gray-500">
                    ไม่มีข้อมูล
                  </td>
                </tr>

              ) : (

                dataSearch?.map((p, index) => (
                  <tr key={index}>
                    <td>{p.cnt_all}</td>
                    <td>{p.cnt_appointment}</td>
                    <td>{p.cnt_forward}</td>
                    <td>{p.cnt_narcotics}</td>
                    <td>{p.cnt_psychiatry}</td>
                    <td>{p.cnt_economy}</td>
                    <td>{p.cnt_family}</td>
                    <td>{p.cnt_relationship}</td>
                    <td>{p.cnt_love}</td>
                    <td>{p.cnt_unplanned}</td>
                    <td>{p.cnt_learning}</td>
                    <td>{p.cnt_gambling}</td>
                    <td>{p.cnt_games}</td>
                    <td>{p.cnt_sex}</td>
                    <td>{p.cnt_work}</td>
                    <td>{p.cnt_colleague}</td>
                    <td>{p.cnt_health}</td>
                    {/* <td>{p.cnt_anxious}</td> */}
                    <td>{p.cnt_sleep}</td>
                    <td>{p.cnt_healthfamily}</td>
                    <td>{p.cnt_loss}</td>
                    <td>{p.cnt_other}</td>

                    <td>{p.cnt_qr_little}</td>
                    <td>{p.cnt_qr_moderate}</td>
                    <td>{p.cnt_qr_high}</td>

                    <td>{p.cnt_bo_little}</td>
                    <td>{p.cnt_bo_moderate}</td>
                    <td>{p.cnt_bo_high}</td>

                    <td>{p.cnt_st5_little}</td>
                    <td>{p.cnt_st5_moderate}</td>
                    <td>{p.cnt_st5_high}</td>
                    <td>{p.cnt_st5_veryhigh}</td>

                    <td>{p.cnt_depressed_q2plus_not}</td>
                    <td>{p.cnt_depressed_q2plus_check}</td>
                   
                    <td>{p.cnt_depressed_9q_not}</td>
                    <td>{p.cnt_depressed_9q_check}</td>

                    <td>{p.cnt_suicide_check}</td>
                    <td>{p.cnt_forward}</td>

                    <td>
                      {p.list_follow_problem?.split('\n').map((line, idx) => (
                        <div className="list" key={idx}>{line}</div>
                      ))}
                    </td>
                    <td>
                      {p.list_forward_hospital?.split('\n').map((line, idx) => (
                        <div className="list" key={idx}>{line}</div>
                      ))}
                    </td>
                    <td>
                      {p.list_how_to_follow?.split('\n').map((line, idx) => (
                        <div className="list" key={idx}>{line}</div>
                      ))}
                    </td>
                  </tr>
                ))
                
              )}

        
            </tbody>
          </table>
        </div>

      </div>
      {AlertComponent}
    </>
  );

}