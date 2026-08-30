// /components/screening/DetailScreening/DetailPersonForm.js
'use client';
import { useState, useRef, forwardRef, useImperativeHandle, useEffect } from "react";
import { ContactRound } from 'lucide-react';
import Field from '@/components/common/Form/Field';

import useDefaultDataStore from "@/stores/useDefaultDataStore";
import usePersonForm from "@/hooks/usePersonForm";
import { usePersonFormAddress } from "@/hooks/usePersonFormAddress";

const DetailPersonForm = forwardRef(({ personData, isEdit = false, disabledForm = true, onChangeFormPerson }, ref) => {

    const defaultData = useDefaultDataStore((state) => state.defaultData)

    const {
        formData,
        addressData,
        currentAddressData,
        sameAddress,
        warnFields,
        setSameAddress,
        handleChange,
        handleBlur,
        onChangeAddressCallback,
        onChangeCurrentAddressCallback,
        validateForm,
        validateFormALL,
    } = usePersonForm(personData, onChangeFormPerson, disabledForm, ".detail-person-form");
 
    const {
      formData:addressFormData,
      districts,
      subdistricts,
      warnFields:warnFieldsAddress,
      handleChange:handleChangeAddress,
      handleBlur:handleBlurAddress,
      validateForm:validateFormAddress,
    } = usePersonFormAddress(addressData, onChangeAddressCallback, disabledForm, "address");

    const {
      formData:currentAddressFormData,
      districts:currentDistricts,
      subdistricts:currentSubdistricts,
      warnFields:warnFieldsCurrentAddress,
      handleChange:handleChangeCurrentAddress,
      handleBlur:handleBlurCurrentAddress,
      validateForm:validateFormCurrentAddress,
    } = usePersonFormAddress(currentAddressData, onChangeCurrentAddressCallback, disabledForm, "currentAddress");
  
    const validateFormALLWrapper = async (focus = false) => {
      return validateFormALL(focus, {
        validateAddressFn: validateFormAddress,
        validateCurrentAddressFn: validateFormCurrentAddress,
      });
    };

    useImperativeHandle(ref, () => ({
      validateAndFocus: async () => {
        return validateFormALLWrapper(true);
      },
    }));

  return (
    <>
      <form action="#" className="form-content detail-person-form">
       
        <div className="form-section !bg-white flex flex-col !gap-5">
            <h3 className='!text-[20px]'>
                👨‍💼
                ข้อมูลส่วนตัว
            </h3>

            <div className=' flex-1 flex flex-wrap '>
              
              <div className="form-grid !flex-col min-w-[300px] w-full sm:w-1/2">
                
                <div className="form-group !flex-row !justify-start  gap-1">
                  <span className='!text-[16px]'>ชื่อ-นามสกุล (ไทย) : </span>
                  <Field 
                    id="person_form_prefix_id" 
                    name="prefix_id" 
                    value={formData.prefix_id}
                    placeholder="เลือกคำนำหน้า" 
                    component={"Select"} 
                    options={defaultData?.name_prefixes_th} 
                    optionValue="prefix_id" 
                    optionLabel="title" 
                    onChange={handleChange}
                    onBlur={handleBlur}
                    warning={warnFields}
                    disabledForm={disabledForm}
                    isEdit={isEdit}
                  />

                  <Field 
                    id="person_form_firstname" 
                    name="firstname" 
                    value={formData.firstname}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    warning={warnFields}
                    disabledForm={disabledForm}
                    isEdit={isEdit}
                  />

                  <Field 
                    id="person_form_lastname" 
                    name="lastname" 
                    value={formData.lastname}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    warning={warnFields}
                    disabledForm={disabledForm}
                    isEdit={isEdit}
                  />
                  
                </div>

                <div className="form-group !flex-row !justify-start gap-1">
                    <span className='!text-[16px]'>ชื่อ-นามสกุล (อังกฤษ) : </span>
                  
                     <Field 
                        id="person_form_prefix_id_en" 
                        name="prefix_id_en" 
                        value={formData.prefix_id_en} 
                        placeholder="เลือกคำนำหน้า" 
                        component={"Select"} 
                        options={defaultData?.name_prefixes_en} 
                        optionValue="prefix_id" 
                        optionLabel="title" 
                        onChange={handleChange}
                        onBlur={handleBlur}
                        warning={warnFields}
                        disabledForm={disabledForm}
                        isEdit={isEdit}
                      />
                      <Field 
                        id="person_form_firstname_en" 
                        name="firstname_en" 
                        value={formData.firstname_en}
                        onChange={handleChange}
                        onBlur={handleBlur}
                        warning={warnFields}
                        disabledForm={disabledForm}
                        isEdit={isEdit}
                      />
                      <Field 
                        id="person_form_lastname_en" 
                        name="lastname_en" 
                        value={formData.lastname_en}
                        onChange={handleChange}
                        onBlur={handleBlur}
                        warning={warnFields}
                        disabledForm={disabledForm}
                        isEdit={isEdit}
                      />
                 
                </div>

                <div className="form-group !flex-row !justify-start  gap-1">
                    <span className='!text-[16px]'>เพศ : </span>
                    <Field 
                      id="person_form_sex_id" 
                      name="sex_id" 
                      value={formData.sex_id}
                      placeholder="เลือกเพศ" 
                      component={"Select"} 
                      options={defaultData?.sex} 
                      optionValue="sex_id" 
                      optionLabel="title_th" 
                      onChange={handleChange}
                      onBlur={handleBlur}
                      warning={warnFields}
                      disabledForm={disabledForm}
                      isEdit={isEdit}
                    />
                </div>

                <div className="form-group !flex-row !justify-start  gap-1">
                    <span className='!text-[16px]'>อายุ : </span>
                    <Field 
                      id="person_form_age" 
                      name="age" 
                      value={formData.age}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      warning={warnFields}
                      disabledForm={disabledForm}
                      isEdit={isEdit}
                    />
                </div>

                <div className="form-group !flex-row !justify-start  gap-1">
                    <span className='!text-[16px]'>วันเดือนปีเกิด : </span>
                    <Field 
                      type='date'
                      id="person_form_birthday" 
                      name="birthday" 
                      value={formData.birthday}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      warning={warnFields}
                      disabledForm={disabledForm}
                      isEdit={isEdit}
                    />
                    <Field 
                      component='Checkbox'
                      id="person_form_unknow_birthday" 
                      name="unknow_birthday" 
                      checked={formData.unknow_birthday}
                      placeholder="ไม่ทราบวันเกิด"
                      onChange={handleChange}
                      onBlur={handleBlur}
                      warning={warnFields}
                      disabledForm={disabledForm}
                      isEdit={isEdit}
                    />
                </div>

                <div className="form-group !flex-row !justify-start  gap-1">
                    <span className='!text-[16px]'>หมู่โลหิต : </span>
                    <Field 
                      id="person_form_bloodgroup_id" 
                      name="bloodgroup_id" 
                      value={formData.bloodgroup_id}
                      placeholder="เลือกหมู่เลือด" 
                      component={"Select"} 
                      options={defaultData?.bloodgroup} 
                      optionValue="bloodgroup_id" 
                      optionLabel="title" 
                      onChange={handleChange}
                      onBlur={handleBlur}
                      warning={warnFields}
                      disabledForm={disabledForm}
                      isEdit={isEdit}
                    />
                </div>

                <div className="form-group !flex-row !justify-start  gap-1">
                    <span className='!text-[16px]'>เบอร์โทร : </span>
                    <Field 
                      id="person_form_tel" 
                      name="tel" 
                      value={formData.tel}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      warning={warnFields}
                      disabledForm={disabledForm}
                      isEdit={isEdit}
                    />
                </div>

              </div>
              <div className="form-grid !flex-col min-w-[300px] w-full sm:w-1/2">

                <div className="form-group !flex-row !justify-start  gap-1">
                    <span className='!text-[16px]'>เลขประจำตัวประชาชน : </span>
                    <Field 
                      id="person_form_idcard" 
                      name="idcard" 
                      value={formData.idcard}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      warning={warnFields}
                      disabledForm={disabledForm}
                      isEdit={isEdit}
                    />
                </div>

                <div className="form-group !flex-row !justify-start gap-1">
                    <span className='!text-[16px]'>พาสสปอร์ต : </span>
                    <Field 
                      id="person_form_passport" 
                      name="passport" 
                      value={formData.passport}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      warning={warnFields}
                      disabledForm={disabledForm}
                      isEdit={isEdit}
                    />
                </div>

                <div className="form-group !flex-row !justify-start  gap-1">
                    <span className='!text-[16px]'>สัญชาติ : </span>
                    <Field 
                      id="person_form_nationalities_id" 
                      name="nationalities_id" 
                      value={formData.nationalities_id}
                      placeholder="เลือกสัญชาติ" 
                      component={"Select"} 
                      options={defaultData?.nationalities} 
                      optionValue="nationalities_id" 
                      optionLabel="title_th" 
                      onChange={handleChange}
                      onBlur={handleBlur}
                      warning={warnFields}
                      disabledForm={disabledForm}
                      isEdit={isEdit}
                    />
                </div>

                <div className="form-group !flex-row !justify-start  gap-1">
                    <span className='!text-[16px]'>เชื่อชาติ : </span>
                    <Field 
                      id="person_form_ethnicities_id" 
                      name="ethnicities_id" 
                      value={formData.ethnicities_id}
                      placeholder="เลือกเชื่อชาติ" 
                      component={"Select"} 
                      options={defaultData?.ethnicities} 
                      optionValue="ethnicities_id" 
                      optionLabel="title_th" 
                      onChange={handleChange}
                      onBlur={handleBlur}
                      warning={warnFields}
                      disabledForm={disabledForm}
                      isEdit={isEdit}
                    />
                </div>

                <div className="form-group !flex-row !justify-start  gap-1">
                    <span className='!text-[16px]'>อาชีพ : </span>
                     <Field 
                      id="person_form_occupation_id" 
                      name="occupation_id" 
                      value={formData.occupation_id}
                      placeholder="เลือกเชื่อชาติ" 
                      component={"Select"} 
                      options={defaultData?.occupations} 
                      optionValue="occupation_id" 
                      optionLabel="title_th" 
                      onChange={handleChange}
                      onBlur={handleBlur}
                      warning={warnFields}
                      disabledForm={disabledForm}
                      isEdit={isEdit}
                    />
                    {formData.occupation_id === "12" &&
                      <Field 
                        id="person_form_occupations_other" 
                        name="occupations_other" 
                        value={formData.occupations_other}
                        placeholder="ระบุอาชีพอื่นๆ"
                        onChange={handleChange}
                        onBlur={handleBlur}
                        warning={warnFields}
                        disabledForm={disabledForm}
                        isEdit={isEdit}
                      />
                }
                </div>

                <div className="form-group !flex-row !justify-start  gap-1">
                    <span className='!text-[16px]'>หน่วยงาน : </span>
                    <Field 
                      id="person_form_organization_id" 
                      name="organization_id" 
                      value={formData.organization_id}
                      placeholder="เลือกหน่วยงาน" 
                      component={"Select"} 
                      options={defaultData?.organizations} 
                      optionValue="organization_id" 
                      optionLabel="title_th" 
                      onChange={handleChange}
                      onBlur={handleBlur}
                      warning={warnFields}
                      disabledForm={disabledForm}
                      isEdit={isEdit}
                    />
                </div>

              </div> 

            </div>

        </div>

        <div className="form-section !bg-white flex flex-col !gap-5 justify-center">
          <h3 className='!text-[20px]'>
              📍
              ที่อยู่ตามบัตรประชาชน
              <div className="checkbox-group !mb-0 !items-center !justify-center">

                <Field 
                    component='Checkbox'
                    id="person_form_sameAddress" 
                    name="sameAddress" 
                    checked={sameAddress}
                    placeholder="ที่อยู่ปัจจุบันเหมือนที่อยู่ตามบัตรประชาชน"
                    onChange={(e) => setSameAddress(e.target.checked)}
                    disabledForm={disabledForm}
                    isEdit={isEdit}
                  />
            </div>
          </h3>

          <div className='flex flex-row '>
            
            <div className="form-grid !flex-row w-full !gap-3">
              
              <div className="form-group !flex-row !justify-start  gap-1">
                  <span className='!text-[16px]'>บ้านเลขที่ : </span>
                  <Field 
                    id="address_houseno" 
                    name="houseno" 
                    value={addressFormData.houseno}
                    onChange={handleChangeAddress}
                    onBlur={handleBlurAddress}
                    warning={warnFieldsAddress}
                    disabledForm={disabledForm}
                    isEdit={isEdit}
                  />
              </div>

              <div className="form-group !flex-row !justify-start gap-1">
                  <span className='!text-[16px]'>หมุ่ : </span>
                  <Field 
                    id="address_villagenno" 
                    name="villagenno" 
                    value={addressFormData.villagenno}
                    onChange={handleChangeAddress}
                    onBlur={handleBlurAddress}
                    warning={warnFieldsAddress}
                    disabledForm={disabledForm}
                    isEdit={isEdit}
                  />
              </div>

              <div className="form-group !flex-row !justify-start  gap-1">
                  <span className='!text-[16px]'>ถนน : </span>
                  <Field 
                    id="address_road" 
                    name="road" 
                    value={addressFormData.road}
                    onChange={handleChangeAddress}
                    onBlur={handleBlurAddress}
                    warning={warnFieldsAddress}
                    disabledForm={disabledForm}
                    isEdit={isEdit}
                  />
              </div>

              <div className="form-group !flex-row !justify-start  gap-1">
                  <span className='!text-[16px]'>จังหวัด : </span>
                  <Field 
                    id="address_province_id" 
                    name="province_id" 
                    value={addressFormData.province_id}
                    placeholder="เลือกจังหวัด" 
                    component={"Select"} 
                    options={defaultData?.provinces} 
                    optionValue="id" 
                    optionLabel="name_in_thai" 
                    onChange={handleChangeAddress}
                    onBlur={handleBlurAddress}
                    warning={warnFieldsAddress}
                    disabledForm={disabledForm}
                    isEdit={isEdit}
                  />
              </div>

              <div className="form-group !flex-row !justify-start  gap-1">
                  <span className='!text-[16px]'>อำเภอ : </span>
                  <Field 
                    id="address_district_id" 
                    name="district_id" 
                    value={addressFormData.district_id}
                    placeholder="เลือกอำเภอ/เขต" 
                    component={"Select"} 
                    options={districts} 
                    optionValue="id" 
                    optionLabel="name_in_thai" 
                    onChange={handleChangeAddress}
                    onBlur={handleBlurAddress}
                    warning={warnFieldsAddress}
                    disabledForm={disabledForm}
                    isEdit={isEdit}
                  />
              </div>

              <div className="form-group !flex-row !justify-start  gap-1">
                  <span className='!text-[16px]'>ตำบล : </span>
                  <Field 
                    id="address_subdistrict_id" 
                    name="subdistrict_id" 
                    value={addressFormData.subdistrict_id}
                    placeholder="เลือกตำบล/แขวง" 
                    component={"Select"} 
                    options={subdistricts} 
                    optionValue="id" 
                    optionLabel="name_in_thai" 
                    onChange={handleChangeAddress}
                    onBlur={handleBlurAddress}
                    warning={warnFieldsAddress}
                    disabledForm={disabledForm}
                    isEdit={isEdit}
                  />
              </div>

              <div className="form-group !flex-row !justify-start  gap-1">
                  <span className='!text-[16px]'>รหัสไปรษณีย์ : </span>
                  <Field 
                    id="address_zip_code" 
                    name="zip_code" 
                    value={addressFormData.zip_code}
                    onChange={handleChangeAddress}
                    onBlur={handleBlurAddress}
                    warning={warnFieldsAddress}
                    disabledForm={disabledForm}
                    isEdit={isEdit}
                  />
              </div>

            </div>

          </div>

        </div>

        <div className="form-section !bg-white flex flex-col !gap-5">
          <h3 className='!text-[20px]'>
              📍
              ที่อยู่ปัจจุบัน
          </h3>

          <div className='flex flex-row '>
            
            <div className="form-grid !flex-row w-full !gap-3">
              
              <div className="form-group !flex-row !justify-start  gap-1">
                  <span className='!text-[16px]'>บ้านเลขที่ : </span>
                  <Field 
                    id="currentAddress_houseno" 
                    name="houseno" 
                    value={currentAddressFormData.houseno}
                    onChange={handleChangeCurrentAddress}
                    onBlur={handleBlurCurrentAddress}
                    warning={warnFieldsCurrentAddress}
                    disabledForm={disabledForm}
                    isEdit={isEdit}
                  />
              </div>

              <div className="form-group !flex-row !justify-start gap-1">
                  <span className='!text-[16px]'>หมุ่ : </span>
                  <Field 
                    id="currentAddress_villagenno" 
                    name="villagenno" 
                    value={currentAddressFormData.villagenno}
                    onChange={handleChangeCurrentAddress}
                    onBlur={handleBlurCurrentAddress}
                    warning={warnFieldsCurrentAddress}
                    disabledForm={disabledForm}
                    isEdit={isEdit}
                  />
              </div>

              <div className="form-group !flex-row !justify-start  gap-1">
                  <span className='!text-[16px]'>ถนน : </span>
                  <Field 
                    id="currentAddress_road" 
                    name="road" 
                    value={currentAddressFormData.road}
                    onChange={handleChangeCurrentAddress}
                    onBlur={handleBlurCurrentAddress}
                    warning={warnFieldsCurrentAddress}
                    disabledForm={disabledForm}
                    isEdit={isEdit}
                  />
              </div>

              <div className="form-group !flex-row !justify-start  gap-1">
                  <span className='!text-[16px]'>จังหวัด : </span>
                  <Field 
                    id="currentAddress_province_id" 
                    name="province_id" 
                    value={currentAddressFormData.province_id}
                    placeholder="เลือกจังหวัด" 
                    component={"Select"} 
                    options={defaultData?.provinces} 
                    optionValue="id" 
                    optionLabel="name_in_thai" 
                    onChange={handleChangeCurrentAddress}
                    onBlur={handleBlurCurrentAddress}
                    warning={warnFieldsCurrentAddress}
                    disabledForm={disabledForm}
                    isEdit={isEdit}
                  />
              </div>

              <div className="form-group !flex-row !justify-start  gap-1">
                  <span className='!text-[16px]'>อำเภอ : </span>
                  <Field 
                    id="currentAddress_district_id" 
                    name="district_id" 
                    value={currentAddressFormData.district_id}
                    placeholder="เลือกอำเภอ/เขต" 
                    component={"Select"} 
                    options={currentDistricts} 
                    optionValue="id" 
                    optionLabel="name_in_thai" 
                    onChange={handleChangeCurrentAddress}
                    onBlur={handleBlurCurrentAddress}
                    warning={warnFieldsCurrentAddress}
                    disabledForm={disabledForm}
                    isEdit={isEdit}
                  />
              </div>

              <div className="form-group !flex-row !justify-start  gap-1">
                  <span className='!text-[16px]'>ตำบล : </span>
                  <Field 
                    id="currentAddress_subdistrict_id" 
                    name="subdistrict_id" 
                    value={currentAddressFormData.subdistrict_id}
                    placeholder="เลือกตำบล/แขวง" 
                    component={"Select"} 
                    options={currentSubdistricts} 
                    optionValue="id" 
                    optionLabel="name_in_thai" 
                    onChange={handleChangeCurrentAddress}
                    onBlur={handleBlurCurrentAddress}
                    warning={warnFieldsCurrentAddress}
                    disabledForm={disabledForm}
                    isEdit={isEdit}
                  />
              </div>

              <div className="form-group !flex-row !justify-start  gap-1">
                  <span className='!text-[16px]'>รหัสไปรษณีย์ : </span>
                  <Field 
                    id="currentAddress_zip_code" 
                    name="zip_code" 
                    value={currentAddressFormData.zip_code}
                    onChange={handleChangeCurrentAddress}
                    onBlur={handleBlurCurrentAddress}
                    warning={warnFieldsCurrentAddress}
                    disabledForm={disabledForm}
                    isEdit={isEdit}
                  />
              </div>

            </div>

          </div>

        </div>

        <div className="form-section !bg-white flex flex-col !gap-5">
          <h3 className='!text-[20px]'>
              📝
              ข้อมูลการรักษา
          </h3>

          <div className='flex flex-row '>
            
            <div className="form-grid !flex-col w-full !gap-3">
              
              <div className="flex flex-wrap !justify-start  gap-1">
                  <div className="w-fit">
                    <span className='!text-[16px]'>สิทธิการรักษาพยาบาล : </span>
                  </div>
                  <div className="w-fit">
                    <Field 
                      id="person_form_healthcare_right_id" 
                      name="healthcare_right_id" 
                      value={formData.healthcare_right_id}
                      placeholder="เลือกสิทธิการรักษาพยาบาล" 
                      component={"Select"} 
                      options={defaultData?.healthcare_right} 
                      optionValue="healthcare_right_id" 
                      optionLabel="title_th" 
                      onChange={handleChange}
                      onBlur={handleBlur}
                      warning={warnFields}
                      disabledForm={disabledForm}
                      isEdit={isEdit}
                    />
                  </div>
                 
              </div>

              <div className="flex !flex-wrap !justify-start  gap-1">
                <div className="w-fit">
                  <span className='!text-[16px]'>โรงพยาบาลหลัก : </span>
                </div>
                <div className="w-fit">
                  <Field 
                    id="person_form_main_hospital" 
                    name="main_hospital" 
                    value={formData.main_hospital}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    warning={warnFields}
                    disabledForm={disabledForm}
                    isEdit={isEdit}
                  />
                </div>
              </div>

              <div className="flex !flex-wrap !justify-start gap-1">
                <div className="w-fit">
                  <span className='!text-[16px]'>โรงพยาบาลรอง : </span>
                </div>
                <div className="w-fit">
                  <Field 
                    id="person_form_secondary_hospital" 
                    name="secondary_hospital" 
                    value={formData.secondary_hospital}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    warning={warnFields}
                    disabledForm={disabledForm}
                    isEdit={isEdit}
                  />
                </div>
              </div>

              <div className="flex !flex-wrap !justify-start  gap-1">

                <div className="w-fit">
                  <span className='!text-[16px]'>ข้อมูลสำคัญ : </span>
                </div>
                <div className="w-full">
                  <Field 
                    component={"Textarea"}
                    id="person_form_important_information" 
                    name="important_information" 
                    value={formData.important_information}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    warning={warnFields}
                    disabledForm={disabledForm}
                    isEdit={isEdit}
                  />
                </div>
              </div>

            </div>

          </div>

        </div>


      </form>
    </>
  );
});

DetailPersonForm.displayName = "DetailPersonForm";

export default DetailPersonForm;