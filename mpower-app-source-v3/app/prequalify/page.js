"use client";
import { useState, useRef, useEffect } from "react";
import {
  CATALOG, AC_PRESETS, AC_DUTY, acRatedKw, acAvgKw, rowPower,
  summarize, recommend, SUN_HOURS, PANEL_W, BATT_UNIT, AC_EER,
} from "@/lib/loadprofile";
import LoadProfileChart from "@/components/LoadProfileChart";

const fmt = (n) => Number(n || 0).toLocaleString("th-TH", { maximumFractionDigits: 1 });
const fmt2 = (n) => Number(n || 0).toLocaleString("th-TH", { maximumFractionDigits: 2 });

// สร้าง array 24 ชม. ON ในช่วง a..b (ข้ามเที่ยงคืนได้)
function span(a, b) {
  const h = new Array(24).fill(0);
  for (let i = 0; i < 24; i++) {
    if (a <= b) { if (i >= a && i < b) h[i] = 1; }
    else { if (i >= a || i < b) h[i] = 1; }
  }
  return h;
}
const GRP = ["แอร์", "ครัว", "ซักล้าง", "อื่นๆ", "ธุรกิจ"];

let SEQ = 100;
function acRow(btu) {
  return { key: SEQ++, kind: "ac", name: "แอร์ " + btu.toLocaleString() + " BTU", btu, acType: "inverter", qty: 1, hours: span(19, 23) };
}
function appRow(item) {
  return { key: SEQ++, kind: "app", name: item.name, kw: item.kw, duty: item.duty, qty: 1, hours: item.allday ? span(0, 24) : span(18, 23) };
}

const seed = () => [
  { key: SEQ++, kind: "ac", name: "แอร์ 12,000 BTU", btu: 12000, acType: "inverter", qty: 1, hours: span(21, 6) },
  { key: SEQ++, kind: "ac", name: "แอร์ 18,000 BTU", btu: 18000, acType: "inverter", qty: 1, hours: span(18, 23) },
  { key: SEQ++, kind: "app", name: "ตู้เย็น 1 ประตู", kw: 0.15, duty: 0.35, qty: 1, hours: span(0, 24) },
  { key: SEQ++, kind: "app", name: "ไฟ LED (รวมบ้าน)", kw: 0.1, duty: 1.0, qty: 1, hours: span(18, 23) },
];

export default function PreQualifyPage() {
  const [rows, setRows] = useState(seed());
  const [pick, setPick] = useState("");
  const [batteryPref, setBatteryPref] = useState("off_night");
  const paint = useRef({ active: false, val: 1, key: null });

  useEffect(() => {
    const up = () => { paint.current.active = false; };
    window.addEventListener("pointerup", up);
    window.addEventListener("pointercancel", up);
    return () => { window.removeEventListener("pointerup", up); window.removeEventListener("pointercancel", up); };
  }, []);

  const setRow = (key, patch) => setRows((s) => s.map((r) => (r.key === key ? { ...r, ...patch } : r)));
  const del = (key) => setRows((s) => s.filter((r) => r.key !== key));
  const applyPaint = (key, i, val) =>
    setRows((s) => s.map((r) => (r.key === key ? { ...r, hours: r.hours.map((v, idx) => (idx === i ? val : v)) } : r)));

  const addApp = () => {
    if (!pick) return;
    const item = CATALOG.find((c) => c.id === pick);
    if (item) setRows((s) => [...s, appRow(item)]);
    setPick("");
  };

  const rec = recommend(rows, batteryPref);
  const maxH = Math.max(0.001, ...rec.h);

  const inCls = "px-2 py-1 border border-[#d2d2d7] rounded-lg text-sm bg-white";

  const PRESETS = [
    { label: "ทั้งวัน", h: span(0, 24) },
    { label: "9–16", h: span(9, 16) },
    { label: "18–23", h: span(18, 23) },
    { label: "22–6", h: span(22, 6) },
    { label: "ล้าง", h: new Array(24).fill(0) },
  ];

  function Timeline({ r }) {
    const onDown = (i) => (e) => {
      e.preventDefault();
      const val = r.hours[i] ? 0 : 1;
      paint.current = { active: true, val, key: r.key };
      applyPaint(r.key, i, val);
    };
    const onMove = (e) => {
      const p = paint.current;
      if (!p.active || p.key !== r.key) return;
      const t = e.touches ? e.touches[0] : e;
      const el = document.elementFromPoint(t.clientX, t.clientY);
      if (el && el.dataset && el.dataset.h != null) applyPaint(r.key, +el.dataset.h, p.val);
    };
    return (
      <div className="flex gap-[2px] select-none" style={{ touchAction: "none" }} onPointerMove={onMove} onTouchMove={onMove}>
        {r.hours.map((on, i) => (
          <div
            key={i}
            data-h={i}
            onPointerDown={onDown(i)}
            className={"flex-1 h-8 rounded-[3px] flex items-center justify-center text-[9px] cursor-pointer " + (on ? "bg-[#F5821F] text-white" : "bg-[#eef0f2] text-[#c7c9cd]")}
          >
            {i}
          </div>
        ))}
      </div>
    );
  }

  function RowCard({ r }) {
    const isAc = r.kind === "ac";
    const per = rowPower(r);
    const hrs = r.hours.reduce((a, b) => a + b, 0);
    const kwh = per * (r.qty || 1) * hrs;
    return (
      <div className="border border-[#ececed] rounded-xl p-3">
        <div className="flex flex-wrap items-center gap-2 mb-2">
          <span className={"pill " + (isAc ? "pill-warn" : "pill-mut")}>{isAc ? "แอร์" : "ไฟ"}</span>
          <span className="font-medium text-[#1d1d1f] text-sm">{r.name}</span>
          {isAc && (
            <span className="inline-flex rounded-lg overflow-hidden border border-[#e2e2e7] text-[12px]">
              {["inverter", "standard"].map((tp) => (
                <button key={tp} onClick={() => setRow(r.key, { acType: tp })}
                  className={"px-2 py-1 " + (r.acType === tp ? "bg-[#1d1d1f] text-white" : "bg-white text-[#6e6e73]")}>
                  {tp === "inverter" ? "Inverter" : "ธรรมดา"}
                </button>
              ))}
            </span>
          )}
          <label className="text-[11px] text-[#6e6e73] ml-auto">จำนวน</label>
          <input type="number" min="1" value={r.qty} onChange={(e) => setRow(r.key, { qty: Math.max(1, +e.target.value || 1) })} className={inCls + " w-14 text-center"} />
          {!isAc && (
            <>
              <label className="text-[11px] text-[#6e6e73]">kW</label>
              <input type="number" step="0.05" value={r.kw} onChange={(e) => setRow(r.key, { kw: +e.target.value || 0 })} className={inCls + " w-16 text-right"} />
            </>
          )}
          <button onClick={() => del(r.key)} className="text-[#c0392b] px-1">✕</button>
        </div>

        <div className="flex flex-wrap items-center gap-2 mb-2 text-[11px] text-[#6e6e73]">
          {isAc ? (
            <span>พิกัด {fmt2(acRatedKw(r.btu))} kW · เฉลี่ยขณะทำงาน <b className="text-[#1d1d1f]">{fmt2(per)} kW</b> ({Math.round((AC_DUTY[r.acType] || 0.58) * 100)}%)</span>
          ) : (
            <span>เฉลี่ยขณะทำงาน <b className="text-[#1d1d1f]">{fmt2(per)} kW</b> (duty {Math.round((r.duty == null ? 1 : r.duty) * 100)}%)</span>
          )}
          <span className="ml-auto font-semibold text-[#1d1d1f]">{hrs} ชม. · {fmt(kwh)} kWh/วัน</span>
        </div>

        <Timeline r={r} />

        <div className="flex flex-wrap gap-1.5 mt-2">
          {PRESETS.map((p) => (
            <button key={p.label} onClick={() => setRow(r.key, { hours: p.h.slice() })}
              className="text-[11px] px-2 py-0.5 rounded-md border border-[#e2e2e7] text-[#6e6e73] hover:bg-[#f5f5f7]">{p.label}</button>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="mb-4">
        <h1 className="text-xl font-bold text-[#1d1d1f]">Pre-qualify — Load Profile รายชั่วโมง</h1>
        <p className="text-sm text-[#6e6e73] mt-0.5">ลากแถบเวลาเลือกช่วงที่เปิดแต่ละเครื่อง · แอร์คิดกำลังไฟจริงจาก BTU + Inverter/ธรรมดา · กราฟด้านล่างคือ Load Profile จริงรายชั่วโมง</p>
      </div>

      <div className="grid lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2 space-y-4">
          <div className="card p-4 space-y-3">
            {rows.map((r) => <RowCard key={r.key} r={r} />)}
            {rows.length === 0 && <div className="text-center text-[#a1a1a6] py-6 text-sm">ยังไม่มีเครื่องใช้ไฟฟ้า — เพิ่มด้านล่าง</div>}
          </div>

          <div className="card p-4">
            <div className="text-[12px] text-[#6e6e73] mb-2">+ เพิ่มแอร์ (BTU)</div>
            <div className="flex flex-wrap gap-2 mb-3">
              {AC_PRESETS.map((b) => (
                <button key={b} onClick={() => setRows((s) => [...s, acRow(b)])}
                  className="text-[13px] px-3 py-1.5 rounded-lg border border-[#ffd9b8] bg-[#fff8f1] text-[#F5821F] font-semibold">{b.toLocaleString()} BTU</button>
              ))}
            </div>
            <div className="text-[12px] text-[#6e6e73] mb-2">+ เพิ่มเครื่องใช้ไฟฟ้า</div>
            <div className="flex gap-2">
              <select value={pick} onChange={(e) => setPick(e.target.value)} className={inCls + " flex-1"}>
                <option value="">เลือกเครื่องใช้ไฟฟ้า…</option>
                {GRP.filter((g) => g !== "แอร์").map((g) => (
                  <optgroup key={g} label={g}>
                    {CATALOG.filter((c) => c.grp === g).map((c) => <option key={c.id} value={c.id}>{c.name} ({c.kw} kW)</option>)}
                  </optgroup>
                ))}
              </select>
              <button onClick={addApp} className="bg-[#F5821F] text-white rounded-lg px-4 py-1.5 text-sm font-semibold shrink-0">เพิ่ม</button>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div className="card p-4">
            <div className="font-semibold text-[#1d1d1f] mb-1">Load Profile · {fmt(rec.total)} kWh/วัน</div>
            <div className="text-[11px] text-[#a1a1a6] mb-3">เส้นส้ม = ผลิตจากแดด (โค้งระฆัง) · เส้นดำ = การใช้ไฟของคุณ · ตรงที่ซ้อนกัน = ใช้แดดตรง</div>
            <LoadProfileChart hours={rec.h} kwp={rec.kwp} height={140} />
            <div className="grid grid-cols-3 gap-2 mt-3 text-center">
              <div className="bg-[#fff8f1] rounded-lg p-2"><div className="text-[10px] text-[#6e6e73]">กลางวัน 9–16</div><div className="font-bold text-[#F5821F]">{fmt(rec.dayLoad)}</div></div>
              <div className="bg-[#f5f5f7] rounded-lg p-2"><div className="text-[10px] text-[#6e6e73]">นอกเวลาแดด</div><div className="font-bold text-[#1d1d1f]">{fmt(rec.offLoad)}</div></div>
              <div className="bg-[#f5f5f7] rounded-lg p-2"><div className="text-[10px] text-[#6e6e73]">กลางคืน</div><div className="font-bold text-[#1d1d1f]">{fmt(rec.nightLoad)}</div></div>
            </div>
          </div>

          <div className="card p-4">
            <div className="font-semibold text-[#1d1d1f] mb-3">ระบบที่แนะนำ</div>
            <div className="space-y-3">
              <div className="bg-[#fff8f1] rounded-xl p-3 border border-[#ffe4cc]">
                <div className="text-2xl font-bold text-[#F5821F]">{fmt2(rec.kwp)} kWp</div>
                <div className="text-[12px] text-[#6e6e73]">{rec.panels} แผง × {PANEL_W}W · ผลิต ~{fmt(rec.dailyProd)} kWh/วัน</div>
              </div>
              <div>
                <label className="block text-[11px] text-[#6e6e73] mb-1">ต้องการแบตสำรองช่วงไหน</label>
                <select value={batteryPref} onChange={(e) => setBatteryPref(e.target.value)} className={inCls + " w-full"}>
                  <option value="off_night">หัวค่ำ + กลางคืน</option>
                  <option value="night">กลางคืนอย่างเดียว</option>
                  <option value="none">ไม่เอาแบต (on-grid)</option>
                </select>
              </div>
              <div className="bg-[#f5f5f7] rounded-xl p-3">
                <div className="text-2xl font-bold text-[#1d1d1f]">{rec.battModules ? fmt(rec.battKwh) + " kWh" : "—"}</div>
                <div className="text-[12px] text-[#6e6e73]">{rec.battModules ? rec.battModules + " ก้อน × " + BATT_UNIT + " kWh (Atmoce)" : "ระบบ on-grid ไม่ใช้แบต"}</div>
              </div>
              <div className="bg-[#f2faf4] rounded-xl p-3 border border-[#cdeed6]">
                <div className="text-lg font-bold text-[#1a7d3a]">~{rec.monthlySave.toLocaleString("th-TH")} ฿/เดือน</div>
                <div className="text-[12px] text-[#6e6e73]">ประหยัดโดยประมาณ</div>
              </div>
            </div>
          </div>

          <div className="card p-4 text-[11px] text-[#6e6e73] leading-relaxed">
            <div className="font-semibold text-[#1d1d1f] mb-1 text-sm">อ้างอิงการคำนวณ</div>
            แอร์: กำลังพิกัด = BTU ÷ EER({AC_EER}) · เฉลี่ยขณะทำงาน = พิกัด × {Math.round(AC_DUTY.inverter * 100)}% (Inverter) / {Math.round(AC_DUTY.standard * 100)}% (ธรรมดา)<br />
            แดดเต็ม {SUN_HOURS} ชม./วัน · แผง {PANEL_W}W · แบตก้อนละ {BATT_UNIT} kWh · ขนาดระบบ = (โหลดกลางวัน + ที่ชาร์จแบต) ÷ แดด × 1.1
          </div>

          <button onClick={() => { try { localStorage.setItem("mpower_lp", JSON.stringify({ rows })); } catch (e) {} window.location.href = "/proposal"; }} className="w-full bg-[#1d1d1f] text-white rounded-lg px-6 py-2.5 text-sm font-semibold">ส่งต่อ → ทำใบเสนอ (Proposal)</button>
        </div>
      </div>
    </div>
  );
}
