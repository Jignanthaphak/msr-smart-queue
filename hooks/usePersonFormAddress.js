// /hooks/usePersonFormAddress.jsx
"use client";
import { useState, useEffect, useRef, useCallback } from "react";
import { BaseAddressSchema, replace, defaultValue } from "@/lib/validators/form/screening/person/schema";
import useDefaultDataStore from "@/stores/useDefaultDataStore";

export function usePersonFormAddress(addressData, onChangeAddress, disabledForm = true, nameAddress = "address") {
 
  const isNotProcess = useRef(true);
  const isLoadingInitial = useRef(true);
  const sanitizeTimeouts = useRef({});

  const defaultData = useDefaultDataStore((s) => s.defaultData);

  const [districts, setDistricts] = useState([]);
  const [subdistricts, setSubdistricts] = useState([]);
  
  const [formData, setFormData] = useState({
        type: defaultValue.type, 
        houseno: defaultValue.houseno, 
        villagenno: defaultValue.villagenno, 
        road: defaultValue.road, 
        province_id: defaultValue.province_id, 
        district_id: defaultValue.district_id, 
        subdistrict_id: defaultValue.subdistrict_id, 
        zip_code: defaultValue.zip_code, 
  })
  const [warnFields, setWarnFields] = useState({});

  const setWarnWithTimeout = useCallback((name, message) => {
    setWarnFields((prev) => ({ ...prev, [name]: message }));

    if (sanitizeTimeouts.current[name]) clearTimeout(sanitizeTimeouts.current[name]);

    sanitizeTimeouts.current[name] = setTimeout(() => {
      setWarnFields((prev) => ({ ...prev, [name]: null }));
      sanitizeTimeouts.current[name] = null;
    }, 1500);
  }, []);

  // init
  useEffect(() => {

    isNotProcess.current = !addressData;
    isLoadingInitial.current = true;
    if (isNotProcess.current) return;

    const { province_id, district_id, subdistrict_id } = addressData;

    if (province_id) {
      setDistricts(defaultData.districts.filter((d) => d.province_id === Number(province_id)));
    }
    if (district_id) {
      setSubdistricts(defaultData.subdistricts.filter((d) => d.district_id === Number(district_id)));
    }

    setFormData(prev => ({
        ...prev,
        type: addressData?.type ?? defaultValue.type,
        houseno: addressData?.houseno ?? defaultValue.houseno,
        villagenno: addressData?.villagenno ?? defaultValue.villagenno,
        road: addressData?.road ?? defaultValue.road,
        province_id: addressData?.province_id ?? defaultValue.province_id,
        district_id: addressData?.district_id ?? defaultValue.district_id,
        subdistrict_id: addressData?.subdistrict_id ?? defaultValue.subdistrict_id,
        zip_code: addressData?.zip_code ?? defaultValue.zip_code,
    }))
  }, [addressData, defaultData]);

  const handleChange = (e) => {

    if (disabledForm) return;

    const { name, value } = e.target;
    let newValue = value;
    const oldValue = formData[name];

    const validator = replace[name];
    const parsed = BaseAddressSchema.pick({ [name]: true }).safeParse({ [name]: newValue });

    if (!parsed.success) {
      const msg = parsed?.error?.errors[0]?.message;
      if (validator) {
        newValue = newValue.replace(validator, "");
        setWarnWithTimeout(name, msg);
      }
    } else {
      setWarnWithTimeout(name, null);
    }

    if (newValue !== oldValue) {
      setFormData((prev) => ({ ...prev, [name]: newValue }));
    }

    isNotProcess.current = false;
    isLoadingInitial.current = false;
  };

  const handleBlur = (e) => {

    if (disabledForm || isNotProcess.current) return;

    const { name } = e.target;
    if (isNotProcess.current) return;
    setWarnFields((prev) => ({ ...prev, [name]: null }));
  };

  // cascade province → district
  useEffect(() => {
    if (isLoadingInitial.current) return;
    setFormData((prev) => ({
      ...prev,
      district_id: null,
      subdistrict_id: null,
      zip_code: null,
    }));
    if (!formData.province_id) return;
    setDistricts(defaultData.districts.filter((d) => d.province_id === Number(formData.province_id)));
    setSubdistricts(defaultData.subdistricts.filter((d) => d.district_id === Number(formData.district_id)));
  }, [formData.province_id]);

  // cascade district → subdistrict
  useEffect(() => {
    if (isLoadingInitial.current) return;
    setFormData((prev) => ({
      ...prev,
      subdistrict_id: null,
      zip_code: null,
    }));
    if (!formData.district_id) return;
    setSubdistricts(defaultData.subdistricts.filter((d) => d.district_id === Number(formData.district_id)));
  }, [formData.district_id]);

  // subdistrict → zipcode
  useEffect(() => {
    if (isLoadingInitial.current) return;
    setFormData((prev) => ({
      ...prev,
      zip_code: null,
    }));
    if (!formData.subdistrict_id) return;
    const findZipCode = defaultData.subdistricts.find((d) => d.id === Number(formData.subdistrict_id));
    setFormData((prev) => ({ ...prev, zip_code: findZipCode?.zip_code || null }));
  }, [formData.subdistrict_id]);

  // push data out
  useEffect(() => {
    if (isNotProcess.current) return;
    onChangeAddress?.(formData);
  }, [formData]);

  // validate (ใช้ focus ได้)
  const validateForm = useCallback((focus = false, containerSelector = null) => {
    const result = BaseAddressSchema.safeParse(formData);

    if (!result.success) {
      if (focus) {
        const errorIssue = result?.error?.errors[0];
        const fieldName = errorIssue?.path?.[0];
        setWarnFields((prev) => ({ ...prev, [fieldName]: errorIssue.message }));

        let el = null;
        if (containerSelector) {
          const container = document.querySelector(containerSelector);
          el = container?.querySelector(`[id="${nameAddress}_${fieldName}"]`);
        } else {
          el = document.querySelector(`[id="${nameAddress}_${fieldName}"]`);
        }
        if (el) {
          try {
            el.focus();
            el.scrollIntoView({ behavior: "smooth", block: "center" });
          } catch (err) {}
        }

         if (sanitizeTimeouts.current[fieldName]) {
          clearTimeout(sanitizeTimeouts.current[fieldName]);
        }

      }
      return false;
    }

    return true;
  }, [formData]);

  return {
    formData,
    districts,
    subdistricts,
    warnFields,
    handleChange,
    handleBlur,
    validateForm,
  };
}
