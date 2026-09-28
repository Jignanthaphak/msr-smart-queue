// lib/utils/queueAudio.js
"use client";

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

function speakTextOnce(text) {
  return new Promise((resolve) => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) {
      resolve();
      return;
    }

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "th-TH";
    utterance.rate = 0.90; // จังหวะนุ่มนวล ชัดถ้อยชัดคำ สไตล์เคาน์เตอร์โรงพยาบาล
    utterance.pitch = 1.05; // น้ำเสียงสดใส อบอุ่น สุภาพ

    // Try finding the best Thai voice available (Neural / Female / Thai)
    const voices = window.speechSynthesis.getVoices();
    const thaiVoice =
      voices.find(
        (v) =>
          (v.lang.includes("th") || v.name.includes("Thai")) &&
          (v.name.includes("Premwadee") || v.name.includes("Achara") || v.name.includes("Female") || v.name.includes("Google"))
      ) || voices.find((v) => v.lang.includes("th") || v.name.includes("Thai"));

    if (thaiVoice) {
      utterance.voice = thaiVoice;
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

    // Safety timeout: in case onend doesn't fire within 8 seconds
    setTimeout(finish, 8000);

    window.speechSynthesis.speak(utterance);
  });
}

// Speak queue announcement in Thai:
// รูปแบบ: "ติ๊งติ่ง เชิญหมายเลข [หนึ่งสี่สอง] ที่ห้องให้คำปรึกษา 1 ค่ะ" (เรียกซ้ำ 2 ครั้ง)
export async function announceQueue({ hn, roomName, staffName, repeat = 2 }) {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) return;

  // 1) Cancel any previous speech
  window.speechSynthesis.cancel();

  // 2) Play hospital chime bell first (ติ๊ง~ติ่ง~)
  await playHospitalChime();

  // 3) Formulate announcement text:
  // ตัวอย่าง: "เชิญหมายเลข หนึ่ง สี่ สอง ที่ห้องให้คำปรึกษา 1 ค่ะ"
  const speechHn = formatHnForSpeech(hn);
  const rawRoom = String(roomName || "1").trim();
  const roomClean = rawRoom.replace(/^ห้อง(?:คอนเซาท์|ให้คำปรึกษา)?\s*/i, "").trim() || "1";
  const text = `เชิญหมายเลข ${speechHn} ที่ห้องให้คำปรึกษา ${roomClean} ค่ะ`;

  // 4) ประกาศรอบที่ 1
  await speakTextOnce(text);

  // 5) หากตั้งให้เรียกซ้ำ (ค่าเริ่มต้น 2 ครั้ง): เว้นจังหวะ 1.2 วินาที แล้วประกาศรอบที่ 2
  if (repeat > 1) {
    await new Promise((r) => setTimeout(r, 1200));
    await speakTextOnce(text);
  }
}
