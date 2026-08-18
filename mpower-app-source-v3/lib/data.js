// ข้อมูลตัวอย่าง + ตรรกะธุรกิจ M Power
// (ภายหลังจะดึงจาก Google Sheets แทน mock — ดู lib/sheets.js)

export const STD = {
  acard_booking: 30,     // A-Card -> Booking (%)
  booking_delivery: 75,  // Booking -> Delivery (%)
  backorder_rate: 25,    // ค้างส่ง (ยิ่งต่ำยิ่งดี)
};

export const PRICING = {
  panel_baht_per_w: 5,     // แผง 5฿/W (M Power เตรียม)
  labor_baht_per_w: 6,     // ช่างซับเหมา all-in 6฿/W
  min_margin_pct: 30,      // กำไรขั้นต่ำ
  panel_w: 555,            // วัตต์ต่อแผง
};

// funnel รายเดือน (6 เดือนล่าสุด)
export const FUNNEL = [
  { month: "2026-02", acard: 92, booking: 27, delivery: 20, backorder: 5 },
  { month: "2026-03", acard: 104, booking: 33, delivery: 24, backorder: 6 },
  { month: "2026-04", acard: 110, booking: 34, delivery: 27, backorder: 4 },
  { month: "2026-05", acard: 98, booking: 31, delivery: 23, backorder: 7 },
  { month: "2026-06", acard: 115, booking: 40, delivery: 29, backorder: 8 },
  { month: "2026-07", acard: 120, booking: 38, delivery: 27, backorder: 6 },
];

// อินเวอร์เตอร์ Atmoce ที่ M Power สต็อก
export const INVERTERS = [
  { model: "Atmoce 5kW", kw: 5, cost: 28000, stock: 6 },
  { model: "Atmoce 10kW", kw: 10, cost: 45000, stock: 3 },
  { model: "Atmoce 15kW", kw: 15, cost: 62000, stock: 2 },
];

export const PANEL_STOCK = 180; // แผ่นในสต็อก

// งานที่ booking แล้ว รอติดตั้ง
export const JOBS = [
  { id: "S-202607-001", customer: "คุณสมชาย ร่มเกล้า", kw: 10, inverter: "Atmoce 10kW", stage: "ออกแบบ" },
  { id: "S-202607-002", customer: "ร้านกาแฟบ้านสวน", kw: 15, inverter: "Atmoce 15kW", stage: "รอติดตั้ง" },
  { id: "S-202607-003", customer: "คุณวิภา ทองดี", kw: 5, inverter: "Atmoce 5kW", stage: "เบิกของ" },
  { id: "S-202607-004", customer: "หจก. รุ่งเรืองพานิช", kw: 10, inverter: "Atmoce 10kW", stage: "ติดตั้ง" },
  { id: "S-202607-005", customer: "คุณธนา สีมา", kw: 10, inverter: "Atmoce 10kW", stage: "รอติดตั้ง" },
  { id: "S-202607-006", customer: "โรงงานเย็นสบาย", kw: 15, inverter: "Atmoce 15kW", stage: "ออกแบบ" },
];

export const PIPELINE_STAGES = ["A-Card", "สำรวจ", "ออกแบบ", "ใบเสนอ", "รอติดตั้ง", "เบิกของ", "ติดตั้ง", "หลังการขาย"];

export const PIPELINE_COUNT = {
  "A-Card": 82, "สำรวจ": 24, "ออกแบบ": 11, "ใบเสนอ": 9,
  "รอติดตั้ง": 6, "เบิกของ": 3, "ติดตั้ง": 2, "หลังการขาย": 41,
};

// ---------- ตรรกะ ----------
export function ratio(n, d) { return d ? Math.round((n / d) * 100) : 0; }

export function pricing(kw) {
  const w = kw * 1000;
  const panels = Math.ceil(w / PRICING.panel_w);
  const panelCost = w * PRICING.panel_baht_per_w;
  const inv = INVERTERS.find((i) => i.kw === kw) || INVERTERS[1];
  const labor = w * PRICING.labor_baht_per_w;
  const cost = panelCost + inv.cost + labor;
  const sell = Math.round(cost / (1 - PRICING.min_margin_pct / 100));
  const profit = sell - cost;
  return { w, panels, panelCost, inverter: inv, labor, cost, sell, profit,
           marginPct: Math.round((profit / sell) * 100) };
}

export function forecast(expectedAcard) {
  const b = Math.round(expectedAcard * STD.acard_booking / 100);
  const d = Math.round(b * STD.booking_delivery / 100);
  const revenue = d * 165000; // มูลค่าเฉลี่ยต่อหลัง
  return { acard: expectedAcard, booking: b, delivery: d, revenue };
}

// สรุปความต้องการ supply จากงานที่ booking แล้ว
export function supplyDemand() {
  let panelsNeeded = 0;
  const invNeed = {};
  JOBS.forEach((j) => {
    panelsNeeded += Math.ceil((j.kw * 1000) / PRICING.panel_w);
    invNeed[j.inverter] = (invNeed[j.inverter] || 0) + 1;
  });
  const inverters = INVERTERS.map((i) => ({
    ...i, need: invNeed[i.model] || 0,
    short: Math.max(0, (invNeed[i.model] || 0) - i.stock),
  }));
  return {
    panelsNeeded, panelStock: PANEL_STOCK,
    panelShort: Math.max(0, panelsNeeded - PANEL_STOCK),
    inverters,
  };
}

export const baht = (n) => "฿" + Number(n).toLocaleString("th-TH");
