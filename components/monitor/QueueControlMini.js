// components/monitor/QueueControlMini.js
"use client";
import React, { useState, useEffect, useRef } from "react";
import clientConfig from "@/config/Client";
import useAuthStore from "@/stores/useAuthStore";
import { getQueueState, callQueue, recallQueue, holdQueue, resumeQueue } from "@/services/queue";
import { announceQueue } from "@/lib/utils/queueAudio";
import { Play, Pause, RotateCcw, Monitor, ExternalLink } from "lucide-react";
import Swal from "sweetalert2";
import Link from "next/link";

export default function QueueControlMini() {
  const [queueState, setQueueState] = useState({ rooms: [], waitingList: [], heldList: [], config: {} });
  const [loading, setLoading] = useState(false);
  const [countdownMap, setCountdownMap] = useState({}); // { [roomNo]: secondsRemaining }
  const emptyTimestampsRef = useRef({});
  const isAutoCallingRef = useRef(false);
  const loadingRef = useRef(false);

  const currentUser = useAuthStore((state) => state.user);
  const isAdmin = Boolean(currentUser?.isAdminPanel || Number(currentUser?.isRole) === 1);

  // ตรวจสอบสิทธิ์: แอดมินกดได้ทุกห้อง ทุกคน | ยูสเซอร์เจ้าของห้องกดได้แค่ห้องของตัวเอง
  const canControlRoom = (room) => {
    if (isAdmin) return true; // แอดมินกดได้ทุกห้อง ทุกคน
    if (!currentUser) return false;

    // ยูสเซอร์เจ้าของห้อง: ตรวจสอบทั้ง user_id, nickname และ username
    const currentUserId = currentUser.userId ? Number(currentUser.userId) : null;
    const roomStaffId = room.staff_id ? Number(room.staff_id) : null;
    if (currentUserId && roomStaffId && currentUserId === roomStaffId) {
      return true;
    }

    const currentNick = (currentUser.nickName || "").trim().toLowerCase();
    const currentUsername = (currentUser.userName || "").trim().toLowerCase();
    const roomStaff = (room.staff_name || "").trim().toLowerCase();

    if (roomStaff && roomStaff !== "-") {
      if (currentNick && roomStaff === currentNick) return true;
      if (currentUsername && roomStaff === currentUsername) return true;
    }

    return false;
  };

  // 1) Real-time SSE listener
  useEffect(() => {
    const evtSource = new EventSource(clientConfig.backend_url + "/queue/stream");

    evtSource.onmessage = (e) => {
      try {
        const raw = JSON.parse(e.data);
        const payload = raw?.payload ?? raw;
        if (payload) {
          setQueueState(payload);
        }
      } catch (err) {
        console.error("QueueControlMini SSE parse error:", err);
      }
    };

    evtSource.onerror = (err) => {
      console.error("QueueControlMini SSE error:", err);
    };

    return () => evtSource.close();
  }, []);

  // 2) Initial fetch + 3s Polling fallback (Ensures mini control stays in sync)
  useEffect(() => {
    fetchState();
    const interval = setInterval(fetchState, 3000);
    return () => clearInterval(interval);
  }, []);

  const fetchState = async () => {
    try {
      const res = await getQueueState();
      if (res && res.success) {
        setQueueState(res);
      }
    } catch (e) {
      // silent
    }
  };

  useEffect(() => {
    loadingRef.current = loading;
  }, [loading]);

  // 3) Call Next Queue to a Room (ข้ามคิวที่ถูกเรียกหรืออยู่ในห้องอื่นอยู่แล้วอัตโนมัติ)
  const handleCallNext = async (room) => {
    // รวบรวม HN ที่กำลังถูกเรียก หรือกำลังตรวจในห้องอื่นอยู่แล้ว
    const busyHns = new Set(
      (queueState.rooms || [])
        .filter((r) => r.current_hn && r.status !== "empty" && r.status !== "break")
        .map((r) => String(r.current_hn).trim())
    );

    // ดึงเฉพาะผู้รับบริการที่ยังว่าง ไม่ได้ถูกห้องใดเรียกอยู่
    const availablePatients = (queueState.waitingList || []).filter(
      (p) => !busyHns.has(String(p.hn).trim())
    );

    if (availablePatients.length === 0) {
      Swal.fire({
        icon: "info",
        title: "ไม่มีคิวรอรับบริการ",
        text: "ขณะนี้ยังไม่มีผู้รับบริการที่รอตรวจให้เรียกเข้าห้องค่ะ (ผู้รับบริการคนอื่นกำลังถูกเรียกหรืออยู่ในห้องตรวจแล้ว)",
        confirmButtonText: "ตกลง",
        confirmButtonColor: "#10b981",
      });
      return;
    }

    const nextPatient = availablePatients[0];
    setLoading(true);
    loadingRef.current = true;
    try {
      const res = await callQueue({
        room_no: room.room_no,
        room_name: room.room_name,
        staff_name: room.staff_name,
        screening_id: nextPatient.screening_id,
        hn: nextPatient.hn,
        patient_name: nextPatient.patient_name,
      });
      if (res && res.success) {
        setQueueState(res);
        delete emptyTimestampsRef.current[room.room_no];
      }
    } catch (err) {
      console.error("handleCallNext error:", err);
    } finally {
      setLoading(false);
      loadingRef.current = false;
    }
  };

  // 4) Recall (เรียกซ้ำ) - No confirm needed
  const handleRecall = async (room) => {
    if (!room.current_hn) return;
    try {
      const res = await recallQueue({ room_no: room.room_no });
      if (res && res.success) {
        setQueueState(res);
      }
      // Speak locally if audio is enabled
      announceQueue({
        hn: room.current_hn,
        roomName: room.room_name,
        staffName: room.staff_name,
        basePath: clientConfig?.base_path || "/msr",
      });
    } catch (err) {
      console.error("handleRecall error:", err);
    }
  };

  // 5) Hold Queue (พักคิว) with SweetAlert2 confirmation!
  const handleHold = async (room) => {
    if (!room.current_hn) return;

    const result = await Swal.fire({
      title: "ยืนยันการพักคิว (Hold)?",
      html: `ต้องการพักคิวผู้รับบริการ <b>HN ${room.current_hn}</b> (${room.patient_name || ""}) ไว้ชั่วคราวหรือไม่?<br/><small class="text-gray-500">คิวนี้จะถูกย้ายไปที่รายการพักคิว และห้องตรวจจะพร้อมเรียกคิวถัดไป</small>`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#f59e0b",
      cancelButtonColor: "#6b7280",
      confirmButtonText: "ใช่, พักคิวนี้",
      cancelButtonText: "ยกเลิก",
    });

    if (result.isConfirmed) {
      setLoading(true);
      try {
        const res = await holdQueue({
          screening_id: room.current_screening_id,
          hn: room.current_hn,
          patient_name: room.patient_name,
          reason: "ติดประชุม / พักคิวชั่วคราว",
        });
        if (res && res.success) {
          setQueueState(res);
          Swal.fire({
            icon: "success",
            title: "พักคิวเรียบร้อย",
            text: `คิว HN ${room.current_hn} ถูกย้ายไปที่รายการคิวที่พักไว้แล้วค่ะ`,
            timer: 2000,
            showConfirmButton: false,
          });
        }
      } catch (err) {
        console.error("handleHold error:", err);
      } finally {
        setLoading(false);
      }
    }
  };

  // 6) Resume Queue (ดึงกลับเข้าคิว) with SweetAlert2 confirmation!
  const handleResume = async (heldItem) => {
    const result = await Swal.fire({
      title: "ดึงคิวกลับเข้าสู่ระบบ?",
      html: `ต้องการดึงผู้รับบริการ <b>HN ${heldItem.hn}</b> (${heldItem.patient_name || ""}) กลับมารอเข้าห้องตรวจเป็นคิวถัดไปใช่หรือไม่?`,
      icon: "question",
      showCancelButton: true,
      confirmButtonColor: "#10b981",
      cancelButtonColor: "#6b7280",
      confirmButtonText: "ใช่, ดึงเข้าคิว",
      cancelButtonText: "ยกเลิก",
    });

    if (result.isConfirmed) {
      setLoading(true);
      try {
        const res = await resumeQueue({
          screening_id: heldItem.screening_id,
        });
        if (res && res.success) {
          setQueueState(res);
          Swal.fire({
            icon: "success",
            title: "ดึงคิวกลับสำเร็จ",
            text: `คิว HN ${heldItem.hn} กลับเข้ามาอยู่ในคิวรอตรวจเรียบร้อยแล้วค่ะ`,
            timer: 2000,
            showConfirmButton: false,
          });
        }
      } catch (err) {
        console.error("handleResume error:", err);
      } finally {
        setLoading(false);
      }
    }
  };

  // 7) Auto-call Countdown Timer (เฉพาะกรณี "ขอเวลาสักครู่" หลังคีย์ส่งตรวจหน้าคอนเซาท์เสร็จ)
  // หากครบเวลาแล้วเจ้าหน้าที่ยังไม่กด ให้ระบบอัตโนมัติเรียกคิวเลย ไม่เปลี่ยนเป็นว่างก่อน!
  useEffect(() => {
    const delaySec = Number(queueState?.config?.delay_seconds) || 30;

    const timer = setInterval(() => {
      const waitingCount = (queueState.waitingList || []).length;
      const newCountdownMap = {};

      (queueState.rooms || []).forEach((room) => {
        const isPendingConsult = room.status === "pending_consult" || room.status === "pending_consult_expired";

        // นับเวลาถอยหลังเฉพาะกรณีหลังส่งตรวจหน้าคอนเซาท์เสร็จ (สถานะ ขอเวลาสักครู่) และมีคนรอในคิว
        if (isPendingConsult && waitingCount > 0) {
          let remaining = room.cooldown_remaining;
          if (remaining === undefined || remaining === null) {
            if (!emptyTimestampsRef.current[room.room_no]) {
              emptyTimestampsRef.current[room.room_no] = Date.now();
            }
            const elapsed = Math.floor((Date.now() - emptyTimestampsRef.current[room.room_no]) / 1000);
            remaining = Math.max(0, delaySec - elapsed);
          } else {
            if (!emptyTimestampsRef.current[room.room_no]) {
              emptyTimestampsRef.current[room.room_no] = Date.now() - (delaySec - remaining) * 1000;
            }
            const elapsed = Math.floor((Date.now() - emptyTimestampsRef.current[room.room_no]) / 1000);
            remaining = Math.max(0, delaySec - elapsed);
          }

          newCountdownMap[room.room_no] = remaining;

          // เมื่อหมดเวลา (0 วินาที): ระบบทำการเรียกคิวต่อไปให้อัตโนมัติทันที!
          if (remaining <= 0 && !isAutoCallingRef.current && !loadingRef.current) {
            if (canControlRoom(room)) {
              isAutoCallingRef.current = true;
              emptyTimestampsRef.current[room.room_no] = Date.now();
              handleCallNext(room).finally(() => {
                isAutoCallingRef.current = false;
              });
            }
          }
        } else {
          delete emptyTimestampsRef.current[room.room_no];
        }
      });

      setCountdownMap(newCountdownMap);
    }, 1000);

    return () => clearInterval(timer);
  }, [queueState, isAdmin, currentUser]);

  // 8) Seed & Clear 20 Test Queues (สำหรับทดสอบระบบ)
  const handleSeedTest = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${clientConfig.backend_url}/queue/seed-test`).then((r) => r.json());
      if (res && res.success) {
        Swal.fire({
          icon: "success",
          title: "เพิ่มคิวทดสอบ 20 คนเรียบร้อยแล้วค่ะ",
          text: "ผู้รับบริการ HN 9001 - 9020 เข้าสู่คิวรอตรวจของวันนี้แล้วค่ะ สามารถกดเรียกคิวได้เลย",
          confirmButtonText: "ตกลง",
          confirmButtonColor: "#10b981",
        });
        fetchState();
      } else {
        Swal.fire({
          icon: "error",
          title: "เกิดข้อผิดพลาด",
          text: res?.error || "ไม่สามารถเพิ่มข้อมูลทดสอบได้",
        });
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleClearTest = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${clientConfig.backend_url}/queue/seed-test?action=clear`).then((r) => r.json());
      if (res && res.success) {
        Swal.fire({
          icon: "success",
          title: "ล้างคิวทดสอบเรียบร้อยแล้วค่ะ",
          text: "ล้างข้อมูล HN 9001 - 9020 ออกจากระบบเรียบร้อยแล้วค่ะ",
          confirmButtonText: "ตกลง",
          confirmButtonColor: "#10b981",
        });
        fetchState();
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card-content border-t pt-4 mt-2">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
        <h4 className="card-title text-base font-bold flex items-center gap-2">
          <Monitor className="w-5 h-5 text-primary" />
          <span>แผงควบคุมระบบเรียกคิว (Smart Queue Monitor)</span>
        </h4>
        <div className="flex items-center gap-2">
          <button
            onClick={handleSeedTest}
            disabled={loading}
            className="btn btn-xs btn-outline btn-success flex items-center gap-1 font-semibold"
            title="สร้างข้อมูลจำลองผู้รับบริการ 20 คน (HN 9001 - 9020) สถานะรอตรวจ เพื่อทดสอบระบบเรียกคิว"
          >
            🧪 เพิ่มคิวทดสอบ 20 คน
          </button>
          <button
            onClick={handleClearTest}
            disabled={loading}
            className="btn btn-xs btn-outline btn-error flex items-center gap-1 font-semibold"
            title="ล้างข้อมูลคิวทดสอบ (HN 9001 - 9020) ออกจากระบบ"
          >
            🗑️ ล้างคิวทดสอบ
          </button>
          <Link
            href="/queue-display"
            target="_blank"
            className="text-xs text-primary hover:underline flex items-center gap-1 font-semibold ml-1"
            title="เปิดหน้าจอแสดงผลคิวสำหรับต่อจอทีวี"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            เปิดจอใหญ่ (TV Display)
          </Link>
        </div>
      </div>

      {/* Mini Hospital Grid (Live Preview of what patients see) */}
      <div className="rounded-xl border border-gray-200 bg-white shadow-xs mb-4 overflow-hidden">
        <table className="w-full text-xs table-fixed">
          <colgroup>
            <col style={{ width: "16%" }} />
            <col style={{ width: "27%" }} />
            <col style={{ width: "29%" }} />
            <col style={{ width: "28%" }} />
          </colgroup>
          <thead>
            <tr className="bg-gray-100 text-gray-700 border-b border-gray-200">
              <th className="py-2.5 px-1 text-center font-bold">ห้อง</th>
              <th className="py-2.5 px-1 text-center font-bold">หมายเลข HN</th>
              <th className="py-2.5 px-1 text-center font-bold">สถานะจอทีวี</th>
              <th className="py-2.5 px-1 text-center font-bold">จัดการ</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {queueState.rooms && queueState.rooms.length > 0 ? (
              queueState.rooms.map((room) => {
                const isCalling = room.status === "calling";
                const isConsulting = room.status === "consulting";
                const isWalkinBeforeCall = room.status === "walkin_before_call" || room.is_walkin_before_call;
                const isBreak = room.status === "break";
                const isPendingConsult = room.status === "pending_consult" || room.status === "pending_consult_expired";
                const isPleaseWait = isBreak || isPendingConsult;
                const isEmpty = room.status === "empty";
                const canControl = canControlRoom(room);
                const countdownSec = countdownMap[room.room_no];

                return (
                  <tr
                    key={room.room_no}
                    className={
                      isCalling
                        ? "bg-emerald-50/70"
                        : isConsulting || isWalkinBeforeCall
                        ? "bg-slate-50/70"
                        : isPleaseWait
                        ? "bg-amber-50/40"
                        : "hover:bg-gray-50/50"
                    }
                  >
                    {/* Column 1: ห้อง (กะทัดรัด ตัวหนา ไม่เปลืองพื้นที่) */}
                    <td className="py-2.5 px-1 text-center whitespace-nowrap">
                      <div className="text-sm font-black text-gray-900 leading-tight">
                        {String(room.room_name || room.room_no || "")
                          .replace(/^ห้องคอนเซาท์\s*(?:ที่)?/i, "")
                          .trim() || room.room_no}
                      </div>
                      <div
                        className="text-[10px] text-gray-400 font-normal leading-tight mt-0.5 truncate max-w-[50px] mx-auto"
                        title={room.staff_name || "-"}
                      >
                        {room.staff_name || "-"}
                      </div>
                    </td>

                    {/* Column 2: หมายเลข HN */}
                    <td className="py-2.5 px-1 text-center whitespace-nowrap">
                      {isCalling && room.current_hn ? (
                        <span className="inline-block px-1.5 py-0.5 rounded bg-emerald-100 border border-emerald-400 text-emerald-800 font-mono font-black text-xs whitespace-nowrap animate-pulse">
                          HN {room.current_hn}
                        </span>
                      ) : (isConsulting || isWalkinBeforeCall) && room.current_hn ? (
                        <div className="flex flex-col items-center justify-center leading-tight">
                          <span className="inline-block px-1.5 py-0.5 rounded bg-gray-100 text-gray-700 font-mono font-bold text-xs whitespace-nowrap">
                            HN {room.current_hn}
                          </span>
                          {isWalkinBeforeCall && (
                            <span className="text-[9px] text-gray-400 font-normal mt-0.5 whitespace-nowrap">
                              เข้าก่อนเรียก
                            </span>
                          )}
                        </div>
                      ) : (
                        <span className="text-gray-400 font-mono text-xs">-</span>
                      )}
                    </td>

                    {/* Column 3: สถานะจอทีวี (ไม่ตัดคำเด็ดขาด) */}
                    <td className="py-2.5 px-1 text-center whitespace-nowrap">
                      {isCalling ? (
                        <span className="inline-flex items-center justify-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500 text-white whitespace-nowrap shadow-xs">
                          <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping shrink-0" />
                          กำลังเรียก
                        </span>
                      ) : isConsulting || isWalkinBeforeCall ? (
                        <span className="inline-block px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-300 whitespace-nowrap">
                          ให้คำปรึกษา
                        </span>
                      ) : isPleaseWait ? (
                        <span className="inline-block px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-50 text-amber-700 border border-amber-200 whitespace-nowrap">
                          ขอเวลาสักครู่
                        </span>
                      ) : (
                        <span className="inline-block px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-600 border border-slate-300 whitespace-nowrap">
                          ว่าง
                        </span>
                      )}
                    </td>

                    {/* Column 4: จัดการ (มี 2 แบบ: [เรียกคิว] สีน้ำเงินตอนว่าง หรือ [ซ้ำ] [พัก] ตอนเรียก และว่างไปตอนคอนเซาท์) */}
                    <td className="py-2.5 px-1 text-center whitespace-nowrap">
                      {/* แบบที่ 2: กดเรียกคิวแล้ว -> มี 2 ปุ่มขึ้นมาแทนคือ ซ้ำ กับ พัก สั้นๆ พอ */}
                      {isCalling ? (
                        <div className="inline-flex items-center justify-center gap-1 whitespace-nowrap">
                          <button
                            onClick={() => handleRecall(room)}
                            disabled={!canControl || loading}
                            className={`btn btn-xs ${
                              canControl
                                ? "bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs"
                                : "bg-gray-100 text-gray-400 border border-gray-200 cursor-not-allowed"
                            } px-2 py-0.5 text-[11px] font-semibold rounded-md border-0 h-6 min-h-0`}
                            title={canControl ? "เรียกซ้ำหมายเลขเดิม" : "เฉพาะเจ้าของห้องหรือผู้ดูแลระบบ"}
                          >
                            ซ้ำ
                          </button>
                          <button
                            onClick={() => handleHold(room)}
                            disabled={!canControl || loading}
                            className={`btn btn-xs ${
                              canControl
                                ? "bg-amber-500 hover:bg-amber-600 text-white shadow-xs"
                                : "bg-gray-100 text-gray-400 border border-gray-200 cursor-not-allowed"
                            } px-2 py-0.5 text-[11px] font-semibold rounded-md border-0 h-6 min-h-0`}
                            title={canControl ? "พักคิวนี้ไว้ชั่วคราว (Hold)" : "เฉพาะเจ้าของห้องหรือผู้ดูแลระบบ"}
                          >
                            พัก
                          </button>
                        </div>
                      ) : isPendingConsult ? (
                        /* กรณี ขอเวลาสักครู่ หลังส่งตรวจหน้าคอนเซาท์เสร็จ -> ขึ้นปุ่ม เรียกคิว สีน้ำเงิน พร้อมเวลานับถอยหลัง auto-call */
                        <button
                          onClick={() => handleCallNext(room)}
                          disabled={!canControl || loading || !queueState.waitingList?.length}
                          className={`btn btn-xs ${
                            canControl && queueState.waitingList?.length
                              ? "bg-blue-600 hover:bg-blue-700 text-white shadow-xs"
                              : "bg-gray-100 text-gray-400 border border-gray-200 cursor-not-allowed"
                          } px-2 py-0.5 text-[11px] font-semibold rounded-md border-0 h-6 min-h-0 whitespace-nowrap inline-flex items-center justify-center gap-1`}
                          title={
                            !canControl
                              ? "เฉพาะเจ้าของห้องหรือผู้ดูแลระบบเท่านั้น"
                              : !queueState.waitingList?.length
                              ? "ยังไม่มีคิวรอรับบริการ"
                              : "กดเรียกคิวถัดไปได้ทันที หรือรอระบบเรียกให้อัตโนมัติ"
                          }
                        >
                          <Play className="w-3 h-3 fill-current shrink-0" />
                          <span>เรียกคิว</span>
                          {countdownSec !== undefined && countdownSec > 0 && (
                            <span className="text-[9px] bg-blue-900/40 text-blue-100 px-1 py-0.2 rounded font-mono ml-0.5">
                              {countdownSec}s
                            </span>
                          )}
                        </button>
                      ) : isEmpty && !isBreak ? (
                        /* แบบที่ 1: สถานะ ว่าง (เริ่มต้น หรือ หลังกดเข้างาน) -> ขึ้นปุ่ม เรียกคิว สีน้ำเงิน คงสถานะว่างไว้ */
                        <button
                          onClick={() => handleCallNext(room)}
                          disabled={!canControl || loading || !queueState.waitingList?.length}
                          className={`btn btn-xs ${
                            canControl && queueState.waitingList?.length
                              ? "bg-blue-600 hover:bg-blue-700 text-white shadow-xs"
                              : "bg-gray-100 text-gray-400 border border-gray-200 cursor-not-allowed"
                          } px-2 py-0.5 text-[11px] font-semibold rounded-md border-0 h-6 min-h-0 whitespace-nowrap inline-flex items-center justify-center gap-1`}
                          title={
                            !canControl
                              ? "เฉพาะเจ้าของห้องหรือผู้ดูแลระบบเท่านั้น"
                              : !queueState.waitingList?.length
                              ? "ยังไม่มีคิวรอรับบริการ"
                              : "กดเรียกคิวถัดไป"
                          }
                        >
                          <Play className="w-3 h-3 fill-current shrink-0" />
                          <span>เรียกคิว</span>
                        </button>
                      ) : null /* กรณีให้คำปรึกษา หรือ ขอพัก (break): คอลัมน์นี้จะว่างไป */}
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan={4} className="text-center py-3 text-gray-400">
                  ไม่มีข้อมูลห้องตรวจ
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Held Queue Section (คิวที่พักไว้ / โฮลไว้) */}
      <div className="rounded-xl border border-amber-200 bg-amber-50/40 p-3">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-bold text-amber-900 flex items-center gap-1.5">
            <Pause className="w-3.5 h-3.5 text-amber-600" />
            คิวที่พักไว้ชั่วคราว (Held Queues): {queueState.heldList?.length || 0} ราย
          </span>
        </div>

        {queueState.heldList && queueState.heldList.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {queueState.heldList.map((item) => (
              <div
                key={item.screening_id}
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white border border-amber-300 shadow-2xs text-xs"
              >
                <div className="font-mono font-bold text-gray-800">HN {item.hn}</div>
                {item.patient_name && (
                  <div className="text-gray-500 text-[11px]">({item.patient_name})</div>
                )}
                <button
                  onClick={() => handleResume(item)}
                  className="btn btn-xs btn-success text-white py-0 px-2 h-6 flex items-center gap-1 font-semibold"
                  title="ดึงกลับเข้าสู่คิวรอตรวจทันที"
                >
                  <RotateCcw className="w-3 h-3" />
                  ดึงเข้าคิว
                </button>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-xs text-gray-400 italic">ไม่มีคิวที่พักไว้ในขณะนี้</div>
        )}
      </div>
    </div>
  );
}
