"use client";
import React, { useState, useEffect, useMemo } from "react";
import '@ant-design/v5-patch-for-react-19';
import { Table, Space, Button, Input, Row, Col, message, Modal, Select, Checkbox } from "antd";
import {
  PlusOutlined,
  DeleteOutlined,
  ReloadOutlined,
  CloseOutlined,
} from '@ant-design/icons';
import PersonModal from "@/components/admin/person/PersonModal";
import { generateColumns } from "@/lib/utils/generateColumns";
import useTable from "@/hooks/useTable";
import { listPerson } from "@/actions/admin/person/actions";
import { date, datetime } from "@/lib/utils/dateFormat";
import { listOrganization } from "@/actions/admin/organization/actions";

const { Search } = Input;
const { confirm } = Modal;

export default function PersonTable() {

  const [persons, setPersons] = useState([]);
  const [organizations, setOrganizations] = useState([]);
  const [selectedOrganization, setSelectedOrganization] = useState(""); // ✅ เก็บค่าที่เลือก
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedPerson, setSelectedPerson] = useState(null);
  const [loadingOrganizations, setLoadingOrganizations] = useState(true);
  const [loadingTable, setLoadingTable] = useState(false);

  const fetchData = async (organizationId = "") => {
    try {
      setLoadingTable(true);
      const result = await listPerson(organizationId ? { organization_id: organizationId } : {});
      if (!result.ok) throw new Error(result.error || "เกิดข้อผิดพลาดในการดึงข้อมูล");
      setPersons(result?.data || []);
    } catch (e) {
      message.error(e.message);
      console.error("fetch error", e);
      setPersons([]);
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
    fetchData(); // ✅ ดึงทั้งหมดก่อนตอนเริ่ม
  }, []);

  // ✅ เมื่อเปลี่ยนหน่วยงาน
  const handleOrganizationChange = (value) => {
    setSelectedOrganization(value);
    fetchData(value);
  };

  const groupOptions = [
    { label: "Group ตามหน่วยงาน", value: "organization_name" },
    { label: "Group ตามเพศ", value: "gender" },
  ];

  const fields = useMemo(() => [
    { dataIndex: "hn", title: "HN", type: "number", columnsGroupPosition:true },
    { dataIndex: "fullname_th", title: "ชื่อ - นามสกุล (ไทย)", type: "string" },
    { dataIndex: "fullname_en", title: "ชื่อ - นามสกุล (Eng)", type: "string" },
    { dataIndex: "gender", title: "เพศ", type: "string" },
    { dataIndex: "organization_name", title: "หน่วยงาน", type: "string" },
    { dataIndex: "create_date", title: "วันที่บันทึกข้อมูล", type: "date" },
    { dataIndex: "create_by_account", title: "บันทึกข้อมูลโดย", type: "string" },
    { dataIndex: "update_date", title: "วันที่แก้ไขล่าสุด", type: "date" },
    { dataIndex: "manage", title: "จัดการ", type: "string", key:"hn", isManage: true,  isView: true},
  ], []);

  const mappedData = useMemo(() => {
    return persons.map((item, idx) => ({
      key: `row-${idx}`,
      hn: item.hn ? item.hn : "-",
      fullname_th: `${item.firstname || "-"} ${item.lastname || "-"}`,
      fullname_en: `${item.firstname_en || "-"} ${item.lastname_en || "-"}`,
      gender: item.sex?.title_th || "-",
      organization_name: item.organization?.title_th || "-",
      create_date: item.create_date ? datetime(item.create_date) : "-",
      create_by_account: item?.create_by_account?.nickname || "-",
      update_date: item.update_date ? datetime(item.update_date) : "-",
    }));
  }, [persons]);

  const onView = async (hn) => {
  
    setSelectedPerson(hn)
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
    setSelectedPerson(null);
    setModalOpen(false);
  };

  const onEdited = () => {
    fetchData();
  };


  return (
    <>
      <Row className='!flex-col lg:!flex-row !justify-center lg:!justify-between items-center mb-4 gap-4'>

        <Col>
          <Space className='!flex !flex-wrap '>
          
             <Button
              icon={<ReloadOutlined />}
              onClick={() => fetchData(selectedOrganization)}
              loading={loadingTable}
            />
          
            <Select
                style={{ minWidth: 220 }}
                placeholder="เลือกหน่วยงาน"
                loading={loadingOrganizations}
                value={selectedOrganization}
                onChange={handleOrganizationChange}
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
        <PersonModal
          open={modalOpen}
          onClose={closeModal}
          personId={selectedPerson}
          onEdit={onEdited}
        />
      )}
    </>
  );
}
