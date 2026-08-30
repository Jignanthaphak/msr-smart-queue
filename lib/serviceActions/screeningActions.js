// lib/serviceActions/screeningActions.js
"use server";
import "server-only";
import { modelPerson, modelPersons } from "@/model/person";
import { modelScreenings, modelScreening } from "@/model/screening";
import { modelAppointments } from "@/model/appointment";
import { insertAndReturn, updateAndReturn } from "@/model/utils";
import knex from "@/lib/Knex/dbKnex";
import { date, datetime } from "@/lib/utils/dateFormat";
import { BaseSchema as BaseCommonSchema } from "@/lib/validators/form/common/schema"; 

export async function searchHome(where) {

    try {
      
        const whereScreening = where?.whereScreening || null;
        const wherePerson = where?.wherePerson || null;
        const includePerson = where?.includePerson || false;
        const mustHavePerson = where?.mustHavePerson || false;
        const screenings = await modelScreenings({whereScreening, includePerson, wherePerson, mustHavePerson});
        if (Array.isArray(screenings) ? screenings.length === 0 : !screenings) throw Object.assign(new Error("ไม่พบข้อมูล"), { status: 404 });
       
        return screenings;

    } catch (err) {

        console.error("searchHome error:", err);
        throw err;

    }
}

export async function searchScreenings(where) {

    try {
      
        const wherePerson = where?.wherePerson || null;
        const whereScreening = where?.whereScreening || null;
        const whereConsult = where?.whereConsult || null;
        const includeScreening = where?.includeScreening || false;
        const mustHaveScreening = where?.mustHaveScreening || false;
        const mustHaveConsult = where?.mustHaveConsult || false;
        
        const persons = await modelPersons({ wherePerson, whereScreening, whereConsult, includeScreening, mustHaveScreening, mustHaveConsult });
        if (Array.isArray(persons) ? persons.length === 0 : !persons) throw Object.assign(new Error("ไม่พบข้อมูลที่ค้นหา"), { status: 404 });
       
        return persons;

    } catch (err) {

        console.error("searchScreenings error:", err);
        throw err;

    }
}

export async function searchAppointments(where) {

    try {

        const result = await modelAppointments(where);
        if (Array.isArray(result) ? result.length === 0 : !result) throw Object.assign(new Error("ไม่พบข้อมูลที่ค้นหา"), { status: 404 });

        return result;

    } catch (err) {

        console.error("searchAppointments error:", err);
        throw err;

    }
}

export async function finishFollowUp(payload, where) {

    try {

        let screening_id = payload.screening_id;
        const create_by = payload.create_by;
        const session_id = payload.session_id;
        const source_file = payload.source_file;

        const parse_screening_id = BaseCommonSchema.pick({ screening_id: true }).safeParse({ screening_id: screening_id });
        if (!parse_screening_id.success) throw Object.assign(new Error(parse_screening_id.error.issues[0].message), { status: 400 });

        screening_id = parse_screening_id.data.screening_id;

        const consult = await knex("consult").where({ screening_id }).first();
        if (!consult) throw Object.assign(new Error("ไม่พบข้อมูล Consult ของการนัดหมายนี้"), { status: 404 });
        if (consult.follow_id !== 3) throw Object.assign(new Error("รายการนี้ไม่ใช่การนัดหมาย"), { status: 400 });
        if (consult.follow_status === 1) throw Object.assign(new Error("รายการนี้สิ้นสุดการติดตามแล้ว"), { status: 400 });

        const result = await knex.transaction(async (trx) => {

            const newData = await updateAndReturn({
                table: "consult",
                dataObj: {
                    follow_status: 1,
                    follow_status_by: create_by,
                    follow_status_date: datetime(),
                    update_date: datetime(),
                },
                whereObj: { screening_id },
                trx
            });

            await insertAndReturn({
                table: "action_logs",
                dataObj: {
                    entity_type: "consult",
                    entity_id: consult.consult_id,
                    action: "update",
                    create_by: create_by,
                    session_id,
                    old_data: JSON.stringify(consult),
                    new_data: JSON.stringify(newData),
                    source_file: source_file,
                },
                trx
            });

            return newData;

        });

        return result;

    } catch (err) {

        console.error("finishFollowUp error:", err);
        throw err;

    }
}

export async function createScreenings(payload, where) {

    try {
      
        let hn = payload.hn;
        const create_by = payload.create_by;
        const session_id = payload.session_id;
        const source_file = payload.source_file;

        const parse_hn = BaseCommonSchema.pick({ hn: true }).safeParse({ hn: hn });
        if (!parse_hn.success) throw Object.assign(new Error(parse_hn.error.issues[0].message), { status: 400 });

        hn = parse_hn.data.hn;

        const whereScreening = where?.whereScreening || null;
        const includePerson = where?.includePerson || false;
        const screening = await modelScreening({whereScreening, includePerson});
        if (Array.isArray(screening) ? screening.length > 0 : !!screening) throw Object.assign(new Error(`วันนี้มีการส่งตรวจข้อมูลนี้แล้ว เมื่อเวลา: ${datetime(screening.create_date)}`), { status: 400 });

        const result = await knex.transaction(async (trx) => {
    
            const createScreening = await insertAndReturn({
                table: "screening", 
                dataObj: {
                    hn,
                    create_by: create_by,
                    date: date(),
                }, 
                pkField: "screening_id", 
                trx
            });
            
            const newData = await modelScreening({ 
                whereScreening:[{ type: 'and', field: 'screening_id', operator: '=', value: createScreening.screening_id }],
                trx
            });

            await insertAndReturn({
                table: "action_logs", 
                dataObj: {
                    entity_type: 'screening',
                    entity_id: createScreening.screening_id,
                    action: 'insert',
                    create_by: create_by,
                    session_id,
                    old_data: null,
                    new_data: JSON.stringify(newData),
                    source_file: source_file,
                },
                trx
            });

            return newData; 
            
        });    
       
        return result;

    } catch (err) {

        console.error("createScreenings error:", err);
        throw err;

    }
}

export async function bioSendScreenings(payload, where) {

    try {
      
        let screening_id = payload.screening_id;
        const create_by = payload.create_by;
        const session_id = payload.session_id;
        const source_file = payload.source_file;

        const parse_screening_id = BaseCommonSchema.pick({ screening_id: true }).safeParse({ screening_id: screening_id });
        if (!parse_screening_id.success) throw Object.assign(new Error(parse_screening_id.error.issues[0].message), { status: 400 });

        screening_id = parse_screening_id.data.screening_id;

        const whereScreening = where?.whereScreening || null;
        const includePerson = where?.includePerson || false;
        const screening = await modelScreening({whereScreening, includePerson});
        if (Array.isArray(screening) ? screening.length === 0 : !screening) throw Object.assign(new Error("ไม่พบข้อมูลการตรวจ"), { status: 404 });

        if (screening.status_id === 2) {
           throw Object.assign(new Error(`มีการส่งข้อมูล Bio ไปแล้ว เมื่อเวลา: ${datetime(screening.update_date)}`), { status: 400 });
        }
    
        if(screening.status_id !== 1){
            throw Object.assign(new Error("ข้อมูลนี้ไม่ได้อยู่ในสถานะที่ส่งข้อมูล Bio ได้"), { status: 400 });
        }

        const result = await knex.transaction(async (trx) => {
    
            await updateAndReturn({
                table: "screening",
                dataObj: {
                    status_id: 2,
                    create_by: create_by,
                    update_date: datetime(),
                },
                whereObj: {screening_id},
                trx
            });

            const newData = await modelScreening({ whereScreening, trx });

            await insertAndReturn({
                table: "action_logs", 
                dataObj: {
                    entity_type: "screening",
                    entity_id: screening_id,
                    action: "update",
                    create_by: create_by,
                    session_id,
                    old_data: JSON.stringify(screening),
                    new_data: JSON.stringify(newData),
                    source_file: source_file,
                },
                trx
            });

            return newData;
            
        });    
       
        return result;

    } catch (err) {

        console.error("bioSendScreenings error:", err);
        throw err;

    }
}

export async function consultSendScreenings(payload, where) {

    try {
      
        let screening_id = payload.screening_id;
        const create_by = payload.create_by;
        const session_id = payload.session_id;
        const source_file = payload.source_file;

        const parse_screening_id = BaseCommonSchema.pick({ screening_id: true }).safeParse({ screening_id: screening_id });
        if (!parse_screening_id.success) throw Object.assign(new Error(parse_screening_id.error.issues[0].message), { status: 400 });

        screening_id = parse_screening_id.data.screening_id;

        const whereScreening = where?.whereScreening || null;
        const includePerson = where?.includePerson || false;
        const screening = await modelScreening({whereScreening, includePerson});
        if (Array.isArray(screening) ? screening.length === 0 : !screening) throw Object.assign(new Error("ไม่พบข้อมูลการตรวจ"), { status: 404 });

        if (screening.status_id === 4) {
           throw Object.assign(new Error(`มีการส่งข้อมูลเสร็จสิ้นไปแล้ว เมื่อเวลา: ${datetime(screening.update_date)}`), { status: 400 });
        }
    
        if(screening.status_id !== 3){
            throw Object.assign(new Error("ข้อมูลนี้ไม่ได้อยู่ในสถานะที่ส่งข้อมูลเสร็จสิ้นได้"), { status: 400 });
        }

        const screeningActive = await modelScreening({
            whereScreening:[
            { type: 'and', field: 'create_by', operator: '=', value: create_by },
            { type: 'and', field: 'date', operator: '=', value: date()},
            { type: 'and', field: 'status_id', operator: '=', value: 3},
            ]
        });
        if(screeningActive && screening.hn !== screeningActive.hn)  throw Object.assign(new Error("ไม่สามารถเสร็จสิ้น Consoult ได้เนื่องจากมีการ Consult อยู่แล้วกับ HN : "+ screeningActive.hn), { status: 404 });

        const result = await knex.transaction(async (trx) => {
    
            await updateAndReturn({
                table: "screening",
                dataObj: {
                    status_id: 4,
                    create_by: create_by,
                    update_date: datetime(),
                },
                whereObj: {screening_id},
                trx
            });

            const newData = await modelScreening({ whereScreening, trx });

            await insertAndReturn({
                table: "action_logs", 
                dataObj: {
                    entity_type: "screening",
                    entity_id: screening_id,
                    action: "update",
                    create_by: create_by,
                    session_id,
                    old_data: JSON.stringify(screening),
                    new_data: JSON.stringify(newData),
                    source_file: source_file,
                },
                trx
            });

            return newData;
            
        });    
       
        return result;

    } catch (err) {

        console.error("consultSendScreenings error:", err);
        throw err;

    }
}

export async function closeConsultScreenings(payload, where) {

    try {
      
        let screening_id = payload.screening_id;
        const create_by = payload.create_by;
        const session_id = payload.session_id;
        const source_file = payload.source_file;

        const parse_screening_id = BaseCommonSchema.pick({ screening_id: true }).safeParse({ screening_id: screening_id });
        if (!parse_screening_id.success) throw Object.assign(new Error(parse_screening_id.error.issues[0].message), { status: 400 });

        screening_id = parse_screening_id.data.screening_id;

        const whereScreening = where?.whereScreening || null;
        const includePerson = where?.includePerson || false;
        const screening = await modelScreening({whereScreening, includePerson});
        if (Array.isArray(screening) ? screening.length === 0 : !screening) throw Object.assign(new Error("ไม่พบข้อมูลการตรวจ"), { status: 404 });

        if (![2,3].includes(screening.status_id) ){
           
            const status_name = screening?.screening_status?.status_name;

            throw Object.assign(new Error(`สถานะ : ${status_name} ไม่สามารถปิดเคส Consult ได้`), { status: 400 });
        }

        const screeningActive = await modelScreening({
            whereScreening:[
            { type: 'and', field: 'create_by', operator: '=', value: create_by },
            { type: 'and', field: 'date', operator: '=', value: date()},
            { type: 'and', field: 'status_id', operator: '=', value: 3},
            ]
        });
        if(screeningActive && screening.hn !== screeningActive.hn)  throw Object.assign(new Error("ไม่สามารถปิดเคส Consoult ได้เนื่องจากมีการ Consult อยู่แล้วกับ HN : "+ screeningActive.hn), { status: 404 });

        const result = await knex.transaction(async (trx) => {
    
            await updateAndReturn({
                table: "screening",
                dataObj: {
                    status_id: 5,
                    create_by: create_by,
                    update_date: datetime(),
                },
                whereObj: {screening_id},
                trx
            });

            const newData = await modelScreening({ whereScreening, trx });

            await insertAndReturn({
                table: "action_logs", 
                dataObj: {
                    entity_type: "screening",
                    entity_id: screening_id,
                    action: "update",
                    create_by: create_by,
                    session_id,
                    old_data: JSON.stringify(screening),
                    new_data: JSON.stringify(newData),
                    source_file: source_file,
                },
                trx
            });

            return newData;
            
        });    
       
        return result;

    } catch (err) {

        console.error("closeSendScreenings error:", err);
        throw err;

    }
}

export async function startConsultScreenings(payload, where) {

    try {
      
        let screening_id = payload.screening_id;
        const create_by = payload.create_by;
        const session_id = payload.session_id;
        const source_file = payload.source_file;

        const parse_screening_id = BaseCommonSchema.pick({ screening_id: true }).safeParse({ screening_id: screening_id });
        if (!parse_screening_id.success) throw Object.assign(new Error(parse_screening_id.error.issues[0].message), { status: 400 });

        screening_id = parse_screening_id.data.screening_id;

        const whereScreening = where?.whereScreening || null;
        const includePerson = where?.includePerson || false;
        const screening = await modelScreening({whereScreening, includePerson});
        if (Array.isArray(screening) ? screening.length === 0 : !screening) throw Object.assign(new Error("ไม่พบข้อมูลการตรวจ"), { status: 404 });

        if (![2,5].includes(screening.status_id) ){
           
            const status_name = screening?.screening_status?.status_name;

            throw Object.assign(new Error(`สถานะ : ${status_name} ไม่สามารถเริ่ม Consult ได้`), { status: 400 });
        }

        const screeningActive = await modelScreening({
            whereScreening:[
            { type: 'and', field: 'create_by', operator: '=', value: create_by },
            { type: 'and', field: 'date', operator: '=', value: date()},
            { type: 'and', field: 'status_id', operator: '=', value: 3},
            ]
        });
        if(screeningActive && screening.hn !== screeningActive.hn)  throw Object.assign(new Error("ไม่สามารถเริ่ม Consoult ได้เนื่องจากมีการ Consult อยู่แล้วกับ HN : "+ screeningActive.hn), { status: 404 });

        const result = await knex.transaction(async (trx) => {
    
            await updateAndReturn({
                table: "screening",
                dataObj: {
                    status_id: 3,
                    create_by: create_by,
                    update_date: datetime(),
                },
                whereObj: {screening_id},
                trx
            });

            const newData = await modelScreening({ whereScreening, trx });

            await insertAndReturn({
                table: "action_logs", 
                dataObj: {
                    entity_type: "screening",
                    entity_id: screening_id,
                    action: "update",
                    create_by: create_by,
                    session_id,
                    old_data: JSON.stringify(screening),
                    new_data: JSON.stringify(newData),
                    source_file: source_file,
                },
                trx
            });

            const person = await modelPerson({ 
                wherePerson: null,
                whereScreening,
                includeScreening: true,
                mustHaveScreening: true,
                trx
            });

            return person;
            
        });    
       
        return result;

    } catch (err) {

        console.error("startConsultScreenings error:", err);
        throw err;

    }
}

