"use client"
// /conponents/common/Header.js
import clientConfig from "@/config/Client";
import { useState, useEffect, useRef } from 'react';
import { useRouter } from "next/navigation";
import { User, Coffee } from 'lucide-react';
import { message } from "antd";
import { logoutUser } from '@/services/auth';
import { getBreakStatus, toggleBreakStatus } from '@/services/monitor';
import useAuthStore from "@/stores/useAuthStore";
import ButtonTheme from '@/components/common/HeaderSub/ButtonTheme';
import ResetPassModal from "@/components/resetpass/ResetPassModal";
export default function Header() {

    const setStoreLogout = useAuthStore((state) => state.setStoreLogout);
    const user = useAuthStore((state) => state.user);

    const [isOpenResetPass, setIsOpenResetPass] = useState(false);
    const [isBreak, setIsBreak] = useState(false);
    const [loadingBreak, setLoadingBreak] = useState(false);

    const router = useRouter();

    useEffect(() => {
        let isMounted = true;
        async function fetchBreakStatus() {
            try {
                const res = await getBreakStatus();
                if (isMounted && res && typeof res.is_break !== "undefined") {
                    setIsBreak(Number(res.is_break) === 1);
                }
            } catch (err) {
                // silent
            }
        }
        if (user?.userId) {
            fetchBreakStatus();
        }
        return () => { isMounted = false; };
    }, [user?.userId]);

    async function handleToggleBreak() {
        if (loadingBreak) return;
        setLoadingBreak(true);
        try {
            const nextStatus = !isBreak;
            const res = await toggleBreakStatus(nextStatus ? 1 : 0);
            if (res && res.success) {
                const activeBreak = Number(res.is_break) === 1;
                setIsBreak(activeBreak);
                if (activeBreak) {
                    message.warning("☕ คุณได้ปรับสถานะห้องตรวจเป็น 'ขอพัก' เรียบร้อยแล้ว (Monitor ห้องตรวจจะแสดงสถานะขอพัก)");
                } else {
                    message.success("🟢 คุณได้ปรับสถานะห้องตรวจเป็น 'พร้อมให้บริการ' เรียบร้อยแล้ว");
                }
            }
        } catch (error) {
            console.error("Toggle break error:", error);
            message.error("เกิดข้อผิดพลาดในการเปลี่ยนสถานะ: " + (error.message || ""));
        } finally {
            setLoadingBreak(false);
        }
    }

    async function handleLogout() {
        try {
          
            await logoutUser();
            await setStoreLogout()
            router.push("/login");
        } catch (error) {
            console.error("Logout failed:", error.message);
        }
    }

    async function handlePageAdmin() {
        router.push("/admin");
    }

    const onClosed = () => {
       setIsOpenResetPass(false)
    };
    const onConfirm = () => {
       setIsOpenResetPass(false)
    };

  return (
    <>
        <header className="header">
            <div className="header-content">

                <div className="header-left">
                    <div className="logo">
                        <div className="logo-icon hide-in-modern">
                            <img className="" src={`${clientConfig.base_path}/images/Logo_msr_top2.png`} alt="" />
                        </div>
                        <span className="logo-text show-in-modern">MENTAL HEALTH SCREENING RECORD - ระบบบริหารจัดการโรงพยาบาล</span>
                    </div>
                </div>

                <div className="header-center">
                   
                </div>

                <div className="header-right ">
              
                    <div className="dropdown dropdown-bottom dropdown-end header-btn">
                        <div 
                            tabIndex={0} 
                            role="button" 
                            className={`btn m-1 transition-all ${isBreak ? "btn-warning border-amber-500 shadow-md" : ""}`}
                            title={isBreak ? "สถานะห้องตรวจ: ขอพัก (คลิกเพื่อเปลี่ยน)" : "บัญชีผู้ใช้งาน"}
                        > 
                            <span className="show-in-modern flex items-center gap-1.5">
                                <User width={20} />
                                {isBreak && (
                                    <span className="inline-flex items-center gap-1 text-xs font-bold text-amber-900 bg-amber-200 px-2 py-0.5 rounded-full border border-amber-400 animate-pulse">
                                        ☕ พัก
                                    </span>
                                )}
                            </span>
                            <span className="hide-in-modern flex items-center gap-1">
                                👤 {isBreak && "☕"}
                            </span>
                        </div>
                        <ul tabIndex={0} className="dropdown-content menu rounded-box z-50 w-60 p-2 shadow-lg bg-base-100 border border-base-200 right-0">
                            {user?.nickName && (
                                <li className="menu-title px-3 py-1.5 text-xs text-gray-500 font-semibold border-b border-base-200 mb-1 flex flex-row items-center justify-between">
                                    <span>ผู้ใช้งาน: {user.nickName}</span>
                                    {isBreak ? (
                                        <span className="text-[10px] bg-amber-100 text-amber-800 px-1.5 py-0.5 rounded font-bold">☕ ขอพัก</span>
                                    ) : (
                                        <span className="text-[10px] bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded font-bold">🟢 พร้อม</span>
                                    )}
                                </li>
                            )}
                            
                            {/* ปุ่มสลับสถานะ ขอพัก / พร้อมให้บริการ */}
                            <li> 
                                <button 
                                    onClick={handleToggleBreak} 
                                    disabled={loadingBreak}
                                    className={`nav-item w-full text-left font-medium flex items-center justify-between py-2 px-3 rounded-lg transition-all ${
                                        isBreak 
                                        ? "bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200" 
                                        : "bg-amber-50 text-amber-800 hover:bg-amber-100 border border-amber-200"
                                    }`}
                                >
                                    <span className="flex items-center gap-2">
                                        <Coffee width={18} className={isBreak ? "text-emerald-600" : "text-amber-600"} />
                                        <span className="font-semibold text-sm">
                                            {isBreak ? "พร้อมให้บริการ" : "ขอพัก (ห้องตรวจ)"}
                                        </span>
                                    </span>
                                    {loadingBreak ? (
                                        <span className="loading loading-spinner loading-xs text-primary"></span>
                                    ) : (
                                        <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full shrink-0 whitespace-nowrap ${
                                            isBreak ? "bg-emerald-200 text-emerald-900" : "bg-amber-200 text-amber-900"
                                        }`}>
                                            {isBreak ? "เข้างาน" : "ขอพัก"}
                                        </span>
                                    )}
                                </button>
                            </li>

                            <div className="divider my-1"></div>

                            {user?.isAdminPanel &&
                            <li>
                                <span onClick={handlePageAdmin} className="nav-item">จัดการ Admin</span>
                            </li>
                            }
                            <li> 
                                <button onClick={()=>{setIsOpenResetPass(true)}} className="nav-item w-full text-left">
                                   เปลี่ยนรหัสผ่าน
                                </button>
                            </li>
                            <li> 
                                <button onClick={handleLogout} className="nav-item w-full text-left text-error">
                                   ออกจากระบบ
                                </button>
                            </li>
                        </ul>
                    </div>
                   

                    {/* <ButtonTheme/> */}
                </div>

            </div>
        </header>
        <ResetPassModal isOpen={isOpenResetPass} onClosed={onClosed} onConfirm={onConfirm}/>
    </>
  );
}