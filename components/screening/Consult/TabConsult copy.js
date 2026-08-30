import { useState } from 'react'; // <-- เพิ่ม useState
import { useManagesConsultFormScreening } from '@/hooks/useManagesConsultFormScreening';
import SearchPanelConsult from '@/components/screening/Consult/SearchPanelConsult';
import ConsultingForm from '@/components/screening/Consult/ConsultingForm';
import StressForm from '@/components/screening/Consult/StressForm';
import RiskForm from '@/components/screening/Consult/RiskForm';
import AssistForm from '@/components/screening/Consult/AssistForm';
import FollowForm from '@/components/screening/Consult/FollowForm';
import BtnForm from '@/components/screening/BtnAction/BtnForm';
import Checkbox from '@/components/common/Form/Checkbox';
import Input from '@/components/common/Form/Input';
import Textarea from '@/components/common/Form/Textarea';
import Button from '@/components/common/Form/Button';
import { Monitor, GraduationCap, ListStart, Sparkles } from 'lucide-react';

// *** นำเข้า Server Action ของ AI (แก้ Path ให้ตรงกับที่คุณเก็บไฟล์ไว้) ***
import { analyzeHealthDataAction } from '@/actions/analyze';

export default function TabConsult({ open }) {

  const {
    uiState,
    setUIState,
    personData,
    consultData,
    formData,
    formComplete,
    refs,
    onChangeFormCallback,
    onSelectedSearchCallback,
    onClickBtnCallback,
    resetFormState,
    handleStartConsult,
    handleCloseConsult,
    AlertComponent
  } = useManagesConsultFormScreening();

  // ---------- เพิ่ม State สำหรับ AI Modal ----------
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [showAiModal, setShowAiModal] = useState(false);
  const [aiResult, setAiResult] = useState("");
  const [aiPrompt, setAiPrompt] = useState("");

  // ---------- ฟังก์ชันเมื่อกดปุ่มวิเคราะห์ด้วย AI ----------
  const handleAnalyzeClick = async (e) => {
    e.preventDefault(); // ป้องกัน Form Submit
    setIsAnalyzing(true);
    setShowAiModal(true); // เปิด Modal รอก่อนเลย
    setAiResult("");
    setAiPrompt("");
    
    // เรียกใช้ AI Action โดยส่งแค่ screeningId ตามที่คุณออกแบบไว้
    const result = await analyzeHealthDataAction(uiState.screeningId);
    
    if (result.status === "success") {
      setAiResult(result.data);
      setAiPrompt(result.prompt);
    } else {
      setAiResult("เกิดข้อผิดพลาดในการวิเคราะห์: " + result.message);
      setAiPrompt("ไม่สามารถดึงข้อมูล Prompt ได้");
    }
    
    setIsAnalyzing(false);
  };

  return (
    <>
      <div id="consult-form" className={`step-box ${open ? "open" : ""}`}>
          
          <div className="form-title">
              <h4>
                  <label className="hide-in-modern">📈</label>
                  ตรวจวัดค่าและประเมิน
              </h4>
                <SearchPanelConsult key={uiState.resetKey} onSelectedSearch={onSelectedSearchCallback} />
          </div>
      
          <div className="form-box">
              <div className="flex flex-col sm:flex-row justify-between">
                  <div className="checkbox-group check-is-complete">
                  
                      <Checkbox 
                          type="checkbox"
                          id="isComplete"
                          name="isComplete" 
                          checked={Object.values(formComplete).every(val => val === true)}
                          readOnly
                      />
                      <span >กรอกข้อมูลครบถ้วน</span>
                  
                  </div>
                  <div className="form-group !flex-col sm:!flex-row gap-2 items-left sm:items-center !text-[1rem] !font-bold mr-5">
                      <div>
                          <label htmlFor="title-hn" className="!text-[1rem] !font-bold !mb-0">วันที่ Screening : </label>
                          <label htmlFor="title-hn" className="!text-[1rem] !font-bold !mb-0">{uiState.screeningDate || "-"}</label>
                      </div>
                      <div className="hidden sm:block">|</div>
                      <div>
                          <label htmlFor="title-hn" className="!text-[1rem] !font-bold !mb-0">สถานะ Screening : </label>
                          <label htmlFor="title-hn" className="!text-[1rem] !font-bold !mb-0">{uiState.screeningStatusName || "-"}</label>
                      </div>
                      <div className="hidden sm:block">|</div>
                      <div>
                          <label htmlFor="title-hn" className="!text-[1rem] !font-bold !mb-0">Screening ID : </label>
                          <label htmlFor="title-hn" className="!text-[1rem] !font-bold !mb-0">{uiState.screeningId || "-"}</label>
                      </div>
                      
                  </div>
              </div>
              <form className="form-content">
                    <div className="form-section">
                      <h3>
                          <Monitor className="show-in-modern"/>
                          ข้อมูลเบื้องต้น
                      </h3>

                      <div className="form-grid">

                          <div className="form-group">
                              <label htmlFor="consult_form_hn">HN</label>
                              <Input type="text"
                                  id="consult_form_hn"
                                  name="hn" 
                                  value={personData?.hn || "-"}
                                  readOnly={true}
                              />
                          </div>

                          <div className="form-group">
                              <label htmlFor="consult_form_nameTh">ชื่อ-นามสกุล (ไทย)</label>
                              <Input type="text"
                                  id="consult_form_nameTh"
                                  name="nameTh" 
                                  value={`${personData?.firstname || ""} - ${personData?.lastname || ""}`}
                                  readOnly={true}
                              />
                          </div>

                          <div className="form-group">
                              <label htmlFor="consult_form_nameEn">ชื่อ-นามสกุล (อังกฤษ)</label>
                              <Input type="text"
                                  id="consult_form_nameEn"
                                  name="nameEn" 
                                  value={`${personData?.firstname_en || ""} - ${personData?.lastname_en || ""}`}
                                  readOnly={true}
                              />
                          </div>

                          <div className="form-group">
                              <label htmlFor="consult_form_sex_title">เพศ</label>
                              <Input type="text"
                                  id="consult_form_sex_title"
                                  name="sex_title" 
                                  value={personData?.sex?.title_th || "-"}
                                  readOnly={true}
                              />
                          </div>

                          <div className="form-group">
                              <label htmlFor="consult_form_age">อายุ</label>
                              <Input type="text"
                                  id="consult_form_age"
                                  name="age" 
                                  value={personData?.age || "-"}
                                  readOnly={true}
                              />
                          </div>

                          <div className="form-group">
                              <label htmlFor="consult_form_idcard">เลขประจำตัวประชาชน</label>
                              <Input type="text"
                                  id="consult_form_idcard"
                                  name="idcard" 
                                  value={personData?.idcard || "-"}
                                  readOnly={true}
                              />
                          </div>

                          <div className="form-group">
                              <label htmlFor="consult_form_healthcare_right">สิทธิการรักษาพยาบาล</label>
                              <Input type="text"
                                  id="consult_form_healthcare_right"
                                  name="healthcare_right" 
                                  value={personData?.healthcare_right?.title_th || "-"}
                                  readOnly={true}
                              />
                          </div>

                          <div className="form-group textarea-group">
                              <label htmlFor="consult_form_important_information">ข้อมูลสำคัญ</label>
                              <Textarea  
                                  id="consult_form_important_information"
                                  name="important_information" 
                                  value={personData?.important_information || "-"}
                                  readOnly={true}
                                  rows={1}
                              />
                          </div>
                          
                          <div className="form-grid !gap-3 !w-full justify-end ">

                            {/* ---------- เพิ่มปุ่ม วิเคราะห์ AI ตาม State ที่เพิ่มใน Hook ---------- */}
                              {uiState.showBtnAIConsult &&
                                  <Button 
                                      className={`action-btn ${isAnalyzing ? 'bg-purple-400 border-purple-400' : 'bg-purple-600 border-purple-600 hover:bg-purple-700'} !text-white`} 
                                      onClick={handleAnalyzeClick}
                                      disabled={isAnalyzing}
                                      type="button"
                                  >
                                      {isAnalyzing ? (
                                        <span className="animate-pulse">⏳ กำลังประมวลผล...</span>
                                      ) : (
                                        <>
                                            <Sparkles className="show-in-modern mr-1 w-4 h-4"/>
                                            วิเคราะห์ด้วย AI
                                        </>
                                      )}
                                  </Button>
                              }

                            {uiState.showBtnCloseCase &&
                                <Button className="action-btn outline" onClick={handleCloseConsult}>
                                    <span className="hide-in-modern">📩</span>
                                    <GraduationCap className="show-in-modern"/>
                                    ปิดเคส
                                </Button>
                            }
                            {uiState.showBtnConsult &&
                                <Button className="action-btn outline" onClick={handleStartConsult}>
                                    <span className="hide-in-modern">👨‍⚕️</span>
                                    <ListStart className="show-in-modern"/>
                                    Consult
                                </Button>
                            }
                          </div>
                          
                      
                      </div>
                  </div>
      
                  <div className={`form-section tabConsult ${!uiState.showFormConsult ? "hidden": ""}`}>

                      <div className="steps-nav">
                        
                          <div className={`step-item ${uiState.activeTab === 1 ? "current" : ""}`} data-target="#consult-form"  onClick={()=>setUIState(prev => ({...prev, activeTab: 1}))}>
                              <div className="step-label">
                                  
                                  <h3> 
                                      <Checkbox 
                                          type="checkbox"
                                          id="isCompleteFormAll_ConsultingForm"
                                          name="isCompleteFormAll_ConsultingForm" 
                                          checked={formComplete.ConsultingForm}
                                          readOnly={true}
                                      />
                                      ข้อมูลการให้คำปรึกษา
                                  </h3>
                              </div>
                          </div>
                      
                          <div className={`step-item ${uiState.activeTab === 2 ? "current" : ""}`} data-target="#stress-form"  onClick={()=>setUIState(prev => ({...prev, activeTab: 2}))}>
                              <div className="step-label">
                                  <h3>
                                      <Checkbox 
                                          type="checkbox"
                                          id="isCompleteFormAll_StressForm"
                                          name="isCompleteFormAll_StressForm" 
                                          checked={formComplete.StressForm}
                                          readOnly={true}
                                      />
                                      สาเหตุความเครียด
                                    </h3>
                              </div>
                          </div>
                      
                          <div className={`step-item ${uiState.activeTab === 3 ? "current" : ""}`} data-target="#risk-form"  onClick={()=>setUIState(prev => ({...prev, activeTab: 3}))}>
                              <div className="step-label">
                                  <h3>
                                      <Checkbox 
                                          type="checkbox"
                                          id="isCompleteFormAll_RiskForm"
                                          name="isCompleteFormAll_RiskForm" 
                                          checked={formComplete.RiskForm}
                                          readOnly={true}
                                      />
                                      ความเสี่ยง
                                  </h3>
                              </div>
                          </div>

                          <div className={`step-item ${uiState.activeTab === 4 ? "current" : ""}`} data-target="#assist-form"  onClick={()=>setUIState(prev => ({...prev, activeTab: 4}))}>
                              <div className="step-label">
                                  <h3>
                                      <Checkbox 
                                          type="checkbox"
                                          id="isCompleteFormAll_AssistForm"
                                          name="isCompleteFormAll_AssistForm" 
                                          checked={formComplete.AssistForm}
                                          readOnly={true}
                                      />
                                      การให้ความช่วยเหลือ
                                  </h3>
                              </div>
                          </div>

                          <div className={`step-item ${uiState.activeTab === 5 ? "current" : ""}`} data-target="#follow-form"  onClick={()=>setUIState(prev => ({...prev, activeTab: 5}))}>
                              <div className="step-label">
                                  <h3>
                                      <Checkbox 
                                          type="checkbox"
                                          id="isCompleteFormAll_FollowForm"
                                          name="isCompleteFormAll_FollowForm" 
                                          checked={formComplete.FollowForm}
                                          readOnly={true}
                                      />
                                      การติดตาม
                                  </h3>
                              </div>
                          </div>
                      
                      </div>
                      
                      <div className="step-content">
                          <div id="consult-form" className={`step-box ${uiState.activeTab === 1 ? "open" : ""}`}>
                              
                            <ConsultingForm key={uiState.resetKey} ref={refs.consulting} consultData={consultData} disabledForm={uiState.disabledForm} onChangeFormConsulting={onChangeFormCallback.consulting}/>
                            </div>
                          <div id="stress-form" className={`step-box ${uiState.activeTab === 2 ? "open" : ""}`}>

                              <StressForm key={uiState.resetKey} ref={refs.stress} consultData={consultData} disabledForm={uiState.disabledForm} onChangeFormStress={onChangeFormCallback.stress} />

                          </div>

                          <div id="risk-form" className={`step-box ${uiState.activeTab === 3 ? "open" : ""}`}>

                              <RiskForm key={uiState.resetKey} ref={refs.risk} consultData={consultData} disabledForm={uiState.disabledForm} onChangeFormRisk={onChangeFormCallback.risk} />
                          
                          </div>

                          <div id="assist-form" className={`step-box ${uiState.activeTab === 4 ? "open" : ""}`}>

                              <AssistForm key={uiState.resetKey} ref={refs.assist} consultData={consultData} disabledForm={uiState.disabledForm} onChangeFormAssist={onChangeFormCallback.assist} />
                          
                          </div>

                          <div id="follow-form" className={`step-box ${uiState.activeTab === 5 ? "open" : ""}`}>
                          
                              <FollowForm key={uiState.resetKey} ref={refs.follow} consultData={consultData} disabledForm={uiState.disabledForm} onChangeFormFollow={onChangeFormCallback.follow} />
                          
                          </div>

                      </div>


                      
                  </div>
      
      
      
              </form>
              <BtnForm btnState={uiState.btnState} onClickBtn={onClickBtnCallback} disabledBtn={uiState.disabledBtn} />
          </div>
      
      
      </div>
      {AlertComponent}

      {/* ---------- Modal สำหรับแสดงผล AI Analysis ---------- */}
      {showAiModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex justify-center items-center z-[9999] p-4">
          {/* ขยายความกว้างเป็น max-w-6xl */}
          <div className="bg-white p-6 rounded-xl max-w-6xl w-full max-h-[90vh] flex flex-col shadow-2xl border-t-4 border-purple-600">
            <h3 className="text-xl font-bold mb-4 text-purple-700 flex items-center gap-2">
              <Sparkles className="w-6 h-6"/>
              ระบบประมวลผลข้อมูล AI (Gemini)
            </h3>
            
            {/* แบ่ง 2 คอลัมน์บนจอใหญ่ (md:grid-cols-2) */}
            <div className="flex-grow grid grid-cols-1 md:grid-cols-2 gap-4 min-h-[400px] overflow-hidden">
              
              {/* ---------- ฝั่งซ้าย: Prompt ---------- */}
              <div className="bg-slate-50 p-4 rounded-lg border border-slate-200 flex flex-col overflow-hidden">
                <h4 className="font-bold text-slate-700 mb-3 border-b border-slate-200 pb-2 flex items-center gap-2">
                  <span>📤</span> ข้อมูลที่ส่งให้ AI วิเคราะห์
                </h4>
                <div className="overflow-y-auto flex-grow pr-2">
                  {isAnalyzing ? (
                    <div className="flex items-center justify-center h-full text-slate-400 text-sm animate-pulse">
                      กำลังรวบรวมข้อมูล...
                    </div>
                  ) : (
                    <div className="whitespace-pre-wrap leading-relaxed text-slate-600 text-[0.85rem] font-mono">
                      {aiPrompt}
                    </div>
                  )}
                </div>
              </div>

              {/* ---------- ฝั่งขวา: Response ---------- */}
              <div className="bg-purple-50/30 p-4 rounded-lg border border-purple-100 flex flex-col overflow-hidden">
                <h4 className="font-bold text-purple-800 mb-3 border-b border-purple-200 pb-2 flex items-center gap-2">
                  <span>✨</span> ผลการวิเคราะห์จาก AI
                </h4>
                <div className="overflow-y-auto flex-grow pr-2">
                  {isAnalyzing ? (
                    <div className="flex flex-col items-center justify-center h-full text-slate-500 gap-4 py-10">
                      <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-purple-700"></div>
                      <span className="animate-pulse text-[0.95rem]">AI กำลังวิเคราะห์ข้อมูล โปรดรอสักครู่...</span>
                    </div>
                  ) : (
                    <div className="whitespace-pre-wrap leading-relaxed text-slate-800 text-[0.95rem]">
                      {aiResult}
                    </div>
                  )}
                </div>
              </div>

            </div>

            {/* ---------- ปุ่มปิด ---------- */}
            <div className="mt-5 pt-4 border-t flex justify-end gap-3">
              <button 
                type="button"
                onClick={() => setShowAiModal(false)}
                disabled={isAnalyzing}
                className="bg-slate-800 text-white px-8 py-2.5 rounded-lg hover:bg-slate-700 transition disabled:opacity-50 font-bold shadow-md"
              >
                ปิดหน้าต่าง
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
