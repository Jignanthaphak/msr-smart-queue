"use client"
import { useState, useEffect } from "react";
import useDefaultDataStore from "@/stores/useDefaultDataStore";
import { getreportpdf } from "@/services/report";
import clientConfig from "@/config/Client";
import Swal from 'sweetalert2';
import { saveAs } from 'file-saver';
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import '@ant-design/v5-patch-for-react-19';
import { DatePicker, Select, Button, Space, Form } from "antd";
import dayjs from 'dayjs';
import {
  Document, Packer, Paragraph, TextRun, AlignmentType, ImageRun, Header,
  Table, TableRow, TableCell, WidthType, BorderStyle, TextWrappingType,
  HorizontalPositionRelativeFrom, VerticalPositionRelativeFrom,
} from "docx";

const { Option } = Select;

// ---------- ค่าคงที่ของรูปแบบรายงาน ----------
const WORD_FONT = "TH SarabunPSK";          // ชื่อฟอนต์ที่ฝังในไฟล์ Word
const PDF_FONT = "THSarabun";               // ชื่อฟอนต์ที่ลงทะเบียนกับ jsPDF
const PDF_FONT_FILES = {                    // ไฟล์ฟอนต์ TH SarabunPSK (THSarabunNew) ใน /public/fonts
  normal: "/fonts/THSarabunNew.ttf",
  bold: `/fonts/${encodeURIComponent("THSarabunNew Bold.ttf")}`,
};
const BG_IMAGE_FILE = "/images/bg-pdf/bg.png";

/**
 * หา prefix ของแอปจาก URL ของ asset ที่ Next โหลดไว้ในหน้านี้
 *
 * prod ถูก serve ใต้ subpath (https://mhc4.dmh.go.th/msr/...) แต่ dev อยู่ที่ root
 * ดึงจาก `/_next/` ที่ปรากฏใน <link>/<script> ของหน้า จึงได้ค่าที่ตรงกับของจริงเสมอ
 * โดยไม่ต้องพึ่ง config ที่อาจตั้งไว้ไม่ตรงกันระหว่างเครื่อง
 */
function detectAppBasePath() {

  if (typeof document === "undefined") return "";

  const el = document.querySelector('link[href*="/_next/"], script[src*="/_next/"]');
  const raw = el?.getAttribute("href") || el?.getAttribute("src") || "";
  if (!raw) return "";

  try {
    const { pathname } = new URL(raw, window.location.origin);
    const idx = pathname.indexOf("/_next/");
    return idx > 0 ? pathname.slice(0, idx) : "";
  } catch {
    return "";
  }
}

/**
 * โหลดไฟล์จากโฟลเดอร์ public
 *
 * ถ้าโหลดไม่ได้ jsPDF จะเงียบ ๆ ไปใช้ฟอนต์ Helvetica แทน (ภาษาอังกฤษตัวใหญ่หนา ภาษาไทยเพี้ยน)
 * และพื้นหลังก็หายไปโดยไม่มี error ให้เห็น จึงต้องลองหลาย prefix
 * แล้วเช็คให้แน่ใจว่าได้ไฟล์จริง ไม่ใช่หน้า 404 HTML
 */
async function fetchPublicFile(path) {

  // เรียงตามความน่าเชื่อถือ: prefix ที่ตรวจได้จริง > ค่าใน config > root
  const prefixes = [...new Set([detectAppBasePath(), clientConfig?.base_path || "", ""])];
  const urls = prefixes.map((prefix) => `${prefix}${path}`);

  const problems = [];

  for (const url of urls) {
    try {
      const res = await fetch(url);

      if (!res.ok) {
        problems.push(`${url} → HTTP ${res.status}`);
        continue;
      }

      // Next จะตอบหน้า HTML เมื่อ path ไม่ตรงกับไฟล์ใน public
      const contentType = res.headers.get("content-type") || "";
      if (contentType.includes("text/html")) {
        problems.push(`${url} → ได้หน้าเว็บแทนไฟล์`);
        continue;
      }

      const blob = await res.blob();
      if (blob.size === 0) {
        problems.push(`${url} → ไฟล์ว่าง`);
        continue;
      }

      return blob;

    } catch (err) {
      problems.push(`${url} → ${err?.message ?? "fetch ไม่สำเร็จ"}`);
    }
  }

  throw new Error(`โหลดไฟล์ ${path} ไม่สำเร็จ (${problems.join(" , ")})`);
}

// อ่าน blob เป็น base64 ล้วน (ตัดส่วน data:...;base64, ออก)
function blobToBase64(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(String(reader.result).split(",")[1]);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

async function loadPublicFileBase64(path) {
  return blobToBase64(await fetchPublicFile(path));
}

const TITLE_LINE_1 = "บริการตรวจประเมินความเครียดด้านสรีรวิทยาด้วยเครื่อง Biofeedback";
const TITLE_LINE_2 = "และการให้คำปรึกษาด้านสุขภาพจิต";
const SUMMARY_BIO_LINE = "เฉพาะผู้ที่ผ่านการตรวจประเมินด้วยเครื่อง Biofeedback มีข้อมูลดังนี้";

// ---------- helper ----------
const num = (v) => {
  const n = Number(v ?? 0);
  return Number.isFinite(n) ? n : 0;
};

// ร้อยละ ทศนิยม 1 ตำแหน่ง
const pct = (v, base) => (num(base) > 0 ? ((num(v) * 100) / num(base)).toFixed(1) : "0.0");

/**
 * แปลงข้อมูลดิบจาก API เป็นหัวข้อ 1-10 พร้อมฐานการคิดร้อยละของแต่ละหัวข้อ
 * - ข้อ 1, 8, 9, 10 คิดร้อยละจากยอดผู้เข้ารับบริการทั้งหมด (cnt_all)
 * - ข้อ 2-7 คิดร้อยละจากเฉพาะคนที่ตรวจด้วยเครื่องจริง (cnt_bio_done : ไม่นับคนที่ติ๊ก "ไม่ตรวจประเมิน Biofeedback")
 */
function buildReport(d) {

  const total = num(d?.cnt_all);        // ผู้เข้ารับบริการทั้งสิ้น
  const bioDone = num(d?.cnt_bio_done); // เฉพาะผู้ที่ตรวจด้วยเครื่อง Biofeedback

  const sexRows = [
    ["ชาย", d?.cnt_male],
    ["หญิง", d?.cnt_female],
  ];
  if (num(d?.cnt_alternative) > 0) sexRows.push(["เพศทางเลือก", d?.cnt_alternative]);

  // ข้อ 10 : แสดงเฉพาะปัจจัยที่มีการติ๊ก (มากกว่า 0) และเรียงจากมากไปน้อย
  const stressFactors = [
    ["ยาเสพติด", d?.cnt_consult_stress_narcotics],
    ["จิตเวช", d?.cnt_consult_stress_psychiatry],
    ["เศรษฐกิจ/หนี้สิน", d?.cnt_consult_stress_economy],
    ["ครอบครัว", d?.cnt_consult_stress_family],
    ["ความสัมพันธ์", d?.cnt_consult_stress_relationship],
    ["ปัญหาความรัก", d?.cnt_consult_stress_love],
    ["ตั้งครรภ์ไม่พร้อม", d?.cnt_consult_stress_unplanned],
    ["การเรียน", d?.cnt_consult_stress_learning],
    ["การพนัน", d?.cnt_consult_stress_gambling],
    ["ติดเกมส์", d?.cnt_consult_stress_games],
    ["เรื่องเพศ", d?.cnt_consult_stress_sex],
    ["การทำงาน", d?.cnt_consult_stress_work],
    ["หัวหน้างาน/เพื่อนร่วมงาน", d?.cnt_consult_stress_colleague],
    ["สุขภาพ", d?.cnt_consult_stress_health],
    ["การนอน", d?.cnt_consult_stress_sleep],
    ["สุขภาพ(คนในครอบครัว/คนรัก/สัตว์เลี้ยง)", d?.cnt_consult_stress_healthfamily],
    ["สูญเสีย(คนในครอบครัว/คนรัก/สัตว์เลี้ยง)", d?.cnt_consult_stress_loss],
  ];

  const stressRows = stressFactors
    .filter(([, v]) => num(v) > 0)
    .sort((a, b) => num(b[1]) - num(a[1]));

  // "อื่นๆ" ต่อท้ายเสมอเป็นรายการสุดท้าย (ถ้ามีคนระบุ)
  // ข้อย่อยอยู่ในช่องเดียวกับ "อื่นๆ" (element ที่ 3) โดยย่อหน้าเข้าไป 10 เคาะ
  const cntOther = num(d?.cnt_consult_stress_other);

  if (cntOther > 0) {

    const otherDetail = Array.isArray(d?.list_stress_other_detail) ? d.list_stress_other_detail : [];

    const subItems = otherDetail
      .map(({ text, cnt }) => ({ text: String(text ?? "").trim(), cnt: num(cnt) }))
      .filter(({ text }) => text !== "")
      .map(({ text, cnt }) => (cnt > 1 ? `- ${text} (${cnt} คน)` : `- ${text}`));

    stressRows.push(["อื่นๆ", cntOther, subItems]);
  }

  const sections = [
    { title: "1. เพศ", base: total, rows: sexRows },
    {
      title: "2. การทำงานของระบบประสาทอัตโนมัติ", base: bioDone, rows: [
        ["แย่มาก", d?.cnt_bio_ans_activity_bad],
        ["ไม่ดี", d?.cnt_bio_ans_activity_poor],
        ["ปกติ", d?.cnt_bio_ans_activity_normal],
        ["ดี", d?.cnt_bio_ans_activity_good],
        ["ดีมาก", d?.cnt_bio_ans_activity_excellent],
      ]
    },
    {
      title: "3. ความสมดุลของระบบประสาทอัตโนมัติ", base: bioDone, rows: [
        ["ไม่สมดุลอย่างมาก", d?.cnt_bio_ans_balance_highly_unbalanced],
        ["ไม่สมดุล", d?.cnt_bio_ans_balance_unbalanced],
        ["สมดุล", d?.cnt_bio_ans_balance_balanced],
      ]
    },
    {
      title: "4. ความทนทานต่อความเครียด", base: bioDone, rows: [
        ["แย่มาก", d?.cnt_bio_stress_resistance_bad],
        ["ไม่ดี", d?.cnt_bio_stress_resistance_poor],
        ["ปกติ", d?.cnt_bio_stress_resistance_normal],
        ["ดี", d?.cnt_bio_stress_resistance_good],
        ["ดีมาก", d?.cnt_bio_stress_resistance_excellent],
      ]
    },
    {
      // ขึ้นหน้าใหม่ที่ข้อ 5 (หน้า 1 = ข้อ 1-4)
      title: "5. ระดับความเครียด", base: bioDone, pageBreak: true, rows: [
        ["แย่มาก", d?.cnt_bio_stress_index_bad],
        ["ไม่ดี", d?.cnt_bio_stress_index_poor],
        ["ปกติ", d?.cnt_bio_stress_index_normal],
        ["ดี", d?.cnt_bio_stress_index_good],
        ["ดีมาก", d?.cnt_bio_stress_index_excellent],
      ]
    },
    {
      title: "6. ความเหนื่อยล้าของร่างกาย", base: bioDone, rows: [
        ["แย่มาก", d?.cnt_bio_fatigue_index_bad],
        ["ไม่ดี", d?.cnt_bio_fatigue_index_poor],
        ["ปกติ", d?.cnt_bio_fatigue_index_normal],
        ["ดี", d?.cnt_bio_fatigue_index_good],
        ["ดีมาก", d?.cnt_bio_fatigue_index_excellent],
      ]
    },
    {
      title: "7. ระดับของสภาวะหลอดเลือด", base: bioDone, rows: [
        ["Level 1", d?.cnt_bio_wave_level_level1],
        ["Level 2", d?.cnt_bio_wave_level_level2],
        ["Level 3", d?.cnt_bio_wave_level_level3],
        ["Level 4", d?.cnt_bio_wave_level_level4],
        ["Level 5", d?.cnt_bio_wave_level_level5],
        ["Level 6", d?.cnt_bio_wave_level_level6],
        ["Level 7", d?.cnt_bio_wave_level_level7],
      ]
    },
    { title: "8. เฝ้าระวัง", base: total, rows: [["เฝ้าระวัง", d?.cnt_consult_watchout]] },
    { title: "9. ส่งต่อ รักษาตามสิทธิ", base: total, rows: [["ส่งต่อ รักษาตามสิทธิ", d?.cnt_consult_forward]] },
    // ขึ้นหน้าใหม่ที่ข้อ 10 (หน้า 2 = ข้อ 5-9)
    { title: "10. ปัจจัยที่ส่งผลต่อความเครียด", base: total, pageBreak: true, rows: stressRows },
  ];

  return { total, bioDone, sections };
}

export default function Report() {

  const today = new Date().toISOString().slice(0, 10);
  const [startdate, setStartDate] = useState(today);
  const [enddate, setEndDate] = useState(today);
  const [organization_id, setOrganizationId] = useState("");

  const [disableBntSearch, setDisableBntSearch] = useState(false);
  const [dataSearch, setDataSearch] = useState([]);

  const [loadingData, setLoadingData] = useState(true);

  const defaultData = useDefaultDataStore((state) => state.defaultData)

  // แปลงวันที่ให้อยู่ในรูปแบบวันที่ภาษาไทย
  function formatDateTH(dateStr) {
    if (!dateStr) return "-"
    const date = new Date(dateStr)
    return date.toLocaleDateString("th-TH", {
      year: "numeric",
      month: "long",
      day: "numeric",
    })
  }

  // เลือกวันเดียว = แสดงวันเดียว, เลือกหลายวัน = แสดงเป็นช่วงวันที่
  const dateText =
    startdate === enddate
      ? `วันที่ ${formatDateTH(startdate)}`
      : `วันที่ ${formatDateTH(startdate)} - ${formatDateTH(enddate)}`

  useEffect(() => {
    setTimeout(() => {
      setLoadingData(false);
    }, 500);

  }, [loadingData]);

  // โหลดฟอนต์ TH SarabunPSK ให้หน้าพรีวิว
  // ทำผ่าน FontFace API แทน @font-face ใน CSS เพราะ CSS ใส่ prefix ของ subpath (/msr) ไม่ได้
  useEffect(() => {

    if (typeof window === "undefined" || typeof FontFace === "undefined") return;

    let cancelled = false;

    (async () => {

      const load = async (path, weight) => {
        const buffer = await (await fetchPublicFile(path)).arrayBuffer();
        if (cancelled) return;
        const face = new FontFace(WORD_FONT, buffer, { weight });
        document.fonts.add(await face.load());
      };

      try {
        await load(PDF_FONT_FILES.normal, "normal");
      } catch (err) {
        console.warn("โหลดฟอนต์สำหรับพรีวิวไม่สำเร็จ:", err.message);
        return;
      }

      try {
        await load(PDF_FONT_FILES.bold, "bold");
      } catch (err) {
        console.warn("โหลดฟอนต์ตัวหนาสำหรับพรีวิวไม่สำเร็จ:", err.message);
      }

    })();

    return () => { cancelled = true; };

  }, []);

  const report = dataSearch?.length > 0 ? buildReport(dataSearch[0]) : null;
  const organizationName = dataSearch?.[0]?.organization_name ?? "-";

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

    }

  }

  // ================= Export PDF =================
  const exportPDFFromData = async () => {

    if (!dataSearch || dataSearch.length === 0) {
      Swal.fire('ไม่มีข้อมูล', 'กรุณาค้นหาข้อมูลก่อน Export', 'info');
      return;
    }

    const d = dataSearch[0];
    const { total, sections } = buildReport(d);

    const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });

    // ---- ฝังฟอนต์ TH SarabunPSK ----
    // ตัวปกติเป็นตัวบังคับ ถ้าโหลดไม่ได้ต้องหยุดและบอกสาเหตุ
    // ไม่งั้น jsPDF จะเงียบ ๆ ไปใช้ Helvetica แล้วได้ไฟล์ที่ภาษาไทยเพี้ยน
    let fontNormal;
    try {
      fontNormal = await loadPublicFileBase64(PDF_FONT_FILES.normal);
    } catch (err) {
      Swal.fire('โหลดฟอนต์ไม่สำเร็จ', `${err.message}<br><br>กรุณาตรวจว่ามีไฟล์ <b>public/fonts/THSarabunNew.ttf</b> บนเซิร์ฟเวอร์ และค่า <b>base_path</b> ใน config/Client.js ตรงกับ URL ที่ใช้งานจริง`, 'error');
      return;
    }

    doc.addFileToVFS("THSarabunNew.ttf", fontNormal);
    doc.addFont("THSarabunNew.ttf", PDF_FONT, "normal");

    // ตัวหนาโหลดไม่ได้ก็ยังออกไฟล์ได้ โดยใช้ตัวปกติแทน (หัวเรื่องจะไม่หนา แต่ภาษาไทยยังถูกต้อง)
    try {
      const fontBold = await loadPublicFileBase64(PDF_FONT_FILES.bold);
      doc.addFileToVFS("THSarabunNew-Bold.ttf", fontBold);
      doc.addFont("THSarabunNew-Bold.ttf", PDF_FONT, "bold");
    } catch (err) {
      console.warn("โหลดฟอนต์ตัวหนาไม่สำเร็จ ใช้ตัวปกติแทน:", err.message);
      doc.addFont("THSarabunNew.ttf", PDF_FONT, "bold");
    }

    doc.setTextColor(0, 0, 0);

    // พื้นหลังหัวจดหมาย โหลดไม่ได้ก็ยังออกรายงานได้ แค่ไม่มีพื้นหลัง
    let bgBase64 = null;
    try {
      bgBase64 = await loadPublicFileBase64(BG_IMAGE_FILE);
    } catch (err) {
      console.warn("โหลดพื้นหลังไม่สำเร็จ:", err.message);
    }

    const PAGE_W = 210;
    const MARGIN_L = 25;          // ขอบซ้ายของข้อความหัวข้อ
    const TABLE_L = 35;           // ขอบซ้ายของตาราง (เยื้องเข้ามาตามแบบ)
    const TABLE_W = 155;          // ความกว้างตาราง (35 -> 190)
    const CONTENT_TOP = 45;       // จุดเริ่มเนื้อหาของหน้าถัดไป (ต่ำกว่าแถบหัวกระดาษของพื้นหลัง)
    const CONTENT_BOTTOM = 276;   // ขอบล่างที่ยอมให้พิมพ์ได้ (เหนือแถบท้ายกระดาษของพื้นหลัง)
    const LH18 = 7.5;             // ระยะบรรทัดของตัวอักษร 18pt
    const LH16 = 6.5;             // ระยะบรรทัดของตัวอักษร 16pt

    // ใส่พื้นหลังหน้าละครั้ง (กันวาดทับข้อความที่พิมพ์ไปแล้ว)
    const bgPages = new Set();
    const drawBg = () => {
      if (!bgBase64) return;
      const page = doc.internal.getCurrentPageInfo().pageNumber;
      if (bgPages.has(page)) return;
      bgPages.add(page);
      doc.addImage(bgBase64, "PNG", 0, 0, 210, 297);
    };

    let y = 0;

    const ensureSpace = (need) => {
      if (y + need <= CONTENT_BOTTOM) return;
      doc.addPage();
      drawBg();
      y = CONTENT_TOP;
    };

    // ตารางใช้ระยะบรรทัดพอดีตัวอักษร เพื่อให้ข้อ 1-4 อยู่ในหน้าเดียวกันได้
    doc.setLineHeightFactor(1.0);

    // ---- หัวกระดาษ ----
    drawBg();
    y = 36;

    doc.setFont(PDF_FONT, "bold");
    doc.setFontSize(18);
    doc.text(TITLE_LINE_1, PAGE_W / 2, y, { align: "center" });
    y += LH18;
    doc.text(TITLE_LINE_2, PAGE_W / 2, y, { align: "center" });
    y += LH18;

    y += LH18 * 2; // เว้น 2 บรรทัด

    doc.text(dateText, PAGE_W / 2, y, { align: "center" });
    y += LH18;
    doc.text(`ณ ${d?.organization_name ?? "-"}`, PAGE_W / 2, y, { align: "center" });
    y += LH18;

    y += LH16 * 2; // เว้น 2 บรรทัด

    doc.setFontSize(16);
    doc.text(`ผู้เข้ารับบริการทั้งสิ้น จำนวน ${total} คน`, MARGIN_L, y);
    y += LH16;
    doc.text(SUMMARY_BIO_LINE, MARGIN_L, y);
    y += LH16;

    y += LH16; // ขึ้นบรรทัดใหม่ก่อนเริ่มข้อ 1

    const INDENT_SPACES = " ".repeat(10); // ย่อหน้าข้อย่อย 10 เคาะ

    // ประมาณความสูงตาราง เพื่อไม่ให้ตารางของข้อเดียวกันถูกตัดข้ามหน้า
    const LINE_H = 16 / 2.8346;  // สูงบรรทัดที่ 16pt (lineHeightFactor = 1.0)
    const ROW_H = LINE_H + 0.4;  // + cellPadding บน-ล่าง

    const estimateTableHeight = (section) => {
      const extraLines = section.rows.reduce((sum, [, , subItems]) => sum + (subItems?.length ?? 0), 0);
      return (section.rows.length + 1) * ROW_H + extraLines * LINE_H;
    };

    // ---- ข้อ 1 - 10 ----
    for (const section of sections) {

      if (section.pageBreak) {

        // ข้อที่กำหนดให้ขึ้นหน้าใหม่เสมอ
        doc.addPage();
        drawBg();
        y = CONTENT_TOP;

      } else {

        // ให้หัวข้อกับตารางอยู่หน้าเดียวกัน (ถ้าตารางใหญ่เกิน 1 หน้าก็ปล่อยให้ตัดตามปกติ)
        const tableHeight = estimateTableHeight(section);
        const blockHeight = LH16 + 3 + tableHeight;
        ensureSpace(blockHeight <= CONTENT_BOTTOM - CONTENT_TOP ? blockHeight : LH16 + 20);
      }

      doc.setFont(PDF_FONT, "normal");
      doc.setFontSize(16);
      doc.text(section.title, MARGIN_L, y);
      y += 2;

      if (section.rows.length > 0) {

        autoTable(doc, {
          startY: y,
          margin: { top: CONTENT_TOP, left: TABLE_L, right: 20, bottom: 297 - CONTENT_BOTTOM },
          tableWidth: TABLE_W,
          head: [["", "จำนวน(คน)", "ร้อยละ"]],
          // ข้อย่อยของ "อื่นๆ" ขึ้นบรรทัดใหม่อยู่ในช่องเดียวกัน
          body: section.rows.map(([label, value, subItems]) => [
            subItems?.length
              ? [label, ...subItems.map((item) => `${INDENT_SPACES}${item}`)].join("\n")
              : label,
            String(num(value)),
            pct(value, section.base),
          ]),
          theme: "grid",
          styles: {
            font: PDF_FONT,
            fontStyle: "normal",
            fontSize: 16,
            textColor: [0, 0, 0],
            lineColor: [0, 0, 0],
            lineWidth: 0.2,
            cellPadding: { top: 0.2, right: 2, bottom: 0.2, left: 2 },
            valign: "middle",
            overflow: "linebreak",
          },
          headStyles: { fillColor: false, textColor: [0, 0, 0], fontStyle: "normal", halign: "center" },
          bodyStyles: { fillColor: false },
          columnStyles: {
            0: { halign: "left", cellWidth: 90 },
            1: { halign: "center", cellWidth: 35 },
            2: { halign: "center", cellWidth: 30 },
          },
          didParseCell: (data) => {

            // ช่องหัวตารางช่องแรกเป็นช่องว่างไม่มีเส้นขอบ ตามแบบ
            if (data.section === "head" && data.column.index === 0) data.cell.styles.lineWidth = 0;

            // แถวที่มีข้อย่อยหลายบรรทัด ให้ตัวเลขชิดบนแถว
            if (data.section === "body" && section.rows[data.row.index]?.[2]?.length) {
              data.cell.styles.valign = "top";
            }
          },
          willDrawPage: () => drawBg(),
        });

        y = doc.lastAutoTable.finalY;
      }

      y += 4; // เว้นระยะก่อนข้อถัดไป
    }

    doc.save(`รายงานความเครียด_${startdate}_${enddate}.pdf`);
  };

  // ================= Export Word =================
  const exportWordFromData = async () => {

    if (!dataSearch || dataSearch.length === 0) {
      Swal.fire('ไม่มีข้อมูล', 'กรุณาค้นหาข้อมูลก่อน Export', 'info');
      return;
    }

    const d = dataSearch[0];
    const { total, sections } = buildReport(d);

    // พื้นหลังหัวจดหมาย โหลดไม่ได้ก็ยังออกรายงานได้ แค่ไม่มีพื้นหลัง
    let bgBase64 = null;
    try {
      bgBase64 = await loadPublicFileBase64(BG_IMAGE_FILE);
    } catch (err) {
      console.warn("โหลดพื้นหลังไม่สำเร็จ:", err.message);
    }

    const line = (text, { size = 32, bold = false, alignment = AlignmentType.LEFT, before = 0, after = 0, indent, keepNext = false, pageBreakBefore = false } = {}) =>
      new Paragraph({
        alignment,
        spacing: { before, after },
        indent,
        keepNext,
        pageBreakBefore,
        children: [new TextRun({ text, font: WORD_FONT, size, bold })],
      });

    const blankLine = () => line("", { size: 32 });

    const noBorder = { style: BorderStyle.NONE, size: 0, color: "FFFFFF" };
    const hiddenBorders = { top: noBorder, bottom: noBorder, left: noBorder, right: noBorder };

    // ความกว้างคอลัมน์ (twips) ให้ตรงกับ PDF : 90mm / 35mm / 30mm
    const COL_W = [5103, 1984, 1701];
    const TABLE_W_DXA = COL_W[0] + COL_W[1] + COL_W[2];
    const INDENT_DXA = 700; // ย่อหน้าข้อย่อยประมาณ 10 เคาะ

    const cell = (text, { alignment = AlignmentType.LEFT, width, borders, subItems, keepNext = false } = {}) =>
      new TableCell({
        width: width ? { size: width, type: WidthType.DXA } : undefined,
        borders,
        children: [
          line(text, { alignment, keepNext }),
          // ข้อย่อยของ "อื่นๆ" อยู่ในช่องเดียวกัน ย่อหน้าเข้าไป
          ...(subItems ?? []).map((item) => line(item, { indent: { left: INDENT_DXA }, keepNext })),
        ],
      });

    // keepNext ทุกแถวยกเว้นแถวสุดท้าย + cantSplit = ตารางของข้อเดียวกันไม่ถูกตัดข้ามหน้า
    const makeTable = (rows, base) =>
      new Table({
        alignment: AlignmentType.RIGHT,
        width: { size: TABLE_W_DXA, type: WidthType.DXA },
        columnWidths: COL_W,
        rows: [
          new TableRow({
            cantSplit: true,
            children: [
              cell("", { width: COL_W[0], borders: hiddenBorders, keepNext: true }),
              cell("จำนวน(คน)", { alignment: AlignmentType.CENTER, width: COL_W[1], keepNext: true }),
              cell("ร้อยละ", { alignment: AlignmentType.CENTER, width: COL_W[2], keepNext: true }),
            ],
          }),
          ...rows.map(([label, value, subItems], i) => {
            const keepNext = i < rows.length - 1;
            return new TableRow({
              cantSplit: true,
              children: [
                cell(String(label), { width: COL_W[0], subItems, keepNext }),
                cell(String(num(value)), { alignment: AlignmentType.CENTER, width: COL_W[1], keepNext }),
                cell(pct(value, base), { alignment: AlignmentType.CENTER, width: COL_W[2], keepNext }),
              ],
            });
          }),
        ],
      });

    // ---- หัวกระดาษ ----
    const children = [
      line(TITLE_LINE_1, { size: 36, bold: true, alignment: AlignmentType.CENTER }),
      line(TITLE_LINE_2, { size: 36, bold: true, alignment: AlignmentType.CENTER }),
      blankLine(),
      blankLine(),
      line(dateText, { size: 36, bold: true, alignment: AlignmentType.CENTER }),
      line(`ณ ${d?.organization_name ?? "-"}`, { size: 36, bold: true, alignment: AlignmentType.CENTER }),
      blankLine(),
      blankLine(),
      line(`ผู้เข้ารับบริการทั้งสิ้น จำนวน ${total} คน`, { size: 32, bold: true }),
      line(SUMMARY_BIO_LINE, { size: 32, bold: true }),
    ];

    // ---- ข้อ 1 - 10 ----
    // ใช้ระยะห่างของย่อหน้าหัวข้อแทนการใส่บรรทัดว่าง เพราะบรรทัดว่างท้ายตาราง
    // จะไหลไปหน้าถัดไปแล้วทำให้เกิดหน้าว่างเมื่อข้อถัดไปสั่งขึ้นหน้าใหม่
    for (const section of sections) {

      children.push(line(section.title, {
        size: 32,
        before: section.pageBreak ? 0 : 220,
        after: 80,
        keepNext: true,
        pageBreakBefore: !!section.pageBreak,
      }));

      if (section.rows.length > 0) children.push(makeTable(section.rows, section.base));
    }

    // พื้นหลังวางไว้ใน header เพื่อให้แสดงทุกหน้าโดยอัตโนมัติ
    const background = new Header({
      children: [
        new Paragraph({
          children: bgBase64 ? [
            new ImageRun({
              type: "png",
              data: Uint8Array.from(atob(bgBase64), (c) => c.charCodeAt(0)),
              transformation: { width: 794, height: 1123 }, // เต็มหน้า A4 (21 x 29.7 cm ที่ 96 DPI)
              floating: {
                horizontalPosition: { relative: HorizontalPositionRelativeFrom.PAGE, offset: 0 },
                verticalPosition: { relative: VerticalPositionRelativeFrom.PAGE, offset: 0 },
                wrap: { type: TextWrappingType.NONE },
                behindDocument: true,
              },
            }),
          ] : [],
        }),
      ],
    });

    const doc = new Document({
      creator: "ระบบรายงาน Biofeedback",
      title: "รายงานผลการตรวจ Biofeedback",
      description: "รายงานผลการตรวจ Biofeedback",
      sections: [
        {
          properties: {
            page: {
              size: { width: 11906, height: 16838 },                       // A4 (twips)
              // เว้นที่ให้แถบหัว/ท้ายกระดาษของพื้นหลัง (บน 4.06cm, ล่าง 2.29cm) ให้เนื้อที่พิมพ์เท่ากับ PDF
              margin: { top: 2300, right: 1200, bottom: 1300, left: 1400 },
            },
          },
          headers: { default: background },
          children,
        },
      ],
    });

    const blob = await Packer.toBlob(doc);
    saveAs(blob, `รายงานความเครียด_${startdate}_${enddate}.docx`);
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
                placeholder="-- หน่วยงาน --"
                value={organization_id || undefined}
                onChange={(value) => setOrganizationId(value ?? "")}
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

              <Button onClick={exportPDFFromData}>
                Export PDF
              </Button>

              <Button onClick={exportWordFromData}>
                Export Word
              </Button>

            </Space>
          </Form>
        </div>

        <div className="w-[95%] md:w-full md:max-w-[924px] mt-5 m-auto  ">

          <div className="w-full text-center p-[20px]">

            {loadingData ? (

              <span className="loading loading-bars loading-xl"></span>

            ) : !report ? (

              <label>ไม่มีข้อมูล </label>

            ) : (

              <div id="pdf-box" className="pdf-box report-preview">

                <h2 className="report-pdf-title">{TITLE_LINE_1}</h2>
                <h2 className="report-pdf-title">{TITLE_LINE_2}</h2>

                <div className="report-pdf-spacer" />

                <h3 className="report-pdf-title">{dateText}</h3>
                <h3 className="report-pdf-title">ณ {organizationName}</h3>

                <div className="report-pdf-spacer" />

                <p className="report-pdf-summary">ผู้เข้ารับบริการทั้งสิ้น จำนวน {report.total} คน</p>
                <p className="report-pdf-summary">{SUMMARY_BIO_LINE}</p>

                {report.sections.map((section) => (
                  <div className="report-pdf-section" key={section.title}>

                    <p className="report-pdf-topic">{section.title}</p>

                    {section.rows.length > 0 && (
                      <table className="report-count">
                        <thead>
                          <tr>
                            <th className="report-count-blank"></th>
                            <th>จำนวน(คน)</th>
                            <th>ร้อยละ</th>
                          </tr>
                        </thead>
                        <tbody>
                          {section.rows.map(([label, value, subItems], i) => (
                            <tr key={`${label}-${i}`}>
                              <td>
                                {label}
                                {/* ข้อย่อยของ "อื่นๆ" อยู่ในช่องเดียวกัน ย่อหน้าเข้าไป */}
                                {subItems?.map((item, j) => (
                                  <div className="report-count-sub" key={`${item}-${j}`}>{item}</div>
                                ))}
                              </td>
                              <td>{num(value)}</td>
                              <td>{pct(value, section.base)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    )}

                  </div>
                ))}

              </div>

            )}

          </div>

        </div>

      </div>

    </>
  );

}
