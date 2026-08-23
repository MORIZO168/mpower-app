// ===== A-Card omnichannel — ข้อมูลอินบ็อกซ์รวมทุกช่องทาง =====
// ทุก lead แท็ก channel + campaign เพื่อวัด Performance (บันทึกลง Google Sheet แท็บ Leads_Inbox)

export const CHANNELS = {
  LINE: { label: "LINE OA", tone: "#06C755", short: "LINE" },
  Facebook: { label: "Facebook", tone: "#1877F2", short: "FB" },
  Instagram: { label: "Instagram", tone: "#C13584", short: "IG" },
  TikTok: { label: "TikTok", tone: "#1d1d1f", short: "TT" },
  Google: { label: "Google", tone: "#EA4335", short: "G" },
  Referral: { label: "แนะนำต่อ", tone: "#F5821F", short: "อ้างอิง" },
};

export const LEADS = [
  { id: "LD-2608-0001", at: "2026-08-22 09:14", channel: "LINE", account: "@mpower", campaign: "ส.ค.-ลดค่าไฟ", name: "คุณเอก", handle: "Uxxxx1", msg: "ค่าไฟเดือนละ 6 พัน ติดโซลาร์คุ้มไหม", reply: "6,000 บาท/เดือน ประหยัดได้ ~60% ค่ะ ขอทราบจังหวัด+หลังคาแบบไหนคะ", intent: "quote", grade: "A", status: "bot_replied", handoff: false, acard: "AC-2608-010" },
  { id: "LD-2608-0002", at: "2026-08-22 12:40", channel: "Facebook", account: "M Power 168", campaign: "FB-boost-solar", name: "คุณนภา", handle: "fb_10233", msg: "สนใจแบบมีแบต ราคาเท่าไหร่", reply: "ระบบมีแบตเตอรี่เริ่มที่… เดี๋ยวทีมงานส่งใบเสนอให้นะคะ", intent: "quote", grade: "A", status: "human", handoff: true, acard: "AC-2608-011" },
  { id: "LD-2608-0003", at: "2026-08-21 19:02", channel: "Instagram", account: "mpower.energy", campaign: "IG-story", name: "คุณต่อ", handle: "ig_559", msg: "ผ่อนได้ไหมครับ", reply: "มีผ่อน 0% กับธนาคารพันธมิตรค่ะ ขอเบอร์ติดต่อกลับได้ไหมคะ", intent: "finance", grade: "B", status: "bot_replied", handoff: false, acard: "" },
  { id: "LD-2608-0004", at: "2026-08-22 08:30", channel: "TikTok", account: "@mpowerth", campaign: "TT-clip-ราคา", name: "คุณฝน", handle: "tt_777", msg: "คอมเมนต์: ราคาโปรฯ", reply: "ทักไลน์ @mpower นะคะ (คีย์มือ)", intent: "info", grade: "C", status: "manual", handoff: false, acard: "" },
  { id: "LD-2608-0005", at: "2026-08-22 20:15", channel: "LINE", account: "@mpower", campaign: "ส.ค.-ลดค่าไฟ", name: "คุณวิภา", handle: "Uxxxx8", msg: "ร้านกาแฟ เปิดกลางวัน ค่าไฟ 15,000", reply: "ร้านเปิดกลางวันคุ้มมากค่ะ 15,000 บาท แนะนำ ~10kWp ขอนัดสำรวจนะคะ", intent: "quote", grade: "A", status: "bot_replied", handoff: false, acard: "" },
  { id: "LD-2608-0006", at: "2026-08-22 21:48", channel: "Facebook", account: "M Power 168", campaign: "FB-boost-solar", name: "คุณกิต", handle: "fb_10240", msg: "อยากคุยกับคนจริง ต่อรองราคาได้ไหม", reply: "เดี๋ยวทีมงานติดต่อกลับภายในวันนี้นะคะ ขอเบอร์+เวลาสะดวกค่ะ", intent: "negotiate", grade: "A", status: "handoff", handoff: true, acard: "" },
];

export const STATUS_LABEL = {
  bot_replied: { label: "บอทตอบแล้ว", tone: "ok" },
  human: { label: "คนดูแล", tone: "warn" },
  handoff: { label: "รอคนรับ", tone: "bad" },
  manual: { label: "คีย์มือ", tone: "mut" },
  new: { label: "ใหม่", tone: "mut" },
};

// สรุปผลต่อช่องทาง (mock — เฟสจริงคำนวณจาก Leads_Inbox + Sales)
export const CHANNEL_PERF = [
  { channel: "LINE", leads: 18, qualified: 11, booked: 5, closed: 3, spend: 3000 },
  { channel: "Facebook", leads: 24, qualified: 9, booked: 4, closed: 2, spend: 6000 },
  { channel: "Instagram", leads: 7, qualified: 3, booked: 1, closed: 0, spend: 1500 },
  { channel: "TikTok", leads: 12, qualified: 3, booked: 1, closed: 1, spend: 2000 },
];

export const chTone = (c) => (CHANNELS[c] ? CHANNELS[c].tone : "#6e6e73");
export const cpl = (p) => (p.leads ? Math.round(p.spend / p.leads) : 0);
export const conv = (p) => (p.leads ? ((p.closed / p.leads) * 100).toFixed(1) : "0.0");
