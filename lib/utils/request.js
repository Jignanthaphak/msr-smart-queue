// /lib/utils/request.js
import  clientConfig  from "@/config/Client";
export async function request(url, options = {}) {

  const headers = {
    ...(options.headers || {}),
  };

  if (!headers["Content-Type"]) {
    headers["Content-Type"] = clientConfig.request.content_type_default;
  }
  
  const csrfToken = typeof document !== "undefined"
    ? document.querySelector("meta[name='csrf-token']")?.getAttribute("content")
    : null;

  if (csrfToken) {
    headers["X-CSRF-Token"] = csrfToken;
  }


  try {
    const res = await fetch(url, {
      ...options,
      headers,
    });

    let data;

    // ป้องกันกรณี response ไม่ใช่ JSON เช่น 404 ที่ส่งกลับเป็น HTML
    const contentType = res.headers.get("Content-Type");
    if (contentType && contentType.includes("application/json")) {
      data = await res.json();
    } else {
      data = null;
    }

    if (!res.ok) {

      // ดึงข้อความจาก JSON response (ถ้ามี)

      let errorMessage;

      // กรณี error 500 ข้อความพิเศษ

      if (res.status === 500) {

        errorMessage = "เกิดข้อผิดพลาดกับ Server";

      } else {

         // กรณีอื่น ๆ ใช้ message จาก response หรือ statusText

        errorMessage = data?.message || data?.error || `Error ${res.status}: ${res.statusText}`;
      }

      throw new Error(errorMessage);
    }

    return data;

  } catch (err) {
    const errorMessage = err?.message || "เกิดข้อผิดพลาดที่ไม่รู้จัก";
    console.error("Request error:", errorMessage);
    throw new Error(errorMessage);
  }
}


// ฟังก์ชันย่อยสำหรับ GET
export function GET(url, params = {}) {
  const search = new URLSearchParams(params).toString();
  const fullUrl = `${url}${search ? `?${search}` : ""}`;
  return request(fullUrl, { method: "GET" });
}

// ฟังก์ชันย่อยสำหรับ POST
export function POST(url, data) {
  let body;
  let headers = {};

  if (data instanceof FormData) {
    body = data;
    headers = {};
  } else {
    body = JSON.stringify(data);
    headers = { "Content-Type": "application/json" };
  }

  return request(url, {
    method: "POST",
    body,
    headers,
  });
}

// ฟังก์ชันย่อยสำหรับ PUT
export function PUT(url, data) {
  let body;
  let headers = {};

  if (data instanceof FormData) {
    body = data;
    headers = {};
  } else {
    body = JSON.stringify(data);
    headers = { "Content-Type": "application/json" };
  }

  return request(url, {
    method: "PUT",
    body,
    headers,
  });
}

export function PATCH(url, data) {
  let body;
  let headers = {};

  if (data instanceof FormData) {
    body = data;
    headers = {};
  } else {
    body = JSON.stringify(data);
    headers = { "Content-Type": "application/json" };
  }

  return request(url, {
    method: "PATCH",
    body,
    headers,
  });
}




