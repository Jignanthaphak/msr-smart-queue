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
    <div className="min-h-screen bg-slate-950 text-white flex flex-col font-sans select-none">
      {/* Top Header Bar */}
      <header className="bg-slate-900 border-b border-slate-800 px-6 py-4 flex items-center justify-between shadow-xl">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-400 flex items-center justify-center shadow-lg shadow-emerald-900/30">
            <Monitor className="w-7 h-7 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-wide text-white flex items-center gap-2">
              ระบบเรียกคิวผู้รับบริการ
              <span className="text-xs bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded-full font-medium">
                Smart Queue
              </span>
            </h1>
            <p className="text-xs text-slate-400">ศูนย์สุขภาพจิตที่ 4 กรมสุขภาพจิต</p>
          </div>
        </div>

        {/* Clock & Controls */}
        <div className="flex items-center gap-6">
          <div className="text-right">
            <div className="text-2xl font-black font-mono tracking-wider text-emerald-400 flex items-center gap-2 justify-end">
              <Clock className="w-5 h-5 text-slate-400" />
              {currentTime || "--:--:--"}
            </div>
            <div className="text-xs text-slate-400">{currentDate}</div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleToggleAudio}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold transition-all ${
                audioEnabled
                  ? "bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-900/30"
                  : "bg-amber-600/80 hover:bg-amber-500 text-white animate-pulse"
              }`}
            >
              {audioEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
              {audioEnabled ? "เสียงประกาศ: เปิดอยู่" : "คลิกเพื่อเปิดเสียงประกาศ"}
            </button>

            <button
              onClick={handleToggleFullscreen}
              className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
              title="เต็มจอ (Fullscreen)"
            >
              <Maximize className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Main Column Grid (Hospital / Bank Display) */}
      <main className="flex-1 p-6 lg:p-8 flex flex-col justify-start">
        <div className="w-full bg-slate-900/80 rounded-2xl border border-slate-800 shadow-2xl overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-800/80 border-b border-slate-700 text-slate-300 text-lg md:text-xl font-bold uppercase tracking-wider">
                <th className="py-5 px-8 w-2/5">ห้องตรวจ / ช่องบริการ</th>
                <th className="py-5 px-8 w-2/5 text-center">หมายเลข HN</th>
                <th className="py-5 px-8 w-1/5 text-right">สถานะ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
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
                          ? "bg-emerald-950/40"
                          : isConsulting
                          ? "bg-slate-900/40"
                          : isBreak
                          ? "bg-amber-950/20"
                          : "hover:bg-slate-800/20"
                      }`}
                    >
                      {/* Room & Staff Column */}
                      <td className="py-6 px-8">
                        <div className="flex items-center gap-4">
                          <span className="text-3xl">🚪</span>
                          <div>
                            <div className="text-2xl md:text-3xl font-bold text-white tracking-wide">
                              {room.room_name}
                            </div>
                            <div className="text-sm md:text-base text-slate-400 font-medium">
                              ผู้ให้คำปรึกษา: {room.staff_name || "-"}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* HN Number Column (Blinking Green on Call, Solid Gray on Consult) */}
                      <td className="py-6 px-8 text-center">
                        {isCalling && room.current_hn ? (
                          <div className="inline-block px-6 py-2 rounded-2xl bg-emerald-500/20 border-2 border-emerald-400 text-emerald-400 font-mono text-4xl md:text-6xl font-black tracking-widest animate-pulse shadow-[0_0_35px_rgba(16,185,129,0.35)]">
                            HN {room.current_hn}
                          </div>
                        ) : isConsulting && room.current_hn ? (
                          <div className="inline-block px-6 py-2 rounded-2xl bg-slate-800/80 border border-slate-700 text-slate-300 font-mono text-4xl md:text-6xl font-bold tracking-widest">
                            HN {room.current_hn}
                          </div>
                        ) : isBreak ? (
                          <div className="text-amber-400/80 font-medium text-2xl tracking-wider">
                            ☕ ขอพักชั่วคราว
                          </div>
                        ) : (
                          <div className="text-slate-600 font-mono text-4xl font-bold">-</div>
                        )}
                      </td>

                      {/* Status Badge Column */}
                      <td className="py-6 px-8 text-right">
                        {isCalling ? (
                          <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-base md:text-lg font-bold bg-emerald-500 text-slate-950 animate-bounce shadow-lg shadow-emerald-500/40">
                            <span className="w-3 h-3 rounded-full bg-slate-950 animate-ping" />
                            กำลังเรียก..
                          </span>
                        ) : isConsulting ? (
                          <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-base md:text-lg font-semibold bg-slate-700 text-slate-300">
                            <span className="w-2.5 h-2.5 rounded-full bg-slate-400" />
                            กำลังตรวจ
                          </span>
                        ) : isBreak ? (
                          <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-base md:text-lg font-semibold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                            ☕ ขอพัก
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-base md:text-lg font-semibold bg-slate-800 text-slate-400 border border-slate-700/60">
                            ว่าง
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={3} className="py-12 text-center text-slate-500 text-lg">
                    กำลังเชื่อมต่อระบบเรียกคิว...
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Bottom Waiting Queue Bar */}
        <div className="mt-6 p-4 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between text-sm text-slate-400">
          <div className="flex items-center gap-3">
            <span className="font-semibold text-slate-300">คิวรอตรวจถัดไป:</span>
            {queueData.waitingList && queueData.waitingList.length > 0 ? (
              <div className="flex items-center gap-2 overflow-x-auto">
                {queueData.waitingList.slice(0, 6).map((item, idx) => (
                  <span
                    key={item.screening_id || idx}
                    className="px-3 py-1 rounded-lg bg-slate-800 text-emerald-400 font-mono font-bold text-xs border border-slate-700"
                  >
                    HN {item.hn}
                  </span>
                ))}
                {queueData.waitingList.length > 6 && (
                  <span className="text-xs text-slate-500">
                    +{queueData.waitingList.length - 6} คิว
                  </span>
                )}
              </div>
            ) : (
              <span className="text-slate-500 italic">ไม่มีคิวรอ</span>
            )}
          </div>

          <div className="text-xs text-slate-500">
            ระบบทำงานอัตโนมัติ Real-Time | MSR Smart Queue System
          </div>
        </div>
      </main>
    </div>
  );
}
