// /components/screening/Consult/ConsultingForm.js
'use client';
import { forwardRef, useImperativeHandle } from "react";
import Textarea from '@/components/common/Form/Textarea';
import { useConsultFormConsulting } from "@/hooks/useConsultFormConsulting";

const ConsultingForm = forwardRef(({ consultData, disabledForm = true, onChangeFormConsulting }, ref) => {
    const {
        formData,
        warnFields,
        handleChange,
        handleBlur,
        validateForm,
    } = useConsultFormConsulting({ consultData, disabledForm, onChangeFormConsulting });

    useImperativeHandle(ref, () => ({
        validateAndFocus: validateForm,
    }));
    return (
      <>
      
        <div className="form-group textarea-group">
            <label htmlFor="consult_form_consulting">รายละเอียด</label>
            <Textarea  
                id="consult_form_consulting"
                name="consulting" 
                value={formData.consulting}
                onChange={handleChange}
                onBlur={handleBlur}
                warning={warnFields?.consulting}
                readOnly={disabledForm}
                placeholder="" 
                rows={8}
            />
        </div>
        
      </>
    )

});

ConsultingForm.displayName = "ConsultingForm";

export default ConsultingForm;