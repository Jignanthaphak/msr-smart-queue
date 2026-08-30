// app/api/person/route.js "success Refactor Code"
"use server"
import "server-only";
import { checkAccountPermission } from "@/lib/utils/permissionRouteCheck";
import { NextResponse } from "next/server";
import { BaseSchema as SearchSchema } from "@/lib/validators/form/screening/search/schema";
import { searchPersons, createPerson } from "@/lib/serviceActions/personActions"; 
import requestValidationApi from "@/lib/validators/request/requestValidationApi";
import { date, datetime, times, day, nowMs, nowSec, nowDate } from "@/lib/utils/dateFormat";

export async function GET(req) {

  try {

    const validationResponse = await requestValidationApi(req);
    if (validationResponse) return validationResponse;
    
    const { session } = await checkAccountPermission(req)

    const { searchParams } = new URL(req.url);
    const param = Object.fromEntries(searchParams.entries());

    const parse = SearchSchema.safeParse(param);
    if (!parse.success) return NextResponse.json({ error: parse.error.issues[0].message }, { status: 400 });
    
    const data_parse = parse.data;
  
    const orConditions = [];

    if (data_parse.hn) {
      orConditions.push({ type: 'or', field: 'hn', operator: 'like', value: `%${data_parse.hn}%` })
    }

     if (data_parse.nameTh) {
      const partsEn = data_parse.nameTh.trim().split(/\s+/);
      if (partsEn.length >= 2) {
        const firstName = partsEn[0];
        const lastName = partsEn.slice(1).join(' ');
        
        orConditions.push({
          type: 'or',
          group: [  
            { field: 'firstname', operator: 'like', value: `%${firstName}%` },
            { field: 'lastname', operator: 'like', value: `%${lastName}%` }
          ]
        });
      } else {
        const single = partsEn[0];

        orConditions.push({
          type: 'or',
          group: [ 
            { field: 'firstname', operator: 'like', value: `%${single}%` },
            { field: 'lastname', operator: 'like', value: `%${single}%`, boolean: 'or' }
          ]
        });
      }
    }

    if (data_parse.nameEn) {
      const partsEn = data_parse.nameEn.trim().split(/\s+/);
      if (partsEn.length >= 2) {
        const firstName = partsEn[0];
        const lastName = partsEn.slice(1).join(' ');
        
        orConditions.push({
          type: 'or',
          group: [
            { field: 'firstname_en', operator: 'like', value: `%${firstName}%` },
            { field: 'lastname_en', operator: 'like', value: `%${lastName}%` }
          ]
        });
      } else {
        const single = partsEn[0];

        orConditions.push({
          type: 'or',
          group: [
            { field: 'firstname_en', operator: 'like', value: `%${single}%` },
            { field: 'lastname_en', operator: 'like', value: `%${single}%`, boolean: 'or' }
          ]
        });
      }
    }

    if (data_parse.idCard) {
      orConditions.push({ type: 'or', field: 'idcard', operator: 'like', value: `%${data_parse.idCard}%` })
    }

    if (data_parse.passport) {
      orConditions.push({ type: 'or', field: 'passport', operator: 'like', value: `%${data_parse.passport}%` })
    }

    if (orConditions.length === 0) return NextResponse.json({ error: "กรุณาระบุอย่างน้อยหนึ่งช่องสำหรับค้นหา" }, { status: 400 });
 
    const where = {
      wherePerson: orConditions,
      whereScreening: [{ type: 'and', field: 'date', operator: '=', value: date() }],
      includeScreening: true,
    }

    const result = await searchPersons(where);
    return NextResponse.json({ ok: true, data: result });

  } catch (err) {

    console.error(err);
    const status = err.status || 500;
    return NextResponse.json({ error: status && status !== 500  ? err.message : "Server error" }, { status });

  }
}

export async function POST(req) {

  try {

    const validationResponse = await requestValidationApi(req);
    if (validationResponse) return validationResponse;
    
    const { session } = await checkAccountPermission(req)
   

    const body = await req.json();
    const create_by = session.user.userId;
    const session_id = session.user.sessionId;
    const source_file = "app/api/person/route.js";

    const where = {
      whereScreening: [{ type: 'and', field: 'date', operator: '=', value: date() }],
    }

    const result = await createPerson({ create_by, session_id, source_file,  ...body }, where);

    return NextResponse.json({ ok: true, data: result });

  } catch (err) {
 
    console.error(err);
    const status = err.status || 500;
    return NextResponse.json({ error: status && status !== 500  ? err.message : "Server error" }, { status });
  
  }
}

