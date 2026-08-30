
/**
 * useManagesBioFormDetail
 * High-level hook สำหรับ TabBio
 * - ใช้ useBioData เป็น low-level hook
 * - จัดการ UI state, mode, btnState
 * - จัดการ API: updatebio, patchbio
 */
export function useManagesBioFormDetail(data) {

  // ----------- alert system -------------
  // ใช้ showAlert เพื่อ popup confirm/alert/loading
  const { showAlert, AlertComponent } = useAlert();

  // ----------- low-level hook for form -------------
  // ใช้ useBioData เป็นตัวจัดการฟอร์ม:
  // - formData: ข้อมูลฟอร์มทั้งหมด
  // - formComplete: boolean ฟอร์มครบไหม
  // - refFormBio: ref ไปยัง form child
  // - onChangeFormBioCallback: callback ให้ child update state
  // - validateAndScrollToError: validate ฟอร์ม + scroll ไปยัง field ที่ error
  const {
    formData, 
    formComplete, 
    refFormBio, 
    onChangeFormBioCallback, 
    validateAndScrollToError
  } = useBioData();

  // ----------- UI state -------------
  // state ควบคุม mode, ปุ่ม, การ disable form, การ reset form
  declare interface initialUIStateType {}
