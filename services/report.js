// app/service/report.js
import clientConfig from "@/config/Client";
import { POST, GET } from "@/lib/utils/request";

export function getreportexcel(paramsData) {
  return GET(clientConfig.backend_url+"/report/report_excel", paramsData);
}

export function getreportpdf(paramsData) {
  return GET(clientConfig.backend_url+"/report/report_pdf", paramsData);
}


export function getreportcounselingcenter(paramsData) {
  return GET(clientConfig.backend_url+"/report/report_counseling_center", paramsData);
}

export function getaistats(paramsData) {
  return GET(clientConfig.backend_url+"/report/ai_stats", paramsData);
}

export function getreportappointment(paramsData) {
  return GET(clientConfig.backend_url+"/report/report_appointment", paramsData);
}

export function getdashboardsummary(paramsData) {
  return GET(clientConfig.backend_url+"/report/dashboard_summary", paramsData);
}

export function getdashboardai(body) {
  return POST(clientConfig.backend_url+"/report/dashboard_ai", body);
}

export function getreporteclaim(paramsData) {
  return GET(clientConfig.backend_url+"/report/report_eclaim", paramsData);
}

