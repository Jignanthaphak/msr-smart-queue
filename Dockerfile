# FILE: Dockerfile
# Stage 1: Builder - ติดตั้ง dependency + build Next.js
FROM node:20-bookworm AS builder

# ติดตั้ง dependency สำหรับ build (compile native modules, lightningcss ฯลฯ)
RUN apt-get update && \
    apt-get install -y python3 build-essential && \
    rm -rf /var/lib/apt/lists/*

WORKDIR /app

# คัดลอกไฟล์ package เพื่อให้ Docker cache layer ได้ดีขึ้น
COPY package.json package-lock.json ./

# ติดตั้ง dependency ทั้งหมด (รวม devDependencies)
RUN npm ci

# คัดลอกซอร์สทั้งหมดเข้า image
COPY . .

# ตั้งโหมด production ตอน build
ENV NODE_ENV=production

# Build โปรเจค Next.js
RUN npm run build

# Stage 2: Runner - ใช้ image เล็กลง และรันด้วย user ที่ไม่ใช่ root
FROM node:20-bookworm-slim AS runner

WORKDIR /app

# ตั้งค่า environment พื้นฐาน
ENV NODE_ENV=production
ENV PORT=3000
ENV TZ=Asia/Bangkok

# สร้างโฟลเดอร์และกำหนดสิทธิ์ให้ user node
RUN useradd -ms /bin/bash appuser && \
    mkdir -p /app && \
    chown -R appuser:appuser /app

# เปลี่ยนมาใช้ user สิทธิ์ต่ำ (ไม่ใช่ root)
USER appuser

# คัดลอกผลลัพธ์จาก builder stage (รวม .next, public, node_modules ฯลฯ)
COPY --from=builder /app ./

EXPOSE 3000

# รันแอปด้วยคำสั่ง start จาก package.json
CMD ["npm", "start"]
