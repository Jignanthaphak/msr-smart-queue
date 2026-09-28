// services/queue.js
import clientConfig from "@/config/Client";
import { POST, GET } from "@/lib/utils/request";

export function getQueueConfig() {
  return GET(clientConfig.backend_url + "/queue/config");
}

export function saveQueueConfig(config) {
  return POST(clientConfig.backend_url + "/queue/config", config);
}

export function getQueueState() {
  return GET(clientConfig.backend_url + "/queue/state");
}

export function callQueue(data) {
  return POST(clientConfig.backend_url + "/queue/state", { action: "call", ...data });
}

export function recallQueue(data) {
  return POST(clientConfig.backend_url + "/queue/state", { action: "recall", ...data });
}

export function holdQueue(data) {
  return POST(clientConfig.backend_url + "/queue/state", { action: "hold", ...data });
}

export function resumeQueue(data) {
  return POST(clientConfig.backend_url + "/queue/state", { action: "resume", ...data });
}
