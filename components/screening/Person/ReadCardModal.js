// components/screening/Person/ReadCardModal.js
"use client";
import { useState } from "react";
import ModalWrapper from "@/components/common/Modal/ModalWrapper";
import Button from "@/components/common/Form/Button";
import { CreditCard, Loader2, AlertCircle } from "lucide-react";
// ไม่ต้องใช้ readSmartCardAction จาก Server Action แล้ว

export default function ReadCardModal({ onSuccess }) {
  const [isOpen, setIsOpen] = useState(false);
  const [status, setStatus] = useState("idle"); // idle, reading, error
  const [errorMessage, setErrorMessage] = useState("");

  const handleOpen = () => {
    setIsOpen(true);
    startReadingCard();
  };

  const handleClose = () => {
    setIsOpen(false);
    setStatus("idle");
    setErrorMessage("");
  };

  const startReadingCard = async () => {
    setStatus("reading");
    setErrorMessage("");
    
    try {
      // เปลี่ยนมายิง fetch ไปที่ Python Local API แทน
      const response = await fetch('http://localhost:5001/read-id', {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
        },
      });

      const result = await response.json();

      console.log("ผลลัพธ์จาก Python API:", result);
      
      if (result.success) {
        // ส่งข้อมูล cid (เลข 13 หลัก) กลับไปที่ Hook แม่
        onSuccess(result.data);
        handleClose();
      } else {
        setErrorMessage(result.message || "อ่านข้อมูลล้มเหลว");
        setStatus("error");
      }
    } catch (error) {
      // กรณีไม่ได้เปิดโปรแกรม Python หรือเชื่อมต่อไม่ได้
      setErrorMessage("ไม่สามารถเชื่อมต่อโปรแกรมอ่านบัตรได้ (กรุณาตรวจสอบว่ารัน Python API แล้ว)");
      setStatus("error");
    }
  };

  return (
    <>
      <Button 
        onClick={handleOpen} 
        className="action-btn outline" 
        type="button"
      >
        <span className="hide-in-modern">💳</span>
        <CreditCard className="show-in-modern" />
        อ่านบัตรประชาชน
      </Button>

      <ModalWrapper isOpen={isOpen} onClosed={handleClose} allowOutsideClick={false}>
        <div className="bg-white p-6 rounded-xl shadow-lg text-center flex flex-col items-center">
          <h3 className="text-xl font-bold mb-6 text-gray-800">อ่านข้อมูลบัตรประจำตัวประชาชน</h3>
          
          {status === "reading" ? (
            <div className="flex flex-col items-center gap-4 my-6">
              <Loader2 className="animate-spin text-blue-500 w-16 h-16" />
              <p className="text-gray-600 text-lg">กำลังรอดึงข้อมูล... กรุณาเสียบบัตรประชาชน</p>
            </div>
          ) : status === "error" ? (
            <div className="flex flex-col items-center gap-4 my-6">
              <AlertCircle className="text-red-500 w-16 h-16" />
              <p className="text-red-500 text-lg">{errorMessage}</p>
              <div className="flex gap-2 mt-4">
                <Button onClick={startReadingCard} className="!bg-blue-600 !text-white">ลองใหม่อีกครั้ง</Button>
                <Button onClick={handleClose} className="outline">ยกเลิก</Button>
              </div>
            </div>
          ) : null}
        </div>
      </ModalWrapper>
    </>
  );
}