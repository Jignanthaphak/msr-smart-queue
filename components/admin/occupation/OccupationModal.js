"use client";
import React, { useEffect, useState } from "react";
import { Modal, Input, Button, Spin, Form, Switch, message, Select, Typography } from "antd";
import { getOccupation } from "@/actions/admin/occupation/actions";

const { Text } = Typography;

export default function OccupationModal({ open, onClose, onSave, occupationId }) {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);

  // ✅ โหลดข้อมูลสำหรับแก้ไข
  const fetchOccupation = async () => {
    if (!occupationId) return;
    try {
      setLoading(true);
      const result = await getOccupation({ occupation_id: occupationId });
      if (!result.ok) throw new Error(result.error || "ไม่สามารถดึงข้อมูลได้");
      const data = result.data?.[0];
      if (!data) return;

      form.setFieldsValue({
        title_th: data.title_th,
        is_active: Boolean(data.is_active),
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
      if (occupationId) fetchOccupation();
    }
  }, [open, occupationId]);


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
        is_active: values.is_active ? 1 : 0,
        occupation_id: occupationId || null,
      };
      onSave?.(payload);
    } catch (err) {
      message.error("กรุณากรอกข้อมูลให้ครบ");
    }
  };

  return (
    <Modal
      title={occupationId ? "แก้ไขอาชีพ" : "เพิ่มอาชีพ"}
      open={open}
      onCancel={onClose}
      width={700}
      footer={[
        <Button key="cancel" onClick={onClose}>ยกเลิก</Button>,
        <Button key="save" type="primary" onClick={handleSave} loading={loading}>บันทึก</Button>,
      ]}
      styles={{
        body: {
          maxHeight: '70vh',
          overflowY: 'auto',
          scrollbarWidth: 'none',
          msOverflowStyle: 'none',
        },
      }}
    >
      <Spin spinning={loading}>
        <Form form={form} layout="vertical">
          <Form.Item name="title_th" label="ชื่ออาชีพ (ไทย)" rules={[{ required: true, message: "กรุณากรอกชื่ออาชีพภาษาไทย" }]}>
            <Input placeholder="กรอกชื่ออาชีพ (ไทย)" />
          </Form.Item>
          <Form.Item name="is_active" label="สถานะ" valuePropName="checked" initialValue={true}>
            <Switch checkedChildren="เปิดใช้งาน" unCheckedChildren="ปิด" />
          </Form.Item>
        </Form>
      </Spin>
    </Modal>
  );
}
