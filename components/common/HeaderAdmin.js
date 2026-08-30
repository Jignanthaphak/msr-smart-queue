"use client"
import React from "react";
import '@ant-design/v5-patch-for-react-19';
import { Button, Avatar, Dropdown, message } from "antd";
import { MenuUnfoldOutlined, MenuFoldOutlined, UserOutlined, LogoutOutlined } from "@ant-design/icons";
import { useRouter } from "next/navigation";
import {logoutUser} from '@/services/auth';
import useAuthStore from "@/stores/useAuthStore";

export default function HeaderAdmin({ collapsed, setCollapsed }) {

  const setStoreLogout = useAuthStore((state) => state.setStoreLogout);
  const router = useRouter();

  async function handleLogout() {
      try {
        
          await logoutUser();
          await setStoreLogout()
          router.push("/login");
      } catch (error) {
          console.error("Logout failed:", error.message);
      }
  }
  const items = [
    {
      key: "logout",
      label: "ออกจากระบบ",
      icon: <LogoutOutlined />,
      danger: true,
      onClick: handleLogout, // ใส่ handleLogout ตรงนี้
    },
  ];

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "0 16px",
        height: 64,
        background: "#fff",
        borderBottom: "1px solid #f0f0f0",
      }}
    >
      {/* ปุ่ม Toggle */}
      <Button
        type="text"
        icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
        onClick={() => setCollapsed(!collapsed)}
        style={{ fontSize: "16px", width: 64, height: 64 }}
      />

      {/* Avatar + Dropdown */}
      <Dropdown menu={{ items }} placement="bottomRight" arrow>
        <Avatar
          style={{ backgroundColor: "#87d068", cursor: "pointer" }}
          icon={<UserOutlined />}
        />
      </Dropdown>
    </div>
  );
}
