// /conponents/monitor/HistoryScreening.js
"use client";
import { useState } from "react";
import { Monitor } from 'lucide-react';
import useHistoryScreeningHook from "@/stores/useHistoryScreeningHook";
import ModalHistoryScreening from '@/components/monitor/HistoryScreening/ModalHistoryScreening';
import { date, datetime, times, day, nowMs, nowSec, nowDate } from "@/lib/utils/dateFormat";
import {
  CircularProgress,
} from "@mui/material";
export default function TableHistoryScreening() {
    
    const { historyData, loading } = useHistoryScreeningHook();

    const [dataViewModal, setDataViewModal] = useState({
        isOpenModal: false,
        screeningId: null
    })

    const handleClickView = (screeningId) =>{
     
        setDataViewModal(prev => ({
            ...prev,
            isOpenModal: true,
            screeningId: screeningId,
        }))
    }

    const handleCloseView = () =>{
        setDataViewModal(prev => ({
            ...prev,
            isOpenModal: false,
            screeningId: null,
        }))
    }

    return (
        <>
            <div className="card-header">
                <h3 className="card-title">
                    <Monitor className="show-in-modern" />
                    <label className="hide-in-modern">📋</label>
                    History ประวัติการตรวจ
                </h3>

                {/* Search + Filter */}
                <div className="form-grid justify-end mb-3">
                
                
                </div>

            </div>
            <div className="card-content">
                <div className="queue-monitor">
                    <table className="queue-table">
                        <thead>
                            <tr>
                                <th>วันที่</th>
                                <th>เวลาเริ่มตรวจ</th>
                                <th>สถานะ</th>
                                <th>ผู้ให้คำปรึกษา</th>
                                <th>ทำรายการ</th>
                            </tr>
                        </thead>
                        <tbody>

                        {loading ? (
                        
                            <tr>
                                <td colSpan="100%" className="text-center"> <CircularProgress /></td>
                            </tr>

                        ) : historyData && historyData?.screenings.length > 0 ? (
                            historyData.screenings.map((item, index) => (
                            <tr key={index} className="">
                                <td>
                                    {date(item?.create_date)}
                                </td>
                                <td>
                                    {times(item?.create_date)} น.
                                </td>
                                <td>
                                    <span className={`status-badge ${item?.status_id ? `status_${item?.status_id}` : ""}`}>
                                        {item?.screening_status?.status_name || "-"}
                                    </span>
                                </td>
                                <td>{item?.consult?.create_by_account?.nickname || "-"}</td>
                                <td><span className="state-icon " onClick={()=>{handleClickView(item.screening_id)}}>🔍</span></td>
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
            
            </div>

            <ModalHistoryScreening
                isOpen={dataViewModal.isOpenModal}
                screeningId={dataViewModal.screeningId}
                onClose={handleCloseView}
            />
        </>
    );
}