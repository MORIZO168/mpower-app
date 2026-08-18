// โครงการ M Power — เดินงานเป็นเส้นเดียว 6 ขั้น (แรงบันดาลใจจาก Fireout แต่ดีไซน์เราเอง)
// ภายหลังจะดึงจาก Google Sheets แท็บ Jobs แทน mock

export const STAGES = [
  "ข้อมูลลูกค้า",
  "สำรวจหน้างาน",
  "ออกแบบ + วางแผน",
  "วิเคราะห์คุ้มทุน",
  "ใบเสนอ / BOQ",
  "ปิดการขาย",
];

// mock โครงการ (ผสม EPC กับงานรับซับให้ TOGETA)
export const PROJECTS = [
  {
    id: "p-2608-001", code: "PRJ-202608-001", customer: "หจก. รุ่งเรืองพานิช",
    jobType: "EPC", client: "หจก. รุ่งเรืองพานิช", province: "กรุงเทพ", buildingType: "ร้านค้า",
    kwp: 10, value: 280000, owner: "มอส", stageIndex: 5, ageDays: 3, subTeam: "ทีมA",
    detail: {
      customer: { phone: "02-111-2222", address: "ถ.สุขุมวิท กรุงเทพ", type: "ร้านค้า", utility: "PEA" },
      survey: { utility: "PEA", meterOwner: "หจก. รุ่งเรืองพานิช", meterNo: "PEA-55210", ca: "020112222",
        usage: [{ m: "2026-05", kwh: 2850, baht: 12000 }, { m: "2026-06", kwh: 2910, baht: 12250 }, { m: "2026-07", kwh: 3040, baht: 12800 }] },
      design: { panelQty: 18, panelModel: "JA 555W", roofArea: 55, tilt: 15, azimuth: "ใต้", note: "หลังคาเมทัลชีท วางได้เต็ม" },
      analysis: { annualKwh: 14500, perDay: 40, selfUse: 82, payback: 4.6, savingYear: 60900, tariff: "TOU" },
      boq: { inverter: "Atmoce 10kW", battery: "ไม่มีแบต", panelQty: 18, pkg: "แพ็กเกจ 10kW on-grid", cost: 196000, marginPct: 30, vat: 7 },
      close: { quoteSent: true, deposit: "รับมัดจำ 50% แล้ว", contract: "เซ็นแล้ว", result: "ปิดการขาย" },
    },
  },
  {
    id: "p-2608-002", code: "PRJ-202608-002", customer: "คุณสมชาย ใจดี",
    jobType: "EPC", client: "คุณสมชาย ใจดี", province: "สมุทรปราการ", buildingType: "บ้าน",
    kwp: 5, value: 165000, owner: "มอส", stageIndex: 2, ageDays: 6, subTeam: "ทีมB",
    detail: {
      customer: { phone: "081-234-5678", address: "ต.บางพลี สมุทรปราการ", type: "บ้าน", utility: "PEA" },
      survey: { utility: "PEA", meterOwner: "คุณสมชาย ใจดี", meterNo: "PEA-77120", ca: "081234567",
        usage: [{ m: "2026-05", kwh: 1020, baht: 4300 }, { m: "2026-06", kwh: 1080, baht: 4550 }, { m: "2026-07", kwh: 1050, baht: 4500 }] },
      design: { panelQty: 9, panelModel: "JA 555W", roofArea: 30, tilt: 18, azimuth: "ใต้", note: "หลังคากระเบื้อง เอียง 18°" },
      analysis: { annualKwh: 7250, perDay: 20, selfUse: 68, payback: 6.8, savingYear: 24300, tariff: "ขั้นบันได" },
      boq: { inverter: "Atmoce 5kW", battery: "ไม่มีแบต", panelQty: 9, pkg: "แพ็กเกจ 5kW on-grid", cost: 120000, marginPct: 27, vat: 7 },
      close: { quoteSent: false, deposit: "-", contract: "-", result: "กำลังดำเนินการ" },
    },
  },
  {
    id: "p-2608-003", code: "PRJ-202608-003", customer: "บ้านคุณเอกชัย (หน้างาน TOGETA)",
    jobType: "Subcontract", client: "TOGETA Solar", province: "ปทุมธานี", buildingType: "บ้าน",
    kwp: 8, value: 32000, owner: "มอส", stageIndex: 1, ageDays: 1, subTeam: "ทีมA",
    detail: {
      customer: { phone: "(ผ่าน TOGETA)", address: "อ.ธัญบุรี ปทุมธานี", type: "บ้าน", utility: "PEA" },
      survey: { utility: "PEA", meterOwner: "คุณเอกชัย", meterNo: "-", ca: "-",
        usage: [] },
      design: { panelQty: 15, panelModel: "(TOGETA จัดหา)", roofArea: 48, tilt: 15, azimuth: "ตะวันตก", note: "TOGETA ออกแบบ เราติดตั้ง" },
      analysis: { annualKwh: 11600, perDay: 32, selfUse: 0, payback: 0, savingYear: 0, tariff: "-" },
      boq: { inverter: "(TOGETA จัดหา)", battery: "-", panelQty: 15, pkg: "รับจ้างติดตั้ง (ค่าแรง 4฿/W)", cost: 20000, marginPct: 37, vat: 7 },
      close: { quoteSent: true, deposit: "TOGETA ออก PO", contract: "ใบสั่งจ้าง", result: "กำลังดำเนินการ" },
    },
  },
  {
    id: "p-2607-014", code: "PRJ-202607-014", customer: "โรงงานเย็นสบาย",
    jobType: "EPC", client: "โรงงานเย็นสบาย", province: "ชลบุรี", buildingType: "โรงงาน",
    kwp: 15, value: 405000, owner: "มอส", stageIndex: 3, ageDays: 12, subTeam: "ทีมA",
    detail: {
      customer: { phone: "038-555-000", address: "อ.ศรีราชา ชลบุรี", type: "โรงงาน", utility: "PEA" },
      survey: { utility: "PEA", meterOwner: "บจก. เย็นสบาย", meterNo: "PEA-31005", ca: "038555000",
        usage: [{ m: "2026-05", kwh: 8200, baht: 34000 }, { m: "2026-06", kwh: 8600, baht: 35800 }, { m: "2026-07", kwh: 8900, baht: 37000 }] },
      design: { panelQty: 27, panelModel: "JA 555W", roofArea: 90, tilt: 5, azimuth: "ใต้", note: "หลังคาโรงงาน วางเต็มแนวเดียว" },
      analysis: { annualKwh: 21750, perDay: 60, selfUse: 88, payback: 5.1, savingYear: 79000, tariff: "TOU" },
      boq: { inverter: "Atmoce 15kW", battery: "ไม่มีแบต", panelQty: 27, pkg: "แพ็กเกจ 15kW on-grid", cost: 284000, marginPct: 30, vat: 7 },
      close: { quoteSent: false, deposit: "-", contract: "-", result: "กำลังดำเนินการ" },
    },
  },
  {
    id: "p-2506-009", code: "PRJ-202506-009", customer: "ร้านกาแฟ Bloom",
    jobType: "EPC", client: "ร้านกาแฟ Bloom", province: "กรุงเทพ", buildingType: "ร้านค้า",
    kwp: 6, value: 190000, owner: "มอส", stageIndex: 6, ageDays: 65, subTeam: "ทีมB",
    detail: {
      customer: { phone: "089-000-1234", address: "เขตวัฒนา กรุงเทพ", type: "ร้านค้า", utility: "MEA" },
      survey: { utility: "MEA", meterOwner: "ร้านกาแฟ Bloom", meterNo: "MEA-90112", ca: "089000123",
        usage: [{ m: "2025-03", kwh: 1450, baht: 6100 }, { m: "2025-04", kwh: 1520, baht: 6400 }] },
      design: { panelQty: 11, panelModel: "JA 555W", roofArea: 36, tilt: 12, azimuth: "ตะวันออก", note: "ติดตั้งเสร็จ ส่งมอบแล้ว" },
      analysis: { annualKwh: 8700, perDay: 24, selfUse: 75, payback: 5.5, savingYear: 34500, tariff: "TOU" },
      boq: { inverter: "Atmoce 6kW", battery: "ไม่มีแบต", panelQty: 11, pkg: "แพ็กเกจ 6kW on-grid", cost: 138000, marginPct: 27, vat: 7 },
      close: { quoteSent: true, deposit: "ชำระครบ", contract: "ปิดงาน + ส่งมอบ", result: "ปิดการขาย (Win)" },
    },
  },
];

// stageIndex 6 = ปิดงานแล้ว (เกินขั้นสุดท้าย)
export const isDone = (p) => p.stageIndex >= STAGES.length;

export function getProject(id) {
  return PROJECTS.find((p) => p.id === id) || null;
}

// สีป้ายสถานะตามประเภทงาน
export const typeTone = (t) => (t === "Subcontract" ? "warn" : "ok");

export const baht = (n) => "฿" + Number(n).toLocaleString("th-TH");
