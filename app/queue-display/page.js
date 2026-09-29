// app/queue-display/page.js
"use client";
import React, { useState, useEffect, useRef } from "react";
import clientConfig from "@/config/Client";
import { announceQueue, playHospitalChime } from "@/lib/utils/queueAudio";
import { Maximize, Clock } from "lucide-react";

export default function QueueDisplayPage() {
  const [queueData, setQueueData] = useState({ rooms: [], waitingList: [], lastCall: null });
  const [audioEnabled, setAudioEnabled] = useState(false);
  const audioEnabledRef = useRef(false);
  const [currentTime, setCurrentTime] = useState("");
  const [currentDate, setCurrentDate] = useState("");
  const lastCallTimestampRef = useRef(0);

  useEffect(() => {
    audioEnabledRef.current = audioEnabled;
  }, [audioEnabled]);

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

  const updateFromPayload = (payload) => {
    if (!payload) return;
    setQueueData(payload);

    // Check if there is a new call to announce
    if (
      payload.lastCall &&
      payload.lastCall.timestamp &&
      payload.lastCall.timestamp > lastCallTimestampRef.current
    ) {
      lastCallTimestampRef.current = payload.lastCall.timestamp;
      if (audioEnabledRef.current) {
        announceQueue({
          hn: payload.lastCall.hn,
          roomName: payload.lastCall.room_name,
          staffName: payload.lastCall.staff_name,
          basePath: clientConfig?.base_path || "/msr",
        });
      }
    }
  };

  const fetchQueueData = async () => {
    try {
      const res = await fetch(`${clientConfig.backend_url}/queue/state`);
      if (res.ok) {
        const data = await res.json();
        if (data && data.success) {
          updateFromPayload(data);
        }
      }
    } catch (err) {
      // Network hiccup - ignore
    }
  };

  // 1) Initial fetch and 3s Polling fallback (Ensures TV screen stays fresh even if SSE drops)
  useEffect(() => {
    fetchQueueData();
    const interval = setInterval(fetchQueueData, 3000);
    return () => clearInterval(interval);
  }, []);

  // 2) Real-time SSE Connection
  useEffect(() => {
    let evtSource = null;
    try {
      evtSource = new EventSource(clientConfig.backend_url + "/queue/stream");

      evtSource.onmessage = (e) => {
        try {
          const raw = JSON.parse(e.data);
          const payload = raw?.payload ?? raw;
          if (payload) {
            updateFromPayload(payload);
          }
        } catch (err) {
          console.error("Queue SSE parse error:", err);
        }
      };

      evtSource.onerror = (err) => {
        console.error("Queue SSE error:", err);
      };
    } catch (err) {
      console.error("Failed to initialize SSE:", err);
    }

    return () => {
      if (evtSource) {
        evtSource.close();
      }
    };
  }, []);

  const ensureAudioEnabled = async () => {
    if (!audioEnabled) {
      try {
        await playHospitalChime();
        setAudioEnabled(true);
      } catch (_) {}
    }
  };

  const handleToggleFullscreen = () => {
    ensureAudioEnabled();
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
    } else {
      document.exitFullscreen().catch(() => {});
    }
  };

  return (
    <div
      onClick={ensureAudioEnabled}
      className="min-h-screen bg-slate-100 text-slate-800 flex flex-col font-sans select-none p-4 md:p-6 lg:p-8"
    >
      {/* Top Header Bar: Single Horizontal Row, Never Wraps, Logo scaled to room number height */}
      <header className="w-full bg-white rounded-2xl md:rounded-3xl border border-gray-200 py-3.5 px-5 md:py-4 md:px-6 mb-4 md:mb-5 flex items-center justify-between gap-4 md:gap-6 shadow-sm">
        <div className="flex items-center gap-3.5 md:gap-4.5 min-w-0">
          <img
            src={`${(clientConfig?.base_path !== undefined && clientConfig?.base_path !== null) ? clientConfig.base_path : "/msr"}/images/logo-MOPH.png`}
            alt="ตรากระทรวงสาธารณสุข"
            className="h-16 md:h-[68px] lg:h-[72px] w-auto max-h-[72px] shrink-0 object-contain drop-shadow-xs"
            onError={(e) => {
              const bp = (clientConfig?.base_path !== undefined && clientConfig?.base_path !== null) ? clientConfig.base_path : "/msr";
              if (!e.target.dataset.tried1) {
                e.target.dataset.tried1 = "true";
                e.target.src = `${bp}/image/logo-MOPH.png`;
              } else if (!e.target.dataset.tried2) {
                e.target.dataset.tried2 = "true";
                e.target.src = `${bp}/logo-MOPH.png`;
              } else if (!e.target.dataset.tried3) {
                e.target.dataset.tried3 = "true";
                e.target.src = "/images/logo-MOPH.png";
              } else if (!e.target.dataset.tried4) {
                e.target.dataset.tried4 = "true";
                e.target.src = "/logo-MOPH.png";
              } else if (!e.target.dataset.tried5) {
                e.target.dataset.tried5 = "true";
                e.target.src = `${bp}/images/Logo_msr_top2.png`;
              }
            }}
          />
          <div className="min-w-0">
            <h1 className="text-lg md:text-xl lg:text-2xl xl:text-[26px] font-black tracking-tight text-gray-900 leading-snug whitespace-nowrap">
              ศูนย์สุขภาพจิตที่ 4 กรมสุขภาพจิต กระทรวงสาธารณสุข
            </h1>
            <div className="text-sm md:text-base lg:text-lg text-emerald-600 font-extrabold tracking-wide mt-1 flex items-center gap-2 whitespace-nowrap">
              <span className="text-amber-400 text-base md:text-lg">✨</span>
              <span>ระบบคิวบริการให้การปรึกษาด้านสุขภาพจิต</span>
            </div>
          </div>
        </div>

        {/* Clock & Controls (Right-aligned, never wraps, compact for TV) */}
        <div className="flex items-center gap-3 shrink-0 ml-auto">
          <div className="text-right whitespace-nowrap">
            <div className="text-base md:text-lg lg:text-xl font-black font-mono tracking-normal text-emerald-600 flex items-center gap-1.5 justify-end">
              <Clock className="w-4 h-4 text-emerald-600/80 shrink-0" />
              <span>{currentTime || "--:--:--"}</span>
            </div>
            <div className="text-[10px] md:text-xs text-gray-400 font-medium mt-0.5">{currentDate}</div>
          </div>

          <button
            onClick={handleToggleFullscreen}
            className="p-1.5 md:p-2 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-500 border border-gray-200 transition-colors shadow-2xs shrink-0"
            title="เต็มจอ (Fullscreen)"
          >
            <Maximize className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Main Grid: Left 5/6 Table Card | Right 1/6 Waiting Queue Card */}
      <main className="flex-1 grid grid-cols-1 lg:grid-cols-6 gap-6 items-stretch">
        {/* Left: Main Calling Table Card (5/6 width) */}
        <div className="lg:col-span-5 bg-white rounded-2xl md:rounded-3xl border border-gray-200 shadow-lg overflow-hidden flex flex-col justify-between">
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
                  const isWalkinBeforeCall = room.status === "walkin_before_call" || room.is_walkin_before_call;
                  const isBreak = room.status === "break";
                  const isLatestBottomRow = idx === sortedRooms.length - 1;

                  return (
                    <tr
                      key={room.room_no || idx}
                      className={`transition-colors ${
                        isCalling
                          ? "bg-emerald-50/80 border-b-2 border-emerald-500 shadow-xs"
                          : isConsulting || isWalkinBeforeCall
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
                        ) : (isConsulting || isWalkinBeforeCall) && room.current_hn ? (
                          <div className="flex flex-col items-center justify-center">
                            <div className="inline-flex items-center justify-center font-mono text-4xl md:text-6xl font-bold tracking-wider text-gray-600 whitespace-nowrap">
                              HN {room.current_hn}
                            </div>
                            {isWalkinBeforeCall && (
                              <div className="text-xs md:text-sm text-gray-400 font-medium tracking-normal mt-1 whitespace-nowrap">
                                เข้าห้องก่อนการเรียกคิว
                              </div>
                            )}
                          </div>
                        ) : (
                          <span className="font-mono text-4xl md:text-5xl font-bold text-gray-400">-</span>
                        )}
                      </td>

                      {/* Column 2: ห้องให้คำปรึกษา (แสดงเป็นตัวเลขห้อง 1, 2, 3 ตามห้องที่เรียก) */}
                      <td className="py-6 px-6 text-center whitespace-nowrap">
                        <div className="inline-flex items-center justify-center font-mono text-5xl md:text-7xl font-black text-gray-800 tracking-tight whitespace-nowrap">
                          {room.room_no || (room.room_name ? room.room_name.replace(/\D/g, "") : "")}
                        </div>
                      </td>

                      {/* Column 3: สถานะ (ป้ายขนาดเท่ากันทุกสถานะ ไม่ตัดคำ แถวเดียวเสมอ: มีแค่ 3 สถานะเท่านั้น) */}
                      <td className="py-6 px-6 text-center whitespace-nowrap">
                        {isCalling ? (
                          <span className="inline-flex items-center justify-center gap-2 w-48 md:w-52 h-12 rounded-full text-base md:text-lg font-bold bg-emerald-600 text-white animate-bounce shadow-md shadow-emerald-500/30 whitespace-nowrap">
                            <span className="w-2.5 h-2.5 rounded-full bg-white animate-ping" />
                            กำลังเรียก..
                          </span>
                        ) : (isConsulting || isWalkinBeforeCall) ? (
                          <span className="inline-flex items-center justify-center gap-2 w-48 md:w-52 h-12 rounded-full text-base md:text-lg font-bold bg-emerald-100 text-emerald-800 border border-emerald-300 shadow-2xs whitespace-nowrap">
                            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                            ให้คำปรึกษา
                          </span>
                        ) : (
                          <span className="inline-flex items-center justify-center gap-2 w-48 md:w-52 h-12 rounded-full text-base md:text-lg font-semibold bg-gray-200 text-gray-700 border border-gray-300 whitespace-nowrap">
                            ⏳ ขอเวลาสักครู่
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

        {/* Right: Waiting Queue Card (1/6 width) */}
        <div className="lg:col-span-1 bg-white rounded-2xl md:rounded-3xl border border-gray-200 shadow-lg p-4 md:p-5 flex flex-col justify-between">
          <div>
            {/* Header: คิวถัดไป : (ฟอนต์ใหญ่ขึ้นตามที่ลูกรักต้องการ) */}
            <div className="flex items-center gap-2 pb-3 mb-4 border-b border-gray-200">
              <span className="text-xl">⏳</span>
              <h2 className="text-base md:text-lg xl:text-xl font-black text-gray-800 whitespace-nowrap">
                คิวถัดไป :
              </h2>
            </div>

            {queueData.waitingList && queueData.waitingList.length > 0 ? (
              <div className="flex flex-col gap-2.5">
                {queueData.waitingList.slice(0, 6).map((item, idx) => (
                  <div
                    key={item.screening_id || idx}
                    className="py-2.5 px-2 rounded-xl font-mono font-black text-center text-lg xl:text-xl border shadow-xs transition-all whitespace-nowrap bg-gray-50 hover:bg-gray-100 text-gray-800 border-gray-200"
                  >
                    HN {item.hn}
                  </div>
                ))}
                {queueData.waitingList.length > 6 && (
                  <div className="text-center py-2 text-xs md:text-sm text-gray-500 font-bold bg-gray-50 rounded-xl border border-dashed border-gray-300 whitespace-nowrap">
                    +{queueData.waitingList.length - 6} คิว
                  </div>
                )}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center text-gray-400 text-sm py-10 italic">
                <span>🌿</span>
                <span className="mt-1">ไม่มีคิวรอ</span>
              </div>
            )}
          </div>

          <div className="mt-4 pt-3 border-t border-gray-100 text-[10px] text-gray-400 text-center whitespace-nowrap">
            Real-Time Queue
          </div>
        </div>
      </main>
    </div>
  );
}
