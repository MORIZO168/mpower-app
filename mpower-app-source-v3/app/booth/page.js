"use client";
import { useState, useEffect } from "react";
import ProvinceInput from "@/components/ProvinceInput";
import { PACKAGES, ADDON } from "@/lib/packages";
import { FLAT_RATE } from "@/lib/tariff";

const BOOTH_URL = "https://mpower-system.vercel.app/booth";
const TIMEFRAMES = [
  { v: "ภายใน 3 เดือน", g: "Hot" },
  { v: "3-6 เดือน", g: "Warm" },
  { v: "6 เดือนขึ้นไป", g: "Cool" },
];
const GRADE = { "ภายใน 3 เดือน": "Hot", "3-6 เดือน": "Warm", "6 เดือนขึ้นไป": "Cool" };
const USAGE = [
  { v: "day", label: "กลางวันเยอะ", note: "อยู่บ้าน/เปิดแอร์กลางวัน" },
  { v: "mixed", label: "พอๆ กัน", note: "ใช้ทั้งวัน" },
  { v: "evening", label: "เย็น–กลางคืนเยอะ", note: "กลับบ้านเย็น" },
];

const money = (n) => Number(n || 0).toLocaleString("th-TH", { maximumFractionDigits: 0 });

function boothId() {
  const d = new Date();
  const ym = String(d.getFullYear()).slice(2) + String(d.getMonth() + 1).padStart(2, "0");
  const t =
    String(d.getDate()).padStart(2, "0") +
    String(d.getHours()).padStart(2, "0") +
    String(d.getMinutes()).padStart(2, "0") +
    String(d.getSeconds()).padStart(2, "0");
  return "AC-" + ym + "-B" + t;
}
function today() {
  const d = new Date();
  return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0");
}

// ประเมินแพคเกจ + ประหยัด + คืนทุน แบบคร่าวๆ จากค่าไฟ
function recommend(f) {
  const bill = +f.bill || 0;
  const pkg = bill >= 10500 ? PACKAGES[3] : bill >= 8000 ? PACKAGES[2] : bill >= 5500 ? PACKAGES[1] : PACKAGES[0];
  const base = f.usage === "day" ? 0.7 : f.usage === "evening" ? 0.45 : 0.58;
  const bonus = f.battery === "yes" && f.usage !== "day" ? 0.15 : 0;
  const frac = Math.min(0.8, base + bonus);
  const save = Math.round(bill * frac);
  const price = pkg.price + (f.battery === "yes" ? ADDON.battery : 0);
  const payback = save > 0 ? price / (save * 12) : 0;
  const life25 = save * 12 * 25;
  return { pkg, save, price, payback, life25, battery: f.battery === "yes" };
}

const EMPTY = { name: "", phone: "", province: "", type: "บ้าน", consent: false, bill: "", usage: "", battery: "", timeframe: "" };

export default function BoothPage() {
  const [step, setStep] = useState(0);
  const [f, setF] = useState(EMPTY);
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState("");
  const [event, setEvent] = useState("");
  const [showQR, setShowQR] = useState(false);
  const [count, setCount] = useState(0);
  const upd = (k, v) => setF((s) => ({ ...s, [k]: v }));

  useEffect(() => {
    try {
      setEvent(localStorage.getItem("mpower_booth_event") || "");
      setCount(+(localStorage.getItem("mpower_booth_count") || 0));
      flushQueue();
    } catch (e) {}
  }, []);

  async function postLead(obj) {
    const res = await fetch("/api/sheets", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "append", tab: "A-Card", obj, idField: "ACard_ID", required: ["Customer_Name"] }),
    });
    const d = await res.json();
    if (!d.ok) throw new Error(d.error || "fail");
    return d;
  }
  async function flushQueue() {
    let q = [];
    try { q = JSON.parse(localStorage.getItem("mpower_booth_queue") || "[]"); } catch (e) { q = []; }
    if (!q.length) return;
    const left = [];
    for (const obj of q) { try { await postLead(obj); } catch (e) { left.push(obj); } }
    try { localStorage.setItem("mpower_booth_queue", JSON.stringify(left)); } catch (e) {}
  }

  const rec = recommend(f);

  function saveEvent(v) {
    setEvent(v);
    try { localStorage.setItem("mpower_booth_event", v); } catch (e) {}
  }
  function bump() {
    const n = count + 1;
    setCount(n);
    try { localStorage.setItem("mpower_booth_count", String(n)); } catch (e) {}
  }

  async function submit() {
    setBusy(true);
    setNote("");
    const src = event ? "บูธ · " + event : "บูธ";
    const obj = {
      ACard_ID: boothId(),
      Date: today(),
      Customer_Name: f.name,
      Phone_LINE: f.phone,
      Source: src,
      Type: f.type,
      Province: f.province,
      Monthly_Bill_THB: f.bill,
      Est_kWp: rec.pkg.kwp,
      System_Type: f.battery === "yes" ? "hybrid (มีแบต)" : "on-grid",
      Grade: GRADE[f.timeframe] || "",
      Status: "new",
      Next_Action: "นัดสำรวจ",
      Note: [
        "กรอกที่บูธ",
        "ค่าไฟ " + money(f.bill) + "฿/ด",
        "แพคเกจ " + rec.pkg.id,
        "ประหยัด ~" + money(rec.save) + "฿/ด",
        "คืนทุน ~" + rec.payback.toFixed(1) + " ปี",
        f.timeframe,
        f.battery === "yes" ? "สนใจแบต" : "ไม่เอาแบต",
      ].filter(Boolean).join(" · "),
    };
    try {
      await postLead(obj);
      bump();
      setStep(3);
    } catch (e) {
      try {
        const q = JSON.parse(localStorage.getItem("mpower_booth_queue") || "[]");
        q.push(obj);
        localStorage.setItem("mpower_booth_queue", JSON.stringify(q));
      } catch (e2) {}
      bump();
      setNote("บันทึกไว้ในเครื่องแล้ว จะซิงค์ขึ้นระบบเมื่อเน็ตกลับมา");
      setStep(3);
    }
    setBusy(false);
  }

  function reset() {
    setF(EMPTY);
    setNote("");
    setStep(0);
  }

  const canStep0 = f.name.trim() && f.phone.trim() && f.consent;
  const canStep1 = +f.bill > 0 && f.usage && f.timeframe && f.battery;

  const inCls = "w-full px-3 py-2.5 border border-[#d2d2d7] rounded-xl text-base bg-white";
  const btnPick = (on) =>
    "w-full text-left px-4 py-3 rounded-xl border text-base transition " +
    (on ? "border-[#F5821F] bg-[#fff5ec] font-semibold text-[#1d1d1f]" : "border-[#e2e2e7] bg-white text-[#1d1d1f]");

  return (
    <div className="fixed inset-0 z-50 bg-[#f5f5f7] overflow-auto">
      <div className="bg-[#1d1d1f] text-white px-5 py-3 flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-[#F5821F] flex items-center justify-center font-bold">M</div>
        <div className="leading-tight">
          <div className="font-bold text-sm">M POWER NATURE ENERGY 168</div>
          <div className="text-[11px] text-[#a1a1a6]">ประเมินโซลาร์ฟรี · รู้ผลใน 1 นาที</div>
        </div>
        <button onClick={() => setShowQR(true)} className="ml-auto text-[11px] text-[#a1a1a6] border border-[#3a3a3c] rounded-lg px-2 py-1">
          เจ้าหน้าที่
        </button>
      </div>

      <div className="max-w-md mx-auto px-5 py-6">
        {step < 3 && (
          <div className="flex items-center gap-2 mb-6">
            {[0, 1, 2].map((i) => (
              <div key={i} className={"h-1.5 flex-1 rounded-full " + (i <= step ? "bg-[#F5821F]" : "bg-[#e2e2e7]")} />
            ))}
          </div>
        )}

        {step === 0 && (
          <div className="space-y-4">
            <h1 className="text-2xl font-bold text-[#1d1d1f]">ข้อมูลของคุณ</h1>
            <p className="text-sm text-[#6e6e73] -mt-2">กรอกสั้นๆ เพื่อรับผลประเมินและให้ทีมติดต่อกลับ</p>
            <div>
              <label className="block text-[13px] text-[#6e6e73] mb-1">ชื่อ *</label>
              <input className={inCls} value={f.name} onChange={(e) => upd("name", e.target.value)} placeholder="ชื่อ-นามสกุล" />
            </div>
            <div>
              <label className="block text-[13px] text-[#6e6e73] mb-1">เบอร์ / LINE *</label>
              <input className={inCls} value={f.phone} onChange={(e) => upd("phone", e.target.value)} placeholder="08x-xxx-xxxx" inputMode="tel" />
            </div>
            <div>
              <label className="block text-[13px] text-[#6e6e73] mb-1">จังหวัด</label>
              <ProvinceInput className={inCls} value={f.province} onChange={(v) => upd("province", v)} />
            </div>
            <div>
              <label className="block text-[13px] text-[#6e6e73] mb-1">ประเภท</label>
              <div className="grid grid-cols-2 gap-2">
                {["บ้าน", "ร้านค้า"].map((t) => (
                  <button key={t} onClick={() => upd("type", t)} className={btnPick(f.type === t)}>{t}</button>
                ))}
              </div>
            </div>
            <label className="flex items-start gap-2 text-[13px] text-[#6e6e73] pt-1">
              <input type="checkbox" checked={f.consent} onChange={(e) => upd("consent", e.target.checked)} className="mt-1 w-4 h-4" />
              <span>ยินยอมให้ M Power เก็บข้อมูลและติดต่อกลับเพื่อเสนอบริการ (PDPA)</span>
            </label>
            <button
              onClick={() => setStep(1)}
              disabled={!canStep0}
              className="w-full bg-[#F5821F] text-white rounded-xl py-3.5 text-base font-semibold disabled:opacity-40"
            >
              ถัดไป
            </button>
          </div>
        )}

        {step === 1 && (
          <div className="space-y-5">
            <h1 className="text-2xl font-bold text-[#1d1d1f]">การใช้ไฟของคุณ</h1>
            <div>
              <label className="block text-[13px] text-[#6e6e73] mb-1">ค่าไฟเฉลี่ยต่อเดือน (บาท) *</label>
              <input className={inCls + " text-xl font-semibold"} value={f.bill} onChange={(e) => upd("bill", e.target.value.replace(/[^0-9]/g, ""))} placeholder="เช่น 4500" inputMode="numeric" />
            </div>
            <div>
              <div className="text-[13px] text-[#6e6e73] mb-2">ปกติใช้ไฟช่วงไหนมากสุด? *</div>
              <div className="space-y-2">
                {USAGE.map((u) => (
                  <button key={u.v} onClick={() => upd("usage", u.v)} className={btnPick(f.usage === u.v)}>
                    <div>{u.label}</div>
                    <div className="text-[12px] text-[#a1a1a6] font-normal">{u.note}</div>
                  </button>
                ))}
              </div>
            </div>
            <div>
              <div className="text-[13px] text-[#6e6e73] mb-2">สนใจแบตเตอรี่สำรองไฟไหม? *</div>
              <div className="grid grid-cols-2 gap-2">
                <button onClick={() => upd("battery", "yes")} className={btnPick(f.battery === "yes")}>สนใจ (มีแบต)</button>
                <button onClick={() => upd("battery", "no")} className={btnPick(f.battery === "no")}>ยังไม่เอา</button>
              </div>
            </div>
            <div>
              <div className="text-[13px] text-[#6e6e73] mb-2">คิดจะติดตั้งเมื่อไหร่? *</div>
              <div className="space-y-2">
                {TIMEFRAMES.map((t) => (
                  <button key={t.v} onClick={() => upd("timeframe", t.v)} className={btnPick(f.timeframe === t.v)}>{t.v}</button>
                ))}
              </div>
            </div>
            <div className="flex gap-2">
              <button onClick={() => setStep(0)} className="px-5 py-3.5 rounded-xl border border-[#d2d2d7] text-base text-[#6e6e73]">ย้อนกลับ</button>
              <button onClick={() => setStep(2)} disabled={!canStep1} className="flex-1 bg-[#F5821F] text-white rounded-xl py-3.5 text-base font-semibold disabled:opacity-40">ดูผลประเมิน</button>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4">
            <h1 className="text-2xl font-bold text-[#1d1d1f]">แพคเกจที่เหมาะกับคุณ</h1>
            <div className="bg-white rounded-2xl p-5 border border-[#ffe4cc] shadow-sm">
              <div className="text-[13px] text-[#6e6e73]">แพคเกจแนะนำ</div>
              <div className="text-2xl font-bold text-[#F5821F] mt-0.5">{rec.pkg.name}</div>
              <div className="text-[13px] text-[#6e6e73] mt-1">
                {rec.pkg.kwp} kWp · {rec.pkg.panels} แผง · {rec.pkg.inverter}
                {rec.battery ? " · + แบตเตอรี่" : ""}
              </div>
              <div className="text-[13px] text-[#1d1d1f] mt-2 font-semibold">ราคาประมาณ {money(rec.price)} บาท</div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="bg-[#f2faf4] rounded-2xl p-4 border border-[#cdeed6]">
                <div className="text-[12px] text-[#6e6e73]">ประหยัดค่าไฟ</div>
                <div className="text-xl font-bold text-[#1a7d3a] mt-0.5">~{money(rec.save)}</div>
                <div className="text-[12px] text-[#6e6e73]">บาท/เดือน</div>
              </div>
              <div className="bg-[#fff8f1] rounded-2xl p-4 border border-[#ffe4cc]">
                <div className="text-[12px] text-[#6e6e73]">คืนทุนประมาณ</div>
                <div className="text-xl font-bold text-[#F5821F] mt-0.5">~{rec.payback.toFixed(1)}</div>
                <div className="text-[12px] text-[#6e6e73]">ปี</div>
              </div>
            </div>

            <div className="bg-[#1d1d1f] text-white rounded-2xl p-4 text-center">
              <div className="text-[12px] text-[#a1a1a6]">ประหยัดตลอด 25 ปี ประมาณ</div>
              <div className="text-2xl font-bold mt-0.5">{money(rec.life25)} บาท</div>
            </div>

            <p className="text-[11px] text-[#a1a1a6] leading-relaxed">
              ตัวเลขเป็นการประเมินเบื้องต้นจากค่าไฟและพฤติกรรมการใช้ · ตัวเลขจริงต้องสำรวจหน้างานและออกแบบระบบก่อน
            </p>

            <button onClick={submit} disabled={busy} className="w-full bg-[#F5821F] text-white rounded-xl py-3.5 text-base font-semibold disabled:opacity-50">
              {busy ? "กำลังบันทึก…" : "ให้ทีมติดต่อนัดสำรวจ (ฟรี)"}
            </button>
            <button onClick={() => setStep(1)} className="w-full text-[13px] text-[#6e6e73] py-1">ย้อนกลับแก้ข้อมูล</button>
          </div>
        )}

        {step === 3 && (
          <div className="text-center py-10 space-y-4">
            <div className="w-16 h-16 rounded-full bg-[#e8f7ee] mx-auto flex items-center justify-center text-3xl">✓</div>
            <h1 className="text-2xl font-bold text-[#1d1d1f]">ขอบคุณครับ!</h1>
            <p className="text-sm text-[#6e6e73]">ทีม M Power จะติดต่อกลับเพื่อนัดสำรวจหน้างานฟรี<br />ไว้พบกันครับ 🙏</p>
            {note && <p className="text-[12px] text-[#F5821F]">{note}</p>}
            <button onClick={reset} className="w-full bg-[#1d1d1f] text-white rounded-xl py-3.5 text-base font-semibold mt-4">
              เริ่มคนถัดไป
            </button>
          </div>
        )}
      </div>

      {showQR && (
        <div className="fixed inset-0 z-[60] bg-black/60 flex items-center justify-center p-6" onClick={() => setShowQR(false)}>
          <div className="bg-white rounded-2xl p-5 max-w-xs w-full text-center" onClick={(e) => e.stopPropagation()}>
            <div className="font-bold text-[#1d1d1f] mb-1">โหมดเจ้าหน้าที่</div>
            <div className="text-[12px] text-[#6e6e73] mb-3">ให้ลูกค้าสแกนกรอกในมือถือตัวเอง</div>
            <img
              alt="QR"
              className="w-48 h-48 mx-auto rounded-lg border border-[#eee]"
              src={"https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=" + encodeURIComponent(BOOTH_URL)}
            />
            <div className="text-[11px] text-[#a1a1a6] mt-1 break-all">{BOOTH_URL}</div>
            <div className="text-left mt-4">
              <label className="block text-[12px] text-[#6e6e73] mb-1">ชื่องาน/บูธ (แท็กใน Source)</label>
              <input className={inCls} value={event} onChange={(e) => saveEvent(e.target.value)} placeholder="เช่น รร.สาธิต 2568" />
            </div>
            <div className="text-[13px] text-[#1d1d1f] mt-3">เก็บได้วันนี้: <b>{count}</b> ราย</div>
            <button onClick={() => setShowQR(false)} className="w-full bg-[#1d1d1f] text-white rounded-xl py-2.5 text-sm font-semibold mt-3">ปิด</button>
          </div>
        </div>
      )}
    </div>
  );
}
