// /conponents/monitor/MonitorPanel.js
"use client";
import { useState, useEffect  } from "react";
import QueuePerson from '@/components/monitor/QueuePerson';
import QueueInspector from '@/components/monitor/QueueInspector';
import TableHistoryScreening from '@/components/monitor/HistoryScreening/TableHistoryScreening';
import clientConfig from "@/config/Client";

export default function MonitorPanel() {

  const [dataExten, setDataSend] = useState({
    screenings: [],
    inspector: [],
  })

  useEffect(() => {

    const evtSource = new EventSource(clientConfig.backend_url+"/monitor")

    evtSource.onmessage = (e) => {
    
      const raw = JSON.parse(e.data);

      // ถ้าอนาคตอยากใช้ type ("init", "update") ก็ยังดูได้
      const payload = raw?.payload ?? raw;

      console.log("📡 ข้อมูลจาก SSE :", raw);

      setDataSend(prev => ({
        ...prev,
        screenings: payload?.screenings || [],
        inspector: payload?.inspector || [],
      }))
        
    };

    evtSource.onerror = (err) => {
      console.error("SSE error", err);
    };


    return () => evtSource.close()

  }, [])

  return (
    <>
        <div className="card">
            <QueuePerson dataScreening={dataExten.screenings} />
            <QueueInspector dataInspector={dataExten.inspector}/>
            <TableHistoryScreening />
        </div>

    </>
  );
}