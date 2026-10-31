"use strict";
/* ============================================================
 * app.test.js — เทสอัตโนมัติของ Todo List (รันด้วย Node ล้วน)
 * วิธีรัน: node tests/app.test.js
 * ครอบคลุม: AC ของ US-001..US-007 + custom modal (T-008)
 *           + edge cases ตาม docs/04-spec.md ข้อ 9
 * ข้อจำกัด: ไม่ได้รันในเบราว์เซอร์จริง — CSS/visual ตรวจแยก (ดูรายงาน QA)
 * ============================================================ */

const assert = require("assert");
const { loadApp, reloadPage } = require("./helpers/stub-env");

const KEY = "todoapp.todos.v1";
const results = [];
let section = "";

function sectionOf(name) {
  section = name;
}
function test(id, name, fn) {
  results.push({ id, name, section, fn });
}

/* ---------- helpers ---------- */
function el(app, id) {
  return app.doc._ids[id];
}
function seed(app, texts) {
  for (const t of texts) app.api.addTodo(t);
}
function stored(app) {
  const raw = app.storage.getItem(KEY);
  return raw === null ? null : JSON.parse(raw);
}
function liOf(app, id) {
  return app.api.findLiById(id);
}
function textOf(app, id) {
  const li = liOf(app, id);
  const span = li && li.querySelector(".todo-text");
  return span ? span.textContent : null;
}
function btnOf(app, id, action) {
  const li = liOf(app, id);
  return li && li.querySelector(`button[data-action="${action}"]`);
}
function clickBtn(app, id, action) {
  const btn = btnOf(app, id, action);
  assert.ok(btn, `แถว ${id} ต้องมีปุ่ม ${action}`);
  app.api.onListClick({ target: btn, preventDefault() {} });
}
function listIds(app) {
  return el(app, "todo-list")
    .childNodes.filter((n) => n.dataset && n.dataset.id)
    .map((n) => n.dataset.id);
}
function todoIds(app) {
  return app.api.state.todos.map((t) => t.id);
}
function startEdit(app, id) {
  clickBtn(app, id, "edit");
}
function editInput(app, id) {
  const li = liOf(app, id);
  return li && li.querySelector(".edit-input");
}
function pressKey(app, key, target, extra = {}) {
  const evt = { key, target, preventDefault() {}, ...extra };
  app.api.onListKeydown(evt);
  return evt;
}
/* เทียบค่าแบบ JSON — เลี่ยงปัญหา prototype ต่าง realm ระหว่าง array ใน vm context กับ host */
function assertSame(actual, expected, msg) {
  assert.strictEqual(JSON.stringify(actual), JSON.stringify(expected), msg);
}
/* ตัดคอมเมนต์ออกก่อนเช็คการใช้งานจริง (app.js มีคำเตือน "ห้ามใช้ innerHTML" ในคอมเมนต์) */
function stripComments(src) {
  return src.replace(/\/\*[\s\S]*?\*\//g, "").replace(/(^|[^:])\/\/[^\n]*/g, "$1");
}

/* ============================================================
 * US-001 — เพิ่มรายการ
 * ============================================================ */
sectionOf("US-001 เพิ่มรายการ");

test("TC-001.1", "เพิ่มรายการใหม่ปรากฏท้าย list สถานะยังไม่เสร็จ + input เคลียร์ + focus ค้างที่ input", () => {
  const app = loadApp();
  app.api.addTodo("งานแรก");
  app.api.addTodo("งานที่สอง");
  const todos = app.api.state.todos;
  assert.strictEqual(todos.length, 2);
  assert.strictEqual(todos[0].text, "งานแรก");
  assert.strictEqual(todos[1].text, "งานที่สอง");
  assert.strictEqual(todos[0].done, false, "สถานะเริ่มต้นต้องเป็นยังไม่เสร็จ");
  assertSame(listIds(app), todoIds(app), "ลำดับใน list ต้องตรงกับ state (ใหม่อยู่ท้าย)");
  assert.strictEqual(textOf(app, todos[1].id), "งานที่สอง");
  assert.strictEqual(el(app, "todo-input").value, "", "input ต้องถูกเคลียร์");
  assert.strictEqual(app.doc.activeElement, el(app, "todo-input"), "focus ต้องกลับที่ input");
  // id ไม่ซ้ำ
  assert.strictEqual(new Set(todoIds(app)).size, 2, "id ต้องไม่ซ้ำกัน");
});

test("TC-001.2", "ส่งผ่าน form submit (ครอบทั้งปุ่มเพิ่มและ Enter) — preventDefault ถูกเรียก", () => {
  const app = loadApp();
  let prevented = 0;
  el(app, "todo-input").value = "ผ่าน form submit";
  app.api.onAddSubmit({ preventDefault() { prevented++; } });
  assert.strictEqual(prevented, 1, "ต้อง preventDefault กันหน้า reload");
  assert.strictEqual(app.api.state.todos.length, 1);
  assert.strictEqual(app.api.state.todos[0].text, "ผ่าน form submit");
});

test("TC-001.3", "input ว่างกดเพิ่ม → ไม่เพิ่มรายการ + feedback + shake + focus กลับ input", () => {
  const app = loadApp();
  const input = el(app, "todo-input");
  input.value = "";
  app.api.onAddSubmit({ preventDefault() {} });
  assert.strictEqual(app.api.state.todos.length, 0, "ต้องไม่เพิ่มรายการ");
  assert.strictEqual(el(app, "feedback").textContent, "กรุณาพิมพ์สิ่งที่ต้องทำ");
  assert.ok(el(app, "feedback").classList.contains("error"), "feedback ต้องมี class .error");
  assert.ok(input.classList.contains("shake"), "input ต้องสั่น (class .shake)");
  assert.strictEqual(app.doc.activeElement, input, "focus ต้องกลับที่ input");
});

test("TC-001.4", "input มีแต่ whitespace → ถือเป็นค่าว่าง ไม่เพิ่มรายการ", () => {
  const app = loadApp();
  el(app, "todo-input").value = "   ";
  app.api.onAddSubmit({ preventDefault() {} });
  assert.strictEqual(app.api.state.todos.length, 0);
  assert.strictEqual(el(app, "feedback").textContent, "กรุณาพิมพ์สิ่งที่ต้องทำ");
});

test("TC-001.5", "รายการที่เพิ่มถูกบันทึกลง localStorage ทันที (done: false)", () => {
  const app = loadApp();
  app.api.addTodo("บันทึกทันที");
  const arr = stored(app);
  assert.ok(Array.isArray(arr), "ต้องมี key todoapp.todos.v1 หลังเพิ่มทันที");
  assert.strictEqual(arr.length, 1);
  assert.strictEqual(arr[0].text, "บันทึกทันที");
  assert.strictEqual(arr[0].done, false);
  assert.strictEqual(typeof arr[0].createdAt, "string");
});

/* ============================================================
 * US-002 — ลบรายการ
 * ============================================================ */
sectionOf("US-002 ลบรายการ");

test("TC-002.1", "ทุกแถวมีปุ่มลบที่มองเห็นได้ (button จริง มี label ลบ)", () => {
  const app = loadApp();
  seed(app, ["A", "B"]);
  for (const id of todoIds(app)) {
    const btn = btnOf(app, id, "delete");
    assert.ok(btn, "ต้องมีปุ่มลบทุกแถว");
    assert.strictEqual(btn.tagName, "BUTTON", "ปุ่มลบต้องเป็น <button> จริง");
    const label = btn.querySelector(".btn-label");
    assert.strictEqual(label && label.textContent, "ลบ");
    assert.strictEqual(btn.getAttribute("aria-label"), "ลบรายการนี้");
  }
});

test("TC-002.2", "กดปุ่มลบ → รายการหายจาก list ทันที", () => {
  const app = loadApp();
  seed(app, ["A", "B", "C"]);
  const idB = todoIds(app)[1];
  clickBtn(app, idB, "delete");
  assert.strictEqual(app.api.state.todos.length, 2);
  assert.ok(!todoIds(app).includes(idB), "รายการที่ลบต้องหายจาก state");
  assertSame(listIds(app), todoIds(app), "list ต้อง render ใหม่ตาม state ทันที");
});

test("TC-002.3", "รายการที่ลบถูกลบจาก localStorage ด้วย — refresh แล้วไม่กลับมา", () => {
  const app = loadApp();
  seed(app, ["A", "B", "C"]);
  const idB = todoIds(app)[1];
  clickBtn(app, idB, "delete");
  const arr = stored(app);
  assert.ok(arr.every((t) => t.id !== idB), "localStorage ต้องไม่มีรายการที่ลบแล้ว");
  const app2 = reloadPage(app);
  assert.ok(!todoIds(app2).includes(idB), "หลัง refresh รายการที่ลบต้องไม่กลับมา");
  assert.strictEqual(app2.api.state.todos.length, 2);
});

test("TC-002.4", "ลบรายการหนึ่งไม่กระทบรายการอื่น + ลำดับคงเดิม", () => {
  const app = loadApp();
  seed(app, ["A", "B", "C"]);
  const [idA, idB, idC] = todoIds(app);
  clickBtn(app, idB, "delete");
  assertSame(todoIds(app), [idA, idC], "รายการอื่นคงอยู่ครบตามลำดับเดิม");
  assert.strictEqual(textOf(app, idA), "A");
  assert.strictEqual(textOf(app, idC), "C");
});

/* ============================================================
 * US-003 — ติ๊กเครื่องหมายว่าเสร็จแล้ว
 * ============================================================ */
sectionOf("US-003 ติ๊กเสร็จ/ยกเลิก");

test("TC-003.1", "ทุกแถวมี checkbox ที่คลิกได้ (input type=checkbox จริง + aria-label)", () => {
  const app = loadApp();
  seed(app, ["A", "B"]);
  for (const id of todoIds(app)) {
    const cb = liOf(app, id).querySelector(".todo-checkbox");
    assert.ok(cb, "ต้องมี checkbox ทุกแถว");
    assert.strictEqual(cb.tagName, "INPUT");
    assert.strictEqual(cb.type, "checkbox");
    assert.strictEqual(cb.getAttribute("aria-label"), `ทำเครื่องหมายว่าเสร็จแล้ว: ${textOf(app, id)}`);
  }
});

test("TC-003.2", "ติ๊ก → สถานะเสร็จชัดเจน (class .done) + localStorage อัปเดตทันที", () => {
  const app = loadApp();
  seed(app, ["A", "B"]);
  const idA = todoIds(app)[0];
  const cb = liOf(app, idA).querySelector(".todo-checkbox");
  app.api.onListChange({ target: cb });
  const todo = app.api.state.todos.find((t) => t.id === idA);
  assert.strictEqual(todo.done, true, "state ต้องเป็น done");
  const li = liOf(app, idA);
  assert.ok(li.classList.contains("done"), "แถวต้องมี class .done (ขีดฆ่า+สีจาง)");
  assert.strictEqual(li.querySelector(".todo-checkbox").checked, true);
  assert.strictEqual(stored(app).find((t) => t.id === idA).done, true, "localStorage ต้องอัปเดตทันที");
});

test("TC-003.3", "ติ๊กซ้ำ (uncheck) → กลับเป็นยังไม่เสร็จ + localStorage อัปเดต", () => {
  const app = loadApp();
  seed(app, ["A"]);
  const idA = todoIds(app)[0];
  app.api.onListChange({ target: liOf(app, idA).querySelector(".todo-checkbox") });
  app.api.onListChange({ target: liOf(app, idA).querySelector(".todo-checkbox") });
  assert.strictEqual(app.api.state.todos[0].done, false);
  assert.ok(!liOf(app, idA).classList.contains("done"));
  assert.strictEqual(stored(app)[0].done, false);
});

test("TC-003.4", "ติ๊กรายการหนึ่งไม่กระทบรายการอื่น", () => {
  const app = loadApp();
  seed(app, ["A", "B"]);
  const [idA, idB] = todoIds(app);
  app.api.onListChange({ target: liOf(app, idA).querySelector(".todo-checkbox") });
  assert.strictEqual(app.api.state.todos.find((t) => t.id === idB).done, false);
  assert.ok(!liOf(app, idB).classList.contains("done"), "แถวอื่นต้องไม่มี class .done");
});

/* ============================================================
 * US-004 — ข้อมูลคงอยู่หลัง refresh + ข้อมูลเสียหาย
 * ============================================================ */
sectionOf("US-004 localStorage / ข้อมูลเสียหาย");

test("TC-004.1", "refresh → โหลดรายการจาก localStorage พร้อมสถานะเดิมถูกต้อง", () => {
  const app = loadApp();
  seed(app, ["งานเก่า", "งานใหม่"]);
  const idA = todoIds(app)[0];
  app.api.onListChange({ target: liOf(app, idA).querySelector(".todo-checkbox") });
  const app2 = reloadPage(app);
  assertSame(
    app2.api.state.todos.map((t) => ({ text: t.text, done: t.done })),
    [
      { text: "งานเก่า", done: true },
      { text: "งานใหม่", done: false },
    ],
    "ข้อความ + สถานะต้องคงเดิมหลัง refresh"
  );
  assert.ok(liOf(app2, idA).classList.contains("done"), "แถวเสร็จต้องแสดง class .done หลัง refresh");
});

test("TC-004.2", "ลำดับรายการคงเดิมตามที่ผู้ใช้เพิ่มไว้ หลัง refresh", () => {
  const app = loadApp();
  seed(app, ["หนึ่ง", "สอง", "สาม"]);
  const app2 = reloadPage(app);
  assertSame(
    app2.api.state.todos.map((t) => t.text),
    ["หนึ่ง", "สอง", "สาม"]
  );
  assertSame(listIds(app2), todoIds(app2), "ลำดับ DOM ต้องตรงกับ state");
});

test("TC-004.3", "localStorage ว่าง (ครั้งแรก) → empty state เข้าใจง่าย ไม่มี error", () => {
  const app = loadApp();
  app.api.init();
  assertSame(app.api.state.todos, []);
  const list = el(app, "todo-list");
  assert.strictEqual(list.childNodes.length, 1, "ต้องมี empty state 1 แถว");
  assert.strictEqual(list.childNodes[0].textContent, "ยังไม่มีรายการ — เริ่มพิมพ์ด้านบนได้เลย");
  assert.strictEqual(el(app, "feedback").textContent, "", "ต้องไม่แสดง error");
});

test("TC-004.4", "localStorage เสียหาย (JSON ตัดครึ่ง) → ไม่ crash แสดง empty state ทำงานต่อได้", () => {
  const app = loadApp();
  app.storage.setItem(KEY, "{{{ ตัดครึ่ง");
  app.api.init();
  assertSame(app.api.state.todos, []);
  assert.strictEqual(el(app, "todo-list").childNodes[0].textContent, "ยังไม่มีรายการ — เริ่มพิมพ์ด้านบนได้เลย");
  // ทำงานต่อได้: เพิ่มรายการใหม่หลังข้อมูลเสียได้ปกติ
  app.api.addTodo("เพิ่มหลังข้อมูลเสีย");
  assert.strictEqual(app.api.state.todos.length, 1);
});

test("TC-004.5", "localStorage ไม่ใช่ array → คืน [] ไม่ crash", () => {
  const app = loadApp();
  app.storage.setItem(KEY, JSON.stringify("hello"));
  app.api.init();
  assertSame(app.api.state.todos, []);
  app.storage.setItem(KEY, JSON.stringify({ not: "array" }));
  app.api.state.todos = app.api.load();
  assertSame(app.api.state.todos, []);
});

test("TC-004.6", "item โครงสร้างเพี้ยนถูกกรองทิ้ง / item ถูกต้องคงอยู่ + text trim + createdAt ไม่บังคับ", () => {
  const app = loadApp();
  app.storage.setItem(
    KEY,
    JSON.stringify([
      { id: "a", text: "  มีช่องว่าง  ", done: false }, // ถูกต้อง → trim
      { text: 123 }, // ไม่มี id / text ไม่ใช่ string → ทิ้ง
      { id: "", text: "x", done: true }, // id ว่าง → ทิ้ง
      { id: "b", text: "ok", done: "yes" }, // done ไม่ใช่ boolean → ทิ้ง
      { id: "c", text: "เสร็จแล้ว", done: true }, // ถูกต้อง
      { id: "d", text: "ไม่มี createdAt", done: false }, // ถูกต้อง (createdAt เติม "")
      null, // ทิ้ง
      [1, 2], // ไม่ใช่ object → ทิ้ง
    ])
  );
  app.api.init();
  const todos = app.api.state.todos;
  assertSame(
    todos.map((t) => ({ id: t.id, text: t.text, done: t.done, createdAt: t.createdAt })),
    [
      { id: "a", text: "มีช่องว่าง", done: false, createdAt: "" },
      { id: "c", text: "เสร็จแล้ว", done: true, createdAt: "" },
      { id: "d", text: "ไม่มี createdAt", done: false, createdAt: "" },
    ],
    "กรองเฉพาะ item ที่ผ่านเงื่อนไขครบ + trim + createdAt default เป็น empty string"
  );
});

/* ============================================================
 * US-005 — แก้ไขข้อความรายการ
 * ============================================================ */
sectionOf("US-005 แก้ไขข้อความ");

test("TC-005.1", "ปุ่มแก้ไข → เข้าโหมดแก้ไข: input มีข้อความเดิม + focus/select อัตโนมัติ + สลับชุดปุ่ม", () => {
  const app = loadApp();
  seed(app, ["งานเดิม"]);
  const id = todoIds(app)[0];
  startEdit(app, id);
  assert.strictEqual(app.api.state.editingId, id);
  const li = liOf(app, id);
  assert.ok(li.classList.contains("editing"), "แถวต้องมี class .editing");
  const input = li.querySelector(".edit-input");
  assert.ok(input, "ต้องมี input แก้ไข");
  assert.strictEqual(input.value, "งานเดิม", "input ต้องมีข้อความเดิม");
  assert.strictEqual(input._selected, true, "ต้อง select ข้อความอัตโนมัติ");
  assert.strictEqual(app.doc.activeElement, input, "ต้อง focus ที่ input แก้ไข");
  assert.strictEqual(li.querySelector('button[data-action="edit"]'), null, "โหมดแก้ไขต้องซ่อนปุ่มแก้ไข");
  assert.strictEqual(li.querySelector('button[data-action="delete"]'), null, "โหมดแก้ไขต้องซ่อนปุ่มลบ");
  assert.strictEqual(li.querySelector('button[data-action="save"]').querySelector(".btn-label").textContent, "บันทึก");
  assert.strictEqual(li.querySelector('button[data-action="cancel"]').querySelector(".btn-label").textContent, "ยกเลิก");
});

test("TC-005.2", "แก้ไข + Enter → ข้อความใหม่แสดงใน list + บันทึกลง localStorage", () => {
  const app = loadApp();
  seed(app, ["งานเดิม"]);
  const id = todoIds(app)[0];
  startEdit(app, id);
  const input = editInput(app, id);
  input.value = "งานแก้แล้ว";
  pressKey(app, "Enter", input);
  assert.strictEqual(app.api.state.editingId, null, "ต้องออกจากโหมดแก้ไข");
  assert.strictEqual(textOf(app, id), "งานแก้แล้ว", "ข้อความใหม่ต้องแสดงใน list");
  assert.strictEqual(stored(app)[0].text, "งานแก้แล้ว", "localStorage ต้องอัปเดต");
});

test("TC-005.3", "แก้ไขเป็นค่าว่าง/whitespace + Enter → ไม่บันทึก + shake + feedback + ยังอยู่โหมดแก้ไข", () => {
  const app = loadApp();
  seed(app, ["งานเดิม"]);
  const id = todoIds(app)[0];
  startEdit(app, id);
  const input = editInput(app, id);
  input.value = "   ";
  pressKey(app, "Enter", input);
  assert.strictEqual(app.api.state.editingId, id, "ต้องยังอยู่ในโหมดแก้ไข");
  assert.strictEqual(app.api.state.todos[0].text, "งานเดิม", "ต้องไม่บันทึก");
  assert.strictEqual(stored(app)[0].text, "งานเดิม", "localStorage ต้องไม่เปลี่ยน");
  assert.strictEqual(el(app, "feedback").textContent, "กรุณาพิมพ์สิ่งที่ต้องทำ");
  assert.ok(input.classList.contains("shake"), "input ในแถวนั้นต้องสั่น");
});

test("TC-005.4", "Esc ในโหมดแก้ไข → ยกเลิก ข้อความเดิมคงอยู่ ไม่บันทึกลง localStorage", () => {
  const app = loadApp();
  seed(app, ["งานเดิม"]);
  const id = todoIds(app)[0];
  startEdit(app, id);
  const input = editInput(app, id);
  input.value = "พิมพ์ค้างไว้";
  pressKey(app, "Escape", input);
  assert.strictEqual(app.api.state.editingId, null);
  assert.strictEqual(textOf(app, id), "งานเดิม", "ข้อความเดิมต้องคงอยู่");
  assert.strictEqual(stored(app)[0].text, "งานเดิม", "localStorage ต้องไม่เปลี่ยน");
});

test("TC-005.5", "สลับไปแก้รายการอื่น (A→B) ขณะ A มีข้อความ → A บันทึกอัตโนมัติ แล้ว B เข้าโหมดแก้ไข", () => {
  const app = loadApp();
  seed(app, ["A", "B"]);
  const [idA, idB] = todoIds(app);
  startEdit(app, idA);
  editInput(app, idA).value = "A แก้ใหม่";
  startEdit(app, idB); // คลิกแก้ไข B ขณะแก้ A อยู่
  assert.strictEqual(app.api.state.todos.find((t) => t.id === idA).text, "A แก้ใหม่", "A ต้องถูกบันทึกอัตโนมัติ");
  assert.strictEqual(stored(app).find((t) => t.id === idA).text, "A แก้ใหม่", "การบันทึก A ต้องลง localStorage ด้วย");
  assert.strictEqual(app.api.state.editingId, idB, "B ต้องเข้าโหมดแก้ไข");
  assert.ok(editInput(app, idB), "B ต้องแสดง input แก้ไข");
});

test("TC-005.6", "สลับไปแก้รายการอื่น (A→B) ขณะ input A ว่าง → A ยกเลิก (คงข้อความเดิม) แล้ว B เข้าโหมดแก้ไข", () => {
  const app = loadApp();
  seed(app, ["A", "B"]);
  const [idA, idB] = todoIds(app);
  startEdit(app, idA);
  editInput(app, idA).value = "   ";
  startEdit(app, idB);
  assert.strictEqual(app.api.state.todos.find((t) => t.id === idA).text, "A", "A ต้องคงข้อความเดิม (ยกเลิก)");
  assert.strictEqual(app.api.state.editingId, idB);
});

test("TC-005.7", "double-click ข้อความ → เข้าโหมดแก้ไขได้", () => {
  const app = loadApp();
  seed(app, ["งานเดิม"]);
  const id = todoIds(app)[0];
  const span = liOf(app, id).querySelector(".todo-text");
  app.api.onListDblclick({ target: span });
  assert.strictEqual(app.api.state.editingId, id);
  assert.ok(editInput(app, id));
});

test("TC-005.8", "double-click ข้อความที่เสร็จแล้ว → แก้ไขได้ปกติ สถานะ done ไม่เปลี่ยน", () => {
  const app = loadApp();
  seed(app, ["งานเสร็จ"]);
  const id = todoIds(app)[0];
  app.api.onListChange({ target: liOf(app, id).querySelector(".todo-checkbox") });
  app.api.onListDblclick({ target: liOf(app, id).querySelector(".todo-text") });
  assert.strictEqual(app.api.state.editingId, id, "รายการที่เสร็จแล้วต้องเข้าโหมดแก้ไขได้");
  assert.strictEqual(app.api.state.todos[0].done, true, "สถานะ done ต้องไม่เปลี่ยน");
});

test("TC-005.9", "ปุ่มยกเลิกในโหมดแก้ไข → ข้อความเดิมคงอยู่ ไม่บันทึก + focus กลับปุ่มแก้ไข", () => {
  const app = loadApp();
  seed(app, ["งานเดิม"]);
  const id = todoIds(app)[0];
  startEdit(app, id);
  editInput(app, id).value = "ที่พิมพ์ค้าง";
  clickBtn(app, id, "cancel");
  assert.strictEqual(app.api.state.editingId, null);
  assert.strictEqual(textOf(app, id), "งานเดิม");
  assert.strictEqual(stored(app)[0].text, "งานเดิม");
  assert.strictEqual(app.doc.activeElement, btnOf(app, id, "edit"), "focus ต้องกลับที่ปุ่มแก้ไข");
});

test("TC-005.10", "ปุ่มบันทึกในโหมดแก้ไข → บันทึกได้ / ถ้าว่าง → อยู่โหมดแก้ไขต่อ", () => {
  const app = loadApp();
  seed(app, ["งานเดิม"]);
  const id = todoIds(app)[0];
  startEdit(app, id);
  editInput(app, id).value = "แก้ผ่านปุ่มบันทึก";
  clickBtn(app, id, "save");
  assert.strictEqual(textOf(app, id), "แก้ผ่านปุ่มบันทึก");
  assert.strictEqual(stored(app)[0].text, "แก้ผ่านปุ่มบันทึก");
  // กรณีว่าง
  startEdit(app, id);
  editInput(app, id).value = "";
  clickBtn(app, id, "save");
  assert.strictEqual(app.api.state.editingId, id, "แก้เป็นค่าว่างต้องอยู่โหมดแก้ไขต่อ");
  assert.strictEqual(el(app, "feedback").textContent, "กรุณาพิมพ์สิ่งที่ต้องทำ");
});

test("TC-005.11", "แก้ไขเป็นข้อความเดิมเป๊ะ ๆ → บันทึกได้ปกติ", () => {
  const app = loadApp();
  seed(app, ["งานเดิม"]);
  const id = todoIds(app)[0];
  startEdit(app, id);
  pressKey(app, "Enter", editInput(app, id)); // ไม่แก้ค่า
  assert.strictEqual(app.api.state.editingId, null, "ถือเป็นการยืนยัน ต้องออกจากโหมดแก้ไข");
  assert.strictEqual(textOf(app, id), "งานเดิม");
});

test("TC-005.12", "Esc ในโหมดแก้ไข → focus กลับที่ปุ่มแก้ไขของแถวเดิม (เช่นเดียวกับปุ่มยกเลิก — O-2)", () => {
  const app = loadApp();
  seed(app, ["A", "B"]);
  const [idA, idB] = todoIds(app);
  startEdit(app, idA);
  editInput(app, idA).value = "พิมพ์ค้างไว้";
  pressKey(app, "Escape", editInput(app, idA));
  assert.strictEqual(app.api.state.editingId, null, "ต้องออกจากโหมดแก้ไข");
  assert.strictEqual(textOf(app, idA), "A", "ข้อความเดิมคงอยู่");
  assert.strictEqual(
    app.doc.activeElement,
    btnOf(app, idA, "edit"),
    "focus ต้องกลับที่ปุ่มแก้ไขของแถวเดิม (แถว A) ไม่ใช่แถวอื่น"
  );
  assert.notStrictEqual(app.doc.activeElement, btnOf(app, idB, "edit"), "ต้องไม่ focus ปุ่มแก้ไขของแถวอื่น");
});

/* ============================================================
 * US-006 — ลบรายการที่เสร็จแล้วทั้งหมด + custom modal
 * ============================================================ */
sectionOf("US-006 ลบรายการที่เสร็จแล้ว + custom modal");

test("TC-006.1", "ปุ่ม clear completed: disabled เมื่อไม่มีรายการเสร็จ / enabled เมื่อมี ≥ 1", () => {
  const app = loadApp();
  app.api.init();
  assert.strictEqual(el(app, "clear-completed-btn").disabled, true, "ไม่มีรายการเสร็จ → disabled (attribute จริง)");
  seed(app, ["A", "B"]);
  assert.strictEqual(el(app, "clear-completed-btn").disabled, true, "ยังไม่มีรายการเสร็จ → disabled");
  app.api.onListChange({ target: liOf(app, todoIds(app)[0]).querySelector(".todo-checkbox") });
  assert.strictEqual(el(app, "clear-completed-btn").disabled, false, "มีรายการเสร็จ 1 → enabled");
});

test("TC-006.2", "กด clear completed → custom modal แสดงก่อนเสมอ ข้อความระบุจำนวนจริง + state ยังไม่เปลี่ยน", () => {
  const app = loadApp();
  seed(app, ["A", "B", "C"]);
  const idA = todoIds(app)[0];
  const idB = todoIds(app)[1];
  app.api.onListChange({ target: liOf(app, idA).querySelector(".todo-checkbox") });
  app.api.onListChange({ target: liOf(app, idB).querySelector(".todo-checkbox") });
  app.api.clearCompleted();
  assert.strictEqual(el(app, "modal-backdrop").hidden, false, "modal ต้องแสดง (custom modal ไม่ใช่ native dialog)");
  assert.strictEqual(
    el(app, "modal-text").textContent,
    "ต้องการลบรายการที่เสร็จแล้ว 2 รายการหรือไม่?",
    "ข้อความต้องระบุจำนวนจริง"
  );
  assert.strictEqual(app.api.state.todos.length, 3, "ยังไม่ยืนยัน → state ต้องไม่เปลี่ยน");
  assert.strictEqual(stored(app).length, 3, "localStorage ต้องไม่เปลี่ยน");
});

test("TC-006.3", "เปิด modal → focus อยู่ที่ปุ่ม 'ยกเลิก' ก่อน (ปุ่มปลอดภัย)", () => {
  const app = loadApp();
  seed(app, ["A"]);
  app.api.onListChange({ target: liOf(app, todoIds(app)[0]).querySelector(".todo-checkbox") });
  app.api.clearCompleted();
  assert.strictEqual(app.doc.activeElement, el(app, "modal-cancel"));
});

test("TC-006.4", "กดยืนยัน → รายการเสร็จหายหมด รายการค้างคงอยู่ครบ + localStorage อัปเดตทันที", () => {
  const app = loadApp();
  seed(app, ["A", "B", "C"]);
  const [idA, idB, idC] = todoIds(app);
  app.api.onListChange({ target: liOf(app, idA).querySelector(".todo-checkbox") });
  app.api.onListChange({ target: liOf(app, idB).querySelector(".todo-checkbox") });
  app.api.clearCompleted();
  app.api.confirmModalAction();
  assertSame(todoIds(app), [idC], "เหลือเฉพาะรายการที่ยังไม่เสร็จ");
  assertSame(
    stored(app).map((t) => t.id),
    [idC],
    "localStorage ต้องอัปเดตทันที"
  );
  assert.strictEqual(el(app, "modal-backdrop").hidden, true, "modal ต้องปิด");
  assert.strictEqual(el(app, "clear-completed-btn").disabled, true, "หลังลบหมด ปุ่มต้องกลับเป็น disabled");
});

test("TC-006.5", "กดปุ่มยกเลิกใน modal → ไม่มีอะไรเปลี่ยนแปลง (list + localStorage เดิม)", () => {
  const app = loadApp();
  app.api.init(); // ต้อง init ก่อน เพื่อให้ wireEvents ผูกปุ่มใน modal
  seed(app, ["A", "B"]);
  app.api.onListChange({ target: liOf(app, todoIds(app)[0]).querySelector(".todo-checkbox") });
  app.api.clearCompleted();
  const cancelHandlers = el(app, "modal-cancel").listeners.click;
  assert.ok(cancelHandlers && cancelHandlers.length > 0, "ปุ่มยกเลิกต้องถูกผูก event ไว้");
  cancelHandlers[0](); // คลิกปุ่มยกเลิกจริง
  assert.strictEqual(el(app, "modal-backdrop").hidden, true, "modal ต้องปิด");
  assert.strictEqual(app.api.state.todos.length, 2, "state ต้องไม่เปลี่ยน");
  assert.strictEqual(stored(app).length, 2, "localStorage ต้องไม่เปลี่ยน");
  assert.strictEqual(app.api.state.todos[0].done, true, "สถานะเสร็จต้องคงเดิม");
});

test("TC-006.6", "กด Esc ใน modal → ปิด modal ถือเป็นยกเลิก ไม่มีอะไรเปลี่ยนแปลง", () => {
  const app = loadApp();
  seed(app, ["A"]);
  app.api.onListChange({ target: liOf(app, todoIds(app)[0]).querySelector(".todo-checkbox") });
  app.api.clearCompleted();
  let prevented = 0;
  app.api.onDocumentKeydown({ key: "Escape", preventDefault() { prevented++; } });
  assert.strictEqual(prevented, 1);
  assert.strictEqual(el(app, "modal-backdrop").hidden, true);
  assert.strictEqual(app.api.state.todos.length, 1);
  assert.strictEqual(stored(app)[0].done, true, "localStorage ต้องไม่เปลี่ยน");
});

test("TC-006.7", "คลิก backdrop → ปิด modal ถือเป็นยกเลิก / คลิกเนื้อหาใน dialog → ไม่ปิด", () => {
  const app = loadApp();
  seed(app, ["A"]);
  app.api.onListChange({ target: liOf(app, todoIds(app)[0]).querySelector(".todo-checkbox") });
  app.api.clearCompleted();
  app.api.onBackdropClick({ target: el(app, "modal-backdrop") });
  assert.strictEqual(el(app, "modal-backdrop").hidden, true, "คลิก backdrop ต้องปิด");
  assert.strictEqual(app.api.state.todos.length, 1, "ต้องไม่ลบ");
  // เปิดใหม่แล้วคลิกที่ dialog content — ต้องไม่ปิด
  app.api.clearCompleted();
  app.api.onBackdropClick({ target: el(app, "modal-text") });
  assert.strictEqual(el(app, "modal-backdrop").hidden, false, "คลิกเนื้อหาใน dialog ต้องไม่ปิด modal");
  app.api.onBackdropClick({ target: el(app, "modal-backdrop") }); // เก็บกวาด
});

test("TC-006.8", "focus trap: Tab/Shift+Tab วนอยู่เฉพาะปุ่มยืนยัน/ยกเลิกของ modal", () => {
  const app = loadApp();
  seed(app, ["A"]);
  app.api.onListChange({ target: liOf(app, todoIds(app)[0]).querySelector(".todo-checkbox") });
  app.api.clearCompleted();
  app.doc.activeElement = el(app, "modal-cancel");
  app.api.onDocumentKeydown({ key: "Tab", shiftKey: false, preventDefault() {} });
  assert.strictEqual(app.doc.activeElement, el(app, "modal-confirm"), "Tab จากยกเลิก → ยืนยัน");
  app.api.onDocumentKeydown({ key: "Tab", shiftKey: false, preventDefault() {} });
  assert.strictEqual(app.doc.activeElement, el(app, "modal-cancel"), "Tab จากยืนยัน → วนกลับยกเลิก");
  app.api.onDocumentKeydown({ key: "Tab", shiftKey: true, preventDefault() {} });
  assert.strictEqual(app.doc.activeElement, el(app, "modal-confirm"), "Shift+Tab จากยกเลิก → ยืนยัน (วนย้อน)");
});

test("TC-006.9", "ปิด modal → Esc/ยกเลิก: focus กลับปุ่ม clear / ยืนยัน: focus ไป todo-input (O-1)", () => {
  const app = loadApp();
  seed(app, ["A"]);
  app.api.onListChange({ target: liOf(app, todoIds(app)[0]).querySelector(".todo-checkbox") });
  app.doc.activeElement = el(app, "clear-completed-btn");
  app.api.clearCompleted();
  app.api.onDocumentKeydown({ key: "Escape", preventDefault() {} });
  assert.strictEqual(app.doc.activeElement, el(app, "clear-completed-btn"), "ปิดด้วย Esc → focus กลับปุ่ม clear (ยัง enabled)");
  // ปิดด้วยปุ่มยืนยัน: หลังยืนยัน ปุ่ม clear กลายเป็น disabled (ไม่เหลือรายการเสร็จ)
  // focus ที่คืนกลับจะหลุดไป body → แอปต้องย้าย focus ไป todo-input แทน (O-1)
  app.api.clearCompleted();
  app.api.confirmModalAction();
  assert.strictEqual(el(app, "clear-completed-btn").disabled, true, "หลังยืนยัน ปุ่ม clear ต้อง disabled");
  assert.strictEqual(
    app.doc.activeElement,
    el(app, "todo-input"),
    "ปิดด้วยยืนยัน → focus ต้องไปที่ todo-input ไม่หลุดไป body"
  );
});

test("TC-006.10", "ไม่ใช้ window.confirm — grep ใน app.js ต้องไม่พบ", () => {
  const app = loadApp();
  assert.ok(!/window\.confirm/.test(app.source), "ห้ามใช้ window.confirm ตามข้อ C-1");
});

/* ============================================================
 * US-007 — นับจำนวนรายการค้าง/เสร็จ
 * ============================================================ */
sectionOf("US-007 นับจำนวนค้าง/เสร็จ");

test("TC-007.1", "ตัวเลขอัปเดตทันทีเมื่อ เพิ่ม/ติ๊ก/ลบ/clear completed", () => {
  const app = loadApp();
  app.api.init();
  assert.strictEqual(el(app, "count-pending").textContent, "ค้าง: 0");
  assert.strictEqual(el(app, "count-done").textContent, "เสร็จแล้ว: 0");
  app.api.addTodo("A");
  app.api.addTodo("B");
  assert.strictEqual(el(app, "count-pending").textContent, "ค้าง: 2");
  const idA = todoIds(app)[0];
  app.api.onListChange({ target: liOf(app, idA).querySelector(".todo-checkbox") });
  assert.strictEqual(el(app, "count-pending").textContent, "ค้าง: 1");
  assert.strictEqual(el(app, "count-done").textContent, "เสร็จแล้ว: 1");
  app.api.deleteTodo(idA); // ลบรายการที่เสร็จ
  assert.strictEqual(el(app, "count-pending").textContent, "ค้าง: 1");
  assert.strictEqual(el(app, "count-done").textContent, "เสร็จแล้ว: 0");
  // clear completed ผ่าน modal
  app.api.onListChange({ target: liOf(app, todoIds(app)[0]).querySelector(".todo-checkbox") });
  app.api.clearCompleted();
  app.api.confirmModalAction();
  assert.strictEqual(el(app, "count-pending").textContent, "ค้าง: 0");
  assert.strictEqual(el(app, "count-done").textContent, "เสร็จแล้ว: 0");
});

test("TC-007.2", "ตัวเลขถูกต้องตรงกับ list หลัง refresh", () => {
  const app = loadApp();
  seed(app, ["A", "B", "C"]);
  app.api.onListChange({ target: liOf(app, todoIds(app)[0]).querySelector(".todo-checkbox") });
  const app2 = reloadPage(app);
  assert.strictEqual(el(app2, "count-pending").textContent, "ค้าง: 2");
  assert.strictEqual(el(app2, "count-done").textContent, "เสร็จแล้ว: 1");
});

test("TC-007.3", "ไม่มีรายการเลย → แสดง ค้าง: 0 / เสร็จแล้ว: 0", () => {
  const app = loadApp();
  app.api.init();
  assert.strictEqual(el(app, "count-pending").textContent, "ค้าง: 0");
  assert.strictEqual(el(app, "count-done").textContent, "เสร็จแล้ว: 0");
});

/* ============================================================
 * Edge cases (docs/04-spec.md ข้อ 9) + ความปลอดภัย
 * ============================================================ */
sectionOf("Edge cases / ความปลอดภัย");

test("TC-E.1", "ข้อความมี HTML/JS → แสดงเป็นข้อความธรรมดา (textContent) ไม่ execute", () => {
  const app = loadApp();
  const payload = '<img src=x onerror=alert(1)>';
  app.api.addTodo(payload);
  const span = liOf(app, todoIds(app)[0]).querySelector(".todo-text");
  assert.strictEqual(span.textContent, payload, "ต้องแสดงเป็นข้อความตรง ๆ");
  assert.strictEqual(span.childNodes.length, 0, "ห้ามมี element ลูกถูกสร้างจากข้อความผู้ใช้");
});

test("TC-E.2", "localStorage เขียนไม่ได้ (quota เต็ม/ถูก block) → ไม่ crash + แจ้งเตือน + state ยังใช้ได้", () => {
  const app = loadApp({ storage: { setItemThrows: true } });
  app.api.addTodo("งานใน session");
  assert.strictEqual(app.api.state.todos.length, 1, "state ใน memory ต้องยังถูกต้อง");
  assert.strictEqual(el(app, "feedback").textContent, "บันทึกไม่สำเร็จ — ข้อมูลจะหายเมื่อปิดหน้านี้");
  assert.strictEqual(app.storage.getItem(KEY), null, "ยืนยันว่าเขียนลง storage ไม่สำเร็จจริง");
});

test("TC-E.3", "localStorage อ่านไม่ได้ (ถูกปิด/private mode) → load() คืน [] ไม่ crash", () => {
  const app = loadApp({ storage: { getItemThrows: true } });
  assertSame(app.api.load(), []);
});

test("TC-E.4", "app.js ห้ามมี innerHTML / insertAdjacentHTML / document.write / window.confirm (นับเฉพาะโค้ด ไม่นับคอมเมนต์)", () => {
  const app = loadApp();
  const code = stripComments(app.source);
  assert.ok(!/\.innerHTML|insertAdjacentHTML|document\.write|window\.confirm/.test(code),
    "โค้ดจริงห้ามใช้ innerHTML/insertAdjacentHTML/document.write/window.confirm");
});

test("TC-E.5", "ลบรายการที่กำลังแก้ไขอยู่ (path อื่น) → editingId ต้องถูกเคลียร์", () => {
  const app = loadApp();
  seed(app, ["A"]);
  const id = todoIds(app)[0];
  startEdit(app, id);
  app.api.deleteTodo(id);
  assert.strictEqual(app.api.state.editingId, null, "editingId ต้องถูกเคลียร์");
  assert.strictEqual(app.api.state.todos.length, 0);
});

test("TC-E.6", "refresh ระหว่างโหมดแก้ไข → editingId ไม่ persist หลังโหลดไม่มีแถวอยู่โหมดแก้ไข", () => {
  const app = loadApp();
  seed(app, ["A"]);
  startEdit(app, todoIds(app)[0]);
  const app2 = reloadPage(app);
  assert.strictEqual(app2.api.state.editingId, null);
  const editingLi = el(app2, "todo-list").childNodes.find((n) => n.classList.contains("editing"));
  assert.ok(!editingLi, "หลัง refresh ต้องไม่มีแถวอยู่โหมดแก้ไข");
});

test("TC-E.7", "event delegation บน ul ครบ + ไม่ผูก listener ต่อรายการใน render()", () => {
  const app = loadApp();
  app.api.init();
  const listListeners = Object.keys(el(app, "todo-list").listeners);
  for (const type of ["change", "click", "dblclick", "keydown", "focusout", "mousedown"]) {
    assert.ok(listListeners.includes(type), `ul ต้องผูก event ${type}`);
  }
  assert.ok(el(app, "add-form").listeners.submit, "form ต้องผูก submit");
  assert.ok(app.doc.listeners.keydown, "document ต้องผูก keydown (modal Esc/Tab)");
  seed(app, ["A", "B"]);
  for (const li of el(app, "todo-list").childNodes) {
    assert.strictEqual(Object.keys(li.listeners).length, 0, "ห้ามผูก listener ต่อรายการ (ต้องเป็น delegation)");
  }
});

test("TC-E.8", "ติ๊ก checkbox ขณะอยู่โหมดแก้ไขอีกแถว → บันทึกแถวที่แก้ก่อน แล้ว toggle สำเร็จ (edge 9.7)", () => {
  const app = loadApp();
  seed(app, ["A", "B"]);
  const [idA, idB] = todoIds(app);
  startEdit(app, idA);
  editInput(app, idA).value = "A แก้ค้าง";
  // blur ไป checkbox ของ B (relatedTarget อยู่คนละแถว) → ต้องบันทึก A ก่อน
  app.api.onListFocusout({
    target: editInput(app, idA),
    relatedTarget: liOf(app, idB).querySelector(".todo-checkbox"),
  });
  assert.strictEqual(app.api.state.todos.find((t) => t.id === idA).text, "A แก้ค้าง", "blur ต้องบันทึก A อัตโนมัติ");
  // จากนั้น change ของ checkbox B → toggle ตามปกติ
  app.api.onListChange({ target: liOf(app, idB).querySelector(".todo-checkbox") });
  assert.strictEqual(app.api.state.todos.find((t) => t.id === idB).done, true, "toggle B ต้องสำเร็จ");
  assert.strictEqual(app.api.state.todos.find((t) => t.id === idA).text, "A แก้ค้าง", "ข้อความ A ต้องคงอยู่");
});

test("TC-E.9", "Esc แล้ว blur ตามมา → ต้องยกเลิกเท่านั้น ห้ามบันทึก (edge 9.5)", () => {
  const app = loadApp();
  seed(app, ["A"]);
  const id = todoIds(app)[0];
  startEdit(app, id);
  const input = editInput(app, id);
  input.value = "ไม่ควรถูกบันทึก";
  pressKey(app, "Escape", input);
  // blur ตามมาหลัง Esc
  app.api.onListFocusout({ target: input, relatedTarget: null });
  assert.strictEqual(app.api.state.todos[0].text, "A", "ห้ามบันทึกข้อความที่พิมพ์ค้างหลัง Esc");
  assert.strictEqual(stored(app)[0].text, "A");
});

test("TC-E.10", "blur ไปปุ่มในแถวเดียวกัน (เช่น Tab ไปปุ่มบันทึก) → ยังไม่จบโหมดแก้ไข", () => {
  const app = loadApp();
  seed(app, ["A"]);
  const id = todoIds(app)[0];
  startEdit(app, id);
  const input = editInput(app, id);
  input.value = "ยังไม่กดบันทึก";
  app.api.onListFocusout({
    target: input,
    relatedTarget: liOf(app, id).querySelector('button[data-action="save"]'),
  });
  assert.strictEqual(app.api.state.editingId, id, "focus ย้ายภายในแถวเดียวกัน → โหมดแก้ไขต้องคงอยู่");
  assert.strictEqual(app.api.state.todos[0].text, "A", "ยังไม่บันทึก");
});

/* ============================================================
 * รันเทสทั้งหมด
 * ============================================================ */
let pass = 0;
const failed = [];
for (const r of results) {
  try {
    r.fn();
    pass++;
    console.log(`PASS  ${r.id} — ${r.name}`);
  } catch (e) {
    failed.push({ ...r, error: e });
    console.log(`FAIL  ${r.id} — ${r.name}`);
    console.log(`      ${String(e.message).split("\n").join("\n      ")}`);
  }
}
console.log("\n============================================================");
console.log(`รวมทั้งหมด: ${results.length} | ผ่าน: ${pass} | ไม่ผ่าน: ${failed.length}`);
console.log("============================================================");
if (failed.length > 0) {
  console.log("\nรายการที่ไม่ผ่าน:");
  for (const f of failed) console.log(`- ${f.id} (${f.section})`);
  process.exit(1);
}
