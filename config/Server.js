// /config/Server.js
import "server-only";
const serverConfig = {

  db: {
    host: process.env.DB_HOST,
    user: process.env.DB_USERNAME,
    password: process.env.DB_PASSWORD,
    name: process.env.DB_NAME,
  },
  session:{
    cookiename: "MsrordSession",
    session_password: process.env.SESSION_PASSWORD,
    httponly: true,
    samesite: "Lax",
    path: "/",
    maxage: 360000,
    // isprod: process.env.NODE_ENV === "production",
    isprod: false,
  },
  middleware:{
    allowed_origins:[],
    ui_session_bypass_paths:[
      '/uploads',
      '/images',
      '/msr/uploads',
      '/msr/images',
    ],
    api_session_bypass_paths:[
      '/api/auth/login',
      '/api/auth/thaid/login',
      '/api/auth/thaid/callback',
      '/api/screening/thaid/request',
      '/msr/api/screening/thaid/request',
      '/api/screening/thaid/status',
      '/msr/api/screening/thaid/status',
      '/api/screening/bio/receive',
      '/msr/api/screening/bio/receive',
      '/api/screening/bio/images',
      '/msr/api/screening/bio/images',
      '/api/screening/bio/view-image',
      '/msr/api/screening/bio/view-image',
    ],
    content_type_response:"application/json",
    allowed_request_content_types: [
      "application/json",
      "multipart/form-data"
    ],
  },
 
};

export default serverConfig;