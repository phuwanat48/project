# คู่มือนักพัฒนา — Todo List

> คู่มือสำหรับคนที่ต้องการแก้โค้ดหรือเพิ่มฟีเจอร์ อ่านคู่กับ `docs/03-architecture.md` และ `docs/04-spec.md`

---

## 1. สถาปัตยกรรมโดยย่อ

Static client-side ล้วน 3 ไฟล์ ไม่มี dependency และไม่มี build step:

| ไฟล์ | บทบาท |
|---|---|
| `index.html` | โครง DOM หน้าเดียว — form เพิ่ม, `<ul id="todo-list">`, แถบสถานะ, modal ยืนยัน (ซ่อนด้วย `hidden`) |
| `styles.css` | layout, responsive (<768px), สถานะ `.done`/`.editing`/`.shake`, modal, focus ring, `prefers-reduced-motion` |
| `app.js` | logic ทั้งหมด (Vanilla JS, ES2020+, `"use strict"`) |

โครงสร้าง `app.js` เรียงตามลำดับ: **Constants → State → Persistence → Actions → Validation helpers → Render → Event wiring (init)**

### แนวคิดสำคัญ

- **State เดียว**: `state = { todos: [], editingId: null }` — `todos` คือ array ของ `{ id, text, done, createdAt }`, `editingId` คือ id รายการที่กำลังแก้ (ไม่ persist)
- **กฎ commit()**: ทุก action ที่แก้ `state.todos` ต้องจบด้วย `commit()` = `save()` (เขียน localStorage) + `render()` (วาด DOM ใหม่)
- **localStorage key**: `todoapp.todos.v1` — อ่านผ่าน `load()` ที่รับมือข้อมูลเสียหายทุกกรณี (JSON parse fail / ไม่ใช่ array / item ไม่ผ่าน `validateTodos` → คืน array ว่าง ไม่ crash)
- **Render แบบ rebuild**: `renderList()` ล้าง `<ul>` แล้วสร้าง `<li>` ใหม่ทั้งหมด — ยกเว้นตอนจบโหมดแก้ไขที่ใช้ `li.replaceWith()` แบบ in-place เพื่อไม่ทำลาย element ที่กำลังรับ event
- **Event delegation**: ผูก listener บน `<ul>` ครั้งเดียว (`change`, `click`, `dblclick`, `keydown`, `focusout`, `mousedown`) — ห้ามผูกต่อรายการใน `render()`
- **ความปลอดภัย**: ข้อความผู้ใช้ทุกจุดตั้งผ่าน `textContent` เท่านั้น — **ห้าม** `innerHTML` / `insertAdjacentHTML` / `document.write` (กัน XSS)
- **Modal ยืนยัน**: `openConfirmModal(message, onConfirm)` เก็บ callback + focus เดิม, focus ปุ่ม "ยกเลิก" ก่อน, Tab ถูก trap ใน modal, Esc/คลิก backdrop = ยกเลิก และ `closeConfirmModal()` คืน focus ที่ element เดิมเสมอ
- **Focus หลังยืนยันลบที่เสร็จแล้ว**: `confirmModalAction()` หลัง `closeConfirmModal()` + `onConfirm()` แล้ว ถ้าปุ่ม clear กลายเป็น disabled (`els.clearBtn.disabled` เพราะไม่เหลือรายการที่เสร็จแล้ว) จะเรียก `els.todoInput.focus()` เพื่อไม่ให้ focus หลุดไป body หลัง `render()` — กรณียกเลิก/Esc/backdrop ปุ่มยัง enabled จึงคืน focus ที่ปุ่มเดิมตามปกติ
- **Focus หลังออกจากโหมดแก้ไข**: ทั้งปุ่มยกเลิกและกด **Esc** ใน `onListKeydown` ใช้ `cancelEditing(li)` เดียวกัน — ตั้ง `editingId = null` ก่อน `li.replaceWith()` แล้ว focus ปุ่มแก้ไข (`.btn-edit`) ของแถวเดิม (การตั้ง `editingId` ก่อน replaceWith สำคัญ เพื่อให้ guard ใน `onListFocusout` ยังกันบันทึกหลัง Esc ได้)

---

## 2. วิธีรันและเทส

```powershell
# รันแบบ serve static
python -m http.server 8080      # หรือ npx serve .

# รันเทส (Node.js 18+, แนะนำ 22) — ไม่ต้อง npm install
node tests/app.test.js

# รันผ่าน Docker (stage แรกของ build รันเทสให้ก่อน)
docker build -t todo-list:latest .
docker run -d --name todo-list -p 8080:8080 todo-list:latest
```

เทสอยู่ที่ `tests/app.test.js` (ใช้ helper `tests/helpers/stub-env.js` จำลอง DOM/localStorage) จบด้วย `RESULT: PASS` = ผ่าน

---

## 3. วิธีเพิ่มฟีเจอร์ (แนวทาง)

1. **อ่านขอบเขตก่อน** — ดู `docs/01-backlog.md` หัวข้อ Out of Scope (เช่น filter, backend, sync ไม่ให้ทำ)
2. **เพิ่ม action ใน `app.js`** ตามรูปแบบเดิม:
   - เขียน function ที่แก้ `state.todos` แล้วจบด้วย `commit()`
   - ตรวจ input ผ่าน `sanitizeText()` (trim) — ค่าว่างต้องไม่บันทึก และแจ้งผู้ใช้ด้วย `showFeedback()` + `shake()`
3. **ผูก event ใน `wireEvents()`** — ใช้ event delegation บน `els.list` ถ้าเกี่ยวกับรายการ, อย่าผูกใน `createTodoItem()`
4. **ถ้าต้องมีข้อความ UI ใหม่** เพิ่มใน object `MSG` ต้นไฟล์ อย่า hardcode ข้อความกระจายในโค้ด
5. **ถ้าแก้ schema ข้อมูล** ต้อง:
   - เปลี่ยน `STORAGE_KEY` เวอร์ชันใหม่ (เช่น `todoapp.todos.v2`) เพื่อไม่ชนข้อมูลเก่า
   - อัปเดต `validateTodos()` ให้กรอง item ตาม schema ใหม่
6. **อัปเดตเทส** ใน `tests/app.test.js` แล้วรันให้ผ่านก่อนส่งงาน
7. **อย่าลืม accessibility** — ปุ่มใหม่ต้องเป็น `<button>` จริง มี `aria-label`, ตัวเลข/ข้อความแจ้งใหม่ครอบด้วย `aria-live="polite"`

### ตัวอย่าง: เพิ่ม action ใหม่

```js
function duplicateTodo(id) {
  const todo = state.todos.find((t) => t.id === id);
  if (!todo) return;
  state.todos.splice(
    state.todos.indexOf(todo) + 1,
    0,
    { id: genId(), text: todo.text, done: false, createdAt: new Date().toISOString() }
  );
  commit(); // save() + render() เสมอ
}
```

แล้วเพิ่ม case ใน `onListClick()` และปุ่มใน `createTodoItem()` (ผ่าน `createActionButton()`)

---

## 4. แนวทาง Contribute

1. **แก้เฉพาะส่วนที่รับผิดชอบ** — โปรเจกต์นี้ทำงานแบบ multi-agent ดูบทบาทเจ้าของไฟล์ใน `AGENTS.md` (เช่น `docs/01-backlog.md` เป็นของ pm, `docs/08-deploy.md` เป็นของ devops)
2. **ก่อนส่งงาน ต้องผ่านทั้งหมด:**
   - `node tests/app.test.js` → `RESULT: PASS`
   - เปิดหน้าเว็บแล้วลอง flow หลัก: เพิ่ม → ติ๊ก → แก้ไข → ลบ → ลบที่เสร็จแล้ว (modal) → refresh แล้วข้อมูลคงอยู่
   - DevTools (F12) Console ไม่มี error สีแดง
3. **ข้อห้ามในโค้ด** (ตาม spec ด้านความปลอดภัย):
   - ห้ามใช้ `innerHTML` กับข้อมูลผู้ใช้
   - ห้ามเพิ่ม network call / dependency ใหม่โดยไม่ผ่านการตกลงขอบเขต
   - ห้ามเก็บข้อมูลผู้ใช้นอกจาก localStorage
4. **ส่งงานต่อกันผ่านไฟล์ใน `docs/`** — ถ้าเปลี่ยนพฤติกรรมที่กระทบผู้ใช้ ให้อัปเดต `docs/09-user-guide.md` ด้วย
