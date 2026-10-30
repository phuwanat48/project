# Technical Spec — เว็บ Todo List

> เจ้าของไฟล์: sa (System Analyst) | อ้างอิงจาก: `docs/01-backlog.md`, `docs/02-ux.md`, `docs/03-architecture.md`
> วัตถุประสงค์: ให้ dev นำไปเขียนโค้ดได้ทันทีโดยไม่ต้องเดา

---

## 1. สรุปขอบเขตและ Tech Stack (ยืนยันแล้ว)

### 1.1 ขอบเขต
- เว็บแอป Todo List ฝั่ง client ล้วน — **Single Page** หน้าเดียว
- ฟีเจอร์: เพิ่ม (US-001), ลบ (US-002), ติ๊กเสร็จ (US-003), persist ผ่าน localStorage (US-004), แก้ไขข้อความ (US-005), ลบรายการที่เสร็จแล้วทั้งหมด (US-006), นับจำนวนค้าง/เสร็จ (US-007) — ทุกฟีเจอร์ priority **Must**
- ข้อมูลเก็บใน `localStorage` ของเบราว์เซอร์เท่านั้น

### 1.2 Out of Scope (ห้าม implement)
- Backend, database, API, network call ใด ๆ
- ระบบสมาชิก / login
- **Filter** (แสดงเฉพาะยังไม่เสร็จ/เสร็จแล้ว) — ผู้ใช้ยืนยันไม่ทำ ห้ามสร้างปุ่ม filter ขึ้นมาแม้แต่ปุ่มเดียว
- Sync ข้ามอุปกรณ์, drag-and-drop, due date, tag, PWA
- ปุ่ม/ตัวสลับภาษา (i18n switcher)

### 1.3 Tech Stack (จาก architecture — ห้ามเปลี่ยนโดยไม่แจ้ง sa)
| ส่วน | ค่า |
|---|---|
| ภาษา | HTML5 + CSS3 + Vanilla JavaScript (ES2020+) |
| Framework | ไม่ใช้ — ไม่มี build step, ไม่มี node_modules, ไม่มี dependency |
| Storage | `localStorage` key เดียว: `todoapp.todos.v1` |
| ไฟล์ | 3 ไฟล์ static: `index.html`, `styles.css`, `app.js` |
| การโหลด script | `<script src="app.js" defer>` — **ไม่ใช้ ES modules** เพื่อให้เปิดผ่าน `file://` ได้ |
| เบราว์เซอร์เป้าหมาย | Chrome, Edge, Firefox, Safari เวอร์ชันล่าสุด |

---

## 2. ข้อขัดแย้งที่พบและการตัดสิน (สำคัญ — dev ต้องอ่าน)

| # | จุดขัดแย้ง | เอกสารต้นทาง | การตัดสิน (ผู้ใช้ยืนยันแล้ว) |
|---|---|---|---|
| C-1 | **clearCompleted มี confirmation หรือไม่** | `02-ux.md` ข้อ 2.3 เลือก "ไม่มี confirmation, ลบทันที" | **ต้องมี confirmation dialog ก่อนลบเสมอ โดยใช้ custom modal (ห้ามใช้ `window.confirm()`)** — ผู้ใช้ยืนยันแล้ว ให้ทำตามข้อกำหนดนี้ (ดู T-008) |
| C-2 | **รูปแบบภาษา UI** | `02-ux.md` หัวข้อ 5 และ `01-backlog.md` ข้อ 89/94 เสนอ "label สองภาษาคู่กัน" เช่น `เพิ่ม / Add` | **Override ทั้งสองไฟล์** — ใช้แบบ "ปนกันตามธรรมชาติ": ศัพท์เทคนิค/คำที่ควรเป็นอังกฤษให้เป็นอังกฤษ ส่วนอื่นใช้ไทย **ไม่แสดงสองภาษาคู่กัน ไม่มีปุ่มสลับภาษา** (ดูหัวข้อ 5) |
| C-3 | **Counter แสดงกี่ตัวเลข** | `01-backlog.md` US-007 ระบุ "และ/หรือ" | แสดง **ทั้งสองตัวเลข** (ค้าง + เสร็จแล้ว) — ผู้ใช้ยืนยันแล้ว ตรงกับที่ `02-ux.md` เสนอ |
| C-4 | **สลับไปแก้รายการอื่นขณะแก้ไขอยู่** | `02-ux.md` ข้อ 2.2 แนะนำ "บันทึกอัตโนมัติถ้าข้อความไม่ว่าง" แต่ระบุว่ายังไม่มีข้อกำหนดชัดเจน | **บันทึกอัตโนมัติเมื่อสลับไปแก้รายการอื่น** — ผู้ใช้ยืนยันแล้ว (รายละเอียด edge case ดูข้อ 9.4) |

---

## 3. โครงสร้างไฟล์โปรเจกต์และหน้าที่

```
project/
├── index.html      # โครงสร้าง DOM ทั้งหมด (form, list, counter, ปุ่ม clear) — ไม่มี logic
├── styles.css      # สไตล์ทั้งหมด: layout, responsive, สถานะ .done/.editing/.shake, a11y (focus ring, visually-hidden)
├── app.js          # logic ทั้งหมด: state, load/save, validation, event handlers, render
└── docs/           # เอกสารทีม (ไม่เกี่ยวกับ runtime)
```

### 3.1 หน้าที่รายไฟล์

**`index.html`** — โครงสร้างตามลำดับนี้ (id ต้องตรงตาม spec เพราะ `app.js` อ้างอิง):
1. `<h1>` หัวเรื่อง
2. `<form id="add-form">` ครอบ `<input id="todo-input" type="text">` + `<button type="submit" id="add-btn">` (ใช้ form เพื่อให้ Enter และปุ่ม submit ทำงานในกลไกเดียว)
3. `<p id="feedback" role="status" aria-live="polite">` — พื้นที่ข้อความแจ้ง (ว่างไว้ default)
4. `<ul id="todo-list">` — ตัว list (dev สร้าง `<li>` ด้วย JS เท่านั้น ห้าม hardcode รายการใน HTML)
5. `<div id="status-bar">` — `<span id="count-pending">`, `<span id="count-done">` (ครอบด้วย element ที่มี `aria-live="polite"`) + `<button id="clear-completed-btn">`
6. Empty state แสดงภายในพื้นที่ `#todo-list` โดย JS (ไม่ต้องมี element แยกใน HTML)
7. `<label for="todo-input">` ต้องมีเสมอ (ซ่อนด้วย class `visually-hidden` ได้ แต่ห้ามละ)

**`styles.css`** — ต้องมี class สถานะเหล่านี้:
- `.done` — ขีดฆ่า (`text-decoration: line-through`) + สีจางลง กับข้อความในแถว
- `.editing` — สไตล์แถวที่อยู่โหมดแก้ไข (ซ่อนปุ่มแก้ไข/ลบ, แสดงปุ่มบันทึก/ยกเลิก)
- `.shake` — animation สั่น ~250ms สำหรับ input ตอน validation ล้มเหลว (ต้องเคารพ `prefers-reduced-motion: reduce` → ปิด animation)
- `.visually-hidden` — ซ่อนแบบ screen reader ยังอ่านได้
- `.error` — สีแดง/สีเตือนของข้อความ feedback
- Breakpoint: `@media (max-width: 767px)` สำหรับมือถือ (ดูหัวข้อ 6.3)

**`app.js`** — โครงสร้างภายใน (ลำดับตามนี้เพื่อให้ตรวจสอบง่าย):
1. Constants (`STORAGE_KEY`, template ข้อความ UI)
2. State (`state = { todos: [], editingId: null }`)
3. Persistence (`load`, `save`, `commit`)
4. Actions (`addTodo`, `deleteTodo`, `toggleTodo`, `editTodo`, `clearCompleted`)
5. Validation helpers (`sanitizeText`, `validateTodos`)
6. Render (`render`, `renderList`, `renderCounter`, `renderClearButton`, `showFeedback`)
7. Event wiring (ทั้งหมดอยู่ใน init ที่รันหลัง `DOMContentLoaded`)

---

## 4. Data Model และ localStorage Schema

### 4.1 Todo object
| Field | Type | กฎ |
|---|---|---|
| `id` | `string` | ไม่ซ้ำ — ใช้ `crypto.randomUUID()`; ถ้าไม่มี (เบราว์เซอร์เก่ามาก) fallback เป็น `Date.now().toString(36) + Math.random().toString(36).slice(2)` |
| `text` | `string` | **trim แล้ว** ต้องไม่ว่าง |
| `done` | `boolean` | default `false` |
| `createdAt` | `string` (ISO 8601) | `new Date().toISOString()` ตอนสร้าง — ใช้รักษาลำดับ |

ตัวอย่าง:
```json
{ "id": "3f2a...", "text": "ซื้อข้าวเย็น", "done": false, "createdAt": "2026-10-30T08:00:00.000Z" }
```

### 4.2 localStorage
- **Key:** `todoapp.todos.v1` (ห้ามเปลี่ยน — มี version suffix ไว้ต่อยอด)
- **Value:** `JSON.stringify(array)` — array เรียงตามลำดับที่ผู้ใช้เพิ่ม (เก่าสุด index 0, ใหม่สุดท้าย) รายการใหม่ **push ต่อท้ายเสมอ**

### 4.3 `load()` — การอ่านและรับมือข้อมูลเสียหาย (US-004)
ลำดับขั้นตอน (ห้ามข้าม):
1. `localStorage.getItem(STORAGE_KEY)` อยู่ใน `try/catch` — ถ้า throw (storage ถูกปิด เช่น private mode) → คืน `[]`
2. ได้ `null` (ครั้งแรก) → คืน `[]` — **ไม่แสดง error**
3. `JSON.parse` อยู่ใน `try/catch` — parse ล้มเหลว → คืน `[]` (ไม่ crash)
4. ผลลัพธ์ไม่ใช่ `Array` → คืน `[]`
5. กรอง (filter) เฉพาะ item ที่ผ่านเงื่อนไขครบทุกข้อ:
   - เป็น object ที่ไม่ใช่ `null`
   - `typeof id === "string"` และไม่ว่าง
   - `typeof text === "string"` และ `text.trim() !== ""`
   - `typeof done === "boolean"`
   - `createdAt` ไม่บังคับ — ถ้าไม่มี/ผิด type ให้เติม `""` แล้วเก็บ item ไว้ (ไม่ทิ้ง)
6. `text` ทุก item ต้อง `trim()` ก่อนใช้
7. หลักการ: **ไม่พยายามซ่อมข้อมูลเสีย** — fail-safe เป็น list ว่าง แอปทำงานต่อได้ปกติ

### 4.4 `save()` — การเขียน
- `localStorage.setItem(STORAGE_KEY, JSON.stringify(state.todos))` อยู่ใน `try/catch`
- ถ้าเขียนไม่สำเร็จ (quota เต็ม / storage ถูก block): **ไม่ crash** — แสดงข้อความเตือนผ่าน `showFeedback()` เช่น "บันทึกไม่สำเร็จ — ข้อมูลจะหายเมื่อปิดหน้านี้" และแอปยังใช้งานได้ใน session เดียว (state ใน memory ยังถูกต้อง)

### 4.5 `commit()`
ทุก action ที่แก้ `state.todos` ต้องจบด้วย `commit()` ซึ่งทำ: `save()` → `render()` ตามลำดับเสมอ (single source of truth คือ `state.todos`)

---

## 5. ข้อกำหนดภาษา UI (Override เอกสาร UX — ผู้ใช้ยืนยันแล้ว)

**กฎ:** แบบ "ปนกันตามธรรมชาติ" — ศัพท์เทคนิค/คำที่ควรเป็นอังกฤษให้เป็นอังกฤษ ส่วนอื่นใช้ไทย ไม่แสดงสองภาษาคู่กัน ไม่มีปุ่มสลับภาษา ไม่ต้องใช้ i18n framework (hardcode ใน HTML/JS ได้)

| องค์ประกอบ | ข้อความที่แสดง (ตรงตามนี้) |
|---|---|
| หัวเรื่อง h1 | `Todo List` (ศัพท์เทคนิค — อังกฤษ) |
| Label ช่อง input (visually-hidden) | `สิ่งที่ต้องทำ` |
| Placeholder ช่อง input | `พิมพ์สิ่งที่ต้องทำ…` |
| ปุ่มเพิ่ม | `เพิ่ม` |
| ปุ่มแก้ไข (desktop) | `แก้ไข` (มือถือ: icon ✎ + aria-label `แก้ไขรายการนี้`) |
| ปุ่มลบ (desktop) | `ลบ` (มือถือ: icon 🗑 + aria-label `ลบรายการนี้`) |
| ปุ่มบันทึก (โหมดแก้ไข) | `บันทึก` |
| ปุ่มยกเลิก (โหมดแก้ไข) | `ยกเลิก` |
| Counter | `ค้าง: N` และ `เสร็จแล้ว: M` |
| ปุ่ม clear completed | `ลบรายการที่เสร็จแล้ว` |
| Empty state | `ยังไม่มีรายการ — เริ่มพิมพ์ด้านบนได้เลย` |
| Feedback input ว่าง | `กรุณาพิมพ์สิ่งที่ต้องทำ` |
| Feedback แก้ไขเป็นค่าว่าง | `กรุณาพิมพ์สิ่งที่ต้องทำ` (ข้อความเดียวกัน) |
| Confirmation dialog (clear completed) | `ต้องการลบรายการที่เสร็จแล้ว N รายการหรือไม่?` (N = จำนวนจริง) |
| Feedback save ไม่สำเร็จ | `บันทึกไม่สำเร็จ — ข้อมูลจะหายเมื่อปิดหน้านี้` |
| aria-label checkbox | `ทำเครื่องหมายว่าเสร็จแล้ว: {ข้อความรายการ}` |

หมายเหตุ: ข้อความของรายการ todo เป็นของผู้ใช้พิมพ์เอง — ระบบไม่บังคับภาษา

---

## 6. ข้อกำหนด UI (ตาม `02-ux.md`)

### 6.1 Layout (Single Page)
ลำดับบนจอ: หัวเรื่อง h1 → แถว input + ปุ่มเพิ่ม → พื้นที่ feedback (แสดงเมื่อมีข้อผิดพลาดเท่านั้น) → list รายการ → แถบสถานะ (counter + ปุ่ม clear completed แถวเดียวกัน)
- Desktop: คอนเทนต์ `max-width: ~600px` กึ่งกลางหน้า
- ไม่มี navigation, ไม่มี modal ยกเว้น confirmation ของ clear completed (ข้อ C-1)

### 6.2 สถานะที่ต้อง implement ครบ
| สถานะ | พฤติกรรม |
|---|---|
| Empty state | ไม่มีรายการ (ครั้งแรก / ลบจนหมด / ข้อมูลเสียหาย) → แสดงข้อความ "ยังไม่มีรายการ — เริ่มพิมพ์ด้านบนได้เลย" กลางพื้นที่ list ไม่แสดง error |
| แถวปกติ (ยังไม่เสร็จ) | checkbox ว่าง, ข้อความปกติ, ปุ่มแก้ไข/ลบมองเห็นชัด |
| แถวเสร็จแล้ว | checkbox ติ๊ก, ข้อความ **ขีดฆ่า + สีจาง** (class `.done`), ปุ่มแก้ไข/ลบยังใช้ได้ |
| โหมดแก้ไข | ข้อความกลายเป็น `<input type="text">` มีข้อความเดิมข้างใน, **focus + select อัตโนมัติ**, ซ่อนปุ่มแก้ไข/ลบ, แสดงปุ่มบันทึก/ยกเลิก (class `.editing`) |
| Input ว่างกดเพิ่ม | ไม่เพิ่มรายการ + (1) input สั่น `.shake` (2) ข้อความ `กรุณาพิมพ์สิ่งที่ต้องทำ` สีแดงใต้ input (3) focus กลับที่ input |
| แก้ไขเป็นค่าว่าง | ไม่บันทึก + shake ที่ input ในแถวนั้น + ข้อความแจ้งเดียวกัน + **ยังอยู่ในโหมดแก้ไข** |
| Loading / Error จากระบบ | **ไม่มี** — ทำงาน client ล้วน ไม่มี network |

### 6.3 Responsive
| Breakpoint | Layout |
|---|---|
| ≥ 768px | input + ปุ่มเพิ่มแถวเดียวกัน, ปุ่มแก้ไข/ลบแสดงข้อความ |
| < 768px | ปุ่มเพิ่มอยู่แถวใหม่ใต้ input เต็มความกว้าง, ปุ่มแก้ไข/ลบย่อเป็น icon-only (✎ / 🗑) + aria-label, แถบสถานะ + ปุ่ม clear เรียงซ้อนได้ |
| ทุกขนาด | touch target ≥ 44×44px บนมือถือ, ระยะห่างปุ่มในแถวเดียวกัน ≥ 8px |

### 6.4 Accessibility (บังคับ)
- `<label>` ผูกกับ input เสมอ (ซ่อนด้วย `visually-hidden` ได้) — ห้ามใช้ placeholder เป็น label เดียว
- list: `<ul>` (role="list" โดย default) / แถวเป็น `<li>` (role="listitem" โดย default)
- checkbox เป็น `<input type="checkbox">` จริง พร้อม `aria-label` ตามตารางหัวข้อ 5
- ข้อความ feedback: `role="status"` + `aria-live="polite"`
- counter: `aria-live="polite"`
- ปุ่ม disabled ใช้ attribute `disabled` จริง
- คีย์บอร์ด: **Enter** ใน input หลัก = เพิ่ม (ผ่าน form submit), **Enter** ในโหมดแก้ไข = บันทึก, **Esc** ในโหมดแก้ไข = ยกเลิก, Tab เลื่อนได้ครบตามลำดับ: input → ปุ่มเพิ่ม → checkbox → ปุ่มแก้ไข → ปุ่มลบ (ทุกแถว) → ปุ่ม clear
- ปุ่มทุกปุ่มเป็น `<button>` จริง (ห้ามใช้ `<div>`/`<span>` ทำปุ่ม)
- สถานะเสร็จต้องไม่พึ่งสีอย่างเดียว (ขีดฆ่า + checkbox ช่วย), คอนทราสต์ข้อความ ≥ 4.5:1
- ทุก element ที่ focus ได้ต้องมี focus ring ชัดเจน
- เคารพ `prefers-reduced-motion` (ปิด shake)

---

## 7. สเปกฟังก์ชัน (Signature Level)

```js
// ---- State ----
const state = { todos: [], editingId: null };  // editingId: string | null (ไม่ persist)

// ---- Persistence ----
function load(): Todo[]            // ตามข้อ 4.3
function save(): void              // ตามข้อ 4.4, try/catch
function commit(): void            // save() → render()

// ---- Actions (ทุกตัวจบด้วย commit()) ----
function addTodo(rawText: string): void
  // trim → ถ้าว่าง: showFeedback + shake + focus input + return (ไม่แก้ state)
  // ถ้ามีข้อความ: push { id, text: trimmed, done: false, createdAt } ต่อท้าย → commit()
  // เคลียร์ input + feedback เดิม

function deleteTodo(id: string): void
  // state.todos = state.todos.filter(t => t.id !== id)
  // ถ้า editingId === id → editingId = null
  // → commit()

function toggleTodo(id: string): void
  // หา item ด้วย id → t.done = !t.done → commit()

function editTodo(id: string, rawText: string): boolean
  // trim → ถ้าว่าง: return false (caller จัดการ feedback, ไม่แก้ state)
  // ถ้ามีข้อความ: หา item ด้วย id → t.text = trimmed → editingId = null → commit() → return true

function clearCompleted(): void
  // เรียกได้เฉพาะเมื่อมี done ≥ 1 (ปุ่ม disabled กันไว้แล้ว)
  // แสดง confirmation ก่อน (ดู T-008) — ถ้าผู้ใช้ยกเลิก: return โดยไม่แก้ state
  // ยืนยัน: state.todos = state.todos.filter(t => !t.done) → editingId = null → commit()

// ---- Render ----
function render(): void            // renderList() + renderCounter() + renderClearButton() + จัดการ empty state
function showFeedback(message: string): void  // ตั้ง textContent ที่ #feedback + class .error
function clearFeedback(): void

// ---- Init ----
// DOMContentLoaded → state.todos = load() → wire events → render()
```

### 7.1 Event Handling (กำหนดกลไกชัดเจน)
| เหตุการณ์ | กลไก |
|---|---|
| กดปุ่มเพิ่ม / Enter ใน input | `submit` ของ `<form id="add-form">` + `event.preventDefault()` — ครอบคลุมทั้งปุ่มและ Enter ในกลไกเดียว |
| checkbox / ปุ่มลบ / ปุ่มแก้ไข / double-click ข้อความ | **Event delegation บน `<ul id="todo-list">`** — ฟัง `change` (checkbox), `click` (ปุ่มลบ/แก้ไข/บันทึก/ยกเลิก), `dblclick` (ข้อความ) แล้วอ่าน `data-id` จาก `<li>` แม่ ห้ามผูก listener ต่อรายการใน `render()` |
| โหมดแก้ไข: Enter | `keydown` บน input ของแถวที่แก้ → `editTodo(id, value)`; ถ้าคืน `false` → shake + feedback + อยู่ในโหมดแก้ไขต่อ |
| โหมดแก้ไข: Esc | `keydown` → ยกเลิก: `editingId = null` → `render()` (ข้อความเดิมคงอยู่ ไม่บันทึก) |
| โหมดแก้ไข: blur | บันทึกอัตโนมัติ (`editTodo`) — ต้องกัน conflict กับ Esc: ตัวจัดการ Esc ต้องทำให้ blur handler รู้ว่ายกเลิกแล้ว (เช่น เช็คว่า `editingId` ยังเท่ากับ id นี้อยู่ไหม ก่อนบันทึก) |
| สลับไปแก้รายการอื่น | ผ่าน blur โดยอัตโนมัติ — บันทึกรายการเดิมก่อน (ข้อ C-4) แล้วเปิดโหมดแก้ไขรายการใหม่ |
| ปุ่ม clear completed | `click` → `clearCompleted()` (มี confirmation ภายใน) |
| เปิดหน้าเว็บ | `DOMContentLoaded` → `load()` → `render()` |

### 7.2 กฎการ Render
- `render()` สร้าง element ใหม่ทั้ง list ทุกครั้ง (rebuild) — ความเรียบง่ายชนะ performance
- **ห้าม render ทับโหมดแก้ไขโดยไม่จำเป็น**: ระหว่างมี `editingId` ให้ render เฉพาะเมื่อ `commit()` เท่านั้น; หลัง render ถ้า `editingId !== null` ต้อง focus + select input ของแถวนั้นใหม่
- ตัวเลข counter คำนวณจาก state ตอน render: `ค้าง = todos.filter(t => !t.done).length`, `เสร็จแล้ว = todos.length - ค้าง`
- ปุ่ม clear completed: `disabled = (จำนวนเสร็จ === 0)` — แสดงปุ่มไว้เสมอ (disabled เมื่อไม่มีรายการเสร็จ)
- ไม่มีรายการเลย → แสดง empty state แทน list, counter แสดง `ค้าง: 0` / `เสร็จแล้ว: 0`

---

## 8. ข้อกำหนดความปลอดภัย (บังคับ — security จะตรวจจากไฟล์นี้)

1. **ห้ามใช้ `innerHTML`, `insertAdjacentHTML`, `document.write` กับข้อมูลผู้ใช้เด็ดขาด** — รวมถึงห้ามใช้แม้แต่ "escape เองแล้วใส่ innerHTML"
2. สร้าง element ด้วย `document.createElement()` ทั้งหมด ตั้งข้อความผู้ใช้ด้วย `textContent` เสมอ
3. `id` ของรายการใส่ผ่าน `dataset` (`li.dataset.id = todo.id`) เท่านั้น — ห้ามประกอบเป็น HTML string
4. ข้อมูลจาก localStorage ต้องผ่าน `load()` (validate ตามข้อ 4.3) ก่อนใช้เสมอ — ห้ามนำ JSON ดิบไปใช้ตรง ๆ
5. `save()` / `load()` ห่อ `try/catch` ทุกจุดที่แตะ localStorage
6. ไม่มี external CDN, ไม่มี third-party script, ไม่มี cookie, ไม่มี network call
7. ข้อความที่เป็น template ของระบบ (ปุ่ม, feedback) hardcode ได้ปกติ — แต่ข้อความรายการ (todo text) ต้องผ่าน `textContent` เท่านั้น

---

## 9. กรณีขอบ (Edge Cases) ที่ต้องรองรับ

1. **localStorage ว่าง (ครั้งแรก)** → empty state, ไม่ error
2. **localStorage เสียหาย** (JSON ตัดครึ่ง, ไม่ใช่ array, item โครงสร้างเพี้ยน) → คืน `[]` / กรอง item เสียทิ้ง, แสดง empty state, ทำงานต่อได้ — ไม่ crash
3. **localStorage ถูกปิด / quota เต็ม** → save ล้มเหลวแบบเงียบ + ข้อความเตือน, แอปยังใช้ได้ใน session
4. **สลับไปแก้รายการอื่นขณะแก้อยู่** (ข้อ C-4): ถ้าข้อความเดิม trim แล้วไม่ว่าง → **บันทึกอัตโนมัติ** แล้วเปิดแก้รายการใหม่; ถ้าว่าง → **ยกเลิก** (คงข้อความเดิมของรายการเดิม) แล้วเปิดแก้รายการใหม่ — เหตุผล: ห้ามดักผู้ใช้ไว้กับรายการเดิมเพราะเขาตั้งใจไปแก้รายการอื่นแล้ว (การตัดสินของ sa จากข้อ C-4)
5. **Esc แล้ว blur ตามมา** → ต้องยกเลิกเท่านั้น ห้ามบันทึก (ดูกลไกในข้อ 7.1)
6. **แก้ไขเป็นข้อความเดิมเป๊ะ ๆ** → บันทึกได้ปกติ (ถือเป็นการยืนยัน) ไม่ต้องมีพฤติกรรมพิเศษ
7. **ติ๊ก checkbox ขณะอยู่โหมดแก้ไขอีกแถว** → blur ของ input แก้ไขทำงานก่อน (บันทึก) แล้ว toggle ตามปกติ — ทั้งสอง action ต้องสำเร็จ
8. **ลบรายการที่กำลังแก้ไขอยู่** → ลบได้ (ปุ่มลบถูกซ่อนในโหมดแก้ไข แต่ถ้าเกิดขึ้นผ่าน path อื่น) ต้องเคลียร์ `editingId` ด้วย
9. **ข้อความที่มี HTML/JS เช่น `<img src=x onerror=alert(1)>`** → แสดงเป็นข้อความธรรมดา (textContent) ไม่ execute
10. **ข้อความยาวมาก / มี emoji / ภาษาไทย+อังกฤษปนกัน** → แสดงได้ปกติ, ข้อความยาวต้อง wrap ไม่ทำ layout พัง (`word-break`/`overflow-wrap`)
11. **whitespace เท่านั้น** (`"   "`) ทั้งตอนเพิ่มและตอนแก้ไข → ถือเป็นค่าว่าง ไม่บันทึก
12. **refresh ระหว่างโหมดแก้ไข** → `editingId` ไม่ได้ persist อยู่แล้ว → หลังโหลดไม่มีแถวอยู่โหมดแก้ไข (ปกติ)
13. **กดปุ่ม clear completed ตอน disabled** → เกิดไม่ได้ (attribute `disabled` กันไว้)
14. **double-click ข้อความที่เสร็จแล้ว** → เข้าโหมดแก้ไขได้ปกติ (สถานะ done ไม่เปลี่ยน)

---

## 10. รายการ Task (เรียงตามลำดับพัฒนา)

> ทุก task ต้องทำตามข้อกำหนดในหัวข้อ 4–9 ข้างต้น AC = Acceptance Criteria ที่ทดสอบได้

### T-001 — โครงสร้างโปรเจกต์ + HTML skeleton
- **ไฟล์:** `index.html` (สร้างใหม่)
- **งาน:** สร้างโครง DOM ตามข้อ 3.1 ครบทุก id, ผูก `<label>`, ใส่ `<script src="app.js" defer>`, `<link rel="stylesheet" href="styles.css">`, ใส่ข้อความ UI ตามตารางหัวข้อ 5, ใส่ meta viewport
- **AC:**
  - เปิดไฟล์ในเบราว์เซอร์แล้วเห็น h1, form input + ปุ่มเพิ่ม, ul ว่าง, แถบสถานะ + ปุ่ม clear (disabled ไว้ก่อน)
  - มี `<label for="todo-input">` ครบ
  - ไม่มี logic ใด ๆ ใน HTML
- **Dependency:** ไม่มี

### T-002 — CSS พื้นฐาน + layout + responsive
- **ไฟล์:** `styles.css` (สร้างใหม่)
- **งาน:** สไตล์ตามข้อ 6.1, 6.3 และ class สถานะทั้งหมดในข้อ 3.1 (`.done`, `.editing`, `.shake`, `.visually-hidden`, `.error`), focus ring, `prefers-reduced-motion`, touch target 44px
- **AC:**
  - Desktop ≥768px: input+ปุ่มแถวเดียว, คอนเทนต์กึ่งกลาง max-width ~600px
  - <768px: ปุ่มเพิ่มเต็มความกว้างแถวใหม่, ปุ่มแก้ไข/ลบ icon-only
  - ข้อความเสร็จแล้วมีขีดฆ่า + สีจาง, คอนทราสต์ ≥ 4.5:1
  - ผู้ใช้ตั้ง reduce motion แล้วไม่มี shake
- **Dependency:** T-001

### T-003 — State + load/save + validation (แกนกลาง)
- **ไฟล์:** `app.js` (สร้างใหม่)
- **งาน:** constants, `state`, `load()` ตามข้อ 4.3 ครบทุกขั้น, `save()` ตามข้อ 4.4, `commit()`, id generator (randomUUID + fallback), `DOMContentLoaded` → `load()` → `render()` (render ว่างไว้ก่อนได้)
- **AC:**
  - localStorage ว่าง → state.todos = [] ไม่ error
  - ใส่ JSON เสีย (`"{{{`), ไม่ใช่ array (`"hello"`), item เพี้ยน (`[{"text":123}]`) ใน key `todoapp.todos.v1` แล้ว refresh → แอปไม่ crash, แสดง empty state
  - item ที่ field ครบถูกโหลดได้ถูกต้อง (text ถูก trim)
- **Dependency:** T-001

### T-004 — render() + เพิ่มรายการ (US-001)
- **ไฟล์:** `app.js`, `index.html` (wire event)
- **งาน:** `render()` สร้าง `<li>` ด้วย createElement ทั้งหมด (checkbox + ข้อความ textContent + ปุ่มแก้ไข + ปุ่มลบ + `data-id` ผ่าน dataset), `addTodo()` ตามข้อ 7, form submit + preventDefault, `showFeedback()`/`clearFeedback()`
- **AC:**
  - พิมพ์ข้อความ + กดปุ่มเพิ่ม **หรือ Enter** → รายการปรากฏ **ท้าย list** สถานะยังไม่เสร็จ, input เคลียร์, focus อยู่ที่ input
  - กดเพิ่มโดย input ว่างหรือ whitespace → ไม่เพิ่ม + shake + ข้อความ `กรุณาพิมพ์สิ่งที่ต้องทำ` + focus กลับ input
  - เพิ่มแล้วตรวจใน DevTools → key `todoapp.todos.v1` มีรายการใหม่ทันที (done: false)
  - พิมพ์ `<img src=x onerror=alert(1)>` → แสดงเป็นข้อความ ไม่มี alert
- **Dependency:** T-003, T-002

### T-005 — ติ๊กเสร็จ/ยกเลิก (US-003)
- **ไฟล์:** `app.js`
- **งาน:** event delegation `change` บน ul → `toggleTodo()`, class `.done` ตามสถานะ
- **AC:**
  - ติ๊ก → ขีดฆ่า + สีจาง + checkbox checked; localStorage อัปเดตทันที
  - ติ๊กซ้ำ (uncheck) → กลับปกติ; localStorage อัปเดต
  - refresh → สถานะคงเดิม
  - ติ๊กรายการหนึ่งไม่กระทบรายการอื่น
- **Dependency:** T-004

### T-006 — ลบรายการเดี่ยว (US-002)
- **ไฟล์:** `app.js`
- **งาน:** event delegation `click` ปุ่มลบ → `deleteTodo()` (ไม่มี confirmation สำหรับรายการเดี่ยว — ตาม backlog)
- **AC:**
  - ปุ่มลบมองเห็นชัดทุกแถว, กดแล้วรายการหายทันที
  - refresh แล้วรายการที่ลบไม่กลับมา
  - ลบรายการหนึ่ง รายการอื่นครบถ้วน + ลำดับคงเดิม
- **Dependency:** T-004

### T-007 — โหมดแก้ไข (US-005)
- **ไฟล์:** `app.js`, `styles.css`
- **งาน:** คลิกปุ่มแก้ไข **หรือ double-click ข้อความ** → `editingId = id` → render แถวนั้นเป็น input (focus + select อัตโนมัติ, ซ่อนปุ่มแก้ไข/ลบ, แสดงบันทึก/ยกเลิก); Enter/blur = บันทึก, Esc = ยกเลิก, สลับรายการ = บันทึกอัตโนมัติ (ข้อ C-4 + edge case ข้อ 9.4, 9.5); แก้เป็นค่าว่าง → ไม่บันทึก + shake + feedback + อยู่ในโหมดแก้ไข
- **AC:**
  - เข้าโหมดแก้ไขได้ทั้งปุ่มและ double-click, ข้อความเดิมอยู่ใน input และถูก select
  - แก้ + Enter (หรือ blur) → ข้อความใหม่แสดง + localStorage อัปเดต
  - Esc → กลับข้อความเดิม ไม่บันทึก (ตรวจ localStorage ยังเป็นค่าเดิม)
  - แก้เป็นค่าว่าง/whitespace + Enter → ไม่บันทึก + shake + ข้อความแจ้ง + ยังอยู่โหมดแก้ไข
  - แก้ A อยู่แล้วคลิกแก้ B → A ถูกบันทึกอัตโนมัติ (ถ้าไม่ว่าง) แล้ว B เข้าโหมดแก้ไข
  - แก้ได้ทีละ 1 รายการเสมอ
- **Dependency:** T-004

### T-008 — ลบรายการที่เสร็จแล้วทั้งหมด + confirmation (US-006)
- **ไฟล์:** `app.js`, `index.html`, `styles.css`
- **งาน:** `clearCompleted()` — **แสดง confirmation ก่อนลบเสมอ** (ข้อ C-1) โดยใช้ **custom modal เท่านั้น ห้ามใช้ `window.confirm()`**:
  - โครงสร้าง: backdrop ครอบ dialog ที่มีข้อความ `ต้องการลบรายการที่เสร็จแล้ว N รายการหรือไม่?` (N = จำนวนจริง คำนวณก่อนแสดง) + ปุ่มยืนยัน + ปุ่มยกเลิก (ทุกปุ่มเป็น `<button>` จริง)
  - พฤติกรรมการปิด: กด **Esc** หรือ **คลิก backdrop** → ปิด modal และถือเป็นการ**ยกเลิก** (ไม่แก้ state ไม่ render)
  - Focus management: เปิด modal แล้ว **focus ที่ปุ่ม "ยกเลิก" ก่อน**, มี **focus trap** (Tab/Shift+Tab วนอยู่ในปุ่มยืนยัน/ยกเลิกของ modal เท่านั้น) และเมื่อปิด modal ต้อง**คืน focus** กลับที่ปุ่ม clear completed
  - ยืนยัน → ลบรายการ done ทั้งหมด → commit; ยกเลิก → ไม่แก้ state ไม่ render; ปุ่ม clear disabled เมื่อจำนวนเสร็จ = 0
- **AC:**
  - มีรายการเสร็จ ≥ 1 → ปุ่ม enabled; กดแล้ว **custom modal แสดงขึ้นก่อนเสมอ** (ไม่ใช่ native dialog — grep ใน `app.js` ต้องไม่พบ `window.confirm`)
  - เปิด modal แล้ว focus อยู่ที่ปุ่ม "ยกเลิก"
  - Tab ภายใน modal วนอยู่เฉพาะปุ่มยืนยัน/ยกเลิก (focus trap ทำงาน)
  - กด Esc หรือคลิก backdrop → modal ปิด ถือเป็นยกเลิก ไม่มีอะไรเปลี่ยนแปลง (list + localStorage เดิม)
  - ปิด modal (ทุกวิธี) แล้ว focus กลับที่ปุ่ม clear completed
  - กดยืนยัน → รายการเสร็จหายหมด, รายการที่ยังไม่เสร็จคงอยู่ครบ, localStorage อัปเดตทันที
  - กดยกเลิก (ปุ่ม) → ไม่มีอะไรเปลี่ยนแปลง (list + localStorage เดิม)
  - ไม่มีรายการเสร็จ → ปุ่ม disabled (attribute จริง)
- **Dependency:** T-005

### T-009 — Counter (US-007)
- **ไฟล์:** `app.js`
- **งาน:** `renderCounter()` คำนวณจาก state แสดง `ค้าง: N` และ `เสร็จแล้ว: M` พร้อม `aria-live="polite"`; อัปเดตผ่าน `render()` ซึ่งถูกเรียกจาก `commit()` ทุก action
- **AC:**
  - ตัวเลขอัปเดตทันทีเมื่อ เพิ่ม/ลบ/ติ๊ก/clear completed ทุกกรณี
  - ตรงกับ list เสมอ รวมหลัง refresh
  - ไม่มีรายการเลย → แสดง `ค้าง: 0` / `เสร็จแล้ว: 0`
- **Dependency:** T-004

### T-010 — Empty state + สถานะพิเศษรวม
- **ไฟล์:** `app.js`, `styles.css`
- **งาน:** ไม่มีรายการ → แสดงข้อความ empty state ในพื้นที่ list; ตรวจซ้ำทุกสถานะพิเศษในข้อ 6.2 และ edge case ข้อ 9 ครบ
- **AC:**
  - ครั้งแรก / ลบจนหมด / ข้อมูลเสียหาย → ข้อความ `ยังไม่มีรายการ — เริ่มพิมพ์ด้านบนได้เลย` ไม่มี error
  - เพิ่มรายการแรกแล้ว empty state หายไป
- **Dependency:** T-003

### T-011 — Accessibility + ภาษา UI ตรวจซ้ำ
- **ไฟล์:** `index.html`, `app.js`, `styles.css`
- **งาน:** ตรวจครบตามข้อ 6.4 (label, aria-live, aria-label ปุ่ม icon/checkbox, disabled attribute, Tab order, focus ring) และตรวจข้อความ UI ทุกจุดตรงตารางหัวข้อ 5 (ไม่มี label คู่สองภาษา ไม่มีปุ่มสลับภาษา)
- **AC:**
  - ใช้งานได้ครบด้วยคีย์บอร์ดล้วน (เพิ่ม/ติ๊ก/ลบ/แก้/บันทึก/ยกเลิก/clear)
  - Tab ได้ตามลำดับที่กำหนด, ทุกปุ่มเป็น `<button>`
  - ไม่มีข้อความสองภาษาคู่กันใน UI
- **Dependency:** T-004 ถึง T-010

### T-012 — ตรวจความปลอดภัย + สรุปก่อนส่งมอบ
- **ไฟล์:** `app.js` (แก้ถ้าพบปัญหา)
- **งาน:** ตรวจว่าไม่มี `innerHTML`/`insertAdjacentHTML`/`document.write` เลยในไฟล์, ข้อมูล localStorage ผ่าน validate ก่อนใช้ทุกจุด, try/catch ครบ; ส่งต่อให้ security และ qa ตรวจตาม workflow
- **AC:**
  - grep ใน `app.js` แล้วไม่พบ `innerHTML`, `insertAdjacentHTML`, `document.write`
  - ผ่าน edge case ข้อ 9 ข้อ 1–3, 9 ทั้งหมดด้วยตัวเองก่อนส่ง
- **Dependency:** T-011

---

## 11. Definition of Done (ของทั้งงาน)

1. ทุก Acceptance Criteria ของ US-001 ถึง US-007 ใน `01-backlog.md` ผ่านครบ (ทดสอบด้วยเบราว์เซอร์จริง)
2. ทุก AC ของ T-001 ถึง T-012 ในไฟล์นี้ผ่านครบ
3. ข้อมูลคงอยู่หลัง refresh และปิด/เปิดเบราว์เซอร์ใหม่ พร้อมลำดับเดิม
4. ข้อมูล localStorage เสียหายไม่ทำให้แอป crash
5. ไม่มี `innerHTML` กับข้อมูลผู้ใช้, validate localStorage ก่อนใช้ทุกจุด
6. ไม่มี filter, ไม่มี backend, ไม่มี network call, ไม่มี build step, ไม่มี dependency
7. UI ตรงตาม `02-ux.md` (ยกเว้น 2 จุดที่ override ตามข้อ 2: confirmation ของ clear completed และรูปแบบภาษา)
8. ใช้งานได้ครบด้วยคีย์บอร์ด, ผ่านข้อกำหนด a11y ข้อ 6.4
9. เปิดใช้งานได้ทั้งผ่าน `file://` และ static hosting
10. ผ่านการตรวจของ security (`06-security-report.md`) และ qa (`07-qa-report.md`)

---

## 12. คำถามค้าง / ประเด็นรอการยืนยัน

1. ~~**รูปแบบ confirmation dialog ของ clear completed**~~ — **ปิดแล้ว**: ผู้ใช้ยืนยันให้ใช้ **custom modal** (ไม่ใช่ `window.confirm()`) — T-008 อัปเดตตามแล้ว (ปุ่มยืนยัน/ยกเลิก, Esc/backdrop ปิดได้, focus trap + คืน focus, focus ปุ่ม "ยกเลิก" ก่อน)
2. **ข้อความใน confirmation dialog** — ใช้ภาษาไทยตามข้อ 5 ถ้าต้องการเพิ่มรายละเอียดอื่น (เช่น ระบุว่ากู้คืนไม่ได้) แจ้งกลับได้
3. ไม่มีคำถามอื่นค้าง — จุดที่ `02-ux.md` ทิ้งคำถามไว้ (ข้อ 9.1–9.3) ปิดครบแล้วด้วยการตัดสินใจของผู้ใช้ในข้อ 2 ของไฟล์นี้
