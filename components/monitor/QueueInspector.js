// /conponents/monitor/QueueInspector.js
"use client";
import { useState, useEffect  } from "react";
import { Monitor } from 'lucide-react';

export default function QueueInspector({ dataInspector = [], loading = false }) {

    const [dataLog, setDataLog] = useState([])
    const [dataStatic, setDataStatic] = useState({ total: 0, completed: 0, remaining: 0, onBreak: 0 })

    useEffect(() => {
        if (!dataInspector) return;
        
        setDataLog(dataInspector);

        const onBreakCount = dataInspector.filter((item) => Number(item?.is_break) === 1).length;
        const busyCount = dataInspector.filter((item) => Number(item?.is_break) !== 1 && item?.screenings?.length > 0).length;
        const readyCount = dataInspector.filter((item) => Number(item?.is_break) !== 1 && (!item?.screenings || item?.screenings?.length === 0)).length;

        setDataStatic({
            total: dataInspector.length,
            completed: readyCount, // ว่าง
            remaining: busyCount,  // ไม่ว่าง
            onBreak: onBreakCount, // ขอพัก
        });

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
                        {loading && (!dataLog || dataLog.length === 0) ? (
                            <tr>
                                <td colSpan="100%" className="text-center py-3 text-gray-500">
                                    กำลังเชื่อมต่อสถานะห้องตรวจ...
                                </td>
                            </tr>
                        ) : dataLog && dataLog.length > 0 ? (
                            dataLog.map((item, index) => {
                                const isOnBreak = Number(item?.is_break) === 1;
                                const isBusy = !isOnBreak && item?.screenings?.length > 0;
                                return (
                                    <tr key={item?.user_id || index} className="">
                                        <td>
                                            {isOnBreak ? (
                                                <span className="status-badge onbreak">
                                                    ☕ ขอพัก
                                                </span>
                                            ) : isBusy ? (
                                                <span className="status-badge noready">
                                                    ไม่ว่าง
                                                </span>
                                            ) : (
                                                <span className="status-badge current">
                                                    ว่าง
                                                </span>
                                            )}
                                        </td>
                                        <td>
                                            <span className="status-badge">{item?.nickname || "-"}</span>
                                        </td>
                                    </tr>
                                );
                            })
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
                        <span className="summary-value" style={{ color: '#10b981' }}>{dataStatic.completed}</span>
                    </div>
                    <div className="summary-item">
                        <span className="summary-label">ขอพัก:</span>
                        <span className="summary-value" style={{ color: '#f59e0b' }}>{dataStatic.onBreak}</span>
                    </div>
                    <div className="summary-item">
                        <span className="summary-label">ไม่ว่าง:</span>
                        <span className="summary-value" style={{ color: '#ef4444' }}>{dataStatic.remaining}</span>
                    </div>
                </div>
            </div>
        </>
    );

}