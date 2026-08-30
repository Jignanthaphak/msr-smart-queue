import { z } from "zod";

import {zRequiredField } from "@/lib/utils/zRequiredField";
import { regex, replacePattern, regexMessage, defaultValue  } from "@/lib/validators/form/screening/home/regex";

const replace = replacePattern;

export { replace };

export { defaultValue };

export const BaseSchema = z.object({

    startdate: zRequiredField({
    reg: regex.startdate,
    typeErr: regexMessage.type.startdate,
    regErr: regexMessage.format.startdate,
    defaultValue: defaultValue.startdate
  }),
  
  enddate: zRequiredField({
    reg: regex.enddate,
    typeErr: regexMessage.type.enddate,
    regErr: regexMessage.format.enddate,
    defaultValue: defaultValue.enddate
  }),

});







