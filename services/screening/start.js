// app/service/screening/start.js
import clientConfig from "@/config/Client";
import { POST } from "@/lib/utils/request";

export function startscreening (hn) {
  return POST(clientConfig.backend_url+"/screening/"+hn, {});
}


