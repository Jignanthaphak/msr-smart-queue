// lib/utils/zRequiredField.js
import { z } from "zod";

export function zRequiredField({ reg, typeErr, regErr, outputType = "string" }) {
  return z.preprocess(
    (val) => {
      if (typeof val === "string" || typeof val === "number") {
        const trimmed = String(val).trim();
        return outputType === "number" ? Number(trimmed) : trimmed;
      }
      return undefined;
    },
    z.union([z.string(), z.number()], { required_error: typeErr })
      .refine((val) => reg.test(String(val)), { message: regErr })
  );
}

export function zOptionalField({ reg, typeErr, regErr, defaultValue = null, outputType = "string" }) {
  return z
    .preprocess((val) => {
      if (val === "" || val === undefined) return defaultValue;
      if (typeof val === "string" || typeof val === "number") {
        const trimmed = String(val).trim();
        return outputType === "number" ? Number(trimmed) : trimmed;
      }
      if (val === null) return null;
      return undefined;
    }, 
    z.custom((val) => {
      if (val === null) return true;
      return typeof val === "string" || typeof val === "number";
    }, { message: typeErr })
    .refine((val) => val === null || reg.test(String(val)), { message: regErr })
    )
    .nullable()
    .default(defaultValue);
}

export function zScoreField(cfg, defaultValue = { score: null, grade: null }) {
  return z.preprocess(
    (val) => {
     
      if (val === null || val === undefined) return undefined;

      const valType = typeof val;
      if (valType === "string" || valType === "number") {
        const strVal = String(val).trim();
        if (strVal === "") return undefined;
        return strVal;
      }
      return val;
    },
    z
      .string({ required_error: cfg.typeErr })
      .refine((val) => cfg.regex.test(val), { message: cfg.formatErr })
      .transform((val) => Number(val))
      .transform((num) => Math.round(num))
      .refine((num) => num >= cfg.min && num <= cfg.max, { message: cfg.rangeErr })
      .transform((num) => ({ score: num, grade: cfg.gradeFn(num) }))
      .optional()
  ).transform((val) => val ?? defaultValue);
}

export function getScoreConfig(name, range, regex, regexMessage, gradeFns) {
  
  if (!range[name] || 
    !regex[name] ||  
    !regexMessage.format[name] ||
    !regexMessage.type[name] ||
    !regexMessage.range[name] || 
    !gradeFns[name]) {
   
    throw new Error(`ไม่พบ config สำหรับชื่อ '${name}'`);
  }
  return {
    min: range[name].min,
    max: range[name].max,
    regex: regex[name],
    formatErr: regexMessage.format[name],
    typeErr: regexMessage.type[name],
    rangeErr: regexMessage.range[name],
    gradeFn: gradeFns[name],
    defaultValue:{score:null, grade:null}
  };
}


