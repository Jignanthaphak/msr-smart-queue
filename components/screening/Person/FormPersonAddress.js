"use client";
import { forwardRef, useImperativeHandle } from "react";
import Input from "@/components/common/Form/Input";
import Select from "@/components/common/Form/Select";
import { usePersonFormAddress } from "@/hooks/usePersonFormAddress";
import useDefaultDataStore from "@/stores/useDefaultDataStore";

const FormPersonAddress = forwardRef(
  ({ sameAddress = false, addressData = null, disabledForm = true, onChangeAddress, nameAddress = "address" }, ref) => {

    const defaultData = useDefaultDataStore((state) => state.defaultData);

    const {
      formData,
      districts,
      subdistricts,
      warnFields,
      handleChange,
      handleBlur,
      validateForm,
    } = usePersonFormAddress(addressData, onChangeAddress, disabledForm, nameAddress);

    // useImperativeHandle(ref, () => ({
    //   validateAndFocus: () => validateForm(true),
    // }));


    useImperativeHandle(ref, () => ({
        validateAndFocus: validateForm,
    }))

    return (
        <>
            <div className={`address-section ${sameAddress ? "hidden" : ""}`}>
                <div className="form-grid">
                    <div className="form-group">
                        <label htmlFor="houseno">บ้านเลขที่</label>
                        <Input type="text"
                            id={`${nameAddress}_houseno`}
                            name="houseno" 
                            value={formData.houseno}
                            onChange={handleChange}
                            onBlur={handleBlur}
                            warning={warnFields?.houseno}
                            readOnly={disabledForm}
                            placeholder="" 
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="villagenno">หมู่</label>
                        <Input type="text"
                            id={`${nameAddress}_villagenno`}
                            name="villagenno" 
                            value={formData.villagenno}
                            onChange={handleChange}
                            onBlur={handleBlur}
                            warning={warnFields?.villagenno}
                            readOnly={disabledForm}
                            placeholder="" 
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="road">ถนน</label>
                        <Input type="text"
                            id={`${nameAddress}_road`}
                            name="road" 
                            value={formData.road}
                            onChange={handleChange}
                            onBlur={handleBlur}
                            warning={warnFields?.road}
                            readOnly={disabledForm}
                            placeholder="" 
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="province_id">จังหวัด</label>
                        <Select 
                            id={`${nameAddress}_province_id`}
                            name="province_id" 
                            value={formData.province_id}
                            placeholder="เลือกจังหวัด" 
                            onChange={handleChange}
                            onBlur={handleBlur}
                            warning={warnFields?.province_id}
                            readOnly={disabledForm}
                            options={defaultData?.provinces}
                            optionValue = "id" 
                            optionLabel = "name_in_thai" 
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="district_id">อำเภอ/เขต</label>
                        <Select 
                            id={`${nameAddress}_district_id`}
                            name="district_id" 
                            value={formData.district_id}
                            placeholder="เลือกอำเภอ/เขต" 
                            onChange={handleChange}
                            onBlur={handleBlur}
                            warning={warnFields?.district_id}
                            readOnly={disabledForm}
                            options={districts}
                            optionValue = "id" 
                            optionLabel = "name_in_thai" 
                        />
                    </div>

                     <div className="form-group">
                        <label htmlFor="subdistrict_id">ตำบล/แขวง</label>
                        <Select 
                            id={`${nameAddress}_subdistrict_id`}
                            name="subdistrict_id" 
                            value={formData.subdistrict_id}
                            placeholder="เลือกตำบล/แขวง" 
                            onChange={handleChange}
                            onBlur={handleBlur}
                            warning={warnFields?.subdistrict_id}
                            readOnly={disabledForm}
                            options={subdistricts}
                            optionValue = "id" 
                            optionLabel = "name_in_thai" 
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="zip_code">รหัสไปรษณีย์</label>
                        <Input type="text"
                            id={`${nameAddress}_zip_code`}
                            name="zip_code" 
                            value={formData.zip_code}
                            onChange={handleChange}
                            onBlur={handleBlur}
                            warning={warnFields?.zip_code}
                            readOnly={disabledForm}
                            placeholder="" 
                        />
                    </div>
                </div>
            </div>
        </>
    );
});

FormPersonAddress.displayName = "FormPersonAddress";

export default FormPersonAddress;