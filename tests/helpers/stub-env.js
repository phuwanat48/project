"use strict";
/* ============================================================
 * stub-env.js — สภาพแวดล้อมจำลองสำหรับรัน app.js ใน Node ล้วน
 *  - stub DOM ขั้นต่ำ (createElement/closest/querySelector/classList/...)
 *  - stub localStorage (ปรับให้ throw ได้เพื่อทดสอบ quota/storage ถูกปิด)
 *  - รัน app.js ผ่าน vm.runInContext เพื่อใช้โค้ดจริง ไม่ copy  logic
 * ============================================================ */

const fs = require("fs");
const path = require("path");
const vm = require("vm");
const { webcrypto } = require("crypto");

const APP_PATH = path.join(__dirname, "..", "..", "app.js");

/* id ของ element ที่ app.js ค้นหาตอนโหลด → ต้องมีครบใน stub document */
const ELEMENT_TAGS = {
  "add-form": "form",
  "todo-input": "input",
  feedback: "p",
  "todo-list": "ul",
  "count-pending": "span",
  "count-done": "span",
  "clear-completed-btn": "button",
  "modal-backdrop": "div",
  "modal-text": "p",
  "modal-confirm": "button",
  "modal-cancel": "button",
};

/* ---------- selector matcher ขั้นต่ำ: tag / .class / [attr] / [attr="value"] ---------- */
function matches(el, selector) {
  if (typeof selector !== "string") return false;
  const tagMatch = selector.match(/^[a-zA-Z][a-zA-Z0-9-]*/);
  if (tagMatch && el.tagName !== tagMatch[0].toUpperCase()) return false;
  const classMatches = selector.match(/\.[A-Za-z0-9_-]+/g) || [];
  for (const c of classMatches) {
    if (!el.classList.contains(c.slice(1))) return false;
  }
  const attrRegex = /\[([^\]=]+)(?:=["']?([^\]"']*)["']?)?\]/g;
  let m;
  while ((m = attrRegex.exec(selector)) !== null) {
    const name = m[1];
    const expected = m[2];
    const prop = name.replace(/^data-/, "");
    const actual = el.dataset[prop];
    if (actual === undefined) return false;
    if (expected !== undefined && String(actual) !== expected) return false;
  }
  return true;
}

function removeFromParent(el) {
  const p = el.parentNode;
  if (!p) return;
  const i = p.childNodes.indexOf(el);
  if (i !== -1) p.childNodes.splice(i, 1);
  el.parentNode = null;
}

/* ---------- stub element ---------- */
function createElement(doc, tag) {
  const el = {
    tagName: String(tag).toUpperCase(),
    id: "",
    type: "",
    value: "",
    checked: false,
    hidden: false,
    disabled: false,
    className: "",
    dataset: {},
    attributes: {},
    offsetWidth: 100, // สำหรับ void el.offsetWidth ใน shake()
    parentNode: null,
    childNodes: [],
    listeners: {},
    _doc: doc,
    _selected: false, // บันทึกว่า select() ถูกเรียก (โหมดแก้ไขต้อง select อัตโนมัติ)
  };

  el.classList = {
    add(...names) {
      const set = new Set(el.className.split(/\s+/).filter(Boolean));
      names.forEach((n) => set.add(n));
      el.className = [...set].join(" ");
    },
    remove(...names) {
      const set = new Set(el.className.split(/\s+/).filter(Boolean));
      names.forEach((n) => set.delete(n));
      el.className = [...set].join(" ");
    },
    contains(name) {
      return el.className.split(/\s+/).includes(name);
    },
  };

  Object.defineProperty(el, "children", { get: () => el.childNodes });

  // ตามพฤติกรรม DOM จริง: ตั้ง textContent = ล้าง children ทั้งหมด
  Object.defineProperty(el, "textContent", {
    get() {
      return el._text == null ? "" : el._text;
    },
    set(v) {
      for (const c of el.childNodes) c.parentNode = null;
      el.childNodes = [];
      el._text = String(v);
    },
  });

  el.appendChild = function (child) {
    if (child.parentNode) removeFromParent(child);
    child.parentNode = el;
    el.childNodes.push(child);
    return child;
  };
  el.removeChild = function (child) {
    removeFromParent(child);
    return child;
  };
  el.replaceWith = function (replacement) {
    const p = el.parentNode;
    if (!p) return;
    const i = p.childNodes.indexOf(el);
    if (replacement.parentNode) removeFromParent(replacement);
    p.childNodes[i] = replacement;
    replacement.parentNode = p;
    el.parentNode = null;
  };
  el.remove = function () {
    removeFromParent(el);
  };
  el.closest = function (selector) {
    let cur = el;
    while (cur) {
      if (matches(cur, selector)) return cur;
      cur = cur.parentNode;
    }
    return null;
  };
  el.querySelector = function (selector) {
    for (const c of el.childNodes) {
      if (matches(c, selector)) return c;
      const found = c.querySelector(selector);
      if (found) return found;
    }
    return null;
  };
  el.querySelectorAll = function (selector) {
    const out = [];
    const walk = (node) => {
      for (const c of node.childNodes) {
        if (matches(c, selector)) out.push(c);
        walk(c);
      }
    };
    walk(el);
    return out;
  };
  el.contains = function (other) {
    let cur = other;
    while (cur) {
      if (cur === el) return true;
      cur = cur.parentNode;
    }
    return false;
  };
  el.focus = function () {
    doc.activeElement = el;
  };
  el.select = function () {
    el._selected = true;
  };
  el.setAttribute = function (k, v) {
    el.attributes[k] = String(v);
  };
  el.getAttribute = function (k) {
    return k in el.attributes ? el.attributes[k] : null;
  };
  el.addEventListener = function (t, fn) {
    (el.listeners[t] = el.listeners[t] || []).push(fn);
  };
  return el;
}

/* ---------- stub document ---------- */
function createDocument() {
  const doc = { listeners: {} };
  doc.body = createElement(doc, "body");
  doc.activeElement = doc.body;
  doc.createElement = (tag) => createElement(doc, tag);
  doc.getElementById = (id) => (doc._ids && doc._ids[id]) || null;
  doc.addEventListener = (t, fn) => {
    (doc.listeners[t] = doc.listeners[t] || []).push(fn);
  };
  doc._ids = {};
  for (const [id, tag] of Object.entries(ELEMENT_TAGS)) {
    const el = createElement(doc, tag);
    el.id = id;
    doc._ids[id] = el;
  }
  return doc;
}

/* ---------- stub localStorage ---------- */
function createLocalStorage(opts = {}) {
  const map = new Map();
  return {
    _map: map,
    getItem(key) {
      if (opts.getItemThrows) throw new Error("Storage blocked");
      return map.has(key) ? map.get(key) : null;
    },
    setItem(key, value) {
      if (opts.setItemThrows) throw new Error("Quota exceeded");
      map.set(key, String(value));
    },
    removeItem(key) {
      map.delete(key);
    },
    clear() {
      map.clear();
    },
    key(i) {
      return [...map.keys()][i] ?? null;
    },
    get length() {
      return map.size;
    },
  };
}

/* ---------- โหลด app.js จริงเข้า sandbox ---------- */
function loadApp(opts = {}) {
  const doc = createDocument();
  const storage = createLocalStorage(opts.storage || {});
  const sandbox = {
    document: doc,
    localStorage: storage,
    crypto: webcrypto,
    console,
  };
  vm.createContext(sandbox);
  const source = fs.readFileSync(APP_PATH, "utf8");
  vm.runInContext(source, sandbox, { filename: "app.js" });

  // ดึง reference ของ state/functions (const อยู่ใน global lexical env ของ context)
  const api = vm.runInContext(
    `({
      state, els, MSG, STORAGE_KEY,
      load, save, commit, addTodo, deleteTodo, toggleTodo, editTodo, clearCompleted,
      sanitizeText, validateTodos, render, renderList, renderCounter, renderClearButton,
      showFeedback, clearFeedback, startEdit, finishEditing, saveEditing, cancelEditing,
      openConfirmModal, closeConfirmModal, confirmModalAction, trapModalTab,
      onAddSubmit, onListChange, onListClick, onListDblclick, onListKeydown,
      onListFocusout, onListMousedown, onBackdropClick, onDocumentKeydown,
      wireEvents, init, genId, findLiById, createTodoItem,
    })`,
    sandbox
  );
  return { doc, storage, api, source };
}

/* จำลอง "refresh หน้า": อ่านข้อมูลเดิมจาก storage → แอปใหม่ (state/DOM ใหม่) → init() */
function reloadPage(app) {
  const raw = app.storage.getItem(app.api.STORAGE_KEY);
  const app2 = loadApp();
  if (raw !== null) app2.storage.setItem(app2.api.STORAGE_KEY, raw);
  app2.api.init();
  return app2;
}

module.exports = { loadApp, reloadPage, matches };
