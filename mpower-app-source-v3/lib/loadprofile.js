// ===== Load Profile engine — ละเอียดระดับรายชั่วโมง + แอร์แม่นจาก BTU =====
// แอร์: กำลังพิกัด = BTU / EER ; กำลังเฉลี่ยขณะทำงาน = พิกัด x duty
//  - อินเวอร์เตอร์ปรับรอบคอมเพรสเซอร์ หลังห้องเย็นจะกินไฟต่ำกว่าพิกัดมาก (เฉลี่ย ~58%)
//  - ธรรมดา (fixed speed) คอมเพรสเซอร์ตัด-ต่อ เฉลี่ย ~70%
// เครื่องใช้ไฟอื่น: nameplate kW x duty (ตู้เย็น/ตู้แช่ทำงาน 24 ชม.แต่คอมเพรสเซอร์ตัด-ต่อ)

export const SUN_HOURS = 4;      // ชม.แดดเต็มต่อวัน (ไทย)
export const PANEL_W = 650;      // ขนาดแผงมาตรฐาน (Wp)
export const BATT_UNIT = 7;      // แบต 1 ก้อน = 7 kWh (Atmoce MS-7K-U)
export const SELL_RATE = 4.2;    // ฿/หน่วย (ประเมินประหยัดเฉลี่ย)

export const AC_EER = 11.2;      // Btu/h ต่อ W (แอร์เบอร์ 5 ตลาดไทย)
export const AC_DUTY = { inverter: 0.58, standard: 0.70 };

export function acRatedKw(btu) { return Math.round((btu / AC_EER)) / 1000; }
export function acAvgKw(btu, type) {
  const duty = AC_DUTY[type] || AC_DUTY.inverter;
  return Math.round(acRatedKw(btu) * duty * 100) / 100;
}

export const AC_PRESETS = [9000, 12000, 18000, 24000, 36000];

// แคตตาล็อกเครื่องใช้ไฟฟ้า (ไม่รวมแอร์) — kw = nameplate, duty = เฉลี่ยขณะทำงาน
export const CATALOG = [
  { id: "fridge", name: "ตู้เย็น 1 ประตู", kw: 0.15, duty: 0.35, grp: "ครัว", allday: true },
  { id: "fridge2", name: "ตู้เย็น 2 ประตู", kw: 0.3, duty: 0.35, grp: "ครัว", allday: true },
  { id: "freezer", name: "ตู้แช่แข็ง", kw: 0.35, duty: 0.4, grp: "ครัว", allday: true },
  { id: "micro", name: "ไมโครเวฟ", kw: 1.0, duty: 1.0, grp: "ครัว" },
  { id: "rice", name: "หม้อหุงข้าว", kw: 0.7, duty: 0.6, grp: "ครัว" },
  { id: "kettle", name: "กระติกน้ำร้อน", kw: 0.8, duty: 0.5, grp: "ครัว" },
  { id: "induction", name: "เตาแม่เหล็กไฟฟ้า", kw: 2.0, duty: 0.7, grp: "ครัว" },
  { id: "washer", name: "เครื่องซักผ้า", kw: 0.5, duty: 0.5, grp: "ซักล้าง" },
  { id: "heater", name: "เครื่องทำน้ำอุ่น", kw: 3.5, duty: 1.0, grp: "ซักล้าง" },
  { id: "iron", name: "เตารีด", kw: 1.2, duty: 0.6, grp: "ซักล้าง" },
  { id: "pump", name: "ปั๊มน้ำ", kw: 0.4, duty: 0.4, grp: "อื่นๆ" },
  { id: "tv", name: "ทีวี", kw: 0.1, duty: 1.0, grp: "อื่นๆ" },
  { id: "pc", name: "คอมพิวเตอร์", kw: 0.2, duty: 0.8, grp: "อื่นๆ" },
  { id: "fan", name: "พัดลม", kw: 0.06, duty: 1.0, grp: "อื่นๆ" },
  { id: "led", name: "ไฟ LED (รวมบ้าน)", kw: 0.1, duty: 1.0, grp: "อื่นๆ" },
  { id: "ev", name: "EV Charger", kw: 7.0, duty: 1.0, grp: "อื่นๆ" },
  { id: "chiller", name: "ตู้แช่กระจกร้านค้า", kw: 0.35, duty: 0.5, grp: "ธุรกิจ", allday: true },
  { id: "aircomp", name: "ปั๊มลม", kw: 1.5, duty: 0.5, grp: "ธุรกิจ" },
  { id: "motor", name: "มอเตอร์/เครื่องจักร", kw: 2.2, duty: 0.6, grp: "ธุรกิจ" },
];

// ชั่วโมงที่แดดจ่ายได้จริง (โซลาร์คุ้มสุด)
export const SOLAR_HOURS = [9, 10, 11, 12, 13, 14, 15];
export function isNight(i) { return i >= 22 || i < 6; }

// power ต่อ 1 ยูนิตของแต่ละ row: แอร์ใช้ acAvgKw, อื่นๆ ใช้ kw*duty
export function rowPower(r) {
  if (r.kind === "ac") return acAvgKw(r.btu, r.acType);
  return Math.round((r.kw || 0) * (r.duty == null ? 1 : r.duty) * 1000) / 1000;
}

// รวมพลังงานรายชั่วโมง (kWh ต่อชั่วโมง = kW คงที่ 1 ชม.)
export function hourly(rows) {
  const h = new Array(24).fill(0);
  for (const r of rows) {
    const p = rowPower(r) * (r.qty || 1);
    for (let i = 0; i < 24; i++) if (r.hours[i]) h[i] += p;
  }
  return h;
}

export function summarize(rows) {
  const h = hourly(rows);
  let total = 0, dayLoad = 0, offLoad = 0, nightLoad = 0;
  for (let i = 0; i < 24; i++) {
    total += h[i];
    if (SOLAR_HOURS.indexOf(i) >= 0) dayLoad += h[i]; else offLoad += h[i];
    if (isNight(i)) nightLoad += h[i];
  }
  return { h, total, dayLoad, offLoad, nightLoad };
}

// batteryPref: "off_night" (หัวค่ำ+คืน) | "night" (คืนอย่างเดียว) | "none"
export function recommend(rows, batteryPref) {
  const s = summarize(rows);
  const battTarget = batteryPref === "none" ? 0 : batteryPref === "night" ? s.nightLoad : s.offLoad;
  const battModules = battTarget > 0 ? Math.max(1, Math.round(battTarget / BATT_UNIT)) : 0;
  const battKwh = battModules * BATT_UNIT;
  const recKwp = Math.max(0.66, ((s.dayLoad + battTarget) / SUN_HOURS) * 1.1);
  const panels = Math.ceil((recKwp * 1000) / PANEL_W);
  const kwp = Math.round((panels * PANEL_W) / 1000 * 100) / 100;
  const dailyProd = Math.round(kwp * SUN_HOURS * 10) / 10;
  const offset = Math.min(s.dayLoad, dailyProd) + Math.min(battKwh, s.offLoad);
  const monthlySave = Math.round(offset * 30 * SELL_RATE);
  return { ...s, battModules, battKwh, kwp, panels, dailyProd, monthlySave };
}

// ===== โค้งการผลิตรายชั่วโมง (ระฆังคว่ำ) — พีคเที่ยง 0 ก่อน 6 โมง/หลัง 18 โมง =====
export const SOLAR_SHAPE = (function () {
  const w = new Array(24).fill(0);
  for (let h = 6; h <= 18; h++) w[h] = Math.sin((Math.PI * (h - 6)) / 12);
  return w;
})();

// แจกจ่ายพลังงานที่ผลิตได้ทั้งวัน (kWp x แดด) ลงตามรูประฆัง → kWh ต่อชั่วโมง
export function productionCurve(kwp) {
  const daily = (kwp || 0) * SUN_HOURS;
  const sum = SOLAR_SHAPE.reduce((a, b) => a + b, 0) || 1;
  return SOLAR_SHAPE.map((w) => (daily * w) / sum);
}
