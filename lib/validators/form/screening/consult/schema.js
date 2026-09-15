import { z } from "zod";

import {zRequiredField, zOptionalField, zScoreField, getScoreConfig } from "@/lib/utils/zRequiredField";
import { regex, range, gradeFns, replacePattern, regexMessage, defaultValue  } from "@/lib/validators/form/screening/consult/regex";

const replace = replacePattern;

export { replace };

export { defaultValue };

export const BaseSchemaConsult = z.object({
    consulting:zRequiredField({
    reg: regex.consulting,
    typeErr: regexMessage.type.consulting,
    regErr: regexMessage.format.consulting,
    defaultValue: defaultValue.consulting
  })
});

export const BaseSchemaStress = z.object({
    stress_no_check:zOptionalField({
        reg: regex.stress_check,
        typeErr: regexMessage.type.stress_check,
        regErr: regexMessage.format.stress_check,
        defaultValue: defaultValue.stress_check,
        outputType: "number",
    }),
    stress_narcotics:zOptionalField({
        reg: regex.stress_check,
        typeErr: regexMessage.type.stress_check,
        regErr: regexMessage.format.stress_check,
        defaultValue: defaultValue.stress_check,
        outputType: "number",
    }),
    stress_psychiatry:zOptionalField({
        reg: regex.stress_check,
        typeErr: regexMessage.type.stress_check,
        regErr: regexMessage.format.stress_check,
        defaultValue: defaultValue.stress_check,
        outputType: "number",
    }),
    stress_economy:zOptionalField({
        reg: regex.stress_check,
        typeErr: regexMessage.type.stress_check,
        regErr: regexMessage.format.stress_check,
        defaultValue: defaultValue.stress_check,
        outputType: "number",
    }),
    stress_family:zOptionalField({
        reg: regex.stress_check,
        typeErr: regexMessage.type.stress_check,
        regErr: regexMessage.format.stress_check,
        defaultValue: defaultValue.stress_check,
        outputType: "number",
    }),
    stress_relationship:zOptionalField({
        reg: regex.stress_check,
        typeErr: regexMessage.type.stress_check,
        regErr: regexMessage.format.stress_check,
        defaultValue: defaultValue.stress_check,
        outputType: "number",
    }),
    stress_love:zOptionalField({
        reg: regex.stress_check,
        typeErr: regexMessage.type.stress_check,
        regErr: regexMessage.format.stress_check,
        defaultValue: defaultValue.stress_check,
        outputType: "number",
    }),
    stress_unplanned:zOptionalField({
        reg: regex.stress_check,
        typeErr: regexMessage.type.stress_check,
        regErr: regexMessage.format.stress_check,
        defaultValue: defaultValue.stress_check,
        outputType: "number",
    }),
    stress_learning:zOptionalField({
        reg: regex.stress_check,
        typeErr: regexMessage.type.stress_check,
        regErr: regexMessage.format.stress_check,
        defaultValue: defaultValue.stress_check,
        outputType: "number",
    }),
    stress_gambling:zOptionalField({
        reg: regex.stress_check,
        typeErr: regexMessage.type.stress_check,
        regErr: regexMessage.format.stress_check,
        defaultValue: defaultValue.stress_check,
        outputType: "number",
    }),
    stress_games:zOptionalField({
        reg: regex.stress_check,
        typeErr: regexMessage.type.stress_check,
        regErr: regexMessage.format.stress_check,
        defaultValue: defaultValue.stress_check,
        outputType: "number",
    }),
    stress_sex:zOptionalField({
        reg: regex.stress_check,
        typeErr: regexMessage.type.stress_check,
        regErr: regexMessage.format.stress_check,
        defaultValue: defaultValue.stress_check,
        outputType: "number",
    }),
    stress_work:zOptionalField({
        reg: regex.stress_check,
        typeErr: regexMessage.type.stress_check,
        regErr: regexMessage.format.stress_check,
        defaultValue: defaultValue.stress_check,
        outputType: "number",
    }),
    stress_colleague:zOptionalField({
        reg: regex.stress_check,
        typeErr: regexMessage.type.stress_check,
        regErr: regexMessage.format.stress_check,
        defaultValue: defaultValue.stress_check,
        outputType: "number",
    }),
    stress_health:zOptionalField({
        reg: regex.stress_check,
        typeErr: regexMessage.type.stress_check,
        regErr: regexMessage.format.stress_check,
        defaultValue: defaultValue.stress_check,
        outputType: "number",
    }),
    // stress_anxious:zOptionalField({
    //     reg: regex.stress_check,
    //     typeErr: regexMessage.type.stress_check,
    //     regErr: regexMessage.format.stress_check,
    //     defaultValue: defaultValue.stress_check,
    //     outputType: "number",
    // }),
    stress_sleep:zOptionalField({
        reg: regex.stress_check,
        typeErr: regexMessage.type.stress_check,
        regErr: regexMessage.format.stress_check,
        defaultValue: defaultValue.stress_check,
        outputType: "number",
    }),
    stress_healthfamily:zOptionalField({
        reg: regex.stress_check,
        typeErr: regexMessage.type.stress_check,
        regErr: regexMessage.format.stress_check,
        defaultValue: defaultValue.stress_check,
        outputType: "number",
    }),
    stress_loss:zOptionalField({
        reg: regex.stress_check,
        typeErr: regexMessage.type.stress_check,
        regErr: regexMessage.format.stress_check,
        defaultValue: defaultValue.stress_check,
        outputType: "number",
    }),
    stress_other:zOptionalField({
          reg: regex.stress_other,
          typeErr: regexMessage.type.stress_other,
          regErr: regexMessage.format.stress_other,
          defaultValue: defaultValue.stress_other,
    }),

});
export const FullSchemaStress = BaseSchemaStress.refine((data) => {

  const keys = Object.keys(data);
  const checkboxKeys = keys.filter(k => k !== "stress_no_check");

  const hasAnyCheckboxChecked = checkboxKeys.some(key => {
    const value = data[key];

    if (typeof value === 'object' && value !== null) {
    
      return Object.values(value).some(v => v !== null && v !== '' && v !== undefined);
    }

    
    return value !== "0" && value !== 0 && value !== null && value !== "";
  });

  const notFoundChecked = Number(data.stress_no_check) === 1;

  return hasAnyCheckboxChecked || notFoundChecked;
    
}, {
  message: "กรุณาเลือกอย่างน้อยหนึ่งข้อ หรือเลือก 'ไม่มีเรื่องเครียดกังวล'",
  path: ["stress_alert"],
});


export const BaseSchemaRisk = z.object({
  risk_rq: zScoreField(getScoreConfig("risk_rq", range, regex, regexMessage, gradeFns)),
  risk_burn_out: zScoreField(getScoreConfig("risk_burn_out", range, regex, regexMessage, gradeFns)),
  risk_st5: zScoreField(getScoreConfig("risk_st5", range, regex, regexMessage, gradeFns)),
  risk_depressed_2qplus:zOptionalField({
    reg: regex.risk_depressed_2qplus,
    typeErr: regexMessage.type.risk_depressed_2qplus,
    regErr: regexMessage.format.risk_depressed_2qplus,
    defaultValue: defaultValue.risk_depressed_2qplus,
    outputType: "number",
  }),
  risk_depressed_9q:zOptionalField({
    reg: regex.risk_depressed_9q,
    typeErr: regexMessage.type.risk_depressed_9q,
    regErr: regexMessage.format.risk_depressed_9q,
    defaultValue: defaultValue.risk_depressed_9q,
    outputType: "number",
}),
  risk_suicide:zOptionalField({
    reg: regex.risk_suicide,
    typeErr: regexMessage.type.risk_suicide,
    regErr: regexMessage.format.risk_suicide,
    defaultValue: defaultValue.risk_suicide,
    outputType: "number",
  }),
  risk_not_found:zOptionalField({
    reg: regex.risk_not_found,
    typeErr: regexMessage.type.risk_not_found,
    regErr: regexMessage.format.risk_not_found,
    defaultValue: defaultValue.risk_not_found,
    outputType: "number",
  })
});
export const FullSchemaRisk = BaseSchemaRisk.refine((data) => {

    const keys = Object.keys(data);
    const checkboxKeys = keys.filter(k => k !== "risk_not_found");
  
    const hasAnyCheckboxChecked = checkboxKeys.some(key => {
      const value = data[key];
  
      if (typeof value === 'object' && value !== null) {
      
        return Object.values(value).some(v => v !== null && v !== '' && v !== undefined);
      }
  
      
      return value !== "0" && value !== 0 && value !== null && value !== "";
    });
  
    const notFoundChecked = Number(data.risk_not_found) === 1;
  
    return hasAnyCheckboxChecked || notFoundChecked;
  }, {
    message: "กรุณาเลือกอย่างน้อยหนึ่งข้อ หรือเลือก 'ไม่พบความเสี่ยง'",
    path: ["risk_alert"],
});

export const BaseSchemaAssist = z.object({
  assist_stress:zOptionalField({
    reg: regex.assist_stress,
    typeErr: regexMessage.type.assist_stress,
    regErr: regexMessage.format.assist_stress,
    defaultValue: defaultValue.assist_stress,
    outputType: "number",
  }),
  assist_stress_relief_techniques:zOptionalField({
    reg: regex.assist_stress_relief_techniques,
    typeErr: regexMessage.type.assist_stress_relief_techniques,
    regErr: regexMessage.format.assist_stress_relief_techniques,
    defaultValue: defaultValue.assist_stress_relief_techniques,
    outputType: "number",
  }),
  assist_first_aid:zOptionalField({
    reg: regex.assist_first_aid,
    typeErr: regexMessage.type.assist_first_aid,
    regErr: regexMessage.format.assist_first_aid,
    defaultValue: defaultValue.assist_first_aid,
    outputType: "number",
  }),
  assist_changing_perspectives:zOptionalField({
    reg: regex.assist_changing_perspectives,
    typeErr: regexMessage.type.assist_changing_perspectives,
    regErr: regexMessage.format.assist_changing_perspectives,
    defaultValue: defaultValue.assist_changing_perspectives,
    outputType: "number",
  }),
  assist_stress_relief_breathing_exercises:zOptionalField({
    reg: regex.assist_stress_relief_breathing_exercises,
    typeErr: regexMessage.type.assist_stress_relief_breathing_exercises,
    regErr: regexMessage.format.assist_stress_relief_breathing_exercises,
    defaultValue: defaultValue.assist_stress_relief_breathing_exercises,
    outputType: "number",
  }),
  assist_initial_consultation:zOptionalField({
    reg: regex.assist_initial_consultation,
    typeErr: regexMessage.type.assist_initial_consultation,
    regErr: regexMessage.format.assist_initial_consultation,
    defaultValue: defaultValue.assist_initial_consultation,
    outputType: "number",
  }),
  assist_sleep:zOptionalField({
    reg: regex.assist_sleep,
    typeErr: regexMessage.type.assist_sleep,
    regErr: regexMessage.format.assist_sleep,
    defaultValue: defaultValue.assist_sleep,
    outputType: "number",
  }),
  assist_exercise:zOptionalField({
    reg: regex.assist_exercise,
    typeErr: regexMessage.type.assist_exercise,
    regErr: regexMessage.format.assist_exercise,
    defaultValue: defaultValue.assist_exercise,
    outputType: "number",
  }),
  assist_other:zOptionalField({
    reg: regex.assist_other,
    typeErr: regexMessage.type.assist_other,
    regErr: regexMessage.format.assist_other,
    defaultValue: defaultValue.assist_other,
    outputType: "number",
  }),
  assist_other_detail:zOptionalField({
    reg: regex.assist_other_detail,
    typeErr: regexMessage.type.assist_other_detail,
    regErr: regexMessage.format.assist_other_detail,
    defaultValue: defaultValue.assist_other_detail,
  }),
  
});
export const FullSchemaAssist = BaseSchemaAssist.superRefine((data, ctx) => {
  
  // 1. ตรวจว่ามีค่าอย่างน้อยหนึ่ง field
  const hasAnyValue = Object.entries(data).some(([key, value]) => {
    if (value === null || value === undefined) return false;
    if (typeof value === "string") return value.trim() !== "";
    if (typeof value === "number") return value !== 0 && !isNaN(value); // <-- รวมเงื่อนไขตรงนี้
    return true;
  });

   if (!hasAnyValue) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "กรุณากรอกอย่างน้อยหนึ่งช่อง",
      path: ["assist_alert"] // path ของ error แยก
    });
  }
  
  // 2. ตรวจ assist_other
  if (Number(data.assist_other) === 1) {
    if (!data.assist_other_detail?.trim()) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "กรุณากรอกรายละเอียดหัวข้ออื่นๆ",
        path: ["assist_other_detail"] // path ของ error แยก
      });
    }
  }
  return true;
});

export const BaseSchemaFollow = z.object({
  follow_id:zOptionalField({
    reg: regex.follow_id,
    typeErr: regexMessage.type.follow_id,
    regErr: regexMessage.format.follow_id,
    defaultValue: defaultValue.follow_id,
    outputType: "number",
  }),
  follow_agree:zOptionalField({
    reg: regex.follow_agree,
    typeErr: regexMessage.type.follow_agree,
    regErr: regexMessage.format.follow_agree,
    defaultValue: defaultValue.follow_agree,
    outputType: "number",
  }),
  follow_date:zOptionalField({
      reg: regex.follow_date,
      typeErr: regexMessage.type.follow_date,
      regErr: regexMessage.format.follow_date,
     defaultValue: defaultValue.follow_date,
  }),
  follow_detail:zOptionalField({
      reg: regex.follow_detail,
      typeErr: regexMessage.type.follow_detail,
      regErr: regexMessage.format.follow_detail,
      defaultValue: defaultValue.follow_detail,
  }),
  follow_tel:zOptionalField({
      reg: regex.follow_tel,
      typeErr: regexMessage.type.follow_tel,
      regErr: regexMessage.format.follow_tel,
      defaultValue: defaultValue.follow_tel,
  }),
  forward_problem:zOptionalField({
      reg: regex.forward_problem,
      typeErr: regexMessage.type.forward_problem,
      regErr: regexMessage.format.forward_problem,
      defaultValue: defaultValue.forward_problem,
  }),
  forward_hospital:zOptionalField({
      reg: regex.forward_hospital,
      typeErr: regexMessage.type.forward_hospital,
      regErr: regexMessage.format.forward_hospital,
      defaultValue: defaultValue.forward_hospital,
  }),
  forward_how_to_follow:zOptionalField({
      reg: regex.forward_how_to_follow,
      typeErr: regexMessage.type.forward_how_to_follow,
      regErr: regexMessage.format.forward_how_to_follow,
      defaultValue: defaultValue.forward_how_to_follow,
  }),
});
export const FullSchemaFollow = BaseSchemaFollow.superRefine((data, ctx) => {

    if (!data.follow_id || Number(data.follow_id) === 0 || data.follow_id === "") {
      
        ctx.addIssue({

          path: ["follow_alert"],
          message: "กรุณาเลือกหัวข้อการติดตาม",
          code: z.ZodIssueCode.custom,

        });

        return; 

    }

    let checkFields = [];
    if (Number(data.follow_id) === 3) {
      checkFields = ["follow_date", "follow_detail"];
    } else if (Number(data.follow_id) === 4) {
      checkFields = ["forward_problem", "forward_hospital", "forward_how_to_follow"];
    }
    checkFields.forEach(key => {

        const value = data[key];
        if (!value?.trim?.()) {

            ctx.addIssue({
            path: [key],
                message: "ห้ามเว้นว่าง",
                code: z.ZodIssueCode.custom,
            });
            return
        }

    });

});

export const BaseSchemaPdx = z.object({
  pdx_codes: z.union([z.array(z.string()), z.string()]).optional().nullable(),
  pdx_no_check: zOptionalField({
    reg: regex.pdx_check,
    typeErr: regexMessage.type.pdx_check,
    regErr: regexMessage.format.pdx_check,
    defaultValue: defaultValue.pdx_no_check,
    outputType: "number",
  }),
  pdx_other: zOptionalField({
    reg: regex.pdx_other,
    typeErr: regexMessage.type.pdx_other,
    regErr: regexMessage.format.pdx_other,
    defaultValue: defaultValue.pdx_other,
  }),
});

export const FullSchemaPdx = BaseSchemaPdx.superRefine((data, ctx) => {
  let codes = [];
  if (Array.isArray(data.pdx_codes)) {
    codes = data.pdx_codes;
  } else if (typeof data.pdx_codes === "string") {
    try {
      codes = JSON.parse(data.pdx_codes);
    } catch {
      codes = data.pdx_codes.split(",").map(s => s.trim()).filter(Boolean);
    }
  }

  const hasCodes = Array.isArray(codes) && codes.length > 0;
  const isNoCheck = Number(data.pdx_no_check) === 1;
  const hasOther = Boolean(data.pdx_other && String(data.pdx_other).trim().length > 0);

  if (!hasCodes && !isNoCheck && !hasOther) {
    ctx.addIssue({
      path: ["pdx_alert"],
      message: "กรุณาเลือกรหัส PDx 1 รหัส หรือเลือก 'ไม่พบรหัส PDx'",
      code: z.ZodIssueCode.custom,
    });
  }

  if (hasCodes && codes.length > 1) {
    ctx.addIssue({
      path: ["pdx_alert"],
      message: "รหัส PDx สามารถเลือกได้เพียง 1 รหัสเท่านั้น",
      code: z.ZodIssueCode.custom,
    });
  }
});

export const BaseSchemaSatisfaction = z.object({
  satisfaction_score: zOptionalField({
    reg: regex.satisfaction_score,
    typeErr: regexMessage.type.satisfaction_score,
    regErr: regexMessage.format.satisfaction_score,
    defaultValue: defaultValue.satisfaction_score,
    outputType: "number",
  }),
  satisfaction_level: zOptionalField({
    reg: regex.satisfaction_level,
    typeErr: regexMessage.type.satisfaction_level,
    regErr: regexMessage.format.satisfaction_level,
    defaultValue: defaultValue.satisfaction_level,
  }),
  satisfaction_note: zOptionalField({
    reg: regex.satisfaction_note,
    typeErr: regexMessage.type.satisfaction_note,
    regErr: regexMessage.format.satisfaction_note,
    defaultValue: defaultValue.satisfaction_note,
  }),
});

export const FullSchemaSatisfaction = BaseSchemaSatisfaction.superRefine((data, ctx) => {
  if (!data.satisfaction_level || !["ไม่พอใจ", "พอใจ", "พอใจมาก"].includes(data.satisfaction_level)) {
    ctx.addIssue({
      path: ["satisfaction_level"],
      message: "กรุณาเลือกระดับความพึงพอใจ (ไม่พอใจ, พอใจ หรือ พอใจมาก)",
      code: z.ZodIssueCode.custom,
    });
  }
});





