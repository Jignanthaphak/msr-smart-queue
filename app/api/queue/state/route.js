// app/api/queue/state/route.js
"use server";
import "server-only";
import { NextResponse } from "next/server";
import dbKnex from "@/lib/Knex/dbKnex";
import { date } from "@/lib/utils/dateFormat";

// Global in-memory queue state store
if (!global.smartQueueState) {
  global.smartQueueState = {
    // Room states: map of room_no -> { room_no, room_name, staff_id, staff_name, current_hn, patient_name, current_screening_id, status: 'empty'|'calling'|'consulting'|'break', called_at: null }
    rooms: {},
    heldList: [], // Array of { screening_id, hn, patient_name, held_at, reason }
    lastCall: null, // { room_no, room_name, staff_name, hn, patient_name, timestamp }
    priorityBypassedList: [], // Queue of patients bumped/bypassed by walk-in VIPs
  };
}

// Clients connected via SSE for real-time queue sync
if (!global.queueClients) {
  global.queueClients = [];
}

global.notifyQueueClients = async function () {
  try {
    const data = await getQueueData();
    const msg = `data: ${JSON.stringify(data)}\n\n`;
    (global.queueClients || []).forEach((c) => {
      try {
        c.write(msg);
      } catch (e) {}
    });
  } catch (err) {
    console.error("notifyQueueClients error:", err);
  }
};

export async function getQueueData() {
  const today = date();
  const config = global.smartQueueConfig || {
    active_rooms: 4,
    delay_seconds: 30,
    room_assignments: [
      { room_no: 1, room_name: "1", user_id: null, nickname: "" },
      { room_no: 2, room_name: "2", user_id: null, nickname: "" },
      { room_no: 3, room_name: "3", user_id: null, nickname: "" },
      { room_no: 4, room_name: "4", user_id: null, nickname: "" },
    ],
  };

  const breakStore = global.staffBreakStore || new Map();

  // 1) Fetch today's screenings with persons and status
  let todayScreenings = [];
  try {
    todayScreenings = await dbKnex("screening")
      .where("screening.date", today)
      .join("persons", "screening.hn", "persons.hn")
      .leftJoin("name_prefixes", "persons.prefix_id", "name_prefixes.prefix_id")
      .leftJoin("screening_status", "screening.status_id", "screening_status.status_id")
      .select(
        "screening.screening_id",
        "screening.hn",
        "screening.status_id",
        "screening.create_by",
        "screening.update_date",
        "persons.firstname",
        "persons.lastname",
        "name_prefixes.title as prefix_title",
        "screening_status.status_name"
      )
      .orderBy("screening.update_date", "asc");
  } catch (e) {
    console.error("Fetch todayScreenings error:", e.message);
  }

  // 2) Derive waiting list (status_id = 2 "รอตรวจ") excluding held patients
  const heldScreeningIds = new Set((global.smartQueueState?.heldList || []).map((h) => Number(h.screening_id)));

  // Cleanup priorityBypassedList: if someone in priority list has already started consult or completed, remove them
  if (global.smartQueueState?.priorityBypassedList) {
    global.smartQueueState.priorityBypassedList = global.smartQueueState.priorityBypassedList.filter((p) => {
      const scr = todayScreenings.find((s) => String(s.hn) === String(p.hn));
      return scr && Number(scr.status_id) === 2;
    });
  }

  const priorityHns = new Set((global.smartQueueState?.priorityBypassedList || []).map((p) => String(p.hn)));

  const baseWaitingList = todayScreenings
    .filter((s) => Number(s.status_id) === 2 && !heldScreeningIds.has(Number(s.screening_id)))
    .map((s) => ({
      screening_id: s.screening_id,
      hn: String(s.hn),
      patient_name: `${s.prefix_title || ""} ${s.firstname || ""} ${s.lastname || ""}`.trim(),
      status_name: s.status_name,
      is_priority: priorityHns.has(String(s.hn)),
    }));

  // Reorder waiting list so that priority bypassed patients are AT THE VERY FRONT!
  const waitingList = [
    ...baseWaitingList.filter((s) => priorityHns.has(String(s.hn))),
    ...baseWaitingList.filter((s) => !priorityHns.has(String(s.hn))),
  ];

  // 3) Construct rooms state based on config & active consultations
  const numRooms = config.active_rooms || 4;
  const assignments = config.room_assignments || [];
  const roomResults = [];

  for (let i = 1; i <= numRooms; i++) {
    const assign = assignments.find((a) => Number(a.room_no) === i) || {
      room_no: i,
      room_name: `${i}`,
      user_id: null,
      nickname: "",
    };

    const staffId = assign.user_id ? Number(assign.user_id) : null;
    const isStaffOnBreak = staffId ? (breakStore.get(staffId) === 1) : false;

    // Check if staff has an ongoing consultation (status_id = 3 "ตรวจ")
    const activeConsult = staffId
      ? todayScreenings.find((s) => Number(s.create_by) === staffId && Number(s.status_id) === 3)
      : null;

    // Check manual in-memory call state
    const memoryRoom = global.smartQueueState?.rooms?.[i] || {};

    let currentStatus = "empty";
    let currentHn = "";
    let currentPatientName = "";
    let currentScreeningId = null;

    if (isStaffOnBreak) {
      currentStatus = "break";
    } else if (activeConsult) {
      currentStatus = "consulting"; // In room, consultation ongoing (Solid Gray)
      currentHn = String(activeConsult.hn);
      currentPatientName = `${activeConsult.prefix_title || ""} ${activeConsult.firstname || ""} ${activeConsult.lastname || ""}`.trim();
      currentScreeningId = activeConsult.screening_id;

      // Check if patient entered room before being called (Walk-in before call)
      let isWalkinBeforeCall = false;

      if (
        memoryRoom.status === "calling" &&
        memoryRoom.current_hn &&
        String(memoryRoom.current_hn) !== String(activeConsult.hn)
      ) {
        isWalkinBeforeCall = true;
        const displacedHn = String(memoryRoom.current_hn);
        const displacedName = memoryRoom.patient_name || "";
        const displacedScreeningId = memoryRoom.current_screening_id;

        if (!global.smartQueueState.priorityBypassedList) {
          global.smartQueueState.priorityBypassedList = [];
        }

        // Return the displaced patient to the TOP of the waiting queue
        if (!global.smartQueueState.priorityBypassedList.some((p) => String(p.hn) === displacedHn)) {
          global.smartQueueState.priorityBypassedList.unshift({
            hn: displacedHn,
            patient_name: displacedName,
            screening_id: displacedScreeningId,
            bypassed_at: new Date().toISOString(),
            room_no: i,
          });
        }

        // Clear the superseded calling state for this room so it does NOT stay as "กำลังเรียก"
        delete global.smartQueueState.rooms[i];
      } else if (!memoryRoom.called_at || String(memoryRoom.current_hn) !== String(activeConsult.hn)) {
        isWalkinBeforeCall = true;
      }

      currentStatus = isWalkinBeforeCall ? "walkin_before_call" : "consulting";
    } else if (memoryRoom.status === "calling" && memoryRoom.current_hn) {
      currentStatus = "calling"; // Currently calling (Blinking Green)
      currentHn = memoryRoom.current_hn;
      currentPatientName = memoryRoom.patient_name || "";
      currentScreeningId = memoryRoom.current_screening_id || null;
    }

    roomResults.push({
      room_no: i,
      room_name: assign.room_name || `${i}`,
      staff_id: staffId,
      staff_name: assign.nickname || "-",
      status: currentStatus,
      is_walkin_before_call: currentStatus === "walkin_before_call",
      current_hn: currentHn,
      current_screening_id: currentScreeningId,
      patient_name: currentPatientName,
      called_at: memoryRoom.called_at || null,
    });
  }

  return {
    rooms: roomResults,
    waitingList,
    heldList: global.smartQueueState?.heldList || [],
    lastCall: global.smartQueueState?.lastCall || null,
    config,
  };
}

export async function GET() {
  try {
    const data = await getQueueData();
    return NextResponse.json({ success: true, ...data });
  } catch (err) {
    console.error("GET /api/queue/state error:", err);
    return NextResponse.json({ error: err.message || "Server error" }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    const body = await req.json().catch(() => ({}));
    const { action } = body;

    if (!global.smartQueueState) {
      global.smartQueueState = { rooms: {}, heldList: [], lastCall: null };
    }

    if (action === "call") {
      const roomNo = Number(body.room_no);
      const hn = String(body.hn || "").trim();
      const patientName = String(body.patient_name || "").trim();
      const screeningId = Number(body.screening_id) || null;
      const roomName = String(body.room_name || `${roomNo}`);
      const staffName = String(body.staff_name || "");

      global.smartQueueState.rooms[roomNo] = {
        room_no: roomNo,
        room_name: roomName,
        staff_name: staffName,
        current_hn: hn,
        patient_name: patientName,
        current_screening_id: screeningId,
        status: "calling",
        called_at: new Date().toISOString(),
      };

      global.smartQueueState.lastCall = {
        room_no: roomNo,
        room_name: roomName,
        staff_name: staffName,
        hn,
        patient_name: patientName,
        timestamp: Date.now(),
      };
    } else if (action === "recall") {
      const roomNo = Number(body.room_no);
      const current = global.smartQueueState.rooms[roomNo];
      if (current && current.current_hn) {
        global.smartQueueState.lastCall = {
          room_no: roomNo,
          room_name: current.room_name || `${roomNo}`,
          staff_name: current.staff_name || "",
          hn: current.current_hn,
          patient_name: current.patient_name || "",
          timestamp: Date.now(),
        };
      }
    } else if (action === "hold") {
      const screeningId = Number(body.screening_id);
      const hn = String(body.hn || "");
      const patientName = String(body.patient_name || "");
      const reason = String(body.reason || "ติดประชุม / ขอพักคิวชั่วคราว");

      // Clear from any room currently calling this patient
      for (const [rNo, rData] of Object.entries(global.smartQueueState.rooms)) {
        if (Number(rData.current_screening_id) === screeningId || rData.current_hn === hn) {
          delete global.smartQueueState.rooms[rNo];
        }
      }

      // Add to held list if not already present
      if (!global.smartQueueState.heldList.some((h) => Number(h.screening_id) === screeningId)) {
        global.smartQueueState.heldList.push({
          screening_id: screeningId,
          hn,
          patient_name: patientName,
          held_at: new Date().toISOString(),
          reason,
        });
      }
    } else if (action === "resume") {
      const screeningId = Number(body.screening_id);
      // Remove from heldList so they appear back in waitingList at top
      global.smartQueueState.heldList = global.smartQueueState.heldList.filter(
        (h) => Number(h.screening_id) !== screeningId
      );
    } else if (action === "complete_room") {
      const roomNo = Number(body.room_no);
      if (global.smartQueueState.rooms[roomNo]) {
        delete global.smartQueueState.rooms[roomNo];
      }
    }

    // Broadcast update to all connected screens via SSE
    if (global.notifyQueueClients) {
      await global.notifyQueueClients();
    }

    const updatedData = await getQueueData();
    return NextResponse.json({ success: true, ...updatedData });
  } catch (err) {
    console.error("POST /api/queue/state error:", err);
    return NextResponse.json({ error: err.message || "Server error" }, { status: 500 });
  }
}
