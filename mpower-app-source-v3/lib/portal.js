// รายการรูปติดตั้งที่ช่างต้องถ่ายส่ง — อิงเซอร์เวย์หน้างาน + เกณฑ์ SLD/ยื่นขนานไฟ
// ใช้ร่วมกันทั้งฝั่งช่าง (อัปโหลด) และฝั่งแอดมิน (ตรวจ/อนุมัติ)
export const PHOTO_CHECKLIST = [
  // A) พื้นฐานหน้างาน (ตามเซอร์เวย์)
  { key: "meter",        group: "พื้นฐานหน้างาน",   label: "มิเตอร์ไฟ + หมายเลข",        required: true },
  { key: "mdb",          group: "พื้นฐานหน้างาน",   label: "ตู้ MDB / เมนเบรกเกอร์",       required: true },
  { key: "roof",         group: "พื้นฐานหน้างาน",   label: "หลังคา/จุดติดตั้งแผง",         required: true },
  { key: "ground",       group: "พื้นฐานหน้างาน",   label: "หลักดิน / กราวด์",            required: true },
  // B) สำหรับ SLD + ยื่นขนานไฟ PEA
  { key: "panel",        group: "SLD / ยื่นขนานไฟ", label: "แผงโซลาร์ (เห็นรุ่น/จำนวน)",   required: true },
  { key: "micro",        group: "SLD / ยื่นขนานไฟ", label: "ไมโครอินเวอร์เตอร์/อินเวอร์เตอร์", required: true },
  { key: "combiner",     group: "SLD / ยื่นขนานไฟ", label: "ตู้คอมไบเนอร์ + เบรกเกอร์",   required: true },
  { key: "tie_in",       group: "SLD / ยื่นขนานไฟ", label: "จุดเชื่อมต่อระบบ (tie-in)",    required: true },
  { key: "battery",      group: "SLD / ยื่นขนานไฟ", label: "แบตเตอรี่ (ถ้ามี)",           required: false },
  { key: "warning_label",group: "SLD / ยื่นขนานไฟ", label: "ป้ายเตือน/ป้ายวงจร",          required: true },
  // C) ตรวจรับ/ภาพรวม
  { key: "commissioning",group: "ตรวจรับระบบ",     label: "จอ/แอปแสดงกำลังผลิต (commissioning)", required: true },
  { key: "overview",     group: "ตรวจรับระบบ",     label: "ภาพรวมระบบหลังติดตั้งเสร็จ",   required: true },
];

export const CHECKLIST_MAP = Object.fromEntries(PHOTO_CHECKLIST.map((c) => [c.key, c]));

// จัดกลุ่มไว้ให้ render เป็นหมวด
export const CHECKLIST_GROUPS = PHOTO_CHECKLIST.reduce((acc, c) => {
  (acc[c.group] = acc[c.group] || []).push(c);
  return acc;
}, {});
