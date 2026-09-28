// app/api/queue/config/route.js
"use server";
import "server-only";
import { NextResponse } from "next/server";
import { getSessionServer } from "@/lib/session";
import dbKnex from "@/lib/Knex/dbKnex";

// In-memory fallback/cache for real-time responsiveness
if (!global.smartQueueConfig) {
  global.smartQueueConfig = {
    active_rooms: 4,
    delay_seconds: 30,
    sound_enabled: 1,
    room_assignments: [
      { room_no: 1, room_name: "1", user_id: null, nickname: "" },
      { room_no: 2, room_name: "2", user_id: null, nickname: "" },
      { room_no: 3, room_name: "3", user_id: null, nickname: "" },
      { room_no: 4, room_name: "4", user_id: null, nickname: "" },
    ],
  };
}

let tableChecked = false;
async function ensureQueueConfigTable() {
  if (tableChecked) return;
  try {
    const hasTable = await dbKnex.schema.hasTable("tbl_queue_config");
    if (!hasTable) {
      await dbKnex.schema.createTable("tbl_queue_config", (table) => {
        table.increments("id").primary();
        table.integer("active_rooms").notNullable().defaultTo(4);
        table.integer("delay_seconds").notNullable().defaultTo(30);
        table.tinyint("sound_enabled").notNullable().defaultTo(1);
        table.text("room_assignments").nullable();
        table.integer("updated_by").nullable();
        table.dateTime("update_date").defaultTo(dbKnex.fn.now());
      });
      console.log("Table 'tbl_queue_config' created successfully.");
    }
    tableChecked = true;
  } catch (err) {
    console.error("ensureQueueConfigTable error:", err);
  }
}

export async function GET() {
  try {
    await ensureQueueConfigTable();

    // 1) Fetch current config from DB or memory
    let config = { ...global.smartQueueConfig };
    try {
      const row = await dbKnex("tbl_queue_config").orderBy("id", "desc").first();
      if (row) {
        let assignments = [];
        try {
          assignments = typeof row.room_assignments === "string" ? JSON.parse(row.room_assignments) : (row.room_assignments || []);
        } catch (e) {
          assignments = [];
        }
        config = {
          active_rooms: Number(row.active_rooms) || 3,
          delay_seconds: Number(row.delay_seconds) || 30,
          sound_enabled: Number(row.sound_enabled) ?? 1,
          room_assignments: assignments,
        };
        global.smartQueueConfig = config;
      }
    } catch (e) {
      console.warn("Using in-memory queue config:", e.message);
    }

    // 2) Fetch list of eligible consultation staff (role_id != 1)
    const staffList = await dbKnex("tbl_account")
      .where("role_id", "!=", 1)
      .andWhere("status", 1)
      .select("user_id", "nickname", "username")
      .orderBy("nickname", "asc");

    return NextResponse.json({
      success: true,
      config,
      staffList,
    });
  } catch (err) {
    console.error("GET /api/queue/config error:", err);
    return NextResponse.json({ error: err.message || "Server error" }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    const session = await getSessionServer();
    const userId = session?.user?.userId || null;

    await ensureQueueConfigTable();

    const body = await req.json().catch(() => ({}));
    const activeRooms = Math.min(Math.max(Number(body.active_rooms) || 3, 1), 10);
    const delaySeconds = [10, 20, 30, 40, 50, 60].includes(Number(body.delay_seconds))
      ? Number(body.delay_seconds)
      : 30;
    const soundEnabled = body.sound_enabled !== undefined ? (body.sound_enabled ? 1 : 0) : 1;
    const roomAssignments = Array.isArray(body.room_assignments) ? body.room_assignments : [];

    const newConfig = {
      active_rooms: activeRooms,
      delay_seconds: delaySeconds,
      sound_enabled: soundEnabled,
      room_assignments: roomAssignments,
    };

    // Update memory
    global.smartQueueConfig = newConfig;

    // Persist to DB
    try {
      const existing = await dbKnex("tbl_queue_config").first();
      if (existing) {
        await dbKnex("tbl_queue_config").where("id", existing.id).update({
          active_rooms: activeRooms,
          delay_seconds: delaySeconds,
          sound_enabled: soundEnabled,
          room_assignments: JSON.stringify(roomAssignments),
          updated_by: userId,
          update_date: dbKnex.fn.now(),
        });
      } else {
        await dbKnex("tbl_queue_config").insert({
          active_rooms: activeRooms,
          delay_seconds: delaySeconds,
          sound_enabled: soundEnabled,
          room_assignments: JSON.stringify(roomAssignments),
          updated_by: userId,
        });
      }
    } catch (dbErr) {
      console.error("Failed to save tbl_queue_config in DB:", dbErr);
    }

    // Broadcast queue config change to any SSE clients
    if (global.notifyQueueClients) {
      try {
        await global.notifyQueueClients();
      } catch (sseErr) {
        console.error("SSE notifyQueueClients error:", sseErr);
      }
    }

    return NextResponse.json({
      success: true,
      message: "บันทึกการตั้งค่าระบบคิวเรียบร้อยแล้ว",
      config: newConfig,
    });
  } catch (err) {
    console.error("POST /api/queue/config error:", err);
    return NextResponse.json({ error: err.message || "Server error" }, { status: 500 });
  }
}
