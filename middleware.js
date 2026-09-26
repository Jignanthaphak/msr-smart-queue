import {requestValidationMiddlewareApi, requestValidationMiddlewareUi}  from "@/lib/validators/request/requestValidationMiddleware";

export async function middleware(request) {
  const { pathname } = request.nextUrl;

  // ข้าม static assets, uploads, images และไฟล์รูปภาพทั้งหมดโดยตรง ไม่ต้องผ่านการตรวจ session
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/uploads') ||
    pathname.startsWith('/images') ||
    pathname.startsWith('/favicon.ico') ||
    /\.(?:svg|png|jpg|jpeg|gif|webp|ico)$/i.test(pathname)
  ) {
    return;
  }

  if (pathname.startsWith('/api')) {
    return await requestValidationMiddlewareApi(request);
  }

  return await requestValidationMiddlewareUi(request);
}

export const config = {
  // ข้าม static assets, uploads, images ไม่ให้ middleware เข้าไปดักจับ
  matcher: ['/((?!_next/static|_next/image|favicon.ico|uploads|images).*)'],
};

