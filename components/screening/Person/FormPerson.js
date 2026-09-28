// /components/screening/Person/FormPerson.js "success Refactor Code"
"use client";
import { useRef, forwardRef, useImperativeHandle, useEffect } from "react";
import { ContactRound } from "lucide-react";
import Select from "@/components/common/Form/Select";
import Input from "@/components/common/Form/Input";
import Textarea from "@/components/common/Form/Textarea";
import Checkbox from "@/components/common/Form/Checkbox";
import FormPersonAddress from "@/components/screening/Person/FormPersonAddress";
import useDefaultDataStore from "@/stores/useDefaultDataStore";
import usePersonForm from "@/hooks/usePersonForm";

const FormPerson = forwardRef(({ personData, disabledForm = true, onChangeFormPerson }, ref) => {

    const defaultData = useDefaultDataStore((state) => state.defaultData);
  
    const {
        formData,
        formDataAll,
        addressData,
        currentAddressData,
        sameAddress,
        warnFields,
        isNotProcessRef,
        addressFormRef,
        currentAddressFormRef,
        setSameAddress,
        handleChange,
        handleBlur,
        onChangeAddressCallback,
        onChangeCurrentAddressCallback,
        validateForm,
        validateFormALL,
    } = usePersonForm(personData, onChangeFormPerson, disabledForm);

    useImperativeHandle(ref, () => ({
        validateAndFocus: async () => {
        return validateFormALL(true);
        },
    }));
  
    return (
        <>
            <form className="form-content">

                <div className="form-section">
                    <h3>
                        <ContactRound className="show-in-modern"/>
                        ข้อมูลส่วนตัว
                    </h3>

                    <div className="form-grid">
                        
                        <div className="form-group">
                            <label htmlFor="person_form_prefix_id">คำนำหน้า</label>
                            <Select 
                                id="person_form_prefix_id"
                                name="prefix_id" 
                                value={formData.prefix_id}
                                placeholder="เลือกคำนำหน้า" 
                                onChange={handleChange}
                                onBlur={handleBlur}
                                warning={warnFields?.prefix_id}
                                readOnly={disabledForm}
                                options={defaultData?.name_prefixes_th}
                                optionValue = "prefix_id" 
                                optionLabel = "title" 
                            />
                        </div>

                        <div className="form-group">
                            <label htmlFor="person_form_firstname">ชื่อ (ไทย)</label>
                             <Input type="text"
                                id="person_form_firstname"
                                name="firstname" 
                                value={formData.firstname}
                                placeholder="" 
                                onChange={handleChange}
                                onBlur={handleBlur}
                                warning={warnFields?.firstname}
                                readOnly={disabledForm}
                            />
                         
                        </div>

                        <div className="form-group">
                            <label htmlFor="person_form_lastname">นามสกุล (ไทย)</label>
                            <Input type="text"
                                id="person_form_lastname"
                                name="lastname" 
                                value={formData.lastname}
                                placeholder="" 
                                onChange={handleChange}
                                onBlur={handleBlur}
                                warning={warnFields?.lastname}
                                readOnly={disabledForm}
                            />
                        </div>

                        <div className="form-group">
                            <label htmlFor="person_form_prefix_id_en">คำนำหน้าชื่อ (อังกฤษ)</label>
                            <Select 
                                id="person_form_prefix_id_en"
                                name="prefix_id_en" 
                                value={formData.prefix_id_en}
                                placeholder="เลือกคำนำหน้า" 
                                onChange={handleChange}
                                onBlur={handleBlur}
                                warning={warnFields?.prefix_id_en}
                                readOnly={disabledForm}
                                options={defaultData?.name_prefixes_en}
                                optionValue = "prefix_id" 
                                optionLabel = "title" 
                            />
                        </div>

                        <div className="form-group">
                            <label htmlFor="person_form_firstname_en">ชื่อ (อังกฤษ)</label>
                            <Input type="text"
                                id="person_form_firstname_en"
                                name="firstname_en" 
                                value={formData.firstname_en}
                                placeholder="" 
                                onChange={handleChange}
                                onBlur={handleBlur}
                                warning={warnFields?.firstname_en}
                                readOnly={disabledForm}
                            />
                        </div>

                        <div className="form-group">
                            <label htmlFor="person_form_lastname_en">นามสกุล (อังกฤษ)</label>
                             <Input type="text"
                                id="person_form_lastname_en"
                                name="lastname_en" 
                                value={formData.lastname_en}
                                placeholder="" 
                                onChange={handleChange}
                                onBlur={handleBlur}
                                warning={warnFields?.lastname_en}
                                readOnly={disabledForm}
                            />
                        </div>
                    </div>
                </div>

                <div className="form-section personal-info">
                    <h3><i className="show-in-modern" data-lucide="book-user"></i> ข้อมูลทั่วไป</h3>
                    <div className="form-grid">

                        <div className="form-group">
                            <label htmlFor="person_form_idcard">เลขประจำตัวประชาชน</label>
                            <Input type="text"
                                id="person_form_idcard"
                                name="idcard" 
                                value={formData.idcard}
                                placeholder="" 
                                onChange={handleChange}
                                onBlur={handleBlur}
                                warning={warnFields?.idcard}
                                readOnly={disabledForm}
                            />
                        </div>

                        <div className="form-group">
                            <label htmlFor="person_form_passport">พาสสปอร์ต</label>
                            <Input type="text"
                                id="person_form_passport"
                                name="passport" 
                                value={formData.passport}
                                placeholder="" 
                                onChange={handleChange}
                                onBlur={handleBlur}
                                warning={warnFields?.passport}
                                readOnly={disabledForm}
                            />
                        </div>

                        <div className="form-group">
                            <label htmlFor="person_form_sex_id">เพศ</label>
                            <Select 
                                id="person_form_sex_id"
                                name="sex_id" 
                                value={formData.sex_id}
                                placeholder="เลือกเพศ" 
                                onChange={handleChange}
                                onBlur={handleBlur}
                                warning={warnFields?.sex_id}
                                readOnly={disabledForm}
                                options={defaultData?.sex}
                                optionValue = "sex_id" 
                                optionLabel = "title_th" 
                            />
                        </div>

                        <div className="form-group">
                            <label htmlFor="person_form_birthday">
                                วันเดือนปีเกิด ( <Checkbox 
                                    type="checkbox"
                                    id="person_form_unknow_birthday"
                                    name="unknow_birthday" 
                                    className="checkbox-birthday"
                                    checked={formData.unknow_birthday}
                                    onChange={handleChange}
                                    onBlur={handleBlur}
                                    warning={warnFields?.unknow_birthday}
                                    readOnly={disabledForm}
                                /><label htmlFor="person_form_unknow_birthday"> ไม่ทราบวันเกิด</label> )
                            </label>
                            <Input type="date"
                                id="person_form_birthday"
                                name="birthday" 
                                value={formData.birthday}
                                onChange={handleChange}
                                onBlur={handleBlur}
                                warning={warnFields?.birthday}
                                readOnly={disabledForm}
                            />
                        </div>

                        <div className="form-group">
                            <label htmlFor="person_form_age">อายุ</label>
                            <Input type="text"
                                id="person_form_age"
                                name="age" 
                                value={formData.age}
                                onChange={handleChange}
                                onBlur={handleBlur}
                                warning={warnFields?.age}
                                readOnly={disabledForm}
                                placeholder="" 
                            />
                        </div>

                        <div className="form-group">
                            <label htmlFor="person_form_bloodgroup_id">หมู่โลหิต</label>
                            <Select 
                                id="person_form_bloodgroup_id"
                                name="bloodgroup_id" 
                                value={formData.bloodgroup_id}
                                placeholder="เลือกหมู่เลือด" 
                                onChange={handleChange}
                                onBlur={handleBlur}
                                warning={warnFields?.bloodgroup_id}
                                readOnly={disabledForm}
                                options={defaultData?.bloodgroup}
                                optionValue = "bloodgroup_id" 
                                optionLabel = "title" 
                            />
                        </div>
                        
                        <div className="form-group">
                            <label htmlFor="person_form_nationalities_id">สัญชาติ</label>
                            <Select 
                                id="person_form_nationalities_id"
                                name="nationalities_id" 
                                value={formData.nationalities_id}
                                placeholder="เลือกสัญชาติ" 
                                onChange={handleChange}
                                onBlur={handleBlur}
                                warning={warnFields?.nationalities_id}
                                readOnly={disabledForm}
                                options={defaultData?.nationalities}
                                optionValue = "nationalities_id" 
                                optionLabel = "title_th" 
                            />
                        </div>

                        <div className="form-group">
                            <label htmlFor="person_form_ethnicities_id">เชื่อชาติ</label>
                            <Select 
                                id="person_form_ethnicities_id"
                                name="ethnicities_id" 
                                value={formData.ethnicities_id}
                                placeholder="เลือกเชื่อชาติ" 
                                onChange={handleChange}
                                onBlur={handleBlur}
                                warning={warnFields?.ethnicities_id}
                                readOnly={disabledForm}
                                options={defaultData?.ethnicities}
                                optionValue = "ethnicities_id" 
                                optionLabel = "title_th" 
                            />
                        </div>

                        <div className="form-group">
                            <label htmlFor="person_form_tel">เบอร์โทรติดต่อ</label>
                            <Input type="text"
                                id="person_form_tel"
                                name="tel" 
                                value={formData.tel}
                                onChange={handleChange}
                                onBlur={handleBlur}
                                warning={warnFields?.tel}
                                readOnly={disabledForm}
                                placeholder="" 
                            />
                        </div>

                        <div className="form-group">
                            <label htmlFor="person_form_occupation_id">อาชีพ</label>
                            <Select 
                                id="person_form_occupation_id"
                                name="occupation_id" 
                                value={formData.occupation_id}
                                placeholder="เลือกอาชีพ" 
                                onChange={handleChange}
                                onBlur={handleBlur}
                                warning={warnFields?.occupation_id}
                                readOnly={disabledForm}
                                options={defaultData?.occupations}
                                optionValue = "occupation_id" 
                                optionLabel = "title_th" 
                            />
                        </div>

                        <div className={`form-group ${formData.occupation_id === "12" ? " " : "!hidden"} `}>
                            <label htmlFor="person_form_occupations_other">ระบุอาชีพ....</label>
                            <Input type="text"
                                id="person_form_occupations_other"
                                name="occupations_other" 
                                value={formData.occupations_other}
                                onChange={handleChange}
                                onBlur={handleBlur}
                                warning={warnFields?.occupations_other}
                                readOnly={disabledForm}
                                placeholder="" 
                            />
                        </div>

                        <div className="form-group">
                            <label htmlFor="person_form_organization_id">หน่วยงาน</label>
                            <Select 
                                id="person_form_organization_id"
                                name="organization_id" 
                                value={formData.organization_id}
                                placeholder="เลือกหน่วยงาน" 
                                onChange={handleChange}
                                onBlur={handleBlur}
                                warning={warnFields?.organization_id}
                                readOnly={disabledForm}
                                options={defaultData?.organizations}
                                optionValue = "organization_id" 
                                optionLabel = "title_th" 
                            />
                        </div>
                        
                    </div>
                </div>

                <div className="form-section personal-address">
                    <h3><i className="show-in-modern" data-lucide="map-pin-house"></i> ที่อยู่ตามบัตรประชาชน</h3>
                    <FormPersonAddress ref={addressFormRef} addressData={addressData} disabledForm={disabledForm} onChangeAddress={onChangeAddressCallback} nameAddress="address"/>
                </div>

                <div className="form-section">
                    <div className="checkbox-group">
                        <Checkbox 
                            type="checkbox"
                            id="person_form_sameAddress"
                            name="sameAddress" 
                            checked={sameAddress}
                            readOnly={disabledForm}
                            onChange={(e) => setSameAddress(e.target.checked)} 
                        />
                        <label htmlFor="person_form_sameAddress">ที่อยู่ปัจจุบันเหมือนที่อยู่ตามบัตรประชาชน</label>
                    </div>
                           
                    <FormPersonAddress ref={currentAddressFormRef} sameAddress={sameAddress} addressData={currentAddressData} disabledForm={disabledForm} onChangeAddress={onChangeCurrentAddressCallback} nameAddress="currentaddress"/>
                
                </div>

                {/* <!-- ข้อมูลการรักษา --> */}
                <div className="form-section">
                    <h3><i className="show-in-modern" data-lucide="hospital"></i>ข้อมูลการรักษา</h3>
                    <div className="form-grid">
                        <div className="form-group">
                            <label htmlFor="person_form_healthcare_right_id">สิทธิการรักษาพยาบาล</label>
                            <Select 
                                id="person_form_healthcare_right_id"
                                name="healthcare_right_id" 
                                value={formData.healthcare_right_id}
                                placeholder="เลือกสิทธิการรักษาพยาบาล" 
                                onChange={handleChange}
                                onBlur={handleBlur}
                                warning={warnFields?.healthcare_right_id}
                                readOnly={disabledForm}
                                options={defaultData?.healthcare_right}
                                optionValue = "healthcare_right_id" 
                                optionLabel = "title_th" 
                            />
                        </div>
                        <div className="form-group">
                            <label htmlFor="person_form_main_hospital">โรงพยาบาลหลัก (ถ้ามี)</label>
                            <Input type="text"
                                id="person_form_main_hospital"
                                name="main_hospital" 
                                value={formData.main_hospital}
                                onChange={handleChange}
                                onBlur={handleBlur}
                                warning={warnFields?.main_hospital}
                                readOnly={disabledForm}
                                placeholder="" 
                            />
                        </div>
                        <div className="form-group">
                            <label htmlFor="person_form_secondary_hospital">โรงพยาบาลรอง (ถ้ามี)</label>
                            <Input type="text"
                                id="person_form_secondary_hospital"
                                name="secondary_hospital" 
                                value={formData.secondary_hospital}
                                onChange={handleChange}
                                onBlur={handleBlur}
                                warning={warnFields?.secondary_hospital}
                                readOnly={disabledForm}
                                placeholder="" 
                            />
                        </div>
                        {/* ซ่อนข้อมูลสำคัญชั่วคราวตามที่เจ้าหน้าที่ร้องขอ (คอลัมน์ในฐานข้อมูลยังคงอยู่ เผื่อนำกลับมาใช้ในอนาคต)
                        <div className="form-group textarea-group">
                            <label htmlFor="person_form_important_information">ข้อมูลสำคัญ</label>
                            <Textarea  
                                id="person_form_important_information"
                                name="important_information" 
                                value={formData.important_information}
                                onChange={handleChange}
                                onBlur={handleBlur}
                                warning={warnFields?.important_information}
                                readOnly={disabledForm}
                                placeholder="" 
                                rows={5}
                            />
                        </div>
                        */}
                    </div>
                </div>

            </form>
        </>
    );
});

FormPerson.displayName = "FormPerson";

export default FormPerson;