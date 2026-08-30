// next.config.mjs
const nextConfig = {
  basePath: '/msr',
  images: {
    unoptimized: true, 
  },
  serverActions: {
    allowedOrigins: ['localhost', '127.0.0.1:3000', 'localhost:3000','mhc4.dmh.go.th']
  },
  serverExternalPackages: [
    "knex",
    "mysql2",
    "better-sqlite3",
    "sqlite3",
    "oracledb",
    "pg",
    "pg-query-stream",
    "tedious"
  ]
};

export default nextConfig;
