// app/service/auth.js
import clientConfig from "@/config/Client";
import { POST, GET } from "@/lib/utils/request";
export function loginUser(loginData) {
  return POST(clientConfig.backend_url+"/auth/login", loginData);
}

export function logoutUser() {
   return POST(clientConfig.backend_url+"/auth/logout");
}

export function resetPassUser(data) {
  return POST(clientConfig.backend_url+"/auth/resetpass", data);
}