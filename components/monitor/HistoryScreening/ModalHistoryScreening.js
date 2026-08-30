// /components/screening/Person/ModalListSearchPerson.js "success Refactor Code"
'use client';
import { useState, useEffect, useCallback } from "react";
import { CircleX } from 'lucide-react';
import MovableDialogWrapper from '@/components/common/MovableDialog/MovableDialogWrapper';
import DetailScreeningTab from '@/components/screening/DetailScreening/DetailScreeningTab';
import { gethistoryscreeningbyscreeningid } from "@/services/screening/history";
import { date, datetime, times, day, nowMs, nowSec, nowDate } from "@/lib/utils/dateFormat";

export default function ModalHistoryScreening({ isOpen = false, onClose, screeningId = null}) {

    const [data, setData] = useState(null)
    const [loading, setLoading] = useState(false);
    
    useEffect(() => {

        if (!isOpen) {
            setData(null);
            return;
        }

        if (!screeningId) return;

        const fetchData = async () => {
            setLoading(true);
            try {
                const result = await gethistoryscreeningbyscreeningid(screeningId);

                console.log("history screening:", result);
         
                if (result.ok && result?.data) {
                  
                    setData(result.data);
                }

            } catch (error) {
                console.error("Failed to fetch history screening:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [screeningId, isOpen]);
   
    if (!data) return null;

    return (
        
        <MovableDialogWrapper
            title={`รายละเอียดการตรวจ - HN${data.hn} ${data.firstname} - ${data.lastname} วันที่ ${date(data.screenings.create_date)}`}
            isOpen={isOpen}
            onClose={onClose}
            width={1300}
            height={1000}
        >
            <div className="modal-wrapper">

                <DetailScreeningTab data={data} isEdit={false}/>
               
            </div>
        </MovableDialogWrapper>
    );
}
