// เรตราคามาตรฐาน M Power (อ้างอิงไฟล์ Standard — ตัวอย่าง 5 kWp, แผง 650W × 8)
// แก้ไขได้ในหน้า "ตั้งค่าราคา" · เฟสถัดไปจะบันทึกลง Google Sheets แท็บ Rates
export const RATE_CATEGORIES = [
  {
    key: "equipment", name: "1) อุปกรณ์หลัก + ค่าขนส่ง", items: [
      { k: "panel_650", label: "แผงโซลาร์ Longi 650W", unit: "฿/แผง", v: 3250, note: "ช่วง 3,250–3,380" },
      { k: "ship_bkk", label: "ค่าส่งแผง — กรุงเทพฯ", unit: "฿/งาน", v: 1000, note: "" },
      { k: "ship_up", label: "ค่าส่งแผง — ต่างจังหวัด", unit: "฿/งาน", v: 1500, note: "1,500–2,000 ตามระยะ" },
    ],
  },
  {
    key: "install", name: "2) งานติดตั้ง", items: [
      { k: "labor_team", label: "ค่าแรงทีม 4–5 คน/วัน (เหมารวมอุปกรณ์)", unit: "฿/งาน", v: 46000, note: "สาย/Mounting/เดินทาง/ที่พัก" },
      { k: "crane_half", label: "ค่ารถเครน (ครึ่งวัน)", unit: "฿/งาน", v: 6000, note: "" },
      { k: "sub_db", label: "ตู้ลูกย่อย (Sub Distribution Board)", unit: "฿/งาน", v: 5000, note: "" },
    ],
  },
  {
    key: "permit", name: "3) ค่าดำเนินการขออนุญาต", items: [
      { k: "engineer", label: "วิศวกรออกแบบ + เซ็นรับรองแบบ", unit: "฿/งาน", v: 2000, note: "" },
      { k: "fee_travel", label: "เดินทางชำระค่าธรรมเนียม", unit: "฿/งาน", v: 1000, note: "" },
      { k: "pea_visit", label: "ตรวจหน้างานร่วมการไฟฟ้า", unit: "฿/งาน", v: 1000, note: "ไม่รวมค่าธรรมเนียมราชการ" },
    ],
  },
  {
    key: "optional", name: "4) บริการเพิ่มเติม (Optional)", items: [
      { k: "survey", label: "สำรวจหน้างาน", unit: "฿/งาน", v: 2000, note: "คิดทุกงานที่เข้าสำรวจ" },
      { k: "bird_net", label: "ตาข่ายกันนก (≤ 8 แผง)", unit: "฿/งาน", v: 3000, note: "" },
      { k: "clean_bkk", label: "ล้างแผง — กรุงเทพฯ", unit: "฿/ครั้ง", v: 2500, note: "ตลาด 3,500–5,000" },
      { k: "clean_up", label: "ล้างแผง — ต่างจังหวัด", unit: "฿/ครั้ง", v: 3000, note: "" },
    ],
  },
];

export const baht = (n) => "฿" + Number(n).toLocaleString("th-TH");
