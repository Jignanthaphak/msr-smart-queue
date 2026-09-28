// components/monitor/QueueControlMini.js
"use client";
import React, { useState, useEffect, useRef } from "react";
import clientConfig from "@/config/Client";
import { getQueueState, callQueue, recallQueue, holdQueue, resumeQueue } from "@/services/queue";
import { announceQueue } from "@/lib/utils/queueAudio";
import { Volume2, Pause, Play, RotateCcw, AlertTriangle, Monitor, ExternalLink, RefreshCw } from "lucide-react";
import Swal from "sweetalert2";
import Link from "next/link";

export default function QueueControlMini() {
  const [queueState, setQueueState] = useState({ rooms: [], waitingList: [], heldList: [], config: {} });
  const [loading, setLoading] = useState(false);
  const [countdown, setCountdown] = useState(null); // { roomNo, secondsRemaining }
  const delayTimerRef = useRef(null);

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

  // 2) Initial fetch
  useEffect(() => {
    fetchState();
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

  // 3) Call Next Queue to a Room
  const handleCallNext = async (room) => {
    if (!queueState.waitingList || queueState.waitingList.length === 0) {
      Swal.fire({
        icon: "info",
        title: "ไม่มีคิวรอรับบริการ",
        text: "ขณะนี้ยังไม่มีผู้รับบริการที่รอตรวจให้เรียกเข้าห้องค่ะ",
        confirmButtonText: "ตกลง",
        confirmButtonColor: "#10b981",
      });
      return;
    }

    const nextPatient = queueState.waitingList[0];
    setLoading(true);
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
      }
    } catch (err) {
      console.error("handleCallNext error:", err);
    } finally {
      setLoading(false);
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

  return (
    <div className="card-content border-t pt-4 mt-2">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <h4 className="card-title text-base font-bold flex items-center gap-2">
          <Monitor className="w-5 h-5 text-primary" />
          <span>แผงควบคุมและจำลองคิว (Smart Queue Monitor)</span>
        </h4>
        <Link
          href="/queue-display"
          target="_blank"
          className="text-xs text-primary hover:underline flex items-center gap-1 font-semibold"
          title="เปิดหน้าจอแสดงผลคิวสำหรับต่อจอทีวี"
        >
          <ExternalLink className="w-3.5 h-3.5" />
          เปิดจอใหญ่ (TV Display)
        </Link>
      </div>

      {/* Mini Hospital Grid (Live Preview of what patients see) */}
      <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white shadow-xs mb-4">
        <table className="table w-full text-xs">
          <thead>
            <tr className="bg-gray-100 text-gray-700">
              <th className="py-2.5 px-3">ห้องตรวจ</th>
              <th className="py-2.5 px-3 text-center">หมายเลข HN</th>
              <th className="py-2.5 px-3 text-center">สถานะจอทีวี</th>
              <th className="py-2.5 px-3 text-right">ปุ่มควบคุม</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {queueState.rooms && queueState.rooms.length > 0 ? (
              queueState.rooms.map((room) => {
                const isCalling = room.status === "calling";
                const isConsulting = room.status === "consulting";
                const isBreak = room.status === "break";
                const isEmpty = room.status === "empty";

                return (
                  <tr
                    key={room.room_no}
                    className={
                      isCalling
                        ? "bg-emerald-50/70"
                        : isConsulting
                        ? "bg-slate-50"
                        : isBreak
                        ? "bg-amber-50/50"
                        : ""
                    }
                  >
                    {/* Room info */}
                    <td className="py-2.5 px-3 font-semibold text-gray-800 whitespace-nowrap">
                      <div className="text-sm font-bold text-gray-900">
                        {String(room.room_name || room.room_no || "")
                          .replace(/^ห้องคอนเซาท์\s*/i, "")
                          .trim() || room.room_no}
                      </div>
                      <div className="text-[11px] text-gray-500 font-normal">
                        ผู้ให้คำปรึกษา: {room.staff_name || "-"}
                      </div>
                    </td>

                    {/* HN Number: Blinking Green on Call, Solid Gray on Consult */}
                    <td className="py-2.5 px-3 text-center">
                      {isCalling && room.current_hn ? (
                        <span className="inline-block px-2.5 py-1 rounded-md bg-emerald-100 border border-emerald-400 text-emerald-700 font-mono font-black text-sm animate-pulse">
                          HN {room.current_hn}
                        </span>
                      ) : isConsulting && room.current_hn ? (
                        <span className="inline-block px-2.5 py-1 rounded-md bg-gray-200 text-gray-600 font-mono font-bold text-sm">
                          HN {room.current_hn}
                        </span>
                      ) : isBreak ? (
                        <span className="text-amber-600 font-semibold text-xs">☕ ขอพัก</span>
                      ) : (
                        <span className="text-gray-400 font-mono">-</span>
                      )}
                    </td>

                    {/* Screen Status */}
                    <td className="py-2.5 px-3 text-center">
                      {isCalling ? (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500 text-white animate-bounce">
                          🟢 กำลังเรียก
                        </span>
                      ) : isConsulting ? (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                          ให้คำปรึกษา
                        </span>
                      ) : isBreak ? (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-400 text-white">
                          พัก
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-gray-200 text-gray-600">
                          ว่าง
                        </span>
                      )}
                    </td>

                    {/* Actions */}
                    <td className="py-2.5 px-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        {isCalling && (
                          <>
                            <button
                              onClick={() => handleRecall(room)}
                              className="btn btn-xs btn-outline btn-success flex items-center gap-1"
                              title="เรียกซ้ำ"
                            >
                              <Volume2 className="w-3 h-3" />
                              เรียกซ้ำ
                            </button>
                            <button
                              onClick={() => handleHold(room)}
                              className="btn btn-xs btn-outline btn-warning flex items-center gap-1"
                              title="พักคิวนี้ไว้ชั่วคราว (Hold)"
                            >
                              <Pause className="w-3 h-3" />
                              พักคิว
                            </button>
                          </>
                        )}

                        {isEmpty && (
                          <button
                            onClick={() => handleCallNext(room)}
                            disabled={loading || !queueState.waitingList?.length}
                            className="btn btn-xs btn-primary text-white flex items-center gap-1"
                          >
                            <Play className="w-3 h-3" />
                            เรียกคิว
                          </button>
                        )}
                      </div>
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
          <span className="text-[11px] text-gray-500">
            (เช่น ตรวจ Bio แล้วติดประชุม สามารถดึงกลับมารับบริการได้)
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
