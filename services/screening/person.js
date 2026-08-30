// app/service/screening/person.js
import clientConfig from "@/config/Client";
import { GET, POST, PUT } from "@/lib/utils/request";

export function getsearchperson (paramsData) {
  return GET(clientConfig.backend_url+"/person", paramsData);
}

export function saveperson (fromData) {
  return POST(clientConfig.backend_url+"/person", fromData);
}

export function createhn () {
  return POST(clientConfig.backend_url+"/person/reserve-hn",{});
}

export function updateperson (hn, fromData) {
  return PUT(clientConfig.backend_url+"/person/"+hn, fromData);
}


