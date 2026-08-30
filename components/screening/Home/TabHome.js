// /components/screening/Home/TabHome.js
"use client";
import React, { useState, useMemo, useEffect } from "react";
import Image from "next/image";
import {
  MaterialReactTable,
  useMaterialReactTable,
} from "material-react-table";
import {
  Box,
  TextField,
  FormControlLabel,
  Checkbox,
  CircularProgress,
} from "@mui/material";
import dayjs from "dayjs";
import isBetween from "dayjs/plugin/isBetween";
import { MRT_Localization_TH } from "@/lib/titleTable/tabHome";
import { screeningList } from "@/services/screening/home";
import { date, datetime, times, day, nowMs, nowSec, nowDate } from "@/lib/utils/dateFormat";
import clientConfig from "@/config/Client";

dayjs.extend(isBetween);

export default function TabHome({open}) {
  const [rawData, setRawData] = useState([]);
  const [loading, setLoading] = useState(true);

  const today = new Date().toISOString().slice(0, 10);
  const [startDate, setStartDate] = useState(today);
  const [endDate, setEndDate] = useState(today);

  const [groupOrder, setGroupOrder] = useState([]);
  const [groupByDepartment, setGroupByDepartment] = useState(false);
  const [groupByGender, setGroupByGender] = useState(false);
  const [groupByStatus, setGroupByStatus] = useState(false);

  // 🟡 ดึงข้อมูลจาก API
  useEffect(() => {
    const fetchData = async () => {

      setLoading(true);
      try {

        const params = new URLSearchParams();
        if (startDate) params.append("startdate", startDate);
        if (endDate) params.append("enddate", endDate);
        const queryString = params.toString();

        const result = await screeningList(queryString);

        setRawData(result?.data); 

      } catch (error) {

        console.error("Error fetching data:", error);
        setRawData([]);

      } finally {

        setLoading(false);

      }

    };

    fetchData();

  }, [startDate, endDate]);

  const mappedData = useMemo(() => {

    return rawData.map((item, idx) => {
   
      const date_key = item.date ? date(item.date) : "-";
    
      const create_date = item.create_date ? date(item.create_date) : "-";
   
      const person = item.person || {};
    
      const hn = person.hn || "-";
   
      const firstname_th = person.firstname || "-";
      const lastname_th = person.lastname || "-";
      const fullname_th = `${firstname_th} ${lastname_th}`.trim();

      const firstname_en = person.firstname_en || "-";
      const lastname_en = person.lastname_en || "-";
      const fullname_en = `${firstname_en} ${lastname_en}`.trim();

      const gender = person.sex?.title_th || "-";

      const organization_name = person.organization?.title_th || "-";

      const status = item.screening_status?.status_name || "ไม่ทราบสถานะ";
      const status_id = item.status_id || 0;

      return {
        id: idx,
        date:date_key,
        status,
        status_id,
        hn,
        fullname_th,
        fullname_en,
        gender,
        organization_name,
        create_date,
      };

    });

  }, [rawData]);

  const toggleGroup = (field) => {

    setGroupOrder((prev) => {
     
      if (prev.includes(field)) {
        return prev.filter((f) => f !== field);
      }
     
      return [...prev, field];

    });

  };

  const grouping = useMemo(() => {

    return groupOrder;

  }, [groupOrder]);
 
  const columns = useMemo(
    () => [

      { accessorKey: "date", header: "วันที่" },
      {
        accessorKey: "status",
        header: "สถานะ",
        Cell: ({ row }) => {

          const label = row.original.status;
          const status_id = row.original.status_id;
          const imgSrc = clientConfig.base_path+`/images/status_${status_id}.png`;

          return (
            <span className="flex items-center gap-2">
              <Image
                src={imgSrc}
                alt={`status_${label}`}
                width={20}
                height={20}
                className="object-contain"
                unoptimized
              />
              {label}
            </span>
          );
        },
      },
      { accessorKey: "hn", header: "HN"},
      { accessorKey: "fullname_th", header: "ชื่อ - นามสกุล (ไทย)" },
      { accessorKey: "fullname_en", header: "ชื่อ - นามสกุล (Eng)" },
      { accessorKey: "gender", header: "เพศ" },
      { accessorKey: "organization_name", header: "หน่วยงาน" },
      { accessorKey: "create_date", header: "วันที่ส่งข้อมูล" },
    ], []);

  const table = useMaterialReactTable({
    columns,
    data: mappedData,
    enableGrouping: grouping.length > 0,
    // enableColumnResizing: grouping.length > 0,
    groupedColumnMode: 'remove',
    enableExpanding: true,
    getRowId: (row) => row.id.toString(),
    state: {
      grouping,
      density: 'compact', 
    },
    initialState: {
      density: 'compact',
    },
    localization: MRT_Localization_TH,
    renderDetailPanel: ({ row }) => {
      if (!row.getIsGrouped()) {
        return (
          <Box sx={{ p: 2, backgroundColor: "white", color: "black" }}>
            <div className="form-section">
              <h3><i className="show-in-modern" data-lucide="map-pin-house"></i> ที่อยู่ตามบัตรประชาชน</h3>
              <div className="form-grid">
                  <div className="form-group">
                      <label>บ้านเลขที่</label>
                      <label> {row.original?.persons_address?.[1]?.houseno ?? "-"} </label>
                  </div>
      
                  <div className="form-group">
                      <label>หมู่ที่</label>
                      <label> {row.original?.persons_address?.[1]?.villagenno ?? "-"} </label>
                  </div>
      
                  <div className="form-group">
                      <label>ถนน</label>
                      <label> {row.original?.persons_address?.[1]?.road ?? "-"} </label>
                  </div>
      
                  <div className="form-group">
                      <label>ตำบล/แขวง</label>
                      <label> {row.original?.persons_address?.[1]?.subdistricts ?? "-"} </label>
                  </div>
      
                  <div className="form-group">
                      <label>อำเภอ/เขต</label>
                      <label> {row.original?.persons_address?.[1]?.districts ?? "-"} </label>
                  </div>
      
                  <div className="form-group">
                      <label>จังหวัด</label>
                      <label> {row.original?.persons_address?.[1]?.provinces ?? "-"} </label>
                  </div>
      
                  <div className="form-group">
                      <label>รหัสไปรษณีย์</label>
                      <label> {row.original?.persons_address?.[1]?.zip_code ?? "-"} </label>
                  </div>
              </div>
            </div>
          </Box>
        );
      }
      return null;
    },
    enableColumnActions: true,       // ❌ ปิดเมนูคลิกขวาบนคอลัมน์
    enableColumnFilters: true,       // ❌ ปิดตัวกรองคอลัมน์
    enableDensityToggle: false,      // ❌ ปิดปุ่มเปลี่ยนความหนาแน่น
    enableHiding: true,              // ❌ ปิดปุ่มซ่อนคอลัมน์
    
  });

  return (
    <>
      <div className={`step-box ${open ? "open" : ""}`}>
        <Box sx={{ p: 2, width: "100%" }}>
          <Box
            sx={{
              mb: 1,
              display: "flex",
              gap: 1,
              flexWrap: "wrap",
              alignItems: "center",
            }}
          >
            <TextField
              label="เริ่มวันที่"
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
      
              sx={{ minWidth: 140 }}
            />
            <TextField
              label="สิ้นสุดวันที่"
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
          
              sx={{ minWidth: 140 }}
            />
            <FormControlLabel
              control={
                <Checkbox
                  id="group-department"
                  checked={groupOrder.includes("organization_name")}
                  onChange={() => toggleGroup("organization_name")}
                />
              }
              htmlFor="group-department"
              label="Group ตามหน่วยงาน"
            />
            <FormControlLabel
              control={
                <Checkbox
                  id="group-gender"
                  checked={groupOrder.includes("gender")}
                  onChange={() => toggleGroup("gender")}
                />
              }
              htmlFor="group-gender"
              label="Group ตามเพศ"
            />
            <FormControlLabel
              control={
                <Checkbox
                  id="group-status"
                  checked={groupOrder.includes("status")}
                  onChange={() => toggleGroup("status")}
                />
              }
              htmlFor="group-status"
              label="Group สถานะ"
            />
            
          </Box>

          {loading ? (
            <Box sx={{ display: "flex", justifyContent: "center", p: 4 }}>
              <CircularProgress />
            </Box>
          ) : (
            <MaterialReactTable table={table}/>
          )}
        </Box>
      </div>
    </>
  );
}
