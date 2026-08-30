// /lib/Knex/dbKnex.js
import "server-only";
import serverConfig from "@/config/Server";

import knex from "knex";

const knexConfig = knex({
  client: "mysql2",
  connection: {
    host: serverConfig.db.host,
    user: serverConfig.db.user,
    password: serverConfig.db.password,
    database: serverConfig.db.name,
    timezone: '+07:00', 
  },
  pool: { min: 2, max: 10 },
  // debug: true
});

export default knexConfig;
