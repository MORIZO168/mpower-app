"use client";
import { useState } from "react";
import { APPLIANCES, BANDS, SUN_HOURS, PANEL_W, BATT_UNIT } from "@/lib/appliances";

const inCls = "px-2 py-1 border border-[#d2d2d7] rounded-lg text-sm bg-white";
const fmt = (n) => Number(n).toLocaleString("th-TH", { maximumFractionDigits: 1 });

const seed = () => [
  { key: 1, id: "ac12", w: 1100, qty: 2, hrs: 6, band: "eve" },
  { key: 2, id: "fridge", w: 90, qty: 1, hrs: 24, band: "night" },
  { key: 3, id: "led", w: 10, qty: 12, hrs: 5, band: "eve" },
  { key: 4, id: "tv", w: 120, qty: 1, hrs: 5, band: "eve" },
  { key: 5, id: "washer", w: 500, qty: 1, hrs: 1, band: "day" },
];

export default function PreQualifyPage() {
  const [rows, setRows] = useState(seed());
  const [pick, setPick] = useState("");
  const [batteryPref, setBatteryPref] = useState("eve_night");

  const app = (id) => APPLIANCES.find((a) => a.id === id) || { name: id };
  const kwh = (r) => (r.w * r.qty * r.hrs) / 1000;

  const add = () => {
    if (!pick) return;
    const a = app(pick);
    setRows((s) => [...s, { key: Date.now(), id: pick, w: a.w, qty: 1, hrs: 4, band: a.band }]);
    setPick("");
  };
  const upd = (key, k, v) => setRows((s) => s.map((r) => (r.key === key ? { ...r, [k]: v } : r)));
  const del = (key) => setRows((s) => s.filter((r) => r.key !== key));

  const band = { day: 0, eve: 0, night: 0 };
  rows.forEach((r) => (band[r.band] += kwh(r)));
  const totalDay = band.day + band.eve + band.night;

  const battTarget = batteryPref === "eve_night" ? band.eve + band.night : batteryPref === "night" ? band.night : 0;
  const battModules = battTarget > 0 ? Math.max(1, Math.round(battTarget / BATT_UNIT)) : 0;
  const battKwh = battModules * BATT_UNIT;

  // ระบบต้องผลิตพอ = ใช้กลางวัน + ชาร์จแบตไว้ใช้ตอนเย็น/คืน (×1.1 เผื่อสูญเสีย)
  const recKwp = Math.max(0.66, ((band.day + battTarget) / SUN_HOURS) * 1.1);
  const panels = Math.ceil((recKwp * 1000) / PANEL_W);
  const actualKwp = (panels * PANEL_W) / 1000;
  const dailyProd = actualKwp * SUN_HOURS;

  const monthlySave = Math.round((dailyProd + Math.min(battKwh, band.eve + band.night)) * 30 * 4.2);
  const pct = (v) => (totalDay ? Math.round((v / totalDay) * 100) : 0);

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="mb-4">
        <h1 className="text-xl font-bold text-[#1d1d1f]">Pre-qualify — สร้าง Load Profile</h1>
        <p className="text-sm text-[#6e6e73] mt-0.5">เลือกเครื่องใช้ไฟฟ้า + ช่วงเวลาที่ใช้ → ระบบประเมินขนาดที่ควรติด แบตที่ควรมี และจำนวนแผง</p>
      </div>

      <div className="grid lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2 space-y-4">
          <div className="card p-5">
            <div className="flex flex-col sm:flex-row sm:items-center gap-2 mb-3">
              <div className="font-semibold text-[#1d1d1f]">เครื่องใช้ไฟฟ้า ({rows.length})</div>
              <div className="sm:ml-auto flex gap-2">
                <select value={pick} onChange={(e) => setPick(e.target.value)} className={`${inCls} flex-1`}>
                  <option value="">+ เพิ่มเครื่องใช้ไฟฟ้า…</option>
                  {["แอร์", "ครัว", "ซักล้าง", "อื่นๆ", "ธุรกิจ"].map((g) => (
                    <optgroup key={g} label={g}>
                      {APPLIANCES.filter((a) => a.grp === g).map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
                    </optgroup>
                  ))}
                </select>
                <button onClick={add} className="bg-[#F5821F] text-white rounded-lg px-4 py-1.5 text-sm font-semibold shrink-0">เพิ่ม</button>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-[13px] min-w-[560px]">
                <thead><tr className="text-[#a1a1a6] text-[11px] text-left border-b border-[#eee]">
                  <th className="py-1.5">รายการ</th><th className="text-right">วัตต์</th><th className="text-center">จำนวน</th><th className="text-center">ชม./วัน</th><th className="text-center">ช่วงเวลา</th><th className="text-right">kWh/วัน</th><th></th>
                </tr></thead>
                <tbody>
                  {rows.map((r) => (
                    <tr key={r.key} className="border-b border-[#f4f4f6]">
                      <td className="py-1.5 pr-2">{app(r.id).name}</td>
                      <td className="text-right"><input type="number" value={r.w} onChange={(e) => upd(r.key, "w", +e.target.value || 0)} className={`${inCls} w-16 text-right`} /></td>
                      <td className="text-center"><input type="number" value={r.qty} onChange={(e) => upd(r.key, "qty", +e.target.value || 0)} className={`${inCls} w-12 text-center`} /></td>
                      <td className="text-center"><input type="number" value={r.hrs} onChange={(e) => upd(r.key, "hrs", +e.target.value || 0)} className={`${inCls} w-12 text-center`} /></td>
                      <td className="text-center">
                        <select value={r.band} onChange={(e) => upd(r.key, "band", e.target.value)} className={`${inCls} w-24`}>
                          <option value="day">กลางวัน</option><option value="eve">หัวค่ำ</option><option value="night">กลางคืน</option>
                        </select>
                      </td>
                      <td className="text-right font-medium">{fmt(kwh(r))}</td>
                      <td className="text-right"><button onClick={() => del(r.key)} className="text-[#c0392b] px-1">✕</button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="card p-5">
            <div className="font-semibold text-[#1d1d1f] mb-3">Load Profile — การใช้ไฟต่อวัน {fmt(totalDay)} kWh</div>
            {Object.entries(BANDS).map(([k, b]) => (
              <div key={k} className="mb-3">
                <div className="flex justify-between text-[13px] mb-1">
                  <span className="text-[#1d1d1f]">{b.label} <span className="text-[11px] text-[#a1a1a6]">· {b.note}</span></span>
                  <span className="font-medium">{fmt(band[k])} kWh <span className="text-[#a1a1a6] text-[11px]">({pct(band[k])}%)</span></span>
                </div>
                <div className="h-2.5 rounded-full bg-[#f0f0f2] overflow-hidden">
                  <div style={{ width: pct(band[k]) + "%", background: b.tone }} className="h-full" />
                </div>
              </div>
            ))}
            <div className="text-[11px] text-[#a1a1a6] mt-2">โหลดกลางวันคือส่วนที่โซลาร์คุ้มที่สุด · หัวค่ำ+กลางคืนคือส่วนที่แบตช่วยได้</div>
          </div>
        </div>

        <div className="space-y-4">
          <div className="card p-5">
            <div className="font-semibold text-[#1d1d1f] mb-3">ระบบที่แนะนำ</div>
            <div className="space-y-3">
              <div className="bg-[#fff8f1] rounded-xl p-3 border border-[#ffe4cc]">
                <div className="text-2xl font-bold text-[#F5821F]">{fmt(actualKwp)} kWp</div>
                <div className="text-[12px] text-[#6e6e73]">{panels} แผง × {PANEL_W}W · ผลิต ~{fmt(dailyProd)} kWh/วัน</div>
              </div>

              <div>
                <label className="block text-[11px] text-[#6e6e73] mb-1">ต้องการแบตสำรองช่วงไหน</label>
                <select value={batteryPref} onChange={(e) => setBatteryPref(e.target.value)} className={`${inCls} w-full`}>
                  <option value="eve_night">หัวค่ำ + กลางคืน</option>
                  <option value="night">กลางคืนอย่างเดียว</option>
                  <option value="none">ไม่เอาแบต (on-grid)</option>
                </select>
              </div>

              <div className="bg-[#f5f5f7] rounded-xl p-3">
                <div className="text-2xl font-bold text-[#1d1d1f]">{battModules ? `${fmt(battKwh)} kWh` : "—"}</div>
                <div className="text-[12px] text-[#6e6e73]">{battModules ? `${battModules} ก้อน × ${BATT_UNIT} kWh (Atmoce)` : "ระบบ on-grid ไม่ใช้แบต"}</div>
              </div>

              <div className="bg-[#f2faf4] rounded-xl p-3 border border-[#cdeed6]">
                <div className="text-lg font-bold text-[#1a7d3a]">~{monthlySave.toLocaleString("th-TH")} ฿/เดือน</div>
                <div className="text-[12px] text-[#6e6e73]">ประหยัดโดยประมาณ (4.2 ฿/หน่วย)</div>
              </div>
            </div>
          </div>

          <div className="card p-5 text-[12px] text-[#6e6e73] leading-relaxed">
            <div className="font-semibold text-[#1d1d1f] mb-1 text-sm">อ้างอิงการคำนวณ</div>
            แดดเต็ม {SUN_HOURS} ชม./วัน · แผง {PANEL_W}W · แบตก้อนละ {BATT_UNIT} kWh<br />
            ขนาดระบบคิดจาก โหลดกลางวัน + พลังงานที่ต้องชาร์จแบต ×1.1 · ปรับ วัตต์/ชม./ช่วงเวลา ได้ ตัวเลขอัปเดตทันที
          </div>

          <button className="w-full bg-[#1d1d1f] text-white rounded-lg px-6 py-2.5 text-sm font-semibold">ส่งต่อ → ใบเสนอราคา (Quote)</button>
        </div>
      </div>
    </div>
  );
}
