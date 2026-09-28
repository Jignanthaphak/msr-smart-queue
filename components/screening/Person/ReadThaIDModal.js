// components/screening/Person/ReadThaIDModal.js
"use client";
import { useState, useEffect, useRef } from "react";
import ModalWrapper from "@/components/common/Modal/ModalWrapper";
import Button from "@/components/common/Form/Button";
import { Smartphone, Loader2, CheckCircle2, AlertCircle, RefreshCw, X } from "lucide-react";
import clientConfig from "@/config/Client";

function ThaidIcon({ className = "w-5 h-5 inline-block" }) {
  return (
    <svg className={className} viewBox="0 0 95 34" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <clipPath id="thaid-dot">
          <circle cx="49" cy="8" r="4.5" />
        </clipPath>
      </defs>
      <g clipPath="url(#thaid-dot)">
        <rect x="43" y="3.5" width="12" height="1.8" fill="#EF3340" />
        <rect x="43" y="5.3" width="12" height="1.4" fill="#FFFFFF" />
        <rect x="43" y="6.7" width="12" height="2.6" fill="#00247D" />
        <rect x="43" y="9.3" width="12" height="1.4" fill="#FFFFFF" />
        <rect x="43" y="10.7" width="12" height="1.8" fill="#EF3340" />
      </g>
      <text x="2" y="28" fontFamily="Arial, Helvetica, sans-serif" fontSize="26" fontWeight="800" fill="#2563EB" letterSpacing="-0.5">
        tha<tspan dx="1">ı</tspan><tspan dx="2">D</tspan>
      </text>
    </svg>
  );
}

export default function ReadThaIDModal({ onSuccess }) {
  const [isOpen, setIsOpen] = useState(false);
  const [status, setStatus] = useState("idle"); // idle, loading, ready, completed, error, expired
  const [qrDataUrl, setQrDataUrl] = useState("");
  const [requestId, setRequestId] = useState("");
  const [refCode, setRefCode] = useState("");
  const [countdown, setCountdown] = useState(300);
  const [errorMessage, setErrorMessage] = useState("");
  const [receivedPerson, setReceivedPerson] = useState(null);

  const pollIntervalRef = useRef(null);
  const countdownIntervalRef = useRef(null);

  const handleOpen = () => {
    setIsOpen(true);
    startThaIDFlow();
  };

  const handleClose = () => {
    stopPolling();
    stopCountdown();
    setIsOpen(false);
    setStatus("idle");
    setQrDataUrl("");
    setRequestId("");
    setRefCode("");
    setErrorMessage("");
    setReceivedPerson(null);
  };

  const stopPolling = () => {
    if (pollIntervalRef.current) {
      clearInterval(pollIntervalRef.current);
      pollIntervalRef.current = null;
    }
  };

  const stopCountdown = () => {
    if (countdownIntervalRef.current) {
      clearInterval(countdownIntervalRef.current);
      countdownIntervalRef.current = null;
    }
  };

  const startThaIDFlow = async () => {
    stopPolling();
    stopCountdown();
    setStatus("loading");
    setErrorMessage("");
    setReceivedPerson(null);
    setRefCode("");

    try {
      const basePath = clientConfig.base_path || "/msr";
      const res = await fetch(`${basePath}/api/screening/thaid/request`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });

      const json = await res.json();
      if (!json.success || !json.qrDataUrl) {
        throw new Error(json.message || "ไม่สามารถสร้าง QR Code ยืนยันตัวตนได้");
      }

      setQrDataUrl(json.qrDataUrl);
      setRequestId(json.requestId);
      setRefCode(json.refCode || "");
      setStatus("ready");

      // คำนวณเวลาที่เหลือ
      const remainingSeconds = Math.max(0, Math.floor((json.expiresAt - Date.now()) / 1000));
      setCountdown(remainingSeconds || 300);

      // เริ่มนับถอยหลัง
      countdownIntervalRef.current = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            stopCountdown();
            stopPolling();
            setStatus("expired");
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      // เริ่ม Polling เช็คผลทุก 2 วินาที
      pollIntervalRef.current = setInterval(async () => {
        try {
          const pollRes = await fetch(`${basePath}/api/screening/thaid/status?requestId=${encodeURIComponent(json.requestId)}`);
          const pollJson = await pollRes.json();

          if (pollJson.success) {
            if (pollJson.status === "completed" && pollJson.data) {
              stopPolling();
              stopCountdown();
              setStatus("completed");
              setReceivedPerson(pollJson.data);

              // ส่งข้อมูลกลับไปยัง Hook แม่ (useManagesPersonFormScreening)
              onSuccess?.(pollJson.data);

              // ปิดหน้าต่างอัตโนมัติหลังจากแสดงความสำเร็จ 1.5 วินาที
              setTimeout(() => {
                handleClose();
              }, 1600);
            } else if (pollJson.status === "expired") {
              stopPolling();
              stopCountdown();
              setStatus("expired");
            }
          }
        } catch (pollErr) {
          console.warn("ThaID poll error:", pollErr);
        }
      }, 2000);

    } catch (err) {
      console.error("Start ThaID Flow error:", err);
      setErrorMessage(err.message || "เกิดข้อผิดพลาดในการเชื่อมต่อ ThaID");
      setStatus("error");
    }
  };

  useEffect(() => {
    return () => {
      stopPolling();
      stopCountdown();
    };
  }, []);

  const formatTime = (secs) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${s < 10 ? "0" : ""}${s}`;
  };

  return (
    <>
      <Button
        onClick={handleOpen}
        className="action-btn outline !border-blue-600 !text-blue-700 hover:!bg-blue-50 flex items-center gap-2"
        type="button"
      >
        <ThaidIcon className="w-5 h-3.5 inline-block" />
        <span>ดึงข้อมูลด้วย ThaID</span>
      </Button>

      <ModalWrapper isOpen={isOpen} onClosed={handleClose} allowOutsideClick={false}>
        <div className="bg-white p-6 rounded-2xl shadow-2xl text-center flex flex-col items-center relative max-w-sm mx-auto">
          {/* ปุ่มปิดมุมบน */}
          <button
            onClick={handleClose}
            className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 p-1 rounded-full hover:bg-gray-100 transition-colors"
            type="button"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Header */}
          <div className="flex items-center gap-2 mb-2">
            <ThaidIcon className="w-12 h-6" />
            <h3 className="text-lg font-bold text-gray-800">ยืนยันตัวตนด้วย ThaID</h3>
          </div>
          <p className="text-xs text-gray-500 mb-4">สำหรับผู้รับบริการที่ไม่ได้พกบัตรประชาชนตัวจริงมา</p>

          {/* Body Content */}
          {status === "loading" && (
            <div className="flex flex-col items-center gap-3 my-10">
              <Loader2 className="animate-spin text-blue-600 w-12 h-12" />
              <p className="text-gray-600 text-sm">กำลังเชื่อมต่อระบบ ThaID กรมการปกครอง...</p>
            </div>
          )}

          {status === "ready" && (
            <div className="flex flex-col items-center gap-3 w-full">
              <div className="bg-white p-2 rounded-2xl border-2 border-blue-100 shadow-md">
                <img
                  src={qrDataUrl}
                  alt="ThaID QR Code"
                  className="w-56 h-56 object-contain rounded-xl"
                />
              </div>

              {/* Reference Code badge */}
              {refCode && (
                <div className="bg-amber-50 border border-amber-300 rounded-lg px-3.5 py-1 flex items-center gap-2 shadow-sm">
                  <span className="text-[12px] text-amber-800 font-medium">รหัสอ้างอิง:</span>
                  <span className="text-base font-black text-amber-900 tracking-widest font-mono">{refCode}</span>
                </div>
              )}

              {/* Countdown badge */}
              <div className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                <span className="w-2 h-2 rounded-full bg-blue-600 animate-pulse"></span>
                <span>รหัสหมดอายุใน: {formatTime(countdown)}</span>
              </div>

              {/* คำแนะนำ */}
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-left w-full text-xs text-gray-600 space-y-1 mt-1">
                <div className="font-semibold text-gray-700 flex items-center gap-1">
                  <Smartphone className="w-3.5 h-3.5 text-blue-600" />
                  ขั้นตอนสำหรับผู้รับบริการ:
                </div>
                <ol className="list-decimal list-inside space-y-0.5 pl-1 text-[11px] text-gray-600">
                  <li>เปิดแอป <b>ThaID</b> ในสมาร์ทโฟน</li>
                  <li>กดปุ่ม <b>"สแกน"</b> ส่องที่ QR Code นี้</li>
                  <li>กดยินยอมเปิดเผยข้อมูลบนมือถือ</li>
                </ol>
              </div>

              <div className="flex gap-2 w-full mt-2">
                <Button onClick={startThaIDFlow} className="outline !text-xs !py-1.5 flex-1 flex items-center justify-center gap-1" type="button">
                  <RefreshCw className="w-3.5 h-3.5" />
                  สร้าง QR ใหม่
                </Button>
                <Button onClick={handleClose} className="outline !text-xs !py-1.5 flex-1" type="button">
                  ยกเลิก
                </Button>
              </div>
            </div>
          )}

          {status === "completed" && (
            <div className="flex flex-col items-center gap-3 my-6 animate-fade-in">
              <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center text-green-600">
                <CheckCircle2 className="w-10 h-10" />
              </div>
              <h4 className="text-base font-bold text-gray-800">ยืนยันตัวตนสำเร็จ!</h4>
              {receivedPerson && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-2.5 text-xs text-green-800 w-full text-center">
                  <p className="font-bold">
                    {receivedPerson.prefixTH || ""}{receivedPerson.firstNameTH || ""} {receivedPerson.lastNameTH || ""}
                  </p>
                  <p className="text-gray-600 text-[11px] mt-0.5">
                    เลขบัตร: {receivedPerson.citizenId || "-"}
                  </p>
                </div>
              )}
              <p className="text-xs text-gray-500">กำลังกรอกข้อมูลลงฟอร์มอัตโนมัติ...</p>
            </div>
          )}

          {status === "expired" && (
            <div className="flex flex-col items-center gap-3 my-6">
              <AlertCircle className="text-amber-500 w-12 h-12" />
              <p className="text-gray-700 text-sm font-semibold">QR Code หมดอายุแล้วค่ะ</p>
              <p className="text-gray-500 text-xs">กรุณากดสร้าง QR Code ใหม่อีกครั้งนะคะ</p>
              <div className="flex gap-2 mt-2 w-full">
                <Button onClick={startThaIDFlow} className="!bg-blue-600 !text-white flex-1" type="button">
                  สร้าง QR ใหม่
                </Button>
                <Button onClick={handleClose} className="outline flex-1" type="button">
                  ปิด
                </Button>
              </div>
            </div>
          )}

          {status === "error" && (
            <div className="flex flex-col items-center gap-3 my-6">
              <AlertCircle className="text-red-500 w-12 h-12" />
              <p className="text-red-600 text-sm font-semibold">เกิดข้อผิดพลาด</p>
              <p className="text-gray-600 text-xs px-2">{errorMessage}</p>
              <div className="flex gap-2 mt-2 w-full">
                <Button onClick={startThaIDFlow} className="!bg-blue-600 !text-white flex-1" type="button">
                  ลองใหม่อีกครั้ง
                </Button>
                <Button onClick={handleClose} className="outline flex-1" type="button">
                  ปิด
                </Button>
              </div>
            </div>
          )}
        </div>
      </ModalWrapper>
    </>
  );
}
