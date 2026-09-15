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
    ui_session_bypass_paths:[],
    api_session_bypass_paths:[
      '/api/auth/login',
      '/api/auth/thaid/login',
      '/api/auth/thaid/callback'
    ],
    content_type_response:"application/json",
    allowed_request_content_types: [
      "application/json",
      "multipart/form-data"
    ],
  },
 
};

export default serverConfig;