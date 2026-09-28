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
  // Speak each digit clearly: e.g. "6800124" -> "หก แปด ศูนย์ ศูนย์ หนึ่ง สอง สี่"
  return str.split("").map((d) => THAI_DIGITS[d] || d).join(" ");
}

// Play hospital chime (Ding-Dong) using native Web Audio API - no external audio files needed!
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

      // Note 1: E5 (659.25 Hz)
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

      // Note 2: C5 (523.25 Hz) after 0.28 seconds
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

// Speak queue announcement in Thai
export async function announceQueue({ hn, roomName, staffName }) {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) return;

  // 1) Play hospital chime bell first
  await playHospitalChime();

  // 2) Formulate announcement text
  // e.g. "ขอเชิญหมายเลข หก แปด ศูนย์ ศูนย์ หนึ่ง สอง สี่ ที่ห้องคอนเซาท์ 1 ค่ะ"
  const speechHn = formatHnForSpeech(hn);
  const cleanRoom = roomName || "ห้องคอนเซาท์";
  const text = `ขอเชิญหมายเลข ${speechHn} ที่ ${cleanRoom} ค่ะ`;

  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = "th-TH";
  utterance.rate = 0.92; // Slightly calm and clear hospital pacing
  utterance.pitch = 1.05; // Pleasant friendly tone

  // Try finding Thai voice if available in browser
  const voices = window.speechSynthesis.getVoices();
  const thaiVoice = voices.find((v) => v.lang.includes("th") || v.name.includes("Thai"));
  if (thaiVoice) {
    utterance.voice = thaiVoice;
  }

  window.speechSynthesis.cancel(); // Cancel any previous speech
  window.speechSynthesis.speak(utterance);
}
