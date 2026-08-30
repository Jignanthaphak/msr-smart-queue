"use client";
import React, { useEffect, useState } from "react";
import { Modal, Input, Button, Spin, Form, Switch, message, Select, Typography } from "antd";
import { getAccount } from "@/actions/admin/account/actions";
import { listRoles } from "@/actions/admin/role/actions";

const { Text } = Typography;

export default function AccountModal({ open, onClose, onSave, accountId }) {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [roles, setRoles] = useState([]);
  const [loadingRoles, setLoadingRoles] = useState(true);
  const [isEdit, setIsEdit] = useState(false);

  const fetchAccount = async () => {
    if (!accountId) return;
    try {
      setLoading(true);

      const result = await getAccount({ user_id: accountId });
      if (!result.ok) throw new Error(result.error || "ไม่สามารถดึงข้อมูลสิทธิ์ได้");
      const data = result.data?.[0];
      if (!data) return;

      form.setFieldsValue({
        nickname: data.nickname,
        username: data.username,
        role_id: data.role_id,
        status: Boolean(data.status),
        
      });
    } catch (err) {
      message.error(err.message);
    } finally {
      setLoading(false);
    }
  };
  
  const fetchRoles = async () => {
    try {
      setLoadingRoles(true);
      const result = await listRoles();
      if (!result.ok) throw new Error(result.error || "ไม่สามารถดึงข้อมูล role ได้");
      setRoles(result.data || []);
    } catch (e) {
      message.error(e.message);
      setRoles([]);
    } finally {
      setLoadingRoles(false);
    }
  };

  useEffect(() => {
    fetchRoles();
  }, []);

  useEffect(() => {
    if (open) {
      form.resetFields();
      const editMode = Boolean(accountId);
      setIsEdit(editMode);
      if (editMode) fetchAccount();
    }
  }, [open, accountId]);

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
        user_id: accountId || null,
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
      title={accountId ? "แก้ไข Account" : "เพิ่ม Account"}
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
      <Spin spinning={loading || loadingRoles}>
        <Form form={form} layout="vertical">
          <Form.Item
            name="nickname"
            label="ชื่อเล่น (Nickname)"
            rules={[{ required: true, message: "กรุณากรอกชื่อเล่น" }]}
          >
            <Input placeholder="กรอกชื่อเล่น" />
          </Form.Item>

          <Form.Item
            name="username"
            label="ชื่อผู้ใช้ (Username)"
            rules={[
              { required: true, message: "กรุณากรอกชื่อผู้ใช้" },
              { min: 5, message: "ชื่อผู้ใช้ต้องมีอย่างน้อย 5 ตัวอักษร" },
            ]}
          >
            <Input placeholder="กรอกชื่อผู้ใช้" />
          </Form.Item>

          <Form.Item
            name="password"
            label="รหัสผ่าน (Password)"
            rules={
              isEdit
                ? [{ min: 6, message: "รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร" }]
                : [
                    { required: true, message: "กรุณากรอกรหัสผ่าน" },
                    { min: 6, message: "รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร" },
                  ]
            }
          >
            <Input.Password placeholder={isEdit ? "เว้นว่างหากไม่ต้องการเปลี่ยนรหัสผ่าน" : "กรอกรหัสผ่าน"} />
          </Form.Item>
           {isEdit && (
            <Text type="secondary" style={{ marginTop: -10, display: "block", marginBottom: 16 }}>
              💡 หากไม่ต้องการเปลี่ยนรหัสผ่าน ให้เว้นว่างไว้
            </Text>
          )}

          <Form.Item
            name="role_id"
            label="สิทธิ์การใช้งาน (Role)"
            rules={[{ required: true, message: "กรุณาเลือก Role" }]}
          >
            <Select
              placeholder="เลือก Role"
              loading={loadingRoles}
              options={roles.map((r) => ({
                label: r.role_name,
                value: r.role_id,
              }))}
            />
          </Form.Item>

          <Form.Item
            name="status"
            label="สถานะ (Status)"
            valuePropName="checked"
            initialValue={true}
          >
            <Switch checkedChildren="เปิดใช้งาน" unCheckedChildren="ปิด" />
          </Form.Item>
      
        </Form>
      </Spin>
    </Modal>
  );
}
