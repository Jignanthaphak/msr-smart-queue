// app/api/queue/state/route.js
"use server";
import "server-only";
import { NextResponse } from "next/server";
import dbKnex from "@/lib/Knex/dbKnex";
import { date } from "@/lib/utils/dateFormat";

// Global in-memory queue state store
if (!global.smartQueueState) {
  global.smartQueueState = {
    // Room states: map of room_no -> { room_no, room_name, staff_id, staff_name, current_hn, patient_name, current_screening_id, status: 'empty'|'calling'|'consulting'|'break'|'pending_consult', called_at: null }
    rooms: {},
    heldList: [], // Array of { screening_id, hn, patient_name, held_at, reason }
    lastCall: null, // { room_no, room_name, staff_name, hn, patient_name, timestamp }
    priorityBypassedList: [], // Queue of patients bumped/bypassed by walk-in VIPs
    pendingPostConsultRooms: {}, // Rooms in post-consult cooldown (ขอเวลาสักครู่): map of room_no -> { finished_at, staff_id }
  };
}
if (!global.smartQueueState.pendingPostConsultRooms) {
  global.smartQueueState.pendingPostConsultRooms = {};
}

// Helper: Mark a room as entering post-consult cooldown (ขอเวลาสักครู่)
global.markRoomPostConsult = function (screeningId, hn, userId) {
  if (!global.smartQueueState) {
    global.smartQueueState = { rooms: {}, heldList: [], lastCall: null, pendingPostConsultRooms: {} };
  }
  if (!global.smartQueueState.pendingPostConsultRooms) {
    global.smartQueueState.pendingPostConsultRooms = {};
  }

  let foundRoomNo = null;

  // 1) Find room by screening_id or hn in global.smartQueueState.rooms
  if (global.smartQueueState.rooms) {
    for (const [rNo, r] of Object.entries(global.smartQueueState.rooms)) {
      if (
        r &&
        ((screeningId && Number(r.current_screening_id) === Number(screeningId)) ||
         (hn && String(r.current_hn).trim() === String(hn).trim()))
      ) {
        foundRoomNo = Number(rNo);
        delete global.smartQueueState.rooms[rNo];
        break;
      }
    }
  }

  // 2) If not found by active patient, find room by assigned staff user_id
  if (!foundRoomNo && userId && global.smartQueueConfig?.room_assignments) {
    const assign = global.smartQueueConfig.room_assignments.find(
      (a) => Number(a.user_id) === Number(userId)
    );
    if (assign && assign.room_no) {
      foundRoomNo = Number(assign.room_no);
    }
  }

  // 3) Mark room in post-consult cooldown ("ขอเวลาสักครู่")
  if (foundRoomNo) {
    global.smartQueueState.pendingPostConsultRooms[foundRoomNo] = {
      finished_at: Date.now(),
      staff_id: userId ? Number(userId) : null,
      screening_id: screeningId ? Number(screeningId) : null,
      hn: hn ? String(hn) : null,
    };
  }
};

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
    active_rooms: 3,
    delay_seconds: 30,
    room_assignments: [
      { room_no: 1, room_name: "1", user_id: null, nickname: "" },
      { room_no: 2, room_name: "2", user_id: null, nickname: "" },
      { room_no: 3, room_name: "3", user_id: null, nickname: "" },
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
      .orderBy("screening.update_date", "asc")
      .orderBy("screening.screening_id", "asc");
  } catch (e) {
    console.error("Fetch todayScreenings error:", e.message);
  }

  // Pre-clean: Check all rooms in memory. If any room's patient has finished consult (status_id >= 4) or is not active, clear that room!
  Object.keys(global.smartQueueState?.rooms || {}).forEach((roomNo) => {
    const r = global.smartQueueState.rooms[roomNo];
    if (r && (r.current_hn || r.current_screening_id)) {
      const scr = todayScreenings.find(
        (s) =>
          (r.current_screening_id && Number(s.screening_id) === Number(r.current_screening_id)) ||
          (r.current_hn && String(s.hn).trim() === String(r.current_hn).trim())
      );
      if (!scr || Number(scr.status_id) >= 4) {
        delete global.smartQueueState.rooms[roomNo];
      }
    }
  });

  // Collect all HNs and screening_ids currently active in ANY room (calling, consulting, or walkin)
  const activeRoomHns = new Set();
  const activeRoomScreeningIds = new Set();

  Object.values(global.smartQueueState?.rooms || {}).forEach((r) => {
    if (r && r.status && r.status !== "empty" && r.status !== "break") {
      if (r.current_hn) activeRoomHns.add(String(r.current_hn).trim());
      if (r.current_screening_id) activeRoomScreeningIds.add(Number(r.current_screening_id));
    }
  });

  // Also collect active consultations from DB (status_id = 3 "ตรวจ")
  todayScreenings.forEach((s) => {
    if (Number(s.status_id) === 3) {
      if (s.hn) activeRoomHns.add(String(s.hn).trim());
      if (s.screening_id) activeRoomScreeningIds.add(Number(s.screening_id));
    }
  });

  // 2) Derive waiting list (status_id = 2 "รอตรวจ") excluding held patients AND patients currently active/calling in any room
  const heldScreeningIds = new Set((global.smartQueueState?.heldList || []).map((h) => Number(h.screening_id)));

  // Cleanup priorityBypassedList: if someone in priority list has already started consult, is in a room, or completed, remove them
  if (global.smartQueueState?.priorityBypassedList) {
    global.smartQueueState.priorityBypassedList = global.smartQueueState.priorityBypassedList.filter((p) => {
      const scr = todayScreenings.find((s) => String(s.hn) === String(p.hn));
      const inRoom = activeRoomHns.has(String(p.hn).trim());
      return scr && Number(scr.status_id) === 2 && !inRoom;
    });
  }

  const priorityHns = new Set((global.smartQueueState?.priorityBypassedList || []).map((p) => String(p.hn).trim()));

  const baseWaitingList = todayScreenings
    .filter((s) => {
      const isWaiting = Number(s.status_id) === 2;
      const isHeld = heldScreeningIds.has(Number(s.screening_id));
      const inRoom = activeRoomHns.has(String(s.hn).trim()) || activeRoomScreeningIds.has(Number(s.screening_id));
      return isWaiting && !isHeld && !inRoom;
    })
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
  const numRooms = config.active_rooms || 3;
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
    let cooldownRemaining = 0;

    // Check if the patient currently in memoryRoom has finished consultation or closed case
    let memScreening = null;
    if (memoryRoom.current_screening_id || memoryRoom.current_hn) {
      memScreening = todayScreenings.find(
        (s) =>
          (memoryRoom.current_screening_id && Number(s.screening_id) === Number(memoryRoom.current_screening_id)) ||
          (memoryRoom.current_hn && String(s.hn).trim() === String(memoryRoom.current_hn).trim())
      );
    }

    const isMemScreeningFinished = memScreening && (Number(memScreening.status_id) === 4 || Number(memScreening.status_id) === 5);

    if (isMemScreeningFinished) {
      // The consultation for this patient is complete! Mark post-consult cooldown and clear room!
      if (global.markRoomPostConsult) {
        global.markRoomPostConsult(memScreening.screening_id, memScreening.hn, staffId);
      }
      delete global.smartQueueState.rooms[i];
    }

    if (isStaffOnBreak) {
      currentStatus = "break"; // "ขอเวลาสักครู่" (พักสายตา)
      delete global.smartQueueState.pendingPostConsultRooms?.[i];
    } else if (activeConsult) {
      currentStatus = "consulting"; // In room, consultation ongoing (Solid Gray)
      delete global.smartQueueState.pendingPostConsultRooms?.[i];
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
    } else if (memScreening && Number(memScreening.status_id) === 3) {
      // Patient is currently in consultation
      currentStatus = "consulting";
      delete global.smartQueueState.pendingPostConsultRooms?.[i];
      currentHn = String(memScreening.hn);
      currentPatientName = `${memScreening.prefix_title || ""} ${memScreening.firstname || ""} ${memScreening.lastname || ""}`.trim();
      currentScreeningId = memScreening.screening_id;
    } else if (!isMemScreeningFinished && memoryRoom.status === "calling" && memoryRoom.current_hn) {
      currentStatus = "calling"; // Currently calling (Blinking Green)
      delete global.smartQueueState.pendingPostConsultRooms?.[i];
      currentHn = memoryRoom.current_hn;
      currentPatientName = memoryRoom.patient_name || "";
      currentScreeningId = memoryRoom.current_screening_id || null;
    } else {
      // ตรวจสอบกรณี "ขอเวลาสักครู่" หลังการส่งตรวจหน้าคอนเซาท์เสร็จ ภายในเวลา delay_seconds
      const delaySec = Number(config.delay_seconds) || 30;
      const postConsult = global.smartQueueState?.pendingPostConsultRooms?.[i];

      if (postConsult && postConsult.finished_at) {
        const elapsedSec = (Date.now() - postConsult.finished_at) / 1000;
        if (elapsedSec < delaySec) {
          currentStatus = "pending_consult"; // "ขอเวลาสักครู่"
          cooldownRemaining = Math.max(0, Math.ceil(delaySec - elapsedSec));
        } else {
          // Cooldown หมดเวลาแล้ว -> ให้ระบบอัตโนมัติเรียกคิวเลย! ไม่เปลี่ยนเป็นว่างก่อน
          delete global.smartQueueState.pendingPostConsultRooms[i];
          currentStatus = "pending_consult_expired";
          cooldownRemaining = 0;
        }
      } else {
        // สถานะเริ่มต้น หรือ กดเข้างาน -> ให้ขึ้นว่า "ว่าง" คงไว้
        currentStatus = "empty";
      }
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
      cooldown_remaining: cooldownRemaining,
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
      let hn = String(body.hn || "").trim();
      let patientName = String(body.patient_name || "").trim();
      let screeningId = Number(body.screening_id) || null;
      const roomName = String(body.room_name || `${roomNo}`);
      const staffName = String(body.staff_name || "");

      // Check if this HN is currently being called in ANOTHER room
      const isHnCalledInOtherRoom = Object.entries(global.smartQueueState.rooms).some(
        ([rNo, rData]) => Number(rNo) !== roomNo && rData && String(rData.current_hn).trim() === hn && rData.status === "calling"
      );

      // If already called by another room or HN is empty, pick the next available waiting patient
      if (isHnCalledInOtherRoom || !hn) {
        const currentData = await getQueueData();
        const otherCallingHns = new Set(
          Object.entries(global.smartQueueState.rooms)
            .filter(([rNo, rData]) => Number(rNo) !== roomNo && rData && rData.current_hn && rData.status !== "empty" && rData.status !== "break")
            .map(([, rData]) => String(rData.current_hn).trim())
        );

        const availableNext = (currentData.waitingList || []).find(
          (w) => String(w.hn).trim() !== hn && !otherCallingHns.has(String(w.hn).trim())
        );

        if (availableNext) {
          hn = String(availableNext.hn);
          patientName = availableNext.patient_name || "";
          screeningId = availableNext.screening_id || null;
        }
      }

      // Clear post-consult cooldown for this room immediately
      delete global.smartQueueState.pendingPostConsultRooms?.[roomNo];

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
