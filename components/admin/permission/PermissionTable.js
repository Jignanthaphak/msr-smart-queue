"use client";
import React, { useState, useEffect, useMemo } from "react";
import '@ant-design/v5-patch-for-react-19';
import { Table, Space, Button, Input, Row, Col, message, Modal, Checkbox } from "antd";
import {
  PlusOutlined, 
  DeleteOutlined, 
  ReloadOutlined, 
  CloseOutlined,
} from '@ant-design/icons';
import PermissionModal from "@/components/admin/permission/PermissionModal";
import { generateColumns } from "@/lib/utils/generateColumns";
import useTable from "@/hooks/useTable";
import { listPermission, savePermission, removePermission, changeStatusPermission, changeTypePermission  } from "@/actions/admin/permission/actions";
import { datetime } from "@/lib/utils/dateFormat";

const { Search } = Input;
const { confirm } = Modal;

export default function PermissionTable() {

  const [permissions, setPermissions] = useState([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedPermission, setSelectedPermission] = useState(null);

  const fetchData = async () => {
      try {

        const result = await listPermission();
        if(!result.ok) throw new Error(result.error || "เกิดข้อผิดพลาดในการดึงข้อมูล");
       
        setPermissions(result?.data || []);
      } catch (e) {
        message.error(e.message);
        console.error("fetch error", e);
        setPermissions([]);
      }

  };

  const groupOptions = [
    { label: "Group ประเภท", value: "is_admin" },
  ];

  const fields = useMemo(() => [
      { dataIndex: "permission_id", title: "ID Permission", type: "number", columnsGroupPosition: true, textIndex: { 
        1: "Admin",
        0: "Client",
      },  },
      { dataIndex: "title", title: "Title", type: "string" },
      { dataIndex: "description", title: "description", type: "string" },
      { dataIndex: "status", title: "สถานะ", type: "number", key:"permission_id", isStatus: true, isStatusText: true, typeChange: "status",
          filters: [ 
            { text: "เปิด", value: 1 }, 
            { text: "ปิด", value: 0 }, 
          ] 
      },
      { dataIndex: "is_admin", title: "ประเภท", type: "number", key:"permission_id", isStatus: true, isStatusText: true, typeChange: "is_admin",
          filters: [ 
            { text: "Admin", value: 1 }, 
            { text: "Client", value: 0 }, 
          ] 
      },
      { dataIndex: "route_path", title: "route_path", type: "string" },
      { dataIndex: "method", title: "method", type: "string" },
      { dataIndex: "create_date", title: "วันที่สร้าง", type: "date" },
      { dataIndex: "update_date", title: "วันที่แก้ไข", type: "date" },
      { dataIndex: "manage", title: "จัดการ", type: "string", key:"permission_id", isManage: true,  isEdit: true,  isDel: true },
  ], []);

  const mappedData = useMemo(() => {
    return permissions.map((item, idx) => ({
      key: `row-${idx}`,
      permission_id: item.permission_id || "-",
      title: item.title || "-",
      description: item.description || "-",
      status: item.status ?? 1,
      is_admin: item.is_admin ?? 1,
      route_path: item.route_path || "-",
      method: item.method || "-",
      create_date: item.create_date ? datetime(item.create_date) : "-",
      update_date: item.update_date ? datetime(item.update_date) : "-",
    
    }));
  }, [permissions]);

  useEffect(() => {
      fetchData();
  }, []);


  const openModal = () => {
    setModalOpen(true);
  };

  const closeModal = () => {
    setSelectedPermission(null);
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

          const result = await savePermission(values);
          if(!result.ok) throw new Error(result.error || "เกิดข้อผิดพลาดในการบันทึกข้อมูล");

          message.success("บันทึกข้อมูลสำเร็จ");

          setModalOpen(false);
          setSelectedPermission(null);
          fetchData();
        
        } catch (err) {
          message.error(err.message);
          console.error("บันทึกไม่สำเร็จ:", err);
        }

     }
     
   });

  };

  const handleEdit = async (permission_id) => {

    try {

      setSelectedPermission(permission_id)
      setModalOpen(true);
    
    } catch (err) {
      message.error(err.message);
      console.error("บันทึกไม่สำเร็จ:", err);
    }

  };

  const handleDelete = async (permission_id) => {

    confirm({
      title: "ยืนยันการลบข้อมูล",
      content: `คุณต้องการลบข้อมูล ใช่หรือไม่?`,
      okText: "ใช่, ลบ",
      cancelText: "ยกเลิก",
      okType: "primary",
      cancelType: "danger",
      async onOk() {

        try {

          const result = await removePermission({permission_id});
          if(!result.ok) throw new Error(result.error || "เกิดข้อผิดพลาดในการลบข้อมูล");

          message.success("ลบข้อมูลสำเร็จ");
          
          setSelectedPermission(null);
          fetchData();
        
        } catch (err) {
          message.error(err.message);
          console.error("ลบไม่สำเร็จ:", err);
        }
      }
     
    });

  };

  const handleStatusChange = async (permission_id, status, typeChange) => {

    confirm({
      title: "ยืนยันการแก้ไขสถานะ",
      content: `คุณต้องการแก้ไขสาถานะ ใช่หรือไม่?`,
      okText: "ใช่, แก้ไข",
      cancelText: "ยกเลิก",
      okType: "primary",
      cancelType: "danger",
      async onOk() {

        try {

          let result;
          if(typeChange === "status"){
            result = await changeStatusPermission({permission_id, status});
          }else if(typeChange === "is_admin"){
            result = await changeTypePermission({permission_id, status});
          }else{
            throw new Error("ไม่พบประเภทข้อมูลที่จะแก้ไข");
          }
         
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
      handleGroupChange,
      groupOrder,
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
              เพิ่ม Permission
            </Button>

            <Checkbox.Group
              options={groupOptions}
              value={groupOrder}
              onChange={handleGroupChange}
              style={{ padding: 4, borderRadius: 4}}
            />
          
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
            <PermissionModal
              open={modalOpen}
              onClose={closeModal}
              permissionId={selectedPermission}
              onSave={handleSave}
            />
        )}
        
    </>
  );
}
