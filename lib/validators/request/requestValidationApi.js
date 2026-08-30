import "server-only";
import {
  checkCorsOrigin,
  createCorsResponse,
  checkInternalHeader,
  checkContentType,
  isSessionBypassedApi,
  checkSession,
  checkCsrfToken,
  verifySessionDetails,
} from "@/lib/utils/securityChecks";

export default async function requestValidationApi(request) {

  const { pathname } = request.nextUrl

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

  const csrfCheck = await checkCsrfToken(request, session)
  if (csrfCheck) return csrfCheck

  const verifyResponse = await verifySessionDetails(session, request)
  if (verifyResponse) return verifyResponse

  return null
}