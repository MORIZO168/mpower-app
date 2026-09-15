"use client";
// หน้าให้ลูกค้าสแกน QR ที่บูธ แล้วกรอกเอง → ประเมินระบบ+ค่าไฟที่ประหยัด → บันทึกเข้า A-Card + เซฟรูป
// public (ไม่ต้องล็อกอิน) · บันทึกผ่าน /api/sheets (service_role ฝั่ง server)
import { useMemo, useRef, useState } from "react";
import ProvinceInput from "@/components/ProvinceInput";
import { PACKAGES, suggestPackage } from "@/lib/packages";
import { FLAT_RATE } from "@/lib/tariff";

export const dynamic = "force-dynamic";

const PROD_PER_KWP_MONTH = 115;   // หน่วย/kWp/เดือน (ค่าเฉลี่ยไทย)
const CO2_PER_KWH = 0.4999;       // kgCO2/หน่วย (กริดไทย)
const money = (n) => "฿" + Math.round(Number(n) || 0).toLocaleString("th-TH");
const num = (n, d = 0) => Number(n || 0).toLocaleString("th-TH", { maximumFractionDigits: d });
const TYPES = [
  { v: "บ้านพักอาศัย", day: 0.40 },
  { v: "ร้านค้า/สำนักงาน", day: 0.60 },
  { v: "โรงงาน/ธุรกิจ", day: 0.72 },
];

function estimate(bill, typeV) {
  const t = TYPES.find((x) => x.v === typeV) || TYPES[0];
  const units = bill / FLAT_RATE;                 // หน่วย/เดือน
  const offset = units * t.day;                   // หน่วยกลางวันที่โซลาร์ช่วยได้
  const kwpRaw = offset / PROD_PER_KWP_MONTH;
  const pkg = suggestPackage(Math.max(kwpRaw, PACKAGES[0].kwp - 1));
  const prod = pkg.kwp * PROD_PER_KWP_MONTH;       // ผลิต/เดือน
  const usedSolar = Math.min(prod, offset);        // ใช้เองจริง
  const monthlySave = usedSolar * FLAT_RATE;
  const yearlySave = monthlySave * 12;
  const payback = yearlySave > 0 ? pkg.price / yearlySave : 0;
  const co2Year = prod * 12 * CO2_PER_KWH;
  const trees = co2Year / 21;                       // ~21 kgCO2/ต้น/ปี
  const cover = Math.min(100, Math.round((usedSolar / Math.max(units, 1)) * 100));
  return { units, offset, kwpRaw, pkg, prod, monthlySave, yearlySave, payback, co2Year, trees, cover };
}

export default function BoothScan() {
  const [f, setF] = useState({ name: "", phone: "", province: "", type: "บ้านพักอาศัย", bill: "" });
  const [res, setRes] = useState(null);
  const [saved, setSaved] = useState(false);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");
  const [showQR, setShowQR] = useState(false);
  const canvasRef = useRef(null);
  const upd = (k, v) => setF((s) => ({ ...s, [k]: v }));

  const url = typeof window !== "undefined" ? window.location.origin + "/booth/scan" : "";

  function go(e) {
    e.preventDefault();
    const bill = Number(String(f.bill).replace(/[^0-9.]/g, ""));
    if (!bill) { setMsg("กรอกค่าไฟต่อเดือนก่อนนะครับ"); return; }
    setMsg(""); setSaved(false);
    setRes(estimate(bill, f.type));
  }

  async function save() {
    if (!res) return;
    if (!f.name.trim()) { setMsg("ใส่ชื่อเพื่อบันทึกด้วยครับ"); return; }
    setBusy(true); setMsg("");
    const obj = {
      Customer_Name: f.name, Phone_LINE: f.phone, Source: "สแกน QR บูธ", Type: f.type,
      Province: f.province, Monthly_Bill_THB: Math.round(res.units * FLAT_RATE),
      Est_kWp: res.pkg.kwp, System_Type: "on-grid", Grade: "ใหม่", Status: "ใหม่-จากบูธ",
      Note: `ประเมินบูธ: แนะนำ ${res.pkg.name} (${res.pkg.kwp}kWp) · ประหยัด ~${money(res.monthlySave)}/ด. · คืนทุน ~${num(res.payback, 1)} ปี`,
    };
    try {
      const r = await fetch("/api/sheets", { method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "append", tab: "A-Card", obj, idField: "ACard_ID", required: ["Customer_Name"] }) });
      const d = await r.json();
      if (d.ok) { setSaved(true); setMsg("บันทึกข้อมูลเรียบร้อย เจ้าหน้าที่จะติดต่อกลับครับ"); }
      else setMsg("บันทึกไม่สำเร็จ: " + (d.error || ""));
    } catch (e) { setMsg("บันทึกไม่สำเร็จ ลองใหม่อีกครั้ง"); }
    setBusy(false);
  }

  function saveImage() {
    if (!res) return;
    const c = canvasRef.current || document.createElement("canvas");
    const W = 1080, H = 1350, dpr = 1;
    c.width = W; c.height = H;
    const x = c.getContext("2d");
    // bg
    x.fillStyle = "#0f0f10"; x.fillRect(0, 0, W, H);
    x.fillStyle = "#F5821F"; x.fillRect(0, 0, W, 12);
    // brand
    x.fillStyle = "#fff"; x.font = "bold 52px system-ui, sans-serif"; x.fillText("M POWER", 70, 120);
    x.fillStyle = "#9a9a9f"; x.font = "26px system-ui, sans-serif"; x.fillText("NATURE ENERGY · ประเมินระบบโซลาร์", 70, 162);
    // name
    x.fillStyle = "#fff"; x.font = "bold 40px system-ui, sans-serif"; x.fillText(f.name || "ลูกค้า", 70, 250);
    x.fillStyle = "#c9c9ce"; x.font = "28px system-ui, sans-serif";
    x.fillText(`ค่าไฟ ~${num(Math.round(res.units * FLAT_RATE))} บาท/เดือน · ${f.type}`, 70, 296);
    // recommended box
    x.fillStyle = "#1c1c1e"; roundRect(x, 70, 340, W - 140, 250, 24); x.fill();
    x.fillStyle = "#F5821F"; x.font = "bold 30px system-ui, sans-serif"; x.fillText("แนะนำติดตั้ง", 100, 400);
    x.fillStyle = "#fff"; x.font = "bold 64px system-ui, sans-serif"; x.fillText(`${res.pkg.kwp} kWp`, 100, 480);
    x.fillStyle = "#c9c9ce"; x.font = "30px system-ui, sans-serif";
    x.fillText(`${res.pkg.name} · ${res.pkg.panels} แผง · ${res.pkg.inverter}`, 100, 530);
    x.fillText(`งบประมาณ ~${money(res.pkg.price)}`, 100, 572);
    // savings big
    x.fillStyle = "#1a7d3a"; roundRect(x, 70, 620, (W - 160) / 2, 220, 24); x.fill();
    x.fillStyle = "#eafff0"; x.font = "26px system-ui, sans-serif"; x.fillText("ประหยัดต่อเดือน", 100, 680);
    x.fillStyle = "#fff"; x.font = "bold 58px system-ui, sans-serif"; x.fillText(money(res.monthlySave), 100, 748);
    x.fillStyle = "#eafff0"; x.font = "24px system-ui, sans-serif"; x.fillText(`~${money(res.yearlySave)}/ปี`, 100, 792);
    x.fillStyle = "#2a2a2e"; roundRect(x, 70 + (W - 160) / 2 + 20, 620, (W - 160) / 2, 220, 24); x.fill();
    const rx = 70 + (W - 160) / 2 + 50;
    x.fillStyle = "#F5821F"; x.font = "26px system-ui, sans-serif"; x.fillText("คืนทุนประมาณ", rx, 680);
    x.fillStyle = "#fff"; x.font = "bold 58px system-ui, sans-serif"; x.fillText(`${num(res.payback, 1)} ปี`, rx, 748);
    x.fillStyle = "#c9c9ce"; x.font = "24px system-ui, sans-serif"; x.fillText(`ลดคาร์บอน ~${num(res.co2Year)} kg/ปี`, rx, 792);
    // coverage bar
    x.fillStyle = "#c9c9ce"; x.font = "28px system-ui, sans-serif"; x.fillText(`โซลาร์ช่วยลดค่าไฟได้ ~${res.cover}%`, 70, 910);
    x.fillStyle = "#2a2a2e"; roundRect(x, 70, 930, W - 140, 40, 20); x.fill();
    x.fillStyle = "#F5821F"; roundRect(x, 70, 930, (W - 140) * res.cover / 100, 40, 20); x.fill();
    // trees
    x.fillStyle = "#fff"; x.font = "30px system-ui, sans-serif"; x.fillText(`🌳 เทียบเท่าปลูกต้นไม้ ~${num(res.trees)} ต้น/ปี`, 70, 1050);
    // footer
    x.fillStyle = "#9a9a9f"; x.font = "24px system-ui, sans-serif";
    x.fillText("* ตัวเลขเป็นการประเมินเบื้องต้นจากค่าไฟ อาจปรับตามการใช้จริงหน้างาน", 70, 1150);
    x.fillStyle = "#F5821F"; x.font = "bold 30px system-ui, sans-serif"; x.fillText("mpower-system.vercel.app", 70, 1210);

    c.toBlob((blob) => {
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = `mpower-solar-${(f.name || "estimate").replace(/\s+/g, "_")}.png`;
      document.body.appendChild(a); a.click(); a.remove();
    }, "image/png");
  }

  return (
    <div className="max-w-md mx-auto px-4 py-5">
      <header className="flex items-center gap-2 mb-4">
        <svg width="28" height="28" viewBox="0 0 48 48" aria-hidden="true"><g fill="#F5821F">
          <path d="M11 8 h13 l-4 12 h-13 z" /><path d="M27 8 h13 l-4 12 h-13 z" />
          <path d="M8 24 h13 l-4 12 h-13 z" /><path d="M24 24 h13 l-4 12 h-13 z" /></g></svg>
        <div className="leading-tight">
          <div className="font-semibold tracking-[0.1em] text-[#1d1d1f] text-sm">M POWER</div>
          <div className="text-[11px] text-[#a1a1a6]">ประเมินระบบโซลาร์ฟรี</div>
        </div>
        <button onClick={() => setShowQR(true)} className="ml-auto text-[11px] text-[#a1a1a6] border border-[#d2d2d7] rounded-lg px-2 py-1">QR</button>
      </header>

      {!res && (
        <div className="bg-white rounded-2xl border border-[#e8e8ed] p-5">
          <h1 className="text-lg font-bold text-[#1d1d1f]">ติดโซลาร์คุ้มไหม? เช็คใน 30 วินาที</h1>
          <p className="text-[13px] text-[#6e6e73] mt-1 mb-4">กรอกค่าไฟต่อเดือน แล้วดูเลยว่าควรติดกี่ kW ประหยัดเท่าไหร่</p>
          <form onSubmit={go} className="space-y-3">
            <div>
              <label className="block text-[12px] text-[#6e6e73] mb-1">ค่าไฟเฉลี่ยต่อเดือน (บาท) *</label>
              <input inputMode="decimal" value={f.bill} onChange={(e) => upd("bill", e.target.value)} placeholder="เช่น 4500"
                className="w-full px-3 py-3 border border-[#d2d2d7] rounded-xl text-base bg-white" />
            </div>
            <div>
              <label className="block text-[12px] text-[#6e6e73] mb-1">ประเภท</label>
              <div className="grid grid-cols-3 gap-2">
                {TYPES.map((t) => (
                  <button type="button" key={t.v} onClick={() => upd("type", t.v)}
                    className={`text-[12px] px-2 py-2 rounded-xl border ${f.type === t.v ? "bg-[#fff5ec] border-[#F5821F] text-[#F5821F] font-medium" : "bg-white border-[#d2d2d7] text-[#6e6e73]"}`}>
                    {t.v}
                  </button>
                ))}
              </div>
            </div>
            <button type="submit" className="w-full bg-[#F5821F] text-white rounded-xl py-3 text-sm font-semibold">ประเมินเลย →</button>
            {msg && <div className="text-[13px] text-[#c0392b]">{msg}</div>}
          </form>
        </div>
      )}

      {res && (
        <div className="space-y-3">
          <div className="bg-white rounded-2xl border border-[#e8e8ed] p-5">
            <div className="text-[12px] text-[#a1a1a6]">แนะนำติดตั้ง</div>
            <div className="flex items-end gap-2 mt-0.5">
              <div className="text-3xl font-bold text-[#1d1d1f]">{res.pkg.kwp} kWp</div>
              <div className="text-[13px] text-[#6e6e73] mb-1">{res.pkg.panels} แผง · {res.pkg.inverter}</div>
            </div>
            <div className="text-[13px] text-[#6e6e73] mt-1">งบประมาณ ~{money(res.pkg.price)} · {res.pkg.name}</div>
            <div className="grid grid-cols-2 gap-2 mt-3">
              <div className="rounded-xl bg-[#eaf7ee] p-3">
                <div className="text-[11px] text-[#1a7d3a]">ประหยัด/เดือน</div>
                <div className="text-xl font-bold text-[#1a7d3a]">{money(res.monthlySave)}</div>
                <div className="text-[11px] text-[#6e6e73]">~{money(res.yearlySave)}/ปี</div>
              </div>
              <div className="rounded-xl bg-[#fff5ec] p-3">
                <div className="text-[11px] text-[#F5821F]">คืนทุนประมาณ</div>
                <div className="text-xl font-bold text-[#1d1d1f]">{num(res.payback, 1)} ปี</div>
                <div className="text-[11px] text-[#6e6e73]">ลด CO₂ ~{num(res.co2Year)} kg/ปี</div>
              </div>
            </div>
            <div className="mt-3">
              <div className="flex justify-between text-[12px] text-[#6e6e73] mb-1"><span>โซลาร์ช่วยลดค่าไฟ</span><span className="text-[#F5821F] font-medium">~{res.cover}%</span></div>
              <div className="h-3 rounded-full bg-[#f0f0f2] overflow-hidden"><div className="h-full bg-[#F5821F]" style={{ width: res.cover + "%" }} /></div>
            </div>
            <div className="text-[12px] text-[#6e6e73] mt-3">🌳 เทียบเท่าปลูกต้นไม้ ~{num(res.trees)} ต้น/ปี</div>
            <p className="text-[11px] text-[#a1a1a6] mt-2">* ประเมินเบื้องต้นจากค่าไฟ อาจปรับตามการใช้จริงหน้างาน</p>
          </div>

          <div className="bg-white rounded-2xl border border-[#e8e8ed] p-5">
            <div className="font-semibold text-[#1d1d1f] mb-2">รับผลประเมิน + ให้เจ้าหน้าที่ติดต่อกลับ</div>
            <div className="space-y-2.5">
              <input value={f.name} onChange={(e) => upd("name", e.target.value)} placeholder="ชื่อ-นามสกุล *"
                className="w-full px-3 py-2.5 border border-[#d2d2d7] rounded-xl text-sm" />
              <input inputMode="tel" value={f.phone} onChange={(e) => upd("phone", e.target.value)} placeholder="เบอร์โทร / LINE"
                className="w-full px-3 py-2.5 border border-[#d2d2d7] rounded-xl text-sm" />
              <ProvinceInput className="w-full px-3 py-2.5 border border-[#d2d2d7] rounded-xl text-sm" value={f.province} onChange={(v) => upd("province", v)} placeholder="จังหวัด" />
            </div>
            <div className="flex gap-2 mt-3">
              <button onClick={save} disabled={busy || saved}
                className="flex-1 bg-[#1d1d1f] text-white rounded-xl py-2.5 text-sm font-semibold disabled:opacity-50">
                {saved ? "บันทึกแล้ว ✓" : busy ? "กำลังบันทึก…" : "บันทึกข้อมูล"}
              </button>
              <button onClick={saveImage} className="flex-1 border border-[#F5821F] text-[#F5821F] rounded-xl py-2.5 text-sm font-semibold">เซฟรูปผลประเมิน</button>
            </div>
            {msg && <div className={`text-[13px] mt-2 ${saved ? "text-[#1a7d3a]" : "text-[#c0392b]"}`}>{msg}</div>}
            <button onClick={() => { setRes(null); setSaved(false); setMsg(""); }} className="w-full text-[12px] text-[#6e6e73] mt-3">← ประเมินใหม่</button>
          </div>
        </div>
      )}

      <canvas ref={canvasRef} className="hidden" />

      {showQR && (
        <div className="fixed inset-0 z-[60] bg-black/60 flex items-center justify-center p-6" onClick={() => setShowQR(false)}>
          <div className="bg-white rounded-2xl p-5 max-w-xs w-full text-center" onClick={(e) => e.stopPropagation()}>
            <div className="font-semibold text-[#1d1d1f] mb-1">ให้ลูกค้าสแกน</div>
            <p className="text-[12px] text-[#6e6e73] mb-3">สแกนเพื่อเปิดหน้านี้บนมือถือลูกค้า</p>
            <img alt="QR" className="w-52 h-52 mx-auto rounded-lg border border-[#eee]" src={"https://api.qrserver.com/v1/create-qr-code/?size=240x240&data=" + encodeURIComponent(url)} />
            <div className="text-[11px] text-[#a1a1a6] mt-2 break-all">{url}</div>
            <button onClick={() => setShowQR(false)} className="w-full bg-[#1d1d1f] text-white rounded-xl py-2.5 text-sm font-semibold mt-3">ปิด</button>
          </div>
        </div>
      )}
    </div>
  );
}

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}
