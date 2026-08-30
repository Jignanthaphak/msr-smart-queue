"use client";
import React, { useEffect, useState } from "react";
import { Modal, Input, Button, Spin, Form, Table, message } from "antd";
import { listPermission } from "@/actions/admin/permission/actions";
import { getRole } from "@/actions/admin/role/actions";

export default function RoleModal({ open, onClose, onSave, roleId }) {
  const [form] = Form.useForm();
  const [permissions, setPermissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedAdmin, setSelectedAdmin] = useState([]);
  const [selectedFrontend, setSelectedFrontend] = useState([]);

  const fetchRoleData = async () => {

    if (!roleId) return;

    try {

      const result = await getRole({ role_id: roleId });
      if (!result.ok) throw new Error(result.error || "เกิดข้อผิดพลาดในการดึงข้อมูล");

      const role = result.data?.[0];
      if (!role) return;

      console.log(role)

      const rolePermissionIds = role.permissions
      .filter(p => p.can_access === 1)
      .map(p => p.permission_id);

      const adminPermissionIds = role.permissions
      .filter(p => p.permission.is_admin === 1 && rolePermissionIds.includes(p.permission_id))
      .map(p => p.permission_id);


      const frontendPermissionIds = role.permissions
      .filter(p => !p.permission.is_admin && rolePermissionIds.includes(p.permission_id))
      .map(p => p.permission_id);

      form.setFieldsValue({
        role_name: role.role_name || "",
        permissions_admin: adminPermissionIds,
        permissions_frontend: frontendPermissionIds,
      });

      setSelectedAdmin(adminPermissionIds);
      setSelectedFrontend(frontendPermissionIds);
     
    } catch (e) {
      message.error(e.message);
    }

  };

  const fetchPermissions = async () => {
    try {
      const result = await listPermission();
      if (!result.ok) throw new Error(result.error || "เกิดข้อผิดพลาดในการดึงข้อมูล");
      setPermissions(result?.data || []);
    } catch (e) {
      message.error(e.message);
      setPermissions([]);
    }
  };

  useEffect(() => {

    if (!open) return;

    const loadData = async () => {

      try {

        setLoading(true);

        await fetchPermissions();

        if (roleId) await fetchRoleData();

      } catch (err) {

        console.error(err);

      } finally {

        setLoading(false);

      }

    };

    loadData();

  }, [open, roleId]);

  const handleSave = async () => {

    try {
     
      let values;

      try {
        values = await form.validateFields();
      } catch (err) {
        return;
      }

      setLoading(true);
     
      onSave?.({ ...values, role_id: roleId });
    
    } catch (err) {

      message.error(err.message);

    } finally {
      setTimeout(() => setLoading(false), 1000);
    }

  };

  const backendPermissions = permissions.filter((p) => p.is_admin);
  const frontendPermissions = permissions.filter((p) => !p.is_admin);

  useEffect(() => {
    form.setFieldsValue({
      permissions_admin: selectedAdmin,
      permissions_frontend: selectedFrontend,
    });
 
  }, [selectedAdmin, selectedFrontend]);

  const columns = [
    { title: "ชื่อสิทธิ์", dataIndex: "title" },
    { title: "คำอธิบาย", dataIndex: "description" },
    { title: "Route Path", dataIndex: "route_path" },
    { title: "Method", dataIndex: "method" },
  ];

  return (
    <Modal
      title={roleId ? "แก้ไข Role" : "สร้าง Role"}
      open={open}
      onCancel={onClose}
      width={900}
      styles={{
        body: {
          maxHeight: '70vh',
          overflowY: 'auto',
          scrollbarWidth: 'none',
          msOverflowStyle: 'none',
        },
      }}
      footer={[
        <Button key="cancel" onClick={onClose}>ยกเลิก</Button>,
        <Button key="save" type="primary" onClick={handleSave} loading={loading}>บันทึก</Button>
      ]}
    >
      <Form form={form} layout="vertical" initialValues={{ permissions_admin: [], permissions_frontend: [] }}>
        <Form.Item
          name="role_name"
          label="ชื่อ Role"
          rules={[{ required: true, message: "กรอกชื่อ Role!!" }]}
        >
          <Input placeholder="กรอกชื่อ Role..." disabled={loading} />
        </Form.Item>

        <Form.Item name="permissions_admin" hidden>
          <input />
        </Form.Item>
        <Form.Item name="permissions_frontend" hidden>
          <input />
        </Form.Item>

        <div style={{ marginBottom: 16 }}>
          <strong>สิทธิ์แอดมิน</strong>
          <Table
            rowKey="permission_id"
            columns={columns}
            dataSource={backendPermissions}
              pagination={{ pageSize: 10 }}
            size="small"
            rowSelection={{
              selectedRowKeys: selectedAdmin,
              onChange: (keys) => {
                setSelectedAdmin(keys);
                form.setFieldsValue({ permissions_admin: keys });
              },
              selections: [Table.SELECTION_ALL, Table.SELECTION_INVERT, Table.SELECTION_NONE],
            }}
          />
        </div>

        <div>
          <strong>สิทธิ์หน้าบ้าน</strong>
          <Table
            rowKey="permission_id"
            columns={columns}
            dataSource={frontendPermissions}
            pagination={{ pageSize: 10 }}
            size="small"
            rowSelection={{
              selectedRowKeys: selectedFrontend,
              onChange: (keys) => {
                setSelectedFrontend(keys);
                form.setFieldsValue({ permissions_frontend: keys });
              },
              selections: [Table.SELECTION_ALL, Table.SELECTION_INVERT, Table.SELECTION_NONE],
            }}
          />
        </div>
      </Form>
    </Modal>
  );
}
