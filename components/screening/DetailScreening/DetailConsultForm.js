// /components/screening/DetailScreening/DetailConsultForm.js
'use client';
import { useState, useRef, forwardRef, useImperativeHandle, useMemo } from "react";
import Field from '@/components/common/Form/Field';
import Checkbox from "@/components/common/Form/Checkbox";

import { useConsultFormConsulting }from "@/hooks/useConsultFormConsulting";
import { useConsultFormStress }from "@/hooks/useConsultFormStress";
import { useConsultFormRisk }from "@/hooks/useConsultFormRisk";
import { useConsultFormAssist}from "@/hooks/useConsultFormAssist";
import { useConsultFormFollow}from "@/hooks/useConsultFormFollow";
import { Activity, Brain, BrainCog, HeartPulse, HeartCrack, GraduationCap } from 'lucide-react';

const DetailConsultForm = forwardRef(({ consultData, isEdit = false, disabledForm = true, onChangeFormConsult }, ref) => {

  const {
      formData: formDataConsulting,
      warnFields: warnFieldsConsulting,
      handleChange: handleChangeConsulting,
      handleBlur: handleBlurConsulting,
      validateForm: validateFormConsulting,
  } = useConsultFormConsulting({ consultData, disabledForm, onChangeFormConsulting:onChangeFormConsult?.consulting, containerSelector:".detail-consult-form" });

  const {
    formData: formDataStress,
    warnFields: warnFieldsStress,
    handleChange: handleChangeStress,
    handleBlur: handleBlurStress,
    validateForm: validateFormStress,
    checkboxFieldsStress,
  } = useConsultFormStress({ consultData, disabledForm, onChangeFormStress: onChangeFormConsult?.stress, containerSelector:".detail-consult-form" });

  const {
    formData: formDataRisk,
    warnFields: warnFieldsRisk,
    gradeFields:gradeFieldsRisk,
    handleChange: handleChangeRisk,
    handleBlur: handleBlurRisk,
    validateForm: validateFormRisk,
  } = useConsultFormRisk({ consultData, disabledForm, onChangeFormRisk: onChangeFormConsult?.risk, containerSelector:".detail-consult-form" });

  const {
    formData: formDataAssist,
    warnFields: warnFieldsAssist,
    handleChange: handleChangeAssist,
    handleBlur: handleBlurAssist,
    validateForm: validateFormAssist,
    checkboxFieldsAssist,
  } = useConsultFormAssist({ consultData, disabledForm, onChangeFormAssist: onChangeFormConsult?.assist, containerSelector:".detail-consult-form" });

    const {
    formData: formDataFollow,
    warnFields: warnFieldsFollow,
    handleChange: handleChangeFollow,
    handleBlur: handleBlurFollow,
    validateForm: validateFormFollow,
  } = useConsultFormFollow({ consultData, disabledForm, onChangeFormFollow: onChangeFormConsult?.follow, containerSelector:".detail-consult-form" });


  useImperativeHandle(ref, () => ({
    validateAndFocusSection: async (section) => {
      let isValid = true;
      switch(section){
        case 'consulting':
          isValid = validateFormConsulting(true);
          break;
        case 'stress':
          isValid = validateFormStress(true);
          break;
        case 'risk':
          isValid = validateFormRisk(true);
          break;
        case 'assist':
          isValid = validateFormAssist(true);
          break;
        case 'follow':
          isValid = validateFormFollow(true);
          break;
      }
      return isValid;
    }
  }));

  return (
    <>
      <form action="#" className="form-content detail-consult-form">
        
        <div className="form-section !bg-white flex flex-col !gap-5">
            <h3 className='!text-[20px]'>
                🩺
                ข้อมูลการปรึกษา
            </h3>
            
            <div className=' flex-1 flex flex-wrap gap-3 text-[hsl(var(--primary))]'>
              
              {/* ข้อมูลการให้คำปรึกษา */}
              <div className="flex flex-col gap-3 w-full px-5 py-3 border-b-1 border-b-green-200  ">

                <span className='!text-[16px]'> ข้อมูลการให้คำปรึกษา </span>

                <div className="p-5 bg-slate-100 rounded-xl  ">

                  <Field 
                    id="consult_form_consulting" 
                    name="consulting" 
                    value={formDataConsulting.consulting}
                    onChange={handleChangeConsulting}
                    onBlur={handleBlurConsulting}
                    warning={warnFieldsConsulting}
                    disabledForm={disabledForm }
                    isEdit={isEdit}
                    component="Textarea"
                  />

                </div>

              </div>

              {/* สาเหตุความเครียด */}
              <div className="flex flex-col gap-3 w-full px-5 py-3 border-b-1 border-b-green-200 tooltip tooltip-open" name="stress_alert" data-tip={warnFieldsStress.stress_alert}>

                <span className='!text-[16px]'> สาเหตุความเครียด </span>

                <div className="form-group gap-3 !flex-row !justify-start items-center  gap-1 "  >
                    
                    <Field 
                      id="consult_form_stress_no_check" 
                      name="stress_no_check" 
                      checked={formDataStress.stress_no_check}
                      
                      onChange={handleChangeStress}
                      onBlur={handleBlurStress}
                      warning={warnFieldsStress}
                      disabledForm={disabledForm}
                      isEdit={true}
                      component="Checkbox"
                    />
                    <span className='!text-[16px] !mb-0'> ไม่มีเรื่องเครียดกังวล </span>

                </div>

                <div className="flex flex-wrap gap-3 tooltip " >
                    
                  {checkboxFieldsStress.map(field => (
                      <label key={field.name} className="cursor-pointer tooltip tooltip-close" data-tip={warnFieldsStress?.[field.name]}>
                      
                      <input 
                        type="checkbox"
                        id={field.name}
                        name={field.name}
                        className="hidden peer"
                        value={formDataStress[field.name] ?? ""}
                        checked={formDataStress[field.name] ?? false}
                        onChange={handleChangeStress}
                        onBlur={handleBlurStress}
                        warning={warnFieldsStress?.[field.name]}
                        disabled={disabledForm || formDataStress.stress_no_check === 1}
                      />
                      
                      <span className="px-3 py-1 rounded-full text-sm transition-colors bg-gray-200 text-gray-700 peer-checked:bg-[hsl(var(--primary))] peer-checked:text-white"
                      >
                        {field.label}
                      </span>
                      
                    </label>
                  ))}
                
                </div>

                <span className='!text-[16px]'> อื่นๆ </span>

                <div className="p-5 bg-slate-100 rounded-xl  ">

                  <Field 
                    id="consult_form_stress" 
                    name="stress_other" 
                    value={formDataStress.stress_other}
                    onChange={handleChangeStress}
                    onBlur={handleBlurStress}
                    warning={warnFieldsStress}
                    disabledForm={disabledForm || formDataStress.stress_no_check === 1}
                    isEdit={isEdit}
                    component="Textarea"
                  />

                </div>

              </div>

              {/* ความเสี่ยง */}
              <div className="flex flex-col gap-3 w-full px-5 py-3 border-b-1 border-b-green-200  ">

                <span className='!text-[16px]'> ความเสี่ยง </span>

                <div className="p-5 bg-slate-100 rounded-xl  tooltip tooltip-open" name="risk_alert" data-tip={warnFieldsRisk.risk_alert}>

                  <div className="form-group gap-3 !flex-row !justify-start items-center  gap-1 "  >
                    
                    <Field 
                      id="consult_form_risk_not_found" 
                      name="risk_not_found" 
                      checked={formDataRisk.risk_not_found}
                      
                      onChange={handleChangeRisk}
                      onBlur={handleBlurRisk}
                      warning={warnFieldsRisk}
                      disabledForm={disabledForm}
                      isEdit={true}
                      component="Checkbox"
                    />
                    <span className='!text-[16px] !mb-0'>ไม่พบความเสี่ยง </span>

                  </div>

                  <div className="flex flex-row gap-5 w-full px-5 py-3  rounded-lg">
                  
                    <div className='flex flex-row items-center justify-center gap-2 '> 
                    
                      <div className='flex flex-col items-start justify-center  '> 
                        <span className='!text-[16px]'> แบบประเมินพลังใจ ( RQ ) </span>
                      </div>

                    </div>
                    <div className='flex flex-row items-center justify-center gap-2 '>

                      <Field 
                          id="consult_form_risk_rq" 
                          name="risk_rq" 
                          value={formDataRisk.risk_rq}
                          onChange={handleChangeRisk}
                          onBlur={handleBlurRisk}
                          warning={warnFieldsRisk}
                          disabledForm={disabledForm || formDataRisk.risk_not_found === 1 }
                          isEdit={isEdit}
                        />
                        {formDataRisk.risk_rq &&
                          <span className={`!text-[14px] text-white px-3 py-1 rounded-lg  text-center`}
                            style={{ backgroundColor: gradeFieldsRisk?.risk_rq?.color || "red" }}
                          > 
                            ( {gradeFieldsRisk?.risk_rq?.msg || "ค่าประเมิน"} )
                          </span>
                        }       
                    </div>
                  
                  </div>

                  <div className="flex flex-row gap-5 w-full px-5 py-3  rounded-lg">
                  
                    <div className='flex flex-row items-center justify-center gap-2 '> 
                    
                      <div className='flex flex-col items-start justify-center  '> 
                        <span className='!text-[16px]'> แบบประเมินภาวะหมดไฟ ( Burn Out ) </span>
                      </div>

                    </div>
                    <div className='flex flex-row items-center justify-center gap-2 '>

                      <Field 
                          id="consult_form_risk_burn_out" 
                          name="risk_burn_out" 
                          value={formDataRisk.risk_burn_out}
                          onChange={handleChangeRisk}
                          onBlur={handleBlurRisk}
                          warning={warnFieldsRisk}
                          disabledForm={disabledForm || formDataRisk.risk_not_found === 1 }
                          isEdit={isEdit}
                        />
                        {formDataRisk.risk_burn_out &&
                          <span className={`!text-[14px] text-white px-3 py-1 rounded-lg  text-center`}
                            style={{ backgroundColor: gradeFieldsRisk?.risk_burn_out?.color || "red" }}
                          > 
                            ( {gradeFieldsRisk?.risk_burn_out?.msg || "ค่าประเมิน"} )
                          </span>
                        }       
                    </div>
                  
                  </div>

                  <div className="flex flex-row gap-5 w-full px-5 py-3  rounded-lg">
                  
                    <div className='flex flex-row items-center justify-center gap-2 '> 
                    
                      <div className='flex flex-col items-start justify-center  '> 
                        <span className='!text-[16px]'> แบบประเมินภาวะหมดไฟ ( Burn Out ) </span>
                      </div>

                    </div>
                    <div className='flex flex-row items-center justify-center gap-2 '>

                      <Field 
                          id="consult_form_risk_st5" 
                          name="risk_st5" 
                          value={formDataRisk.risk_st5}
                          onChange={handleChangeRisk}
                          onBlur={handleBlurRisk}
                          warning={warnFieldsRisk}
                          disabledForm={disabledForm || formDataRisk.risk_not_found === 1 }
                          isEdit={isEdit}
                        />
                        {formDataRisk.risk_st5 &&
                          <span className={`!text-[14px] text-white px-3 py-1 rounded-lg  text-center`}
                            style={{ backgroundColor: gradeFieldsRisk?.risk_st5?.color || "red" }}
                          > 
                            ( {gradeFieldsRisk?.risk_st5?.msg || "ค่าประเมิน"} )
                          </span>
                        }       
                    </div>
                  
                  </div>

                  <div className="flex flex-row gap-5 w-full px-5 py-3  rounded-lg">
                  
                    <div className='flex flex-row items-center justify-center gap-2 '> 
                    
                      <div className='flex flex-col items-start justify-center  '> 
                        <span className='!text-[16px]'> แบบคัดกรองซึมเศร้า 2Q+ </span>
                      </div>

                    </div>
                    <div className='flex flex-row items-center justify-center gap-2 '>

                      <Field 
                        id="consult_form_risk_depressed_2qplus_0" 
                        name="risk_depressed_2qplus" 
                        checked={formDataRisk.risk_depressed_2qplus === 1}
                        value={1}
                        onChange={handleChangeRisk}
                        onBlur={handleBlurRisk}
                        warning={warnFieldsRisk}
                        disabledForm={disabledForm || formDataRisk.risk_not_found === 1}
                        isEdit={true}
                        component="Checkbox"
                      />
                      <span className='!text-[16px] !mb-0'>ไม่มี </span>
                    </div>
                    <div className='flex flex-row items-center justify-center gap-2 '>

                      <Field 
                        id="consult_form_risk_depressed_2qplus_1" 
                        name="risk_depressed_2qplus" 
                        checked={formDataRisk.risk_depressed_2qplus === 2}
                        value={2}
                        onChange={handleChangeRisk}
                        onBlur={handleBlurRisk}
                        warning={warnFieldsRisk}
                        disabledForm={disabledForm || formDataRisk.risk_not_found === 1}
                        isEdit={true}
                        component="Checkbox"
                      />
                      <span className='!text-[16px] !mb-0'>มี </span>
                    </div>
                  
                  </div>

                  <div className="flex flex-row gap-5 w-full px-5 py-3  rounded-lg">
                  
                    <div className='flex flex-row items-center justify-center gap-2 '> 
                    
                      <div className='flex flex-col items-start justify-center  '> 
                        <span className='!text-[16px]'> แบบคัดกรองซึมเศร้า 9Q </span>
                      </div>

                    </div>
                    <div className='flex flex-row items-center justify-center gap-2 '>

                      <Field 
                        id="consult_form_risk_depressed_9q_0" 
                        name="risk_depressed_9q" 
                        checked={formDataRisk.risk_depressed_9q === 1}
                        value={1}
                        onChange={handleChangeRisk}
                        onBlur={handleBlurRisk}
                        warning={warnFieldsRisk}
                        disabledForm={disabledForm || formDataRisk.risk_not_found === 1}
                        isEdit={true}
                        component="Checkbox"
                      />
                      <span className='!text-[16px] !mb-0'> ≤7 </span>
                    </div>
                    <div className='flex flex-row items-center justify-center gap-2 '>

                      <Field 
                        id="consult_form_risk_depressed_9q_1" 
                        name="risk_depressed_9q" 
                        checked={formDataRisk.risk_depressed_9q === 2}
                        value={2}
                        onChange={handleChangeRisk}
                        onBlur={handleBlurRisk}
                        warning={warnFieldsRisk}
                        disabledForm={disabledForm || formDataRisk.risk_not_found === 1}
                        isEdit={true}
                        component="Checkbox"
                      />
                      <span className='!text-[16px] !mb-0'> ≥7 </span>
                    </div>
                  
                  </div>

                  

                </div>

              </div>

              {/* การให้ความช่วยเหลือ */}
              <div className="flex flex-col gap-3 w-full px-5 py-3 border-b-1 border-b-green-200 tooltip tooltip-open"  name="assist_alert" data-tip={warnFieldsAssist.assist_alert}>

                <span className='!text-[16px]'> การให้ความช่วยเหลือ </span>
                <div className="flex flex-wrap gap-3 " >
                    
                  {checkboxFieldsAssist.map(field => (
                      <label key={field.name} className="cursor-pointer">
                      <input 
                        type="checkbox"
                        id={field.name}
                        name={field.name}
                        className="hidden peer"
                        value={formDataAssist[field.name] ?? ""}
                        checked={formDataAssist[field.name] ?? false}
                        onChange={handleChangeAssist}
                        onBlur={handleBlurAssist}
                        warning={warnFieldsAssist?.[field.name]}
                        disabled={disabledForm}
                      />
                      <span className="px-3 py-1 rounded-full text-sm transition-colors bg-gray-200 text-gray-700 peer-checked:bg-[hsl(var(--primary))] peer-checked:text-white"
                      >
                        {field.label}
                      </span>
                    </label>
                  ))}
                
                </div>

                <span className='!text-[16px]'> อื่นๆ </span>

                <div className="p-5 bg-slate-100 rounded-xl  ">

                  <Field 
                    id="consult_form_assist_other_detail" 
                    name="assist_other_detail" 
                    value={formDataAssist.assist_other_detail}
                    onChange={handleChangeAssist}
                    onBlur={handleBlurAssist}
                    warning={warnFieldsAssist}
                    disabledForm={disabledForm || !formDataAssist.assist_other}
                    isEdit={isEdit}
                    component="Textarea"
                  />

                </div>

              </div>

              {/* การติดตาม */}
              <div className="flex flex-col gap-3 w-full px-5 py-3 border-b-1 border-b-green-200 ">

                <span className='!text-[16px]'> การติดตาม </span>

                <div className="p-5 bg-slate-100 rounded-xl flex flex-col gap-5 tooltip tooltip-open" name="follow_alert" data-tip={warnFieldsFollow.follow_alert}>

                  <div className="form-group gap-3 !flex-row !justify-start items-center  gap-1">
                    
                    <Field 
                      id="follow_id_1" 
                      name="follow_id" 
                      checked={formDataFollow.follow_id === 1}
                      value={1}
                      onChange={handleChangeFollow}
                      onBlur={handleBlurFollow}
                      warning={warnFieldsFollow}
                      disabledForm={disabledForm}
                      isEdit={true}
                      component="Checkbox"
                    />
                    <span className='!text-[16px] !mb-0'>ปกติ </span>

                  </div>

                  <div className="form-group gap-3 !flex-row !justify-start items-center  gap-1">
                    
                    <Field 
                      id="follow_id_2" 
                      name="follow_id" 
                      checked={formDataFollow.follow_id === 2}
                      value={2}
                      onChange={handleChangeFollow}
                      onBlur={handleBlurFollow}
                      warning={warnFieldsFollow}
                      disabledForm={disabledForm}
                      isEdit={true}
                      component="Checkbox"
                    />
                    <span className='!text-[16px] !mb-0'>ปกติ </span>

                  </div>

                  <div className="form-group gap-3 !flex-row !justify-start items-center  gap-1">
                    
                    <Field 
                      id="follow_id_3" 
                      name="follow_id" 
                      checked={formDataFollow.follow_id === 3}
                      value={3}
                      onChange={handleChangeFollow}
                      onBlur={handleBlurFollow}
                      warning={warnFieldsFollow}
                      disabledForm={disabledForm}
                      isEdit={true}
                      component="Checkbox"
                    />
                    <span className='!text-[16px] !mb-0'>นัดหมาย </span>


                  </div>
                  {formDataFollow.follow_id === 3 && 
                    <ul className="!ml-5 !space-y-3">
                    <li>
                        <div className="">
                            <Field
                              type="datetime-local"
                              id="follow_date"
                              name="follow_date"
                              value={formDataFollow.follow_date}
                              onChange={handleChangeFollow}
                              onBlur={handleBlurFollow}
                              warning={warnFieldsFollow}
                              disabledForm={disabledForm || formDataFollow.follow_id !== 3 }
                              isEdit={isEdit}
                              placeholder="วันเวลานัดหมาย"
                            />
                        </div>
                    </li>
                    <li>
                        <div className="">
                            <Field 
                              id="follow_detail" 
                              name="follow_detail" 
                              value={formDataFollow.follow_detail}
                              onChange={handleChangeFollow}
                              onBlur={handleBlurFollow}
                              warning={warnFieldsFollow}
                              disabledForm={disabledForm || formDataFollow.follow_id !== 3 }
                              isEdit={isEdit}
                              placeholder="รายละเอียด"
                            />
                        </div>
                    </li>
                    <li>
                        <div className="">
                            <Field
                              type="text"
                              id="follow_tel"
                              name="follow_tel"
                              value={formDataFollow.follow_tel}
                              onChange={handleChangeFollow}
                              onBlur={handleBlurFollow}
                              warning={warnFieldsFollow}
                              disabledForm={disabledForm || formDataFollow.follow_id !== 3 }
                              isEdit={isEdit}
                              placeholder="เบอร์โทรติดต่อ"
                            />
                        </div>
                    </li>
                  </ul>
                  }

                  <div className="form-group gap-3 !flex-row !justify-start items-center  gap-1">
                    
                    <Field 
                      id="follow_id_4" 
                      name="follow_id" 
                      checked={formDataFollow.follow_id === 4}
                      value={4}
                      onChange={handleChangeFollow}
                      onBlur={handleBlurFollow}
                      warning={warnFieldsFollow}
                      disabledForm={disabledForm}
                      isEdit={true}
                      component="Checkbox"
                    />
                    <span className='!text-[16px] !mb-0'>ส่งต่อ </span>

                    {formDataFollow.follow_id === 4 && 
                      <>
                        <Field 
                          id="follow_agree" 
                          name="follow_agree" 
                          checked={formDataFollow.follow_agree === 1}
                          onChange={handleChangeFollow}
                          onBlur={handleBlurFollow}
                          warning={warnFieldsFollow}
                          disabledForm={disabledForm}
                          isEdit={true}
                          component="Checkbox"
                        />
                        <span className='!text-[16px] !mb-0'> ยินยอมเปิดเผยข้อมูล </span>
                      </>
                    }

                  </div>
                  {formDataFollow.follow_id === 4 && 
                    <ul className="!ml-5 !space-y-3">
                    <li>
                        <div className="">
                            <Field 
                              id="forward_problem" 
                              name="forward_problem" 
                              value={formDataFollow.forward_problem}
                              onChange={handleChangeFollow}
                              onBlur={handleBlurFollow}
                              warning={warnFieldsFollow}
                              disabledForm={disabledForm || formDataFollow.follow_id !== 4 }
                              isEdit={isEdit}
                              placeholder="ระบุปัญหา" 
                            />
                        </div>
                    </li>
                    <li>
                        <div className="">
                            <Field 
                              id="forward_hospital" 
                              name="forward_hospital" 
                              value={formDataFollow.forward_hospital}
                              onChange={handleChangeFollow}
                              onBlur={handleBlurFollow}
                              warning={warnFieldsFollow}
                              disabledForm={disabledForm || formDataFollow.follow_id !== 4 }
                              isEdit={isEdit}
                              placeholder="หน่วยที่รับส่งต่อ" 
                            />
                        </div>
                    </li>
                    <li>
                        <div className="">
                            <Field 
                              id="forward_how_to_follow" 
                              name="forward_how_to_follow" 
                              value={formDataFollow.forward_how_to_follow}
                              onChange={handleChangeFollow}
                              onBlur={handleBlurFollow}
                              warning={warnFieldsFollow}
                              disabledForm={disabledForm || formDataFollow.follow_id !== 4 }
                              isEdit={isEdit}
                              placeholder="ระบุวิธีติดตาม" 
                            />
                        </div>
                    </li>
                  </ul>
                  }

                </div>

              </div>

            </div>

        </div>

      </form>
    </>
  );
});

DetailConsultForm.displayName = "DetailConsultForm";

export default DetailConsultForm;