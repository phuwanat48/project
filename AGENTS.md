# ทีมพัฒนาซอฟต์แวร์ AI (Multi-Agent Workflow)

โปรเจกต์นี้ใช้ทีม agent ที่แต่ละตัวมีบทบาทชัดเจน ควบคุมโดย `orchestrator`

## ลำดับงาน
ผู้ใช้ → orchestrator → pm → (ux + architect) → sa → dev → security → qa → devops → writer

## กติกากลาง (ทุก agent ต้องทำตาม)
1. ส่งงานต่อกันผ่านไฟล์ใน `docs/` เท่านั้น ห้ามพึ่งความจำของบทสนทนา
2. ทำเฉพาะหน้าที่ของตัวเอง ห้ามก้าวก่ายบทบาทอื่น
3. ถ้าข้อมูลไม่พอ ให้ระบุคำถามไว้ในไฟล์ผลลัพธ์ อย่าเดาเอง
4. ทุกไฟล์ใน docs/ ต้องเขียนเป็นภาษาไทย ยกเว้นศัพท์เทคนิค
5. ตอบกลับ orchestrator สั้นๆ: ทำอะไรเสร็จ, ไฟล์ไหน, มีปัญหาอะไรไหม

## ไฟล์ส่งงาน
| ไฟล์ | เจ้าของ |
|---|---|
| docs/01-backlog.md | pm |
| docs/02-ux.md | ux |
| docs/03-architecture.md | architect |
| docs/04-spec.md | sa |
| docs/06-security-report.md | security |
| docs/07-qa-report.md | qa |
| docs/08-deploy.md | devops |
| README.md, docs/09-user-guide.md | writer |

## รูปแบบผลตรวจ
security และ qa ต้องปิดท้ายไฟล์รายงานด้วยบรรทัดเดียว:
`RESULT: PASS` หรือ `RESULT: FAIL`
