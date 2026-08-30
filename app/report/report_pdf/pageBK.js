"use client"
import { useState, useEffect } from "react";
import useDefaultDataStore from "@/stores/useDefaultDataStore";
import { getreportpdf } from "@/services/report";
import Swal from 'sweetalert2';
import { saveAs } from 'file-saver';
import jsPDF from "jspdf";
import "jspdf-autotable";
import '@ant-design/v5-patch-for-react-19';
import { DatePicker, Select, Button, Space, Form } from "antd";
import dayjs from 'dayjs';
import { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType, ImageRun } from "docx";

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
    setTimeout(() => {
      setLoadingData(false);
    }, 500);

  }, [loadingData]);

  const handleSearch = async (e)=>{

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

            e.preventDefault();

            setDisableBntSearch(true);

            const params = new URLSearchParams();

            params.append("startdate", startdate);
            params.append("enddate", enddate);
            params.append("organization_id", organization_id);
            
            const queryString = params.toString();
            const result = await getreportpdf(queryString)
            if (result?.ok && result?.data && result?.data?.length > 0) {
              setDataSearch(result.data);
            }

            Swal.close();

            setLoadingData(false)
            
        } catch (err) {

            setDataSearch([]);

            Swal.fire('เกิดข้อผิดพลาด!', err.message, 'error');

        }finally{
          
            setDisableBntSearch(false);

            console.log(dataSearch)

        }

  }

  async function loadFontBase64(url) {
    const response = await fetch(url);
    const fontBlob = await response.blob();
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result.split(",")[1]); // เอาเฉพาะ base64 ไม่เอา data:image/...
      reader.onerror = reject;
      reader.readAsDataURL(fontBlob);
    });
  }
  

  const exportPDFFromData = async () => {
    if (!dataSearch || dataSearch.length === 0) {
      alert("ไม่มีข้อมูลสำหรับ export");
      return;
    }
  
    const bgBase64 = await toBase64("/images/bg-pdf/bg.png");
    const d = dataSearch[0];
    const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
    const pageWidth = 210;
  
    // โหลดฟ้อนต์ (ฟังก์ชัน loadFontBase64 ต้องเตรียมไว้แล้ว)
    const base64Font = await loadFontBase64("/fonts/THSarabunNew.ttf");
    doc.addFileToVFS("THSarabunNew.ttf", base64Font);
    doc.addFont("THSarabunNew.ttf", "THSarabunNew", "normal");
    doc.setFont("THSarabunNew");
    doc.setTextColor(0, 0, 0);
  
    // ฟังก์ชันพิมพ์หัวกระดาษ (ถ้ามี)
    function printHeader() {
      let yHeader = 40;
      doc.setFontSize(18);
      doc.text("บริการตรวจประเมินความเครียดด้านสรีรวิทยาด้วยเครื่อง Biofeedback และการให้การปรึกษาด้านสุขภาพจิต", pageWidth / 2, yHeader, { align: "center" });
      yHeader += 10;
      doc.setFontSize(14);
      doc.text(dateText, pageWidth / 2, yHeader, { align: "center" });
      yHeader += 8;
      doc.text(`ณ ${d.organization_name ?? "-"}`, pageWidth / 2, yHeader, { align: "center" });
      yHeader += 8;
      doc.text(`ผู้เข้ารับบริการทั้งสิ้น จำนวน ${d.cnt_bio_all ?? "0"} คน `, pageWidth / 2, yHeader, { align: "center" });
      doc.text(`เฉพาะผู้ที่ผ่านการตรวจประเมินด้วยเครื่อง Biofeedback มีข้อมูลดังนี้`, pageWidth / 2, yHeader, { align: "left" });
      return yHeader + 12; // return y หลังหัวกระดาษเพื่อเริ่มเนื้อหา
    }
  
    // กำหนดตำแหน่งคอลัมน์ (หน่วย mm)
    const col1X = 30; // padding-left 45 จาก margin ซ้าย 20
    const col2X = 150;      // "จำนวน"
    const col3X = 175;     // จำนวนตัวเลข (จัดขวา)
    const col4X = 180;     // "คน"
  
    doc.setFontSize(14);
  
    // ฟังก์ชันเขียน section รับ title กับ items, และ y เริ่มต้น
    // คืนค่า y หลังจากเขียนเสร็จ
    function writeSection(title, items, startY) {
      let y = startY;
      doc.setFontSize(14);
      doc.text(title, 20, y);
      y += 8;
      doc.setFontSize(12);
      items.forEach(([label, value]) => {
        doc.text(label, col1X, y);
        doc.text("จำนวน", col2X, y);
        doc.text(String(value), col3X, y, { align: "right" });
        doc.text("คน", col4X, y);
        y += 7+2;
      });
      y += 5;
      return y;
    }
  
    // เริ่มสร้าง PDF หน้าแรก พร้อม bg และ header
    doc.addImage(bgBase64, "PNG", 0, 0, 210, 297);
    let y = printHeader();
  
    // หน้า 1: ข้อ 1 - 4
    y = writeSection("1. เพศ", [
      ["ชาย", d.cnt_bio_male ?? "0"],
      ["หญิง", d.cnt_bio_female ?? "0"],
    ], y);
  
    y = writeSection("2. การทำงานของระบบประสาทอัตโนมัติ", [
      ["แย่มาก", d.cnt_bio_ans_activity_bad ?? "0"],
      ["ไม่ดี", d.cnt_bio_ans_activity_poor ?? "0"],
      ["ปกติ", d.cnt_bio_ans_activity_normal ?? "0"],
      ["ดี", d.cnt_bio_ans_activity_good ?? "0"],
      ["ดีมาก", d.cnt_bio_ans_activity_excellent ?? "0"],
    ], y);
  
    y = writeSection("3. ความสมดุลของระบบประสาทอัตโนมัติ", [
      ["ไม่สมดุลอย่างมาก", d.cnt_bio_ans_balance_highly_unbalanced ?? "0"],
      ["ไม่สมดุล", d.cnt_bio_ans_balance_unbalanced ?? "0"],
      ["สมดุล", d.cnt_bio_ans_balance_balanced ?? "0"],
    ], y);
  
    y = writeSection("4. ความทนทานต่อความเครียด", [
      ["แย่มาก", d.cnt_bio_stress_resistance_bad ?? "0"],
      ["ไม่ดี", d.cnt_bio_stress_resistance_poor ?? "0"],
      ["ปกติ", d.cnt_bio_stress_resistance_normal ?? "0"],
      ["ดี", d.cnt_bio_stress_resistance_good ?? "0"],
      ["ดีมาก", d.cnt_bio_stress_resistance_excellent ?? "0"],
    ], y);
  
    // หน้า 2: ข้อ 5 - 9
    doc.addPage();
    doc.addImage(bgBase64, "PNG", 0, 0, 210, 297);
    y = 50; // เริ่ม y หน้าใหม่
  
    y = writeSection("5. ระดับความเครียด", [
      ["แย่มาก", d.cnt_bio_stress_index_bad ?? "0"],
      ["ไม่ดี", d.cnt_bio_stress_index_poor ?? "0"],
      ["ปกติ", d.cnt_bio_stress_index_normal ?? "0"],
      ["ดี", d.cnt_bio_stress_index_good ?? "0"],
      ["ดีมาก", d.cnt_bio_stress_index_excellent ?? "0"],
    ], y);
  
    y = writeSection("6. ความเหนื่อยล้าของร่างกาย", [
      ["แย่มาก", d.cnt_bio_fatigue_index_bad ?? "0"],
      ["ไม่ดี", d.cnt_bio_fatigue_index_poor ?? "0"],
      ["ปกติ", d.cnt_bio_fatigue_index_normal ?? "0"],
      ["ดี", d.cnt_bio_fatigue_index_good ?? "0"],
      ["ดีมาก", d.cnt_bio_fatigue_index_excellent ?? "0"],
    ], y);
  
    y = writeSection("7. ระดับของสภาวะหลอดเลือด", [
      ["Level 1", d.cnt_bio_wave_level_level1 ?? "0"],
      ["Level 2", d.cnt_bio_wave_level_level2 ?? "0"],
      ["Level 3", d.cnt_bio_wave_level_level3 ?? "0"],
      ["Level 4", d.cnt_bio_wave_level_level4 ?? "0"],
      ["Level 5", d.cnt_bio_wave_level_level5 ?? "0"],
      ["Level 6", d.cnt_bio_wave_level_level6 ?? "0"],
      ["Level 7", d.cnt_bio_wave_level_level7 ?? "0"],
    ], y);
  
    y = writeSection("8. ส่งต่อ รักษาตามสิทธิ์", [
      ["", d.cnt_consult_forward ?? "0"],
    ], y);
  
    y = writeSection("9. เฝ้าระวัง/ติดตามอาการ", [
      ["", d.cnt_consult_watchout ?? "0"],
    ], y);
  
    // หน้า 3: ข้อ 10
    doc.addPage();
    doc.addImage(bgBase64, "PNG", 0, 0, 210, 297);
    y = 50;
  
    y = writeSection("10. ปัจจัยที่ส่งผลต่อความเครียดพนักงาน", [
      ["ยาเสพติด", d.cnt_consult_stress_narcotics ?? "0"],
      ["จิตเวช", d.cnt_consult_stress_psychiatry ?? "0"],
      ["เศรษฐกิจ/หนี้สิน", d.cnt_consult_stress_economy ?? "0"],
      ["ครอบครัว", d.cnt_consult_stress_family ?? "0"],
      ["ความสัมพันธ์", d.cnt_consult_stress_relationship ?? "0"],
      ["ปัญหาความรัก", d.cnt_consult_stress_love ?? "0"],
      ["ตั้งครรภ์ไม่พร้อม", d.cnt_consult_stress_unplanned ?? "0"],
      ["การเรียน", d.cnt_consult_stress_learning ?? "0"],
      ["การพนัน", d.cnt_consult_stress_gambling ?? "0"],
      ["ติดเกมส์", d.cnt_consult_stress_games ?? "0"],
      ["เรื่องเพศ", d.cnt_consult_stress_sex ?? "0"],
      ["การทำงาน", d.cnt_consult_stress_work ?? "0"],
      ["สุขภาพ", d.cnt_consult_stress_health ?? "0"],
      // ["วิตกกังวล", d.cnt_consult_stress_anxious ?? "0"],
      ["การนอน", d.cnt_consult_stress_sleep ?? "0"],
      ["สุขภาพ(คนในครอบครัว/คนรัก/สัตว์เลี้ยง)", d.stress_healthfamily ?? "0"],
      ["สูญเสีย(คนในครอบครัว/คนรัก/สัตว์เลี้ยง)", d.stress_loss ?? "0"],
    ], y);

      // ✅ เพิ่มหัวข้อ "อื่นๆ"
      y -= 5;
      doc.setFontSize(12);
      doc.text("อื่นๆ", col1X, y); // col1X คือจุดเริ่มของ "label"
      y += 6;

      // ✅ แสดงรายการจาก list_stress_other
      const otherList = (d.list_stress_other ?? "").split("\n").filter(i => i.trim() !== "");

      for (const item of otherList) {
        doc.text(` ${item}`, col1X + 8, y); // ขยับเข้าไปอีกนิด
        y += 6;
      }
  
    doc.save(`รายงานความเครียด_${dateText}.pdf`);
  };


const exportWordFromData = async () => {
  if (!dataSearch || dataSearch.length === 0) {
    alert("ไม่มีข้อมูลสำหรับ export");
    return;
  }

  const d = dataSearch[0];
  const bgBase64 = await toBase64("/images/bg-pdf/bg.png"); // base64 ของ bg

  const makeSection = (title, items) => {
    const children = [
      new Paragraph({
        text: title,
        heading: HeadingLevel.HEADING_2,
        spacing: { before: 300, after: 150 },
        thematicBreak: true, // ใส่เส้นคั่นใต้หัวข้อ
        style: "heading2",
      }),
    ];

    items.forEach(([label, value]) => {
      children.push(
        new Paragraph({
          children: [
            new TextRun({
              text: `${label}  `,
              bold: true,
              size: 24, // 12pt
              font: "TH Sarabun New",
            }),
            new TextRun({
              text: `จำนวน: ${value ?? "0"} คน`,
              size: 24,
              font: "TH Sarabun New",
            }),
          ],
          spacing: { after: 120 },
        })
      );
    });

    return children;
  };

  const createPage = (contentChildren = []) => ({
    properties: {
      page: { size: { width: 11906, height: 16838 } }, // A4 twips
    },
    children: [
      // BG behind text
      new Paragraph({
        children: [
          new ImageRun({
            data: Uint8Array.from(atob(bgBase64), (c) => c.charCodeAt(0)),
            transformation: { width: 595, height: 842 },
            floating: { horizontalPosition: { offset: 0 }, verticalPosition: { offset: 0 }, behindDocument: true },
          }),
        ],
      }),

      // เนื้อหา
      ...contentChildren,
    ],
  });

  // หน้าแรก: header + section 1-4
  const headerChildren = [
    new Paragraph({
      text: "บริการตรวจประเมินความเครียดด้านสรีรวิทยาด้วยเครื่อง Biofeedback และการให้การปรึกษาด้านสุขภาพจิต",
      heading: HeadingLevel.TITLE,
      alignment: AlignmentType.CENTER,
      spacing: { after: 300 },
      style: "title",
      children: [
        new TextRun({ font: "TH Sarabun New", size: 32, bold: true }),
      ],
    }),
    new Paragraph({ text: dateText, alignment: AlignmentType.CENTER, spacing: { after: 100 }, style: "subtitle" }),
    new Paragraph({ text: `ณ ${d.organization_name ?? "-"}`, alignment: AlignmentType.CENTER, spacing: { after: 200 }, style: "subtitle" }),
    new Paragraph({
      text: `ผู้เข้ารับบริการทั้งสิ้น จำนวน ${d.cnt_bio_all ?? "0"} คน `,
      alignment: AlignmentType.CENTER,

    
      spacing: { after: 300 },
      style: "subtitle",
    }),
    
    new Paragraph({
      

      text: `เฉพาะผู้ที่ผ่านการตรวจประเมินด้วยเครื่อง Biofeedback มีข้อมูลดังนี้`,
      alignment: AlignmentType.CENTER,

      spacing: { after: 400 },
      style: "subtitle",
    }),
    ...makeSection("1. เพศ", [
      ["ชาย", d.cnt_bio_male],
      ["หญิง", d.cnt_bio_female],
    ]),
    ...makeSection("2. การทำงานของระบบประสาทอัตโนมัติ", [
      ["แย่มาก", d.cnt_bio_ans_activity_bad],
      ["ไม่ดี", d.cnt_bio_ans_activity_poor],
      ["ปกติ", d.cnt_bio_ans_activity_normal],
      ["ดี", d.cnt_bio_ans_activity_good],
      ["ดีมาก", d.cnt_bio_ans_activity_excellent],
    ]),
    ...makeSection("3. ความสมดุลของระบบประสาทอัตโนมัติ", [
      ["ไม่สมดุลอย่างมาก", d.cnt_bio_ans_balance_highly_unbalanced],
      ["ไม่สมดุล", d.cnt_bio_ans_balance_unbalanced],
      ["สมดุล", d.cnt_bio_ans_balance_balanced],
    ]),
    ...makeSection("4. ความทนทานต่อความเครียด", [
      ["แย่มาก", d.cnt_bio_stress_resistance_bad],
      ["ไม่ดี", d.cnt_bio_stress_resistance_poor],
      ["ปกติ", d.cnt_bio_stress_resistance_normal],
      ["ดี", d.cnt_bio_stress_resistance_good],
      ["ดีมาก", d.cnt_bio_stress_resistance_excellent],
    ]),
  ];

  const sections = [createPage(headerChildren)];

  // หน้า 2 และ 3 ทำเหมือนเดิม สามารถเรียก createPage([...]) ได้
  // section 5-9
  const page2Children = [
    ...makeSection("5. ระดับความเครียด", [
      ["แย่มาก", d.cnt_bio_stress_index_bad],
      ["ไม่ดี", d.cnt_bio_stress_index_poor],
      ["ปกติ", d.cnt_bio_stress_index_normal],
      ["ดี", d.cnt_bio_stress_index_good],
      ["ดีมาก", d.cnt_bio_stress_index_excellent],
    ]),
    ...makeSection("6. ความเหนื่อยล้าของร่างกาย", [
      ["แย่มาก", d.cnt_bio_fatigue_index_bad],
      ["ไม่ดี", d.cnt_bio_fatigue_index_poor],
      ["ปกติ", d.cnt_bio_fatigue_index_normal],
      ["ดี", d.cnt_bio_fatigue_index_good],
      ["ดีมาก", d.cnt_bio_fatigue_index_excellent],
    ]),
    ...makeSection("7. ระดับของสภาวะหลอดเลือด", [
      ["Level 1", d.cnt_bio_wave_level_level1],
      ["Level 2", d.cnt_bio_wave_level_level2],
      ["Level 3", d.cnt_bio_wave_level_level3],
      ["Level 4", d.cnt_bio_wave_level_level4],
      ["Level 5", d.cnt_bio_wave_level_level5],
      ["Level 6", d.cnt_bio_wave_level_level6],
      ["Level 7", d.cnt_bio_wave_level_level7],
    ]),
    ...makeSection("8. ส่งต่อ รักษาตามสิทธิ์", [["", d.cnt_consult_forward]]),
    ...makeSection("9. เฝ้าระวัง/ติดตามอาการ", [["", d.cnt_consult_watchout]]),
  ];
  sections.push(createPage(page2Children));

  // หน้า 3: section 10 + อื่น ๆ
  const page3Children = [
    ...makeSection("10. ปัจจัยที่ส่งผลต่อความเครียดพนักงาน", [
      ["ยาเสพติด", d.cnt_consult_stress_narcotics],
      ["จิตเวช", d.cnt_consult_stress_psychiatry],
      ["เศรษฐกิจ/หนี้สิน", d.cnt_consult_stress_economy],
      ["ครอบครัว", d.cnt_consult_stress_family],
      ["ความสัมพันธ์", d.cnt_consult_stress_relationship],
      ["ปัญหาความรัก", d.cnt_consult_stress_love],
      ["ตั้งครรภ์ไม่พร้อม", d.cnt_consult_stress_unplanned],
      ["การเรียน", d.cnt_consult_stress_learning],
      ["การพนัน", d.cnt_consult_stress_gambling],
      ["ติดเกมส์", d.cnt_consult_stress_games],
      ["เรื่องเพศ", d.cnt_consult_stress_sex],
      ["การทำงาน", d.cnt_consult_stress_work],
      ["สุขภาพ", d.cnt_consult_stress_health],
      // ["วิตกกังวล", d.cnt_consult_stress_anxious],
      ["การนอน", d.cnt_consult_stress_sleep],
      ["สุขภาพ(คนในครอบครัว/คนรัก/สัตว์เลี้ยง)", d.stress_healthfamily],
      ["สูญเสีย(คนในครอบครัว/คนรัก/สัตว์เลี้ยง)", d.stress_loss],
    ]),
  ];

  if (d.list_stress_other) {
    page3Children.push(new Paragraph({ text: "อื่นๆ:", heading: HeadingLevel.HEADING_3, spacing: { before: 200 } }));
    page3Children.push(
      ...d.list_stress_other
        .split("\n")
        .filter((i) => i.trim() !== "")
        .map((item) => new Paragraph({ text: `- ${item}`, spacing: { after: 80 } }))
    );
  }

  sections.push(createPage(page3Children));

  const doc = new Document({
    creator: "ระบบรายงาน Biofeedback",
    title: "รายงานผลการตรวจ Biofeedback",
    description: "รายงานผลการตรวจ Biofeedback",
    sections,
  });

  const blob = await Packer.toBlob(doc);
  saveAs(blob, `รายงานความเครียด_${dateText}.docx`);
};



  // ฟังก์ชันแปลงภาพเป็น Base64
  // function toBase64(url) {
  //   return new Promise((resolve, reject) => {
  //     const reader = new FileReader();
  //     fetch(url)
  //       .then((res) => res.blob())
  //       .then((blob) => {
  //         reader.onloadend = () => resolve(reader.result);
  //         reader.onerror = reject;
  //         reader.readAsDataURL(blob);
  //       });
  //   });
  // }

  function toBase64(url) {
  return new Promise((resolve, reject) => {
    fetch(url)
      .then((res) => res.blob())
      .then((blob) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          const base64 = reader.result.split(",")[1]; // ✨ เอาเฉพาะ Base64
          resolve(base64);
        };
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      });
  });
}
      
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
                placeholder="-- หน่วยงาน --"
                value={organization_id || undefined}
                onChange={(value) => setOrganizationId(value)}
                style={{ minWidth: 180 }}
                allowClear
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
                onClick={exportPDFFromData}
              >
                Export PDF
              </Button>

              <Button
                onClick={exportWordFromData}
              >
                Export Word
              </Button>

            </Space>
          </Form>
        </div>

        <div className="w-[95%] md:w-full md:max-w-[924px] mt-5 m-auto  ">

          <div className="w-full text-center p-[20px]">
            
            {loadingData ? (
                  
        
              <span className="loading loading-bars loading-xl"></span>
            

            ) : dataSearch && dataSearch.length === 0 ? (

            
                <label>ไม่มีข้อมูล </label>
          

            ) : (

              <>

              <div id="pdf-box" className="pdf-box ">
           
                  <h2 className="my-4 report-pdf">บริการตรวจประเมินความเครียดด้านสรีรวิทยาด้วยเครื่อง Biofeedback และการให้การปรึกษาด้านสุขภาพจิต</h2>

                  <h3 className="!font-normal report-pdf">{dateText}</h3>
                  
                  <h3 className="mb-4 report-pdf !font-normal">ณ {dataSearch[0]?.organization_name ?? "-"} </h3>

                  <h3 className="mb-4 report-pdf !font-normal"> ผู้เข้ารับบริการทั้งสิ้น จำนวน {dataSearch[0]?.cnt_bio_all ?? "0"} คน  </h3>
                  <h3 className="mb-4 report-pdf !font-normal"> เฉพาะผู้ที่ผ่านการตรวจประเมินด้วยเครื่อง Biofeedback มีข้อมูลดังนี้  </h3>

                
                  <table className="report-pdf">

                    <thead>
                      <tr>
                        <th colSpan="100%"> 1. เพศ </th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td className="title"> ชาย </td>
                        <td className="amount"> จำนวน </td>
                        <td className="val"> {dataSearch[0]?.cnt_bio_male ?? "0"}  </td>
                        <td className="classifier"> คน </td>
                      </tr>
                      <tr>
                        <td className="title"> หญิง </td>
                        <td className="amount"> จำนวน </td>
                        <td className="val"> {dataSearch[0]?.cnt_bio_female ?? "0"}  </td>
                        <td className="classifier"> คน </td>
                      </tr>
                    </tbody>

                    <thead>
                      <tr>
                        <th colSpan="100%"> 2. การทำงานของระบบประสาทอัตโนมัติ </th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td className="title"> แย่มาก </td>
                        <td className="amount"> จำนวน </td>
                        <td className="val"> {dataSearch[0]?.cnt_bio_ans_activity_bad ?? "0"}  </td>
                        <td className="classifier"> คน </td>
                      </tr>
                      <tr>
                        <td className="title"> ไม่ดี </td>
                        <td className="amount"> จำนวน </td>
                        <td className="val"> {dataSearch[0]?.cnt_bio_ans_activity_poor ?? "0"}  </td>
                        <td className="classifier"> คน </td>
                      </tr>
                      <tr>
                        <td className="title"> ปกติ </td>
                        <td className="amount"> จำนวน </td>
                        <td className="val"> {dataSearch[0]?.cnt_bio_ans_activity_normal ?? "0"}  </td>
                        <td className="classifier"> คน </td>
                      </tr>
                      <tr>
                        <td className="title"> ดี </td>
                        <td className="amount"> จำนวน </td>
                        <td className="val"> {dataSearch[0]?.cnt_bio_ans_activity_good ?? "0"}  </td>
                        <td className="classifier"> คน </td>
                      </tr>
                      <tr>
                        <td className="title"> ดีมาก </td>
                        <td className="amount"> จำนวน </td>
                        <td className="val"> {dataSearch[0]?.cnt_bio_ans_activity_excellent ?? "0"}  </td>
                        <td className="classifier"> คน </td>
                      </tr>
                    </tbody>

                    <thead>
                      <tr>
                        <th colSpan="100%"> 3. ความสมดุลของระบบประสาทอัตโนมัติ </th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td className="title"> ไม่สมดุลอย่างมาก </td>
                        <td className="amount"> จำนวน </td>
                        <td className="val"> {dataSearch[0]?.cnt_bio_ans_balance_highly_unbalanced ?? "0"}  </td>
                        <td className="classifier"> คน </td>
                      </tr>
                      <tr>
                        <td className="title"> ไม่สมดุล </td>
                        <td className="amount"> จำนวน </td>
                        <td className="val"> {dataSearch[0]?.cnt_bio_ans_balance_unbalanced ?? "0"}  </td>
                        <td className="classifier"> คน </td>
                      </tr>
                      <tr>
                        <td className="title"> สมดุล </td>
                        <td className="amount"> จำนวน </td>
                        <td className="val"> {dataSearch[0]?.cnt_bio_ans_balance_balanced ?? "0"}  </td>
                        <td className="classifier"> คน </td>
                      </tr>
                    </tbody>

                    <thead>
                      <tr>
                        <th colSpan="100%"> 4. ความทนทานต่อความเครียด </th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td className="title"> แย่มาก </td>
                        <td className="amount"> จำนวน </td>
                        <td className="val"> {dataSearch[0]?.cnt_bio_stress_resistance_bad ?? "0"}  </td>
                        <td className="classifier"> คน </td>
                      </tr>
                      <tr>
                        <td className="title"> ไม่ดี </td>
                        <td className="amount"> จำนวน </td>
                        <td className="val"> {dataSearch[0]?.cnt_bio_stress_resistance_poor ?? "0"}  </td>
                        <td className="classifier"> คน </td>
                      </tr>
                      <tr>
                        <td className="title"> ปกติ </td>
                        <td className="amount"> จำนวน </td>
                        <td className="val"> {dataSearch[0]?.cnt_bio_stress_resistance_normal ?? "0"}  </td>
                        <td className="classifier"> คน </td>
                      </tr>
                      <tr>
                        <td className="title"> ดี </td>
                        <td className="amount"> จำนวน </td>
                        <td className="val"> {dataSearch[0]?.cnt_bio_stress_resistance_good ?? "0"}  </td>
                        <td className="classifier"> คน </td>
                      </tr>
                      <tr>
                        <td className="title"> ดีมาก </td>
                        <td className="amount"> จำนวน </td>
                        <td className="val"> {dataSearch[0]?.cnt_bio_stress_resistance_excellent ?? "0"}  </td>
                        <td className="classifier"> คน </td>
                      </tr>
                    </tbody>

                  </table>


               
              </div>

              <div className="pdf-box">

                <table className="report-pdf">

                  <thead>
                    <tr>
                      <th colSpan="100%"> 5. ระดับความเครียด </th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td className="title"> แย่มาก </td>
                      <td className="amount"> จำนวน </td>
                      <td className="val"> {dataSearch[0]?.cnt_bio_stress_index_bad ?? "0"}  </td>
                      <td className="classifier"> คน </td>
                    </tr>
                    <tr>
                      <td className="title"> ไม่ดี </td>
                      <td className="amount"> จำนวน </td>
                      <td className="val"> {dataSearch[0]?.cnt_bio_stress_index_poor ?? "0"}  </td>
                      <td className="classifier"> คน </td>
                    </tr>
                    <tr>
                      <td className="title"> ปกติ </td>
                      <td className="amount"> จำนวน </td>
                      <td className="val"> {dataSearch[0]?.cnt_bio_stress_index_normal ?? "0"}  </td>
                      <td className="classifier"> คน </td>
                    </tr>
                    <tr>
                      <td className="title"> ดี </td>
                      <td className="amount"> จำนวน </td>
                      <td className="val"> {dataSearch[0]?.cnt_bio_stress_index_good ?? "0"}  </td>
                      <td className="classifier"> คน </td>
                    </tr>
                    <tr>
                      <td className="title"> ดีมาก </td>
                      <td className="amount"> จำนวน </td>
                      <td className="val"> {dataSearch[0]?.cnt_bio_stress_index_excellent ?? "0"}  </td>
                      <td className="classifier"> คน </td>
                    </tr>
                  </tbody>

                  <thead>
                    <tr>
                      <th colSpan="100%"> 6. ความเหนื่อยล้าของร่างกาย </th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td className="title"> แย่มาก </td>
                      <td className="amount"> จำนวน </td>
                      <td className="val"> {dataSearch[0]?.cnt_bio_fatigue_index_bad ?? "0"}  </td>
                      <td className="classifier"> คน </td>
                    </tr>
                    <tr>
                      <td className="title"> ไม่ดี </td>
                      <td className="amount"> จำนวน </td>
                      <td className="val"> {dataSearch[0]?.cnt_bio_fatigue_index_poor ?? "0"}  </td>
                      <td className="classifier"> คน </td>
                    </tr>
                    <tr>
                      <td className="title"> ปกติ </td>
                      <td className="amount"> จำนวน </td>
                      <td className="val"> {dataSearch[0]?.cnt_bio_fatigue_index_normal ?? "0"}  </td>
                      <td className="classifier"> คน </td>
                    </tr>
                    <tr>
                      <td className="title"> ดี </td>
                      <td className="amount"> จำนวน </td>
                      <td className="val"> {dataSearch[0]?.cnt_bio_fatigue_index_good ?? "0"}  </td>
                      <td className="classifier"> คน </td>
                    </tr>
                    <tr>
                      <td className="title"> ดีมาก </td>
                      <td className="amount"> จำนวน </td>
                      <td className="val"> {dataSearch[0]?.cnt_bio_fatigue_index_excellent ?? "0"}  </td>
                      <td className="classifier"> คน </td>
                    </tr>
                  </tbody>

                  <thead>
                    <tr>
                      <th colSpan="100%"> 7. ระดับของสภาวะหลอดเลือด </th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td className="title"> Level 1 </td>
                      <td className="amount"> จำนวน </td>
                      <td className="val"> {dataSearch[0]?.cnt_bio_wave_level_level1 ?? "0"}  </td>
                      <td className="classifier"> คน </td>
                    </tr>
                    <tr>
                      <td className="title"> Level 2 </td>
                      <td className="amount"> จำนวน </td>
                      <td className="val"> {dataSearch[0]?.cnt_bio_wave_level_level2 ?? "0"}  </td>
                      <td className="classifier"> คน </td>
                    </tr>
                    <tr>
                      <td className="title"> Level 3 </td>
                      <td className="amount"> จำนวน </td>
                      <td className="val"> {dataSearch[0]?.cnt_bio_wave_level_level3 ?? "0"}  </td>
                      <td className="classifier"> คน </td>
                    </tr>
                    <tr>
                      <td className="title"> Level 4 </td>
                      <td className="amount"> จำนวน </td>
                      <td className="val"> {dataSearch[0]?.cnt_bio_wave_level_level4 ?? "0"}  </td>
                      <td className="classifier"> คน </td>
                    </tr>
                    <tr>
                      <td className="title"> Level 5 </td>
                      <td className="amount"> จำนวน </td>
                      <td className="val"> {dataSearch[0]?.cnt_bio_wave_level_level5 ?? "0"}  </td>
                      <td className="classifier"> คน </td>
                    </tr>
                    <tr>
                      <td className="title"> Level 6 </td>
                      <td className="amount"> จำนวน </td>
                      <td className="val"> {dataSearch[0]?.cnt_bio_wave_level_level6 ?? "0"}  </td>
                      <td className="classifier"> คน </td>
                    </tr>
                    <tr>
                      <td className="title"> Level 7 </td>
                      <td className="amount"> จำนวน </td>
                      <td className="val"> {dataSearch[0]?.cnt_bio_wave_level_level7 ?? "0"}  </td>
                      <td className="classifier"> คน </td>
                    </tr>
                  </tbody>

                  <thead>
                    <tr>
                      <th colSpan="100%"> 8. ส่งต่อ รักษาตามสิทธิ์ </th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td className="title">  </td>
                      <td className="amount"> จำนวน </td>
                      <td className="val"> {dataSearch[0]?.cnt_consult_forward ?? "0"}  </td>
                      <td className="classifier"> คน </td>
                    </tr>
                  </tbody>

                  <thead>
                    <tr>
                      <th colSpan="100%"> 9. ฝ้าระวัง/ติดตามอาการ </th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td className="title">  </td>
                      <td className="amount"> จำนวน </td>
                      <td className="val"> {dataSearch[0]?.cnt_consult_watchout ?? "0"}  </td>
                      <td className="classifier"> คน </td>
                    </tr>
                  </tbody>

                </table>



              </div>

              <div className="pdf-box">

                <table className="report-pdf">

                  <thead>
                    <tr>
                      <th colSpan="100%"> 10. ปัจจัยที่ส่งผลต่อความเครียดพนักงานโดยรวม </th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td className="title"> ยาเสพติด </td>
                      <td className="amount"> จำนวน </td>
                      <td className="val"> {dataSearch[0]?.cnt_consult_stress_narcotics ?? "0"}  </td>
                      <td className="classifier"> คน </td>
                    </tr>
                    <tr>
                      <td className="title"> จิตเวช </td>
                      <td className="amount"> จำนวน </td>
                      <td className="val"> {dataSearch[0]?.cnt_consult_stress_psychiatry ?? "0"}  </td>
                      <td className="classifier"> คน </td>
                    </tr>
                    <tr>
                      <td className="title"> เศรษฐกิจ/หนี้สิน </td>
                      <td className="amount"> จำนวน </td>
                      <td className="val"> {dataSearch[0]?.cnt_consult_stress_economy ?? "0"}  </td>
                      <td className="classifier"> คน </td>
                    </tr>
                    <tr>
                      <td className="title"> ครอบครัว </td>
                      <td className="amount"> จำนวน </td>
                      <td className="val"> {dataSearch[0]?.cnt_consult_stress_family ?? "0"}  </td>
                      <td className="classifier"> คน </td>
                    </tr>
                    <tr>
                      <td className="title"> ความสัมพันธ์ </td>
                      <td className="amount"> จำนวน </td>
                      <td className="val"> {dataSearch[0]?.cnt_consult_stress_relationship ?? "0"}  </td>
                      <td className="classifier"> คน </td>
                    </tr>
                    <tr>
                      <td className="title"> ปัญหาความรัก </td>
                      <td className="amount"> จำนวน </td>
                      <td className="val"> {dataSearch[0]?.cnt_consult_stress_love ?? "0"}  </td>
                      <td className="classifier"> คน </td>
                    </tr>
                    <tr>
                      <td className="title"> ตั้งครรภ์ไม่พร้อม </td>
                      <td className="amount"> จำนวน </td>
                      <td className="val"> {dataSearch[0]?.cnt_consult_stress_unplanned ?? "0"}  </td>
                      <td className="classifier"> คน </td>
                    </tr>
                    <tr>
                      <td className="title"> การเรียน </td>
                      <td className="amount"> จำนวน </td>
                      <td className="val"> {dataSearch[0]?.cnt_consult_stress_learning ?? "0"}  </td>
                      <td className="classifier"> คน </td>
                    </tr>
                    <tr>
                      <td className="title"> การพนัน </td>
                      <td className="amount"> จำนวน </td>
                      <td className="val"> {dataSearch[0]?.cnt_consult_stress_gambling ?? "0"}  </td>
                      <td className="classifier"> คน </td>
                    </tr>
                    <tr>
                      <td className="title"> ติดเกมส์ </td>
                      <td className="amount"> จำนวน </td>
                      <td className="val"> {dataSearch[0]?.cnt_consult_stress_games ?? "0"}  </td>
                      <td className="classifier"> คน </td>
                    </tr>
                    <tr>
                      <td className="title"> เรื่องเพศ </td>
                      <td className="amount"> จำนวน </td>
                      <td className="val"> {dataSearch[0]?.cnt_consult_stress_sex ?? "0"}  </td>
                      <td className="classifier"> คน </td>
                    </tr>
                    <tr>
                      <td className="title"> การทำงาน </td>
                      <td className="amount"> จำนวน </td>
                      <td className="val"> {dataSearch[0]?.cnt_consult_stress_work ?? "0"}  </td>
                      <td className="classifier"> คน </td>
                    </tr>
                    <tr>
                      <td className="title"> สุขภาพ </td>
                      <td className="amount"> จำนวน </td>
                      <td className="val"> {dataSearch[0]?.cnt_consult_stress_health ?? "0"}  </td>
                      <td className="classifier"> คน </td>
                    </tr>
                    {/* <tr>
                      <td className="title"> วิตกกังวล </td>
                      <td className="amount"> จำนวน </td>
                      <td className="val"> {dataSearch[0]?.cnt_consult_stress_anxious ?? "0"}  </td>
                      <td className="classifier"> คน </td>
                    </tr> */}
                    <tr>
                      <td className="title"> การนอน </td>
                      <td className="amount"> จำนวน </td>
                      <td className="val"> {dataSearch[0]?.cnt_consult_stress_sleep ?? "0"}  </td>
                      <td className="classifier"> คน </td>
                    </tr>
                     <tr>
                      <td className="title"> สุขภาพ(คนในครอบครัว/คนรัก/สัตว์เลี้ยง) </td>
                      <td className="amount"> จำนวน </td>
                      <td className="val"> {dataSearch[0]?.stress_healthfamily ?? "0"}  </td>
                      <td className="classifier"> คน </td>
                    </tr>
                     <tr>
                      <td className="title"> สูญเสีย(คนในครอบครัว/คนรัก/สัตว์เลี้ยง) </td>
                      <td className="amount"> จำนวน </td>
                      <td className="val"> {dataSearch[0]?.stress_loss ?? "0"}  </td>
                      <td className="classifier"> คน </td>
                    </tr>
                    <tr>
                      <td className="title">อื่นๆ</td>
                    </tr>
                    <tr>
                      <td colSpan={3} className="list">
                        <ul>
                          {(dataSearch[0]?.list_stress_other ?? "").split("\n").map((item, i) => (
                            <li key={i}>{item}</li>
                          ))}
                        </ul>
                      </td>
                    </tr>
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