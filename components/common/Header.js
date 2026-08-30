"use client"
// /conponents/common/Header.js
import clientConfig from "@/config/Client";
import { useState, useEffect, useRef } from 'react';
import { useRouter } from "next/navigation";
import { User } from 'lucide-react';
import {logoutUser} from '@/services/auth';
import useAuthStore from "@/stores/useAuthStore";
import ButtonTheme from '@/components/common/HeaderSub/ButtonTheme';
import ResetPassModal from "@/components/resetpass/ResetPassModal";
export default function Header() {

    const setStoreLogout = useAuthStore((state) => state.setStoreLogout);
    const user = useAuthStore((state) => state.user);

    const [isOpenResetPass, setIsOpenResetPass] = useState(false);

    const router = useRouter();
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
              
                    <div className="dropdown dropdown-bottom dropdown-center header-btn">
                        <div tabIndex={0} role="button" className="btn m-1"> 
                            <span className="show-in-modern">
                                <User width={20} />
                            </span>
                            <span className="hide-in-modern">👤</span>
                        </div>
                        <ul tabIndex={0} className="dropdown-content menu  rounded-box z-1 w-52 p-2 shadow-sm">
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
                                <button onClick={handleLogout} className="nav-item w-full text-left">
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