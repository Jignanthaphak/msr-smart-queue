// lib/serviceActions/consultActions.js
"use server"
import "server-only";
import { BaseSchemaConsult, FullSchemaStress, FullSchemaRisk, FullSchemaAssist, FullSchemaFollow } from "@/lib/validators/form/screening/consult/schema";
import { BaseSchema as BaseCommonSchema } from "@/lib/validators/form/common/schema"; 
import { modelPerson } from "@/model/person";
import { insertAndReturn, updateAndReturn} from "@/model/utils";
import knex from "@/lib/Knex/dbKnex";
import { date, datetime, times, day, nowMs, nowSec, nowDate } from "@/lib/utils/dateFormat";

export async function updateConsult(payload, where) {

    try {

        const screening_id = payload.screening_id;
        const consult = payload.consult;
        const create_by = payload.create_by;
        const session_id = payload.session_id;
        const source_file = payload.source_file;

        const parse_screening_id = BaseCommonSchema.pick({ screening_id: true }).safeParse({screening_id: screening_id});
        if (!parse_screening_id.success) throw Object.assign(new Error(parse_screening_id.error.issues[0].message), { status: 400 });

        const parse_dataConsulting = BaseSchemaConsult.safeParse(consult.ConsultingForm);
        if (!parse_dataConsulting.success) throw Object.assign(new Error(parse_dataConsulting.error.issues[0].message), { status: 400 });
        const dataConsulting = parse_dataConsulting.data;

        const parse_dataStress = FullSchemaStress.safeParse(consult.StressForm);
        if (!parse_dataStress.success) throw Object.assign(new Error(parse_dataStress.error.issues[0].message), { status: 400 });
        const dataStress = parse_dataStress.data;

        const parse_dataRisk = FullSchemaRisk.safeParse(consult.RiskForm);
        if (!parse_dataRisk.success) throw Object.assign(new Error(parse_dataRisk.error.issues[0].message), { status: 400 });
        const dataRisk = parse_dataRisk.data;

        const parse_dataAssist = FullSchemaAssist.safeParse(consult.AssistForm);
        if (!parse_dataAssist.success) throw Object.assign(new Error(parse_dataAssist.error.issues[0].message), { status: 400 });
        const dataAssist = parse_dataAssist.data;

        const parse_dataFollow = FullSchemaFollow.safeParse(consult.FollowForm);
        if (!parse_dataFollow.success) throw Object.assign(new Error(parse_dataFollow.error.issues[0].message), { status: 400 });
        const dataFollow = parse_dataFollow.data;

        const wherePerson = where?.wherePerson || null;
        const whereScreening = where?.whereScreening || null;
        const includeScreening = where?.includeScreening || false;
        const mustHaveScreening = where?.mustHaveScreening || false;

        const screening = await modelPerson({ wherePerson, whereScreening, includeScreening, mustHaveScreening });
        if (Array.isArray(screening) ? screening.length === 0 : !screening) throw Object.assign(new Error("ไม่พบข้อมูล"), { status: 404 });
        
        const dataInsert = {

            screening_id,

            consulting: dataConsulting.consulting ?? null,

            stress_no_check: dataStress.stress_no_check ?? null,
            stress_narcotics: dataStress.stress_narcotics ?? null,
            stress_psychiatry: dataStress.stress_psychiatry ?? null,
            stress_economy: dataStress.stress_economy ?? null,
            stress_family: dataStress.stress_family ?? null,
            stress_relationship: dataStress.stress_relationship ?? null,
            stress_love: dataStress.stress_love ?? null,
            stress_unplanned: dataStress.stress_unplanned ?? null,
            stress_learning: dataStress.stress_learning ?? null,
            stress_gambling: dataStress.stress_gambling ?? null,
            stress_games: dataStress.stress_games ?? null,
            stress_sex: dataStress.stress_sex ?? null,
            stress_work: dataStress.stress_work ?? null,
            stress_colleague: dataStress.stress_colleague ?? null,
            stress_health: dataStress.stress_health ?? null,
            stress_anxious: dataStress.stress_anxious ?? null,
            stress_sleep: dataStress.stress_sleep ?? null,
            stress_healthfamily: dataStress.stress_healthfamily ?? null,
            stress_loss: dataStress.stress_loss ?? null,
            stress_other: dataStress.stress_other ?? null,

            risk_not_found: dataRisk.risk_not_found ?? null,
            risk_rq: dataRisk.risk_rq?.score ?? null,
            risk_rq_id: dataRisk.risk_rq?.grade?.id ?? null,
            risk_burn_out: dataRisk.risk_burn_out?.score ?? null,
            risk_burn_out_id: dataRisk.risk_burn_out.grade?.id ?? null,
            risk_st5: dataRisk.risk_st5.score ?? null,
            risk_st5_id: dataRisk.risk_st5.grade?.id ?? null,
            risk_depressed_2qplus: dataRisk.risk_depressed_2qplus ?? null,
            risk_depressed_9q: dataRisk.risk_depressed_9q ?? null,
            risk_suicide: dataRisk.risk_suicide ?? null,

            assist_stress: dataAssist.assist_stress ?? null,
            assist_stress_relief_techniques: dataAssist.assist_stress_relief_techniques ?? null,
            assist_first_aid: dataAssist.assist_first_aid ?? null,
            assist_changing_perspectives: dataAssist.assist_changing_perspectives ?? null,
            assist_stress_relief_breathing_exercises: dataAssist.assist_stress_relief_breathing_exercises ?? null,
            assist_initial_consultation: dataAssist.assist_initial_consultation ?? null,
            assist_sleep: dataAssist.assist_sleep ?? null,
            assist_exercise: dataAssist.assist_exercise ?? null,
            assist_other: dataAssist.assist_other ?? null,
            assist_other_detail: dataAssist.assist_other_detail ?? null,

            follow_id: dataFollow.follow_id ?? null,
            follow_agree: dataFollow.follow_agree ?? null,
            follow_date: dataFollow.follow_date ? datetime(dataFollow.follow_date) : null,
            follow_detail: dataFollow.follow_detail ?? null,
            follow_tel: dataFollow.follow_tel ?? null,
            forward_problem: dataFollow.forward_problem ?? null,
            forward_hospital: dataFollow.forward_hospital ?? null,
            forward_how_to_follow: dataFollow.forward_how_to_follow ?? null,
            // หมายเหตุ: ไม่เขียน follow_counseling_center / follow_counseling_center_tel อีกแล้ว
            // (ลบหัวข้อ "ศูนย์ให้คำปรึกษา" ออกจากฟอร์ม 2026-07-26) — จงใจไม่ใส่ไว้ที่นี่
            // เพื่อไม่ให้การบันทึกซ้ำไปล้างข้อมูลเดิมใน DB เป็น null

            create_by: create_by,
            update_date: datetime(),
        };

        const result = await knex.transaction(async (trx) => {

            let typeAction = "insert";

            let newData;

            if (screening?.screenings?.consult) {

                typeAction = "update";

                newData = await updateAndReturn({
                    table: "consult",
                    dataObj: dataInsert,
                    whereObj: {screening_id},
                    trx
                });
            
            } else {

                newData = await insertAndReturn({
                    table: "consult", 
                    dataObj: dataInsert, 
                    whereObj: {screening_id}, 
                    trx
                });

            }

            await insertAndReturn({
                table: "action_logs", 
                dataObj: {
                    entity_type: 'consult',
                    entity_id: screening_id,
                    action: typeAction,
                    create_by: create_by,
                    session_id,
                    old_data: screening?.screenings?.consult ? JSON.stringify(screening.screenings.consult) : null,
                    new_data: JSON.stringify(newData),
                    source_file: source_file,
                },
                trx
            });
        
            const data_return = await modelPerson({ wherePerson, whereScreening, includeScreening, mustHaveScreening, trx });

            return data_return;
            
        });

        return result;

    } catch (err) {

        console.error("updateConsult transaction error:", err);
        throw err;

    }
    
}