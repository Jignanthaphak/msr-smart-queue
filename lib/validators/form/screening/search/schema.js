import { z } from "zod";

import {zOptionalField } from "@/lib/utils/zRequiredField";
import { regex, replacePattern, regexMessage, defaultValue } from "@/lib/validators/form/screening/person/regex";

const replace = {
  hn:replacePattern.hn,
  nameTh:replacePattern.nameTh,
  nameEn:replacePattern.nameEn,
  idCard:replacePattern.idcard,
  passport:replacePattern.passport,
};

export { replace };

export { defaultValue };

export const BaseSchema = z.object({

  hn: zOptionalField({
    reg: regex.hn,
    typeErr: regexMessage.type.hn,
    regErr: regexMessage.format.hn,
    defaultValue:null
  }),

  nameTh: zOptionalField({
    reg: regex.nameTh,
    typeErr: regexMessage.type.nameTh,
    regErr: regexMessage.format.nameTh,
    defaultValue:null
  }),

  nameEn: zOptionalField({
    reg: regex.nameEn,
    typeErr: regexMessage.type.nameEn,
    regErr: regexMessage.format.nameEn,
    defaultValue:null
  }),

  idCard: zOptionalField({
    reg: regex.idcard,
    typeErr: regexMessage.type.idcard,
    regErr: regexMessage.format.idcard,
    defaultValue:null
  }),

  passport: zOptionalField({
    reg: regex.passport,
    typeErr: regexMessage.type.passport,
    regErr: regexMessage.format.passport,
    defaultValue:null
  }),

});



