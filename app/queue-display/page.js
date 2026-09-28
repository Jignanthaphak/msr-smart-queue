// app/queue-display/page.js
"use client";
import React, { useState, useEffect, useRef } from "react";
import clientConfig from "@/config/Client";
import { announceQueue, playHospitalChime } from "@/lib/utils/queueAudio";
import { Monitor, Volume2, VolumeX, Maximize, Clock } from "lucide-react";

export default function QueueDisplayPage() {
  const [queueData, setQueueData] = useState({ rooms: [], waitingList: [], lastCall: null });
  const [audioEnabled, setAudioEnabled] = useState(false);
  const [currentTime, setCurrentTime] = useState("");
  const [currentDate, setCurrentDate] = useState("");
  const lastCallTimestampRef = useRef(0);

  // Digital Clock
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(
        now.toLocaleTimeString("th-TH", {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
        })
      );
      setCurrentDate(
        now.toLocaleDateString("th-TH", {
          weekday: "long",
          year: "numeric",
          month: "long",
          day: "numeric",
        })
      );
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  // Real-time SSE Connection
  useEffect(() => {
    const evtSource = new EventSource(clientConfig.backend_url + "/queue/stream");

    evtSource.onmessage = (e) => {
      try {
        const raw = JSON.parse(e.data);
        const payload = raw?.payload ?? raw;
        if (payload) {
          setQueueData(payload);

          // Check if there is a new call to announce
          if (
            payload.lastCall &&
            payload.lastCall.timestamp &&
            payload.lastCall.timestamp > lastCallTimestampRef.current
          ) {
            lastCallTimestampRef.current = payload.lastCall.timestamp;
            if (audioEnabled) {
              announceQueue({
                hn: payload.lastCall.hn,
                roomName: payload.lastCall.room_name,
                staffName: payload.lastCall.staff_name,
              });
            }
          }
        }
      } catch (err) {
        console.error("Queue SSE parse error:", err);
      }
    };

    evtSource.onerror = (err) => {
      console.error("Queue SSE error:", err);
    };

    return () => evtSource.close();
  }, [audioEnabled]);

  const handleToggleAudio = async () => {
    if (!audioEnabled) {
      await playHospitalChime();
      setAudioEnabled(true);
    } else {
      setAudioEnabled(false);
    }
  };

  const handleToggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
    } else {
      document.exitFullscreen().catch(() => {});
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 text-slate-800 flex flex-col font-sans select-none">
      {/* Top Header Bar (Clean Hospital Light Theme) */}
      <header className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center shadow-md shadow-emerald-500/20 text-white font-bold text-2xl">
            🩺
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-gray-900 flex items-center gap-2">
              ระบบเรียกคิวผู้รับบริการ
              <span className="text-xs bg-emerald-50 text-emerald-700 border border-emerald-300 px-2.5 py-0.5 rounded-full font-bold">
                Smart Queue
              </span>
            </h1>
            <p className="text-xs text-gray-500">ศูนย์สุขภาพจิตที่ 4 กรมสุขภาพจิต</p>
          </div>
        </div>

        {/* Clock & Controls */}
        <div className="flex items-center gap-6">
          <div className="text-right">
            <div className="text-2xl font-black font-mono tracking-wider text-emerald-600 flex items-center gap-2 justify-end">
              <Clock className="w-5 h-5 text-gray-400" />
              {currentTime || "--:--:--"}
            </div>
            <div className="text-xs text-gray-500 font-medium">{currentDate}</div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleToggleAudio}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all shadow-xs ${
                audioEnabled
                  ? "bg-emerald-600 hover:bg-emerald-700 text-white"
                  : "bg-amber-500 hover:bg-amber-600 text-white animate-pulse"
              }`}
            >
              {audioEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
              {audioEnabled ? "เสียงประกาศ: เปิดอยู่" : "คลิกเพื่อเปิดเสียงประกาศ"}
            </button>

            <button
              onClick={handleToggleFullscreen}
              className="p-2 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-600 border border-gray-200 transition-colors"
              title="เต็มจอ (Fullscreen)"
            >
              <Maximize className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Main Table: Col 1: HN | Col 2: ห้องตรวจ | Col 3: สถานะ */}
      <main className="flex-1 p-6 lg:p-8 flex flex-col justify-start">
        <div className="w-full bg-white rounded-2xl border border-gray-200 shadow-lg overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200 text-gray-700 text-lg md:text-xl font-bold tracking-wide">
                <th className="py-5 px-8 w-2/5 text-center">หมายเลข HN</th>
                <th className="py-5 px-8 w-2/5 text-center">ห้องตรวจ</th>
                <th className="py-5 px-8 w-1/5 text-center">สถานะ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {queueData.rooms && queueData.rooms.length > 0 ? (
                queueData.rooms.map((room) => {
                  const isCalling = room.status === "calling";
                  const isConsulting = room.status === "consulting";
                  const isBreak = room.status === "break";

                  return (
                    <tr
                      key={room.room_no}
                      className={`transition-colors ${
                        isCalling
                          ? "bg-emerald-50/60"
                          : isConsulting
                          ? "bg-gray-50/40"
                          : isBreak
                          ? "bg-gray-50/80"
                          : "hover:bg-gray-50/30"
                      }`}
                    >
                      {/* Column 1: หมายเลข HN */}
                      <td className="py-6 px-8 text-center">
                        {isCalling && room.current_hn ? (
                          <div className="inline-block px-7 py-2.5 rounded-2xl bg-emerald-100/90 border-2 border-emerald-500 text-emerald-700 font-mono text-4xl md:text-6xl font-black tracking-widest animate-pulse shadow-[0_0_30px_rgba(16,185,129,0.35)]">
                            HN {room.current_hn}
                          </div>
                        ) : isConsulting && room.current_hn ? (
                          <div className="inline-block px-7 py-2.5 rounded-2xl bg-gray-100 border border-gray-300 text-gray-500 font-mono text-4xl md:text-6xl font-bold tracking-widest">
                            HN {room.current_hn}
                          </div>
                        ) : isBreak ? (
                          <div className="inline-block px-6 py-2 rounded-2xl bg-gray-100 text-gray-400 font-mono text-3xl md:text-5xl font-bold">
                            -
                          </div>
                        ) : (
                          <div className="text-gray-300 font-mono text-4xl font-bold">-</div>
                        )}
                      </td>

                      {/* Column 2: ห้องตรวจ (บอกแค่ห้อง ไม่ใส่ชื่อเจ้าหน้าที่) */}
                      <td className="py-6 px-8 text-center">
                        <div className="inline-flex items-center gap-3 text-2xl md:text-4xl font-extrabold text-gray-900 tracking-wide">
                          <span>🚪</span>
                          <span>{room.room_name}</span>
                        </div>
                      </td>

                      {/* Column 3: สถานะ (กะพริบเขียว กำลังเรียก / สีเทานิ่ง กำลังตรวจ / สีเทา พัก) */}
                      <td className="py-6 px-8 text-center">
                        {isCalling ? (
                          <span className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-base md:text-lg font-bold bg-emerald-600 text-white animate-bounce shadow-md shadow-emerald-500/30">
                            <span className="w-2.5 h-2.5 rounded-full bg-white animate-ping" />
                            กำลังเรียก..
                          </span>
                        ) : isConsulting ? (
                          <span className="inline-flex items-center gap-2 px-5 py-2 rounded-full text-base md:text-lg font-semibold bg-gray-200 text-gray-600 border border-gray-300">
                            <span className="w-2.5 h-2.5 rounded-full bg-gray-400" />
                            กำลังตรวจ
                          </span>
                        ) : isBreak ? (
                          <span className="inline-flex items-center gap-2 px-5 py-2 rounded-full text-base md:text-lg font-semibold bg-gray-200 text-gray-500 border border-gray-300">
                            ☕ พัก
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-2 px-5 py-2 rounded-full text-base md:text-lg font-semibold bg-gray-100 text-gray-400 border border-gray-200">
                            ว่าง
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={3} className="py-12 text-center text-gray-400 text-lg">
                    กำลังเชื่อมต่อระบบเรียกคิว...
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Bottom Waiting Queue Bar */}
        <div className="mt-6 p-4 rounded-xl bg-white border border-gray-200 shadow-xs flex items-center justify-between text-sm text-gray-600">
          <div className="flex items-center gap-3">
            <span className="font-bold text-gray-800">คิวรอตรวจถัดไป:</span>
            {queueData.waitingList && queueData.waitingList.length > 0 ? (
              <div className="flex items-center gap-2 overflow-x-auto">
                {queueData.waitingList.slice(0, 6).map((item, idx) => (
                  <span
                    key={item.screening_id || idx}
                    className="px-3 py-1 rounded-lg bg-gray-100 text-emerald-700 font-mono font-bold text-xs border border-gray-300"
                  >
                    HN {item.hn}
                  </span>
                ))}
                {queueData.waitingList.length > 6 && (
                  <span className="text-xs text-gray-400 font-medium">
                    +{queueData.waitingList.length - 6} คิว
                  </span>
                )}
              </div>
            ) : (
              <span className="text-gray-400 italic">ไม่มีคิวรอ</span>
            )}
          </div>

          <div className="text-xs text-gray-400">
            ระบบทำงานอัตโนมัติ Real-Time | MSR Smart Queue System
          </div>
        </div>
      </main>
    </div>
  );
}
