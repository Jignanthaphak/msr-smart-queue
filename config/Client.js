// /config/Client.js
const clientConfig = {
  base_path:process.env.NEXT_PUBLIC_BASE_PATH,
  login_url: "/login",
  backend_url: "/msr/api",
  request:{
    content_type_default:"application/json"
  }
};
export default clientConfig;