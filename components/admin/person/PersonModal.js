"use client";
import React, { useEffect, useState } from "react";
import { Modal, Input, Button, Spin, Form, Switch, message, Select, Typography } from "antd";
import { getPerson } from "@/actions/admin/person/actions";
import DetailPersonManage from '@/components/screening/DetailScreening/DetailPersonManage';
import MovableDialogWrapper from '@/components/common/MovableDialog/MovableDialogWrapper';
export default function PersonModal({ open, onClose, personId, onEdit }) {

  const [data, setData] = useState(null);

  const fetchPerson = async () => {
    if (!personId) return;
    try {
      const result = await getPerson({ hn: personId });
      if (!result.ok) throw new Error(result.error || "ไม่สามารถดึงข้อมูลได้");
      setData(result?.data || null)
    } catch (err) {
      message.error(err.message);
    }
  };

  useEffect(() => {
    if (open) {
      if (personId ) fetchPerson();
    }
  }, [open, personId]);

   const onEdited = () => {
    onEdit();
  };


  if (!data) return null;

  return (
    <MovableDialogWrapper
      title={`รายละเอียดการตรวจ - HN ${data.hn} ${data.firstname} - ${data.lastname} `}
      isOpen={open}
      onClose={onClose}
      width={1300}
      height={1000}
    >
      <DetailPersonManage open={open} data={data} onEdit={onEdited} isEdit={true}/>
    </MovableDialogWrapper>
  );
}
