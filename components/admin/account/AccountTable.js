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
import AccountModal from "@/components/admin/account/AccountModal";
import { generateColumns } from "@/lib/utils/generateColumns";
import useTable from "@/hooks/useTable";
import { listAccount, saveAccount, removeAccount, changeStatusAccount, changeIsAdminAccount } from "@/actions/admin/account/actions";
import { datetime } from "@/lib/utils/dateFormat";

const { Search } = Input;
const { confirm } = Modal;

export default function AccountTable() {

  const [accounts, setAccounts] = useState([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedAccount, setSelectedAccount] = useState(null);

  const fetchData = async () => {
      try {

        const result = await listAccount();
        if(!result.ok) throw new Error(result.error || "เกิดข้อผิดพลาดในการดึงข้อมูล");
       
        setAccounts(result?.data || []);
      } catch (e) {
        message.error(e.message);
        console.error("fetch error", e);
        setAccounts([]);
      }

  };

  const fields = useMemo(() => [
      { dataIndex: "user_id", title: "ID Account", type: "number", },
      { dataIndex: "username", title: "Username", type: "string" },
      { dataIndex: "nickname", title: "Nickname", type: "string" },
      { dataIndex: "role_name", title: "Role", type: "string" },
      { dataIndex: "status", title: "สถานะ", type: "number", key:"user_id", isStatus: true, isStatusText: true, typeChange: "status",
          filters: [ 
            { text: "เปิด", value: 1 }, 
            { text: "ปิด", value: 0 }, 
          ] 
      },
      { dataIndex: "is_admin_panel", title: "สิทธิ์จัดการ Admin", type: "number", key:"user_id", isStatus: true, isStatusText: true, typeChange: "isAdmin",
          filters: [ 
            { text: "เปิดสิทธิ์ Admin", value: 1 }, 
            { text: "ปิดสิทธิ์ Admin", value: 0 }, 
          ] 
      },
      { dataIndex: "create_date", title: "วันที่สร้าง", type: "date" },
      { dataIndex: "update_date", title: "วันที่แก้ไข", type: "date" },
      { dataIndex: "manage", title: "จัดการ", type: "string", key:"user_id", isManage: true,  isEdit: true,  isDel: true },
  ], []);

  const mappedData = useMemo(() => {
    return accounts.map((item, idx) => ({
      key: `row-${idx}`,
      user_id: item.user_id || "-",
      username: item.username || "-",
      nickname: item.nickname || "-",
      role_name: item?.role?.role_name || "-",
      is_admin_panel: item.is_admin_panel ?? 0,
      status: item.status ?? 1,
      create_date: item.create_date ? datetime(item.create_date) : "-",
      update_date: item.update_date ? datetime(item.update_date) : "-",
    
    }));
  }, [accounts]);

  useEffect(() => {
      fetchData();
  }, []);


  const openModal = () => {
    setModalOpen(true);
  };

  const closeModal = () => {
    setSelectedAccount(null);
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

          const result = await saveAccount(values);
          if(!result.ok) throw new Error(result.error || "เกิดข้อผิดพลาดในการบันทึกข้อมูล");

          message.success("บันทึกข้อมูลสำเร็จ");

          setModalOpen(false);
          setSelectedAccount(null);
          fetchData();
        
        } catch (err) {
          message.error(err.message);
          console.error("บันทึกไม่สำเร็จ:", err);
        }

     }
     
   });

  };

  const handleEdit = async (user_id) => {

    try {

      setSelectedAccount(user_id)
      setModalOpen(true);
    
    } catch (err) {
      message.error(err.message);
      console.error("บันทึกไม่สำเร็จ:", err);
    }

  };

  const handleDelete = async (user_id) => {

    confirm({
      title: "ยืนยันการลบข้อมูล",
      content: `คุณต้องการลบข้อมูล ใช่หรือไม่?`,
      okText: "ใช่, ลบ",
      cancelText: "ยกเลิก",
      okType: "primary",
      cancelType: "danger",
      async onOk() {

        try {

          const result = await removeAccount({user_id});
          if(!result.ok) throw new Error(result.error || "เกิดข้อผิดพลาดในการลบข้อมูล");

          message.success("ลบข้อมูลสำเร็จ");
          
          setSelectedAccount(null);
          fetchData();
        
        } catch (err) {
          message.error(err.message);
          console.error("ลบไม่สำเร็จ:", err);
        }
      }
     
    });

  };

  const handleStatusChange = async (user_id, status, typeChange) => {

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
          if(typeChange === "isAdmin"){
            result = await changeIsAdminAccount({user_id, status});
          }else{
            result = await changeStatusAccount({user_id, status});
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
              เพิ่ม Account
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
            <AccountModal
              open={modalOpen}
              onClose={closeModal}
              accountId={selectedAccount}
              onSave={handleSave}
            />
        )}
        
    </>
  );
}
