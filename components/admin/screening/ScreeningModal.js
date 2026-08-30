"use client";
import React, { useEffect, useState } from "react";
import { Modal, Input, Button, Spin, Form, Switch, message, Select, Typography } from "antd";
import { getScreening } from "@/actions/admin/screening/actions";
import DetailScreeningTab from '@/components/screening/DetailScreening/DetailScreeningTab.js';
import MovableDialogWrapper from '@/components/common/MovableDialog/MovableDialogWrapper';
import { date, datetime, times, day, nowMs, nowSec, nowDate } from "@/lib/utils/dateFormat";

export default function PersonModal({ open, onClose, screeningId, onEdit }) {

  const [data, setData] = useState(null);

  const fetchPerson = async () => {
    if (!screeningId) return;
    try {
      const result = await getScreening({ screening_id: screeningId });
      if (!result.ok) throw new Error(result.error || "ไม่สามารถดึงข้อมูลได้");

      console.log(result.data)
      setData(result?.data || null)
    } catch (err) {
      message.error(err.message);
    }
  };

  useEffect(() => {
    if (open) {
      if (screeningId ) fetchPerson();
    }
  }, [open, screeningId]);

   const onEdited = () => {
    onEdit();
  };


  if (!data) return null;

  return (
    <MovableDialogWrapper
      title={`รายละเอียดการตรวจ - HN${data.hn} ${data.firstname} - ${data.lastname} วันที่ ${date(data.screenings.create_date)}`}
      isOpen={open}
      onClose={onClose}
      width={1300}
      height={1000}
    >
      <DetailScreeningTab  data={data}  isEdit={true} onEdit={onEdited}/>
    </MovableDialogWrapper>
  );
}
