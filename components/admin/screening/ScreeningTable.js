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
import ScreeningModal from "@/components/admin/screening/ScreeningModal";
import { generateColumns } from "@/lib/utils/generateColumns";
import useTable from "@/hooks/useTable";
import { listScreening } from "@/actions/admin/screening/actions";
import { date, datetime } from "@/lib/utils/dateFormat";
import { listOrganization } from "@/actions/admin/organization/actions";
import dayjs from "dayjs";

const { Search } = Input;
const { confirm } = Modal;
const { RangePicker } = DatePicker;

export default function ScreeningTable() {

  const [screenings, setScreenings] = useState([]);
  const [organizations, setOrganizations] = useState([]);
  const [selectedOrganization, setSelectedOrganization] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedScreening, setSelectedScreening] = useState(null);
  const [loadingOrganizations, setLoadingOrganizations] = useState(true);
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

      if (selectedOrganization) payload.organization_id = selectedOrganization;

      const result = await listScreening(payload);
      if (!result.ok) throw new Error(result.error || "เกิดข้อผิดพลาดในการดึงข้อมูล");
      setScreenings(result?.data || []);
    } catch (e) {
      message.error(e.message);
      console.error("fetch error", e);
      setScreenings([]);
    } finally {
      setLoadingTable(false);
    }
  };

  const fetchOrganizations = async () => {
    try {
      setLoadingOrganizations(true);
      const result = await listOrganization();
      if (!result.ok) throw new Error(result.error || "ไม่สามารถดึงข้อมูลหน่วยงานได้");
      setOrganizations(result.data || []);
    } catch (e) {
      message.error(e.message);
      setOrganizations([]);
    } finally {
      setLoadingOrganizations(false);
    }
  };

  useEffect(() => {
    fetchOrganizations();
  }, []);

  useEffect(() => {
    fetchData();
  }, [dateRange, selectedOrganization]);

  const groupOptions = [
    { label: "Group ตามหน่วยงาน", value: "organization_name" },
    { label: "Group ตามเพศ", value: "gender" },
    { label: "Group สถานะ", value: "status" },
  ];

  const fields = useMemo(() => [
    { dataIndex: "date", title: "วันที่", type: "date", columnsGroupPosition:true},
    { dataIndex: "screening_id", title: "Screening ID", type: "number" },
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
    { dataIndex: "manage", title: "จัดการ", type: "string", key:"screening_id", isManage: true,  isView: true},
  ], []);

  const mappedData = useMemo(() => {
    
    return screenings.map((item, idx) => {

      const person = item.person || {};

      return {
        key: `row-${idx}`,
        date: item.date ? date(item.date) : "-",
        status: item.screening_status?.status_name || "ไม่ทราบสถานะ",
        status_id: item?.status_id || 0,
        hn: person.hn || "-",
        screening_id: item.screening_id || null,
        fullname_th: `${person.firstname || "-"} ${person.lastname || "-"}`,
        fullname_en: `${person.firstname_en || "-"} ${person.lastname_en || "-"}`,
        gender: person.sex?.title_th || "-",
        organization_name: person.organization?.title_th || "-",
        create_date: item.create_date ? date(item.create_date) : "-",
      }

    });

  }, [screenings]);

  const onView = async (screening_id) => {
    setSelectedScreening(screening_id)
    setModalOpen(true);
  };

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
      onView,
    }
  );

  const openModal = () => setModalOpen(true);
  const closeModal = () => {
    setSelectedScreening(null);
    setModalOpen(false);
  };

  const onEdited = () => {
    fetchData(selectedOrganization, dateRange);
  };


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
              onChange={setDateRange}
              value={dateRange}
              format="YYYY-MM-DD"
              placeholder={["วันที่เริ่ม", "ถึงวันที่"]}
              style={{ minWidth: 250 }}
            />
          
            <Select
                style={{ minWidth: 220 }}
                placeholder="เลือกหน่วยงาน"
                loading={loadingOrganizations}
                value={selectedOrganization}
                onChange={setSelectedOrganization}
                allowClear
                options={[
                  { label: "ทั้งหมด", value: "" },
                  ...organizations.map((org) => ({
                    label: org.title_th,
                    value: org.organization_id,
                  })),
                ]}
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

      {modalOpen && (
        <ScreeningModal
          open={modalOpen}
          onClose={closeModal}
          screeningId={selectedScreening}
          onEdit={onEdited}
        />
      )}
    </>
  );
}
