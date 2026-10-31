---
name: Todo List
description: เว็บแอป to-do หน้าเดียวแบบ local-first — โต๊ะทำงานที่จัดแล้ว เปิดใช้ได้ทันที ไม่มีขั้นตอนเกิน
colors:
  page: "#f5f7fa"
  surface: "#ffffff"
  ink: "#1f2933"
  ink-muted: "#57606a"
  primary: "#155ab6"
  primary-deep: "#114a99"
  danger: "#b3261e"
  danger-deep: "#8f1e18"
  border: "#d5dbe1"
  hover-wash: "#eef1f5"
  danger-wash: "#fbeeed"
typography:
  display:
    fontFamily: "system-ui, -apple-system, 'Segoe UI', Roboto, 'Noto Sans Thai', 'Leelawadee UI', Tahoma, sans-serif"
    fontSize: "28px"
    fontWeight: 700
    lineHeight: 1.5
  body:
    fontFamily: "system-ui, -apple-system, 'Segoe UI', Roboto, 'Noto Sans Thai', 'Leelawadee UI', Tahoma, sans-serif"
    fontSize: "16px"
    fontWeight: 400
    lineHeight: 1.5
  counter:
    fontSize: "15px"
    lineHeight: 1.5
  feedback:
    fontSize: "14px"
    lineHeight: 1.5
rounded:
  control: "6px"
  control-lg: "10px"
  md: "8px"
  modal: "12px"
spacing:
  xs: "8px"
  sm: "10px"
  md: "12px"
  lg: "16px"
  xl: "24px"
  xxl: "32px"
  xxxl: "48px"
components:
  button-primary:
    backgroundColor: "{colors.primary}"
    textColor: "#ffffff"
    rounded: "{rounded.md}"
    padding: "8px 14px"
    height: "44px"
  button-primary-hover:
    backgroundColor: "{colors.primary-deep}"
  button-ghost:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    rounded: "{rounded.md}"
    padding: "8px 14px"
    height: "44px"
  button-ghost-hover:
    backgroundColor: "{colors.hover-wash}"
  button-danger-confirm:
    backgroundColor: "{colors.danger}"
    textColor: "#ffffff"
    rounded: "{rounded.md}"
    padding: "8px 14px"
    height: "44px"
  button-danger-confirm-hover:
    backgroundColor: "{colors.danger-deep}"
  button-danger-ghost:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.danger}"
    rounded: "{rounded.md}"
    padding: "8px 14px"
  button-danger-ghost-hover:
    backgroundColor: "{colors.danger-wash}"
  input-text:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    rounded: "{rounded.md}"
    padding: "10px 12px"
    height: "44px"
  modal:
    backgroundColor: "{colors.surface}"
    rounded: "{rounded.modal}"
    padding: "20px"
    width: "400px"
---

# Design System: Todo List

## Overview

**Creative North Star: "โต๊ะทำงานที่จัดแล้ว"**

โต๊ะที่จัดแล้ว — ไม่มีของประดับ ไม่มีเมนูซ่อน ไม่มีตู้ล็อกเก็บรายการ ทุกอย่างที่จำเป็นอยู่บนพื้นผิวเดียว เปิดใช้ทันที เพิ่ม → ติ๊ก → ลบ จบใน 3 คลิก ความง่ายของโลกนี้ไม่ใช่ข้อจำกัดที่ต้องเสียใจ แต่เป็นจุดยืน: ทุกองค์ประกอบบนหน้าจอต้องมีหน้าที่เดียวและตอบผู้ใช้ทันที ไม่มีอะไรที่ "แค่ทำให้อยากสวยไปอีก"

ถึงกระนั้นโลกนี้ไม่ได้เย็นชา — พื้นหลังเทาอุ่น (#f5f7fa) บนการ์ดขาวเหมือนกระดาษวางบนโต๊ะ ให้ความรู้สึกอบอุ่น-นุ่มนวล ใช้ system stack เท่านั้น ไม่มี webfont เพื่อให้เปิดผ่าน `file://` หรือ offline ได้จริง และทุกคอนโทรลใหญ่พอสำหรับนิ้ว (44px) เพื่อให้งานทั้งหมด "แน่นและพร้อมมือ"

**Key Characteristics:**
- แบนลงพื้นโดยปริยาย — แยกชั้นด้วยสีและเส้นขอบ เงามีบทบาทเดียวคือลอย modal ออกจากโลก
- น้ำเงินมีบทบาทเดียว: จุดลงมือทำ (ปุ่มเพิ่ม, checkbox ติ๊กแล้ว, focus ring)
- แดงมีบทบาทเดียว: ประตูที่ใช้แล้วไม่กลับ (ลบถาวร)
- น้ำหนักตัวอักษรมีสองค่าเท่านั้น: 400 ปกติ, 600 สำหรับคำที่โครงหน้า (ปุ่มลงมือ/แจ้งเตือน)
- ไม่มี dependency ใด ๆ — ทุกเอฟเฟกต์เป็น CSS ล้วน

## Colors

พาเลตต์คือโต๊ะทำงานตัวจริง: พื้นเทาอุ่น กระดาษขาว หมึกเข้ม ปากกาน้ำเงินหนึ่งด้าม และแดงกันข้อมูลหายเพียงสีเดียว

### Primary
- **น้ำเงินพึ่งพาได้ (Dependable Blue)** (#155ab6, เข้มขึ้นตอน hover #114a99): สีของการลงมือทำ — ปุ่ม "เพิ่ม", checkbox ที่ติ๊กแล้ว, ขอบช่องกำลังแก้ไข และ focus ring ทั้งระบบ รหัสสีเดียวคุม 3 บทบาทนี้โดยตรงเพราะทั้งหมดคือ "การกระทำที่ระบบรออยู่"

### Secondary
- **แดงประตูไม่กลับ (Point of No Return Red)** (#b3261e, เข้มขึ้นตอน hover #8f1e18): การลบถาวรเท่านั้น — ปุ่ม "ยืนยัน" ใน modal และตัวหนังสือปุ่มลบรายการเดียว (ghost บนพื้นขาว)

### Neutral
- **เทาอุ่น (Warm Grey)** (#f5f7fa): พื้นหลังหน้า — อุ่นกว่าสีเทา cool-grey เล็กน้อยให้ไม่รู้สึกเย็นจัด
- **กระดาษ (Paper)** (#ffffff): พื้นการ์ด, ช่อง input, ปุ่ม, checkbox, modal
- **หมึกชัด (Ink)** (#1f2933): ตัวหนังสือหลักทุกจุด
- **หมึกจาง (Muted Ink)** (#57606a): ข้อความรอง — placeholder, รายการทำแล้ว (line-through), empty state, กรอบ checkbox ยังไม่ติ๊ก
- **เส้นดินสอ (Pencil Grey)** (#d5dbe1): เส้นขอบทุก input/ปุ่ม/การ์ด และเส้นคั่นรายการ
- **ฟ้าน้ำล้าง (Wash Blue)** (#eef1f5): พื้นตอน hover ของปุ่มรอง
- **แดงน้ำล้าง (Wash Red)** (#fbeeed): พื้นตอน hover ของปุ่มลบรายการเดียว

### Named Rules
**The One Voice Rule.** น้ำเงินพึ่งพาได้ใช้ได้แค่ "จุดลงมือทำ" — ปุ่มเพิ่ม + checkbox ติ๊กแล้ว นอกนั้นบนหน้าจอเป็นหมึกกับเทาทั้งหมด ความหายากของสีคือสัญญาณที่ชี้นำสายตา
**The Red Door Rule.** แดงใช้เฉพาะการลบข้อมูลแบบถาวร (ลบรายการ, ลบรายการที่เสร็จแล้ว) สิ่งที่ย้อนกลับได้ (ยกเลิกติ๊ก) ไม่ใช้สีนี้เด็ดขาด
**The Wash Rule.** hover เปลี่ยนแค่พื้นหลังปุ่ม (ขาว → สีล้าง) ไม่เล่นขนาด เงา หรือ transform

## Typography

**Display + Body Font:** System UI stack (system-ui, -apple-system, "Segoe UI", Roboto, "Noto Sans Thai", "Leelawadee UI", Tahoma, sans-serif) — ไม่มี webfont เพราะต้องเปิด offline ได้

**Character:** หน้ากระดาษที่อ่านตรง ๆ โดยไม่เรียกร้องอะไรเลย น้ำหนักมีสองค่า: 400 ทั้งระบบ, 600 สงวนไว้แค่คำที่ต้องพูดแทนผู้ใช้ (ปุ่มเพิ่ม, ลบถาวร, ข้อความแจ้งเตือน)

### Hierarchy
- **Display** (700, 28px, 1.5): หัวเรื่อง "Todo List" กึ่งกลางหน้า — ตัวเดียวต่อหน้า (มือถือหดเหลือ 24px)
- **Body** (400, 16px, 1.5): ข้อความรายการ, ข้อความ modal, ปุ่มทั่วไป
- **Counter** (400, 15px, 1.5): "ค้าง: n / เสร็จแล้ว: n" ในแถบสถานะ
- **Feedback** (400, 14px, 1.5): บรรทัดแจ้งเตือน — ตอน `.error` ขึ้น 600 สีแดง

### Named Rules
**The System Voice Rule.** ห้ามโหลด webfont หรือ font ภายนอก — ภาษาไทยต้องแสดงชัดโดยพึ่ง font ในเครื่องเสมอ

## Layout

คอนเทนเนอร์เดียวกว้างสูงสุด 600px จัดกลาง (padding 24px บน / 16px ข้าง / 48px ล่าง) — มือถือ (<768px) หดเหลือ 16px บน/ข้าง และ 32px ล่าง

จังหวะช่องไฟตาม scale 8/10/12/16/24/32/48px: ระยะ dominant คือ 8px (gap ปุ่มในแถวเดียวกัน — ต้อง ≥ 8px เพื่อแยกคอนโทรลชัดตา) และ 12px (padding แต่ละรายการ) หัวเรื่องเว้นช่องไฟบน 8px ล่าง 24px รายการแรกเริ่มที่ 24px ใต้แถว input

Responsive ที่ <768px เปลี่ยนแค่ 3 อย่าง: h1 หด 24px / แถว input + ปุ่มเพิ่มตั้งซ้อนสองชั้นปุ่มเต็มกว้าง / ปุ่มแก้ไข-ลบย่อเป็น icon-only (≥44px) และ checkbox ขยายเป็น 44×44px

## Elevation & Depth

ระบบนี้ **ลงพื้นโดยปริยาย** — ทุกพื้นผิวแยกชั้นด้วยสีและเส้นขอบ ไม่ใช้เงา เงามีบทบาทเชิงโครงสร้างอย่างเดียว: modal ที่ต้องแยกตัวจากโลกเพื่อบังคับให้ตอบก่อน (ตามตัวเลือกผู้ใช้ "ลงพื้น + เงาแฝง" — เงาแฝงจาง ๆ บนการ์ดรายการยอมได้ แต่ไว้เป็นทางเลือกระหว่างเส้นทาง ไม่ใช่ค่าเริ่ม)

### Shadow Vocabulary
- **Structural Lift** (`box-shadow: 0 10px 30px rgba(0,0,0,0.25)`): ใช้กับ modal เท่านั้น — หมายถึง "ฉันอยู่นอกโลกและต้องตอบฉันก่อน"
- **Paper Float** (ทางเลือก, ยังไม่มีในโค้ด): `0 1px 3px rgba(31,41,51,0.08)` — เงาแฝงจาง ๆ สำหรับทำให้การ์ดรู้สึกลอยแบบกระดาษ ใช้ได้แต่ไม่บังคับ

### Named Rules
**The Flat Desk Rule.** พื้นผิวปิดเรียบด้วยเส้นขอบทั้งระบบ เพิ่มเงาใหม่นอกจาก modal ไม่ได้ — ความลึกที่แท้จริงคือคอนทราสต์ข้อความ (หมึกชัด vs หมึกจาง) ไม่ใช่ความสูง

## Shapes

มุมโค้งมีบทบาทเป็น "เหรียญนุ่ม" ของโลกนี้ — โค้งพอให้ดูอบอุ่น แต่ไม่มนกับจนกลายเป็น pill ค่าเริ่มของทุกคอนโทรล (input, ปุ่ม, การ์ดรายการ) คือ 8px checkbox ใช้ 6px เพราะตัวเล็ก (24px) ต้องโค้งสมส่วนของตัวเอง แล้วบนมือถือเลื่อนเป็น 10px ตามขนาด touch ที่ขยาย modal ใช้ 12px เพื่อแยกชั้นจากคอนโทรลปกติ

ทุกกล่อง (input, ปุ่ม, การ์ด) มีขอบ 1px รอบตัว — เส้นขอบคือกำแพงกั้น ไม่ใช้เงาแทน หนึ่งอย่างที่ไม่มีขอบคือรายการข้างในการ์ด: รายการคั่นด้วย border-bottom 1px และแถวสุดท้ายไม่มีเส้น (การ์ดรับหน้าที่ปิดท้ายเอง)

## Components

### ปุ่ม (Buttons)
**บุคลิก:** แน่นและพร้อมมือ — ทุกปุ่มสูง 44px กดแล้วรู้ผลทันที ไม่มีเอฟเฟกต์เกิน
- **Shape:** มุมโค้งอ่อน (8px), ความสูงขั้นต่ำ 44px, padding 8px 14px
- **Primary (เพิ่ม):** พื้นน้ำเงินพึ่งพาได้ ตัวหนังสือขาว หนา 600 (#155ab6 / #ffffff)
- **Secondary (ยกเลิก, ลบรายการที่เสร็จ):** พื้นกระดาษ ขอบเส้นดินสอ ตัวหนังสือหมึกชัด (#ffffff / #1f2933 / #d5dbe1)
- **Danger confirm (ยืนยัน):** พื้นแดงประตูไม่กลับ ตัวหนังสือขาว หนา 600 (#b3261e / #ffffff)
- **Danger ghost (ลบรายการเดียว):** พื้นกระดาษ ตัวหนังสือแดง (#b3261e)
- **Hover / Focus:** hover เปลี่ยนพื้นเท่านั้น (primary→#114a99, secondary→#eef1f5, danger ghost→#fbeeed, danger confirm→#8f1e18) focus-visible ทุกอันเป็น 3px outline น้ำเงินพึ่งพาได้ offset 2px
- **สถานะ disabled:** opacity 0.55 + cursor not-allowed

### Todo Item (Signature Component)
**บุคลิก:** แถวกระดาษในสมุด — เรียงต่อกันบนการ์ดขาวเดียว
- **การ์ดพื้นหลัง (todo-list):** กระดาษขาว, มุมโค้ง 8px, ขอบเส้นดินสอ 1px, overflow hidden
- **แถวรายการ:** flex, gap 8px, padding 10px 12px, คั่นด้วย border-bottom 1px (แถวสุดท้ายไม่มี)
- **Checkbox:** ออกแบบเองด้วย appearance:none — 24×24px, ขอบ 2px หมึกจาง, มุม 6px / ติ๊กแล้วพื้นเปลี่ยนน้ำเงินพึ่งพาได้พร้อมเครื่องหมายถูก SVG ขาว 15px / มือถือขยาย 44×44px มุม 10px, เครื่องหมาย 24px
- **สถานะทำแล้ว:** ข้อความ line-through + หมึกจาง (สีเดียวไม่พอ — checkbox ติ๊กอยู่เสมอเพื่อไม่พึ่งสีอย่างเดียว)
- **สถานะกำลังแก้ไข:** ข้อความกลายเป็น input ขอบน้ำเงิน 1px, ปุ่มแก้ไข/ลบหายไป
- **ปุ่มแก้ไข/ลบ:** desktop มีป้ายคำ, มือถือเหลือ icon-only (≥44px) — ไอคอนเป็น inline SVG วาดเอง (stroke 1.8, สี currentColor ตามสีปุ่ม) เสมอ ห้ามใช้ emoji/Unicode glyph เพราะเรนเดอร์ไม่คงที่ข้ามแพลตฟอร์ม

### ช่อง Input
**บุคลิก:** ช่องกรอกบนโต๊ะที่พร้อมรับได้เสมอ
- **Style:** พื้นกระดาษ, ขอบเส้นดินสอ 1px, มุมโค้ง 8px, padding 10px 12px, สูง ≥44px, font สืบทอดจาก body
- **Placeholder:** หมึกจาง
- **Focus:** 3px outline น้ำเงินพึ่งพาได้ offset 2px
- **โหมดแก้ไข:** ขอบเปลี่ยนเป็นน้ำเงินพึ่งพาได้ 1px (สัญญาณว่ากำลังแก้รายการเดิม)

### Modal (ยืนยันการลบ)
**บุคลิก:** หน่วยเดียวในระบบที่ "ลอย" — มีไว้เพื่อบังคับให้ตอบ
- **Backdrop:** rgba(15,23,42,0.5) คลุมทั้งหน้า, z-index 100, จัดกลาง + padding 16px
- **การ์ด:** กระดาษขาว, กว้างเต็ม (สูงสุด 400px), มุมโค้ง 12px, เงา Structural Lift, padding 20px
- **ปุ่ม (ยืนยัน/ยกเลิก):** ชิดขวา, gap 8px, ยืนยันเป็นปุ่ม danger confirm
- **กฎ:** การลบรายการที่เสร็จแล้วต้องผ่าน modal เสมอ (ข้อผูกพันตาม US-006)

### Feedback Line
**บุคลิก:** เสียงหยุดของระบบ
- บรรทัด 14px ใต้แถว input, เว้นพื้นที่สูง 1.5em เสมอ (ไม่กระตุก layout)
- ตอนผิดพลาด: หนา 600 สีแดงประตูไม่กลับ + อนิเมชั่น shake 250ms ease-in-out (ปิดเมื่อ prefers-reduced-motion: reduce)
- ปกติ (role=status): มองไม่เห็น แต่ aria-live อ่านได้

## Do's and Don'ts

### Do:
- **Do** ตั้ง touch target ขั้นต่ำ 44×44px ทุกคอนโทรล (ปุ่ม, checkbox, input)
- **Do** แสดงข้อความผู้ใช้ผ่าน `textContent` เท่านั้น — กัน XSS ไม่ว่าข้อความจะดูอันตรายแค่ไหน
- **Do** ตรวจคอนทราสต์ WCAG 2.1 AA ทุกคู่ข้อความ/พื้น (#57606a และ #155ab6 บน #ffffff ผ่าน 4.5:1 แล้ว) และคง aria-live/role dialog เดิมทุกตำแหน่ง
- **Do** ให้ focus-visible ring 3px กับทุกอย่างที่โฟกัสได้
- **Do** ให้ทุกการกระทำมี feedback ทันทีบนหน้าจอ — งานเป็น client-only ทั้งหมด ไม่มีสถานะรอ
- **Do** เขียนป้ายเป็นไทยผสมอังกฤษตามธรรมชาติของงานจริง (ไม่ใช่สองภาษาคู่ทุกป้าย)

### Don't:
- **Don't** เพิ่มสีใหม่นอกจากพาเลตต์นี้ — ข้อความมีได้แค่ #f5f7fa / #ffffff / #1f2933 / #57606a สถานะพิเศษมีแค่น้ำเงิน/แดงเดิม
- **Don't** ใช้แดงประตูไม่กลับกับสิ่งที่ย้อนกลับได้ (ยกเลิกติ๊กไม่ใช่สีแดง)
- **Don't** เพิ่มเงานอกจาก modal (และเงาแฝง "Paper Float" ไว้เป็นทางเลือกบนการ์ดเท่านั้น)
- **Don't** โหลด webfont หรือ dependency ภายนอกใด ๆ — ต้องเปิดผ่าน file:// และ offline ได้จริง
- **Don't** เพิ่ม filter, due date, tag, drag-and-drop หรือหน้าตั้งค่า — ผู้ใช้ยืนยันออกจากขอบเขตแล้ว
- **Don't** ทำอนิเมชั่นยาวเกิน 250ms เพิ่มอะไรไม่มีเหตุผลชัด — โลกนี้ตอบแบบ "ทันทีหยุดชัก"

---

**แหล่งความจริง:** `styles.css` และ `index.html` คือพื้นฐานทั้งหมดของไฟล์นี้ — ถ้าข้อความในไฟล์นี้ขัดกับโค้ด โค้ดใช่ขึ้นหน้า แล้วดับเบิลเช็คก่อนแก้ไฟล์นี้
