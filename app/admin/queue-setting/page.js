// app/admin/queue-setting/page.js
"use client";
import React, { useState, useEffect } from "react";
import { Card, Radio, Select, Button, message, InputNumber, Divider, Switch, Tooltip } from "antd";
import { getQueueConfig, saveQueueConfig } from "@/services/queue";
import { Volume2, Clock, DoorOpen, Users, Save, ExternalLink } from "lucide-react";
import Link from "next/link";

export default function QueueSettingPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [staffList, setStaffList] = useState([]);
  const [config, setConfig] = useState({
    active_rooms: 3,
    delay_seconds: 30,
    sound_enabled: 1,
    room_assignments: [],
  });

  useEffect(() => {
    fetchConfig();
  }, []);

  const fetchConfig = async () => {
    setLoading(true);
    try {
      const res = await getQueueConfig();
      if (res && res.success) {
        setStaffList(res.staffList || []);
        const loadedConfig = res.config || {};
        const activeRooms = loadedConfig.active_rooms || 3;

        // Ensure room_assignments array matches activeRooms count
        let assignments = loadedConfig.room_assignments || [];
        if (!Array.isArray(assignments)) assignments = [];

        const normalizedAssignments = [];
        for (let i = 1; i <= activeRooms; i++) {
          const existing = assignments.find((a) => Number(a.room_no) === i);
          normalizedAssignments.push({
            room_no: i,
            room_name: existing?.room_name || `ห้องคอนเซาท์ ${i}`,
            user_id: existing?.user_id || null,
            nickname: existing?.nickname || "",
          });
        }

        setConfig({
          active_rooms: activeRooms,
          delay_seconds: loadedConfig.delay_seconds || 30,
          sound_enabled: loadedConfig.sound_enabled ?? 1,
          room_assignments: normalizedAssignments,
        });
      }
    } catch (err) {
      console.error("fetchConfig error:", err);
      message.error("โหลดข้อมูลการตั้งค่าคิวไม่สำเร็จ");
    } finally {
      setLoading(false);
    }
  };

  const handleActiveRoomsChange = (count) => {
    const num = Math.min(Math.max(Number(count) || 1, 1), 10);
    const updated = [];
    for (let i = 1; i <= num; i++) {
      const existing = config.room_assignments.find((a) => Number(a.room_no) === i);
      updated.push({
        room_no: i,
        room_name: existing?.room_name || `ห้องคอนเซาท์ ${i}`,
        user_id: existing?.user_id || null,
        nickname: existing?.nickname || "",
      });
    }
    setConfig((prev) => ({
      ...prev,
      active_rooms: num,
      room_assignments: updated,
    }));
  };

  const handleStaffAssign = (roomNo, userId) => {
    const selectedStaff = staffList.find((s) => Number(s.user_id) === Number(userId));
    const updated = config.room_assignments.map((room) => {
      if (Number(room.room_no) === Number(roomNo)) {
        return {
          ...room,
          user_id: userId || null,
          nickname: selectedStaff ? selectedStaff.nickname : "",
        };
      }
      return room;
    });
    setConfig((prev) => ({ ...prev, room_assignments: updated }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await saveQueueConfig(config);
      if (res && res.success) {
        message.success("บันทึกการตั้งค่าระบบคิวออกหน่วยเรียบร้อยแล้ว");
      }
    } catch (err) {
      console.error("Save config error:", err);
      message.error("บันทึกการตั้งค่าไม่สำเร็จ: " + (err.message || ""));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header card */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b">
        <div>
          <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            ⚙️ จัดการระบบคิวออกหน่วย (Smart Queue Setting)
          </h2>
          <p className="text-sm text-gray-500">
            ตั้งค่าจำนวนห้องตรวจ เจ้าหน้าที่ประจำห้อง และระยะเวลาดีเลย์เรียกคิวสำหรับการออกหน่วยบริการ
          </p>
        </div>
        <Link
          href="/queue-display"
          target="_blank"
          className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-sm font-semibold shadow transition-colors"
        >
          <ExternalLink className="w-4 h-4" />
          เปิดหน้าจอแสดงผลคิว (TV Display)
        </Link>
      </div>

      {/* 1. Delay setting */}
      <Card
        title={
          <span className="flex items-center gap-2 font-bold text-base">
            <Clock className="w-5 h-5 text-amber-600" />
            1. ตั้งเวลาดีเลย์เรียกคิวถัดไปอัตโนมัติ (เมื่อส่งตรวจเสร็จสิ้น)
          </span>
        }
        className="shadow-sm rounded-xl"
      >
        <p className="text-xs text-gray-500 mb-4">
          เมื่อเจ้าหน้าที่ตรวจคนไข้เสร็จ ระบบจะหน่วงเวลาตามที่เลือก เพื่อให้นักจิตมีเวลาจิบน้ำ สรุปเคส หรือกดขอพักก่อนที่ระบบจะเรียกคนไข้ถัดไปอัตโนมัติ
        </p>

        <Radio.Group
          value={config.delay_seconds}
          onChange={(e) => setConfig((prev) => ({ ...prev, delay_seconds: e.target.value }))}
          buttonStyle="solid"
          size="large"
          className="flex flex-wrap gap-2"
        >
          {[10, 20, 30, 40, 50, 60].map((sec) => (
            <Radio.Button key={sec} value={sec} className="font-semibold">
              {sec} วินาที {sec === 30 && "(แนะนำ)"}
            </Radio.Button>
          ))}
        </Radio.Group>
      </Card>

      {/* 2. Room & Staff Assignment */}
      <Card
        title={
          <span className="flex items-center gap-2 font-bold text-base">
            <DoorOpen className="w-5 h-5 text-primary" />
            2. กำหนดจำนวนห้องและเจ้าหน้าที่ประจำห้อง (วันนี้ออกหน่วยกี่คน)
          </span>
        }
        className="shadow-sm rounded-xl"
      >
        <div className="flex items-center gap-4 mb-6">
          <span className="font-semibold text-gray-700">จำนวนห้องที่เปิดให้บริการ:</span>
          <InputNumber
            min={1}
            max={10}
            value={config.active_rooms}
            onChange={handleActiveRoomsChange}
            size="large"
            className="w-28 font-bold"
          />
          <span className="text-xs text-gray-500">(เลือกได้ 1 - 10 ห้อง)</span>
        </div>

        <Divider orientation="left" plain>
          รายชื่อเจ้าหน้าที่ประจำแต่ละห้อง
        </Divider>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {config.room_assignments.map((room) => (
            <div
              key={room.room_no}
              className="p-4 rounded-xl border border-gray-200 bg-gray-50/60 flex flex-col gap-2 shadow-xs"
            >
              <div className="flex items-center justify-between">
                <span className="font-bold text-gray-800 text-sm flex items-center gap-2">
                  🚪 ห้องที่ {room.room_no}
                </span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 font-medium">
                  {room.room_name}
                </span>
              </div>

              <div>
                <label className="text-xs text-gray-500 mb-1 block">เจ้าหน้าที่ผู้ให้คำปรึกษา:</label>
                <Select
                  value={room.user_id || undefined}
                  placeholder="-- เลือกเจ้าหน้าที่ประจำห้อง --"
                  className="w-full"
                  size="middle"
                  allowClear
                  onChange={(val) => handleStaffAssign(room.room_no, val)}
                  options={staffList.map((s) => ({
                    value: s.user_id,
                    label: `${s.nickname || s.username} (${s.username})`,
                  }))}
                />
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* 3. Audio & System Options */}
      <Card
        title={
          <span className="flex items-center gap-2 font-bold text-base">
            <Volume2 className="w-5 h-5 text-emerald-600" />
            3. ระบบเสียงประกาศภาษาไทย
          </span>
        }
        className="shadow-sm rounded-xl"
      >
        <div className="flex items-center justify-between">
          <div>
            <div className="font-semibold text-gray-800">เปิดใช้งานเสียงประกาศภาษาไทย (Audio TTS)</div>
            <div className="text-xs text-gray-500">
              เล่นเสียงกระดิ่ง ดริ๊ง-ดร่อง พร้อมเสียงสังเคราะห์ภาษาไทย "ขอเชิญหมายเลข..." ออกลำโพงโถงพักคอย
            </div>
          </div>
          <Switch
            checked={Boolean(config.sound_enabled)}
            onChange={(checked) => setConfig((prev) => ({ ...prev, sound_enabled: checked ? 1 : 0 }))}
          />
        </div>
      </Card>

      {/* Save Button */}
      <div className="flex justify-end gap-3 pt-2">
        <Button
          type="primary"
          icon={<Save className="w-4 h-4" />}
          size="large"
          loading={saving}
          onClick={handleSave}
          className="px-8 font-bold bg-primary hover:bg-primary/90"
        >
          บันทึกการตั้งค่ารอบนี้
        </Button>
      </div>
    </div>
  );
}
