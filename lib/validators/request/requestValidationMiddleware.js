import "server-only";
import {
  checkCorsOrigin,
  createCorsResponse,
  checkInternalHeader,
  createResponseUi,
  checkContentType,
  isSessionBypassedApi,
  isSessionBypassedUi,
  checkSession,
  checkCsrfToken,
  verifySessionDetails,
  checkRedirectUi
} from "@/lib/utils/securityChecks";

export async function requestValidationMiddlewareApi(request) {
  
    const { pathname } = request.nextUrl
    const method = request.method
   
    const corsCheck = await checkCorsOrigin(request)
    if (corsCheck) return corsCheck
  
    const res = await createCorsResponse(request)
  
    const sessionBypass = await isSessionBypassedApi(pathname);
    if (sessionBypass) {
      return res;
    }

    const internalHeaderCheck = await checkInternalHeader(request)
    if (internalHeaderCheck) return internalHeaderCheck
   
    const contentTypeCheck = await checkContentType(request)
    if (contentTypeCheck) return contentTypeCheck
  
    const { errorResponse, session } = await checkSession(request, res)
    if (errorResponse) return errorResponse
  
    const csrfCheck = checkCsrfToken(request, session)
    if (csrfCheck) return csrfCheck

    const verifyResponse = await verifySessionDetails(session, request)
    if (verifyResponse) return verifyResponse
   
    return res
}

export async function requestValidationMiddlewareUi(request) {
  
  const { pathname } = request.nextUrl;

  const res = await createResponseUi()

  const sessionBypass = await isSessionBypassedUi(pathname);
  if (sessionBypass) {
    return res;
  }

  const { session } = await checkSession(request, res)

  const redirect = await checkRedirectUi(request, session);
  if (redirect) return redirect; 

  return res;
  
}