
/**
 * useManagesConsultFormDetail
 * High-level hook สำหรับ TabConsult
 * - ใช้ useConsultData เป็น low-level hook
 * - จัดการ UI state, mode, btnState
 * - จัดการ API call: startconsult, closeconsult, updateconsult, patchconsult
 */
export function useManagesConsultFormDetail(data) {

  // ---------- alert ----------
  const { showAlert, AlertComponent } = useAlert();
  // showAlert: ฟังก์ชันเรียก alert / confirm / loading
  // AlertComponent: component สำหรับ render alert

   const formRef = useRef(null)

  // ---------- ใช้ low-level hook ของ form ----------
  const {
    formData,
    formComplete,
    refs,
    validateAndScrollToError,
    onChangeFormCallback,
    setFormData,
    setFormComplete
  } = useConsultData();

  // ---------- initial UI state ----------
  declare interface initialUIStateType {
	useEffect(if: any, data: any, return: any, const: any, clone: any, cloneDeep: any, data: any, null: any, console: any, log: any, useManagesConsultFormDetail: any, clone: any, screenings: any, setConsultData: any, clone: any, screenings: any, null: any, setConsultDataBK: any, clone: any, screenings: any, null: any, setFormData: any, setFormComplete: any, const: any, hn: any, hn: any, null: any, const: any, screeningId: any, screenings: any, screening_id: any, null: any, setUIState: any, prev: any, prev: any, hn: any, screeningId: any, isEdit: any, false: any, disabledForm: any, true: any, disabledBtn: any, false: any, showBtnConsult: any, false: any, showBtnCloseCase: any, false: any, mode: any, waitingsend: any, btnState: any, 9: any, data: any, validate: any, scroll: any, field: any, error: any, const: any, handleValidateAndScroll: any, const: any, ref: any, current: any, if: any, ref: any, return: any, false: any, const: any, sections: any, consulting: any, stress: any, risk: any, assist: any, follow: any, for: any, const: any, section: any, of: any, sections: any): boolean;
}

declare interface payloadType {}
