// app/api/report/dashboard_ai/route.js
"use server"
import "server-only";
import { checkAccountPermission } from "@/lib/utils/permissionRouteCheck";
import { NextResponse } from "next/server";
import requestValidationApi from "@/lib/validators/request/requestValidationApi";
import { generatePolicyRecommendation } from "@/lib/serviceActions/dashboardAiActions";

// ข้อเสนอแนะเชิงนโยบายจาก AI สำหรับแดชบอร์ด (รับ stats ที่หน้าเว็บส่งมา — ไม่ query ซ้ำ)
export async function POST(req) {
  try {
    const validationResponse = await requestValidationApi(req);
    if (validationResponse) return validationResponse;

    await checkAccountPermission(req);

    const body = await req.json();
    const stats = body?.stats || null;
    if (!stats) throw Object.assign(new Error("ไม่พบข้อมูลสถิติ"), { status: 400 });

    const result = await generatePolicyRecommendation({ stats });

    return NextResponse.json({ ok: true, ...result });
  } catch (err) {
    console.error(err);
    const status = err.status || 500;
    return NextResponse.json({ error: status && status !== 500 ? err.message : "Server error" }, { status });
  }
}
