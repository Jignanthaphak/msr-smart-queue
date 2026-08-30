// /conponents/monitor/QueuePerson.js
"use client";
import { useState, useEffect } from "react";
import { Monitor } from 'lucide-react';
import useDefaultDataStore from "@/stores/useDefaultDataStore";
import { date, datetime, times, day, nowMs, nowSec, nowDate } from "@/lib/utils/dateFormat";
import Input from '@/components/common/Form/Input';
import Select from '@/components/common/Form/Select';
export default function QueuePerson({dataScreening = []}) {

    const defaultData = useDefaultDataStore((state) => state.defaultData)   

    const [dataLog, setDataLog] = useState([])
    const [dataStatic, setDataStatic] = useState({ total: 0, completed: 0, remaining: 0 })
 
    const [searchText, setSearchText] = useState("");
    const [filterStatus, setFilterStatus] = useState("");

    const [filteredData, setFilteredData] = useState([]);

    useEffect(() => {

        if(dataScreening.length <= 0) return;
        
        setDataLog(dataScreening)

        setDataStatic(prev => ({
            ...prev,
            total: dataScreening.length,
            completed: dataScreening.filter((item) => item?.status_id === 4 || item?.status_id === 5).length,
            remaining: dataScreening.filter((item) => item?.status_id !== 4 && item?.status_id !== 5).length,
        }))

    }, [dataScreening])

    // Filter & search data
    useEffect(() => {

        let temp = [...dataLog];

        // filter status
        if (filterStatus !== "") {
            temp = temp.filter(item => String(item.status_id) === String(filterStatus));
        }

        // search
        if (searchText.trim()) {
            const lowerSearch = searchText.toLowerCase();
            temp = temp.filter(item => {
                const hn = String(item?.person?.hn || "");
                const name = `${item?.person?.name_prefixes?.title || ""} ${item?.person?.firstname || ""} ${item?.person?.lastname || ""}`;
                const time = times(item?.update_date) || "";
                const consultant = item?.create_by_account?.nickname || "";

                return (
                    hn.toLowerCase().includes(lowerSearch) ||
                    name.toLowerCase().includes(lowerSearch) ||
                    time.toLowerCase().includes(lowerSearch) ||
                    consultant.toLowerCase().includes(lowerSearch)
                );
            });
        }

        setFilteredData(temp);

    }, [dataLog, searchText, filterStatus]);

    const setName = (data) => {
        
        const name_prefixes = data?.person?.name_prefixes?.title || "-"
        const firstname = data?.person?.firstname || "-"
        const lastname = data?.person?.lastname || "-"
        
        return name_prefixes+" "+firstname + " - " +lastname
    }

  return (
    <>
        <div className="card-header">
            <h3 className="card-title">
                <Monitor className="show-in-modern" />
                <label className="hide-in-modern">📊</label>
                Monitor คิวการตรวจ
            </h3>

            {/* Search + Filter */}
            <div className="form-grid justify-end mb-3">
                <div className="form-group">
                    <span >ค้นหา</span>
                    <Input type="text"
                        name="searchText" 
                        value={searchText}
                        className={`w-full`}
                        placeholder="ค้นหา HN, ชื่อ, เวลา, ผู้ให้คำปรึกษา..." 
                        onChange={e => setSearchText(e.target.value)}
                    />
                </div>
                 <div className="form-group">
                    <span >สถานะ</span>
                    <Select 
                        name="filterStatus" 
                        value={filterStatus}
                        placeholder="สถานะทั้งหมด" 
                        className={`form-input w-full`}
                        onChange={e => setFilterStatus(e.target.value)}
                        options={defaultData?.screening_status}
                        optionValue = "status_id" 
                        optionLabel = "status_name" 
                    />
                </div>
            </div>

        </div>
        <div className="card-content">
            <div className="queue-monitor">
                <table className="queue-table">
                    <thead>
                        <tr>
                            <th>สถานะ</th>
                            <th>HN</th>
                            <th>ชื่อ-นามสกุล</th>
                            <th>เวลา</th>
                            <th>ผู้ให้คำปรึกษา</th>
                        </tr>
                    </thead>
                    <tbody>
                    {filteredData && filteredData.length > 0 ? (
                        filteredData.map((item, index) => (
                            <tr key={index} className="">
                            <td>
                                <span className={`status-badge ${item?.status_id ? `status_${item?.status_id}` : ""}`}>
                                    {item?.screening_status?.status_name || "-"}
                                </span>
                            </td>
                            <td><span className="queue-number">{item?.person?.hn || "-"}</span></td>
                            <td>{setName(item)}</td>
                            <td>
                                {times(item?.update_date)} น.
                            </td>
                            <td>{item?.create_by_account?.nickname || "-"}</td>
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
                    <span className="summary-label">ส่งตรวจทั้งหมด:</span>
                    <span className="summary-value">{dataStatic.total}</span>
                </div>
                <div className="summary-item">
                    <span className="summary-label">เสร็จแล้ว:</span>
                    <span className="summary-value">{dataStatic.completed}</span>
                </div>
                <div className="summary-item">
                    <span className="summary-label">เหลือ:</span>
                    <span className="summary-value">{dataStatic.remaining}</span>
                </div>
            </div>
        </div>
    </>
  );
}