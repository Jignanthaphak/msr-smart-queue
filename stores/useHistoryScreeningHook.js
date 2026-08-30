// store/useHistoryScreeningHook.js
import { create } from "zustand";
import { gethistoryscreeningbyhn } from "@/services/screening/history";
const useHistoryScreeningHook = create((set, get) => ({

  historyData: null,
  loading: false,
  hn: null,

  setHnHistory: (hn) => set({ hn }),

  getHistoryScreening: async () => {
    const { hn } = get();
    if (!hn) return;
    set({ historyData: null, loading: true });
    try {
      const result = await gethistoryscreeningbyhn(hn);
    
      if (result.ok && result?.data) {
        set({ historyData: result.data });
      }
    } catch (err) {
      console.error(err);
    } finally {
      set({ loading: false });
    }
  },

  clearHistoryScreening: () => {
    set({ historyData: null, hn: null, loading: false });
  },
}));

export default useHistoryScreeningHook;
