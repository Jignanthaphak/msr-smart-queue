// app/api/screening/bio/images/route.js
"use server";
import "server-only";
import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const screeningId = (searchParams.get("screening_id") || "").trim();
    const hn = (searchParams.get("hn") || "").trim();

    if (!screeningId && !hn) {
      return NextResponse.json(
        { ok: false, error: "กรุณาระบุ screening_id หรือ hn" },
        { status: 400 }
      );
    }

    const uploadDir = path.join(process.cwd(), "public", "uploads", "bio");
    let ddrUrl = null;
    let apgUrl = null;

    if (fs.existsSync(uploadDir)) {
      const files = fs.readdirSync(uploadDir);

      // 1. ค้นหาตาม screening_id ก่อน (เช่น bio_123_ddr.jpg, bio_123_apg.jpg)
      if (screeningId) {
        const ddrExact = files.find((f) =>
          new RegExp(`^bio_${screeningId}_ddr\\.(jpe?g|png|webp)$`, "i").test(f)
        );
        if (ddrExact) ddrUrl = `/msr/uploads/bio/${ddrExact}`;

        const apgExact = files.find((f) =>
          new RegExp(`^bio_${screeningId}_apg\\.(jpe?g|png|webp)$`, "i").test(f)
        );
        if (apgExact) apgUrl = `/msr/uploads/bio/${apgExact}`;
      }

      // 2. ถ้าไม่พบ หรือไม่มี screening_id ให้ค้นหาตาม HN (ไฟล์ล่าสุด)
      if (hn) {
        if (!ddrUrl) {
          const hnDdrFiles = files
            .filter((f) => new RegExp(`^${hn}_.*ddr\\.(jpe?g|png|webp)$`, "i").test(f))
            .map((f) => ({
              name: f,
              time: fs.statSync(path.join(uploadDir, f)).mtimeMs,
            }))
            .sort((a, b) => b.time - a.time);

          if (hnDdrFiles.length > 0) {
            ddrUrl = `/msr/uploads/bio/${hnDdrFiles[0].name}`;
          }
        }

        if (!apgUrl) {
          const hnApgFiles = files
            .filter((f) => new RegExp(`^${hn}_.*apg\\.(jpe?g|png|webp)$`, "i").test(f))
            .map((f) => ({
              name: f,
              time: fs.statSync(path.join(uploadDir, f)).mtimeMs,
            }))
            .sort((a, b) => b.time - a.time);

          if (hnApgFiles.length > 0) {
            apgUrl = `/msr/uploads/bio/${hnApgFiles[0].name}`;
          }
        }
      }
    }

    // 3. ถ้ายังไม่พบ ตรวจสอบใน in-memory cache ถ้ามีข้อมูลใหม่ของ HN นั้น
    if (hn && (!ddrUrl || !apgUrl) && global._bioPushCache) {
      const cached = global._bioPushCache.get(hn);
      if (cached && cached.data) {
        if (!ddrUrl && cached.data.ddr_image_url) ddrUrl = cached.data.ddr_image_url;
        if (!apgUrl && cached.data.apg_image_url) apgUrl = cached.data.apg_image_url;
      }
    }

    const hasImages = Boolean(ddrUrl || apgUrl);

    return NextResponse.json({
      ok: true,
      has_images: hasImages,
      screening_id: screeningId || null,
      hn: hn || null,
      ddr_url: ddrUrl,
      apg_url: apgUrl,
    });
  } catch (error) {
    console.error("Error fetching bio images:", error);
    return NextResponse.json(
      { ok: false, error: "เกิดข้อผิดพลาดในการดึงภาพรายงาน: " + error.message },
      { status: 500 }
    );
  }
}

export async function POST(req) {
  try {
    const body = await req.json();
    const screeningId = String(body.screening_id || "").trim();
    const hn = String(body.hn || "").trim();
    const ddrBase64 = body.ddr_image_base64 || body.ddr_base64 || "";
    const apgBase64 = body.apg_image_base64 || body.apg_base64 || "";

    if (!ddrBase64 && !apgBase64) {
      return NextResponse.json(
        { ok: false, error: "ไม่พบข้อมูลรูปภาพ Base64" },
        { status: 400 }
      );
    }

    const uploadDir = path.join(process.cwd(), "public", "uploads", "bio");
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    const timeStamp = Date.now();
    let savedDdrUrl = null;
    let savedApgUrl = null;

    if (ddrBase64) {
      const ddrClean = ddrBase64.replace(/^data:image\/\w+;base64,/, "");
      const ddrBuffer = Buffer.from(ddrClean, "base64");

      // บันทึกชื่ออ้างอิง HN + timestamp
      const hnFileName = `${hn || "bio"}_${timeStamp}_ddr.jpg`;
      fs.writeFileSync(path.join(uploadDir, hnFileName), ddrBuffer);
      savedDdrUrl = `/msr/uploads/bio/${hnFileName}`;

      // ถ้ามี screeningId บันทึกชื่อตรง bio_${screeningId}_ddr.jpg
      if (screeningId) {
        const idFileName = `bio_${screeningId}_ddr.jpg`;
        fs.writeFileSync(path.join(uploadDir, idFileName), ddrBuffer);
        savedDdrUrl = `/msr/uploads/bio/${idFileName}`;
      }
    }

    if (apgBase64) {
      const apgClean = apgBase64.replace(/^data:image\/\w+;base64,/, "");
      const apgBuffer = Buffer.from(apgClean, "base64");

      // บันทึกชื่ออ้างอิง HN + timestamp
      const hnFileName = `${hn || "bio"}_${timeStamp}_apg.jpg`;
      fs.writeFileSync(path.join(uploadDir, hnFileName), apgBuffer);
      savedApgUrl = `/msr/uploads/bio/${hnFileName}`;

      // ถ้ามี screeningId บันทึกชื่อตรง bio_${screeningId}_apg.jpg
      if (screeningId) {
        const idFileName = `bio_${screeningId}_apg.jpg`;
        fs.writeFileSync(path.join(uploadDir, idFileName), apgBuffer);
        savedApgUrl = `/msr/uploads/bio/${idFileName}`;
      }
    }

    return NextResponse.json({
      ok: true,
      message: "บันทึกภาพรายงานสำเร็จเรียบร้อยค่ะ",
      ddr_url: savedDdrUrl,
      apg_url: savedApgUrl,
    });
  } catch (error) {
    console.error("Error saving uploaded bio images:", error);
    return NextResponse.json(
      { ok: false, error: "เกิดข้อผิดพลาดในการบันทึกภาพ: " + error.message },
      { status: 500 }
    );
  }
}
