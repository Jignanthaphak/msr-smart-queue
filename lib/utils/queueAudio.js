// lib/utils/queueAudio.js
"use client";

// ============================================================
// Global Audio Queue Lock - ป้องกันเสียงซ้อนกันเด็ดขาด
// เสียงจะเล่นทีละชุด รอชุดก่อนหน้าเสร็จก่อนเสมอ
// ============================================================
let _audioLockPromise = Promise.resolve(); // Chain ของเสียงที่รอเล่น
let _pendingAnnounceResolve = null;        // ตัวยกเลิก announcement ที่รออยู่
let _isAudioPlaying = false;               // ตัวบอกว่ากำลังเล่นอยู่ไหม

// Queue announcement แบบ Serial (ต่อคิว รอเล่นเสร็จก่อน)
// ถ้ามี announcement รออยู่แล้ว 1 ชุด จะยกเลิกอันเก่าทิ้ง เอาอันใหม่แทน (latest-wins queue)
let _nextPendingArgs = null;

// Pronounce numbers digit-by-digit in Thai for hospital clarity
const THAI_DIGITS = {
  "0": "ศูนย์",
  "1": "หนึ่ง",
  "2": "สอง",
  "3": "สาม",
  "4": "สี่",
  "5": "ห้า",
  "6": "หก",
  "7": "เจ็ด",
  "8": "แปด",
  "9": "เก้า",
};

export function formatHnForSpeech(hn) {
  if (!hn) return "";
  const str = String(hn).replace(/[^0-9]/g, "");
  // Speak each digit clearly: e.g. "142" -> "หนึ่ง สี่ สอง"
  return str.split("").map((d) => THAI_DIGITS[d] || d).join(" ");
}

// Play hospital chime (Ding-Dong / ติ๊ง-ติ่ง) using native Web Audio API
export function playHospitalChime() {
  return new Promise((resolve) => {
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) {
        resolve();
        return;
      }

      const ctx = new AudioCtx();
      const now = ctx.currentTime;

      // Note 1: E5 (659.25 Hz) - "ติ๊ง"
      const osc1 = ctx.createOscillator();
      const gain1 = ctx.createGain();
      osc1.type = "sine";
      osc1.frequency.setValueAtTime(659.25, now);
      gain1.gain.setValueAtTime(0.3, now);
      gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.55);
      osc1.connect(gain1);
      gain1.connect(ctx.destination);
      osc1.start(now);
      osc1.stop(now + 0.55);

      // Note 2: C5 (523.25 Hz) - "ติ่ง" after 0.28 seconds
      const osc2 = ctx.createOscillator();
      const gain2 = ctx.createGain();
      osc2.type = "sine";
      osc2.frequency.setValueAtTime(523.25, now + 0.28);
      gain2.gain.setValueAtTime(0.35, now + 0.28);
      gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.95);
      osc2.connect(gain2);
      gain2.connect(ctx.destination);
      osc2.start(now + 0.28);
      osc2.stop(now + 0.95);

      setTimeout(() => {
        resolve();
      }, 950);
    } catch (e) {
      console.warn("AudioContext error:", e);
      resolve();
    }
  });
}

// Helper to play a single audio file and resolve on finish
function playAudioFile(url) {
  return new Promise((resolve) => {
    try {
      const audio = new Audio(url);
      audio.preload = "auto";
      audio.onended = () => resolve(true);
      audio.onerror = () => resolve(false);
      const timer = setTimeout(() => resolve(false), 5000);
      const playPromise = audio.play();
      if (playPromise !== undefined) {
        playPromise.catch(() => {
          clearTimeout(timer);
          resolve(false);
        });
      }
    } catch (_) {
      resolve(false);
    }
  });
}

// Play real studio female voice audio sequence (Intro -> Digits -> Room)
async function playFemaleVoiceBank(hn, roomClean, basePath = "/msr") {
  const digits = String(hn).replace(/[^0-9]/g, "").split("");
  const roomNum = String(roomClean).replace(/[^0-9]/g, "") || "1";

  const base = basePath.endsWith("/") ? basePath.slice(0, -1) : basePath;
  const files = [
    `${base}/audio/queue/intro.mp3`,
    ...digits.map((d) => `${base}/audio/queue/num_${d}.mp3`),
    `${base}/audio/queue/room_${roomNum}.mp3`,
  ];

  for (const url of files) {
    let ok = await playAudioFile(url);
    if (!ok) {
      // Fallback try without basePath
      const altUrl = url.replace(/^\/msr/, "");
      ok = await playAudioFile(altUrl);
      if (!ok) return false;
    }
  }
  return true;
}

// Fallback SpeechSynthesis: strictly filter for female Thai voice with sweeter pitch
function speakFemaleTextOnce(text) {
  return new Promise((resolve) => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) {
      resolve();
      return;
    }

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "th-TH";
    utterance.rate = 0.90; // จังหวะนุ่มนวล สุภาพ
    utterance.pitch = 1.25; // 🌸 ปรับ Pitch ให้เสียงหวานสดใส เป็นเสียงผู้หญิงชัดเจน ไม่ทุ้มต่ำ

    // กรองหาเสียงผู้หญิงภาษาไทยโดยเฉพาะ (คัดเสียงผู้ชาย เช่น Microsoft Niwat ออกเด็ดขาด)
    const voices = window.speechSynthesis.getVoices();
    const femaleVoice =
      voices.find((v) => {
        const isThai = v.lang.includes("th") || v.name.includes("Thai");
        if (!isThai) return false;
        const n = v.name.toLowerCase();
        if (n.includes("niwat") || (n.includes("male") && !n.includes("female"))) {
          return false;
        }
        return (
          n.includes("premwadee") ||
          n.includes("achara") ||
          n.includes("narisa") ||
          n.includes("female") ||
          n.includes("google") ||
          n.includes("siri")
        );
      }) ||
      voices.find((v) => {
        const isThai = v.lang.includes("th") || v.name.includes("Thai");
        const n = v.name.toLowerCase();
        return isThai && !n.includes("niwat");
      });

    if (femaleVoice) {
      utterance.voice = femaleVoice;
    }

    let finished = false;
    const finish = () => {
      if (!finished) {
        finished = true;
        resolve();
      }
    };

    utterance.onend = finish;
    utterance.onerror = finish;
    setTimeout(finish, 8000);

    window.speechSynthesis.speak(utterance);
  });
}

// Speak queue announcement in Thai (Female Voice Engine):
// รูปแบบ: "ติ๊งติ่ง เชิญหมายเลข [หนึ่งสี่สอง] ที่ห้องให้คำปรึกษา 1 ค่ะ" (เรียกซ้ำ 2 ครั้ง)
// ============================================================
// ระบบ QUEUE ป้องกันเสียงซ้อน:
// - ถ้ากำลังเล่นเสียงอยู่ → รับ request ใหม่ไว้รอ (แทนที่ request เก่าถ้ามีอยู่)
// - เมื่อเสียงปัจจุบันเล่นเสร็จ → เล่น request ที่รออยู่ทันที
// - ผลลัพธ์: ไม่มีเสียงซ้อนกันเด็ดขาด แต่ก็ไม่พลาดเสียงล่าสุดค่ะ
// ============================================================
export function announceQueue(args) {
  if (typeof window === "undefined") return Promise.resolve();

  if (_isAudioPlaying) {
    // มีเสียงเล่นอยู่ → เก็บ request ใหม่ไว้รอ (ทับ request เก่าถ้ามี)
    _nextPendingArgs = args;
    return Promise.resolve();
  }

  // ไม่มีเสียงเล่น → เริ่มเล่นทันที พร้อม chain ต่อถ้ามี pending
  _isAudioPlaying = true;
  _audioLockPromise = _runAnnounce(args).finally(async () => {
    // เช็คว่ามี pending request รออยู่ไหม
    if (_nextPendingArgs) {
      const nextArgs = _nextPendingArgs;
      _nextPendingArgs = null;
      await _runAnnounce(nextArgs);
    }
    _isAudioPlaying = false;
  });

  return _audioLockPromise;
}

// ฟังก์ชันภายใน: เล่นเสียงประกาศจริงๆ (ไม่มี lock logic ในนี้)
async function _runAnnounce({ hn, roomName, staffName, repeat = 2, basePath = "/msr" }) {
  // Cancel any previous Web Speech (safety net)
  if ("speechSynthesis" in window) {
    window.speechSynthesis.cancel();
  }

  // 1) Play hospital chime bell first (ติ๊ง~ติ่ง~)
  await playHospitalChime();

  const rawRoom = String(roomName || "1").trim();
  const roomClean = rawRoom.replace(/^ห้อง(?:คอนเซาท์|ให้คำปรึกษา)?\s*/i, "").trim() || "1";

  // 2) ENGINE 1: เล่นไฟล์เสียง AI ผู้หญิงจาก Audio Bank
  const playedFirst = await playFemaleVoiceBank(hn, roomClean, basePath);

  if (playedFirst) {
    if (repeat > 1) {
      await new Promise((r) => setTimeout(r, 1200)); // เว้นจังหวะ 1.2 วินาที
      await playFemaleVoiceBank(hn, roomClean, basePath); // ประกาศรอบที่ 2
    }
    return;
  }

  // 3) ENGINE 2: Fallback Web Speech API (บังคับเสียงผู้หญิง + Pitch หวานใส)
  const speechHn = formatHnForSpeech(hn);
  const text = `เชิญหมายเลข ${speechHn} ที่ห้องให้คำปรึกษา ${roomClean} ค่ะ`;

  await speakFemaleTextOnce(text);

  if (repeat > 1) {
    await new Promise((r) => setTimeout(r, 1200));
    await speakFemaleTextOnce(text);
  }
}

