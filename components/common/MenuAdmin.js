"use client"
import React, { useMemo } from "react";
import '@ant-design/v5-patch-for-react-19';
import { Menu } from "antd";
import { useRouter, usePathname } from "next/navigation"; // Next.js 13+
import {
  DesktopOutlined,
  FileOutlined,
  PieChartOutlined,
  TeamOutlined,
  UserOutlined,
} from "@ant-design/icons";

const getItem = (label, key, icon, children) => ({
  key,
  icon,
  children,
  label,
});

// สร้าง mapping ระหว่าง key กับ path
const items = [
  getItem("ข้อมูลผู้ใช้งาน", "/admin/account", <UserOutlined />),
  getItem("การจัดการสิทธิ์", "", <UserOutlined />, [
    getItem("จัดการกลุ่มหน้าที่", "/admin/role"),
    getItem("จัดการสิทธิ์", "/admin/permission"),
  ]),
  getItem("การจัดการข้อมูลเบื้องต้น", "/admin/datadefalut", <UserOutlined />),
  getItem("ข้อมูลผู้รับบริการ", "/admin/person", <UserOutlined />),
  getItem("ข้อมูลการตรวจ", "/admin/screening", <UserOutlined />),
  getItem("ข้อมูลการเข้าสู่ระบบ/ออกจากระบบ", "/admin/authlog", <UserOutlined />),
  getItem("สถิติการใช้ AI", "/admin/ai-dashboard", <PieChartOutlined />),
  getItem("กลับสู่หน้าหลัก", "/", <UserOutlined />),
];

export default function MenuAdmin() {
  const router = useRouter();
  const pathname = usePathname(); // path ปัจจุบัน

  // หา key ของ Menu ที่ตรงกับ path ปัจจุบัน
  const selectedKey = useMemo(() => {
    const findKey = (items, path) => {
      for (let item of items) {
        if (item.key === path) return item.key;
        if (item.children) {
          const childKey = findKey(item.children, path);
          if (childKey) return childKey;
        }
      }
      return null;
    };
    return findKey(items, pathname);
  }, [pathname]);

  const handleClick = (e) => {
    router.push(e.key); // key ของ Menu = path
  };

  return (
    <>
      <div className="demo-logo-vertical m-4 h-[32px] text-white rounded-md bg-[rgba(255,255,255,.2)] flex justify-center items-center font-bold">
        Admin Panel
      </div>
      <Menu
        theme="dark"
        mode="inline"
        items={items}
        selectedKeys={selectedKey ? [selectedKey] : []}
        onClick={handleClick}
      />
    </>
  );
}
