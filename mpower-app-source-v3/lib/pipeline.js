// ===== แกนข้อมูลกลาง (Project spine) =====
// 1 deal ถือข้อมูลทุก stage: survey → load profile → roi → design → quote → อนุมัติ → ใบสั่งงาน → ติดตั้ง
// ทุกหน้าอ่าน/เขียน deal เดียวกัน (เฟสจริงเก็บ Google Sheet) — ตอนนี้ seed ตัวอย่าง

export const STAGES = ["A-Card", "สำรวจ", "Load/ROI", "ออกแบบ", "ใบเสนอ", "รออนุมัติ", "รอติดตั้ง", "ติดตั้ง", "ขอขนานไฟ", "ส่งมอบ"];

// สถานะนัดติดตั้ง 3 ฝ่าย: customer → installer → owner
export function installStatus(ins) {
  if (!ins) return { label: "ยังไม่นัด", tone: "mut", pending: null };
  if (ins.ownerApproved) return { label: "ยืนยันครบ 3 ฝ่าย", tone: "ok", pending: null };
  if (!ins.customerOk) return { label: "รอลูกค้ายืนยัน", tone: "warn", pending: "customer" };
  if (!ins.installerOk) return { label: "รอทีมช่างยืนยัน", tone: "warn", pending: "installer" };
  return { label: "รอเราอนุมัติ", tone: "bad", pending: "owner" };
}

export const DEALS = [
  {
    id: "MP-2608-012", customer: "เฮียประพน (บ้านคลองโยง)", phone: "081-234-5678", area: "นครปฐม",
    kwp: 8.71, panels: 13, inverter: "SigenStor EC8", battery: 8, stage: "รออนุมัติ",
    value: 290000, cost: 205000, margin: 41,
    approval: { type: "discount", amount: 15000, reason: "ลูกค้าเก่าแนะนำต่อ 2 ราย", by: "เซลส์ญาญ่า", status: "pending" },
    install: null, pin: "13.803, 100.318", nextAction: "อนุมัติส่วนลด 15,000", updated: "2026-08-24 09:10",
  },
  {
    id: "MP-2608-009", customer: "ร้านกาแฟบ้านสวน", phone: "089-111-2222", area: "กทม (ตลิ่งชัน)",
    kwp: 10.5, panels: 16, inverter: "Atmoce 10kW", battery: 0, stage: "รอติดตั้ง",
    value: 355000, cost: 250000, margin: 42,
    approval: null,
    install: { date: "2026-08-27", customerOk: true, installerOk: true, ownerApproved: false, team: "ทีมA (ช่างเอก)" },
    pin: "13.777, 100.456", nextAction: "อนุมัติวันนัดติดตั้ง 27 ส.ค.", updated: "2026-08-24 08:40",
  },
  {
    id: "MP-2608-007", customer: "คุณธนา สีมา", phone: "081-777-8888", area: "สมุทรปราการ",
    kwp: 5.0, panels: 8, inverter: "Atmoce 5kW", battery: 7, stage: "รอติดตั้ง",
    value: 265000, cost: 188000, margin: 41,
    approval: null,
    install: { date: "2026-08-26", customerOk: true, installerOk: false, ownerApproved: false, team: "ทีมB (ช่างบี)" },
    pin: "13.599, 100.597", nextAction: "ตามทีมช่างยืนยันวันติดตั้ง", updated: "2026-08-23 17:20",
  },
  {
    id: "MP-2608-011", customer: "หจก. รุ่งเรืองพานิช", phone: "02-111-3333", area: "กทม (บางแค)",
    kwp: 15.6, panels: 24, inverter: "Atmoce 15kW", battery: 0, stage: "ติดตั้ง",
    value: 520000, cost: 372000, margin: 40,
    approval: null,
    install: { date: "2026-08-25", customerOk: true, installerOk: true, ownerApproved: true, team: "ทีมA (ช่างเอก)" },
    pin: "13.696, 100.409", nextAction: "ทีมเข้าหน้างานพรุ่งนี้ 08:30", updated: "2026-08-24 07:55",
  },
  {
    id: "MP-2608-014", customer: "คุณมาลี สุขใจ", phone: "089-999-0000", area: "นนทบุรี",
    kwp: 6.5, panels: 10, inverter: "Atmoce 5kW", battery: 0, stage: "ใบเสนอ",
    value: 245000, cost: 175000, margin: 40,
    approval: { type: "margin", amount: 22, reason: "งบลูกค้าจำกัด ขอลดกำไรเหลือ 22%", by: "เซลส์บอย", status: "pending" },
    install: null, pin: "13.861, 100.514", nextAction: "อนุมัติกำไรต่ำกว่าเกณฑ์ (22% < 30%)", updated: "2026-08-24 10:05",
  },
  {
    id: "MP-2608-003", customer: "โรงงานเย็นสบาย", phone: "038-222-4444", area: "ชลบุรี",
    kwp: 40.0, panels: 61, inverter: "Atmoce 15kW ×3", battery: 0, stage: "ขอขนานไฟ",
    value: 1250000, cost: 900000, margin: 39,
    approval: null,
    install: { date: "2026-08-20", customerOk: true, installerOk: true, ownerApproved: true, team: "ทีมA + ทีมB" },
    pin: "13.361, 100.984", nextAction: "ยื่นขอขนานไฟ PEA ชลบุรี", updated: "2026-08-22 14:30",
  },
  {
    id: "MP-2608-016", customer: "คุณเอก (LINE lead)", phone: "081-555-6666", area: "กทม",
    kwp: 0, panels: 0, inverter: "-", battery: 0, stage: "สำรวจ",
    value: 0, cost: 0, margin: 0, approval: null, install: null,
    pin: "", nextAction: "นัดสำรวจหน้างาน (lead ร้อน 3 วันแล้ว)", updated: "2026-08-21 19:14",
  },
];

// funnel นับจำนวนต่อ stage (รวม deal เก่าที่ไม่ได้ลิสต์)
export const FUNNEL = {
  "A-Card": 82, "สำรวจ": 24, "Load/ROI": 15, "ออกแบบ": 11, "ใบเสนอ": 9,
  "รออนุมัติ": 2, "รอติดตั้ง": 6, "ติดตั้ง": 2, "ขอขนานไฟ": 3, "ส่งมอบ": 41,
};

export const money = (n) => "฿" + Math.round(n).toLocaleString("th-TH");

export function pendingApprovals(deals = DEALS) {
  return deals.filter((d) => d.approval && d.approval.status === "pending");
}

export function upcomingInstalls(deals = DEALS) {
  return deals
    .filter((d) => d.install && d.install.date)
    .sort((a, b) => a.install.date.localeCompare(b.install.date));
}

// สรุป AI เช้า/เย็น (คำนวณจาก deals)
export function brief(deals = DEALS) {
  const appr = pendingApprovals(deals);
  const installs = upcomingInstalls(deals);
  const needConfirm = installs.filter((d) => installStatus(d.install).pending);
  const pea = deals.filter((d) => d.stage === "ขอขนานไฟ");
  const hotLead = deals.filter((d) => d.stage === "สำรวจ" && d.nextAction.includes("ร้อน"));
  const items = [];
  if (appr.length) items.push({ tone: "bad", text: `${appr.length} รายการรออนุมัติจากคุณ (ส่วนลด/กำไร)`, href: "#approvals" });
  if (needConfirm.length) items.push({ tone: "warn", text: `${needConfirm.length} งานยังยืนยันวันนัดไม่ครบ 3 ฝ่าย`, href: "#schedule" });
  if (installs.length) items.push({ tone: "ok", text: `${installs.length} งานมีคิวติดตั้ง — งานใกล้สุด ${installs[0].install.date}`, href: "#schedule" });
  if (pea.length) items.push({ tone: "warn", text: `${pea.length} งานอยู่ขั้นขอขนานไฟ PEA`, href: null });
  if (hotLead.length) items.push({ tone: "bad", text: `${hotLead.length} lead ร้อนยังไม่ได้นัดสำรวจ`, href: null });
  return items;
}
