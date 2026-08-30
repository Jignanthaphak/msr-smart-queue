// lib/zodFields/zScoreField.js
import { z } from "zod";

import {zRequiredField } from "@/lib/utils/zRequiredField";
import { regex, replacePattern, regexMessage, defaultValue } from "@/lib/validators/form/login/regex";

const replace = replacePattern;
export { replace };

export { defaultValue };

export const BaseSchema = z.object({
  username:zRequiredField({
    reg: regex.username,
    typeErr: regexMessage.type.username,
    regErr: regexMessage.format.username,
    defaultValue:defaultValue.username
  }),
  password:zRequiredField({
    reg: regex.password,
    typeErr: regexMessage.type.password,
    regErr: regexMessage.format.password,
    defaultValue:defaultValue.password
  }),
  new_password:zRequiredField({
    reg: regex.newPassword,
    typeErr: regexMessage.type.newPassword,
    regErr: regexMessage.format.newPassword,
    defaultValue:defaultValue.newPassword
  }),
});

    