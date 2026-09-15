import { useState } from 'react';
import { useManagesConsultFormScreening } from '@/hooks/useManagesConsultFormScreening';
import SearchPanelConsult from '@/components/screening/Consult/SearchPanelConsult';
import ConsultingForm from '@/components/screening/Consult/ConsultingForm';
import StressForm from '@/components/screening/Consult/StressForm';
import RiskForm from '@/components/screening/Consult/RiskForm';
import AssistForm from '@/components/screening/Consult/AssistForm';
import FollowForm from '@/components/screening/Consult/FollowForm';
import PdxForm from '@/components/screening/Consult/PdxForm';
import SatisfactionForm from '@/components/screening/Consult/SatisfactionForm';
import BtnForm from '@/components/screening/BtnAction/BtnForm';
import Checkbox from '@/components/common/Form/Checkbox';
import Input from '@/components/common/Form/Input';
import Textarea from '@/components/common/Form/Textarea';
import Button from '@/components/common/Form/Button';
import { Monitor, GraduationCap, ListStart } from 'lucide-react';

import BtnAnalyzeAI from '@/components/screening/Consult/BtnAnalyzeAI';
import AiAnalysisModal from '@/components/screening/Consult/AiAnalysisModal';

const ALL_FORM_KEYS = [
  'ConsultingForm',
  'StressForm',
  'RiskForm',
  'AssistForm',
  'FollowForm',
  'PdxForm',
  'SatisfactionForm',
];

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

  const [showAiModal, setShowAiModal] = useState(false);

  const completedCount = ALL_FORM_KEYS.filter(key => Boolean(formComplete?.[key])).length;
  const isAllComplete = completedCount === ALL_FORM_KEYS.length;

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
                          checked={isAllComplete}
                          readOnly
                      />
                      <span>กรอกข้อมูลครบถ้วน ({completedCount}/7)</span>
                  
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

                              <BtnAnalyzeAI
                                  showBtnAIConsult={uiState.showBtnAIConsult}
                                  formComplete={formComplete}
                                  onClick={() => setShowAiModal(true)}
                              />

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
                                          checked={Boolean(formComplete?.ConsultingForm)}
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
                                          checked={Boolean(formComplete?.StressForm)}
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
                                          checked={Boolean(formComplete?.RiskForm)}
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
                                          checked={Boolean(formComplete?.AssistForm)}
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
                                          checked={Boolean(formComplete?.FollowForm)}
                                          readOnly={true}
                                      />
                                      การติดตาม
                                  </h3>
                              </div>
                          </div>

                          <div className={`step-item ${uiState.activeTab === 6 ? "current" : ""}`} data-target="#pdx-form"  onClick={()=>setUIState(prev => ({...prev, activeTab: 6}))}>
                              <div className="step-label">
                                  <h3>
                                      <Checkbox 
                                          type="checkbox"
                                          id="isCompleteFormAll_PdxForm"
                                          name="isCompleteFormAll_PdxForm" 
                                          checked={Boolean(formComplete?.PdxForm)}
                                          readOnly={true}
                                      />
                                      รหัส PDx
                                  </h3>
                              </div>
                          </div>

                          <div className={`step-item ${uiState.activeTab === 7 ? "current" : ""}`} data-target="#satisfaction-form"  onClick={()=>setUIState(prev => ({...prev, activeTab: 7}))}>
                              <div className="step-label">
                                  <h3>
                                      <Checkbox 
                                          type="checkbox"
                                          id="isCompleteFormAll_SatisfactionForm"
                                          name="isCompleteFormAll_SatisfactionForm" 
                                          checked={Boolean(formComplete?.SatisfactionForm)}
                                          readOnly={true}
                                      />
                                      ความพึงพอใจ
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

                          <div id="pdx-form" className={`step-box ${uiState.activeTab === 6 ? "open" : ""}`}>
                          
                              <PdxForm key={uiState.resetKey} ref={refs.pdx} consultData={consultData} disabledForm={uiState.disabledForm} onChangeFormPdx={onChangeFormCallback.pdx} />
                          
                          </div>

                          <div id="satisfaction-form" className={`step-box ${uiState.activeTab === 7 ? "open" : ""}`}>
                          
                              <SatisfactionForm key={uiState.resetKey} ref={refs.satisfaction} consultData={consultData} disabledForm={uiState.disabledForm} onChangeFormSatisfaction={onChangeFormCallback.satisfaction} />
                          
                          </div>

                      </div>

                  </div>
      
              </form>
              <BtnForm btnState={uiState.btnState} onClickBtn={onClickBtnCallback} disabledBtn={uiState.disabledBtn} />
          </div>
      
      </div>
      {AlertComponent}

      {/* ---------- Modal วิเคราะห์ด้วย AI (Dashboard) ---------- */}
      <AiAnalysisModal
        isOpen={showAiModal}
        onClose={() => setShowAiModal(false)}
        screeningId={uiState.screeningId}
        consultData={formData}
      />
    </>
  )
}