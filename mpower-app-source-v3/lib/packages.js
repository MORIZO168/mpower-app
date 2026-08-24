// ===== แพคเกจการขาย M Power (ราคารวม VAT — แก้ได้ที่ Rate Master ภายหลัง) =====
// ฐาน = ระบบ on-grid ไม่มีแบต · เพิ่มแบต/แผง/backup เป็น add-on

export const PACKAGES = [
  { id: "S", name: "S · บ้านเล็ก", kwp: 5.2, panels: 8, inverter: "Atmoce 5kW", price: 155000, phase: 1 },
  { id: "M", name: "M · บ้านทั่วไป", kwp: 10.4, panels: 16, inverter: "Atmoce 10kW", price: 285000, phase: 1 },
  { id: "L", name: "L · บ้านใหญ่ / ร้านค้า", kwp: 15.6, panels: 24, inverter: "Atmoce 15kW", price: 410000, phase: 3 },
  { id: "XL", name: "XL · ธุรกิจ", kwp: 20.15, panels: 31, inverter: "Atmoce 15kW + 5kW", price: 530000, phase: 3 },
];

// ราคา add-on ต่อหน่วย (รวม VAT)
export const ADDON = {
  panel: 6500,     // +แผง 650W (รวม mounting + micro share) ต่อแผ่น → +0.65 kWp
  battery: 75000,  // +แบต 7 kWh ต่อก้อน (Atmoce MS-7K-U)
  backup: 25000,   // Backup box (ใช้ไฟตอนไฟดับ)
  war20: 15000,    // ขยายประกัน 20 ปี
  war25: 30000,    // ขยายประกัน 25 ปี
};

export const PANEL_KWP = 0.65; // แผง 650W
export const BATT_KWH = 7;

// เลือกแพคเกจที่เหมาะจากขนาด kWp ที่ประเมิน (จาก Load Profile)
export function suggestPackage(kwp) {
  let best = PACKAGES[0];
  for (const p of PACKAGES) if (kwp >= p.kwp - 1) best = p;
  return best;
}

// สรุปสเปค+ราคาจากแพคเกจ + add-on
export function buildSystem(pkgId, opt = {}) {
  const p = PACKAGES.find((x) => x.id === pkgId) || PACKAGES[1];
  const extraPanels = opt.extraPanels || 0;
  const battCount = opt.battCount || 0;
  const backup = !!opt.backup;
  const warranty = opt.warranty || 15;

  const kwp = +(p.kwp + extraPanels * PANEL_KWP).toFixed(2);
  const panels = p.panels + extraPanels;
  const battery = battCount * BATT_KWH;

  let price = p.price + extraPanels * ADDON.panel + battCount * ADDON.battery;
  if (backup) price += ADDON.backup;
  if (warranty === 20) price += ADDON.war20;
  if (warranty === 25) price += ADDON.war25;

  const lines = [
    { label: `แพคเกจ ${p.name}`, detail: `${p.panels} แผง · ${p.inverter}`, amount: p.price },
  ];
  if (extraPanels) lines.push({ label: `+ แผงเพิ่ม ${extraPanels} แผ่น`, detail: `+${(extraPanels * PANEL_KWP).toFixed(2)} kWp`, amount: extraPanels * ADDON.panel });
  if (battCount) lines.push({ label: `+ แบตเตอรี่ ${battCount} ก้อน`, detail: `${battery} kWh`, amount: battCount * ADDON.battery });
  if (backup) lines.push({ label: "+ Backup box", detail: "ใช้ไฟตอนไฟดับ", amount: ADDON.backup });
  if (warranty > 15) lines.push({ label: `+ ขยายประกัน ${warranty} ปี`, detail: "ไมโครอินเวอร์เตอร์", amount: warranty === 25 ? ADDON.war25 : ADDON.war20 });

  return { pkg: p, kwp, panels, inverter: p.inverter, battery, backup, warranty, price, lines };
}
