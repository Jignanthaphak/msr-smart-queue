// services/monitor.js
import clientConfig from "@/config/Client";
import { POST, GET } from "@/lib/utils/request";

export function getBreakStatus() {
  return GET(clientConfig.backend_url + "/monitor/break");
}

export function toggleBreakStatus(isBreak) {
  return POST(clientConfig.backend_url + "/monitor/break", { is_break: isBreak });
}
