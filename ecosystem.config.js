module.exports = {
  apps: [
    {
      name: "next-msr-web",
      // ชี้ไปที่ไฟล์ตัวรันของ next โดยตรง
      script: "node_modules/next/dist/bin/next", 
      args: "start",
      cwd: "C:\\msr-web",
      instances: 1,
      exec_mode: "fork",
      env: {
        NODE_ENV: "production",
        PORT: 3000
      }
    }
  ]
};