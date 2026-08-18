// ตัวเชื่อม Atmoce Cloud — ดึงกำลังผลิตเรียลไทม์รายไซต์
// เมื่อได้ API จริง: ตั้ง env ATMOCE_TOKEN + ATMOCE_BASE แล้วเติมโค้ดใน fetchReal()
// ตอนนี้คืน mock เพื่อให้หน้าจอทำงานก่อน — โครงสร้างข้อมูลเหมือนของจริง

export function atmoceConfigured() {
  return !!(process.env.ATMOCE_TOKEN && process.env.ATMOCE_BASE);
}

const MOCK = [
  { id: "ATM-1001", name: "บ้านคุณสมชาย · ปทุมธานี", kwp: 10 },
  { id: "ATM-1002", name: "ร้านกาแฟบ้านสวน · นนทบุรี", kwp: 15 },
  { id: "ATM-1003", name: "หจก.รุ่งเรือง · สมุทรปราการ", kwp: 20 },
  { id: "ATM-1004", name: "โรงงานเย็นสบาย · ชลบุรี", kwp: 40 },
];

function mockNow(kwp, i) {
  const h = new Date().getHours();
  const day = Math.max(0, Math.sin(((h - 6) / 12) * Math.PI)); // โค้งกลางวัน
  const nowKw = +(kwp * day * (0.75 + 0.2 * Math.sin(i + 1))).toFixed(1);
  const todayKwh = +(kwp * (3.4 + (i % 3) * 0.4)).toFixed(0);
  return { id: MOCK[i].id, name: MOCK[i].name, kwp, nowKw, todayKwh, online: true };
}

export async function getSites() {
  if (!atmoceConfigured()) return MOCK.map((s, i) => mockNow(s.kwp, i));
  return fetchReal();
}

// โครงสำหรับ API จริง (เติมเมื่อได้ endpoint/token จาก Atmoce)
async function fetchReal() {
  const res = await fetch(`${process.env.ATMOCE_BASE}/plants/overview`, {
    headers: { Authorization: `Bearer ${process.env.ATMOCE_TOKEN}` },
    cache: "no-store",
  });
  const data = await res.json();
  // TODO: map ตาม schema จริงของ Atmoce
  return (data.plants || []).map((p) => ({
    id: p.id, name: p.name, kwp: p.capacity,
    nowKw: p.currentPower, todayKwh: p.todayEnergy, online: p.status === "online",
  }));
}
