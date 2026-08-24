// ===== มาสเตอร์เครื่องใช้ไฟฟ้า (สำหรับสร้าง Load Profile) =====
// w = กำลังไฟเฉลี่ยขณะทำงาน (วัตต์) · band ค่าเริ่มต้น: day(กลางวัน) / eve(หัวค่ำ) / night(กลางคืน)

export const BANDS = {
  day: { label: "กลางวัน 09–16 น.", note: "โซลาร์จ่ายตรง", tone: "#F5821F" },
  eve: { label: "หัวค่ำ 16–22 น.", note: "แบต/กริด", tone: "#6e6e73" },
  night: { label: "กลางคืน 22–09 น.", note: "แบต/กริด", tone: "#1d1d1f" },
};

export const APPLIANCES = [
  { id: "ac9", name: "แอร์ 9,000 BTU", w: 850, band: "eve", grp: "แอร์" },
  { id: "ac12", name: "แอร์ 12,000 BTU", w: 1100, band: "eve", grp: "แอร์" },
  { id: "ac18", name: "แอร์ 18,000 BTU", w: 1600, band: "eve", grp: "แอร์" },
  { id: "ac24", name: "แอร์ 24,000 BTU", w: 2100, band: "eve", grp: "แอร์" },
  { id: "ac36", name: "แอร์ 36,000 BTU", w: 3200, band: "day", grp: "แอร์" },
  { id: "fridge", name: "ตู้เย็น (ทั่วไป)", w: 90, band: "night", grp: "ครัว" },
  { id: "fridge2", name: "ตู้เย็น 2 ประตู / Side-by-side", w: 200, band: "night", grp: "ครัว" },
  { id: "freezer", name: "ตู้แช่แข็ง", w: 350, band: "night", grp: "ครัว" },
  { id: "micro", name: "ไมโครเวฟ", w: 1000, band: "eve", grp: "ครัว" },
  { id: "rice", name: "หม้อหุงข้าว", w: 700, band: "eve", grp: "ครัว" },
  { id: "kettle", name: "กระติกน้ำร้อน", w: 800, band: "day", grp: "ครัว" },
  { id: "induction", name: "เตาไฟฟ้า / เตาแม่เหล็ก", w: 2000, band: "eve", grp: "ครัว" },
  { id: "coffee", name: "เครื่องชงกาแฟ", w: 1500, band: "day", grp: "ครัว" },
  { id: "washer", name: "เครื่องซักผ้า", w: 500, band: "day", grp: "ซักล้าง" },
  { id: "dryer", name: "เครื่องอบผ้า", w: 2500, band: "day", grp: "ซักล้าง" },
  { id: "heater", name: "เครื่องทำน้ำอุ่น", w: 3500, band: "eve", grp: "ซักล้าง" },
  { id: "iron", name: "เตารีด", w: 1200, band: "day", grp: "ซักล้าง" },
  { id: "pump", name: "ปั๊มน้ำ", w: 400, band: "day", grp: "อื่นๆ" },
  { id: "tv", name: "ทีวี", w: 120, band: "eve", grp: "อื่นๆ" },
  { id: "pc", name: "คอมพิวเตอร์ / ตั้งโต๊ะ", w: 200, band: "day", grp: "อื่นๆ" },
  { id: "fan", name: "พัดลม", w: 60, band: "eve", grp: "อื่นๆ" },
  { id: "led", name: "หลอดไฟ LED", w: 10, band: "eve", grp: "อื่นๆ" },
  { id: "ev", name: "EV Charger (บ้าน)", w: 7000, band: "night", grp: "อื่นๆ" },
  { id: "aircomp", name: "ปั๊มลม", w: 1500, band: "day", grp: "ธุรกิจ" },
  { id: "motor", name: "มอเตอร์ / เครื่องจักร", w: 2200, band: "day", grp: "ธุรกิจ" },
  { id: "chiller", name: "ตู้แช่กระจก (ร้านค้า)", w: 350, band: "day", grp: "ธุรกิจ" },
];

// พารามิเตอร์คำนวณ
export const SUN_HOURS = 4;      // ชม.แดดเต็มต่อวัน (ประเทศไทย)
export const PANEL_W = 650;      // ขนาดแผงมาตรฐาน (Wp)
export const BATT_UNIT = 7;      // แบต 1 ก้อน = 7 kWh (Atmoce MS-7K-U)
