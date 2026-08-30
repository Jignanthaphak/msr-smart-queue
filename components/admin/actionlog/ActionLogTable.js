"use client";
import React, { useState, useEffect, useMemo } from "react";
import '@ant-design/v5-patch-for-react-19';
import { Table, Space, Button, Input, Row, Col, message, Modal, Select, Checkbox, DatePicker } from "antd";
import {
  PlusOutlined,
  DeleteOutlined,
  ReloadOutlined,
  CloseOutlined,
} from '@ant-design/icons';
import { generateColumns } from "@/lib/utils/generateColumns";
import useTable from "@/hooks/useTable";
import { listActionLogs } from "@/actions/admin/actionlog/actions";
import { date, datetime } from "@/lib/utils/dateFormat";
import dayjs from "dayjs";

const { Search } = Input;
const { confirm } = Modal;
const { RangePicker } = DatePicker;

export default function ActionLogTable() {

  const [data, setData] = useState([]);
  const [loadingTable, setLoadingTable] = useState(false);
  const today = dayjs().format("YYYY-MM-DD");
  const [dateRange, setDateRange] = useState([dayjs(today), dayjs(today)]);

  const fetchData = async () => {
    try {
      setLoadingTable(true);

      const payload = {
        start_date: dateRange[0].format("YYYY-MM-DD"),
        end_date: dateRange[1].format("YYYY-MM-DD"),
      };
      const result = await listActionLogs(payload);

      console.log(result)
      if (!result.ok) throw new Error(result.error || "เกิดข้อผิดพลาดในการดึงข้อมูล");
      setData(result?.data || []);
    } catch (e) {
      message.error(e.message);
      console.error("fetch error", e);
      setData([]);
    } finally {
      setLoadingTable(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [dateRange]);

  const groupOptions = [
    { label: "Group ชื่อตาราง", value: "entity_type" },
    { label: "Group ประเภท", value: "action" },
    { label: "Group Session ID", value: "session_id" },
    { label: "Group ผู้ทำรายการ", value: "create_by_account" },
  ];

  const fields = useMemo(() => [
    { dataIndex: "id", title: "ลำดับ", type: "number", columnsGroupPosition:true},
    { dataIndex: "entity_type", title: "ชื่อตาราง", type: "string" },
    { dataIndex: "entity_id", title: "คีย์หลัก", type: "number" },
    { dataIndex: "action", title: "ประเภท", type: "string" },
    { dataIndex: "source_file", title: "แหล่งที่มา", type: "string" },
    { dataIndex: "session_id", title: "Session ID", type: "string" },
    { dataIndex: "create_by_account", title: "ผู้ทำรายการ", type: "string" },
     { dataIndex: "create_date", title: "วันที่ทำรายการ", type: "date" },
  ], []);

  const mappedData = useMemo(() => {
    
    return data.map((item, idx) => {

      return {
        key: `row-${idx}`,
        id: item.id || "-",
        create_date: item.create_date ? datetime(item.create_date) : "-",
        entity_type: item.entity_type || "-",
        entity_id: item.entity_id || "-",
        session_id: item.session_id || "-",
        action: item.action || "-",
        source_file: item.source_file || "-",
        create_by_account: item?.create_by_account?.nickname || "-",
      }

    });

  }, [data]);

  const {
    tableData,
    hiddenCols,
    groupOrder,
    handleGroupChange,
    searchText,
    setSearchText,
    handleTableChange,
    searchableColumns,
    handleToggleColumnSearch,
    fields: tableFields
  } = useTable({
    data: mappedData,
    fields,
  });

  const columns = generateColumns(
    tableFields,
    hiddenCols,
    {
      searchableColumns,
      handleToggleColumnSearch,
    }
  );

  return (
    <>
      <Row className='!flex-col lg:!flex-row !justify-center lg:!justify-between items-center mb-4 gap-4'>

        <Col>
          <Space className='!flex !flex-wrap '>
          
             <Button
              icon={<ReloadOutlined />}
              onClick={() => fetchData()}
              loading={loadingTable}
            />
            <RangePicker
              value={dateRange}
              onChange={setDateRange}
              format="YYYY-MM-DD"
              placeholder={["วันที่เริ่ม", "ถึงวันที่"]}
              style={{ minWidth: 250 }}
            />

            <Checkbox.Group
              options={groupOptions}
              value={groupOrder}
              onChange={handleGroupChange}
              style={{ padding: 4, borderRadius: 4}}
            />
          
          </Space>
          
        </Col>

        <Col>
          <Space className='!flex !flex-wrap'>
            <Search
              placeholder="ค้นหา"
              onSearch={(value) => setSearchText(value)}
              onChange={(e) => setSearchText(e.target.value)}
              allowClear
              value={searchText}
            />
          </Space>
        </Col>
      </Row>

      <Table
        loading={loadingTable}
        columns={columns}
        dataSource={tableData}
        rowKey="key"
        size="middle"
        pagination={{ pageSize: 10 }}
        scroll={{ x: "max-content" }}
        onChange={handleTableChange}
      />

     
    </>
  );
}
