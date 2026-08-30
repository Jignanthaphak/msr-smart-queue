// /components/screening/Consult/StressForm.js
'use client';
import { forwardRef, useImperativeHandle } from "react";
import Checkbox from '@/components/common/Form/Checkbox';
import Textarea from '@/components/common/Form/Textarea';
import { useConsultFormStress } from "@/hooks/useConsultFormStress";

const StressForm = forwardRef(({ consultData, disabledForm = true, onChangeFormStress }, ref) => {
  const {
    formData,
    warnFields,
    handleChange,
    handleBlur,
    validateForm,
    checkboxFieldsStress,
  } = useConsultFormStress({ consultData, disabledForm, onChangeFormStress });

  useImperativeHandle(ref, () => ({
    validateAndFocus: validateForm,
  }));

  return (

    <div className="form-grid consult-stress " >

       <div className="form-group ">
                  
          <div className="stress-section">
              <div className="stress-title">
                  <div className="stress-check">
                      <Checkbox 
                          type="checkbox"
                          id="stress_no_check"
                          name="stress_no_check" 
                          checked={formData.stress_no_check}
                          onChange={handleChange}
                          onBlur={handleBlur}
                          warning={warnFields?.stress_no_check}
                          readOnly={disabledForm}
                      />
                      <label htmlFor="stress_no_check">ไม่มีเรื่องเครียดกังวล</label>
                  </div>
              </div>
      
          </div>
      
      </div>

     <div className="check-list">
        {checkboxFieldsStress.map(field => (
          <div key={field.name} className="form-group">
            <label htmlFor={field.name}>{field.label}</label>
            <Checkbox
              type="checkbox"
              id={field.name}
              name={field.name}
              checked={formData[field.name]}
              onChange={handleChange}
              onBlur={handleBlur}
              warning={warnFields?.[field.name]}
              readOnly={disabledForm || formData.stress_no_check === 1}
            />
          </div>
        ))}
     </div>

      <div className="form-group textarea-group">
        <label htmlFor="stress_other">อื่นๆ</label>
        <Textarea
          id="stress_other"
          name="stress_other"
          value={formData.stress_other}
          onChange={handleChange}
          onBlur={handleBlur}
          warning={warnFields?.stress_other}
          readOnly={disabledForm || formData.stress_no_check === 1}
          placeholder=""
          rows={5}
        />
      </div>
      <div className="m-auto tooltip tooltip-open" name="stress_alert" data-tip={warnFields.stress_alert}>
      </div>
    </div>

  );
});

StressForm.displayName = "StressForm";
export default StressForm;
