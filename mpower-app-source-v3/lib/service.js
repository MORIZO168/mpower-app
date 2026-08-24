// ===== บริการหลังการขาย / O&M — ทะเบียนไซต์ + ประกัน + บำรุงรักษา =====
// ทะเบียนไซต์ที่ติดตั้งไปแล้ว (Installed Base) = ฐานข้อมูลกลาง ป้อน Fleet/ประกัน/MA ได้
// ต่อ Google Sheet (แท็บ Installed_Base) ภายหลังได้ — โครงเตรียมไว้แล้ว

export const MA_INTERVAL_MONTHS = 6;   // รอบล้าง/ตรวจเช็ก (เดือน)
export const WARRANTY = { panel: 25, inverter: 10, battery: 10, workmanship: 1 }; // ปี (ค่าเริ่มต้น)

export const BRAND_TONE = { Sigenergy: "#0a84ff", Atmoce: "#F5821F" };

// ข้อมูลตัวอย่าง — แทนที่ด้วยของจริง 27 หลัง + งานใหม่ได้
export const INSTALLED = [
  { id: "MP-2605-001", name: "Santi TMT", area: "นครปฐม", brand: "Sigenergy", kwp: 10, battKwh: 20, installDate: "2026-05-10", lastServiceDate: "2026-05-10", ticket: null },
  { id: "MP-2606-002", name: "Isarawan TMT", area: "นครปฐม", brand: "Sigenergy", kwp: 5, battKwh: 0, installDate: "2026-06-01", lastServiceDate: "2026-06-01", ticket: null },
  { id: "MP-2603-003", name: "ร้านกาแฟบ้านสวน", area: "นครปฐม", brand: "Atmoce", kwp: 5.2, battKwh: 7, installDate: "2026-03-15", lastServiceDate: "2026-03-15", ticket: { issue: "แอปแสดงผลผลิตไม่อัปเดต", status: "open" } },
  { id: "MP-2604-004", name: "คุณสมชาย (บ้านพัก)", area: "ราชบุรี", brand: "Atmoce", kwp: 10.4, battKwh: 14, installDate: "2026-04-20", lastServiceDate: "2026-04-20", ticket: null },
  { id: "MP-H-005", name: "บ้านคุณวิชัย", area: "นครปฐม", brand: "Atmoce", kwp: 5, battKwh: 0, installDate: "2024-02-10", lastServiceDate: "2025-08-10", ticket: null },
  { id: "MP-H-006", name: "หจก.รุ่งเรือง", area: "สุพรรณบุรี", brand: "Sigenergy", kwp: 15, battKwh: 20, installDate: "2023-08-01", lastServiceDate: "2025-02-01", ticket: null },
  { id: "MP-2511-007", name: "คุณมาลี", area: "นครปฐม", brand: "Atmoce", kwp: 5, battKwh: 7, installDate: "2025-11-05", lastServiceDate: "2025-11-05", ticket: null },
];

function parse(d) { return new Date(d + "T00:00:00"); }
function addYears(d, y) { const x = parse(d); x.setFullYear(x.getFullYear() + y); return x; }
function addMonths(d, m) { const x = parse(d); x.setMonth(x.getMonth() + m); return x; }
function iso(x) { return x.getFullYear() + "-" + String(x.getMonth() + 1).padStart(2, "0") + "-" + String(x.getDate()).padStart(2, "0"); }
export function daysLeft(x, now) { return Math.round((x - (now || new Date())) / 86400000); }
export function wStatus(dl) { return dl < 0 ? "expired" : dl <= 90 ? "expiring" : "ok"; }

function comp(label, installDate, years, now) {
  const end = addYears(installDate, years);
  const dl = daysLeft(end, now);
  return { label, years, end: iso(end), daysLeft: dl, status: wStatus(dl) };
}

// ประกันแยกตามชิ้นส่วนของไซต์
export function warranties(site, now) {
  const list = [
    comp("แผงโซลาร์ (ประสิทธิภาพ)", site.installDate, WARRANTY.panel, now),
    comp("อินเวอร์เตอร์", site.installDate, WARRANTY.inverter, now),
  ];
  if (site.battKwh) list.push(comp("แบตเตอรี่", site.installDate, WARRANTY.battery, now));
  list.push(comp("ค่าแรง/ติดตั้ง", site.installDate, WARRANTY.workmanship, now));
  return list;
}

// รอบบำรุงรักษา
export function maintenance(site, now) {
  const next = addMonths(site.lastServiceDate || site.installDate, MA_INTERVAL_MONTHS);
  const dl = daysLeft(next, now);
  return { next: iso(next), daysLeft: dl, status: dl < 0 ? "overdue" : dl <= 30 ? "due" : "ok" };
}

// ประกันที่ใกล้หมด/หมดแล้วของไซต์ (ไม่รวมที่ยังเหลือเยอะ)
export function warrantyFlags(site, now) {
  return warranties(site, now).filter((w) => w.status !== "ok");
}

// สรุปภาพรวมทั้ง fleet
export function overview(sites, now) {
  let expiring = 0, maDue = 0, tickets = 0;
  const alerts = [];
  for (const s of sites) {
    warrantyFlags(s, now).forEach((w) => {
      expiring++;
      alerts.push({ type: "warranty", site: s, label: w.label, detail: w.status === "expired" ? "ประกันหมดแล้ว (" + w.end + ")" : "ประกันเหลือ " + w.daysLeft + " วัน", urgency: w.status === "expired" ? 3 : 2, tone: w.status === "expired" ? "bad" : "warn" });
    });
    const m = maintenance(s, now);
    if (m.status !== "ok") {
      maDue++;
      alerts.push({ type: "ma", site: s, label: "ถึงรอบล้าง/ตรวจเช็ก", detail: m.status === "overdue" ? "เลยกำหนด " + Math.abs(m.daysLeft) + " วัน (" + m.next + ")" : "อีก " + m.daysLeft + " วัน (" + m.next + ")", urgency: m.status === "overdue" ? 3 : 1, tone: m.status === "overdue" ? "bad" : "warn" });
    }
    if (s.ticket && s.ticket.status === "open") {
      tickets++;
      alerts.push({ type: "ticket", site: s, label: "เคสแจ้งซ่อม", detail: s.ticket.issue, urgency: 3, tone: "bad" });
    }
  }
  alerts.sort((a, b) => b.urgency - a.urgency);
  return { count: sites.length, expiring, maDue, tickets, alerts };
}
