// app/api/monitor/route.js
"use server"
import "server-only";
import { checkAccountPermission } from "@/lib/utils/permissionRouteCheck";
import { NextResponse } from "next/server";
import { clients } from "@/lib/sse/clients";
import requestValidationApi from "@/lib/validators/request/requestValidationApi";
import { modelInspectorScreenings } from "@/model/monitor";
import { modelScreenings } from "@/model/screening";
import { date, datetime, times, day, nowMs, nowSec, nowDate } from "@/lib/utils/dateFormat";

export async function GET(req) {
  try {
    // ตรวจ validation พื้นฐาน (session / header / ฯลฯ)
    const validationResponse = await requestValidationApi(req);
    if (validationResponse) return validationResponse;

    // ตรวจ permission ของ account (ถ้า error จะ throw / คืน NextResponse ออกไปก่อนถึง SSE)
    const { session } = await checkAccountPermission(req);

    // สร้าง SSE response
    return new Response(
      new ReadableStream({
        async start(controller) {
          const encoder = new TextEncoder();
          const write = (msg) => controller.enqueue(encoder.encode(msg));

          const client = { write, close: () => controller.close() };
          clients.push(client);

          console.log("SSE /api/monitor connected. Total clients:", clients.length);

          // 1) ส่งข้อมูลครั้งแรกทันทีเมื่อเชื่อมต่อ
          try {
            const data = await getData();
            if (data) {
              client.write(`data: ${JSON.stringify({ type: "init", payload: data })}\n\n`);
            }
          } catch (err) {
            console.error("SSE initial fetch error:", err);
            // ถ้า initial error ก็ยังคงเปิด stream ไว้ให้ heartbeat / notifyClients ใช้ได้
          }

          // 2) Heartbeat ให้ connection ไม่ timeout ง่าย ๆ
          const intervalId = setInterval(() => {
            try {
              // comment line ตาม spec ของ SSE (browser จะไม่ trigger onmessage)
              client.write(`: ping ${Date.now()}\n\n`);
            } catch (e) {
              console.error("SSE heartbeat error:", e);
            }
          }, 30000); // ทุก 30 วินาที

          // 3) จัดการตอน client หลุด / ปิดหน้า
          req.signal.addEventListener("abort", () => {
            const index = clients.indexOf(client);
            if (index > -1) clients.splice(index, 1);
            clearInterval(intervalId);
            client.close();
            console.log("SSE /api/monitor disconnected. Total clients:", clients.length);
          });
        },
      }),
      {
        headers: {
          "Content-Type": "text/event-stream",
          "Cache-Control": "no-cache, no-transform",
          Connection: "keep-alive",
        },
      }
    );
  } catch (err) {
    console.error(err);
    const status = err.status || 500;
    return NextResponse.json(
      { error: status && status !== 500 ? err.message : "Server error" },
      { status }
    );
  }
}

// ฟังก์ชันให้ API เรียก
export async function notifyClients() {

  try {

    console.log("notifyClients clients...", clients.length);

    const data = await getData();

    const msg = `data: ${JSON.stringify(data)}\n\n`;

    clients.forEach((client) => client.write(msg));

    if (global.notifyQueueClients) {
      await global.notifyQueueClients();
    }
  } catch (err) {

    console.error("SSE notifyClients error:", err);

  }

}

export async function getData() {

  try {

    const data = {
      screenings: await modelScreenings({
        whereScreening: [
          { type: 'and', field: 'date', operator: '=', value: date() }
        ],
        includePerson: true,
        orderBy: {update_date: "desc"}
      }),
      inspector: await modelInspectorScreenings({
        whereAccount:[
          { type: 'and', field: 'role_id', operator: '!=', value: 1 },
        ],
        whereScreening: [
          { type: 'and', field: 'date', operator: '=', value: date() },
          { type: 'and', field: 'status_id', operator: '=', value: 3 },
        ],
      }),
    };

    return data;

  } catch (err) {

    console.error("SSE notifyClients error:", err);
    
  }

}