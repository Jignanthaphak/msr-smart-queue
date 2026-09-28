// app/api/monitor/break/route.js
"use server";
import "server-only";
import { NextResponse } from "next/server";
import { getSessionServer, getSession } from "@/lib/session";
import dbKnex from "@/lib/Knex/dbKnex";
import { notifyClients } from "@/app/api/monitor/route";

// Global in-memory map to guarantee immediate real-time sync across Node runtime
if (!global.staffBreakStore) {
  global.staffBreakStore = new Map();
}

let columnChecked = false;
async function ensureColumn() {
  if (columnChecked) return;
  try {
    const hasCol = await dbKnex.schema.hasColumn("tbl_account", "is_break");
    if (!hasCol) {
      await dbKnex.schema.table("tbl_account", (table) => {
        table.tinyint("is_break").notNullable().defaultTo(0);
      });
      console.log("Column 'is_break' added to tbl_account successfully.");
    }
    columnChecked = true;
  } catch (err) {
    console.error("ensureColumn is_break error:", err);
  }
}

async function resolveSession(req) {
  let session = await getSessionServer();
  if (!session?.user?.userId && req) {
    const res = NextResponse.next();
    session = await getSession(req, res);
  }
  return session;
}

export async function GET(req) {
  try {
    const session = await resolveSession(req);
    const userId = session?.user?.userId;
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await ensureColumn();

    let isBreak = global.staffBreakStore.get(Number(userId));
    if (isBreak === undefined) {
      const row = await dbKnex("tbl_account")
        .where("user_id", userId)
        .select("is_break")
        .first();
      isBreak = row?.is_break ? 1 : 0;
      global.staffBreakStore.set(Number(userId), isBreak);
    }

    return NextResponse.json({
      success: true,
      user_id: userId,
      is_break: Number(isBreak) === 1 ? 1 : 0,
    });
  } catch (err) {
    console.error("GET /api/monitor/break error:", err);
    return NextResponse.json(
      { error: err.message || "Server error" },
      { status: 500 }
    );
  }
}

export async function POST(req) {
  try {
    const session = await resolveSession(req);
    const userId = session?.user?.userId;
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await ensureColumn();

    const body = await req.json().catch(() => ({}));
    let newStatus;
    if (typeof body.is_break === "number" || typeof body.is_break === "boolean") {
      newStatus = body.is_break ? 1 : 0;
    } else {
      let current = global.staffBreakStore.get(Number(userId));
      if (current === undefined) {
        const row = await dbKnex("tbl_account")
          .where("user_id", userId)
          .select("is_break")
          .first();
        current = row?.is_break ? 1 : 0;
      }
      newStatus = current === 1 ? 0 : 1;
    }

    // 1) Save in memory for zero-latency retrieval
    global.staffBreakStore.set(Number(userId), newStatus);

    // 2) Persist to database
    try {
      await dbKnex("tbl_account")
        .where("user_id", userId)
        .update({ is_break: newStatus });
    } catch (dbErr) {
      console.error("Failed to update is_break in DB:", dbErr);
    }

    // 3) Broadcast to all monitor screens connected via SSE
    try {
      await notifyClients();
    } catch (sseErr) {
      console.error("notifyClients error on break toggle:", sseErr);
    }

    return NextResponse.json({
      success: true,
      user_id: userId,
      is_break: newStatus,
      message:
        newStatus === 1
          ? "ขอพักห้องตรวจเรียบร้อยแล้ว"
          : "พร้อมให้บริการห้องตรวจเรียบร้อยแล้ว",
    });
  } catch (err) {
    console.error("POST /api/monitor/break error:", err);
    return NextResponse.json(
      { error: err.message || "Server error" },
      { status: 500 }
    );
  }
}
