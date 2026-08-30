// app/service/screening/home.js
import clientConfig from "@/config/Client";
import { GET } from "@/lib/utils/request";

export function screeningList (paramsData) {
  return GET(clientConfig.backend_url+"/screening", paramsData);
}
