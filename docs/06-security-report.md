# รายงานตรวจความปลอดภัย (Security Report)

> เจ้าของไฟล์: security | วันที่ตรวจ: 2026-10-30
> ขอบเขต: `index.html`, `styles.css`, `app.js` (static client-side ล้วน)
> อ้างอิงข้อกำหนดความปลอดภัย: `docs/04-spec.md` หัวข้อ 8 และ 4.3

---

## 1. สรุปภาพรวม

แอปเป็น Todo List ฝั่ง client ล้วน ไม่มี backend, ไม่มี network call, ไม่มี dependency, ไม่มี third-party script ตาม spec ข้อ 1.3 ผลการตรวจพบว่าโค้ดปฏิบัติตามข้อกำหนดความปลอดภัยใน spec หัวข้อ 8 ได้ครบทุกข้อ:

- **ไม่พบ XSS**: ไม่มี `innerHTML`, `insertAdjacentHTML`, `document.write` แม้แต่จุดเดียว (grep ยืนยัน) — ข้อความผู้ใช้ทุกจุดตั้งผ่าน `textContent` หรือ property ที่ปลอดภัย (`input.value`, `dataset.id`)
- **validate localStorage ครบ**: `load()` (app.js:50–66) ทำตามข้อ 4.3 ครบทุกขั้น — try/catch รอบ `getItem` และ `JSON.parse`, เช็ค `Array.isArray`, กรอง item ด้วย `validateTodos()` (app.js:202–218) ตรวจ type ของ `id`/`text`/`done` ทุก field ก่อนใช้ และสร้าง object ใหม่เฉพาะ field ที่รู้จัก (ไม่ spread object ดิบ)
- **ไม่พบ prototype pollution**: `validateTodos()` สร้าง object ใหม่ด้วย literal ที่มี key คงที่ ไม่มีการ merge/spread ข้อมูลดิบจาก localStorage เข้าสู่ object
- **ไม่พบ secret/API key/รหัสผ่าน** ในโค้ด
- **ไม่พบการ leak ข้อมูลอ่อนไหว**: `catch` ทุกจุดไม่แสดง stack trace หรือรายละเอียด error ภายใน แสดงเฉพาะข้อความ generic ตาม spec
- **ไม่มี file upload / path traversal / SQL / command injection** (ไม่มี surface ดังกล่าวในแอป client ล้วน)
- **CSS**: ไม่มี `url()` ชี้ external resource (มีเพียง `data:` URI SVG ที่ hardcode — ปลอดภัย)

พบเพียงข้อสังเกตระดับ **Low/Info** จำนวน 3 รายการ (ไม่บังคับแก้) รายละเอียดด้านล่าง

---

## 2. รายการข้อค้นพบ

### 2.1 [Info] การ render ข้อความผู้ใช้ปลอดภัย — ยืนยันว่าไม่มี XSS

- **ไฟล์:บรรทัด:** `app.js:230, 234, 255, 272, 290, 295, 302–303, 312, 317`
- **รายละเอียด:** ตรวจครบทุกจุดที่ข้อความผู้ใช้ (todo text) ไหลเข้า DOM:
  - `text.textContent = todo.text` (app.js:272) — แสดงเป็นข้อความธรรมดาเสมอ แม้ใส่ `<img src=x onerror=alert(1)>` ก็ไม่ execute (ตรง edge case ข้อ 9.9)
  - `input.value = todo.text` (app.js:255) — ตั้งผ่าน property ไม่ใช่ attribute string
  - `li.dataset.id = todo.id` (app.js:247) — ใส่ผ่าน dataset ตาม spec ข้อ 8.3 ไม่ประกอบเป็น HTML string
  - `setAttribute("aria-label", ...)` (app.js:256, 267) — `setAttribute` ไม่ parse HTML จึงไม่มี attribute injection
  - ล้าง list ด้วย `els.list.textContent = ""` (app.js:230) — วิธีที่ปลอดภัย
  - ไม่มี event handler ถูกประกอบจาก string (ไม่มี `onclick="..."` แบบ inline, ไม่มี `new Function`, ไม่มี `eval`) — event ทั้งหมดผูกด้วย `addEventListener` + event delegation (app.js:550–563)
- **สรุป:** ไม่มีช่องโหว่ ไม่ต้องแก้

### 2.2 [Info] การ validate ข้อมูลจาก localStorage ครบตาม spec

- **ไฟล์:บรรทัด:** `app.js:50–66 (load), 202–218 (validateTodos)`
- **รายละเอียด:** ตรวจครบตามข้อ 4.3: storage throw → `[]`, `null` → `[]`, parse fail → `[]`, ไม่ใช่ array → `[]`, กรอง item ที่ type ผิดทิ้ง (`typeof item !== "object"`, `id`/`text` ต้องเป็น string ไม่ว่าง, `done` ต้องเป็น boolean), `text` trim ก่อนใช้ และสร้าง object ใหม่เฉพาะ 4 field ที่รู้จัก — ข้อมูลเสียหายไม่สามารถหลุดเข้า state ได้ ไม่มีการนำ JSON ดิบไปใช้ตรง ๆ
- **สรุป:** ไม่มีช่องโหว่ ไม่ต้องแก้

### 2.3 [Info] การจัดการ exception ไม่ leak ข้อมูล

- **ไฟล์:บรรทัด:** `app.js:52–56, 59–63, 68–76`
- **รายละเอียด:** `try/catch` ทุกจุดที่แตะ localStorage ตาม spec ข้อ 8.5 ทุก catch กลืน error เงียบ ๆ หรือแสดงข้อความ generic (`MSG.saveFailed`) ไม่มีการ log หรือแสดง `error.message`/stack ให้ผู้ใช้ — ไม่มีทาง leak รายละเอียดภายใน
- **สรุป:** ไม่มีช่องโหว่ ไม่ต้องแก้

### 2.4 [Low] ไม่มี Content Security Policy (CSP)

- **ไฟล์:บรรทัด:** `index.html:3–10` (ส่วน `<head>`)
- **รายละเอียด:** ไม่มี `<meta http-equiv="Content-Security-Policy">` แอปนี้ไม่มี external resource และไม่มีจุด inject HTML เลย จึงไม่มีช่องโหว่จริงในปัจจุบัน แต่ CSP เป็นชั้นป้องกัน (defense-in-depth) ที่ช่วยกัน regression ในอนาคตถ้ามีคนแก้โค้ดไปใช้ innerHTML ข้อจำกัด: เปิดผ่าน `file://` ตาม spec ทำให้ CSP บาง directive ใช้ได้จำกัด
- **วิธีแก้ที่แนะนำ (ไม่บังคับ):** เพิ่ม `<meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src 'self'; script-src 'self'; img-src 'self' data:">` ใน `<head>` — ต้องทดสอบว่ายังเปิดผ่าน `file://` ได้ตาม spec ข้อ 11.9 ก่อน merge
- **หมายเหตุ:** ถ้า deploy บน static hosting ที่ตั้ง HTTP header ได้ ควรตั้ง CSP ที่ header แทน meta tag

### 2.5 [Low] ไม่มีการจำกัดความยาวข้อความ (input length)

- **ไฟล์:บรรทัด:** `app.js:94–113 (addTodo), 197–199 (sanitizeText)`
- **รายละเอียด:** `sanitizeText` รับ string ยาวเท่าใดก็ได้ ผู้ใช้สามารถ paste ข้อความหลาย MB แล้วถูก persist ลง localStorage จนอาจชน quota (ซึ่งแอปรับมือไว้แล้วด้วย `showFeedback` ที่ app.js:74) หรือทำให้ render ช้า — เป็นปัญหา usability/DoS ต่อตัวผู้ใช้เองเท่านั้น ไม่กระทบผู้อื่น (ไม่มี backend) จึงไม่ใช่ช่องโหว่จริง
- **วิธีแก้ที่แนะนำ (ไม่บังคับ):** กำหนด `maxlength` ที่ `<input id="todo-input">` (เช่น 500) และ/หรือตัดความยาวใน `sanitizeText` — ควรปรึกษา pm/ux ก่อนเพราะกระทบ UX

### 2.6 [Info] id generator fallback ใช้ `Math.random()`

- **ไฟล์:บรรทัด:** `app.js:85–90 (genId)`
- **รายละเอียด:** fallback เมื่อไม่มี `crypto.randomUUID()` ใช้ `Date.now() + Math.random()` ซึ่งไม่ใช่ CSPRNG แต่ id นี้ใช้เพื่อระบุรายการใน client เดียวกันเท่านั้น ไม่มีผลต่อ authorization หรือความปลอดภัยใด ๆ (ไม่มี backend, ไม่มี session) จึงเป็นเพียงข้อสังเกต และตรงตาม spec ข้อ 4.1 ที่กำหนด fallback นี้ไว้แล้ว
- **สรุป:** ไม่มีช่องโหว่ ไม่ต้องแก้

---

## 3. สิ่งที่ตรวจแล้วไม่พบ (สรุปเชิงปริมาณ)

| หมวดตรวจ | ผล |
|---|---|
| XSS (innerHTML / insertAdjacentHTML / document.write / eval / new Function) | ไม่พบ (grep 0 match) |
| Attribute injection / event handler injection | ไม่พบ (ใช้ setAttribute/addEventListener เท่านั้น) |
| localStorage validation ก่อนใช้ | ครบตาม spec ข้อ 4.3 |
| Prototype pollution | ไม่มีจุดเสี่ยง (ไม่มี spread/merge ข้อมูลดิบ) |
| Secret/API key/รหัสผ่านในโค้ด | ไม่พบ |
| Dependency ที่มีช่องโหว่ | ไม่มี dependency (vanilla JS ล้วน) |
| CORS / cookie / network call | ไม่มี surface (client ล้วน ไม่มี fetch/XHR) |
| ข้อมูลอ่อนไหวรั่วใน log/error | ไม่พบ (catch ทุกจุดแสดงข้อความ generic) |
| File upload / path traversal / SQL / command injection | ไม่มี surface |
| External resource ใน CSS/HTML | ไม่มี (มีเพียง data: URI SVG hardcode) |

---

## 4. สรุป

ไม่พบช่องโหว่ระดับ Critical/High/Medium โค้ดปฏิบัติตามข้อกำหนดความปลอดภัยใน `docs/04-spec.md` หัวข้อ 8 ครบทั้ง 7 ข้อ มีเพียงข้อเสนอแนะเชิงป้องกันระดับ Low/Info (ข้อ 2.4, 2.5) ที่ dev เลือกแก้ได้ตามความเหมาะสม ไม่บังคับ

---

## 5. ตรวจซ้ำรอบที่ 2 (2026-10-31) — หลัง dev แก้ a11y 2 จุดใน app.js

ขอบเขตรอบนี้: เฉพาะการเปลี่ยนแปลงใหม่ 2 จุด พร้อมยืนยันว่าข้อสรุปเดิม (หัวข้อ 1–4) ยังคงถูกต้อง

### 5.1 การแก้ O-1: `confirmModalAction` focus ไปที่ todo-input เมื่อปุ่ม clear disabled

- **ไฟล์:บรรทัด:** `app.js:174–185`
- **ผลตรวจ:**
  - โค้ดใหม่เป็นเพียงการเรียก `els.todoInput.focus()` ตามเงื่อนไข `els.clearBtn.disabled` — ไม่มีการสร้าง/แก้ DOM ด้วย string, ไม่มี `innerHTML`, ไม่มีการอ้างอิง element จากข้อมูลผู้ใช้ (`todo-input` เป็น static ref จาก `getElementById` ตอน init)
  - ลำดับการทำงานปลอดภัย: `closeConfirmModal()` คืน focus ตามปกติก่อน แล้วจึงย้ายไป `todo-input` ถ้าปุ่ม disabled — ไม่มีผลต่อ state หรือ persistence
  - ไม่มี event handler ใหม่, ไม่มีข้อมูลผู้ใช้เข้าเกี่ยวข้องใน path นี้
- **สรุป:** ไม่แนะนำช่องโหว่ใหม่

### 5.2 การแก้ O-2: Esc ในโหมดแก้ไขเรียก `cancelEditing(li)`

- **ไฟล์:บรรทัด:** `app.js:408–422 (cancelEditing), 507–514 (onListKeydown)`
- **ผลตรวจ:**
  - `cancelEditing` สร้างแถวใหม่ผ่าน `createTodoItem(todo)` เท่านั้น ซึ่งใช้ `createElement` + `textContent` + `dataset` + `setAttribute` ทั้งหมด (ยืนยันแล้วในข้อ 2.1 รอบก่อน) — ไม่มี HTML string, ไม่มี XSS surface ใหม่จาก in-place `replaceWith`
  - `todo` มาจาก `state.todos` ซึ่งผ่าน `validateTodos()` ตอน `load()` แล้ว — ไม่มีข้อมูลดิบจาก localStorage หลุดเข้า DOM
  - ลำดับ `state.editingId = null` ก่อน `replaceWith` ทำให้ `onListFocusout` (app.js:519–529) ไม่บันทึกซ้ำจาก blur ที่ตามมา — พฤติกรรมตรงกับปุ่มยกเลิก ไม่มี state inconsistency ที่นำไปสู่ช่องโหว่
  - focus คืนที่ `.btn-edit` ของแถวเดิม — element ที่สร้างเองในฟังก์ชันเดียวกัน ไม่มีการอ้างอิง element ที่ผู้ใช้ควบคุมได้
  - ไม่มี event handler ใหม่ถูกผูก (ยังใช้ event delegation เดิม)
- **สรุป:** ไม่แนะนำช่องโหว่ใหม่

### 5.3 ยืนยันข้อสรุปเดิม

- grep ซ้ำ `innerHTML|insertAdjacentHTML|document.write|eval|new Function` → 0 match
- ข้อสังเกตเดิม 2.4 (CSP) และ 2.5 (input length) ยังคงเป็น Low/Info เช่นเดิม ไม่มีอะไรเปลี่ยน
- ไม่พบช่องโหว่ระดับ Critical/High/Medium ทั้งรอบแรกและรอบนี้

RESULT: PASS
