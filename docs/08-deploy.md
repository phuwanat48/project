# คู่มือ Deploy — เว็บ Todo List

> เจ้าของไฟล์: devops | อ้างอิงจาก: `docs/03-architecture.md`, `docs/04-spec.md`
> แอปนี้เป็น **static client-side ล้วน** (index.html + styles.css + app.js) ไม่มี backend, ไม่มี database, ไม่มี build step — การ deploy จึงง่ายมาก: แค่ "เอา 3 ไฟล์ไปวางที่ที่ serve static ได้"

---

## 1. สรุปสิ่งที่ต้องรู้ก่อน deploy

| หัวข้อ | รายละเอียด |
|---|---|
| ไฟล์ที่ต้อง deploy | `index.html`, `styles.css`, `app.js` (3 ไฟล์เท่านั้น) |
| Environment variable | **ไม่มี** — แอปไม่ใช้ env var ใด ๆ ทั้งหมด (จึงไม่มีไฟล์ `.env.example` ในโปรเจกต์นี้) |
| Secret | **ไม่มี** — ไม่มี API key, ไม่มี network call |
| ข้อมูลผู้ใช้ | เก็บใน `localStorage` ของเบราว์เซอร์ผู้ใช้เท่านั้น — server ไม่เก็บอะไรเลย |
| เทส | `node tests/app.test.js` (ต้องมี Node.js 18+ แนะนำ 22) |
| Port ที่ image ใช้ | 8080 (nginx non-root) |

---

## 2. วิธีรันในเครื่อง (Local)

### 2.1 วิธีง่ายสุด: เปิดไฟล์ตรง ๆ
1. Double-click `index.html` (หรือลากเข้าเบราว์เซอร์)
2. ใช้งานได้เลย — แอปออกแบบให้เปิดผ่าน `file://` ได้ (script ใช้ `defer` ไม่ใช่ ES module)

> ข้อจำกัด: บางเบราว์เซอร์จำกัดฟีเจอร์บางอย่างบน `file://` ถ้าเจอปัญหาให้ใช้วิธี 2.2 แทน

### 2.2 Serve แบบ static (แนะนำ)
มี Python หรือ Node อยู่แล้วใช้ได้เลย ไม่ต้อง install อะไร:

```powershell
# ด้วย Python 3
python -m http.server 8080

# หรือด้วย Node (npx จะดาวน์โหลดให้อัตโนมัติครั้งแรก)
npx serve .
```

แล้วเปิด `http://localhost:8080`

### 2.3 รันเทสก่อน deploy เสมอ

```powershell
node tests/app.test.js
```

ถ้าขึ้น `RESULT: PASS` (หรือจบโดยไม่มี error) ถือว่าผ่าน — ถ้า fail ห้าม deploy

---

## 3. รันด้วย Docker

### 3.1 Build และรัน

```powershell
# build image (stage แรกจะรันเทสให้ก่อน — ถ้าเทสพัง build จะ fail)
docker build -t todo-list:latest .

# รัน container
docker run -d --name todo-list -p 8080:8080 todo-list:latest
```

เปิด `http://localhost:8080`

### 3.2 จุดเด่นของ image นี้
- **Multi-stage**: stage แรกรันเทสด้วย Node, stage สองเอาเฉพาะไฟล์ static ไปใส่ nginx → image เล็กและไม่ปล่อยโค้ดที่พังออกไป
- **Non-root**: ใช้ `nginxinc/nginx-unprivileged` รันด้วย user uid 101 ไม่ใช่ root (ความปลอดภัยดีกว่า)
- **Health check ในตัว**: ตรวจ `http://127.0.0.1:8080/` ทุก 30 วินาที

### 3.3 ตรวจสถานะ container

```powershell
docker ps                          # ดู STATUS ต้องขึ้น Up (healthy)
docker logs todo-list              # ดู log ของ nginx
docker stop todo-list && docker rm todo-list   # หยุดและลบ container
```

### 3.4 docker-compose (ถ้าต้องการ)
โปรเจกต์นี้มี service เดียว compose ไม่จำเป็น แต่ถ้าอยากใช้ สร้าง `docker-compose.yml` แบบนี้ได้:

```yaml
services:
  todo-list:
    build: .
    ports:
      - "8080:8080"
    restart: unless-stopped
```

รันด้วย `docker compose up -d` หยุดด้วย `docker compose down`

---

## 4. Deploy ฟรีบน GitHub Pages (แนะนำสำหรับโปรเจกต์นี้)

เหมาะที่สุดเพราะแอปเป็น static ล้วน ไม่ต้องมี server เอง:

1. Push โค้ดขึ้น GitHub (branch `main`)
2. ไปที่ **Settings → Pages**
3. ที่ **Source** เลือก `Deploy from a branch` → Branch: `main` / โฟลเดอร์: `/ (root)` → **Save**
4. รอ ~1 นาที เว็บจะอยู่ที่ `https://<username>.github.io/<repo>/`

> หมายเหตุ: GitHub Pages จะเผยแพร่ทุกไฟล์ใน repo รวมถึง `docs/` และ `tests/` — ไม่เป็นไรเพราะไม่มี secret ในโปรเจกต์นี้ แต่ถ้าไม่อยากให้เห็น ให้ deploy เฉพาะ 3 ไฟล์หลักไป branch แยก (เช่น `gh-pages`) แทน

ทางเลือกอื่นที่ใช้วิธีเดียวกัน (ลาก 3 ไฟล์ไปวาง): Netlify Drop, Cloudflare Pages, Vercel

---

## 5. CI/CD Pipeline

ไฟล์ `.github/workflows/ci.yml` ทำงานอัตโนมัติทุกครั้งที่ push ไป `main` หรือเปิด PR:

1. **test** — ตั้ง Node 22 แล้วรัน `node tests/app.test.js` (ไม่ต้อง npm install เพราะไม่มี dependency)
2. **docker-build** — (รันหลัง test ผ่านเท่านั้น) build Docker image แล้วทดสอบว่า container ตอบกลับหน้าเว็บได้จริง — **ไม่ push image ขึ้น registry**

Pipeline นี้ยังไม่ deploy อัตโนมัติ (deploy ด้วยตัวเองตามหัวข้อ 3–4) — ถ้าต้องการ deploy อัตโนมัติหลัง merge สามารถเพิ่ม job ที่ push image ขึ้น registry หรือ trigger GitHub Pages ได้ภายหลัง

---

## 6. Health Check

| สถานการณ์ | วิธีตรวจ |
|---|---|
| Docker | `docker ps` → STATUS ต้องเป็น `Up (healthy)` (HEALTHCHECK ใน Dockerfile ทำให้แล้ว) |
| เว็บขึ้นจริงไหม | `curl -fsS http://localhost:8080/` ต้องได้ HTML ที่มีคำว่า `Todo List` |
| GitHub Pages | เปิด URL ตรง ๆ แล้วเห็นหน้า Todo List + ลองเพิ่มรายการ 1 รายการแล้ว refresh ดูว่าข้อมูลคงอยู่ |

---

## 7. Rollback

สถานการณ์และวิธีกลับรุ่นเดิม:

- **Docker**: รัน image เวอร์ชันเก่าที่ tag ไว้ เช่น `docker run -d -p 8080:8080 todo-list:v1.0.0` — แนะนำ tag image ด้วยเวอร์ชัน/commit ทุกครั้งที่ build เพื่อ rollback ได้เร็ว
- **GitHub Pages**: ใช้ `git revert` หรือ reset branch `main` กลับ commit เดิมแล้ว push ใหม่ — Pages จะอัปเดตใน ~1 นาที
- **ข้อมูลผู้ใช้**: ไม่ต้องกังวล — ข้อมูลอยู่ใน localStorage ของเบราว์เซอร์ผู้ใช้ การ rollback server ไม่กระทบข้อมูลใด ๆ

---

## 8. Monitoring / Logging เบื้องต้น

แอป client-side ล้วน ไม่มี server-side state จึงไม่ต้องมีระบบ monitor ซับซ้อน:

- **Docker**: `docker logs -f todo-list` ดู access log ของ nginx แบบ real-time
- **GitHub Pages**: ดูสถานะ deploy ที่แท็บ **Actions** ของ repo
- **ประสบการณ์ผู้ใช้**: เปิด DevTools (F12) → แท็บ Console ต้องไม่มี error สีแดง; แท็บ Network ต้องโหลดสำเร็จทั้ง 3 ไฟล์ (200)
- แอปไม่ส่งข้อมูลออกนอกเครื่องผู้ใช้เลย (ไม่มี analytics, ไม่มี network call) — ตาม spec ข้อ 8.6

---

## 9. ปัญหาที่พบ

- **ไม่มีปัญหาที่ต้องแก้โค้ด** — โค้ดหลัก (index.html, styles.css, app.js) และเทสผ่านมาตรฐานพร้อม deploy แล้ว ไม่มีจุดที่ devops ต้องแตะ
- ข้อสังเกต: โปรเจกต์ไม่มี environment variable ใด ๆ จึงไม่มีความจำเป็นต้องมีไฟล์ `.env.example` (ระบุเหตุผลไว้ในหัวข้อ 1 แล้ว)
- ข้อสังเกต: ไม่มี lint step ใน CI เพราะโปรเจกต์ไม่มี dependency/tooling ด้าน lint ตาม spec ข้อ 1.2 — ถ้าอนาคตเพิ่ม ESLint ให้เติม step ใน `ci.yml` ได้เลย
