/* ============================================================
   Todo List — app.js
   Vanilla JavaScript (ES2020+) — ไม่มี dependency, ไม่มี build step
   โครงสร้าง: Constants → State → Persistence → Actions
             → Validation helpers → Render → Event wiring (init)
   ความปลอดภัย: ข้อความผู้ใช้ทุกจุดตั้งผ่าน textContent เท่านั้น
               (ห้าม innerHTML / insertAdjacentHTML / document.write)
   ============================================================ */

"use strict";

/* ---- 1. Constants ---- */

const STORAGE_KEY = "todoapp.todos.v1";

// Template ข้อความ UI ทั้งหมด (ภาษาไทยปนอังกฤษตามธรรมชาติ)
const MSG = {
  emptyInput: "กรุณาพิมพ์สิ่งที่ต้องทำ",
  saveFailed: "บันทึกไม่สำเร็จ — ข้อมูลจะหายเมื่อปิดหน้านี้",
  emptyState: "ยังไม่มีรายการ — เริ่มพิมพ์ด้านบนได้เลย",
  checkbox: (text) => `ทำเครื่องหมายว่าเสร็จแล้ว: ${text}`,
  editInput: (text) => `แก้ไขรายการ: ${text}`,
  confirmClear: (n) => `ต้องการลบรายการที่เสร็จแล้ว ${n} รายการหรือไม่?`,
};

/* ---- DOM refs (script โหลดแบบ defer จึงอ้างอิง element ได้ทันที) ---- */

const els = {
  addForm: document.getElementById("add-form"),
  todoInput: document.getElementById("todo-input"),
  feedback: document.getElementById("feedback"),
  list: document.getElementById("todo-list"),
  countPending: document.getElementById("count-pending"),
  countDone: document.getElementById("count-done"),
  clearBtn: document.getElementById("clear-completed-btn"),
  modalBackdrop: document.getElementById("modal-backdrop"),
  modalText: document.getElementById("modal-text"),
  modalConfirm: document.getElementById("modal-confirm"),
  modalCancel: document.getElementById("modal-cancel"),
};

/* ---- 2. State ---- */

// editingId: string | null — สถานะโหมดแก้ไข (ไม่ persist หายได้เมื่อ refresh)
const state = { todos: [], editingId: null };

/* ---- 3. Persistence ---- */

// อ่านข้อมูลจาก localStorage พร้อมรับมือข้อมูลเสียหายทุกกรณี — ไม่ crash (ข้อ 4.3)
function load() {
  let raw;
  try {
    raw = localStorage.getItem(STORAGE_KEY);
  } catch {
    return []; // storage ถูกปิด (เช่น private mode บางเบราว์เซอร์)
  }
  if (raw === null) return []; // ครั้งแรก — ไม่แสดง error
  let parsed;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return []; // JSON เสียหาย เช่น ถูกตัดครึ่ง
  }
  if (!Array.isArray(parsed)) return []; // ไม่ใช่ array — ไม่พยายามซ่อม
  return validateTodos(parsed);
}

function save() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state.todos));
  } catch {
    // quota เต็ม หรือ storage ถูก block — ไม่ crash แจ้งผู้ใช้แทน
    // state ใน memory ยังถูกต้อง แอปยังใช้ได้ใน session เดียว
    showFeedback(MSG.saveFailed);
  }
}

// ทุก action ที่แก้ state.todos ต้องจบด้วย commit() เสมอ: save() → render()
function commit() {
  save();
  render();
}

// สร้าง id ไม่ซ้ำ — randomUUID ก่อน ถ้าไม่มี (เบราว์เซอร์เก่ามาก) ใช้ fallback
function genId() {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return Date.now().toString(36) + Math.random().toString(36).slice(2);
}

/* ---- 4. Actions (ทุกตัวที่แก้ todos จบด้วย commit()) ---- */

function addTodo(rawText) {
  const trimmed = sanitizeText(rawText);
  if (trimmed === "") {
    // ค่าว่าง/whitespace: ไม่แก้ state — shake + feedback + focus กลับ input
    showFeedback(MSG.emptyInput);
    shake(els.todoInput);
    els.todoInput.focus();
    return;
  }
  clearFeedback(); // เคลียร์ feedback เดิมก่อน (ถ้า save ล้มเหลวจะแจ้งใหม่ใน commit)
  state.todos.push({
    id: genId(),
    text: trimmed,
    done: false,
    createdAt: new Date().toISOString(),
  });
  commit();
  els.todoInput.value = "";
  els.todoInput.focus();
}

function deleteTodo(id) {
  state.todos = state.todos.filter((t) => t.id !== id);
  if (state.editingId === id) state.editingId = null; // ลบรายการที่กำลังแก้ (edge 9.8)
  commit();
}

function toggleTodo(id) {
  const todo = state.todos.find((t) => t.id === id);
  if (!todo) return;
  todo.done = !todo.done;
  commit();
}

// คืน true ถ้าบันทึกสำเร็จ, false ถ้าข้อความว่าง (caller จัดการ feedback เอง)
function editTodo(id, rawText) {
  const trimmed = sanitizeText(rawText);
  if (trimmed === "") return false;
  const todo = state.todos.find((t) => t.id === id);
  if (!todo) return false;
  todo.text = trimmed;
  state.editingId = null;
  clearFeedback();
  commit();
  return true;
}

// ลบรายการที่เสร็จแล้วทั้งหมด — แสดง custom confirmation modal ก่อนเสมอ (ข้อ C-1)
function clearCompleted() {
  const doneCount = state.todos.filter((t) => t.done).length;
  if (doneCount === 0) return; // ปุ่ม disabled กันไว้แล้ว กันอีกชั้น
  openConfirmModal(MSG.confirmClear(doneCount), () => {
    state.todos = state.todos.filter((t) => !t.done);
    state.editingId = null;
    commit();
  });
}

/* ---- Confirmation modal (US-006) — custom modal ตามธีมหน้าเว็บ ---- */

let modalOnConfirm = null; // callback ที่จะรันเมื่อผู้ใช้ยืนยัน
let modalLastFocus = null; // element ที่ focus ก่อนเปิด modal (คืน focus ตอนปิด)

function openConfirmModal(message, onConfirm) {
  modalOnConfirm = onConfirm;
  modalLastFocus = document.activeElement;
  els.modalText.textContent = message;
  els.modalBackdrop.hidden = false;
  els.modalCancel.focus(); // focus ปุ่มปลอดภัย (ยกเลิก) ก่อนกันกด Enter พลาด
}

function closeConfirmModal() {
  els.modalBackdrop.hidden = true;
  modalOnConfirm = null;
  if (modalLastFocus && typeof modalLastFocus.focus === "function") {
    modalLastFocus.focus(); // คืน focus ให้ผู้ใช้ทำงานต่อได้
  }
  modalLastFocus = null;
}

function confirmModalAction() {
  const onConfirm = modalOnConfirm;
  closeConfirmModal();
  if (typeof onConfirm === "function") onConfirm();
  // O-1 (a11y): หลังยืนยัน clear completed ปุ่ม clear จะกลายเป็น disabled
  // (ไม่เหลือรายการที่เสร็จแล้ว) ทำให้ focus ที่เพิ่งคืนกลับหลุดไปที่ body
  // จึงย้าย focus ไปที่ todo-input — element หลักที่ผู้ใช้ใช้งานต่อได้ทันที
  // (กรณียกเลิก/Esc/backdrop ปุ่ม clear ยัง enabled จึงคืน focus ที่ปุ่มเดิมตาม closeConfirmModal)
  if (els.clearBtn.disabled) {
    els.todoInput.focus();
  }
}

// ดัก Tab ให้วนอยู่ใน modal เท่านั้น (focus trap แบบง่าย — ใน modal มี 2 ปุ่ม)
function trapModalTab(event) {
  const order = [els.modalCancel, els.modalConfirm];
  const index = order.indexOf(document.activeElement);
  event.preventDefault();
  if (index === -1) {
    order[0].focus();
    return;
  }
  const next = event.shiftKey
    ? (index - 1 + order.length) % order.length
    : (index + 1) % order.length;
  order[next].focus();
}

/* ---- 5. Validation helpers ---- */

function sanitizeText(raw) {
  return typeof raw === "string" ? raw.trim() : "";
}

// กรองเฉพาะ item ที่ผ่านเงื่อนไขครบ (ตามข้อ 4.3) — ไม่พยายามซ่อมข้อมูลเสีย
function validateTodos(items) {
  const valid = [];
  for (const item of items) {
    if (typeof item !== "object" || item === null || Array.isArray(item)) continue;
    if (typeof item.id !== "string" || item.id === "") continue;
    if (typeof item.text !== "string" || item.text.trim() === "") continue;
    if (typeof item.done !== "boolean") continue;
    valid.push({
      id: item.id,
      text: item.text.trim(),
      done: item.done,
      // createdAt ไม่บังคับ — ถ้าไม่มี/ผิด type ให้เติม "" แล้วเก็บ item ไว้
      createdAt: typeof item.createdAt === "string" ? item.createdAt : "",
    });
  }
  return valid;
}

/* ---- 6. Render ---- */

function render() {
  renderList();
  renderCounter();
  renderClearButton();
  focusEditingInput(); // หลัง render ถ้ายังแก้ไขอยู่ ให้ focus + select ใหม่ (ข้อ 7.2)
}

function renderList() {
  els.list.textContent = ""; // ล้างรายการเดิม (วิธีปลอดภัย ไม่ใช้ innerHTML)
  if (state.todos.length === 0) {
    const empty = document.createElement("li");
    empty.className = "empty-state";
    empty.textContent = MSG.emptyState;
    els.list.appendChild(empty);
    return;
  }
  for (const todo of state.todos) {
    els.list.appendChild(createTodoItem(todo));
  }
}

// สร้าง <li> หนึ่งแถว — createElement ทั้งหมด ข้อความผู้ใช้ผ่าน textContent เท่านั้น
function createTodoItem(todo) {
  const li = document.createElement("li");
  li.className = "todo-item" + (todo.done ? " done" : "");
  li.dataset.id = todo.id; // id ใส่ผ่าน dataset เท่านั้น ห้ามประกอบเป็น HTML string

  if (state.editingId === todo.id) {
    // โหมดแก้ไข: input + ปุ่มบันทึก/ยกเลิก (ไม่สร้างปุ่มแก้ไข/ลบ)
    li.classList.add("editing");
    const input = document.createElement("input");
    input.type = "text";
    input.className = "edit-input";
    input.value = todo.text; // ตั้งค่าผ่าน property (ปลอดภัย)
    input.setAttribute("aria-label", MSG.editInput(todo.text));
    li.appendChild(input);
    li.appendChild(createActionButton("save", "บันทึก", "บันทึกการแก้ไข"));
    li.appendChild(createActionButton("cancel", "ยกเลิก", "ยกเลิกการแก้ไข"));
    return li;
  }

  const checkbox = document.createElement("input");
  checkbox.type = "checkbox";
  checkbox.className = "todo-checkbox";
  checkbox.checked = todo.done;
  checkbox.setAttribute("aria-label", MSG.checkbox(todo.text));
  li.appendChild(checkbox);

  const text = document.createElement("span");
  text.className = "todo-text";
  text.textContent = todo.text; // กัน XSS — แสดงเป็นข้อความธรรมดาเสมอ
  li.appendChild(text);

  li.appendChild(createActionButton("edit", "แก้ไข", "แก้ไขรายการนี้", "edit"));
  li.appendChild(createActionButton("delete", "ลบ", "ลบรายการนี้", "delete"));
  return li;
}

/* ---- ไอคอน inline SVG (stroke currentColor น้ำหนักเดียว) ---- */

const SVG_NS = "http://www.w3.org/2000/svg";

// เส้นทางของไอคอนแต่ละชนิด — viewBox 24×24, ใช้กับ fill:none + stroke
const ICON_PATHS = {
  edit: ["M17 3a2.85 2.85 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"],
  delete: [
    "M3 6h18",
    "M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6",
    "M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2",
  ],
};

function createIcon(name) {
  const svg = document.createElementNS(SVG_NS, "svg");
  svg.setAttribute("viewBox", "0 0 24 24");
  svg.setAttribute("aria-hidden", "true");
  svg.setAttribute("focusable", "false");
  svg.classList.add("btn-icon");
  for (const d of ICON_PATHS[name]) {
    const path = document.createElementNS(SVG_NS, "path");
    path.setAttribute("d", d);
    svg.appendChild(path);
  }
  return svg;
}

function createActionButton(action, label, ariaLabel, icon) {
  const btn = document.createElement("button");
  btn.type = "button";
  btn.className = `btn btn-${action}`;
  btn.dataset.action = action;
  btn.setAttribute("aria-label", ariaLabel);
  if (icon) {
    // ไอคอนเป็น inline SVG วาดเอง (stroke เดียว, สีตาม currentColor)
    // — ไม่ใช้ emoji/Unicode glyph เพราะสรรเสริญข้ามแพลตฟอร์มไม่คงที่
    btn.appendChild(createIcon(icon));
  }
  const labelSpan = document.createElement("span");
  labelSpan.className = "btn-label";
  labelSpan.textContent = label;
  btn.appendChild(labelSpan);
  return btn;
}

function renderCounter() {
  const pending = state.todos.filter((t) => !t.done).length;
  els.countPending.textContent = `ค้าง: ${pending}`;
  els.countDone.textContent = `เสร็จแล้ว: ${state.todos.length - pending}`;
}

function renderClearButton() {
  const doneCount = state.todos.filter((t) => t.done).length;
  els.clearBtn.disabled = doneCount === 0; // attribute disabled จริง
}

function showFeedback(message) {
  els.feedback.textContent = message;
  els.feedback.classList.add("error");
}

function clearFeedback() {
  els.feedback.textContent = "";
  els.feedback.classList.remove("error");
}

function focusEditingInput() {
  if (state.editingId === null) return;
  const li = findLiById(state.editingId);
  if (!li) return;
  const input = li.querySelector(".edit-input");
  if (input) {
    input.focus();
    input.select(); // focus + select อัตโนมัติตามข้อ 6.2
  }
}

function findLiById(id) {
  for (const li of els.list.children) {
    if (li.dataset && li.dataset.id === id) return li;
  }
  return null;
}

// animation สั่น — force reflow เพื่อให้เล่นซ้ำได้แม้กด trigger ถี่ ๆ
function shake(el) {
  if (!el) return;
  el.classList.remove("shake");
  void el.offsetWidth;
  el.classList.add("shake");
}

/* ---- โหมดแก้ไข (US-005) ---- */

function startEdit(id) {
  if (state.editingId === id) return;
  // ถ้ามีแถวอื่นอยู่โหมดแก้ไข (เช่นมาจากคีย์บอร์ด) ให้ปิดแถวเดิมก่อน — แก้ได้ทีละ 1 รายการ
  if (state.editingId !== null) {
    const currentLi = findLiById(state.editingId);
    if (currentLi) finishEditing(currentLi);
  }
  state.editingId = id;
  render(); // render จะ focus + select input ของแถวนี้ให้
}

// จบโหมดแก้ไขของแถวหนึ่ง: บันทึกถ้าข้อความไม่ว่าง / ยกเลิกถ้าว่าง (edge 9.4)
// อัปเดตเฉพาะแถวนั้นแบบ in-place — ไม่ rebuild ทั้ง list เพื่อไม่ทำลาย
// element อื่นที่กำลังจะรับ click/change ต่อจาก blur (เช่น สลับไปแก้รายการอื่น)
function finishEditing(li) {
  const id = li.dataset.id;
  if (state.editingId !== id) return;
  const input = li.querySelector(".edit-input");
  const trimmed = input ? sanitizeText(input.value) : "";
  state.editingId = null;
  const todo = state.todos.find((t) => t.id === id);
  if (todo) {
    if (trimmed !== "") {
      todo.text = trimmed;
      clearFeedback();
      save(); // บันทึกลง localStorage โดยไม่ render ทั้ง list
    } else {
      clearFeedback(); // ยกเลิก — คงข้อความเดิมของรายการ
    }
    li.replaceWith(createTodoItem(todo));
  } else {
    li.remove();
  }
}

// กดปุ่มบันทึก: ถ้าว่าง → shake + feedback + อยู่ในโหมดแก้ไขต่อ (ข้อ 6.2)
function saveEditing(li) {
  const id = li.dataset.id;
  if (state.editingId !== id) return;
  const input = li.querySelector(".edit-input");
  if (sanitizeText(input ? input.value : "") === "") {
    showFeedback(MSG.emptyInput);
    shake(input);
    return;
  }
  finishEditing(li);
  // คืน focus ที่ปุ่มแก้ไขของแถวเดิม เพื่อให้ใช้คีย์บอร์ดต่อได้
  const liAfter = findLiById(id);
  const editBtn = liAfter && liAfter.querySelector(".btn-edit");
  if (editBtn) editBtn.focus();
}

function cancelEditing(li) {
  const id = li.dataset.id;
  if (state.editingId !== id) return;
  state.editingId = null;
  const todo = state.todos.find((t) => t.id === id);
  let liAfter = null;
  if (todo) {
    liAfter = createTodoItem(todo);
    li.replaceWith(liAfter);
  } else {
    li.remove();
  }
  const editBtn = liAfter && liAfter.querySelector(".btn-edit");
  if (editBtn) editBtn.focus();
}

/* ---- 7. Event wiring (ทั้งหมดอยู่ใน init ที่รันหลัง DOMContentLoaded) ---- */

function onAddSubmit(event) {
  event.preventDefault(); // ครอบคลุมทั้งปุ่มเพิ่มและ Enter ในกลไกเดียว
  addTodo(els.todoInput.value);
}

// Event delegation บน ul — ห้ามผูก listener ต่อรายการใน render()
function onListChange(event) {
  if (!event.target.classList.contains("todo-checkbox")) return;
  const li = event.target.closest("li");
  if (!li) return;
  // ถ้ามีแถวอื่น (หรือแถวนี้) อยู่โหมดแก้ไข ให้ปิดก่อนเพื่อบันทึกข้อความที่พิมพ์ค้าง
  if (state.editingId !== null) {
    const editingLi = findLiById(state.editingId);
    if (editingLi) finishEditing(editingLi);
  }
  const id = li.dataset.id;
  toggleTodo(id);
  // คืน focus ที่ checkbox หลัง render เพื่อให้ใช้คีย์บอร์ดต่อได้
  const liAfter = findLiById(id);
  const checkbox = liAfter && liAfter.querySelector(".todo-checkbox");
  if (checkbox) checkbox.focus();
}

function onListClick(event) {
  const btn = event.target.closest("button[data-action]");
  if (!btn) return;
  const li = btn.closest("li");
  if (!li) return;
  const id = li.dataset.id;
  switch (btn.dataset.action) {
    case "edit":
      startEdit(id);
      break;
    case "delete":
      // ถ้ากำลังแก้แถวอื่นอยู่ ให้บันทึก/ยกเลิกแถวนั้นก่อน (รักษาข้อความที่พิมพ์ค้าง)
      if (state.editingId !== null && state.editingId !== id) {
        const editingLi = findLiById(state.editingId);
        if (editingLi) finishEditing(editingLi);
      }
      deleteTodo(id);
      break;
    case "save":
      saveEditing(li);
      break;
    case "cancel":
      cancelEditing(li);
      break;
  }
}

// double-click ข้อความ → เข้าโหมดแก้ไข (รายการที่เสร็จแล้วก็แก้ได้ตาม edge 9.14)
function onListDblclick(event) {
  const text = event.target.closest(".todo-text");
  if (!text) return;
  const li = text.closest("li");
  if (!li) return;
  startEdit(li.dataset.id);
}

// คีย์บอร์ดในโหมดแก้ไข: Enter = บันทึก, Esc = ยกเลิก
function onListKeydown(event) {
  const input = event.target.closest(".edit-input");
  if (!input) return;
  const li = input.closest("li");
  if (!li) return;
  const id = li.dataset.id;

  if (event.key === "Enter") {
    event.preventDefault();
    if (sanitizeText(input.value) === "") {
      // แก้เป็นค่าว่าง: ไม่บันทึก + shake + feedback + อยู่ในโหมดแก้ไข (ข้อ 6.2)
      showFeedback(MSG.emptyInput);
      shake(input);
      return;
    }
    if (editTodo(id, input.value)) {
      // คืน focus ที่ปุ่มแก้ไขของแถวเดิม เพื่อให้ใช้คีย์บอร์ดต่อได้
      const liAfter = findLiById(id);
      const editBtn = liAfter && liAfter.querySelector(".btn-edit");
      if (editBtn) editBtn.focus();
    }
  } else if (event.key === "Escape") {
    event.preventDefault();
    // ยกเลิก: ไม่บันทึก — ข้อความเดิมคงอยู่
    // ใช้ cancelEditing เพื่อให้พฤติกรรมเหมือนปุ่มยกเลิกเป๊ะ ๆ:
    // editingId เปลี่ยนก่อน (กัน blur ตามมาไม่ให้บันทึก — edge 9.5)
    // แล้วคืน focus ที่ปุ่มแก้ไขของแถวเดิม (O-2 a11y)
    cancelEditing(li);
  }
}

// blur ของ input แก้ไข = บันทึกอัตโนมัติ (ข้อ 7.1)
// กัน conflict กับ Esc: เช็คว่า editingId ยังเท่ากับ id นี้อยู่ไหมก่อนบันทึก
function onListFocusout(event) {
  if (!event.target.classList.contains("edit-input")) return;
  const li = event.target.closest("li");
  if (!li) return;
  if (state.editingId !== li.dataset.id) return; // Esc ยกเลิกไปแล้ว — ห้ามบันทึก
  const related = event.relatedTarget;
  // focus ย้ายไปปุ่ม/checkbox ในแถวเดียวกัน → ให้ปุ่มนั้นจัดการเอง
  // (เช่น Tab ไปปุ่มบันทึกแล้วกด Enter)
  if (related && li.contains(related)) return;
  finishEditing(li);
}

// ขณะแก้ไขอยู่: กัน blur เมื่อกดปุ่มใน list (mousedown → preventDefault)
// เพื่อให้ click ของปุ่มถูกส่งถึงก่อน DOM ถูก render ใหม่
// (checkbox ไม่ preventDefault เพราะต้องให้ click toggle ตามปกติ —
//  blur จะจบโหมดแก้ไขแบบ in-place แล้ว change ค่อย toggle)
function onListMousedown(event) {
  if (state.editingId === null) return;
  if (event.target.closest("button")) event.preventDefault();
}

/* ---- Modal events ---- */

function onBackdropClick(event) {
  if (event.target === els.modalBackdrop) closeConfirmModal(); // คลิก backdrop = ยกเลิก
}

function onDocumentKeydown(event) {
  if (els.modalBackdrop.hidden) return;
  if (event.key === "Escape") {
    event.preventDefault();
    closeConfirmModal(); // กด Esc = ยกเลิก
  } else if (event.key === "Tab") {
    trapModalTab(event);
  }
}

/* ---- Init ---- */

function wireEvents() {
  els.addForm.addEventListener("submit", onAddSubmit);
  els.list.addEventListener("change", onListChange);
  els.list.addEventListener("click", onListClick);
  els.list.addEventListener("dblclick", onListDblclick);
  els.list.addEventListener("keydown", onListKeydown);
  els.list.addEventListener("focusout", onListFocusout);
  els.list.addEventListener("mousedown", onListMousedown);
  els.clearBtn.addEventListener("click", clearCompleted);
  els.modalConfirm.addEventListener("click", confirmModalAction);
  els.modalCancel.addEventListener("click", closeConfirmModal);
  els.modalBackdrop.addEventListener("click", onBackdropClick);
  document.addEventListener("keydown", onDocumentKeydown);
}

function init() {
  state.todos = load();
  wireEvents();
  render();
}

document.addEventListener("DOMContentLoaded", init);
