# ============================================================
# Dockerfile — Todo List (static client-side)
# Stage 1: รันเทสด้วย Node (ป้องกัน build image จากโค้ดที่พัง)
# Stage 2: serve ไฟล์ static ด้วย nginx (unprivileged = non-root)
# ============================================================

# ---------- Stage 1: test ----------
FROM node:22-alpine AS test
WORKDIR /app
COPY ./tests ./tests/
COPY app.js index.html ./
# เทสรันด้วย Node ล้วน ไม่ต้อง npm install (ไม่มี dependency)
RUN node tests/app.test.js

# ---------- Stage 2: serve ----------
# nginx-unprivileged รันด้วย user non-root (uid 101) และฟัง port 8080
FROM nginxinc/nginx-unprivileged:1.27-alpine

# คัดลอกเฉพาะไฟล์ static ที่จำเป็น (ไม่เอา docs/tests)
COPY --from=test /app/index.html /usr/share/nginx/html/index.html
COPY styles.css /usr/share/nginx/html/styles.css
COPY app.js /usr/share/nginx/html/app.js

# nginx-unprivileged ใช้ user nginx (uid 101) อยู่แล้ว — ยืนยันอีกชั้น
USER 101

EXPOSE 8080

# Health check: ต้องได้ HTTP 200 จากหน้าแรก
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget -q -O /dev/null http://127.0.0.1:8080/ || exit 1

# default CMD ของ image คือ nginx อยู่แล้ว — ระบุซ้ำเพื่อความชัดเจน
CMD ["nginx", "-g", "daemon off;"]
