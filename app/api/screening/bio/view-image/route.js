// app/api/screening/bio/view-image/route.js
import "server-only";
import fs from "fs";
import path from "path";

/**
 * Route สตรีมไฟล์รูปภาพรายงาน DDR/APG ตรงจากโฟลเดอร์ uploads/bio
 * รองรับทั้งกรณีเรียกตรง เปิดแท็บใหม่ หรือเป็น fallback เมื่อ static path มีปัญหา
 */
export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const fileName = (searchParams.get("name") || searchParams.get("file") || "").replace(/[^a-zA-Z0-9_.-]/g, "");

    if (!fileName) {
      return new Response("File name required", { status: 400 });
    }

    const filePath = path.join(process.cwd(), "public", "uploads", "bio", fileName);
    if (!fs.existsSync(filePath)) {
      return new Response("Image not found: " + fileName, { status: 404 });
    }

    const buffer = fs.readFileSync(filePath);
    const ext = path.extname(fileName).toLowerCase();
    const contentType = ext === ".png" ? "image/png" : ext === ".webp" ? "image/webp" : "image/jpeg";

    return new Response(buffer, {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=86400, stale-while-revalidate=43200",
        "Content-Disposition": `inline; filename="${fileName}"`,
      },
    });
  } catch (err) {
    console.error("view-image error:", err);
    return new Response("Error: " + err.message, { status: 500 });
  }
}
