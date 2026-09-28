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
    <div className="min-h-screen bg-slate-100 text-slate-800 flex flex-col font-sans select-none p-4 md:p-6 lg:p-8">
      {/* Top Header Bar: Separate Floating Card */}
      <header className="w-full bg-white rounded-2xl md:rounded-3xl border border-gray-200 p-5 md:p-6 mb-6 flex flex-wrap items-center justify-between gap-4 shadow-md">
        <div className="flex items-center gap-4">
          <img
            src="/images/Logo-mhc4.png"
            alt="โลโก้ศูนย์สุขภาพจิตที่ 4"
            className="h-16 md:h-20 w-auto max-h-20 object-contain drop-shadow-xs"
            onError={(e) => {
              if (!e.target.dataset.triedImage) {
                e.target.dataset.triedImage = "true";
                e.target.src = "/image/Logo-mhc4.png";
              } else if (!e.target.dataset.triedFallback) {
                e.target.dataset.triedFallback = "true";
                e.target.src = "/images/logo_transparent_cropped.png";
              }
            }}
          />
          <div>
            <h1 className="text-xl md:text-2xl lg:text-3xl font-black tracking-tight text-gray-900 leading-tight">
              ศูนย์สุขภาพจิตที่ 4 กรมสุขภาพจิต กระทรวงสาธารณสุข
            </h1>
            <div className="text-sm md:text-base text-emerald-600 font-extrabold tracking-wide mt-1 flex items-center gap-1.5">
              <span className="text-amber-400 text-base md:text-lg">✨</span>
              <span>ระบบคิวบริการให้การปรึกษาด้านสุขภาพจิต</span>
            </div>
          </div>
        </div>

        {/* Clock & Controls */}
        <div className="flex items-center gap-6">
          <div className="text-right">
            <div className="text-2xl md:text-3xl font-black font-mono tracking-wider text-emerald-600 flex items-center gap-2 justify-end">
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

      {/* Main Table: Col 1: HN | Col 2: ห้องให้คำปรึกษา | Col 3: สถานะ */}
      <main className="flex-1 flex flex-col justify-start">
        <div className="w-full bg-white rounded-2xl md:rounded-3xl border border-gray-200 shadow-lg overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200 text-gray-700 text-lg md:text-xl font-bold tracking-wide">
                <th className="py-5 px-6 w-[36%] text-center whitespace-nowrap">หมายเลข HN</th>
                <th className="py-5 px-6 w-[32%] text-center whitespace-nowrap">ห้องให้คำปรึกษา</th>
                <th className="py-5 px-6 w-[32%] text-center whitespace-nowrap">สถานะ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {(() => {
                // เรียงคิวตามลำดับการเรียก: คิวล่าสุดจะอยู่ล่างสุดเสมอ เพื่อให้คนสนใจบรรทัดสุดท้าย
                const sortedRooms = [...(queueData.rooms || [])].sort((a, b) => {
                  const getPriority = (room) => {
                    if (room.status === "calling") return 2; // เรียกคิวล่าสุด อยู่ล่างสุด
                    if (room.status === "consulting") return 1; // ให้คำปรึกษา อยู่ตรงกลาง
                    return 0; // พัก หรือ ว่าง อยู่ด้านบน
                  };

                  const prioA = getPriority(a);
                  const prioB = getPriority(b);
                  if (prioA !== prioB) {
                    return prioA - prioB;
                  }

                  const timeA = a.called_at ? new Date(a.called_at).getTime() : 0;
                  const timeB = b.called_at ? new Date(b.called_at).getTime() : 0;
                  if (timeA !== timeB) return timeA - timeB;

                  return (a.room_no || 0) - (b.room_no || 0);
                });

                if (sortedRooms.length === 0) {
                  return (
                    <tr>
                      <td colSpan={3} className="py-12 text-center text-gray-400 text-lg">
                        กำลังเชื่อมต่อระบบเรียกคิว...
                      </td>
                    </tr>
                  );
                }

                return sortedRooms.map((room, idx) => {
                  const isCalling = room.status === "calling";
                  const isConsulting = room.status === "consulting";
                  const isBreak = room.status === "break";
                  const isLatestBottomRow = idx === sortedRooms.length - 1;

                  return (
                    <tr
                      key={room.room_no || idx}
                      className={`transition-colors ${
                        isCalling
                          ? "bg-emerald-50/80 border-b-2 border-emerald-500 shadow-xs"
                          : isConsulting
                          ? "bg-gray-50/30"
                          : isBreak
                          ? "bg-gray-50/70"
                          : "hover:bg-gray-50/30"
                      }`}
                    >
                      {/* Column 1: หมายเลข HN (ตัวหนาสีเข้ม อยู่นิ่งไม่กระพริบ ไม่มีกรอบ) */}
                      <td className="py-6 px-6 text-center whitespace-nowrap">
                        {isCalling && room.current_hn ? (
                          <div className="inline-flex items-center justify-center font-mono text-4xl md:text-6xl font-black tracking-wider text-emerald-950 whitespace-nowrap">
                            HN {room.current_hn}
                          </div>
                        ) : isConsulting && room.current_hn ? (
                          <div className="inline-flex items-center justify-center font-mono text-4xl md:text-6xl font-bold tracking-wider text-gray-600 whitespace-nowrap">
                            HN {room.current_hn}
                          </div>
                        ) : isBreak ? (
                          <span className="font-mono text-4xl md:text-5xl font-bold text-gray-400">-</span>
                        ) : (
                          <span className="font-mono text-4xl text-gray-300 font-bold">-</span>
                        )}
                      </td>

                      {/* Column 2: ห้องให้คำปรึกษา (แสดงเป็นตัวเลขห้อง 1, 2, 3 ตามห้องที่เรียก) */}
                      <td className="py-6 px-6 text-center whitespace-nowrap">
                        <div className="inline-flex items-center justify-center font-mono text-5xl md:text-7xl font-black text-gray-800 tracking-tight whitespace-nowrap">
                          {room.room_no || (room.room_name ? room.room_name.replace(/\D/g, "") : "")}
                        </div>
                      </td>

                      {/* Column 3: สถานะ (ป้ายเด้งดึ๋งนำสายตา ไม่ตัดคำ แถวเดียวเสมอ) */}
                      <td className="py-6 px-6 text-center whitespace-nowrap">
                        {isCalling ? (
                          <span className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full text-base md:text-lg font-bold bg-emerald-600 text-white animate-bounce shadow-md shadow-emerald-500/30 whitespace-nowrap">
                            <span className="w-2.5 h-2.5 rounded-full bg-white animate-ping" />
                            กำลังเรียก..
                          </span>
                        ) : isConsulting ? (
                          <span className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full text-base md:text-lg font-bold bg-emerald-100 text-emerald-800 border border-emerald-300 shadow-2xs whitespace-nowrap">
                            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                            ให้คำปรึกษา
                          </span>
                        ) : isBreak ? (
                          <span className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full text-base md:text-lg font-semibold bg-gray-200 text-gray-700 border border-gray-300 whitespace-nowrap">
                            ⏳ ขอเวลาสักครู่
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full text-base md:text-lg font-semibold bg-gray-100 text-gray-400 border border-gray-200 whitespace-nowrap">
                            ว่าง
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                });
              })()}
            </tbody>
          </table>
        </div>

        {/* Bottom Waiting Queue Bar */}
        <div className="mt-6 p-5 rounded-2xl bg-white border border-gray-200 shadow-md flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-4 flex-wrap">
            <span className="text-lg md:text-xl font-extrabold text-gray-900 flex items-center gap-2 whitespace-nowrap">
              <span>⏳</span> คิวรอตรวจถัดไป:
            </span>
            {queueData.waitingList && queueData.waitingList.length > 0 ? (
              <div className="flex items-center gap-3 overflow-x-auto py-1">
                {queueData.waitingList.slice(0, 5).map((item, idx) => (
                  <span
                    key={item.screening_id || idx}
                    className={`px-4 py-2 rounded-xl font-mono font-black text-xl md:text-2xl border shadow-xs transition-all whitespace-nowrap ${
                      item.is_priority
                        ? "bg-emerald-100 text-emerald-900 border-emerald-500 ring-2 ring-emerald-400/50"
                        : "bg-gray-100 text-gray-800 border-gray-300"
                    }`}
                  >
                    HN {item.hn}
                  </span>
                ))}
                {queueData.waitingList.length > 5 && (
                  <span className="text-sm md:text-base text-gray-500 font-semibold px-2 whitespace-nowrap">
                    +{queueData.waitingList.length - 5} คิว
                  </span>
                )}
              </div>
            ) : (
              <span className="text-gray-400 text-base italic">ไม่มีคิวรอ</span>
            )}
          </div>

          <div className="text-xs text-gray-400 whitespace-nowrap hidden lg:block">
            ระบบทำงานอัตโนมัติ Real-Time | MSR Smart Queue System
          </div>
        </div>
      </main>
    </div>
  );
}
