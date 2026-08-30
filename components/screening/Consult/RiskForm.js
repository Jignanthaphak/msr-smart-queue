// /components/screening/Consult/RiskForm.js
'use client';
import { useState, useEffect, useRef, forwardRef, useImperativeHandle  } from "react";
import Checkbox from '@/components/common/Form/Checkbox';
import Input from '@/components/common/Form/Input';
import { useConsultFormRisk } from "@/hooks/useConsultFormRisk";


const RiskForm = forwardRef(({ consultData, disabledForm, onChangeFormRisk }, ref) => {

  const { formData, warnFields, gradeFields, handleChange, handleBlur, validateForm } = useConsultFormRisk({
    consultData,
    disabledForm,
    onChangeFormRisk
  });

  useImperativeHandle(ref, () => ({
    validateAndFocus: validateForm
  }));
    return (
      <>
      
        <div className="form-grid consult-risk">
                                
            <div className="form-group ">
            
                <div className="risk-section">
                    <div className="risk-title">
                        <div className="risk-check">
                            <Checkbox 
                                type="checkbox"
                                id="risk_not_found"
                                name="risk_not_found" 
                           
                                checked={formData.risk_not_found}
                                onChange={handleChange}
                                onBlur={handleBlur}
                                warning={warnFields?.risk_not_found}
                                readOnly={disabledForm}
                            />
                            <label htmlFor="risk_not_found">ไม่พบความเสี่ยง</label>
                        </div>
                    </div>
            
                </div>
            
            </div>
        
            <div className="form-group ">

                <div className="risk-section">
                    <div className="risk-title">
                        <span>แบบประเมินพลังใจ ( RQ )</span>
                    </div>
                    <div className="risk-score">
                        <Input type="text"
                            id="risk_rq"
                            name="risk_rq" 
                            value={formData.risk_rq}
                            onChange={handleChange}
                            onBlur={handleBlur}
                            warning={warnFields?.risk_rq}
                            readOnly={disabledForm || formData.risk_not_found === 1}
                            placeholder="กรอกข้อมูล" 
                        />
                    </div>
                    <div className="risk-grade">
                        <span 
                            style={{ color: gradeFields?.risk_rq?.color ? gradeFields?.risk_rq?.color || "red" : "red" }}
                        >
                            ( {gradeFields?.risk_rq?.msg || "ค่าประเมิน"} )
                        </span>
                    </div>
                
                </div>
                
            </div>

            <div className="form-group ">
            
                <div className="risk-section">
                    <div className="risk-title">
                        <span>แบบประเมินภาวะหมดไฟ ( Burn Out )</span>
                    </div>
                    <div className="risk-score">
                        <Input type="text"
                            id="risk_burn_out"
                            name="risk_burn_out" 
                            value={formData.risk_burn_out}
                            onChange={handleChange}
                            onBlur={handleBlur}
                            warning={warnFields?.risk_burn_out}
                            readOnly={disabledForm || formData.risk_not_found === 1}
                            placeholder="กรอกข้อมูล" 
                        />
                    </div>
                    <div className="risk-grade">
                        <span 
                            style={{ color:  gradeFields?.risk_burn_out?.color ? gradeFields?.risk_burn_out?.color || "red" : "red" }}
                        >
                            ( {gradeFields?.risk_burn_out?.msg || "ค่าประเมิน"} )
                        </span>
                    </div>
            
                </div>
            
            </div>

            <div className="form-group ">
            
                <div className="risk-section">
                    <div className="risk-title">
                        <span>แบบประเมินความเครียด ( ST-5 )</span>
                    </div>
                    <div className="risk-score">
                        <Input type="text"
                            id="risk_st5"
                            name="risk_st5" 
                            value={formData.risk_st5}
                            onChange={handleChange}
                            onBlur={handleBlur}
                            warning={warnFields?.risk_st5}
                            readOnly={disabledForm || formData.risk_not_found === 1}
                            placeholder="กรอกข้อมูล" 
                        />
                    </div>
                    <span 
                         style={{ color:  gradeFields?.risk_st5?.color ? gradeFields?.risk_st5?.color || "red" : "red" }}
                    >
                        ( {gradeFields?.risk_st5?.msg || "ค่าประเมิน"} )
                    </span>
            
                </div>
            
            </div>

            <div className="form-group ">
            
                <div className="risk-section">
                    <div className="risk-title">
                        <label>แบบคัดกรองซึมเศร้า 2Q+</label>
                    </div>
                    <div className="risk-check">
                         <Checkbox 
                            type="checkbox"
                            id="risk_depressed_2qplus_0"
                            name="risk_depressed_2qplus" 
                            checked={formData.risk_depressed_2qplus === 1}
                            value={1}
                            onChange={handleChange}
                            onBlur={handleBlur}
                            warning={warnFields?.risk_depressed_2qplus}
                            readOnly={disabledForm || formData.risk_not_found === 1}
                        />
                        <label htmlFor="risk_depressed_2qplus_0">ไม่มี</label>
                        <Checkbox 
                            type="checkbox"
                            id="risk_depressed_2qplus_1"
                            name="risk_depressed_2qplus" 
                            checked={formData.risk_depressed_2qplus === 2}
                            value={2}
                            onChange={handleChange}
                            onBlur={handleBlur}
                            warning={warnFields?.risk_depressed_2qplus}
                            readOnly={disabledForm || formData.risk_not_found === 1}
                        />
                        <label htmlFor="risk_depressed_2qplus_1">มี</label>
                    </div>
            
                </div>
            
            </div>

            <div className="form-group ">
            
                <div className="risk-section">
                    <div className="risk-title">
                        <label>แบบคัดกรองซึมเศร้า 9Q</label>
                    </div>
                    <div className="risk-check">
                        <Checkbox 
                            type="checkbox"
                            id="risk_depressed_9q_0"
                            name="risk_depressed_9q" 
                            checked={formData.risk_depressed_9q === 1}
                            value={1}
                            onChange={handleChange}
                            onBlur={handleBlur}
                            warning={warnFields?.risk_depressed_9q}
                            readOnly={disabledForm || formData.risk_not_found === 1}
                        />
                        <label htmlFor="risk_depressed_9q_0">≤7</label>
                        <Checkbox 
                            type="checkbox"
                            id="risk_depressed_9q_1"
                            name="risk_depressed_9q" 
                            checked={formData.risk_depressed_9q === 2}
                            value={2}
                            onChange={handleChange}
                            onBlur={handleBlur}
                            warning={warnFields?.risk_depressed_9q}
                            readOnly={disabledForm || formData.risk_not_found === 1}
                        />
                        <label htmlFor="risk_depressed_9q_1">≥7</label>
                    </div>
            
                </div>
            
            </div>

            <div className="form-group ">
            
                <div className="risk-section">
                    <div className="risk-title">
                        <label>แบบประเมินเสี่ยงฆ่าตัวตาย</label>
                    </div>
                    <div className="risk-check">
                        <Checkbox 
                            type="checkbox"
                            id="risk_suicide_0"
                            name="risk_suicide" 
                            checked={formData.risk_suicide === 1}
                            value={1}
                            onChange={handleChange}
                            onBlur={handleBlur}
                            warning={warnFields?.risk_suicide}
                            readOnly={disabledForm || formData.risk_not_found === 1}
                        />
                        <label htmlFor="risk_suicide_0">≤17</label>
                        <Checkbox 
                            type="checkbox"
                            id="risk_suicide_1"
                            name="risk_suicide" 
                            checked={formData.risk_suicide === 2}
                            value={2}
                            onChange={handleChange}
                            onBlur={handleBlur}
                            warning={warnFields?.risk_suicide}
                            readOnly={disabledForm || formData.risk_not_found === 1}
                        />
                        <label htmlFor="risk_suicide_1">≥17</label>
                    </div>
            
                </div>
            
            </div>
            
        
        </div>
        <div className="m-auto tooltip tooltip-open " name="risk_alert" data-tip={warnFields.risk_alert}>
         </div>
        
      </>
    )

});

RiskForm.displayName = "RiskForm";

export default RiskForm;