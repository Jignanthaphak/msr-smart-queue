// store/useDefaultDataStore.js
import { create } from "zustand";
import { getdatadefault } from "@/services/defaultData";

const useDefaultDataStore = create((set) => ({
  defaultData: {},
  loading: true,
  setDefaultData: async () => {
    set({ loading: true });
    try {

      const result = await getdatadefault();
   
      if (typeof result === "object") {
        set({
          defaultData: {
            sex: result?.sex,
            bloodgroup: result?.bloodgroup,
            name_prefixes_th: result?.name_prefixes.filter(item => item.language_id === 1),
            name_prefixes_en: result?.name_prefixes.filter(item => item.language_id === 2),
            provinces: result?.provinces,
            districts: result?.districts,
            subdistricts: result?.subdistricts,
            nationalities: result?.nationalities,
            ethnicities: result?.ethnicities,
            occupations: result?.occupations,
            organizations: result?.organizations,
            healthcare_right: result?.healthcare_right,
            screening_status: result?.screening_status,
            accounts: result?.accounts,
          },
          loading: false,
        });
      } else {
        console.error("Data not object:", data);
        set({ loading: false });
      }
    } catch (err) {
      console.error(err);
      set({ loading: false });
    }
  },
}));

export default useDefaultDataStore;
