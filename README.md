# Todo List — เว็บแอปจดสิ่งที่ต้องทำ

เว็บแอป Todo List แบบ single page ใช้งานง่าย: เพิ่มรายการ, ติ๊กว่าเสร็จแล้ว, แก้ไขข้อความ, ลบรายการ และลบรายการที่เสร็จแล้วทั้งหมดในคลิกเดียว ข้อมูลเก็บใน `localStorage` ของเบราว์เซอร์ ทำให้รายการคงอยู่หลังปิด/refresh หน้าเว็บ

**ลักษณะสำคัญ:**
- Static client-side ล้วน (HTML + CSS + Vanilla JavaScript) — ไม่มี backend, ไม่มี database, ไม่มี build step, ไม่มี dependency
- ไม่มีระบบ login / ไม่มีการ sync ข้ามอุปกรณ์ — ข้อมูลอยู่เฉพาะเบราว์เซอร์บนเครื่องนั้น
- ปลอดภัย: ข้อความผู้ใช้ทุกจุดแสดงผ่าน `textContent` เท่านั้น (กัน XSS)

## ฟีเจอร์

| ฟีเจอร์ | รายละเอียด |
|---|---|
| เพิ่มรายการ | พิมพ์ในช่อง input แล้วกดปุ่ม "เพิ่ม" หรือกด Enter — รายการใหม่อยู่ท้าย list |
| ติ๊กเสร็จแล้ว | คลิก checkbox — ข้อความขีดฆ่า + สีจาง, ติ๊กซ้ำเพื่อยกเลิกได้ |
| แก้ไขข้อความ | กดปุ่ม "แก้ไข" หรือ double-click ที่ข้อความ — Enter บันทึก, Esc ยกเลิก, คลิกที่อื่นบันทึกอัตโนมัติ |
| ลบรายการเดียว | กดปุ่ม "ลบ" — ลบทันที |
| ลบที่เสร็จแล้วทั้งหมด | กดปุ่ม "ลบรายการที่เสร็จแล้ว" — มี modal ยืนยันก่อนลบเสมอ (ปุ่ม disabled เมื่อไม่มีรายการเสร็จ) |
| นับจำนวน | แสดง "ค้าง: N" และ "เสร็จแล้ว: M" อัปเดตทันที |
| บันทึกอัตโนมัติ | ทุกการเปลี่ยนแปลงบันทึกลง localStorage ทันที คงอยู่หลัง refresh |

**นอกขอบเขต (ไม่มีในแอปนี้):** filter แสดงเฉพาะบางสถานะ, due date/reminder, tag, drag-and-drop, backend, login, sync ข้ามอุปกรณ์

## วิธีรัน (Windows)

### วิธีง่ายสุด
Double-click `index.html` เปิดในเบราว์เซอร์ได้เลย (แอปออกแบบให้เปิดผ่าน `file://` ได้)

### แบบ serve static (แนะนำ)
เปิด PowerShell ในโฟลเดอร์โปรเจกต์แล้วรัน:

```powershell
# ด้วย Python 3
python -m http.server 8080

# หรือด้วย Node
npx serve .
```

แล้วเปิด `http://localhost:8080`

### แบบ Docker

```powershell
docker build -t todo-list:latest .
docker run -d --name todo-list -p 8080:8080 todo-list:latest
```

เปิด `http://localhost:8080` — image รันเทสให้ก่อน build อัตโนมัติ ใช้ nginx non-root และมี health check ในตัว

## รันเทส

ต้องมี Node.js 18+ (แนะนำ 22):

```powershell
node tests/app.test.js
```

จบด้วย `RESULT: PASS` = ผ่าน รายละเอียดการ deploy เพิ่มเติมดู `docs/08-deploy.md`

## โครงสร้างไฟล์

```
project/
├── index.html          # โครงหน้าเว็บ (หน้าเดียว)
├── styles.css          # สไตล์ + responsive (<768px) + modal + shake animation
├── app.js              # logic ทั้งหมด: state, localStorage, render, event
├── tests/
│   ├── app.test.js     # เทส (รันด้วย node ตรง ๆ ไม่ต้อง npm install)
│   └── helpers/
│       └── stub-env.js # helper จำลอง DOM/localStorage สำหรับเทส
├── Dockerfile          # multi-stage: รันเทส → serve ด้วย nginx (port 8080)
├── .dockerignore
├── .github/workflows/ci.yml   # CI: รันเทส + build Docker ทุกครั้งที่ push
├── docs/               # เอกสารทั้งหมดของโปรเจกต์ (ดูตารางด้านล่าง)
├── AGENTS.md           # กติกาทีม AI agent (multi-agent workflow)
├── opencode.json       # ตั้งค่า OpenCode
└── .opencode/          # นิยาม agent แต่ละบทบาทของ OpenCode
```

## เอกสารเพิ่มเติม

| ไฟล์ | เนื้อหา |
|---|---|
| [docs/01-backlog.md](docs/01-backlog.md) | ฟีเจอร์และขอบเขต (user stories US-001–US-007) |
| [docs/02-ux.md](docs/02-ux.md) | การออกแบบหน้าจอและ user flow |
| [docs/03-architecture.md](docs/03-architecture.md) | สถาปัตยกรรมระบบ |
| [docs/04-spec.md](docs/04-spec.md) | สเปกซอฟต์แวร์ละเอียด |
| [docs/06-security-report.md](docs/06-security-report.md) | รายงานตรวจความปลอดภัย |
| [docs/07-qa-report.md](docs/07-qa-report.md) | รายงานผลตรวจ QA |
| [docs/08-deploy.md](docs/08-deploy.md) | คู่มือ deploy (Docker, GitHub Pages, CI/CD) |
| [docs/09-user-guide.md](docs/09-user-guide.md) | คู่มือการใช้งานสำหรับผู้ใช้ |
| [docs/09-dev-guide.md](docs/09-dev-guide.md) | คู่มือสำหรับนักพัฒนา |
