// app/service/defaultData.js
import clientConfig from "@/config/Client";
import { GET } from "@/lib/utils/request";

export function getdatadefault() {
  return GET(clientConfig.backend_url+"/default-data");
}
