// /conponents/monitor/QueueInspector.js
"use client";
import { useState, useEffect  } from "react";
import { Monitor } from 'lucide-react';

export default function QueueInspector({ dataInspector = [] }) {

    const [dataLog, setDataLog] = useState([])
    const [dataStatic, setDataStatic] = useState({ total: 0, completed: 0, remaining: 0 })

     useEffect(() => {

        if(dataInspector.length <= 0) return;
        
        setDataLog(dataInspector)

        setDataStatic(prev => ({
            ...prev,
            total: dataInspector?.length,
            completed: dataInspector.filter((item) => item?.screenings?.length === 0).length,
            remaining: dataInspector.filter((item) => item?.screenings?.length > 0).length,
        }))

    }, [dataInspector])

    return (
        <>
            <div className="card-header">
                <h3 className="card-title">
                    <Monitor className="show-in-modern" />
                    <label className="hide-in-modern">📊</label>
                    Monitor ห้องตรวจ
                </h3>
            </div>
            <div className="card-content">
                <div className="queue-monitor">
                    <table className="queue-table">
                        <thead>
                            <tr>
                                <th>สถานะ</th>
                                <th>ผู้ให้คำปรึกษา</th>
                            </tr>
                        </thead>
                        <tbody>
                        {dataLog && dataLog.length > 0 ? (
                            dataLog?.map((item, index) => (
                                <tr key={index} className="">
                                
                                    <td >
                                        <span className={`status-badge ${item?.screenings?.length > 0 ? "noready": "current"}`}>
                                            {item?.screenings?.length > 0 ? "ไม่ว่าง" : "ว่าง"} 
                                        </span>
                                    </td>
                                    <td>
                                        <span className="status-badge ">{item?.nickname || "-"}</span>
                                    </td>
                                    
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan="100%" className="text-center">ไม่มีข้อมูล</td>
                            </tr>
                        )}
                        </tbody>
                    </table>
            
                    
                </div>
                <div className="queue-summary">
                    <div className="summary-item">
                        <span className="summary-label">ผู้ให้คำปรึกษาทั้งหมด:</span>
                        <span className="summary-value">{dataStatic.total}</span>
                    </div>
                    <div className="summary-item">
                        <span className="summary-label">ว่าง:</span>
                        <span className="summary-value">{dataStatic.completed}</span>
                    </div>
                    <div className="summary-item">
                        <span className="summary-label">ไม่ว่าง:</span>
                        <span className="summary-value">{dataStatic.remaining}</span>
                    </div>
                </div>
            </div>
        </>
    );

}