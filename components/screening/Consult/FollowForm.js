// /components/screening/Consult/FollowForm.js
'use client';
import { useState, useEffect, useRef, forwardRef, useImperativeHandle  } from "react";
import Checkbox from '@/components/common/Form/Checkbox';
import Input from '@/components/common/Form/Input';
import { useConsultFormFollow } from "@/hooks/useConsultFormFollow";

const FollowForm = forwardRef(({ consultData, disabledForm, onChangeFormFollow }, ref) => {
    
    const { formData, warnFields, handleChange, handleBlur, validateForm } = useConsultFormFollow({ consultData, disabledForm, onChangeFormFollow });

    useImperativeHandle(ref, () => ({ validateAndFocus: validateForm }));

    return (
      <>
      
        <div className="form-grid consult-follow">
                            
            <div className="form-group ">
    
                <div className="follow-section">
                    <div className="follow-title">
                        <div className="follow-check">
                            <Checkbox 
                                type="checkbox"
                                
                                name="follow_id" 
                                checked={formData.follow_id === 1}
                                value={1}
                                onChange={handleChange}
                                onBlur={handleBlur}
                                warning={warnFields?.follow_id}
                                readOnly={disabledForm}
                            />
                            <span>ปกติ</span>
                        </div>
                    </div>
                </div>
    
                <div className="follow-section">
                    <div className="follow-title">
                        <div className="follow-check">
                            <Checkbox 
                                type="checkbox"
                                
                                name="follow_id" 
                                checked={formData.follow_id === 2}
                                value={2}
                                onChange={handleChange}
                                onBlur={handleBlur}
                                warning={warnFields?.follow_id}
                                readOnly={disabledForm}
                            />
                            <span>เฝ้าระวัง</span>
                        </div>
                    </div>
                </div>
    
                <div className="follow-section">
                    <div className="follow-title">
                        <div className="follow-check">
                            <Checkbox 
                                type="checkbox"
                                
                                name="follow_id" 
                                checked={formData.follow_id === 3}
                                value={3}
                                onChange={handleChange}
                                onBlur={handleBlur}
                                warning={warnFields?.follow_id}
                                readOnly={disabledForm}
                            />
                            <span>นัดหมาย</span>
                        </div>
                        
                    </div>
                    <ul className="">
                        <li>
                            <div className="">
                                <Input type="datetime-local"
                                    id="follow_date"
                                    name="follow_date"
                                    classNameTooltip="!w-fit"
                                    value={formData.follow_date}
                                    onChange={handleChange}
                                    onBlur={handleBlur}
                                    warning={warnFields?.follow_date}
                                    readOnly={disabledForm || formData.follow_id !== 3}
                                    placeholder="วันเวลานัดหมาย"
                                />
                            </div>
                        </li>
                        <li>
                            <div className="">
                                <Input type="text"
                                    id="follow_detail"
                                    name="follow_detail" 
                                    classNameTooltip="!w-fit"
                                    value={formData.follow_detail}
                                    onChange={handleChange}
                                    onBlur={handleBlur}
                                    warning={warnFields?.follow_detail}
                                    readOnly={disabledForm || formData.follow_id !== 3}
                                    placeholder="รายละเอียด"
                                />
                            </div>
                        </li>
                        <li>
                            <div className="">
                                <Input type="text"
                                    id="follow_tel"
                                    name="follow_tel"
                                    classNameTooltip="!w-fit"
                                    value={formData.follow_tel}
                                    onChange={handleChange}
                                    onBlur={handleBlur}
                                    warning={warnFields?.follow_tel}
                                    readOnly={disabledForm || formData.follow_id !== 3}
                                    placeholder="เบอร์โทรติดต่อ"
                                />
                            </div>
                        </li>
                    </ul>
                </div>
    
                <div className="follow-section">
                    <div className="follow-title">
                        <div className="follow-check">
                            <Checkbox 
                                type="checkbox"
                                
                                name="follow_id" 
                                checked={formData.follow_id === 4}
                                value={4}
                                onChange={handleChange}
                                onBlur={handleBlur}
                                warning={warnFields?.follow_id}
                                readOnly={disabledForm}
                            />
                            <label>ส่งต่อ</label>

                             <Checkbox 
                                type="checkbox"
                                name="follow_agree" 
                                checked={formData.follow_agree === 1}
                                onChange={handleChange}
                                onBlur={handleBlur}
                                warning={warnFields?.follow_agree}
                                readOnly={disabledForm || formData.follow_id !== 4}
                            />
                            <label>ยินยอมเปิดเผยข้อมูล</label>
                        </div>
                    </div>
                    <ul className="">
                        <li>
                            <div className="">
                                <Input type="text"
                                    id="forward_problem"
                                    name="forward_problem" 
                                       classNameTooltip="!w-fit"
                                    value={formData.forward_problem}
                                    onChange={handleChange}
                                    onBlur={handleBlur}
                                    warning={warnFields?.forward_problem}
                                    readOnly={disabledForm || formData.follow_id !== 4}
                                    placeholder="ระบุปัญหา" 
                                />
                            </div>
                        </li>
                        <li>
                            <div className="">
                                <Input type="text"
                                    id="forward_hospital"
                                    name="forward_hospital" 
                                       classNameTooltip="!w-fit"
                                    value={formData.forward_hospital}
                                    onChange={handleChange}
                                    onBlur={handleBlur}
                                    warning={warnFields?.forward_hospital}
                                    readOnly={disabledForm || formData.follow_id !== 4}
                                    placeholder="หน่วยที่รับส่งต่อ" 
                                />
                            </div>
                        </li>
                        <li>
                            <div className="">
                                <Input type="text"
                                    id="forward_how_to_follow"
                                    name="forward_how_to_follow" 
                                       classNameTooltip="!w-fit"
                                    value={formData.forward_how_to_follow}
                                    onChange={handleChange}
                                    onBlur={handleBlur}
                                    warning={warnFields?.forward_how_to_follow}
                                    readOnly={disabledForm || formData.follow_id !== 4}
                                    placeholder="ระบุวิธีติดตาม" 
                                />
                            </div>
                        </li>
                    </ul>
                </div>

            </div>

        </div>

        <div className="m-auto tooltip tooltip-open " name="follow_alert" data-tip={warnFields.follow_alert}>
         </div>
        
      </>
    )

});

FollowForm.displayName = "FollowForm";

export default FollowForm;