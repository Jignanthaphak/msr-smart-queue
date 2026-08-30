
/**
 * useManagesPersonFormDetail
 * Hook จัดการฟอร์มข้อมูลผู้ป่วย (high-level)
 * - ใช้ usePersonData เป็น low-level hook
 * - handle CRUD, UI state, ปุ่ม
 */
export function useManagesPersonFormDetail(data) {

  const { showAlert, AlertComponent } = useAlert();

  // ----------- low-level hook for form -------------
  const { 
    formData,              // ข้อมูลฟอร์มทั้งหมด
    formComplete,          // boolean ฟอร์มกรอกครบหรือไม่
    refFormPerson,
    onChangeFormPersonCallback, // callback ให้ child update state
    validateAndScrollToError      // validate + scroll ไปยัง error field
  } = usePersonData();

  // ----------- State UI -------------
  declare interface initialUIStateType {
	useEffect(if: any, data: any, return: any, const: any, clone: any, data: any, const: any, hn: any, hn: any, null: any, const: any, screeningId: any, screenings: any, screening_id: any, null: any, setPersonData: any, clone: any, null: any, setPersonDataBK: any, clone: any, null: any, setUIState: any, prev: any, prev: any, hn: any, screeningId: any, isEdit: any, false: any, disabledForm: any, true: any, disabledBtn: any, false: any, mode: any, waitingsend: any, btnState: any, 9: any, data: any, const: any, editPerson: any, try: any, const: any, isCheck: any, validateAndScrollToError: any, if: any, isCheck: any, return: any, const: any, confirm: any, showAlert: any, title: any, message: any, icon: any, warning: any, type: any, confirm: any, duration: any, 500: any, loadingStyle: any, modal: any, confirmText: any, cancelText: any, if: any, confirm: any, return: any, setUIState: any, prev: any, prev: any, disabledForm: any, true: any, disabledBtn: any, true: any, const: any, payload: {	}, const: any, result: any, editPersonAction: any, payload: any, if: any, result: any, ok: any): void;
}
