// store/useAuthStore.js
import { create } from "zustand";
import { persist } from "zustand/middleware";
import { date, datetime, times, day, nowMs, nowSec, nowDate } from "@/lib/utils/dateFormat";

const useAuthStore = create(
  // persist(
    (set, get) => ({
      isAuthenticated: false,
      expiredAt: null,
      timeoutId: null,
      user: null,
      hasHydrated: false,

      setStoreLogin: (sessionData) => {
        
        clearTimeout(get().timeoutId);

        const user = sessionData;

        const expiredAt = user?.expiredAt || 0;
        const remaining = expiredAt - nowMs();
        get().setLogoutTimeout(remaining);
  
        const csrfToken = sessionData?.csrfToken ?? "";

        if (typeof document !== "undefined") {
          let meta = document.querySelector("meta[name='csrf-token']");
          if (!meta) {
            meta = document.createElement("meta");
            meta.setAttribute("name", "csrf-token");
            document.head.appendChild(meta);
          }
          meta.setAttribute("content", csrfToken);
        }

    
        set({
          isAuthenticated: true,
          timeoutId: null,
          user,
          expiredAt,
          csrfToken
        });

      },

      setStoreLogout: () => {
        clearTimeout(get().timeoutId);

        if (typeof document !== "undefined") {
          const meta = document.querySelector("meta[name='csrf-token']");
          if (meta) {
            meta.setAttribute("content", "");
          }
        }

        set({
          isAuthenticated: false,
          timeoutId: null,
          user: null,
          expiredAt: null,
          csrfToken: null
        });
      },

      setLogoutTimeout: (remaining) => {

        clearTimeout(get().timeoutId);
        const id = setTimeout(() => {
          get().setStoreLogout();
        }, remaining);
        set({ timeoutId: id });
      },

    })
    // ,{
    //   name: "auth-storage",
    //   partialize: (state) => ({
    //     isAuthenticated: state.isAuthenticated,
    //     user: state.user,
    //     expiredAt: state.expiredAt,
    //   }),
    // }
  // ) 
);

export default useAuthStore;
