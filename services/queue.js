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

export function skipQueue(data) {
  return POST(clientConfig.backend_url + "/queue/state", { action: "skip", ...data });
}

export function extendCallQueue(data) {
  return POST(clientConfig.backend_url + "/queue/state", { action: "extend_call", ...data });
}

export function reorderWaitingQueue(data) {
  return POST(clientConfig.backend_url + "/queue/state", { action: "reorder_waiting", ...data });
}

export function moveWaitingQueue(data) {
  return POST(clientConfig.backend_url + "/queue/state", { action: "move_waiting", ...data });
}

