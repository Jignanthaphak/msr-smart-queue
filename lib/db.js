// /lib/db.js
import "server-only";
import mysql from "mysql2/promise";
import serverConfig from "@/config/Server";

export const db = mysql.createPool({
  host: serverConfig.db.host,    
  user: serverConfig.db.user,         
  password: serverConfig.db.password,    
  database: serverConfig.db.name,    
});
