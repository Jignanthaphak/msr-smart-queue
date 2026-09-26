// actions/bioReportActions.js
"use server";
import "server-only";
import fs from "fs";
import path from "path";

/**
 * Server Action สำหรับอัปโหลดภาพรายงาน DDR หรือ APG จากหน้าเว็บ
 */
export async function uploadBioImageAction({ screeningId, hn, type, base64 }) {
  try {
    if (!base64) {
      return { ok: false, error: "ไม่พบข้อมูลรูปภาพ" };
    }

    const uploadDir = path.join(process.cwd(), "public", "uploads", "bio");
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    const cleanBase64 = base64.replace(/^data:image\/\w+;base64,/, "");
    const buffer = Buffer.from(cleanBase64, "base64");
    const timeStamp = Date.now();

    // บันทึกชื่ออ้างอิง HN + timestamp
    const hnFileName = `${hn || "bio"}_${timeStamp}_${type}.jpg`;
    fs.writeFileSync(path.join(uploadDir, hnFileName), buffer);

    let returnUrl = `/msr/uploads/bio/${hnFileName}`;

    // ถ้ามี screeningId บันทึกชื่อ bio_${screeningId}_${type}.jpg ด้วย
    if (screeningId) {
      const idFileName = `bio_${screeningId}_${type}.jpg`;
      fs.writeFileSync(path.join(uploadDir, idFileName), buffer);
      returnUrl = `/msr/uploads/bio/${idFileName}`;
    }

    return {
      ok: true,
      message: `บันทึกภาพ ${type.toUpperCase()} สำเร็จเรียบร้อยค่ะ`,
      url: returnUrl,
    };
  } catch (err) {
    console.error("uploadBioImageAction error:", err);
    return { ok: false, error: err.message || "เกิดข้อผิดพลาดในการบันทึกภาพ" };
  }
}

/**
 * Server Action สำหรับค้นหาและดึง URL ของภาพรายงาน DDR และ APG
 */
export async function getBioImagesAction({ screeningId, hn }) {
  try {
    const uploadDir = path.join(process.cwd(), "public", "uploads", "bio");
    let ddrUrl = null;
    let apgUrl = null;

    if (fs.existsSync(uploadDir)) {
      const files = fs.readdirSync(uploadDir);

      // 1. หาตาม screening_id ก่อน
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

      // 2. ถ้าไม่พบ หาตาม HN ล่าสุด
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

    // 3. ตรวจสอบใน cache ล่าสุด
    if (hn && (!ddrUrl || !apgUrl) && global._bioPushCache) {
      const cached = global._bioPushCache.get(hn);
      if (cached && cached.data) {
        if (!ddrUrl && cached.data.ddr_image_url) {
          const u = cached.data.ddr_image_url;
          ddrUrl = u.startsWith('/msr/') ? u : `/msr${u.startsWith('/') ? '' : '/'}${u}`;
        }
        if (!apgUrl && cached.data.apg_image_url) {
          const u = cached.data.apg_image_url;
          apgUrl = u.startsWith('/msr/') ? u : `/msr${u.startsWith('/') ? '' : '/'}${u}`;
        }
      }
    }

    return {
      ok: true,
      ddrUrl,
      apgUrl,
    };
  } catch (err) {
    console.error("getBioImagesAction error:", err);
    return { ok: false, error: err.message };
  }
}
