// /hooks/usePersonForm.jsx
"use client";
import { useState, useEffect, useRef } from "react";
import { BaseInfoSchema, replace, defaultValue } from "@/lib/validators/form/screening/person/schema";
import { date, datetime, times, day, nowMs, nowSec, nowDate } from "@/lib/utils/dateFormat";
export default function usePersonForm(personData, onChangeFormPerson, disabledForm = true, containerSelector = null) {

  const addressFormRef = useRef();
  const currentAddressFormRef = useRef();

  const isNotProcess = useRef(true);
  const sanitizeTimeouts = useRef({});

  const [formData, setFormData] = useState({
      hn: defaultValue.hn,  
      prefix_id: defaultValue.prefix_id, 
      prefix_id_en: defaultValue.prefix_id_en, 
      firstname: defaultValue.firstname, 
      firstname_en: defaultValue.firstname_en, 
      lastname: defaultValue.lastname, 
      lastname_en: defaultValue.lastname_en, 
      idcard: defaultValue.idcard,  
      passport: defaultValue.passport, 
      sex_id: defaultValue.sex_id, 
      unknow_birthday: defaultValue.unknow_birthday, 
      birthday: defaultValue.birthday,  
      age: defaultValue.age,  
      bloodgroup_id: defaultValue.bloodgroup_id, 
      nationalities_id: defaultValue.nationalities_id, 
      ethnicities_id: defaultValue.ethnicities_id, 
      tel: defaultValue.tel,  
      occupation_id: defaultValue.occupation_id, 
      occupations_other: defaultValue.occupations_other, 
      organization_id: defaultValue.organization_id, 
      healthcare_right_id: defaultValue.healthcare_right_id, 
      main_hospital: defaultValue.main_hospital, 
      secondary_hospital:defaultValue.secondary_hospital, 
      important_information: defaultValue.important_information, 
  })

  const [formDataAll, setFormDataAll] = useState({ info: {}, address: {} });
  const [addressData, setAddressData] = useState(null);
  const [currentAddressData, setCurrentAddressData] = useState(null);
  const [sameAddress, setSameAddress] = useState(false);
  const [warnFields, setWarnFields] = useState({});

  // --- helper: warn + timeout ---
  const setWarnWithTimeout = (name, message) => {
    setWarnFields((prev) => {
      if (prev[name] === message) return prev;
      return { ...prev, [name]: message };
    });

    if (sanitizeTimeouts.current[name]) {
      clearTimeout(sanitizeTimeouts.current[name]);
    }

    sanitizeTimeouts.current[name] = setTimeout(() => {
      setWarnFields((prev) => ({ ...prev, [name]: null }));
      sanitizeTimeouts.current[name] = null;
    }, 1500);
  };

  // --- initialize from personData ---
  useEffect(() => {
    isNotProcess.current = !personData;
    if (isNotProcess.current) return;

    setFormData((prev) => ({
      ...prev,
      hn: personData?.hn ?? defaultValue.hn,
      hn_index: personData?.hn_index ?? defaultValue.hn_index,
      prefix_id: personData?.prefix_id ?? defaultValue.prefix_id,
      prefix_id_en: personData?.prefix_id_en ?? defaultValue.prefix_id_en,
      firstname: personData?.firstname ?? defaultValue.firstname,
      firstname_en: personData?.firstname_en ?? defaultValue.firstname_en,
      lastname: personData?.lastname ?? defaultValue.lastname,
      lastname_en: personData?.lastname_en ?? defaultValue.lastname_en,
      idcard: personData?.idcard ?? defaultValue.idcard,
      passport: personData?.passport ?? defaultValue.passport,
      sex_id: personData?.sex_id ?? defaultValue.sex_id,
      unknow_birthday: personData?.unknow_birthday ?? defaultValue.unknow_birthday,
      birthday: personData?.birthday ? date(personData.birthday) : defaultValue.birthday,
      age: personData?.age ?? defaultValue.age,
      bloodgroup_id: personData?.bloodgroup_id ?? defaultValue.bloodgroup_id,
      nationalities_id: personData?.nationalities_id ?? defaultValue.nationalities_id,
      ethnicities_id: personData?.ethnicities_id ?? defaultValue.ethnicities_id,
      tel: personData?.tel ?? defaultValue.tel,
      occupation_id: personData?.occupation_id ?? defaultValue.occupation_id,
      occupations_other: personData?.occupations_other ?? defaultValue.occupations_other,
      organization_id: personData?.organization_id ?? defaultValue.organization_id,
      healthcare_right_id: personData?.healthcare_right_id ?? defaultValue.healthcare_right_id,
      main_hospital: personData?.main_hospital ?? defaultValue.main_hospital,
      secondary_hospital: personData?.secondary_hospital ?? defaultValue.secondary_hospital,
      important_information: personData?.important_information ?? defaultValue.important_information,
    }));

    const address = personData?.persons_addresses?.find((item) => item.type === 1) ?? null;
    const currentAddress = personData?.persons_addresses?.find((item) => item.type === 2) ?? null;

    setAddressData(address);
    setCurrentAddressData(currentAddress);
  }, [personData]);

  // --- handle input change (same behavior asของเดิม) ---
  const handleChange = (e) => {
    if (disabledForm) return;

    const { name, value, checked, type } = e.target;
    let newValue = value;
    const oldValue = formData[name];

    if (type === "checkbox") {
      newValue = checked ? 1 : 0;
    }

    const validator = replace[name];
    const partialObj = { [name]: newValue };
    const parsed = BaseInfoSchema.pick({ [name]: true }).safeParse(partialObj);

    if (!parsed.success) {
      const isFormatError = parsed?.error?.errors[0]?.message;

      if (validator && typeof newValue === "string") {
        newValue = newValue.replace(validator, "");
        setWarnWithTimeout(name, isFormatError);
      } else {
        setWarnWithTimeout(name, isFormatError);
      }
    } else {
      setWarnWithTimeout(name, null);
    }

    if (newValue !== oldValue) {
      setFormData((prev) => ({
        ...prev,
        [name]: newValue,
      }));
    }

    isNotProcess.current = false;
  };

  const handleBlur = (e) => {
    if (disabledForm || isNotProcess.current) return;
    const { name } = e.target;
    setWarnFields((prev) => ({
      ...prev,
      [name]: null,
    }));
  };

  useEffect(() => {
    if (isNotProcess.current) return;

    setFormData((prev) => {
      let newData = { ...prev };
      let warnUpdate = {};

      if (prev.unknow_birthday === 1 && prev.birthday !== "") {
        newData.birthday = "";
        warnUpdate.birthday = null;
      }

      if (newData.birthday !== "") {
        const birthDate = new Date(newData.birthday);
        const today = new Date();
        let age = today.getFullYear() - birthDate.getFullYear();
        const hasHadBirthdayThisYear =
          today.getMonth() > birthDate.getMonth() ||
          (today.getMonth() === birthDate.getMonth() && today.getDate() >= birthDate.getDate());
        if (!hasHadBirthdayThisYear) age--;
        if (newData.age !== age.toString()) {
          newData.age = age.toString();
          warnUpdate.age = null;
          warnUpdate.unknow_birthday = null;
        }
      }

      if (Object.keys(warnUpdate).length) {
        setWarnFields((prev) => ({ ...prev, ...warnUpdate }));
      }

      return newData;
    });
  }, [formData.birthday, formData.unknow_birthday]);

  // --- sync info part to formDataAll ---
  useEffect(() => {
    if (isNotProcess.current) return;
    setFormDataAll((prev) => ({ ...prev, info: formData }));
  }, [formData]);

  // --- sameAddress sync ---
  useEffect(() => {
    if (isNotProcess.current) return;
    if (!sameAddress) return;
    setCurrentAddressData(formDataAll.address?.["1"] || {});
  }, [sameAddress, formDataAll.address]);

  // --- address callbacks (ใช้ใน component child) ---
  const onChangeAddressCallback = (data) => {
    setFormDataAll((prev) => ({
      ...prev,
      address: {
        ...(prev.address || {}),
        ["1"]: data,
        ...(sameAddress ? { ["2"]: data } : {}),
      },
    }));

    if (sameAddress) {
      setCurrentAddressData(data);
    }
  };

  const onChangeCurrentAddressCallback = (data) => {
    setFormDataAll((prev) => ({
      ...prev,
      address: {
        ...(prev.address || {}),
        ["2"]: data,
      },
    }));
  };

  // --- ส่งข้อมูลออก (เหมือนของเดิม) ---
  useEffect(() => {
      if (isNotProcess?.current) return;

      const timer = setTimeout(async () => {
      const isComplete = await validateFormALL(false);
      onChangeFormPerson?.({ formData: formDataAll, isComplete });
      }, 200);

      return () => clearTimeout(timer);
      // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formDataAll]);

  // --- validateForm (คืนพฤติกรรม focus ได้) ---
  const validateForm = (focus = false, containerSelector = null) => {
    const result = BaseInfoSchema.safeParse(formData);

    if (!result.success) {
      if (focus) {
        const errorIssue = result?.error?.errors[0];
        const fieldName = errorIssue?.path?.[0];

        setWarnFields((prev) => ({
          ...prev,
          [fieldName]: errorIssue.message,
        }));

        let el = null;
        if (containerSelector) {
          const container = document.querySelector(containerSelector);
          el = container?.querySelector(`[name="${fieldName}"]`);
        } else {
          el = document.querySelector(`[name="${fieldName}"]`);
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
  };


  // --- validate ALL (person + address refs) ---
  const validateFormALL = async (focus = false, options = {}) => {
    // options: { addressRef, currentAddressFormRef, validateAddressFn, validateCurrentAddressFn }
    const { validateAddressFn, validateCurrentAddressFn } = options;

    const isPersonValid = validateForm(false, containerSelector);

    const isAddressValid =
      (addressFormRef?.current?.validateAndFocus
        ? await addressFormRef.current.validateAndFocus(false, containerSelector)
        : validateAddressFn
        ? await validateAddressFn(false, containerSelector)
        : false);

    const isCurrentAddressValid =
      (currentAddressFormRef?.current?.validateAndFocus
        ? await currentAddressFormRef.current.validateAndFocus(false, containerSelector)
        : validateCurrentAddressFn
        ? await validateCurrentAddressFn(false, containerSelector)
        : false);

    if (!isPersonValid) {
      setTimeout(() => validateForm(focus, containerSelector), 100);
      return false;
    }

    if (!isAddressValid) {
      setTimeout(() => {
        addressFormRef?.current?.validateAndFocus?.(focus) ?? validateAddressFn?.(focus);
      }, 100);
      return false;
    }

    if (!isCurrentAddressValid) {
      setTimeout(() => {
        currentAddressFormRef?.current?.validateAndFocus?.(focus) ?? validateCurrentAddressFn?.(focus);
      }, 100);
      return false;
    }

    return true;
  };

   
 

  // --- cleanup timeouts on unmount ---
  useEffect(() => {
    return () => {
      Object.values(sanitizeTimeouts.current).forEach((t) => {
        if (t) clearTimeout(t);
      });
    };
  }, []);

  return {
    // state
    formData,
    formDataAll,
    addressData,
    currentAddressData,
    sameAddress,
    warnFields,
    isNotProcessRef: isNotProcess,
    addressFormRef,
    currentAddressFormRef,

    // setters / handlers
    setSameAddress,
    setAddressData,
    setCurrentAddressData,
    handleChange,
    handleBlur,
    onChangeAddressCallback,
    onChangeCurrentAddressCallback,

    // validators
    validateForm,
    validateFormALL,
  };
}
