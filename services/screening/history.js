// app/service/screening/history.js
import clientConfig from "@/config/Client";
import { GET } from "@/lib/utils/request";

export function gethistoryscreeningbyhn (hn) {
  return GET(clientConfig.backend_url+"/screening/history/hn/"+hn);
}

export function gethistoryscreeningbyscreeningid (screening_id) {
  return GET(clientConfig.backend_url+"/screening/history/screening/"+screening_id);
}