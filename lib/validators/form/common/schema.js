import { z } from "zod";
import {zOptionalField, zRequiredField } from "@/lib/utils/zRequiredField";
import { regex, replacePattern, regexMessage, defaultValue } from "@/lib/validators/form/common/regex";

const replace = replacePattern;

export { replace };

export { defaultValue };

export const BaseSchema = z.object({

  hn: zRequiredField({
    reg: regex.hn,
    typeErr: regexMessage.type.hn,
    regErr: regexMessage.format.hn,
    defaultValue: defaultValue.hn,
    outputType: "number",

  }),

  screening_id: zRequiredField({
    reg: regex.screening_id,
    typeErr: regexMessage.type.screening_id,
    regErr: regexMessage.format.screening_id,
    defaultValue: defaultValue.screening_id,
    outputType: "number",
  }),


});

export const InputSchema = z.lazy(() =>
  z.union([
    // ✅ 1. รองรับ primitive
    zOptionalField({
      reg: regex.input,
      typeErr: regexMessage.type.input,
      regErr: regexMessage.format.input,
      defaultValue: defaultValue.input,
    }),
    // ✅ 2. รองรับ object ซ้อน
    z.record(z.string(), InputSchema),
    // ✅ 3. รองรับ array
    z.array(InputSchema).optional(),
  ])
);
