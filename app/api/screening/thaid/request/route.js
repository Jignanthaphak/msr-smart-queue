// app/api/screening/thaid/request/route.js
import { NextResponse } from "next/server";
import { createRegRequest } from "@/lib/services/thaidRegistrationStore";

export async function POST(req) {
  try {
    const data = await createRegRequest();
    return NextResponse.json({ success: true, ...data });
  } catch (err) {
    console.error("Error creating ThaID registration request:", err);
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}

export async function GET(req) {
  return POST(req);
}
