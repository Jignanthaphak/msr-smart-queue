// app/api/screening/thaid/status/route.js
import { NextResponse } from "next/server";
import { getRegStatus } from "@/lib/services/thaidRegistrationStore";

export async function GET(req) {
  const { searchParams } = new URL(req.url);
  
  if (searchParams.get("ping")) {
    return NextResponse.json({ success: true, version: "v2026.09.28-1930", time: Date.now() });
  }

  const requestId = searchParams.get("requestId");

  if (!requestId) {
    return NextResponse.json({ success: false, message: "Missing requestId" }, { status: 400 });
  }

  const result = await getRegStatus(requestId);
  return NextResponse.json({ success: true, ...result });
}
