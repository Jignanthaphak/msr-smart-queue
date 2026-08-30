// app/service/screening/consult.js
import clientConfig from "@/config/Client";
import { GET, POST, PUT, PATCH } from "@/lib/utils/request";

export function getsearchconsult (paramsData) {
  return GET(clientConfig.backend_url+"/screening/consult", paramsData);
}

export function updateconsult (screening_id, formData) {
  return PUT(clientConfig.backend_url+"/screening/consult/"+screening_id, formData);
}

export function patchconsult (screening_id) {
  return PATCH(clientConfig.backend_url+"/screening/consult/"+screening_id, {});
}

export function startconsult (screening_id) {
  return PATCH(clientConfig.backend_url+"/screening/consult/"+screening_id+"/start", {});
}

export function closeconsult (screening_id) {
  return PATCH(clientConfig.backend_url+"/screening/consult/"+screening_id+"/close", {});
}

export function finishfollowup (screening_id) {
  return PATCH(clientConfig.backend_url+"/screening/consult/"+screening_id+"/finish-follow", {});
}





