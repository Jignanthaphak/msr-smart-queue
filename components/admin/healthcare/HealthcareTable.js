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
import HealthcareModal from "@/components/admin/healthcare/HealthcareModal";
import { generateColumns } from "@/lib/utils/generateColumns";
import useTable from "@/hooks/useTable";
import { listHealthcare, saveHealthcare, removeHealthcare, changeStatusHealthcare } from "@/actions/admin/healthcare/actions";
import { datetime } from "@/lib/utils/dateFormat";

const { Search } = Input;
const { confirm } = Modal;

export default function HealthcareTable() {

  const [healthcares, setHealthcares] = useState([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedHealthcare, setSelectedHealthcare] = useState(null);

  const fetchData = async () => {
      try {

        const result = await listHealthcare();
        if(!result.ok) throw new Error(result.error || "เกิดข้อผิดพลาดในการดึงข้อมูล");
       
        setHealthcares(result?.data || []);
      } catch (e) {
        message.error(e.message);
        console.error("fetch error", e);
        setHealthcares([]);
      }

  };

  const fields = useMemo(() => [
      { dataIndex: "healthcare_right_id", title: "ID สิทธิการรักษาพยาบาล", type: "number", },
      { dataIndex: "title_th", title: "ชื่อภาษาไทย", type: "string" },
      { dataIndex: "is_active", title: "สถานะ", type: "number", key:"healthcare_right_id", isStatus: true, isStatusText: true,
          filters: [ 
            { text: "เปิด", value: 1 }, 
            { text: "ปิด", value: 0 }, 
          ] 
      },
      { dataIndex: "create_date", title: "วันที่สร้าง", type: "date" },
      { dataIndex: "update_date", title: "วันที่แก้ไข", type: "date" },
      { dataIndex: "manage", title: "จัดการ", type: "string", key:"healthcare_right_id", isManage: true,  isEdit: true,  isDel: true },
  ], []);

  const mappedData = useMemo(() => {
    return healthcares.map((item, idx) => ({
      key: `row-${idx}`,
      healthcare_right_id: item.healthcare_right_id || "-",
      title_th: item.title_th || "-",
      is_active: item.is_active ?? 1,
      create_date: item.create_date ? datetime(item.create_date) : "-",
      update_date: item.update_date ? datetime(item.update_date) : "-",
    
    }));
  }, [healthcares]);

  useEffect(() => {
      fetchData();
  }, []);


  const openModal = () => {
    setModalOpen(true);
  };

  const closeModal = () => {
    setSelectedHealthcare(null);
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

          const result = await saveHealthcare(values);
          if(!result.ok) throw new Error(result.error || "เกิดข้อผิดพลาดในการบันทึกข้อมูล");

          message.success("บันทึกข้อมูลสำเร็จ");

          setModalOpen(false);
          setSelectedHealthcare(null);
          fetchData();
        
        } catch (err) {
          message.error(err.message);
          console.error("บันทึกไม่สำเร็จ:", err);
        }

     }
     
   });

  };

  const handleEdit = async (healthcare_right_id) => {

    try {

      setSelectedHealthcare(healthcare_right_id)
      setModalOpen(true);
    
    } catch (err) {
      message.error(err.message);
      console.error("บันทึกไม่สำเร็จ:", err);
    }

  };

  const handleDelete = async (healthcare_right_id) => {

    confirm({
      title: "ยืนยันการลบข้อมูล",
      content: `คุณต้องการลบข้อมูล ใช่หรือไม่?`,
      okText: "ใช่, ลบ",
      cancelText: "ยกเลิก",
      okType: "primary",
      cancelType: "danger",
      async onOk() {

        try {

          const result = await removeHealthcare({healthcare_right_id});
          if(!result.ok) throw new Error(result.error || "เกิดข้อผิดพลาดในการลบข้อมูล");

          message.success("ลบข้อมูลสำเร็จ");
          
          setSelectedHealthcare(null);
          fetchData();
        
        } catch (err) {
          message.error(err.message);
          console.error("ลบไม่สำเร็จ:", err);
        }
      }
     
    });

  };

  const handleStatusChange = async (healthcare_right_id, status, typeChange) => {

    confirm({
      title: "ยืนยันการแก้ไขสถานะ",
      content: `คุณต้องการแก้ไขสาถานะ ใช่หรือไม่?`,
      okText: "ใช่, แก้ไข",
      cancelText: "ยกเลิก",
      okType: "primary",
      cancelType: "danger",
      async onOk() {

        try {

          const  result = await changeStatusHealthcare({healthcare_right_id, status});
         
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
              เพิ่ม สิทธิการรักษาพยาบาล
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
            <HealthcareModal
              open={modalOpen}
              onClose={closeModal}
              healthcareId={selectedHealthcare}
              onSave={handleSave}
            />
        )}
        
    </>
  );
}
