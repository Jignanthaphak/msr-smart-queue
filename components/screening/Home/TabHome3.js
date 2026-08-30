"use client";
import React, { useEffect, useState, useMemo } from "react";
import '@ant-design/v5-patch-for-react-19';
import { Table, DatePicker, Checkbox, Spin, Row, Col } from "antd";
import Image from "next/image";
import dayjs from "dayjs";
import useTable from "@/hooks/useTable";
import { screeningList } from "@/services/screening/home";
import { date } from "@/lib/utils/dateFormat";
import { generateColumns } from "@/lib/utils/generateColumns";

const { RangePicker } = DatePicker;

export default function TabHomeAntd({ open }) {

  const today = dayjs().format("YYYY-MM-DD");
  const [dateRange, setDateRange] = useState([dayjs(today), dayjs(today)]);

  const [data, setData] = useState([]);

  const fetchData = async (params) => {
      try {

        const result = await screeningList(params);
        if(!result.ok) throw new Error(result.error || "เกิดข้อผิดพลาดในการดึงข้อมูล");
        
        setData(result?.data || []);
      } catch (e) {
        message.error(e.message);
        console.error("fetch error", e);
        setData([]);
      }

  };

  const groupOptions = [
    { label: "Group ตามหน่วยงาน", value: "organization_name" },
    { label: "Group ตามเพศ", value: "gender" },
    { label: "Group สถานะ", value: "status" },
  ];

  const fields = useMemo(() => [
    { dataIndex: "date", title: "วันที่", type: "date", columnsGroupPosition:true},
    { dataIndex: "status_id", title: "สถานะ", type: "number", isStatus: true, 
      filters: [ 
        { text: "BIO", value: 1 }, 
        { text: "รอตรวจ", value: 2 }, 
        { text: "ตรวจ", value: 3 },
        { text: "เสร็จสิ้น", value: 4 },
         { text: "ปิดเคส", value: 5 }
      ] 
    },
    { dataIndex: "hn", title: "HN", type: "number" },
    { dataIndex: "fullname_th", title: "ชื่อ - นามสกุล (ไทย)", type: "string" },
    { dataIndex: "fullname_en", title: "ชื่อ - นามสกุล (Eng)", type: "string" },
    { dataIndex: "gender", title: "เพศ", type: "string" },
    { dataIndex: "organization_name", title: "หน่วยงาน", type: "string" },
    { dataIndex: "create_date", title: "วันที่ส่งข้อมูล", type: "date" },
  ], []);

  const mappedData = useMemo(() => {
  
    return data.map((item, idx) => {

      const person = item.person || {};

      return {
        key: `row-${idx}`,
        date: item.date ? date(item.date) : "-",
        status: item.screening_status?.status_name || "ไม่ทราบสถานะ",
        status_id: item?.status_id || 0,
        hn: person.hn || "-",
        fullname_th: `${person.firstname || "-"} ${person.lastname || "-"}`,
        fullname_en: `${person.firstname_en || "-"} ${person.lastname_en || "-"}`,
        gender: person.sex?.title_th || "-",
        organization_name: person.organization?.title_th || "-",
        create_date: item.create_date ? date(item.create_date) : "-",
      }

    });

  }, [data]);

  const { 
    tableData,
    loading,
    hiddenCols,
    handleGroupChange,
    groupOrder,
    searchText,
    setSearchText,
    handleTableChange,
    searchableColumns,
    handleToggleColumnSearch,
    fields: tableFields
  } = useTable({
    fetchFunction: async (params) => screeningList(params),
    data: mappedData, 
    fields,
  });

  useEffect(() => {
    const params = new URLSearchParams();
    if (dateRange[0]) params.append("startdate", dateRange[0].format("YYYY-MM-DD"));
    if (dateRange[1]) params.append("enddate", dateRange[1].format("YYYY-MM-DD"));
    fetchData(params.toString());
  }, [dateRange]);

  const columns = generateColumns(tableFields, hiddenCols, { 
    searchableColumns, 
    handleToggleColumnSearch 
  });

  
  return (
    <div className={`step-box ${open ? "open" : ""}`}>
      <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
        <Col>
          <RangePicker value={dateRange} onChange={setDateRange} />
        </Col>
        <Col>
           <Checkbox.Group
            options={groupOptions}
            value={groupOrder}
            onChange={handleGroupChange}
            style={{ padding: 4, borderRadius: 4}}
          />
        </Col>
        <Col>
          <input
            type="text"
            placeholder="ค้นหาข้อมูล..."
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            style={{ padding: 4, borderRadius: 4, border: "1px solid #ccc" }}
          />
      </Col>
      </Row>

      {loading ? (
        <Spin size="large" style={{ display: "flex", justifyContent: "center", margin: 40 }} />
      ) : (
        <Table columns={columns} dataSource={tableData} rowKey="key" bordered size="small"  scroll={{ x: "max-content" }} pagination={{ pageSize: 10 }} onChange={handleTableChange} />
      )}
    </div>
  );
}
