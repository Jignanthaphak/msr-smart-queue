import { z } from "zod";

import {zRequiredField, zOptionalField, zScoreField, getScoreConfig } from "@/lib/utils/zRequiredField";
import { regex, range, gradeFns, replacePattern, regexMessage, defaultValue  } from "@/lib/validators/form/screening/bio/regex";

const replace = replacePattern;

export { replace };

export { defaultValue };

export const BaseSchema = z.object({
    ans_activity: zScoreField(getScoreConfig("ans_activity", range, regex, regexMessage, gradeFns)),
    ans_balance: zScoreField(getScoreConfig("ans_balance", range, regex, regexMessage, gradeFns)),
    stress_resistance: zScoreField(getScoreConfig("stress_resistance", range, regex, regexMessage, gradeFns)),
    stress_index: zScoreField(getScoreConfig("stress_index", range, regex, regexMessage, gradeFns)),
    fatigue_index: zScoreField(getScoreConfig("fatigue_index", range, regex, regexMessage, gradeFns)),
    mean_heart_rate: zScoreField(getScoreConfig("mean_heart_rate", range, regex, regexMessage, gradeFns)),
    electro_cardiac_stability: zScoreField(getScoreConfig("electro_cardiac_stability", range, regex, regexMessage, gradeFns)),
    ectopic_beat: zScoreField(getScoreConfig("ectopic_beat", range, regex, regexMessage, gradeFns)),
    wave_level: zScoreField(getScoreConfig("wave_level", range, regex, regexMessage, gradeFns)),
    cause:zOptionalField({
        reg: regex.cause,
        typeErr: regexMessage.type.cause,
        regErr: regexMessage.format.cause,
        defaultValue: defaultValue.cause
    }),
    not_check_assessments:zOptionalField({
        reg: regex.not_check_assessments,
        typeErr: regexMessage.type.not_check_assessments,
        regErr: regexMessage.format.not_check_assessments,
        defaultValue: defaultValue.not_check_assessments,
        outputType: "number",
    }),
    important_information:zOptionalField({
        reg: regex.important_information,
        typeErr: regexMessage.type.important_information,
        regErr: regexMessage.format.important_information,
        defaultValue: defaultValue.important_information,
    }),
    screening_id:zRequiredField({
        reg: regex.screening_id,
        typeErr: regexMessage.type.screening_id,
        regErr: regexMessage.format.screening_id,
        defaultValue: defaultValue.screening_id,
        outputType: "number",
    }),
});

export const FullSchema = BaseSchema.superRefine((data, ctx) => {

    if (Number(data.not_check_assessments) === 1 && (data.cause === "" || !data.cause)) {
        ctx.addIssue({
            path: ["cause"],
            message: "กรุณากรอกข้อมูล สาเหตุ ของการไม่ตรวจประเมิน",
            code: z.ZodIssueCode.custom,
        });
        return; 
    }
  
    if (Number(data.not_check_assessments) !== 1) {
        
        for (const key of Object.keys(data)) {
        
            if (key === "screening_id" || key === "not_check_assessments" || key === "cause" || key === "important_information") continue;
          
            const value = data[key]?.score;

            if (value === null || value === undefined || value === "") {
                ctx.addIssue({
                    path: [key],
                    message: "กรุณากรอกข้อมูลให้ครบถ้วน",
                    code: z.ZodIssueCode.custom,
                });
                return;
            }
        }
    }

});


