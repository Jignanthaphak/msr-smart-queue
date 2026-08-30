import { z } from "zod";

import { zRequiredField, zOptionalField } from "@/lib/utils/zRequiredField";
import { regex, replacePattern, regexMessage, defaultValue } from "@/lib/validators/form/screening/person/regex";

const replace = replacePattern;
export { replace };

export { defaultValue };

export const BaseInfoSchema = z.object({

  hn:zRequiredField({
      reg: regex.hn,
      typeErr: regexMessage.type.hn,
      regErr: regexMessage.format.hn,
      outputType: "number",
  }),
  hn_index:zRequiredField({
      reg: regex.hn_index,
      typeErr: regexMessage.type.hn_index,
      regErr: regexMessage.format.hn_index,
  }),
  prefix_id:zOptionalField({
      reg: regex.prefix_id,
      typeErr: regexMessage.type.prefix_id,
      regErr: regexMessage.format.prefix_id,
      defaultValue: defaultValue.prefix_id,
      outputType: "number",
  }),
  firstname:zRequiredField({
      reg: regex.firstname,
      typeErr: regexMessage.type.firstname,
      regErr: regexMessage.format.firstname,
  }),
  lastname:zRequiredField({
      reg: regex.lastname,
      typeErr: regexMessage.type.lastname,
      regErr: regexMessage.format.lastname,
  }),
  prefix_id_en:zOptionalField({
      reg: regex.prefix_id_en,
      typeErr: regexMessage.type.prefix_id_en,
      regErr: regexMessage.format.prefix_id_en,
      defaultValue: defaultValue.prefix_id_en,
      outputType: "number",
  }),
  firstname_en:zOptionalField({
      reg: regex.firstname_en,
      typeErr: regexMessage.type.firstname_en,
      regErr: regexMessage.format.firstname_en,
      defaultValue: defaultValue.firstname_en,
  }),
  lastname_en:zOptionalField({
      reg: regex.lastname_en,
      typeErr: regexMessage.type.lastname_en,
      regErr: regexMessage.format.lastname_en,
      defaultValue: defaultValue.lastname_en,
  }),
  idcard:zRequiredField({
      reg: regex.idcard,
      typeErr: regexMessage.type.idcard,
      regErr: regexMessage.format.idcard,
      defaultValue: defaultValue.idcard,
  }),
  passport:zOptionalField({
      reg: regex.passport,
      typeErr: regexMessage.type.passport,
      regErr: regexMessage.format.passport,
      defaultValue: defaultValue.passport,
  }),
  sex_id:zRequiredField({
      reg: regex.sex_id,
      typeErr: regexMessage.type.sex_id,
      regErr: regexMessage.format.sex_id,
      defaultValue: defaultValue.sex_id,
      outputType: "number",
  }),
  unknow_birthday:zOptionalField({
      reg: regex.unknow_birthday,
      typeErr: regexMessage.type.unknow_birthday,
      regErr: regexMessage.format.unknow_birthday,
      defaultValue: defaultValue.unknow_birthday,
      outputType: "number",
  }),
  birthday:zOptionalField({
      reg: regex.birthday,
      typeErr: regexMessage.type.birthday,
      regErr: regexMessage.format.birthday,
      defaultValue: defaultValue.birthday,
  }),
  age:zRequiredField({
      reg: regex.age,
      typeErr: regexMessage.type.age,
      regErr: regexMessage.format.age,
      defaultValue: defaultValue.age,
      outputType: "number",
  }),
  bloodgroup_id:zOptionalField({
      reg: regex.bloodgroup_id,
      typeErr: regexMessage.type.bloodgroup_id,
      regErr: regexMessage.format.bloodgroup_id,
      defaultValue: null,
      outputType: "number",
  }),
  nationalities_id:zOptionalField({
      reg: regex.nationalities_id,
      typeErr: regexMessage.type.nationalities_id,
      regErr: regexMessage.format.nationalities_id,
      defaultValue: defaultValue.nationalities_id,
      outputType: "number",
  }),
  ethnicities_id:zOptionalField({
      reg: regex.ethnicities_id,
      typeErr: regexMessage.type.ethnicities_id,
      regErr: regexMessage.format.ethnicities_id,
      defaultValue: defaultValue.ethnicities_id,
      outputType: "number",
  }),
  tel:zOptionalField({
      reg: regex.tel,
      typeErr: regexMessage.type.tel,
      regErr: regexMessage.format.tel,
      defaultValue: defaultValue.tel,
  }),
  occupation_id:zOptionalField({
      reg: regex.occupation_id,
      typeErr: regexMessage.type.occupation_id,
      regErr: regexMessage.format.occupation_id,
      defaultValue: defaultValue.occupation_id,
      outputType: "number",
  }),
  occupations_other:zOptionalField({
      reg: regex.occupations_other,
      typeErr: regexMessage.type.occupations_other,
      regErr: regexMessage.format.occupations_other,
      defaultValue: defaultValue.occupations_other,
  }),
  organization_id:zOptionalField({
      reg: regex.organization_id,
      typeErr: regexMessage.type.organization_id,
      regErr: regexMessage.format.organization_id,
      defaultValue: defaultValue.organization_id,
      outputType: "number",
  }),
  healthcare_right_id:zOptionalField({
      reg: regex.healthcare_right_id,
      typeErr: regexMessage.type.healthcare_right_id,
      regErr: regexMessage.format.healthcare_right_id,
      defaultValue: defaultValue.healthcare_right_id,
      outputType: "number",
  }),
  main_hospital:zOptionalField({
      reg: regex.main_hospital,
      typeErr: regexMessage.type.main_hospital,
      regErr: regexMessage.format.main_hospital,
      defaultValue: defaultValue.main_hospital,
  }),
  secondary_hospital:zOptionalField({
      reg: regex.secondary_hospital,
      typeErr: regexMessage.type.secondary_hospital,
      regErr: regexMessage.format.secondary_hospital,
      defaultValue: defaultValue.secondary_hospital,
  }),
  important_information:zOptionalField({
      reg: regex.important_information,
      typeErr: regexMessage.type.important_information,
      regErr: regexMessage.format.important_information,
      defaultValue: defaultValue.important_information,
  }),

});

export const BaseAddressSchema = z.object({

  houseno: zOptionalField({
    reg: regex.houseno,
    typeErr: regexMessage.type.houseno,
    regErr: regexMessage.format.houseno,
    defaultValue: defaultValue.houseno,
  }),

  villagenno: zOptionalField({
    reg: regex.villagenno,
    typeErr: regexMessage.type.villagenno,
    regErr: regexMessage.format.villagenno,
    defaultValue: defaultValue.villagenno,
  }),

  road: zOptionalField({
    reg: regex.road,
    typeErr: regexMessage.type.road,
    regErr: regexMessage.format.road,
    defaultValue: defaultValue.road,
  }),

  province_id: zOptionalField({
    reg: regex.province_id,
    typeErr: regexMessage.type.province_id,
    regErr: regexMessage.format.province_id,
    defaultValue: defaultValue.province_id,
    outputType: "number",
  }),
  
  district_id: zOptionalField({
    reg: regex.district_id,
    typeErr: regexMessage.type.district_id,
    regErr: regexMessage.format.district_id,
    defaultValue: defaultValue.district_id,
    outputType: "number",
  }),
   
  subdistrict_id: zOptionalField({
    reg: regex.subdistrict_id,
    typeErr: regexMessage.type.subdistrict_id,
    regErr: regexMessage.format.subdistrict_id,
    defaultValue: defaultValue.subdistrict_id,
    outputType: "number",
  }),

  zip_code: zOptionalField({
    reg: regex.zip_code,
    typeErr: regexMessage.type.zip_code,
    regErr: regexMessage.format.zip_code,
    defaultValue: defaultValue.zip_code,
    outputType: "number",
  }),

});
    



