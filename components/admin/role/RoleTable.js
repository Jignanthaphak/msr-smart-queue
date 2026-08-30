"use client";
import React, { useState, useEffect, useMemo } from "react";
import '@ant-design/v5-patch-for-react-19';
import { Table, Space, Button, Input, Row, Col, message, Modal } from "antd";
import {
  PlusOutlined, 
  DeleteOutlined, 
  ReloadOutlined, 
  CloseOutlined,
} from '@ant-design/icons';
import RoleModal from "@/components/admin/role/RoleModal";
import { generateColumns } from "@/lib/utils/generateColumns";
import useTable from "@/hooks/useTable";
import { listRoles, removeRole, changeStatusRole, saveRolePermissions } from "@/actions/admin/role/actions";
import { datetime } from "@/lib/utils/dateFormat";

const { Search } = Input;
const { confirm } = Modal;

export default function RoleTable() {

  const [roles, setRoles] = useState([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedRole, setSelectedRole] = useState(null);

  const fetchData = async () => {
      try {

        const result = await listRoles();
        if(!result.ok) throw new Error(result.error || "เกิดข้อผิดพลาดในการดึงข้อมูล");
       
        setRoles(result?.data || []);
      } catch (e) {
        message.error(e.message);
        console.error("fetch error", e);
        setRoles([]);
      }

  };

  const fields = useMemo(() => [
      { dataIndex: "role_id", title: "ID Role", type: "number" },
      { dataIndex: "role_name", title: "Name", type: "string" },
      { dataIndex: "create_date", title: "วันที่สร้าง", type: "date" },
      { dataIndex: "update_date", title: "วันที่แก้ไข", type: "date" },
      { dataIndex: "role_status", title: "สถานะ", type: "number", key:"role_id", isStatus: true, isStatusText: true,
          filters: [ 
            { text: "เปิด", value: 1 }, 
            { text: "ปิด", value: 0 }, 
          ] 
      },
      { dataIndex: "manage", title: "จัดการ", type: "string", key:"role_id", isManage: true,  isEdit: true,  isDel: true },
  ], []);

  const mappedData = useMemo(() => {
    return roles.map((item, idx) => ({
      key: `row-${idx}`,
      role_id: item.role_id || "-",
      role_name: item.role_name || "-",
      create_date: item.create_date ? datetime(item.create_date) : "-",
      update_date: item.update_date ? datetime(item.update_date) : "-",
      role_status: item.role_status ?? 1,
    }));
  }, [roles]);

  useEffect(() => {
      fetchData();
  }, []);


  const openModal = () => {
    setModalOpen(true);
  };

  const closeModal = () => {
    setSelectedRole(null);
    setModalOpen(false);
  };

  const handleSave = async (values) => {

    confirm({
      title: "ยืนยันการบันทึกข้อมูล",
      content: `คุณต้องการบันทึกข้อมูล ใช่หรือไม่?`,
      okText: "ใช่, บันทึก",
      cancelText: "ยกเลิก",
      okType: "primary",
      cancelType: "danger",
      async onOk() {

        try {

          const result = await saveRolePermissions(values);
          if(!result.ok) throw new Error(result.error || "เกิดข้อผิดพลาดในการบันทึกข้อมูล");

          message.success("บันทึกข้อมูลสำเร็จ");

          setModalOpen(false);
          setSelectedRole(null);
          fetchData();
        
        } catch (err) {
          message.error(err.message);
          console.error("บันทึกไม่สำเร็จ:", err);
        }

     }
     
   });

  };

  const handleEdit = async (role_id) => {

    try {

      setSelectedRole(role_id)
      setModalOpen(true);
    
    } catch (err) {
      message.error(err.message);
      console.error("บันทึกไม่สำเร็จ:", err);
    }

  };

  const handleDelete = async (role_id) => {

    confirm({
      title: "ยืนยันการลบข้อมูล",
      content: `คุณต้องการลบข้อมูล ใช่หรือไม่?`,
      okText: "ใช่, ลบ",
      cancelText: "ยกเลิก",
      okType: "primary",
      cancelType: "danger",
      async onOk() {

        try {

          const result = await removeRole({role_id});
          if(!result.ok) throw new Error(result.error || "เกิดข้อผิดพลาดในการลบข้อมูล");

          message.success("ลบข้อมูลสำเร็จ");
          
          setSelectedRole(null);
          fetchData();
        
        } catch (err) {
          message.error(err.message);
          console.error("ลบไม่สำเร็จ:", err);
        }
      }
     
    });

  };

  const handleStatusChange = async (role_id, role_status) => {

    confirm({
      title: "ยืนยันการแก้ไขสถานะ",
      content: `คุณต้องการแก้ไขสาถานะ ใช่หรือไม่?`,
      okText: "ใช่, แก้ไข",
      cancelText: "ยกเลิก",
      okType: "primary",
      cancelType: "danger",
      async onOk() {

        try {

          const result = await changeStatusRole({role_id, role_status});
          if(!result.ok) throw new Error(result.error || "เกิดข้อผิดพลาดในการเปลี่ยนสถานะ");

          message.success("เปลี่ยนสถานะสำเร็จ");
        
          fetchData();
        
        } catch (err) {
          message.error(err.message);
          console.error("เปลี่ยนสถานะไม่สำเร็จ:", err);
        }
      }
     
    });
  };

  const { 
      tableData,
      loading:loadingTable,
      hiddenCols,
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
      onEdit:handleEdit,
      onDelete:handleDelete,
      onStatusChange:handleStatusChange,
    }
  );

  return (
    <>
    
      <Row className='!flex-col lg:!flex-row !justify-center lg:!justify-between items-center mb-4 gap-4'>
        
        <Col>
          <Space className='!flex !flex-wrap '>
          
            <Button
              icon={<ReloadOutlined />}
              onClick={fetchData}
              loading={loadingTable}
            />
          
            <Button type="primary" icon={<PlusOutlined />} onClick={openModal}>
              เพิ่ม Role
            </Button>
          
          </Space>
        </Col>
      
        <Col>
          <Space className='!flex !flex-wrap '>
          
            <Search
              placeholder="ค้นหาต"
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
            <RoleModal
              open={modalOpen}
              onClose={closeModal}
              roleId={selectedRole}
              onSave={handleSave}
            />
        )}
        
    </>
  );
}
