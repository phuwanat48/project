# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

- ผู้ใช้ทั่วไปที่ต้องการจดบันทึกสิ่งที่ต้องทำในชีวิตประจำวัน (personal to-do)
- คนที่ต้องการเครื่องมือง่าย ๆ ทันที — ไม่ต้องลงทะเบียน ไม่ต้อง login ไม่ต้องตั้งค่าอะไรก่อนใช้

## Product Purpose

เว็บแอป Todo List หน้าเดียว (single page) ใช้จดบันทึกสิ่งที่ต้องทำ: เพิ่มรายการ, ติ๊กว่าเสร็จแล้ว, แก้ไขข้อความ, ลบรายการเดียว และลบรายการที่เสร็จแล้วทั้งหมดในคลิกเดียว ข้อมูลคงอยู่หลังปิด/refresh ผ่าน localStorage ของเบราว์เซอร์ ความสำเร็จคือผู้ใช้จัดการรายการได้ครบ ("เพิ่ม → ติ๊ก → ลบ" ภายใน 3 คลิก ไม่ต้องเปิดเมนู) และข้อมูลไม่หายไปเอง

## Positioning

"เปิดใช้ได้ทันที ไม่มี friction" — ไม่มี account ไม่มี sync ไม่มีการตั้งค่า เปิดหน้าเว็บ (หรือไฟล์ `index.html` ตรง ๆ) แล้วใช้ได้เลย ต่างจาก Todo app ทั่วไปที่ต้องสมัครสมาชิกก่อน

## Operating Context

- ใช้งานในเบราว์เซอร์เดียวบนเครื่องเดียว — ไม่มี login ไม่มี sync ข้ามอุปกรณ์
- เปิดผ่าน `file://` ตรง ๆ ได้ หรือผ่าน static hosting (GitHub Pages, Netlify, Docker/nginx)
- ข้อมูลหายได้ถ้าผู้ใช้ล้างข้อมูลเบราว์เซอร์ — ส่วนหนึ่งของการใช้งานจริงที่ UI ต้องรับมือได้

## Capabilities and Constraints

- ฟีเจอร์: เพิ่ม (Enter หรือปุ่ม), ติ๊กเสร็จ/ยกเลิก, แก้ไขข้อความ (ปุ่มหรือ double-click), ลบรายการเดียว, ลบรายการที่เสร็จทั้งหมด, นับ "ค้าง/เสร็จแล้ว"
- ข้อจำกัดถาวร: client-only (HTML + CSS + Vanilla JS, ไม่มี backend/database/build step/dependency), เก็บข้อมูลใน localStorage ท้องถิ่นเท่านั้น
- ภาษา UI: ภาษาไทยโดยรวม โดย "hybrid" หมายถึงในหน้าเว็บสามารถมีไทยปนอังกฤษได้ตามธรรมชาติของการใช้งานจริง — ไม่ใช่กำกับข้อความสองภาษาคู่กันทุกป้าย (ผู้ใช้ยืนยันตีความนี้ ปรับจากเดิมที่ backlog เขียนไว้)
- การลบรายการที่เสร็จแล้วต้องมี modal ยืนยันเสมอ (ตามที่ implement ปัจจุบัน)
- Out of scope (ผู้ใช้ยืนยันแล้ว): filter ตามสถานะ, due date/reminder, tag/category, drag-and-drop, backend, login, sync, collaboration, PWA

## Evidence on Hand

- โค้ดจริงที่รันได้: `index.html`, `styles.css`, `app.js` (client-only 3 ไฟล์ ไม่มี dependency)
- เอกสารผลิตภัณฑ์ครบชุดใน `docs/`: backlog (US-001–US-007 พร้อม confirmed decisions), UX design, architecture, spec, security/QA report, deploy guide, user guide
- ชุดเทสที่รันได้ด้วย Node โดยตรง: `tests/app.test.js` (จบด้วย `RESULT: PASS`)
- ไม่มี: ลูกค้าจริง/ผู้ใช้จริงที่อ้างอิงได้, testimonial, benchmark, ข้อมูลการใช้งานเชิงสถิติ, โลโก้/ภาพกราฟิก — งานออกแบบห้ามแต่งสิ่งเหล่านี้ขึ้น

## Product Principles

1. **ความง่ายมาก่อน** — ทุกฟีเจอร์ใช้ได้ใน 3 คลิก ไม่มีเมนูซ่อน ไม่มีขั้นตอนเกิน
2. **Feedback ทันที** — ทุกการกระทำเห็นผลบนหน้าจอทันที ไม่มีloading state เพราะทำงานฝั่ง client ทั้งหมด
3. **ข้อมูลของผู้ใช้อยู่กับผู้ใช้** — ไม่รวบรวม ไม่ส่งข้อมูลออกนอกเบราว์เซอร์ คงความเป็น local-first เสมอ
4. **ความปลอดภัยไม่มีข้อยกเว้น** — ข้อความผู้ใช้แสดงผ่าน `textContent` เท่านั้น (กัน XSS) ไม่มีบริการภายนอก

## Accessibility & Inclusion

**ต้องผ่าน WCAG 2.1 AA** (ผู้ใช้ยืนยันเป็นข้อผูกพันของทั้งโปรเจกต์) ฐานเดิมที่มีอยู่: `aria-live` สำหรับ feedback/counter, label แบบ visually-hidden, modal มี `role="dialog"` + `aria-modal` งานออกแบบต่อไปต้องคงระดับนี้และตรวจกับ WCAG 2.1 AA
