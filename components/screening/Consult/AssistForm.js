// /components/screening/Consult/AssistForm.js
'use client';
import { useState, useEffect, useRef, forwardRef, useImperativeHandle  } from "react";
import Checkbox from '@/components/common/Form/Checkbox';
import Textarea from '@/components/common/Form/Textarea';
import { useConsultFormAssist } from "@/hooks/useConsultFormAssist";

const AssistForm = forwardRef(({ consultData, disabledForm, onChangeFormAssist }, ref) => {

    const { formData, warnFields, handleChange, handleBlur, validateForm, checkboxFieldsAssist } = useConsultFormAssist({ consultData, disabledForm, onChangeFormAssist });

    useImperativeHandle(ref, () => ({ validateAndFocus: validateForm }));

    return (
      <>
      
        <div className="form-grid consult-assist">
                            
            <div className="form-group ">
                {checkboxFieldsAssist.map(field => (
                    <div key={field.name} className="assist-section">
                        <div className="assist-title">
                            <div className="assist-check">
                                <Checkbox 
                                    type="checkbox"
                                    id={field.name}
                                    name={field.name}
                                    checked={formData[field.name]}
                                    onChange={handleChange}
                                    onBlur={handleBlur}
                                    warning={warnFields?.[field.name]}
                                    readOnly={disabledForm}
                                />
                                <label htmlFor={field.name}>{field.label}</label>
                            </div>
                        </div>
                    </div>
                ))}
             
            </div>

            <div className="form-group textarea-group">

                <div className="assist-section">
                    <Textarea  
                        id="assist_other_detail"
                        name="assist_other_detail" 
                        value={formData.assist_other_detail}
                        onChange={handleChange}
                        onBlur={handleBlur}
                        warning={warnFields?.assist_other_detail}
                        readOnly={disabledForm || !formData.assist_other}
                        placeholder="กรอกรายละเอียด" 
                        rows={3}
                    />
                </div>
                
              
            </div>
    
        </div>
          <div className="m-auto tooltip tooltip-open " name="assist_alert" data-tip={warnFields.assist_alert}>
         </div>
        
      </>
    )

});

AssistForm.displayName = "AssistForm";

export default AssistForm;