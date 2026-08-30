"use client";
import React, { useEffect, useState } from "react";
import { Modal, Input, Button, Spin, Form, Switch, message, Select } from "antd";
import { getPermission } from "@/actions/admin/permission/actions";

export default function PermissionModal({ open, onClose, onSave, permissionId }) {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);

  const fetchPermission = async () => {
    if (!permissionId) return;
    try {
      setLoading(true);

      const result = await getPermission({ permission_id: permissionId });
      if (!result.ok) throw new Error(result.error || "ไม่สามารถดึงข้อมูลสิทธิ์ได้");
      const data = result.data?.[0];
      if (!data) return;

      form.setFieldsValue({
        title: data.title,
        description: data.description,
        route_path: data.route_path,
        method: data.method,
        status: Boolean(data.status),
        is_admin: Boolean(data.is_admin),
      });
    } catch (err) {
      message.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (open) {
      form.resetFields();
      if (permissionId) fetchPermission();
    }
  }, [open, permissionId]);

  const handleSave = async () => {

    try {

      let values;
      try {
        values = await form.validateFields();
      } catch (err) {
        return;
      }
      
      const payload = {
        ...values,
        status: values.status ? 1 : 0,
        is_admin: values.is_admin ? 1 : 0,
        permission_id: permissionId || null,
      };

      setLoading(true);

      onSave?.(payload);
  
    } catch (err) {
      message.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      title={permissionId ? "แก้ไข Permission" : "เพิ่ม Permission"}
      open={open}
      onCancel={onClose}
      width={600}
      footer={[
        <Button key="cancel" onClick={onClose}>
          ยกเลิก
        </Button>,
        <Button key="save" type="primary" onClick={handleSave} loading={loading}>
          บันทึก
        </Button>,
      ]}
    >
      <Spin spinning={loading}>
        <Form form={form} layout="vertical">
          <Form.Item
            name="title"
            label="ชื่อสิทธิ์ (Title)"
            rules={[{ required: true, message: "กรุณากรอกชื่อสิทธิ์" }]}
          >
            <Input placeholder="กรอกชื่อสิทธิ์ เช่น เพิ่มผู้ใช้, แก้ไขข้อมูล" />
          </Form.Item>

          <Form.Item name="description" label="คำอธิบาย (Description)">
            <Input.TextArea rows={3} placeholder="คำอธิบายสิทธิ์นี้ เช่น สามารถเพิ่มข้อมูลผู้ใช้ได้" />
          </Form.Item>

          <Form.Item
            name="route_path"
            label="Route Path"
            rules={[{ required: true, message: "กรุณากรอก route path เช่น /api/user/create" }]}
          >
            <Input placeholder="/api/user/create" />
          </Form.Item>

          <Form.Item name="method" label="HTTP Method" rules={[{ required: true, message: "กรุณาเลือก Method" }]}>
            <Select
              options={[
                { value: "GET", label: "GET" },
                { value: "POST", label: "POST" },
                { value: "PUT", label: "PUT" },
                { value: "DELETE", label: "DELETE" },
              ]}
              placeholder="เลือก Method"
            />
          </Form.Item>

          <Form.Item
            name="status"
            label="สถานะ (Status)"
            valuePropName="checked"
          >
            <Switch checkedChildren="เปิดใช้งาน" unCheckedChildren="ปิด" />
          </Form.Item>

          <Form.Item
            name="is_admin"
            label="ประเภทสิทธิ์ (Admin / Client)"
            valuePropName="checked"
          >
            <Switch checkedChildren="Admin" unCheckedChildren="Client" />
          </Form.Item>
        </Form>
      </Spin>
    </Modal>
  );
}
