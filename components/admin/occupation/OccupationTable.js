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
import OccupationModal from "@/components/admin/occupation/OccupationModal";
import { generateColumns } from "@/lib/utils/generateColumns";
import useTable from "@/hooks/useTable";
import { listOccupation, saveOccupation, removeOccupation, changeStatusOccupation } from "@/actions/admin/occupation/actions";
import { datetime } from "@/lib/utils/dateFormat";

const { Search } = Input;
const { confirm } = Modal;

export default function OccupationTable() {

  const [occupations, setOccupations] = useState([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedOccupation, setSelectedOccupation] = useState(null);

  const fetchData = async () => {
      try {

        const result = await listOccupation();
        if(!result.ok) throw new Error(result.error || "เกิดข้อผิดพลาดในการดึงข้อมูล");
       
        setOccupations(result?.data || []);
      } catch (e) {
        message.error(e.message);
        console.error("fetch error", e);
        setOccupations([]);
      }

  };

  const fields = useMemo(() => [
      { dataIndex: "occupation_id", title: "ID อาชีพ", type: "number", },
      { dataIndex: "title_th", title: "ชื่อภาษาไทย", type: "string" },
      { dataIndex: "is_active", title: "สถานะ", type: "number", key:"occupation_id", isStatus: true, isStatusText: true,
          filters: [ 
            { text: "เปิด", value: 1 }, 
            { text: "ปิด", value: 0 }, 
          ] 
      },
      { dataIndex: "create_date", title: "วันที่สร้าง", type: "date" },
      { dataIndex: "update_date", title: "วันที่แก้ไข", type: "date" },
      { dataIndex: "manage", title: "จัดการ", type: "string", key:"occupation_id", isManage: true,  isEdit: true,  isDel: true },
  ], []);

  const mappedData = useMemo(() => {
    return occupations.map((item, idx) => ({
      key: `row-${idx}`,
      occupation_id: item.occupation_id || "-",
      title_th: item.title_th || "-",
      is_active: item.is_active ?? 1,
      create_date: item.create_date ? datetime(item.create_date) : "-",
      update_date: item.update_date ? datetime(item.update_date) : "-",
    
    }));
  }, [occupations]);

  useEffect(() => {
      fetchData();
  }, []);


  const openModal = () => {
    setModalOpen(true);
  };

  const closeModal = () => {
    setSelectedOccupation(null);
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

          const result = await saveOccupation(values);
          if(!result.ok) throw new Error(result.error || "เกิดข้อผิดพลาดในการบันทึกข้อมูล");

          message.success("บันทึกข้อมูลสำเร็จ");

          setModalOpen(false);
          setSelectedOccupation(null);
          fetchData();
        
        } catch (err) {
          message.error(err.message);
          console.error("บันทึกไม่สำเร็จ:", err);
        }

     }
     
   });

  };

  const handleEdit = async (occupation_id) => {

    try {

      setSelectedOccupation(occupation_id)
      setModalOpen(true);
    
    } catch (err) {
      message.error(err.message);
      console.error("บันทึกไม่สำเร็จ:", err);
    }

  };

  const handleDelete = async (occupation_id) => {

    confirm({
      title: "ยืนยันการลบข้อมูล",
      content: `คุณต้องการลบข้อมูล ใช่หรือไม่?`,
      okText: "ใช่, ลบ",
      cancelText: "ยกเลิก",
      okType: "primary",
      cancelType: "danger",
      async onOk() {

        try {

          const result = await removeOccupation({occupation_id});
          if(!result.ok) throw new Error(result.error || "เกิดข้อผิดพลาดในการลบข้อมูล");

          message.success("ลบข้อมูลสำเร็จ");
          
          setSelectedOccupation(null);
          fetchData();
        
        } catch (err) {
          message.error(err.message);
          console.error("ลบไม่สำเร็จ:", err);
        }
      }
     
    });

  };

  const handleStatusChange = async (occupation_id, status, typeChange) => {

    confirm({
      title: "ยืนยันการแก้ไขสถานะ",
      content: `คุณต้องการแก้ไขสาถานะ ใช่หรือไม่?`,
      okText: "ใช่, แก้ไข",
      cancelText: "ยกเลิก",
      okType: "primary",
      cancelType: "danger",
      async onOk() {

        try {

          const  result = await changeStatusOccupation({occupation_id, status});
         
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
              เพิ่ม อาชีพ
            </Button>
          
          </Space>
          
        </Col>
        
      
        <Col>
          <Space className='!flex !flex-wrap '>
          
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
            <OccupationModal
              open={modalOpen}
              onClose={closeModal}
              occupationId={selectedOccupation}
              onSave={handleSave}
            />
        )}
        
    </>
  );
}
