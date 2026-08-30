"use client";
import React, { useEffect, useState } from "react";
import { Modal, Input, Button, Spin, Form, Switch, message, Select, Typography } from "antd";
import { getOrganization } from "@/actions/admin/organization/actions";
import { listLocation } from "@/actions/admin/location/actions";

const { Text } = Typography;

export default function OrganizationModal({ open, onClose, onSave, organizationId }) {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [locations, setLocations] = useState({ provinces: [], districts: [], subdistricts: [] });
  const [filteredDistricts, setFilteredDistricts] = useState([]);
  const [filteredSubdistricts, setFilteredSubdistricts] = useState([]);
  const [loadingLocations, setLoadingLocations] = useState(false);
  const [zipCode, setZipCode] = useState("");

  // ✅ ดึงข้อมูลจังหวัด/อำเภอ/ตำบล ทั้งหมด
  const fetchLocations = async () => {
    try {
      setLoadingLocations(true);
      const result = await listLocation();
      if (!result.ok) throw new Error(result.error || "ไม่สามารถดึงข้อมูล Locations ได้");
      setLocations(result.data || {});
    } catch (e) {
      message.error(e.message);
      setLocations({ provinces: [], districts: [], subdistricts: [] });
    } finally {
      setLoadingLocations(false);
    }
  };

  // ✅ โหลดข้อมูลสำหรับแก้ไข
  const fetchOrganization = async () => {
    if (!organizationId) return;
    try {
      setLoading(true);
      const result = await getOrganization({ organization_id: organizationId });
      if (!result.ok) throw new Error(result.error || "ไม่สามารถดึงข้อมูลได้");
      const data = result.data?.[0];
      if (!data) return;

      // set ค่า province/district/subdistrict ก่อน
      handleProvinceChange(data.province_id);
      handleDistrictChange(data.district_id);

      const sub = locations.subdistricts.find(s => s.id === data.subdistrict_id);
      setZipCode(sub?.zip_code || "");

      form.setFieldsValue({
        title_th: data.title_th,
        title_en: data.title_en,
        address: data.address,
        province_id: data.province_id,
        district_id: data.district_id,
        subdistrict_id: data.subdistrict_id,
        is_active: Boolean(data.is_active),
        zipcode: sub?.zip_code || "",
      });
    } catch (err) {
      message.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLocations();
  }, []);

  useEffect(() => {
    if (open) {
      form.resetFields();
      setZipCode("");
      if (organizationId && locations.provinces.length) fetchOrganization();
    }
  }, [open, organizationId, locations]);

  const handleProvinceChange = (provinceId) => {
    const districts = locations.districts.filter(d => d.province_id === provinceId);
    setFilteredDistricts(districts);
    setFilteredSubdistricts([]);
    form.setFieldsValue({ district_id: undefined, subdistrict_id: undefined, zipcode: "" });
    setZipCode("");
  };

  const handleDistrictChange = (districtId) => {
    const subdistricts = locations.subdistricts.filter(s => s.district_id === districtId);
    setFilteredSubdistricts(subdistricts);
    form.setFieldsValue({ subdistrict_id: undefined, zipcode: "" });
    setZipCode("");
  };

  const handleSubdistrictChange = (subdistrictId) => {
    const sub = locations.subdistricts.find(s => s.id === subdistrictId);
    form.setFieldsValue({ zipcode: sub?.zip_code || "" });
    setZipCode(sub?.zip_code || "");
  };

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
        zipcode: Number(values.zipcode) || null,
        organization_id: organizationId || null,
      };
      onSave?.(payload);
    } catch (err) {
      message.error("กรุณากรอกข้อมูลให้ครบ");
    }
  };

  return (
    <Modal
      title={organizationId ? "แก้ไขหน่วยงาน" : "เพิ่มหน่วยงาน"}
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
      <Spin spinning={loading || loadingLocations}>
        <Form form={form} layout="vertical">
          <Form.Item name="title_th" label="ชื่อหน่วยงาน (ไทย)" rules={[{ required: true, message: "กรุณากรอกชื่อหน่วยงานภาษาไทย" }]}>
            <Input placeholder="กรอกชื่อหน่วยงาน (ไทย)" />
          </Form.Item>

          <Form.Item name="address" label="ที่อยู่">
            <Input.TextArea rows={2} placeholder="กรอกที่อยู่" />
          </Form.Item>

          {/* จังหวัด / อำเภอ / ตำบล */}
          <Form.Item label="จังหวัด" name="province_id" rules={[{ required: true, message: "กรุณาเลือกจังหวัด" }]}>
            <Select
              placeholder="เลือกจังหวัด"
              options={locations.provinces.map(p => ({ label: p.name_in_thai, value: p.id }))}
              onChange={handleProvinceChange} // จะส่ง provinceId
            />
          </Form.Item>

          <Form.Item label="อำเภอ" name="district_id" rules={[{ required: true, message: "กรุณาเลือกอำเภอ" }]}>
            <Select
              placeholder="เลือกอำเภอ"
              disabled={filteredDistricts.length === 0}
              options={filteredDistricts.map(d => ({ label: d.name_in_thai, value: d.id }))}
              onChange={handleDistrictChange}
            />
          </Form.Item>

          <Form.Item label="ตำบล" name="subdistrict_id" rules={[{ required: true, message: "กรุณาเลือกตำบล" }]}>
            <Select
              placeholder="เลือกตำบล"
              disabled={filteredSubdistricts.length === 0}
              options={filteredSubdistricts.map(s => ({ label: s.name_in_thai, value: s.id }))}
              onChange={handleSubdistrictChange}
            />
          </Form.Item>

          <Form.Item label="รหัสไปรษณีย์" name="zipcode">
            <Input value={zipCode} disabled />
          </Form.Item>

          <Form.Item name="is_active" label="สถานะ" valuePropName="checked" initialValue={true}>
            <Switch checkedChildren="เปิดใช้งาน" unCheckedChildren="ปิด" />
          </Form.Item>
        </Form>
      </Spin>
    </Modal>
  );
}
