# QA Report — เว็บ Todo List

> เจ้าของไฟล์: qa | วันที่ตรวจ: 2026-10-30
> อ้างอิง: `docs/01-backlog.md` (US-001–US-007), `docs/04-spec.md` (รวม T-008 custom modal และ edge cases ข้อ 9)
> โค้ดที่ตรวจ: `index.html`, `styles.css`, `app.js`

---

## 1. วิธีการทดสอบ

- **เทสอัตโนมัติ (รันด้วย Node ล้วน):** `node tests/app.test.js` — โหลด `app.js` จริงเข้า sandbox ผ่าน `vm.runInContext` พร้อม stub DOM + stub localStorage (`tests/helpers/stub-env.js`) จึงทดสอบ logic จริงทุกฟังก์ชัน (load/save/actions/edit flow/modal) ได้โดยไม่ต้องเปิดเบราว์เซอร์ และไม่ต้องแก้โค้ดหลัก
- **ข้อจำกัดของเทสอัตโนมัติ:** ไม่ได้รันในเบราว์เซอร์จริง จึง**ไม่ครอบคลุม** สิ่งที่ต้องตรวจด้วยเบราว์เซอร์/ตาด้วยตา (แนะนำให้ dev/writer ตรวจซ้ำก่อนส่งมอบ):
  - CSS/visual ทั้งหมด: `.done` ขีดฆ่า+สีจาง, `.shake` animation 250ms, `prefers-reduced-motion`, focus ring, responsive < 768px (ปุ่ม icon-only ✎/🗑, ปุ่มเพิ่มเต็มความกว้าง), touch target ≥ 44px, คอนทราสต์ ≥ 4.5:1
  - พฤติกรรม focus จริงของเบราว์เซอร์ (blur/focusout จริง, Tab order จริง, select() ของ input)
  - การเปิดผ่าน `file://` และ static hosting
- สิ่งที่ stub ตรวจแทนได้: โครงสร้าง DOM, class สถานะ, attribute (`disabled`, `aria-label`, `hidden`), ลำดับ event handler, state + localStorage ครบทุกขั้นตอน

## 2. ตาราง Test Cases

ผลจริงทุกข้อ = ตรงตามผลที่คาดหวัง (PASS) เว้นแต่ระบุเป็นอย่างอื่น

### US-001 เพิ่มรายการ

| ID | เชื่อมกับ | ขั้นตอน | ผลที่คาดหวัง | ผลจริง |
|---|---|---|---|---|
| TC-001.1 | US-001 AC1, AC2 | `addTodo()` 2 ครั้ง | รายการปรากฏท้าย list, done=false, input เคลียร์, focus ค้างที่ input, id ไม่ซ้ำ | PASS |
| TC-001.2 | US-001 AC1 | ส่งผ่าน `onAddSubmit` (form submit — กลไกเดียวกันของปุ่มเพิ่มและ Enter) | preventDefault ถูกเรียก + เพิ่มรายการได้ | PASS |
| TC-001.3 | US-001 AC3 | input ว่าง → submit | ไม่เพิ่มรายการ + feedback `กรุณาพิมพ์สิ่งที่ต้องทำ` (.error) + input มี class .shake + focus กลับ input | PASS |
| TC-001.4 | US-001 AC3, spec 9.11 | input = `"   "` → submit | ถือเป็นค่าว่าง ไม่เพิ่มรายการ + feedback เดียวกัน | PASS |
| TC-001.5 | US-001 AC4 | เพิ่มรายการแล้วอ่าน localStorage ทันที | key `todoapp.todos.v1` มีรายการใหม่ (text, done:false, createdAt) ทันที | PASS |

### US-002 ลบรายการ

| ID | เชื่อมกับ | ขั้นตอน | ผลที่คาดหวัง | ผลจริง |
|---|---|---|---|---|
| TC-002.1 | US-002 AC1 | ตรวจทุกแถว | มีปุ่มลบเป็น `<button>` จริง label `ลบ` + aria-label `ลบรายการนี้` | PASS |
| TC-002.2 | US-002 AC2 | กดปุ่มลบแถวกลาง (event delegation) | รายการหายจาก state + list ทันที | PASS |
| TC-002.3 | US-002 AC3 | ลบแล้วอ่าน localStorage + จำลอง refresh (`reloadPage`) | รายการที่ลบไม่อยู่ใน storage และไม่กลับมาหลัง refresh | PASS |
| TC-002.4 | US-002 AC4 | ลบ 1 รายการจาก 3 | รายการอื่นครบถ้วนตามลำดับเดิม | PASS |

### US-003 ติ๊กเครื่องหมายว่าเสร็จแล้ว

| ID | เชื่อมกับ | ขั้นตอน | ผลที่คาดหวัง | ผลจริง |
|---|---|---|---|---|
| TC-003.1 | US-003 AC1 | ตรวจทุกแถว | มี `<input type="checkbox">` จริง + aria-label `ทำเครื่องหมายว่าเสร็จแล้ว: {ข้อความ}` | PASS |
| TC-003.2 | US-003 AC2, AC4 | ติ๊ก checkbox (event `change`) | state done=true, แถวมี class `.done`, checkbox checked, localStorage อัปเดตทันที | PASS |
| TC-003.3 | US-003 AC3, AC4 | ติ๊กซ้ำ (uncheck) | กลับ done=false, class .done หาย, localStorage อัปเดต | PASS |
| TC-003.4 | US-003 (ไม่กระทบอื่น) | ติ๊ก A ขณะมี A,B | B ยัง done=false และไม่มี class .done | PASS |

### US-004 ข้อมูลคงอยู่ / ข้อมูลเสียหาย

| ID | เชื่อมกับ | ขั้นตอน | ผลที่คาดหวัง | ผลจริง |
|---|---|---|---|---|
| TC-004.1 | US-004 AC1 | เพิ่ม+ติ๊กแล้วจำลอง refresh | โหลดข้อความ+สถานะเดิมถูกต้อง, แถวเสร็จมี class .done | PASS |
| TC-004.2 | US-004 AC2 | เพิ่ม 3 รายการแล้ว refresh | ลำดับคงเดิมทั้ง state และ DOM | PASS |
| TC-004.3 | US-004 AC3 | storage ว่าง → init | empty state `ยังไม่มีรายการ — เริ่มพิมพ์ด้านบนได้เลย`, ไม่มี error | PASS |
| TC-004.4 | US-004 AC4, spec 9.2 | ใส่ JSON ตัดครึ่ง `{{{` → init | ไม่ crash, คืน [], แสดง empty state, เพิ่มรายการใหม่ต่อได้ปกติ | PASS |
| TC-004.5 | US-004 AC4 | ใส่ `"hello"` และ object ไม่ใช่ array → init | คืน [] ไม่ crash | PASS |
| TC-004.6 | US-004 AC4, spec 4.3 | ใส่ item ผสม (เพี้ยน/ถูกต้อง/ไม่มี createdAt) | item เสียถูกกรองทิ้ง, item ถูกต้องคงอยู่, text trim, createdAt หาย → `""` | PASS |

### US-005 แก้ไขข้อความ

| ID | เชื่อมกับ | ขั้นตอน | ผลที่คาดหวัง | ผลจริง |
|---|---|---|---|---|
| TC-005.1 | US-005 AC1, spec 6.2 | กดปุ่มแก้ไข | แถวมี class .editing, input มีข้อความเดิม + focus + select อัตโนมัติ, ซ่อนปุ่มแก้ไข/ลบ, แสดงบันทึก/ยกเลิก | PASS |
| TC-005.2 | US-005 AC2 | แก้ข้อความ + Enter | ข้อความใหม่แสดงใน list + ลง localStorage + ออกโหมดแก้ไข | PASS |
| TC-005.3 | US-005 AC3, spec 9.11 | แก้เป็น `"   "` + Enter | ไม่บันทึก + shake + feedback + **ยังอยู่โหมดแก้ไข** | PASS |
| TC-005.4 | US-005 AC4 | พิมพ์ค้างแล้วกด Esc | ยกเลิก ข้อความเดิมคงอยู่ localStorage ไม่เปลี่ยน | PASS |
| TC-005.5 | spec C-4, 9.4 | แก้ A (มีข้อความ) แล้วคลิกแก้ B | A บันทึกอัตโนมัติ (state+storage) แล้ว B เข้าโหมดแก้ไข | PASS |
| TC-005.6 | spec 9.4 | แก้ A (input ว่าง) แล้วคลิกแก้ B | A ยกเลิก (คงข้อความเดิม) แล้ว B เข้าโหมดแก้ไข | PASS |
| TC-005.7 | US-005 AC1 | double-click ข้อความ | เข้าโหมดแก้ไขได้ | PASS |
| TC-005.8 | spec 9.14 | double-click ข้อความที่เสร็จแล้ว | เข้าโหมดแก้ไขได้ สถานะ done ไม่เปลี่ยน | PASS |
| TC-005.9 | US-005 AC4 | กดปุ่มยกเลิก | ข้อความเดิมคงอยู่ ไม่บันทึก + focus กลับปุ่มแก้ไข | PASS |
| TC-005.10 | US-005 AC2, AC3 | กดปุ่มบันทึก (มี/ไม่มีข้อความ) | บันทึกได้ / ถ้าว่าง → feedback + อยู่โหมดแก้ไขต่อ | PASS |
| TC-005.11 | spec 9.6 | แก้เป็นข้อความเดิมเป๊ะ + Enter | บันทึกได้ปกติ ออกจากโหมดแก้ไข | PASS |

### US-006 ลบรายการที่เสร็จแล้วทั้งหมด + custom modal (T-008)

| ID | เชื่อมกับ | ขั้นตอน | ผลที่คาดหวัง | ผลจริง |
|---|---|---|---|---|
| TC-006.1 | US-006 AC1, AC4 | ตรวจปุ่ม clear ทุกสถานการณ์ | disabled (attribute จริง) เมื่อจำนวนเสร็จ = 0, enabled เมื่อ ≥ 1 | PASS |
| TC-006.2 | US-006 AC1, spec C-1 | มีรายการเสร็จ 2 → กด clear | **custom modal** แสดงก่อนเสมอ ข้อความ `ต้องการลบรายการที่เสร็จแล้ว 2 รายการหรือไม่?` state/storage ยังไม่เปลี่ยน | PASS |
| TC-006.3 | spec T-008 | เปิด modal | focus อยู่ที่ปุ่ม "ยกเลิก" ก่อน | PASS |
| TC-006.4 | US-006 AC2, AC3 | กดยืนยัน | รายการเสร็จหายหมด รายการค้างคงอยู่ครบ, localStorage อัปเดตทันที, modal ปิด, ปุ่ม clear กลับเป็น disabled | PASS |
| TC-006.5 | US-006 (ยกเลิก) | กดปุ่มยกเลิกใน modal (ผ่าน listener จริงที่ wireEvents ผูก) | modal ปิด ไม่มีอะไรเปลี่ยนแปลง (list + localStorage เดิม) | PASS |
| TC-006.6 | spec T-008 | กด Esc ใน modal | modal ปิด ถือเป็นยกเลิก ไม่มีอะไรเปลี่ยนแปลง | PASS |
| TC-006.7 | spec T-008 | คลิก backdrop / คลิกเนื้อหาใน dialog | backdrop → ปิด+ยกเลิก / เนื้อหาใน dialog → ไม่ปิด | PASS |
| TC-006.8 | spec T-008 | Tab / Shift+Tab ใน modal | focus trap วนเฉพาะปุ่มยืนยัน↔ยกเลิก | PASS |
| TC-006.9 | spec T-008 | ปิด modal ด้วย Esc และด้วยปุ่มยืนยัน | focus ถูกคืนกลับที่ปุ่ม clear completed ทุกวิธี | PASS |
| TC-006.10 | spec C-1 | grep `window.confirm` ใน app.js | ไม่พบ (ใช้ custom modal เท่านั้น) | PASS |

### US-007 นับจำนวนรายการค้าง/เสร็จ

| ID | เชื่อมกับ | ขั้นตอน | ผลที่คาดหวัง | ผลจริง |
|---|---|---|---|---|
| TC-007.1 | US-007 AC1 | เพิ่ม/ติ๊ก/ลบ/clear completed แล้วอ่าน counter ทันที | `ค้าง: N` / `เสร็จแล้ว: M` อัปเดตถูกต้องทันทีทุกกรณี | PASS |
| TC-007.2 | US-007 AC2 | refresh หลังมี 2 ค้าง 1 เสร็จ | ตัวเลขตรงกับ list (`ค้าง: 2` / `เสร็จแล้ว: 1`) | PASS |
| TC-007.3 | US-007 AC3 | ไม่มีรายการเลย | แสดง `ค้าง: 0` / `เสร็จแล้ว: 0` | PASS |

### Edge cases (spec ข้อ 9) + ความปลอดภัย

| ID | เชื่อมกับ | ขั้นตอน | ผลที่คาดหวัง | ผลจริง |
|---|---|---|---|---|
| TC-E.1 | spec 9.9 | เพิ่ม `<img src=x onerror=alert(1)>` | แสดงเป็นข้อความธรรมดา (textContent) ไม่มี element ลูกถูกสร้าง | PASS |
| TC-E.2 | spec 9.3, 4.4 | จำลอง setItem throw (quota เต็ม) | ไม่ crash + feedback `บันทึกไม่สำเร็จ — ข้อมูลจะหายเมื่อปิดหน้านี้` + state ใน memory ยังถูกต้อง | PASS |
| TC-E.3 | spec 9.3, 4.3 | จำลอง getItem throw (storage ถูกปิด) | `load()` คืน [] ไม่ crash | PASS |
| TC-E.4 | spec ข้อ 8, T-012 | grep โค้ดจริง (ตัดคอมเมนต์แล้ว) | ไม่มี `innerHTML` / `insertAdjacentHTML` / `document.write` / `window.confirm` | PASS |
| TC-E.5 | spec 9.8 | ลบรายการที่กำลังแก้ไขอยู่ (เรียก deleteTodo ตรง) | `editingId` ถูกเคลียร์ | PASS |
| TC-E.6 | spec 9.12 | refresh ระหว่างโหมดแก้ไข | `editingId` ไม่ persist หลังโหลดไม่มีแถวอยู่โหมดแก้ไข | PASS |
| TC-E.7 | spec 7.1 | ตรวจ event wiring หลัง init | ul ผูก change/click/dblclick/keydown/focusout/mousedown ครบ (delegation), form ผูก submit, document ผูก keydown, ไม่มี listener ต่อรายการ | PASS |
| TC-E.8 | spec 9.7 | ติ๊ก checkbox ขณะแก้อีกแถว (blur → change) | blur บันทึกแถวที่แก้ก่อน แล้ว toggle สำเร็จ — ทั้งสอง action สำเร็จ | PASS |
| TC-E.9 | spec 9.5 | Esc แล้ว blur ตามมา | ยกเลิกเท่านั้น ห้ามบันทึกข้อความที่พิมพ์ค้าง | PASS |
| TC-E.10 | spec 7.1 | blur ไปปุ่มในแถวเดียวกัน (Tab ไปปุ่มบันทึก) | โหมดแก้ไขคงอยู่ ยังไม่บันทึก (ให้ปุ่มจัดการเอง) | PASS |

## 3. บั๊กที่พบ

**ไม่พบบั๊กที่ต้องให้ dev แก้** — ทุก acceptance criteria ของ US-001–US-007 และ edge cases ตาม spec ข้อ 9 ผ่านครบตามพฤติกรรมที่กำหนด

### 3.1 ข้อสังเกต (ไม่ใช่บั๊ก — ไม่บล็อกการส่งมอบ)

| # | ระดับ | รายละเอียด | ไฟล์ที่เกี่ยวข้อง |
|---|---|---|---|
| O-1 | Minor (a11y) | กดยืนยันใน modal → `closeConfirmModal()` คืน focus ที่ปุ่ม clear completed ก่อน แต่ `commit()` → `render()` ทำให้ปุ่มกลายเป็น disabled (จำนวนเสร็จ = 0) focus จึงหลุดไป body หลัง render — ตาม spec ข้อ T-008 ถือว่า "คืน focus กลับปุ่ม clear" ทำแล้ว แตะเรื่อง polish เท่านั้น (เช่น ย้าย focus ไป input หลักแทน) | `app.js` (confirmModalAction / renderClearButton) |
| O-2 | Minor (a11y) | กด Esc ในโหมดแก้ไข → ยกเลิกถูกต้อง แต่ไม่มีการคืน focus ที่ปุ่มแก้ไขของแถวนั้นเหมือนปุ่มยกเลิก (ผู้ใช้คีย์บอร์ดต้อง Tab ใหม่) — spec ข้อ 7.1 กำหนดแค่ "ยกเลิก: editingId = null → render()" จึงยังตรง spec | `app.js` (onListKeydown, บรรทัด ~500–506) |

### 3.2 บันทึกการแก้ไขเทสระหว่างรัน (ความโปร่งใส — ไม่ได้แก้เทสเพื่อซ่อนบั๊ก)

รอบแรกมีเทสไม่ผ่าน 13 ข้อ ตรวจสอบแล้ว**ทั้งหมดเป็นข้อผิดพลาดของตัวเทสเอง ไม่ใช่บั๊กของแอป** จึงแก้ที่ไฟล์เทสเท่านั้น:

1. **`assert.deepStrictEqual` ข้าม vm realm** (12 ข้อ: TC-001.1, TC-002.2, TC-002.4, TC-004.1–004.6, TC-006.4, TC-E.3) — array ที่สร้างภายใน vm context มี Array prototype ต่าง realm จาก host Node ทำให้ deepStrictEqual ฟ้อง "not reference-equal" แม้ค่าเท่ากันทุกประการ → เปลี่ยนไปเทียบผ่าน `JSON.stringify` (ค่าเดิม ตรวจเดิม ไม่ลดความเข้ม)
2. **TC-006.5** — ลืมเรียก `init()` (ซึ่งรัน `wireEvents`) ก่อนเช็คว่าปุ่มยกเลิกถูกผูก event — เป็นการตั้งเงื่อนไขเทสไม่ครบ ไม่เกี่ยวกับโค้ดแอป
3. **TC-E.4** — regex เดิมติดคำว่า "innerHTML" ที่อยู่ใน**คอมเมนต์**ของ `app.js` (หัวไฟล์บอกว่า "ห้ามใช้ innerHTML") → แก้เป็นตัดคอมเมนต์ออกก่อนแล้วเช็คการ**ใช้งานจริง**ในโค้ด ซึ่งตรงกับเจตนาของ spec ข้อ 8/T-012

## 4. สถิติ

| รายการ | จำนวน |
|---|---|
| เทสทั้งหมด | 53 |
| ผ่าน | 53 |
| ไม่ผ่าน | 0 |
| บั๊กที่ต้องแก้ | 0 |
| ข้อสังเกตไม่บล็อก (minor a11y) | 2 (O-1, O-2) |

การกระจายเทส: US-001 × 5, US-002 × 4, US-003 × 4, US-004 × 6, US-005 × 11, US-006 × 10, US-007 × 3, Edge/Security × 10

## 5. สรุป (รอบที่ 1)

Logic ทั้งหมดของแอป (state, persistence, validation, actions, edit flow, custom modal พร้อม focus trap/Esc/backdrop, counter, event delegation) ทำงานถูกต้องตาม acceptance criteria ของ US-001–US-007 และ edge cases ใน `docs/04-spec.md` ข้อ 9 ครบทุกข้อ คงเหลือเฉพาะการตรวจ visual/CSS และพฤติกรรม focus จริงในเบราว์เซอร์ (ดูข้อ 1) ซึ่งอยู่นอกขอบเขตของเทสอัตโนมัติที่รันได้ในสภาพแวดล้อมนี้

---

# ตรวจซ้ำรอบที่ 2 — หลัง dev แก้ a11y ตามข้อสังเกต O-1 / O-2

> วันที่ตรวจ: 2026-10-31 | ขอบเขต: ตรวจซ้ำอิสระการแก้ 2 จุดของ dev + regression ทั้งชุดเทส
> หมายเหตุ: ห้ามแก้โค้ดหลัก/โค้ดแอปในรอบนี้ — QA รันเทสและตรวจ diff เท่านั้น

## 6. ขอบเขตการแก้ของ dev (ตรวจจาก `git diff` อิสระ)

| จุดแก้ | ไฟล์ | รายละเอียดที่พบใน diff |
|---|---|---|
| O-1 | `app.js` (`confirmModalAction`) | หลัง `closeConfirmModal()` + รัน `onConfirm()` แล้ว เพิ่มเงื่อนไข `if (els.clearBtn.disabled) els.todoInput.focus()` — ครอบคลุมกรณียืนยันแล้วปุ่ม clear กลายเป็น disabled จน focus หลุดไป body |
| O-2 | `app.js` (`onListKeydown`) | กด Esc ในโหมดแก้ไข เปลี่ยนจาก `state.editingId = null; render()` เป็น `cancelEditing(li)` — พฤติกรรมเดียวกับปุ่มยกเลิก รวมถึงคืน focus ที่ปุ่มแก้ไขของแถวเดิม |
| เทส | `tests/app.test.js` | แก้ TC-006.9 (สะท้อนพฤติกรรม O-1) + เพิ่ม TC-005.12 (ครอบ O-2) — **ไม่มีการแก้เทสอื่น** |

ยืนยันว่า diff ไม่มีการแก้ส่วนอื่นของ `app.js` (state/persistence/render/event wiring อื่น ๆ ไม่ถูกแตะ)

## 7. ผลรันเทสอิสระ (รอบที่ 2)

รัน `node tests/app.test.js` เอง (ไม่อิงผลรายงานของ dev):

```
รวมทั้งหมด: 54 | ผ่าน: 54 | ไม่ผ่าน: 0
```

ตรงกับที่ dev รายงาน (54/54)

## 8. ตรวจความถูกต้องของเคสที่ dev ปรับ/เพิ่ม

### TC-006.9 (แก้ไข — สะท้อน O-1)

| หัวข้อ | ประเมิน |
|---|---|
| เดิมทดสอบอะไร | ปิด modal ทุกวิธี (Esc/ยืนยัน) → focus กลับปุ่ม clear completed |
| ใหม่ทดสอบอะไร | (ก) ปิดด้วย Esc → focus กลับปุ่ม clear (ยัง enabled) (ข) ปิดด้วยยืนยัน → ปุ่ม clear ต้อง disabled + focus ต้องไปที่ todo-input ไม่หลุดไป body |
| เป็นการ "ปรับเทสให้ผ่าน" หรือไม่ | **ไม่ใช่** — assertion เดิม (focus กลับปุ่ม clear หลังยืนยัน) ขัดกับความจริงทางเทคนิค: หลังยืนยัน ปุ่ม clear กลายเป็น disabled และเบราว์เซอร์จริง focus บน element ที่ disabled ไม่ได้ (หลุดไป body) ซึ่งเป็นตัวปัญหา O-1 เอง เทสใหม่จึงตรงกับพฤติกรรมที่ตกลงแก้ (ย้าย focus ไป input หลัก) และ**เข้มขึ้น** — เพิ่ม assertion ว่าปุ่มต้อง disabled จริงก่อนเช็ค focus |
| ตรง AC หรือไม่ | ตรงเจตนา T-008 (คืน focus ให้ผู้ใช้ทำงานต่อ) แต่**เพื่อน literal ของ AC** "ปิด modal (ทุกวิธี) แล้ว focus กลับที่ปุ่ม clear completed" เปลี่ยนไปในกรณียืนยัน → ดูข้อสังเกต N-1 ด้านล่าง |
| ครอบ edge | ทดสอบทั้ง 2 path (Esc = ยกเลิก, ยืนยัน) ในเคสเดียว + ยืนยันสถานะ disabled ก่อนเช็ค focus — เพียงพอ |

### TC-005.12 (เพิ่มใหม่ — ครอบ O-2)

| หัวข้อ | ประเมิน |
|---|---|
| ทดสอบอะไร | แก้ A (มี 2 แถว A,B) พิมพ์ค้าง → กด Esc → ออกโหมดแก้ไข + ข้อความเดิมคงอยู่ + focus ต้องอยู่ปุ่มแก้ไข**ของแถว A** และ assertion เสริมว่า**ไม่ใช่**ปุ่มแก้ไขของแถว B |
| ตรง AC หรือไม่ | ตรง — ทำให้ Esc มีพฤติกรรม focus เดียวกับปุ่มยกเลิก (TC-005.9) ตามข้อสังเกต O-2 และไม่ขัด spec 7.1 (ยกเลิก: ข้อความเดิมคงอยู่ ไม่บันทึก) |
| ไม่ทำลาย edge เดิมหรือไม่ | ไม่ — จุดสำคัญคือ `cancelEditing` ตั้ง `editingId = null` **ก่อน** `replaceWith` และ focus ปุ่ม ทำให้ guard ใน `onListFocusout` (`editingId !== id → return`) ยังกัน "Esc แล้ว blur ตามมาห้ามบันทึก" ได้ (TC-E.9 ยัง PASS) และ TC-005.4 (Esc ไม่บันทึกลง localStorage) ยัง PASS |
| ครอบ edge | มี 2 แถวเพื่อพิสูจน์ว่า focus ไปแถวถูกต้อง (ไม่ใช่แถวอื่น/แถวสุดท้ายโดยบังเอิญ) — ดี |

## 9. Regression ต่อ AC เดิม (US-001–US-007)

รันซ้ำทั้งชุด 54 เคส — ทุกกลุ่มผ่านครบ ไม่มีเคสเดิมเสีย:

| กลุ่ม | จำนวน | ผล |
|---|---|---|
| US-001 เพิ่มรายการ | 5 | PASS ทั้งหมด |
| US-002 ลบรายการ | 4 | PASS ทั้งหมด |
| US-003 ติ๊กเสร็จ/ยกเลิก | 4 | PASS ทั้งหมด |
| US-004 localStorage / ข้อมูลเสียหาย | 6 | PASS ทั้งหมด |
| US-005 แก้ไขข้อความ (รวม TC-005.12 ใหม่) | 12 | PASS ทั้งหมด |
| US-006 clear completed + modal (รวม TC-006.9 ที่แก้) | 10 | PASS ทั้งหมด |
| US-007 นับจำนวน | 3 | PASS ทั้งหมด |
| Edge cases / ความปลอดภัย | 10 | PASS ทั้งหมด (รวม TC-E.9 ที่เกี่ยวกับการแก้ O-2 โดยตรง) |

จุดที่เช็คเป็นพิเศษเพราะอาจถูกการแก้กระทบ — ผ่านทั้งหมด:
- **TC-E.9** (Esc แล้ว blur ตามมา ห้ามบันทึก) — เกี่ยวกับ O-2 โดยตรง
- **TC-005.4** (Esc ไม่บันทึกลง localStorage) — เกี่ยวกับ O-2 โดยตรง
- **TC-005.9** (ปุ่มยกเลิก focus กลับปุ่มแก้ไข) — ยืนยันว่า Esc และปุ่มยกเลิกพฤติกรรมตรงกันจริง
- **TC-006.4 / TC-007.1** (ยืนยัน modal → state/storage/counter ถูกต้อง) — เกี่ยวกับ O-1 โดยตรง
- **TC-006.3 / TC-006.5 / TC-006.6 / TC-006.7 / TC-006.8** (focus ปุ่มยกเลิก, ยกเลิกทุกวิธี, focus trap) — path ยกเลิกของ modal ไม่ถูกกระทบจาก O-1 (เงื่อนไข `clearBtn.disabled` เป็น false เมื่อยังไม่ยืนยัน)

## 10. ข้อสังเกตเพิ่มเติม (รอบที่ 2)

| # | ระดับ | รายละเอียด | ไฟล์ที่เกี่ยวข้อง |
|---|---|---|---|
| N-1 | Info (เอกสาร) | การแก้ O-1 ทำให้พฤติกรรมจริง**แตกต่างจากข้อความ literal ของ AC ใน T-008** ("ปิด modal ทุกวิธี focus กลับปุ่ม clear completed") ในกรณียืนยัน — ถือเป็นการแก้ที่ถูกต้องกว่า (focus บนปุ่ม disabled ไม่ได้ในเบราว์เซอร์จริง) แต่ควรให้ sa/writer อัปเดตถ้อยคำใน `docs/04-spec.md` (T-008) และ `docs/09-user-guide.md` ให้สอดคล้อง เพื่อไม่ให้เอกสารขัดกับพฤติกรรมจริง | `docs/04-spec.md`, `docs/09-user-guide.md` |
| N-2 | Info (ข้อจำกัดเดิม) | พฤติกรรม focus จริงในเบราว์เซอร์ (เช่น focus หลุดไป body ชั่วขณะระหว่าง render ก่อนย้ายไป todo-input) ยังคงต้องตรวจด้วยตาในเบราว์เซอร์จริงตามข้อจำกัดในข้อ 1 — stub ตรวจลำดับ logic และปลายทาง focus ได้เท่านั้น | `app.js` |

ไม่พบบั๊กใหม่จากการแก้รอบนี้

## 11. สถิติ (รอบที่ 2)

| รายการ | จำนวน |
|---|---|
| เทสทั้งหมด | 54 |
| ผ่าน | 54 |
| ไม่ผ่าน | 0 |
| บั๊กที่ต้องแก้ | 0 |
| ข้อสังเกตไม่บล็อก | 2 ใหม่ (N-1, N-2 — ระดับ Info) + ปิด O-1, O-2 แล้ว |

## 12. สรุป (รอบที่ 2)

การแก้ O-1/O-2 ของ dev **ถูกต้อง ตรงขอบเขต และไม่ทำลาย AC เดิม**: (1) หลังยืนยัน clear completed เมื่อปุ่ม disabled focus ถูกย้ายไป todo-input แทนการหลุดไป body (2) Esc ในโหมดแก้ไขใช้ `cancelEditing(li)` ทำให้พฤติกรรมเหมือนปุ่มยกเลิกเป๊ะ ๆ รวมถึงคืน focus ที่ปุ่มแก้ไขของแถวเดิม โดยไม่ทำลาย guard กันบันทึกหลัง Esc (TC-E.9 ยังผ่าน) เทสที่ dev ปรับ (TC-006.9) และเพิ่ม (TC-005.12) เป็นการปรับที่**สมเหตุสมผลและเข้มขึ้น** ไม่ใช่การปรับเทสให้ผ่านเพื่อซ่อนบั๊ก ผลรันอิสระ 54/54 ผ่านครบ

---

# ตรวจซ้ำรอบที่ 3 — หลัง polish UI (ไอคอน SVG + CSS tokens + ปรับ stub)

> วันที่ตรวจ: 2026-10-31 | ขอบเขต: ตรวจซ้ำอิสระการแก้ polish 3 ไฟล์ + regression ทั้งชุดเทส
> หมายเหตุ: ห้ามแก้โค้ดหลัก/โค้ดแอปในรอบนี้ — QA รันเทส ตรวจ diff และตรวจโครงสร้าง DOM ที่ render จริงเท่านั้น

## 13. ขอบเขตการแก้ครั้งนี้ (ตรวจจาก `git diff` อิสระ — การแก้ยังไม่ commit อยู่ใน working tree)

| ไฟล์ | รายละเอียดที่พบใน diff |
|---|---|
| `app.js` | (1) ไอคอนปุ่มแก้ไข/ลบเปลี่ยนจาก emoji (`✎`/`🗑` ใน `<span class="btn-icon">`) เป็น inline SVG ผ่าน `createElementNS` ใหม่ (`createIcon` + `ICON_PATHS`, viewBox 24×24, `aria-hidden="true"`, `focusable="false"`, class `btn-icon`) (2) `createActionButton` รับชื่อไอคอนแทน emoji — **`data-action`, `aria-label`, `<span class="btn-label">` คงเดิมทุกอย่าง** |
| `styles.css` | เพิ่ม CSS tokens (`--color-wash-blue/red`, `--radius-sm/lg`), `color-scheme: light`, `::selection`, `caret-color`, `font-variant-numeric: tabular-nums`, `.btn` เป็น inline-flex + gap, `.btn-icon` เปลี่ยนจาก `font-size` (emoji) เป็น `width/height` + `stroke: currentColor` (SVG) — ล้วนเป็น CSS ไม่กระทบ logic |
| `tests/helpers/stub-env.js` | เพิ่มบรรทัดเดียว: `doc.createElementNS = (_ns, tag) => createElement(doc, tag)` |
| `tests/app.test.js` | **ไม่ถูกแก้เลยในรอบนี้** (ยืนยันจาก `git status` — ไม่อยู่ในรายการ modified) |

หมายเหตุ: `docs/06-security-report.md` ถูกแก้ใน working tree ด้วย — เป็นไฟล์ของ security ไม่อยู่ในขอบเขตตรวจของ QA / `.impeccable/` และ `DESIGN.md` เป็นไฟล์ design system ใหม่ (untracked) ไม่ใช่โค้ดแอป

## 14. ผลรันเทสอิสระ (รอบที่ 3)

รัน `node tests/app.test.js` เอง (ไม่อิงผลรายงานของผู้ทำ polish):

```
รวมทั้งหมด: 54 | ผ่าน: 54 | ไม่ผ่าน: 0
```

ตรงกับที่ผู้ทำ polish รายงาน (54/54)

## 15. ตรวจว่าการเปลี่ยนไอคอนเป็น SVG ไม่ทำลาย AC เดิม

นอกจากเทสชุดเดิม รันสคริปต์ ad-hoc ตรวจโครงสร้าง DOM ที่ render จริง (ผ่าน stub เดียวกับเทส) ผลทุกข้อตรงตามคาด:

| การตรวจ | ผลที่คาดหวัง | ผลจริง |
|---|---|---|
| ปุ่มแก้ไข/ลบค้นหาได้ด้วย `button[data-action="edit"/"delete"]` | เจอ `<button>` จริง | PASS (tagName BUTTON, data-action ถูกต้อง) |
| `aria-label` ครบ | `แก้ไขรายการนี้` / `ลบรายการนี้` | PASS |
| SVG ไอคอน | viewBox `0 0 24 24`, `aria-hidden="true"`, `focusable="false"`, class `btn-icon`, path ครบ (edit 1 path, delete 3 paths) | PASS |
| ปุ่มยังมี text label | `<span class="btn-label">` = `แก้ไข` / `ลบ` (สำหรับ responsive ที่ซ่อน label บนมือถือ aria-label ยังอยู่ที่ปุ่ม) | PASS |
| SVG ไม่รบกวน selector อื่น | `querySelectorAll("button")` = 2, `.btn-label` = 2 (SVG ไม่ถูกนับ) | PASS |
| **TC-005.12** (Esc → focus ปุ่มแก้ไขของแถวเดิม) | focus ไปที่ปุ่มแก้ไขแถว A | PASS (ทั้งจากเทสชุดและ ad-hoc — ปุ่ม `.btn-edit` ยังถูกสร้างและ focus ได้เหมือนเดิม เพราะโครงสร้างปุ่มนอกเหนือจากไอคอนไม่เปลี่ยน) |
| XSS ยังปลอดภัย | ไอคอนสร้างจาก `ICON_PATHS` คงที่ในโค้ด ไม่มี input ผู้ใช้เข้าเส้นทาง SVG + TC-E.1/TC-E.4 ยัง PASS | PASS |

ข้อสังเกตเชิงเทคนิค: `onListClick` ใช้ `event.target.closest("button[data-action]")` — ในเบราว์เซอร์จริงเมื่อผู้ใช้คลิกโดนตัว SVG/path, `closest()` ของ SVGElement ยังไต่ขึ้นหา `<button>` ได้ จึงคลิกโดนไอคอนก็ทำงานถูก (stub ทดสอบโดยส่งปุ่มตรง ๆ จึงไม่ครอบ path นี้ — ดูข้อจำกัดข้อ 1 เดิม)

## 16. ตรวจความสมเหตุสมผลของการปรับ `stub-env.js`

| หัวข้อ | ประเมิน |
|---|---|
| ทำไมต้องแก้ | ก่อนแก้ stub ไม่มี `document.createElementNS` — พอ `app.js` เรียก `createIcon()` ตอน render ปุ่มทุกแถว จะโยน `TypeError: document.createElementNS is not a function` ทำให้เทสล่มทั้งชุด การเพิ่ม `createElementNS` จึงเป็น**การอัปเดต test adapter ที่จำเป็น** เพื่อให้รัน `app.js` จริงใน sandbox ต่อได้ |
| เป็นการหลอกเทสให้ผ่านหรือไม่ | **ไม่ใช่** — (1) ไม่มี assertion ใดถูกลดทอน/ลบ (`tests/app.test.js` ไม่ถูกแก้ในรอบนี้) (2) stub ใหม่ implement พอดีกับที่ `app.js` ใช้จริงกับ SVG (`setAttribute`, `classList.add`, `appendChild`) ไม่ได้ fake พฤติกรรมที่เทสอ้างสิทธิ์ (3) ทุกเทสเดิม 53 เคส + TC-005.12 ยัง assert เหมือนเดิมทุกข้อ |
| ความเที่ยงตรงของ stub | ยอมรับได้ — stub สร้าง generic element (tagName `SVG`/`PATH`) แทน SVGElement จริง (เช่น `className` จริงเป็น SVGAnimatedString) แต่ `app.js` ไม่ได้ใช้ API เฉพาะ SVG นอกเหนือจาก 3 อย่างข้างบน จึงไม่มีช่องทางที่ stub อ่อนกว่าจริงจนปล่อยบั๊กผ่าน (ดูข้อสังเกต N-3) |

## 17. Regression ต่อ AC เดิม (US-001–US-007) — รอบที่ 3

รันซ้ำทั้งชุด 54 เคส — ครบทุกกลุ่ม ไม่มีเคสใดเสีย:

| กลุ่ม | จำนวน | ผล |
|---|---|---|
| US-001 เพิ่มรายการ | 5 | PASS ทั้งหมด |
| US-002 ลบรายการ | 4 | PASS ทั้งหมด |
| US-003 ติ๊กเสร็จ/ยกเลิก | 4 | PASS ทั้งหมด |
| US-004 localStorage / ข้อมูลเสียหาย | 6 | PASS ทั้งหมด |
| US-005 แก้ไขข้อความ (รวม TC-005.12) | 12 | PASS ทั้งหมด |
| US-006 clear completed + modal | 10 | PASS ทั้งหมด |
| US-007 นับจำนวน | 3 | PASS ทั้งหมด |
| Edge cases / ความปลอดภัย | 10 | PASS ทั้งหมด |

จุดที่เช็คเป็นพิเศษเพราะอาจถูกการเปลี่ยนไอคอนกระทบ — ผ่านทั้งหมด: TC-002.1 (ปุ่มลบ + label + aria-label), TC-005.1 (ปุ่มแก้ไข/ซ่อนปุ่มตอน editing), TC-005.9/TC-005.12 (focus กลับปุ่มแก้ไขหลังยกเลิก/Esc), TC-E.7 (event delegation — ปุ่มยังไม่มี listener ต่อรายการ)

## 18. ข้อสังเกตเพิ่มเติม (รอบที่ 3)

| # | ระดับ | รายละเอียด | ไฟล์ที่เกี่ยวข้อง |
|---|---|---|---|
| N-3 | Info (ข้อจำกัด stub) | stub `createElementNS` ไม่แยก namespace และไม่จำลอง SVG API จริงทั้งหมด (เช่น `getBBox`, `className` แบบ SVGAnimatedString) — ปัจจุบัน `app.js` ใช้แค่ setAttribute/classList/appendChild จึงไม่มีผล แต่ถ้าอนาคตใช้ API เฉพาะ SVG เพิ่ม ต้องอัปเดต stub ตาม | `tests/helpers/stub-env.js` |
| N-4 | Info (ข้อจำกัดเดิม) | คุณภาพการ render SVG จริง (stroke ผ่าน `currentColor`, ขนาด 16/18px, `::selection`, `caret-color`, `color-scheme`, `tabular-nums`) เป็น visual/CSS ที่ยังต้องตรวจด้วยตาในเบราว์เซอร์จริงตามข้อจำกัดในข้อ 1 — stub ตรวจโครงสร้าง DOM/attribute ได้เท่านั้น | `styles.css`, `app.js` |

ไม่พบบั๊กใหม่จากการแก้ polish รอบนี้

## 19. สถิติ (รอบที่ 3)

| รายการ | จำนวน |
|---|---|
| เทสทั้งหมด | 54 |
| ผ่าน | 54 |
| ไม่ผ่าน | 0 |
| บั๊กที่ต้องแก้ | 0 |
| ข้อสังเกตไม่บล็อก | 2 ใหม่ (N-3, N-4 — ระดับ Info) |

## 20. สรุป (รอบที่ 3)

การ polish UI รอบนี้**อยู่ในขอบเขต ไม่ทำลาย AC เดิม และไม่มีบั๊ก**: (1) ไอคอน SVG ผ่าน `createElementNS` คง `data-action`/`aria-label`/`btn-label` ครบ ปุ่มแก้ไขยังค้นหาและรับ focus ได้เหมือนเดิม (TC-005.12 ผ่าน) (2) การแก้ `styles.css` ล้วนเป็น CSS tokens/visual ไม่กระทบ logic (3) การเพิ่ม `createElementNS` ใน stub เป็นการอัปเดต test adapter ที่**จำเป็นและสมเหตุสมผล** — ไม่มีการแก้เทสให้ผ่านเพื่อซ่อนบั๊ก (`tests/app.test.js` ไม่ถูกแตะในรอบนี้) ผลรันอิสระ 54/54 ผ่านครบ เหลือเฉพาะการตรวจ visual ในเบราว์เซอร์จริงตามข้อจำกัดเดิม (N-4)

---

# ตรวจซ้ำรอบที่ 4 — หลัง dev แก้ CSS focus-visible double-ring ปุ่มพื้นสี + อัปเดต DESIGN.md

> วันที่ตรวจ: 2026-10-31 | ขอบเขต: ตรวจซ้ำอิสระการแก้ `:focus-visible` double-ring ใน `styles.css` และ `DESIGN.md` + regression ทั้งชุดเทส
> หมายเหตุ: ห้ามแก้โค้ดหลัก/โค้ดแอปในรอบนี้ — QA รันเทสและตรวจ diff เท่านั้น

## 21. ขอบเขตการแก้ (ตรวจจาก `git diff` อิสระ)

| ไฟล์ | รายละเอียดที่พบใน diff |
|---|---|
| `styles.css` | เพิ่มกฎ `#add-btn:focus-visible` และ `.btn-danger:focus-visible` เพื่อปรับโฟกัสริงของปุ่มพื้นสี (primary และ danger confirm) เป็นแบบ double-ring: `outline: 2px solid var(--color-focus)`, `outline-offset: 2px`, และ `box-shadow: inset 0 0 0 2px var(--color-surface)` โดยปุ่มพื้นขาว/ghost ยังใช้โฟกัสริงเดิม |
| `DESIGN.md` | อัปเดตเอกสาร Design System 2 จุดในส่วน Components (Primary/Danger confirm/Focus) และ Do's & Don'ts ให้ตรงกับกฎโฟกัสริง double-ring ของปุ่มพื้นสีใน CSS จริง |
| `app.js` / `index.html` / `tests/` | **ไม่ถูกแตะเลย** (ยืนยันจาก `git diff --name-only` พบเฉพาะ `DESIGN.md` และ `styles.css`) |

## 22. ผลรันเทสอิสระ (รอบที่ 4)

รัน `node tests/app.test.js` เองอิสระ:

```
รวมทั้งหมด: 54 | ผ่าน: 54 | ไม่ผ่าน: 0
```

ผ่านครบทุกเทส (54/54)

## 23. ผลการตรวจโค้ด CSS และ DESIGN.md

| รายการตรวจ | ผลการตรวจสอบ | สรุป |
|---|---|---|
| การใช้ CSS variables / tokens | `#add-btn:focus-visible` และ `.btn-danger:focus-visible` ใช้ `var(--color-focus)` (#155ab6) และ `var(--color-surface)` (#ffffff) ซึ่งเป็น token ที่ระบุใน Design System | PASS |
| ผลกระทบต่อปุ่มอื่น | กฎเฉพาะเจาะจงเฉพาะ `#add-btn:focus-visible` และ `.btn-danger:focus-visible` ปุ่มประเภทอื่น (ghost/secondary/delete/edit/checkbox/input) ยังคงใช้กฎเดิม `:is(button, input, [tabindex]):focus-visible` (`outline: 3px solid var(--color-focus)`) ไม่ได้รับผลกระทบ | PASS |
| prefers-reduced-motion | โฟกัสริงใช้ static properties (`outline` และ `box-shadow`) ไม่มี animation / transition จึงไม่ขัดหรือกระทบกับการตั้งค่า `prefers-reduced-motion` | PASS |
| DESIGN.md ตรงกับ CSS จริง | เอกสาร `DESIGN.md` บรรทัดที่ 181 และ 219 อัปเดตระบุการใช้ double-ring (`outline 2px` + `inset ขอบขาว 2px`) ตรงกับใน `styles.css` บรรทัดที่ 294–299 เป๊ะ | PASS |

## 24. Regression ต่อ AC เดิม (US-001–US-007) — รอบที่ 4

รันซ้ำทั้งชุด 54 เคส — ทุกกลุ่มผ่านครบทั้งหมด:

| กลุ่ม | จำนวน | ผล |
|---|---|---|
| US-001 เพิ่มรายการ | 5 | PASS ทั้งหมด |
| US-002 ลบรายการ | 4 | PASS ทั้งหมด |
| US-003 ติ๊กเสร็จ/ยกเลิก | 4 | PASS ทั้งหมด |
| US-004 localStorage / ข้อมูลเสียหาย | 6 | PASS ทั้งหมด |
| US-005 แก้ไขข้อความ | 12 | PASS ทั้งหมด |
| US-006 clear completed + modal | 10 | PASS ทั้งหมด |
| US-007 นับจำนวน | 3 | PASS ทั้งหมด |
| Edge cases / ความปลอดภัย | 10 | PASS ทั้งหมด |

## 25. สถิติ (รอบที่ 4)

| รายการ | จำนวน |
|---|---|
| เทสทั้งหมด | 54 |
| ผ่าน | 54 |
| ไม่ผ่าน | 0 |
| บั๊กที่ต้องแก้ | 0 |

## 26. สรุป (รอบที่ 4)

การปรับปรุง CSS โฟกัสริงสำหรับปุ่มพื้นสี (#add-btn และ .btn-danger) เป็น double-ring มีการครอบคลุมถูกต้องตรงตาม design system ใช้ CSS tokens อย่างสอดคล้อง ไม่กระทบปุ่มอื่นหรือ prefers-reduced-motion และ DESIGN.md ถูกอัปเดตตรงตามโค้ด CSS จริง การตรวจสอบ git diff ยืนยันว่าไม่มีการแก้ไขไฟล์ JavaScript, HTML หรือ Test Script ใดๆ Regression US-001 ถึง US-007 ยังคงผ่าน 100% (54/54)

---

# ตรวจซ้ำรอบที่ 5 — หลังปรับ `--color-bg` ใน styles.css จาก `#faf6f0` เป็น `#faf5ff`

> วันที่ตรวจ: 2026-10-31 | ขอบเขต: ตรวจสอบการเปลี่ยนสีพื้นหลัง (โทนออฟไวท์อมม่วง) ตามข้อกำหนดการออกแบบ + regression ทั้งชุดเทส
> หมายเหตุ: ห้ามแก้โค้ดหลัก/โค้ดแอปในรอบนี้ — QA รันเทสและตรวจ diff เท่านั้น

## 27. ขอบเขตการแก้ (ตรวจจาก `git diff` อิสระ)

| ไฟล์ | รายละเอียดที่พบใน diff |
|---|---|
| `styles.css` | บรรทัดที่ 9: `--color-bg: #faf5ff;` (เดิม `#faf6f0`) — เปลี่ยนโทนพื้นหลังจากครีมอ่อนเป็นออฟไวท์อมม่วง ตามข้อกำหนดการออกแบบ |
| `app.js` / `index.html` / `tests/` / `DESIGN.md` | **ไม่ถูกแตะเลย** (ยืนยันจาก `git diff --name-only` พบเฉพาะ `styles.css`) |

## 28. ผลรันเทสอิสระ (รอบที่ 5)

รัน `node tests/app.test.js` เองอิสระ:

```
รวมทั้งหมด: 54 | ผ่าน: 54 | ไม่ผ่าน: 0
```

ผ่านครบทุกเทส (54/54)

## 29. ผลการตรวจสอบการเปลี่ยนสีพื้นหลัง

| รายการตรวจ | ผลการตรวจสอบ | สรุป |
|---|---|---|
| การใช้ CSS variable | `--color-bg` ถูกใช้ใน `body { background: var(--color-bg); }` และไม่มี hardcode สีพื้นหลังอื่นในไฟล์ | PASS |
| ผลกระทบต่อ logic | การเปลี่ยนค่า CSS variable เป็นการเปลี่ยนแปลง visual เท่านั้น ไม่มีการอ้างอิง `--color-bg` ใน JavaScript logic ใดๆ (grep `--color-bg` ใน `app.js` ไม่พบ) | PASS |
| คอนทราสต์ข้อความ | `--color-text: #2c2523` (อมน้ำตาลอุ่น) บน `--color-bg: #faf5ff` — คอนทราสต์ ≥ 4.5:1 ตาม WCAG AA (ตรวจสอบด้วยเครื่องมือคอนทราสต์) | PASS |
| ส่วนอื่นที่อาจใช้ bg | `.todo-item`, `.modal`, `.btn` ใช้ `--color-surface: #ffffff` — ไม่ได้รับผลกระทบ | PASS |
| prefers-reduced-motion | การเปลี่ยนสีพื้นหลังเป็น static color ไม่มี animation/transition จึงไม่ขัดกับการตั้งค่า | PASS |

## 30. Regression ต่อ AC เดิม (US-001–US-007) — รอบที่ 5

รันซ้ำทั้งชุด 54 เคส — ทุกกลุ่มผ่านครบทั้งหมด:

| กลุ่ม | จำนวน | ผล |
|---|---|---|
| US-001 เพิ่มรายการ | 5 | PASS ทั้งหมด |
| US-002 ลบรายการ | 4 | PASS ทั้งหมด |
| US-003 ติ๊กเสร็จ/ยกเลิก | 4 | PASS ทั้งหมด |
| US-004 localStorage / ข้อมูลเสียหาย | 6 | PASS ทั้งหมด |
| US-005 แก้ไขข้อความ | 12 | PASS ทั้งหมด |
| US-006 clear completed + modal | 10 | PASS ทั้งหมด |
| US-007 นับจำนวน | 3 | PASS ทั้งหมด |
| Edge cases / ความปลอดภัย | 10 | PASS ทั้งหมด |

## 31. สถิติ (รอบที่ 5)

| รายการ | จำนวน |
|---|---|
| เทสทั้งหมด | 54 |
| ผ่าน | 54 |
| ไม่ผ่าน | 0 |
| บั๊กที่ต้องแก้ | 0 |

## 32. สรุป (รอบที่ 5)

การปรับ `--color-bg` จาก `#faf6f0` เป็น `#faf5ff` (โทนออฟไวท์อมม่วง) เป็นการเปลี่ยนแปลง **CSS visual เท่านั้น** ตรงตามข้อกำหนดการออกแบบ:
- ใช้ CSS variable อย่างถูกต้อง (`var(--color-bg)` ใน `body`)
- ไม่มีการ hardcode สีใน JavaScript logic
- คอนทราสต์ข้อความผ่านเกณฑ์ WCAG AA
- ไม่กระทบ component อื่นที่ใช้ `--color-surface`
- Regression ทั้งชุด 54 test cases ผ่าน 100%

ไม่พบบั๊กจากการเปลี่ยนสีพื้นหลังครั้งนี้

RESULT: PASS
