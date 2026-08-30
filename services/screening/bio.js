// app/service/screening/bio.js
import clientConfig from "@/config/Client";
import { GET, POST, PUT, PATCH } from "@/lib/utils/request";

export function getsearchbio (paramsData) {
  return GET(clientConfig.backend_url+"/screening/bio", paramsData);
}

export function updatebio (screening_id, formData) {
  return PUT(clientConfig.backend_url+"/screening/bio/"+screening_id, formData);
}

export function patchbio (screening_id) {
  return PATCH(clientConfig.backend_url+"/screening/bio/"+screening_id, {});
}



