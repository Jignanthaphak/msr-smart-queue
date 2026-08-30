import {requestValidationMiddlewareApi, requestValidationMiddlewareUi}  from "@/lib/validators/request/requestValidationMiddleware";
export async function middleware(request) {

  const { pathname } = request.nextUrl
 
  if (pathname.startsWith('/api')) {
    return await requestValidationMiddlewareApi(request)
  }

  return await requestValidationMiddlewareUi(request)
  
}

export const config = {
  matcher: ['/', '/((?!_next|favicon.ico).*)'],
}
