"use client";
import React, { useState, useEffect, useMemo } from "react";
import { Table, DatePicker, Checkbox, Spin, Row, Col } from "antd";
import Image from "next/image";
import dayjs from "dayjs";
import isBetween from "dayjs/plugin/isBetween";
import * as XLSX from "xlsx";
import { screeningList } from "@/services/screening/home";
import { date } from "@/lib/utils/dateFormat";
import clientConfig from "@/config/Client";

dayjs.extend(isBetween);
const { RangePicker } = DatePicker;

const groupOptions = [
  { label: "Group ตามหน่วยงาน", value: "organization_name" },
  { label: "Group ตามเพศ", value: "gender" },
  { label: "Group สถานะ", value: "status" },
];

// ======= groupData ใหม่ =======
// - คืนค่า nodes แบบ nested (children)
// - แต่ละ group node มี: isGroup, level, groupField, groupValue, groupCount, itemCount, children
// - leaf nodes (รายการจริง) จะไม่มี isGroup (หรือ isGroup=false) แต่มี level
const groupData = (data, groupOrder, level = 0) => {
  if (!groupOrder.length) {
    // leaf level: คืนรายการจริง พร้อม level
    return data.map((item) => ({ ...item, level }));
  }

  const field = groupOrder[0];
  const grouped = data.reduce((acc, item) => {
    const key = item[field] || "-";
    if (!acc[key]) acc[key] = [];
    acc[key].push(item);
    return acc;
  }, {});

  return Object.entries(grouped).map(([key, items], idx) => {
    const children = groupData(items, groupOrder.slice(1), level + 1);

    // จำนวนกลุ่มย่อย (immediate child groups)
    const groupCount = children.filter((c) => c && c.isGroup).length;

    // จำนวนรายการจริง (leaf items) — ต้องรวมลึกลงไป
    const itemCount = children.reduce((sum, c) => {
      if (c && c.isGroup) return sum + (c.itemCount || c.count || 0);
      // leaf row -> นับเป็น 1
      return sum + 1;
    }, 0);

    return {
      key: `${field}-${level}-${idx}`,
      isGroup: true,
      level,
      groupField: field,
      groupValue: key,
      groupCount,
      itemCount,
      // สำหรับ compatibility เก่า ให้เก็บ count = itemCount (ถ้าช่องอื่นยังเรียก count)
      count: itemCount,
      children,
    };
  });
};

export default function TabHomeAntd({ open }) {
  const today = dayjs().format("YYYY-MM-DD");
  const [dateRange, setDateRange] = useState([dayjs(today), dayjs(today)]);
  const [rawData, setRawData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [groupOrder, setGroupOrder] = useState([]);
  const [hiddenCols, setHiddenCols] = useState([]);

  // Fetch
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const params = new URLSearchParams();
        if (dateRange[0]) params.append("startdate", dateRange[0].format("YYYY-MM-DD"));
        if (dateRange[1]) params.append("enddate", dateRange[1].format("YYYY-MM-DD"));
        const result = await screeningList(params.toString());
        setRawData(result?.data || []);
      } catch (e) {
        console.error("fetch error", e);
        setRawData([]);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [dateRange]);

  // Map raw -> table rows (leaf records)
  const mappedData = useMemo(() => {
    return rawData.map((item, idx) => {
      const person = item.person || {};
      return {
        key: `row-${idx}`,
        date: item.date ? date(item.date) : "-",
        status: item.screening_status?.status_name || "ไม่ทราบสถานะ",
        status_id: item.status_id || 0,
        hn: person.hn || "-",
        fullname_th: `${person.firstname || "-"} ${person.lastname || "-"}`,
        fullname_en: `${person.firstname_en || "-"} ${person.lastname_en || "-"}`,
        gender: person.sex?.title_th || "-",
        organization_name: person.organization?.title_th || "-",
        create_date: item.create_date ? date(item.create_date) : "-",
        persons_address: item.persons_address || [],
      };
    });
  }, [rawData]);

  // Apply grouping (ถ้าไม่มี groupOrder คืน mappedData แต่ใส่ level:0)
  const tableData = useMemo(() => {
    if (!groupOrder.length) {
      return mappedData.map((r) => ({ ...r, level: 0 })); // leaf rows with level=0
    }
    return groupData(mappedData, groupOrder);
  }, [mappedData, groupOrder]);

  // Columns: เราแสดง header ของ group ในคอลัมน์แรกเท่านั้น (ไม่ span เต็ม)
  const allColumns = [
    {
      title: "วันที่",
      dataIndex: "date",
      // หัวกลุ่มจะแสดงที่คอลัมน์นี้ และไม่ span เต็ม เพื่อให้ AntD วาด indent/expand ได้ปกติ
      render: (_, row) => {
        if (row && row.isGroup) {
          // แสดงทั้ง groupCount และ itemCount เพื่อให้ชัดเจน
          const groupCount = row.groupCount ?? 0;
          const itemCount = row.itemCount ?? row.count ?? 0;
          return {
            children: (
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  paddingLeft: `${row.level * 20}px`, // extra left padding (ช่วยมองเห็นชั้น)
                  fontWeight: 600,
                }}
              >
                <div style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                  {row.groupField} : {row.groupValue}{" "}
                  <span style={{ color: "#666", fontWeight: 400, marginLeft: 8 }}>
                    ({groupCount} กลุ่ม • {itemCount} รายการ)
                  </span>
                </div>
              </div>
            ),
            props: { colSpan: 1 }, // <-- สำคัญ: ให้แสดงแค่คอลัมน์แรก
          };
        }
        return row.date;
      },
      sorter: (a, b) => (a.date || "").localeCompare(b.date || ""),
    },
    {
      title: "สถานะ",
      dataIndex: "status",
      render: (_, row) => {
        if (row && row.isGroup) return { props: { colSpan: 0 } };
        const imgSrc = clientConfig.base_path+`/images/status_${row.status_id}.png`;
        return (
          <span style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
            <Image src={imgSrc} alt={row.status} width={18} height={18} unoptimized />
            <span>{row.status}</span>
          </span>
        );
      },
      sorter: (a, b) => (a.status || "").localeCompare(b.status || ""),
    },
    {
      title: "HN",
      dataIndex: "hn",
      render: (_, row) => (row && row.isGroup ? { props: { colSpan: 0 } } : row.hn),
      sorter: (a, b) => (a.hn || "").localeCompare(b.hn || ""),
    },
    {
      title: "ชื่อ - นามสกุล (ไทย)",
      dataIndex: "fullname_th",
      render: (_, row) => (row && row.isGroup ? { props: { colSpan: 0 } } : row.fullname_th),
      sorter: (a, b) => (a.fullname_th || "").localeCompare(b.fullname_th || ""),
    },
    {
      title: "ชื่อ - นามสกุล (Eng)",
      dataIndex: "fullname_en",
      render: (_, row) => (row && row.isGroup ? { props: { colSpan: 0 } } : row.fullname_en),
      sorter: (a, b) => (a.fullname_en || "").localeCompare(b.fullname_en || ""),
    },
    {
      title: "เพศ",
      dataIndex: "gender",
      render: (_, row) => (row && row.isGroup ? { props: { colSpan: 0 } } : row.gender),
      sorter: (a, b) => (a.gender || "").localeCompare(b.gender || ""),
    },
    {
      title: "หน่วยงาน",
      dataIndex: "organization_name",
      render: (_, row) => (row && row.isGroup ? { props: { colSpan: 0 } } : row.organization_name),
      sorter: (a, b) => (a.organization_name || "").localeCompare(b.organization_name || ""),
    },
    {
      title: "วันที่ส่งข้อมูล",
      dataIndex: "create_date",
      render: (_, row) => (row && row.isGroup ? { props: { colSpan: 0 } } : row.create_date),
      sorter: (a, b) => (a.create_date || "").localeCompare(b.create_date || ""),
    },
  ];

  const columns = allColumns.filter((c) => !hiddenCols.includes(c.dataIndex));

  // Expanded details for leaf rows
  const expandedRowRender = (record) => {
    if (record && record.isGroup) return null;
    const addr = record.persons_address?.[1] || {};
    return (
      <div style={{ padding: "10px 20px", background: "#fafafa" }}>
        <h4 style={{ marginBottom: "6px" }}>ที่อยู่ตามบัตรประชาชน</h4>
        <div>บ้านเลขที่: {addr.houseno || "-"}</div>
        <div>หมู่ที่: {addr.villagenno || "-"}</div>
        <div>ถนน: {addr.road || "-"}</div>
        <div>ตำบล: {addr.subdistricts || "-"}</div>
        <div>อำเภอ: {addr.districts || "-"}</div>
        <div>จังหวัด: {addr.provinces || "-"}</div>
        <div>รหัสไปรษณีย์: {addr.zip_code || "-"}</div>
      </div>
    );
  };

  return (
    <div className={`step-box ${open ? "open" : ""}`}>
      <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
        <Col>
          <RangePicker value={dateRange} onChange={(v) => setDateRange(v)} />
        </Col>
        <Col>
          <Checkbox.Group options={groupOptions} value={groupOrder} onChange={(checked) => setGroupOrder(checked)} />
        </Col>
      </Row>

      {loading ? (
        <Spin size="large" style={{ display: "flex", justifyContent: "center", margin: "40px" }} />
      ) : (
        <Table
          columns={columns}
          dataSource={tableData}
          expandable={{ expandedRowRender }}
          pagination={{ pageSize: 10 }}
          // ให้ indent/expand icon อยู่ที่คอลัมน์แรก และขนาด indent เท่ากับ 24px
          expandIconColumnIndex={0}
          indentSize={24}
          rowClassName={(record) => (record && record.isGroup ? `group-row level-${record.level}` : "")}
          bordered
          size="middle"
        />
      )}

      {/* เล็กน้อยสำหรับสีพื้นหัวกลุ่ม */}
      <style jsx global>{`
        .group-row.level-0 > td {
          background: #f5f9ff !important;
        }
        .group-row.level-1 > td {
          background: #fbfcff !important;
        }
        .group-row.level-2 > td {
          background: #ffffff !important;
        }
        /* เพิ่มเส้นแบบ subtle เพื่อแยกกลุ่มชัดขึ้น */
        .group-row.level-0 > td,
        .group-row.level-1 > td {
          border-top: 1px solid #eef3ff !important;
        }
      `}</style>
    </div>
  );
}
