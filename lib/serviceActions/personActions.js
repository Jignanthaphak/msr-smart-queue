// lib/serviceActions/personActions.js
"use server";
import "server-only";
import { BaseInfoSchema, BaseAddressSchema } from "@/lib/validators/form/screening/person/schema";
import { modelPerson, modelPersons } from "@/model/person";
import { insertAndReturn, updateAndReturn } from "@/model/utils";
import knex from "@/lib/Knex/dbKnex";
import { date, datetime } from "@/lib/utils/dateFormat";
import { BaseSchema as BaseCommonSchema } from "@/lib/validators/form/common/schema"; 

export async function searchPersons(where) {

    try {
      
        const wherePerson = where?.wherePerson || null;
        const whereScreening = where?.whereScreening || null;
        const includeScreening = where?.includeScreening || false;
        const mustHaveScreening = where?.mustHaveScreening || false;
        const persons = await modelPersons({ wherePerson, whereScreening, includeScreening, mustHaveScreening });
        if (Array.isArray(persons) ? persons.length === 0 : !persons) throw Object.assign(new Error("ไม่พบข้อมูลที่ค้นหา"), { status: 400 });
     
        return persons;

    } catch (err) {

        console.error("searchPersons error:", err);
        throw err;

    }
}

export async function searchPersonsHistory(where) {

    try {
      
        const wherePerson = where?.wherePerson || null;
        const whereScreening = where?.whereScreening || null;
        const includeScreening = where?.includeScreening || false;
        const mustHaveScreening = where?.mustHaveScreening || false;
        const persons = await modelPerson({ wherePerson, whereScreening, includeScreening, mustHaveScreening });
        if (Array.isArray(persons) ? persons.length === 0 : !persons) throw Object.assign(new Error("ไม่พบข้อมูลที่ค้นหา"), { status: 400 });
     
        return persons;

    } catch (err) {

        console.error("searchPersonsHistory error:", err);
        throw err;

    }
}

export async function createHn(payload) {

    try {
    
        const create_by = payload.create_by;
        const session_id = payload.session_id;
        const source_file = payload.source_file;

       const insertHn = await insertAndReturn({
            table: 'hnorder', 
            dataObj: {create_by: create_by}, 
            pkField:"hn"
        });
    
        await insertAndReturn({
            table: "action_logs", 
            dataObj: {
                entity_type: 'hnorder',
                entity_id: insertHn.hn,
                action: 'insert',
                create_by: create_by,
                session_id: session_id,
                old_data: null,
                new_data: JSON.stringify(insertHn),
                source_file: source_file,
            }
        });
        
        if (!insertHn) throw Object.assign(new Error("ไม่สามารถเพิ่มข้อมูลใหม่ได้"), { status: 400 });
   
        const hn = Number(insertHn.hn);
        const hn_index = "HN" + String(insertHn.hn).padStart(7, "0");
        
        return {hn, hn_index};

    } catch (err) {

        console.error("createHn transaction error:", err);
        throw err;

    }
}

export async function createPerson(payload, where) {

    try {
    
        const info = payload.info;
        const address = payload.address;
        const currentAddress = payload.currentAddress;
        const create_by = payload.create_by;
        const session_id = payload.session_id;
        const source_file = payload.source_file;

        const parseInfo = BaseInfoSchema.safeParse(info);
        if (!parseInfo.success) throw Object.assign(new Error(parseInfo.error.issues[0].message), { status: 400 });

        const parseAddress = BaseAddressSchema.safeParse(address);
        if (!parseAddress.success) throw Object.assign(new Error(parseAddress.error.issues[0].message), { status: 400 });

        const parseCurrentAddress = BaseAddressSchema.safeParse(currentAddress);
        if (!parseCurrentAddress.success) throw Object.assign(new Error(parseCurrentAddress.error.issues[0].message), { status: 400 });

        const dataInfo = parseInfo.data;
        const dataAddress = parseAddress.data;
        const dataCurrentAddress = parseCurrentAddress.data;

        const wherePerson = [
            {
                type: 'or', // group หลัก = OR
                group: [
                {
                    type: 'and', // idcard group
                    group: [
                    { field: 'idcard', operator: '=', value: dataInfo.idcard },
                    { field: 'idcard', operator: '!=', value: '' },
                    { field: 'idcard', operator: 'is not', value: null },
                    ],
                },
                {
                    type: 'or', // hn condition ต้องอยู่ใน OR เดียว
                    group: [
                    { field: 'hn', operator: '=', value: dataInfo.hn },
                    ],
                },
                {
                    type: 'or', // firstname + lastname group
                    group: [
                    { field: 'firstname', operator: '=', value: dataInfo.firstname },
                    { field: 'lastname', operator: '=', value: dataInfo.lastname },
                    ],
                },
                ],
            },
        ];

        const whereScreening = where?.whereScreening || null;
        const includeScreening = where?.includeScreening || false;
        const mustHaveScreening = where?.mustHaveScreening || false;

        const person = await modelPerson({ wherePerson, whereScreening, includeScreening, mustHaveScreening });
        if (Array.isArray(person) ? person.length > 0 : !!person) {
            if (person.hn === dataInfo.hn) {
                throw Object.assign(new Error("HN มีซ้ำในระบบ"), { status: 400 });
            } else if (person.idcard === dataInfo.idcard) {
                throw Object.assign(new Error("เลขบัตประชาชนไม่สามารถใช้ซ้ำได้"), { status: 400 });
            } else if (person.firstname === dataInfo.firstname && person.lastname === dataInfo.lastname) {
                throw Object.assign(new Error("ข้อมูลซ้ำ ชื่อ-นามสกุล ซ้ำในระบบ 5555"), { status: 400 });
            }
        }

        const hn = dataInfo.hn;

        const result = await knex.transaction(async (trx) => {

            await insertAndReturn({
                table: "persons", 
                dataObj:{
                    hn,
                    hn_index: dataInfo.hn_index,
                    prefix_id: dataInfo.prefix_id,
                    firstname: dataInfo.firstname,
                    lastname: dataInfo.lastname,
                    prefix_id_en: dataInfo.prefix_id_en,
                    firstname_en: dataInfo.firstname_en,
                    lastname_en: dataInfo.lastname_en,
                    idcard: dataInfo.idcard,
                    passport: dataInfo.passport,
                    sex_id: dataInfo.sex_id,
                    birthday: date(dataInfo.birthday),
                    age: dataInfo.age,
                    unknow_birthday: dataInfo.unknow_birthday,
                    bloodgroup_id: dataInfo.bloodgroup_id,
                    nationalities_id: dataInfo.nationalities_id,
                    ethnicities_id: dataInfo.ethnicities_id,
                    tel: dataInfo.tel,
                    occupation_id: dataInfo.occupation_id,
                    organization_id: dataInfo.organization_id,
                    healthcare_right_id: dataInfo.healthcare_right_id,
                    main_hospital: dataInfo.main_hospital,
                    secondary_hospital: dataInfo.secondary_hospital,
                    important_information: dataInfo.important_information,
                    create_by: create_by,
                }, trx
            });

            await insertAndReturn({
                table:"persons_address", 
                dataObj:{
                    hn,
                    type: 1,
                    houseno: dataAddress.houseno,
                    villagenno: dataAddress.villagenno,
                    road: dataAddress.road,
                    province_id: dataAddress.province_id,
                    district_id: dataAddress.district_id,
                    subdistrict_id: dataAddress.subdistrict_id,
                    zip_code: dataAddress.zip_code,
                }, trx
            });

            await insertAndReturn({
                table: "persons_address", 
                dataObj:{
                    hn,
                    type: 2,
                    houseno: dataCurrentAddress.houseno,
                    villagenno: dataCurrentAddress.villagenno,
                    road: dataCurrentAddress.road,
                    province_id: dataCurrentAddress.province_id,
                    district_id: dataCurrentAddress.district_id,
                    subdistrict_id: dataCurrentAddress.subdistrict_id,
                    zip_code: dataCurrentAddress.zip_code,
                }, trx
            });

            const newData = await modelPerson({
                wherePerson:[
                    { type: 'and', field: 'hn', operator: '=', value: hn }
                ],
                whereScreening,
                includeScreening:true,
                trx
            });

            await insertAndReturn({
                table:"action_logs", 
                dataObj:{
                    entity_type: 'persons',
                    entity_id: hn,
                    action: 'create',
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

        console.error("createPerson transaction error:", err);
        throw err;

    }
}

export async function updatePerson(payload, where) {

    try {
  
        const hn = payload.hn;
        const info = payload.info;
        const address = payload.address;
        const currentAddress = payload.currentAddress;
        const create_by = payload.create_by;
        const session_id = payload.session_id;
        const source_file = payload.source_file;

        const parse_hn = BaseCommonSchema.pick({ hn: true }).safeParse({hn: hn});
        if (!parse_hn.success) throw new Error(parse_hn.error.issues[0].message);
      
        const parseInfo = BaseInfoSchema.safeParse(info);
        if (!parseInfo.success) throw Object.assign(new Error(parseInfo.error.issues[0].message), { status: 400 });

        const parseAddress = BaseAddressSchema.safeParse(address);
        if (!parseAddress.success) throw Object.assign(new Error(parseAddress.error.issues[0].message), { status: 400 });

        const parseCurrentAddress = BaseAddressSchema.safeParse(currentAddress);
        if (!parseCurrentAddress.success) throw Object.assign(new Error(parseCurrentAddress.error.issues[0].message), { status: 400 });

        const dataInfo = parseInfo.data;
        const dataAddress = parseAddress.data;
        const dataCurrentAddress = parseCurrentAddress.data;

        const wherePerson = where?.wherePerson || null;
        const whereScreening = where?.whereScreening || null;
        const includeScreening = where?.includeScreening || false;
        const mustHaveScreening = where?.mustHaveScreening || false;
        const person = await modelPerson({ wherePerson, whereScreening, includeScreening, mustHaveScreening });
        if (Array.isArray(person) ? person.length === 0 : !person) throw Object.assign(new Error("ไม่พบข้อมูล"), { status: 400 });

        const result = await knex.transaction(async (trx) => {

            await updateAndReturn({
                table: "persons",
                dataObj: { ...dataInfo, birthday: date(dataInfo.birthday), update_date: datetime() },
                whereObj: { hn },
                trx,
            });

            await updateAndReturn({
                table: "persons_address",
                dataObj: { ...dataAddress, update_date: datetime() },
                whereObj: { hn, type: 1 },
                trx,
            });

            await updateAndReturn({
                table: "persons_address",
                dataObj: { ...dataCurrentAddress, update_date: datetime() },
                whereObj: { hn, type: 2 },
                trx,
            });

            const newData = await modelPerson({ wherePerson, whereScreening, includeScreening, trx });

            await insertAndReturn({
                table: "action_logs",
                dataObj: {
                    entity_type: "persons",
                    entity_id: hn,
                    action: "update",
                    create_by: create_by,
                    session_id,
                    old_data: JSON.stringify(person),
                    new_data: JSON.stringify(newData),
                    source_file: source_file,
                },
                trx,
            });

            return newData;
        });

        return result;

    } catch (err) {

        console.error("updatePerson transaction error:", err);
        throw err;

    }
}