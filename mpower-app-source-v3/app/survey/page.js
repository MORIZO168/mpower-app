"use client";
import { useState } from "react";

const BUILDING_TYPES = ["บ้านพักอาศัย", "ทาวน์เฮาส์ / ทาวน์โฮม", "อาคารพาณิชย์ / ตึกแถว", "ร้านค้า / ร้านอาหาร", "สำนักงาน", "โรงงาน", "โกดัง / คลังสินค้า", "ฟาร์ม / โรงเรือนเกษตร", "อื่นๆ"];
const UTILITIES = ["PEA — การไฟฟ้าส่วนภูมิภาค", "MEA — การไฟฟ้านครหลวง"];
const METERS = [
  "1 เฟส · 5(15) A — บ้านเล็ก",
  "1 เฟส · 15(45) A — บ้านทั่วไป",
  "1 เฟส · 30(100) A — บ้านใหญ่",
  "3 เฟส · 15(45) A",
  "3 เฟส · 30(100) A",
  "3 เฟส · 50(150) A",
  "3 เฟส · 200 A (CT)",
  "3 เฟส · 400 A (CT)",
  "TOU 1 เฟส · 30(100) A",
  "TOU 3 เฟส · 30(100) A",
  "TOU 3 เฟส · 50(150) A",
  "อื่นๆ / ยังไม่ทราบ",
];
const ROOFS = [
  "กระเบื้องลอนคู่ (CPAC)",
  "กระเบื้องลอนคู่ไฟเบอร์ซีเมนต์ (ตราช้าง)",
  "กระเบื้องคอนกรีต (ซีแพคโมเนีย)",
  "กระเบื้องดินเผา / เซรามิก",
  "กระเบื้องว่าว / สี่เหลี่ยม",
  "เมทัลชีท — ยิงสกรู",
  "เมทัลชีท — คลิปล็อค (ไม่เจาะรู)",
  "เมทัลชีท — ตะเข็บยืน (Standing seam)",
  "หลังคาคอนกรีต / ดาดฟ้า (Slab)",
  "ชิงเกิ้ลรูฟ (Asphalt shingle)",
  "หลังคาไวนิล / พรีม่า",
  "อื่นๆ (ระบุในหมายเหตุ)",
];

const PHOTO_CATS = [
  { k: "roof_all", label: "ภาพรวมหลังคา (ทุกด้าน)", req: true },
  { k: "roof_zone", label: "มุมหลังคาที่จะติดตั้ง (ใกล้)", req: true },
  { k: "roof_under", label: "โครงหลังคา / ใต้หลังคา (แป-จันทัน)", req: false },
  { k: "mdb", label: "ตู้ MDB / ตู้เมนไฟ (เปิดฝา)", req: true },
  { k: "main_breaker", label: "เมนเบรกเกอร์ + ช่องว่างในตู้", req: true },
  { k: "meter", label: "มิเตอร์ไฟฟ้า (เห็นเลขมิเตอร์)", req: true },
  { k: "inverter_spot", label: "จุดวางอินเวอร์เตอร์", req: false },
  { k: "cable_route", label: "เส้นทางเดินสาย DC/AC", req: false },
  { k: "roof_access", label: "ทางขึ้นหลังคา / จุดตั้งนั่งร้าน", req: false },
  { k: "bill", label: "บิลค่าไฟ 2–3 เดือนล่าสุด", req: true },
  { k: "surrounding", label: "สภาพแวดล้อม (เงา ต้นไม้ อาคารข้างเคียง)", req: false },
];

const inCls = "w-full px-3 py-2 border border-[#d2d2d7] rounded-lg text-sm bg-white";
const Lbl = ({ children }) => <label className="block text-[11px] text-[#6e6e73] mb-1">{children}</label>;

export default function SurveyPage() {
  const [pin, setPin] = useState("");
  const [pinStatus, setPinStatus] = useState("");
  const [photos, setPhotos] = useState({});

  function dropPin() {
    setPinStatus("กำลังหาพิกัด…");
    if (!navigator.geolocation) { setPinStatus("อุปกรณ์ไม่รองรับ GPS"); return; }
    navigator.geolocation.getCurrentPosition(
      (p) => {
        const { latitude, longitude } = p.coords;
        setPin(`${latitude.toFixed(6)}, ${longitude.toFixed(6)}`);
        setPinStatus("ปักหมุดสำเร็จ ✓");
      },
      () => setPinStatus("เข้าถึง GPS ไม่ได้ — วางลิงก์แผนที่แทนได้"),
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }

  const mapLink = pin
    ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(pin)}`
    : "";

  function onPick(catKey, files) {
    const n = files?.length || 0;
    if (!n) return;
    setPhotos((s) => ({ ...s, [catKey]: (s[catKey] || 0) + n }));
  }

  const reqCats = PHOTO_CATS.filter((c) => c.req);
  const reqDone = reqCats.filter((c) => photos[c.k]).length;
  const totalShots = Object.values(photos).reduce((a, b) => a + b, 0);

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="flex items-center gap-3 mb-5">
        <div>
          <h1 className="text-xl font-bold text-[#1d1d1f]">สำรวจหน้างาน</h1>
          <p className="text-sm text-[#6e6e73] mt-0.5">เลขงานออกอัตโนมัติ · ปักหมุด GPS · ถ่ายรูปจากมือถือแยกหมวด</p>
        </div>
        <span className="ml-auto pill pill-ok">เลขงานถัดไป · S-202608-001</span>
      </div>

      <div className="card p-5 mb-4">
        <div className="font-semibold text-[#1d1d1f] mb-3">1) ข้อมูลลูกค้า</div>
        <div className="grid md:grid-cols-2 gap-3">
          <div><Lbl>ชื่อลูกค้า</Lbl><input className={inCls} placeholder="คุณ…" /></div>
          <div><Lbl>เบอร์โทร / LINE</Lbl><input className={inCls} placeholder="08x-xxx-xxxx" /></div>
        </div>
      </div>

      <div className="card p-5 mb-4">
        <div className="font-semibold text-[#1d1d1f] mb-1">2) พิกัดแผนที่ <span className="text-[11px] font-normal text-[#a1a1a6]">— สำหรับทีมช่างเดินทาง / แชร์กันได้</span></div>
        <div className="flex flex-col sm:flex-row gap-2 mt-3">
          <button onClick={dropPin} type="button" className="bg-[#F5821F] text-white rounded-lg px-4 py-2 text-sm font-semibold flex items-center justify-center gap-2 shrink-0">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2C8 2 5 5 5 9c0 5 7 13 7 13s7-8 7-13c0-4-3-7-7-7z" /><circle cx="12" cy="9" r="2.5" /></svg>
            ปักหมุด (GPS มือถือ)
          </button>
          <input value={pin} onChange={(e) => setPin(e.target.value)} className={inCls} placeholder="หรือวางพิกัด / ลิงก์ Google Maps" />
        </div>
        {pinStatus && <div className="text-[11px] text-[#6e6e73] mt-1.5">{pinStatus}</div>}
        {mapLink && (
          <a href={mapLink} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 mt-2 text-[13px] text-[#F5821F] font-medium">
            เปิด / แชร์บนแผนที่ →
          </a>
        )}
      </div>

      <div className="card p-5 mb-4">
        <div className="font-semibold text-[#1d1d1f] mb-1">3) ที่อยู่สำหรับเอกสาร <span className="text-[11px] font-normal text-[#a1a1a6]">— ใช้กรอกใบส่งมอบ / ขออนุญาต</span></div>
        <div className="grid md:grid-cols-3 gap-3 mt-3">
          <div><Lbl>บ้านเลขที่</Lbl><input className={inCls} placeholder="เช่น 40/456" /></div>
          <div><Lbl>หมู่ที่ / หมู่บ้าน</Lbl><input className={inCls} placeholder="หมู่ 4" /></div>
          <div><Lbl>ซอย / ถนน</Lbl><input className={inCls} /></div>
          <div><Lbl>ตำบล / แขวง</Lbl><input className={inCls} /></div>
          <div><Lbl>อำเภอ / เขต</Lbl><input className={inCls} /></div>
          <div><Lbl>จังหวัด</Lbl><input className={inCls} /></div>
          <div><Lbl>รหัสไปรษณีย์</Lbl><input className={inCls} placeholder="73170" /></div>
        </div>
      </div>

      <div className="card p-5 mb-4">
        <div className="font-semibold text-[#1d1d1f] mb-3">4) ข้อมูลอาคาร + ไฟฟ้า</div>
        <div className="grid md:grid-cols-2 gap-3">
          <div><Lbl>ประเภทอาคาร</Lbl>
            <select className={inCls} defaultValue=""><option value="" disabled>เลือก…</option>{BUILDING_TYPES.map((t) => <option key={t}>{t}</option>)}</select>
          </div>
          <div><Lbl>การไฟฟ้า</Lbl>
            <select className={inCls} defaultValue=""><option value="" disabled>เลือก…</option>{UTILITIES.map((t) => <option key={t}>{t}</option>)}</select>
          </div>
          <div><Lbl>ขนาดมิเตอร์ / เฟส</Lbl>
            <select className={inCls} defaultValue=""><option value="" disabled>เลือก…</option>{METERS.map((t) => <option key={t}>{t}</option>)}</select>
          </div>
          <div><Lbl>ประเภทหลังคา</Lbl>
            <select className={inCls} defaultValue=""><option value="" disabled>เลือก…</option>{ROOFS.map((t) => <option key={t}>{t}</option>)}</select>
          </div>
          <div><Lbl>ค่าไฟเฉลี่ย/เดือน (บาท)</Lbl><input type="number" className={inCls} placeholder="เช่น 4,500" /></div>
          <div><Lbl>หน่วยใช้/เดือน (kWh)</Lbl><input type="number" className={inCls} placeholder="เช่น 1,050" /></div>
          <div><Lbl>ทิศหลังคา</Lbl>
            <select className={inCls} defaultValue=""><option value="" disabled>เลือก…</option>{["ใต้", "ตะวันตกเฉียงใต้", "ตะวันออกเฉียงใต้", "ตะวันตก", "ตะวันออก", "เหนือ", "หลายทิศ"].map((t) => <option key={t}>{t}</option>)}</select>
          </div>
          <div><Lbl>ความชันหลังคา</Lbl>
            <select className={inCls} defaultValue=""><option value="" disabled>เลือก…</option>{["แบน (ดาดฟ้า)", "5–10°", "11–20°", "21–30°", "มากกว่า 30°"].map((t) => <option key={t}>{t}</option>)}</select>
          </div>
        </div>
        <div className="mt-3"><Lbl>หมายเหตุเพิ่มเติม</Lbl><textarea className={`${inCls} min-h-[70px]`} placeholder="สภาพหลังคา สิ่งกีดขวาง เงา ระยะเดินสาย ฯลฯ" /></div>
      </div>

      <div className="card p-5 mb-4">
        <div className="flex items-center mb-1">
          <div className="font-semibold text-[#1d1d1f]">5) รูปหน้างาน <span className="text-[11px] font-normal text-[#a1a1a6]">— ถ่ายจากมือถือได้ทันที · แยกหมวดกันตกหล่น</span></div>
          <div className="ml-auto text-xs text-[#6e6e73]">จำเป็น <b className={reqDone === reqCats.length ? "text-[#1a7d3a]" : "text-[#F5821F]"}>{reqDone}/{reqCats.length}</b> · รวม {totalShots} รูป</div>
        </div>
        <div className="grid sm:grid-cols-2 gap-3 mt-3">
          {PHOTO_CATS.map((c) => {
            const n = photos[c.k] || 0;
            return (
              <label key={c.k} className={`flex items-center gap-3 rounded-xl border p-3 cursor-pointer transition-colors ${n ? "border-[#1a7d3a] bg-[#f2faf4]" : c.req ? "border-[#F5821F] bg-[#fff8f1]" : "border-[#e2e2e7] bg-white"}`}>
                <input type="file" accept="image/*" capture="environment" multiple className="hidden" onChange={(e) => onPick(c.k, e.target.files)} />
                <span className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${n ? "bg-[#1a7d3a] text-white" : "bg-[#f0f0f2] text-[#6e6e73]"}`}>
                  {n ? (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6L9 17l-5-5" /></svg>
                  ) : (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z" /><circle cx="12" cy="13" r="4" /></svg>
                  )}
                </span>
                <div className="min-w-0">
                  <div className="text-sm text-[#1d1d1f] leading-tight">{c.label} {c.req && <span className="text-[#F5821F]">*</span>}</div>
                  <div className="text-[11px] text-[#a1a1a6]">{n ? `${n} รูป · แตะเพื่อเพิ่ม` : "แตะเพื่อถ่าย / เลือกรูป"}</div>
                </div>
              </label>
            );
          })}
        </div>
        <div className="text-[11px] text-[#a1a1a6] mt-3">* หมวดที่มีดาว = จำเป็นต้องมีก่อนบันทึก</div>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
        <button className="bg-[#1d1d1f] text-white rounded-lg px-6 py-2.5 text-sm font-semibold">บันทึกสำรวจ → ส่งต่อ Pre-qualify</button>
        <span className="text-xs text-[#a1a1a6]">บันทึกลงชีต + สร้างงานในระบบ · แนบพิกัด + รูปทุกหมวด (ต่อจริงเฟสถัดไป)</span>
      </div>
    </div>
  );
}
