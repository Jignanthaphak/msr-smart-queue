// /components/screening/Bio/FormBio.js
'use client';
import clientConfig from "@/config/Client";
import { forwardRef, useImperativeHandle, useMemo } from "react";
import { Monitor, Image as ImageIcon } from 'lucide-react';
import Input from '@/components/common/Form/Input';
import Textarea from '@/components/common/Form/Textarea';
import Checkbox from '@/components/common/Form/Checkbox';
import { useBioForm } from '@/hooks/useBioForm';
import BioReportViewer from '@/components/screening/Bio/BioReportViewer';

const FormBio = forwardRef(({ bioData, disabledForm = true, onChangeFormBio }, ref) => {
   
    const {
        formData,
        warnFields,
        gradeFields,
        handleChange,
        handleBlur,
        validateForm
    } = useBioForm(bioData, disabledForm, onChangeFormBio );

    useImperativeHandle(ref, () => ({
        validateAndFocus: validateForm,
    }));

    return (
      
      <>
        <form className="form-content">
            <div className="form-section">
                <h3>
                    <Monitor className="show-in-modern"/>
                    ข้อมูลเบื้องต้น
                </h3>

                <div className="form-grid">

                    <div className="form-group">
                        <label htmlFor="bio_form_hn">HN</label>
                        <Input type="text"
                            id="bio_form_hn"
                            name="hn" 
                            value={bioData?.hn || "-"}
                            readOnly={true}
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="bio_form_nameTh">ชื่อ-นามสกุล (ไทย)</label>
                        <Input type="text"
                            id="bio_form_nameTh"
                            name="nameTh" 
                            value={`${bioData?.firstname || ""} - ${bioData?.lastname || ""}`}
                            readOnly={true}
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="bio_form_nameEn">ชื่อ-นามสกุล (อังกฤษ)</label>
                        <Input type="text"
                            id="bio_form_nameEn"
                            name="nameEn" 
                            value={`${bioData?.firstname_en || ""} - ${bioData?.lastname_en || ""}`}
                            readOnly={true}
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="bio_form_sex_title">เพศ</label>
                        <Input type="text"
                            id="bio_form_sex_title"
                            name="sex_title" 
                            value={bioData?.sex?.title_th || "-"}
                            readOnly={true}
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="bio_form_age">อายุ</label>
                        <Input type="text"
                            id="bio_form_age"
                            name="age" 
                            value={bioData?.age || "-"}
                            readOnly={true}
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="bio_form_idcard">เลขประจำตัวประชาชน</label>
                        <Input type="text"
                            id="bio_form_idcard"
                            name="idcard" 
                            value={bioData?.idcard || "-"}
                            readOnly={true}
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="bio_form_healthcare_right">สิทธิการรักษาพยาบาล</label>
                        <Input type="text"
                            id="bio_form_healthcare_right"
                            name="healthcare_right" 
                            value={bioData?.healthcare_right?.title_th || "-"}
                            readOnly={true}
                        />
                    </div>

                    <div className="form-group textarea-group">
                        <label htmlFor="bio_form_important_information">ข้อมูลสำคัญ</label>
                        <Textarea  
                            id="bio_form_important_information"
                            name="important_information" 
                            value={formData.important_information}
                            onChange={handleChange}
                            onBlur={handleBlur}
                            warning={warnFields?.important_information}
                            readOnly={disabledForm}
                            placeholder="" 
                            rows={1}
                        />
                    </div>
                
                </div>
            </div>

            <div className="form-section">
                
                <div className="form-grid bio">

                    <div className="form-group ">
                        <div className="checkbox-group">
                             <Checkbox 
                                type="checkbox"
                                id="bio_form_not_check_assessments"
                                name="not_check_assessments" 
                                checked={formData.not_check_assessments}
                                onChange={handleChange}
                                onBlur={handleBlur}
                                warning={warnFields?.not_check_assessments}
                                readOnly={disabledForm}
                            />
                            <label htmlFor="bio_form_not_check_assessments">ไม่ตรวจประเมิน Biofeedback เนื่องจาก :</label>
                        </div>
                        <Textarea  
                            id="bio_form_cause"
                            name="cause" 
                            value={formData.cause}
                            onChange={handleChange}
                            onBlur={handleBlur}
                            warning={warnFields?.cause}
                            readOnly={disabledForm || !formData.not_check_assessments}
                            placeholder="สาเหตุ" 
                            rows={1}
                        />
                    </div>

                    <div className="form-group bio-group">
                        <img className="" src={`${clientConfig.base_path}/images/ans.jpg`} alt="" />
                        <div className="bio-list">
                            <div className="bio-section">
                                <div className="bio-title">
                                    <span>ANS Activity</span>
                                    <span>(การทำงานของระบบประสาทอัตโนมัติ)</span>
                                </div>
                                <div className="bio-score">
                                    <Input type="text"
                                        id="bio_form_ans_activity"
                                        name="ans_activity" 
                                        value={formData.ans_activity}
                                        onChange={handleChange}
                                        onBlur={handleBlur}
                                        warning={warnFields?.ans_activity}
                                        readOnly={disabledForm || formData.not_check_assessments === 1}
                                        placeholder="ANS Activity" 
                                    />
                                </div>
                                <div className={`bio-grade`}>
                                    <span className={`bio-grade`}
                                        style={{ color: gradeFields?.ans_activity?.color || "red" }}
                                    >
                                        ( {gradeFields?.ans_activity?.msg || "ค่าประเมิน"} )
                                    </span>
                                </div>
                            </div>
                            <div className="bio-section">
                                <div className="bio-title">
                                    <span>ANS Balance</span>
                                    <span>(ความสมดุลของระบบประสาทอัตโนมัต)</span>
                                </div>
                                <div className="bio-score">
                                    <Input type="text"
                                        id="bio_form_ans_balance"
                                        name="ans_balance" 
                                        value={formData.ans_balance}
                                        onChange={handleChange}
                                        onBlur={handleBlur}
                                        warning={warnFields?.ans_balance}
                                        readOnly={disabledForm || formData.not_check_assessments === 1}
                                        placeholder="ANS Balance" 
                                    />
                                </div>

                                <div className={`bio-grade`}>
                                    <span className={`bio-grade`}
                                        style={{ color: gradeFields?.ans_balance?.color || "red" }}
                                    >
                                        ( {gradeFields?.ans_balance?.msg || "ค่าประเมิน"} )
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="form-group bio-group">
                        <img className="" src={`${clientConfig.base_path}/images/stress.jpg`} alt="" />
                        <div className="bio-list">
                            <div className="bio-section">
                                <div className="bio-title">
                                    <span>Stress Resistance</span>
                                    <span>(ความทนทานต่อความเครียด)</span>
                                </div>
                                <div className="bio-score">
                                    <Input type="text"
                                        id="bio_form_stress_resistance"
                                        name="stress_resistance" 
                                        value={formData.stress_resistance}
                                        onChange={handleChange}
                                        onBlur={handleBlur}
                                        warning={warnFields?.stress_resistance}
                                        readOnly={disabledForm || formData.not_check_assessments === 1}
                                        placeholder="Stress Resistance" 
                                    />
                                </div>
                                <div className={`bio-grade`}>
                                    <span className={`bio-grade`}
                                        style={{ color: gradeFields?.stress_resistance?.color || "red" }}
                                    >
                                        ( {gradeFields?.stress_resistance?.msg || "ค่าประเมิน"} )
                                    </span>
                                </div>
                    
                            </div>
                            <div className="bio-section">
                                <div className="bio-title">
                                    <span>Stress Index</span>
                                    <span>(ระดับความเครียด)</span>
                                </div>
                                <div className="bio-score">
                                    <Input type="text"
                                        id="bio_form_stress_index"
                                        name="stress_index" 
                                        value={formData.stress_index}
                                        onChange={handleChange}
                                        onBlur={handleBlur}
                                        warning={warnFields?.stress_index}
                                        readOnly={disabledForm || formData.not_check_assessments === 1}
                                        placeholder="Stress Index" 
                                    />
                                </div>
                                <div className={`bio-grade`}>
                                    <span className={`bio-grade`}
                                        style={{ color: gradeFields?.stress_index?.color || "red" }}
                                    >
                                        ( {gradeFields?.stress_index?.msg || "ค่าประเมิน"} )
                                    </span>
                                </div>
                            </div>
                            <div className="bio-section">
                                <div className="bio-title">
                                    <span>Fatigue Index</span>
                                    <label>(ระดับความเหนื่อยล้า)</label>
                                </div>
                                <div className="bio-score">
                                    <Input type="text"
                                        id="bio_form_fatigue_index"
                                        name="fatigue_index" 
                                        value={formData.fatigue_index}
                                        onChange={handleChange}
                                        onBlur={handleBlur}
                                        warning={warnFields?.fatigue_index}
                                        readOnly={disabledForm || formData.not_check_assessments === 1}
                                        placeholder="Fatigue Index" 
                                    />
                                </div>
                                <div className={`bio-grade`}>
                                    <span className={`bio-grade`}
                                        style={{ color: gradeFields?.fatigue_index?.color || "red" }}
                                    >
                                        ( {gradeFields?.fatigue_index?.msg || "ค่าประเมิน"} )
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="form-group bio-group">
                        <img className="" src={`${clientConfig.base_path}/images/heart.jpg`} alt="" />
                        <div className="bio-list">
                            <div className="bio-section">
                                <div className="bio-title">
                                    <span>Mean Heart Rate</span>
                                    <span>(อัตราการเต้นของหัวใจเฉลี่ย)</span>
                                </div>
                                <div className="bio-score">
                                   <Input type="text"
                                        id="bio_form_mean_heart_rate"
                                        name="mean_heart_rate" 
                                        value={formData.mean_heart_rate}
                                        onChange={handleChange}
                                        onBlur={handleBlur}
                                        warning={warnFields?.mean_heart_rate}
                                        readOnly={disabledForm || formData.not_check_assessments === 1}
                                        placeholder="Mean Heart Rate" 
                                    />
                                </div>
                                <div className={`bio-grade`}>
                                    <span className={`bio-grade`}
                                        style={{ color: gradeFields?.mean_heart_rate?.color || "red" }}
                                    >
                                        ( {gradeFields?.mean_heart_rate?.msg || "ค่าประเมิน"} )
                                    </span>
                                </div>
                            </div>
                            <div className="bio-section">
                                <div className="bio-title">
                                    <span>Electro-Cardiac Stability</span>
                                    <span>(ความเสถียรของกระแสไฟฟ้าหัวใจ)</span>
                                </div>
                                <div className="bio-score">
                                    <Input type="text"
                                        id="bio_form_electro_cardiac_stability"
                                        name="electro_cardiac_stability" 
                                        value={formData.electro_cardiac_stability}
                                        onChange={handleChange}
                                        onBlur={handleBlur}
                                        warning={warnFields?.electro_cardiac_stability}
                                        readOnly={disabledForm || formData.not_check_assessments === 1}
                                        placeholder="Electro-Cardiac Stability" 
                                    />
                                </div>
                                <div className={`bio-grade`}>
                                    <span className={`bio-grade`}
                                        style={{ color: gradeFields?.electro_cardiac_stability?.color || "red" }}
                                    >
                                        ( {gradeFields?.electro_cardiac_stability?.msg || "ค่าประเมิน"} )
                                    </span>
                                </div>
                            </div>
                             <div className="bio-section">
                                <div className="bio-title">
                                    <span>Ectopic Beat</span>
                                    <span>(การเต้นของหัวใจผิดจังหวะ)</span>
                                </div>
                                <div className="bio-score">
                                    <Input type="text"
                                        id="bio_form_ectopic_beat"
                                        name="ectopic_beat" 
                                        value={formData.ectopic_beat}
                                        onChange={handleChange}
                                        onBlur={handleBlur}
                                        warning={warnFields?.ectopic_beat}
                                        readOnly={disabledForm || formData.not_check_assessments === 1}
                                        placeholder="Ectopic Beat" 
                                    />
                                </div>
                                <div className={`bio-grade`}>
                                    <span className={`bio-grade`}
                                        style={{ color: gradeFields?.ectopic_beat?.color || "red" }}
                                    >
                                        ( {gradeFields?.ectopic_beat?.msg || "ค่าประเมิน"} )
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="form-group bio-group">
                        <img className="" src={`${clientConfig.base_path}/images/wave.png`} alt="" />
                        <div className="bio-list">
                            <div className="bio-section">
                                <div className="bio-title">
                                    <span>Wave Level</span>
                                    <span>(ระดับของสภาวะหลอดเลือด)</span>
                                </div>
                                <div className="bio-score">
                                    <Input type="text"
                                        id="bio_form_wave_level"
                                        name="wave_level" 
                                        value={formData.wave_level}
                                        onChange={handleChange}
                                        onBlur={handleBlur}
                                        warning={warnFields?.wave_level}
                                        readOnly={disabledForm || formData.not_check_assessments === 1}
                                        placeholder="Wave Level" 
                                    />
                                </div>
                                <div className={`bio-grade`}>
                                    <span className={`bio-grade`}
                                        style={{ color: gradeFields?.wave_level?.color || "red" }}
                                    >
                                        ( {gradeFields?.wave_level?.msg || "ค่าประเมิน"} )
                                    </span>
                                </div>
                    
                            </div>
                        </div>
                    </div>

                </div>
            </div>

            {/* ส่วนแสดงภาพรายงานผลตรวจ Biofeedback (DDR & APG) จากเครื่อง SA-3000P */}
            <div className="form-section !mt-6">
                <BioReportViewer
                    screeningId={bioData?.screenings?.screening_id}
                    hn={bioData?.hn}
                    initialDdrUrl={bioData?.screenings?.biofeedback?.ddr_image_url}
                    initialApgUrl={bioData?.screenings?.biofeedback?.apg_image_url}
                    isEdit={!disabledForm}
                />
            </div>

        </form>
      </>
    )

});

FormBio.displayName = "FormBio";

export default FormBio;