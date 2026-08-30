// lib/serviceActions/bioActions.js
"use server"
import "server-only";
import { BaseSchema, FullSchema } from "@/lib/validators/form/screening/bio/schema";
import { BaseSchema as BaseCommonSchema } from "@/lib/validators/form/common/schema"; 
import { modelPerson } from "@/model/person";
import { insertAndReturn, updateAndReturn} from "@/model/utils";
import knex from "@/lib/Knex/dbKnex";
import { date, datetime, times, day, nowMs, nowSec, nowDate } from "@/lib/utils/dateFormat";

export async function updateBio(payload, where) {

    try {

        const screening_id = payload.screening_id;
        const bio = payload.bio;
        const create_by = payload.create_by;
        const session_id = payload.session_id;
        const source_file = payload.source_file;

        const parse_screening_id = BaseCommonSchema.pick({ screening_id: true }).safeParse({screening_id: screening_id});
        if (!parse_screening_id.success) throw Object.assign(new Error(parse_screening_id.error.issues[0].message), { status: 400 });

        const parse_bio = FullSchema.safeParse(bio);
        if (!parse_bio.success) throw Object.assign(new Error(parse_bio.error.issues[0].message), { status: 400 });

        const dataBio_insert = parse_bio.data;

        const wherePerson = where?.wherePerson || null;
        const whereScreening = where?.whereScreening || null;
        const includeScreening = where?.includeScreening || false;
        const mustHaveScreening = where?.mustHaveScreening || false;

        const screening = await modelPerson({ wherePerson, whereScreening, includeScreening, mustHaveScreening });
        if (Array.isArray(screening) ? screening.length === 0 : !screening) throw Object.assign(new Error("ไม่พบข้อมูล"), { status: 404 });
        
        const bioData = {
            screening_id,
            not_check_assessments: dataBio_insert.not_check_assessments ?? null,
            cause: dataBio_insert.cause ?? null,
            ans_activity: dataBio_insert.ans_activity?.score ?? null,
            ans_activity_id: dataBio_insert.ans_activity?.grade?.id ?? null,
            ans_balance: dataBio_insert.ans_balance?.score ?? null,
            ans_balance_id: dataBio_insert.ans_balance?.grade?.id ?? null,
            stress_resistance: dataBio_insert.stress_resistance?.score ?? null,
            stress_resistance_id: dataBio_insert.stress_resistance?.grade?.id ?? null,
            stress_index: dataBio_insert.stress_index?.score ?? null,
            stress_index_id: dataBio_insert.stress_index?.grade?.id ?? null,
            fatigue_index: dataBio_insert.fatigue_index?.score ?? null,
            fatigue_index_id: dataBio_insert.fatigue_index?.grade?.id ?? null,
            mean_heart_rate: dataBio_insert.mean_heart_rate?.score ?? null,
            mean_heart_rate_id: dataBio_insert.mean_heart_rate?.grade?.id ?? null,
            electro_cardiac_stability: dataBio_insert.electro_cardiac_stability?.score ?? null,
            electro_cardiac_stability_id: dataBio_insert.electro_cardiac_stability?.grade?.id ?? null,
            ectopic_beat: dataBio_insert.ectopic_beat?.score ?? null,
            ectopic_beat_id: dataBio_insert.ectopic_beat?.grade?.id ?? null,
            wave_level: dataBio_insert.wave_level?.score ?? null,
            wave_level_id: dataBio_insert.wave_level?.grade?.id ?? null,
            create_by: create_by,
            update_date: datetime(),
        };

        const result = await knex.transaction(async (trx) => {

            let typeAction = "insert";

            let newData;

            if (screening?.screenings?.biofeedback) {

                typeAction = "update";

                newData = await updateAndReturn({
                    table: "biofeedback",
                    dataObj: bioData,
                    whereObj: {screening_id},
                    trx
                });

            } else {

                newData = await insertAndReturn({
                    table: "biofeedback", 
                    dataObj: bioData, 
                    whereObj: {screening_id}, 
                    trx
                });

            }

            await insertAndReturn({
                table: "action_logs", 
                dataObj: {
                    entity_type: 'biofeedback',
                    entity_id: screening_id,
                    action: typeAction,
                    create_by: create_by,
                    session_id,
                    old_data: screening?.screenings?.biofeedback ? JSON.stringify(screening.screenings.biofeedback) : null,
                    new_data: JSON.stringify(newData),
                    source_file: source_file,
                },
                trx
            });
        
            let person = null;
           
            person = await modelPerson({
                wherePerson,
                whereScreening,
                includeScreening,
                mustHaveScreening,
                trx,
            });

            if (dataBio_insert?.important_information !== undefined) {
                
                if (person && person?.important_information !== dataBio_insert.important_information ) {

                    await updateAndReturn({
                        table:"persons",
                        dataObj: {
                            important_information: dataBio_insert.important_information,
                            update_date: datetime(),
                        },
                        whereObj: { hn: person.hn },
                        trx
                    });

                    const newDataPerson = await modelPerson({
                        wherePerson,
                        whereScreening,
                        includeScreening,
                        mustHaveScreening,
                        trx,
                    });
                    
                    await insertAndReturn({
                        table: "action_logs", 
                        dataObj: {
                            entity_type: "persons",
                            entity_id: person.hn,
                            action: "update",
                            create_by: create_by,
                            session_id,
                            old_data: JSON.stringify(person),
                            new_data: JSON.stringify(newDataPerson),
                            source_file: source_file,
                        },
                        trx
                    });

                    person = newDataPerson;

                }

            }

            return person;
            
        });

        return result;

    } catch (err) {

        console.error("updateBio transaction error:", err);
        throw err;

    }
    
}