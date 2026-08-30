// /store/Initial.js
"use client";
import { useEffect } from "react";
import clientConfig from "@/config/Client";
import useAuthStore from "@/stores/useAuthStore";
import useDefaultDataStore from "@/stores/useDefaultDataStore";
import ModalLoginAgain from "@/components/login/LoginModalAgain";
import { usePathname } from "next/navigation";
export default function Initial({ sessionData }) {

  const pathname = usePathname();

  const setStoreLogin = useAuthStore((state) => state.setStoreLogin);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  const setDefaultData = useDefaultDataStore((state) => state.setDefaultData);
  const defaultData = useDefaultDataStore((state) => state.defaultData);
  const loading = useDefaultDataStore((state) => state.loading);

  // เซต sessionData ครั้งแรก (ถ้ามี)
  useEffect(() => {
    if (
      sessionData?.user &&
      sessionData.user.expiredAt > Date.now()
    ) {
      setStoreLogin(sessionData.user);
    }
  }, [sessionData]);

  // รอดูว่า login แล้ว และ defaultData ยังไม่โหลด
  useEffect(() => {

    const hasDefaultData = defaultData && Object.keys(defaultData).length > 0;

    if (isAuthenticated && !hasDefaultData) {
      setDefaultData();
    }
    
  }, [isAuthenticated]);

  const isPageLogin = pathname.startsWith(clientConfig.login_url);

  const isApiRoute = pathname?.startsWith(clientConfig.backend_url+"/");
  if (isApiRoute) return null;
    
  return (
    <ModalLoginAgain isOpen={!isAuthenticated && !isPageLogin}/>
  )
}
