// /components/screening/DetailScreening/DetailBioForm.js
'use client';
import { useState, useRef, forwardRef, useImperativeHandle, useMemo } from "react";
import Field from '@/components/common/Form/Field';
import { useBioForm }from "@/hooks/useBioForm";
import { Activity, Brain, BrainCog, HeartPulse, HeartCrack } from 'lucide-react';
import BioReportViewer from '@/components/screening/Bio/BioReportViewer';
const DetailBioForm = forwardRef(({ bioData, isEdit = false, disabledForm = true, onChangeFormBio }, ref) => {

    const {
        formData,
        warnFields,
        gradeFields,
        handleChange,
        handleBlur,
        validateForm
    } = useBioForm( bioData, disabledForm, onChangeFormBio, ".detail-bio-form" );

    useImperativeHandle(ref, () => ({
      validateAndFocus: async () => {
        return validateForm(true);
      },
    }));

  return (
    <>
      <form action="#" className="form-content detail-bio-form">
       
        <div className="form-section !bg-white flex flex-col !gap-5">
            <h3 className='!text-[20px]'>
                📠
                ผลการตรวจ Biofeedback
            </h3>

            <div className=' flex-1 flex flex-wrap gap-3 '>

              <div className="form-group gap-3 !flex-row !justify-start items-center  gap-1">
                                 
                <Field 
                  id="bio_form_not_check_assessments" 
                  name="not_check_assessments" 
                  checked={formData.not_check_assessments}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  warning={warnFields}
                  disabledForm={disabledForm}
                  isEdit={true}
                  component="Checkbox"
                />
                <span className='!text-[16px] !mb-0'>ไม่พบความเสี่ยง </span>

              </div>

              <div className="flex flex-col gap-3 w-full py-3 ">
              
                <span className='!text-[14px]'> สาเหตุ </span>

                <div className="p-5 bg-slate-100 rounded-xl  ">

                  <Field 
                    id="consult_form_cause" 
                    name="cause" 
                    value={formData.cause}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    warning={warnFields}
                    disabledForm={disabledForm || !formData.not_check_assessments}
                    isEdit={isEdit}
                    component="Textarea"
                    placeholder="สาเหตุ" 
                  />

                </div>

              </div>
             
              <div className="flex flex-row justify-between w-full px-5 py-3 bg-slate-100 rounded-lg">

                <div className='flex flex-row items-center justify-center gap-2 '> 

                  <span className='!text-[16px]'><Activity className="stroke-[hsl(var(--primary))]" /> </span>
                  <div className='flex flex-col items-start justify-center  '> 
                    <span className='!text-[18px] font-semibold'> ANS Activity </span>
                    <span className='!text-[16px]'> กิจกรรมของระบบประสาทอัตโนมัติ </span>
                  </div>

                </div>
                <div className='flex flex-row items-center justify-center gap-2 '>

                  <Field 
                      id="bio_form_ans_activity" 
                      name="ans_activity" 
                      value={formData.ans_activity}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      warning={warnFields}
                      disabledForm={disabledForm || formData.not_check_assessments === 1}
                      isEdit={isEdit}
                    />
                    {formData.ans_activity &&
                      <span className={`!text-[18px] text-white px-4 py-1 rounded-full  text-center`}
                        style={{ backgroundColor: gradeFields?.ans_activity?.color || "red" }}
                      > 
                        ( {gradeFields?.ans_activity?.msg || "ค่าประเมิน"} )
                      </span>
                    }       
                </div>
              
              </div>

              <div className="flex flex-row justify-between w-full px-5 py-3 bg-slate-100 rounded-lg">

                <div className='flex flex-row items-center justify-center gap-2 '> 

                  <span className='!text-[16px]'><Activity className="stroke-[hsl(var(--primary))]" /> </span>
                  <div className='flex flex-col items-start justify-center  '> 
                    <span className='!text-[18px] font-semibold'> ANS Balance </span>
                    <span className='!text-[16px]'> ความสมดุลของระบบประสาทอัตโนมัติ </span>
                  </div>

                </div>
                <div className='flex flex-row items-center justify-center gap-2 '>

                  <Field 
                      id="bio_form_ans_balance" 
                      name="ans_balance" 
                      value={formData.ans_balance}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      warning={warnFields}
                      disabledForm={disabledForm || formData.not_check_assessments === 1}
                      isEdit={isEdit}
                    />
                    {formData.ans_balance &&
                      <span className={`!text-[18px] text-white px-4 py-1 rounded-full  text-center`}
                        style={{ backgroundColor: gradeFields?.ans_balance?.color || "red" }}
                      > 
                        ( {gradeFields?.ans_balance?.msg || "ค่าประเมิน"} )
                      </span>
                    }      

                </div>
              
              </div>

              <div className="flex flex-row justify-between w-full px-5 py-3 bg-slate-100 rounded-lg">

              <div className='flex flex-row items-center justify-center gap-2 '> 

                  <span className='!text-[16px]'><Brain className="stroke-[hsl(var(--primary))]" /> </span>
                  <div className='flex flex-col items-start justify-center  '> 
                    <span className='!text-[18px] font-semibold'> Stress Resistance </span>
                    <span className='!text-[16px]'> ความทนทานต่อความเครียด </span>
                  </div>

                </div>
                <div className='flex flex-row items-center justify-center gap-2 '>

                  <Field 
                      id="bio_form_stress_resistance" 
                      name="stress_resistance" 
                      value={formData.stress_resistance}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      warning={warnFields}
                      disabledForm={disabledForm || formData.not_check_assessments === 1}
                      isEdit={isEdit}
                    />
                    {formData.stress_resistance &&
                      <span className={`!text-[18px] text-white px-4 py-1 rounded-full  text-center`}
                        style={{ backgroundColor: gradeFields?.stress_resistance?.color || "red" }}
                      > 
                        ( {gradeFields?.stress_resistance?.msg || "ค่าประเมิน"} )
                      </span>
                    }

                </div>
              
              </div>

              <div className="flex flex-row justify-between w-full px-5 py-3 bg-slate-100 rounded-lg">

                <div className='flex flex-row items-center justify-center gap-2 '> 

                  <span className='!text-[16px]'><Brain className="stroke-[hsl(var(--primary))]" /> </span>
                  <div className='flex flex-col items-start justify-center  '> 
                    <span className='!text-[18px] font-semibold'> Stress Index </span>
                    <span className='!text-[16px]'> ระดับความเครียด </span>
                  </div>

                </div>
                <div className='flex flex-row items-center justify-center gap-2 '>

                  <Field 
                      id="bio_form_stress_index" 
                      name="stress_index" 
                      value={formData.stress_index}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      warning={warnFields}
                      disabledForm={disabledForm || formData.not_check_assessments === 1}
                      isEdit={isEdit}
                    />
                    {formData.stress_index &&
                      <span className={`!text-[18px] text-white px-4 py-1 rounded-full  text-center`}
                        style={{ backgroundColor: gradeFields?.stress_index?.color || "red" }}
                      > 
                        ( {gradeFields?.stress_index?.msg || "ค่าประเมิน"} )
                      </span>
                    }

                </div>
              
              </div>

              <div className="flex flex-row justify-between w-full px-5 py-3 bg-slate-100 rounded-lg">

                <div className='flex flex-row items-center justify-center gap-2 '> 

                  <span className='!text-[16px]'><BrainCog className="stroke-[hsl(var(--primary))]" /> </span>
                  <div className='flex flex-col items-start justify-center  '> 
                    <span className='!text-[18px] font-semibold'> Fatigue Index </span>
                    <span className='!text-[16px]'> ระดับความเครียด </span>
                  </div>

                </div>
                <div className='flex flex-row items-center justify-center gap-2 '>

                  <Field 
                      id="bio_form_fatigue_index" 
                      name="fatigue_index" 
                      value={formData.fatigue_index}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      warning={warnFields}
                      disabledForm={disabledForm || formData.not_check_assessments === 1}
                      isEdit={isEdit}
                    />
                    {formData.fatigue_index &&
                      <span className={`!text-[18px] text-white px-4 py-1 rounded-full  text-center`}
                        style={{ backgroundColor: gradeFields?.fatigue_index?.color || "red" }}
                      > 
                        ( {gradeFields?.fatigue_index?.msg || "ค่าประเมิน"} )
                      </span>
                    }

                </div>
              
              </div>

              <div className="flex flex-row justify-between w-full px-5 py-3 bg-slate-100 rounded-lg">

                <div className='flex flex-row items-center justify-center gap-2 '> 

                  <span className='!text-[16px]'><HeartPulse className="stroke-[hsl(var(--primary))]" /> </span>
                  <div className='flex flex-col items-start justify-center  '> 
                    <span className='!text-[18px] font-semibold'> Mean Heart Rate </span>
                    <span className='!text-[16px]'> อัตราการเต้นของหัวใจเฉลี่ย </span>
                  </div>

                </div>
                <div className='flex flex-row items-center justify-center gap-2 '>

                  <Field 
                      id="bio_form_mean_heart_rate" 
                      name="mean_heart_rate" 
                      value={formData.mean_heart_rate}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      warning={warnFields}
                      disabledForm={disabledForm || formData.not_check_assessments === 1}
                      isEdit={isEdit}
                    />
                    {formData.mean_heart_rate &&
                      <span className={`!text-[18px] text-white px-4 py-1 rounded-full  text-center`}
                        style={{ backgroundColor: gradeFields?.mean_heart_rate?.color || "red" }}
                      > 
                        ( {gradeFields?.mean_heart_rate?.msg || "ค่าประเมิน"} )
                      </span>
                    }

                </div>
              
              </div>

              <div className="flex flex-row justify-between w-full px-5 py-3 bg-slate-100 rounded-lg">

                <div className='flex flex-row items-center justify-center gap-2 '> 

                  <span className='!text-[16px]'><HeartPulse className="stroke-[hsl(var(--primary))]" /> </span>
                  <div className='flex flex-col items-start justify-center  '> 
                    <span className='!text-[18px] font-semibold'> Electro-Cardiac Stability </span>
                    <span className='!text-[16px]'> ความเสถียรของกระแสไฟฟ้าหัวใจ </span>
                  </div>

                </div>
                <div className='flex flex-row items-center justify-center gap-2 '>

                  <Field 
                      id="bio_form_electro_cardiac_stability" 
                      name="electro_cardiac_stability" 
                      value={formData.electro_cardiac_stability}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      warning={warnFields}
                      disabledForm={disabledForm || formData.not_check_assessments === 1}
                      isEdit={isEdit}
                    />
                    {formData.electro_cardiac_stability &&
                      <span className={`!text-[18px] text-white px-4 py-1 rounded-full  text-center`}
                        style={{ backgroundColor: gradeFields?.electro_cardiac_stability?.color || "red" }}
                      > 
                        ( {gradeFields?.electro_cardiac_stability?.msg || "ค่าประเมิน"} )
                      </span>
                    }

                </div>
              
              </div>

              <div className="flex flex-row justify-between w-full px-5 py-3 bg-slate-100 rounded-lg">

                <div className='flex flex-row items-center justify-center gap-2 '> 

                  <span className='!text-[16px]'><HeartCrack className="stroke-[hsl(var(--primary))]" /> </span>
                  <div className='flex flex-col items-start justify-center  '> 
                    <span className='!text-[18px] font-semibold'> Ectopic Beat </span>
                    <span className='!text-[16px]'> การเต้นของหัวใจผิดจังหวะ </span>
                  </div>

                </div>
                <div className='flex flex-row items-center justify-center gap-2 '>

                  <Field 
                      id="bio_form_ectopic_beat" 
                      name="ectopic_beat" 
                      value={formData.ectopic_beat}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      warning={warnFields}
                      disabledForm={disabledForm || formData.not_check_assessments === 1}
                      isEdit={isEdit}
                    />
                    {formData.ectopic_beat &&
                      <span className={`!text-[18px] text-white px-4 py-1 rounded-full  text-center`}
                        style={{ backgroundColor: gradeFields?.ectopic_beat?.color || "red" }}
                      > 
                        ( {gradeFields?.ectopic_beat?.msg || "ค่าประเมิน"} )
                      </span>
                    }

                </div>
              
              </div>

              <div className="flex flex-row justify-between w-full px-5 py-3 bg-slate-100 rounded-lg">

                <div className='flex flex-row items-center justify-center gap-2 '> 

                  <span className='!text-[16px]'><Activity className="stroke-[hsl(var(--primary))]" /> </span>
                  <div className='flex flex-col items-start justify-center  '> 
                    <span className='!text-[18px] font-semibold'> Wave Level </span>
                    <span className='!text-[16px]'> ระดับของสภาวะหลอดเลือด </span>
                  </div>

                </div>
                <div className='flex flex-row items-center justify-center gap-2 '>

                  <Field 
                      id="bio_form_wave_level" 
                      name="wave_level" 
                      value={formData.wave_level}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      warning={warnFields}
                      disabledForm={disabledForm || formData.not_check_assessments === 1}
                      isEdit={isEdit}
                    />
                    {formData.wave_level &&
                      <span className={`!text-[18px] text-white px-4 py-1 rounded-full  text-center`}
                        style={{ backgroundColor: gradeFields?.wave_level?.color || "red" }}
                      > 
                        ( {gradeFields?.wave_level?.msg || "ค่าประเมิน"} )
                      </span>
                    }

                </div>
              
              </div>

              {/* ส่วนแสดงภาพรายงานผลตรวจ Biofeedback (DDR & APG) จากเครื่อง SA-3000P */}
              <BioReportViewer
                screeningId={bioData?.screenings?.screening_id}
                hn={bioData?.hn}
                initialDdrUrl={bioData?.screenings?.biofeedback?.ddr_image_url}
                initialApgUrl={bioData?.screenings?.biofeedback?.apg_image_url}
                isEdit={isEdit}
              />

            </div>

        </div>

      </form>
    </>
  );
});

DetailBioForm.displayName = "DetailBioForm";

export default DetailBioForm;