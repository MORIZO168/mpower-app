"use client";
import { useState, useRef, useEffect } from "react";
import ProvinceInput from "@/components/ProvinceInput";
import { CATALOG, AC_PRESETS, AC_DUTY, acRatedKw, rowPower, summarize, recommend, PANEL_W } from "@/lib/loadprofile";
import { suggestPackage, ADDON } from "@/lib/packages";
import usePackages from "@/components/usePackages";
import LoadProfileChart from "@/components/LoadProfileChart";

const BOOTH_URL = "https://mpower-system.vercel.app/booth";
const TIMEFRAMES = [
  { v: "ภายใน 3 เดือน", g: "Hot" },
  { v: "3-6 เดือน", g: "Warm" },
  { v: "6 เดือนขึ้นไป", g: "Cool" },
];
const GRADE = { "ภายใน 3 เดือน": "Hot", "3-6 เดือน": "Warm", "6 เดือนขึ้นไป": "Cool" };
const money = (n) => Number(n || 0).toLocaleString("th-TH", { maximumFractionDigits: 0 });
const fmt = (n) => Number(n || 0).toLocaleString("th-TH", { maximumFractionDigits: 1 });
const fmt2 = (n) => Number(n || 0).toLocaleString("th-TH", { maximumFractionDigits: 2 });

function span(a, b) {
  const h = new Array(24).fill(0);
  for (let i = 0; i < 24; i++) { if (a <= b) { if (i >= a && i < b) h[i] = 1; } else { if (i >= a || i < b) h[i] = 1; } }
  return h;
}
let SEQ = 100;
const acRow = (btu) => ({ key: SEQ++, kind: "ac", name: "แอร์ " + btu.toLocaleString() + " BTU", btu, acType: "inverter", qty: 1, hours: span(19, 23) });
const appRow = (it) => ({ key: SEQ++, kind: "app", name: it.name, kw: it.kw, duty: it.duty, qty: 1, hours: it.allday ? span(0, 24) : span(18, 23) });
const seed = () => [
  { key: SEQ++, kind: "ac", name: "แอร์ 12,000 BTU", btu: 12000, acType: "inverter", qty: 1, hours: span(21, 6) },
  { key: SEQ++, kind: "app", name: "ตู้เย็น 1 ประตู", kw: 0.15, duty: 0.35, qty: 1, hours: span(0, 24) },
  { key: SEQ++, kind: "app", name: "ไฟ LED (รวมบ้าน)", kw: 0.1, duty: 1.0, qty: 1, hours: span(18, 23) },
];

function boothId() {
  const d = new Date();
  const ym = String(d.getFullYear()).slice(2) + String(d.getMonth() + 1).padStart(2, "0");
  const t = String(d.getDate()).padStart(2, "0") + String(d.getHours()).padStart(2, "0") + String(d.getMinutes()).padStart(2, "0") + String(d.getSeconds()).padStart(2, "0");
  return "AC-" + ym + "-B" + t;
}
function today() { const d = new Date(); return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0"); }

const EMPTY = { name: "", phone: "", province: "", type: "บ้าน", consent: false, timeframe: "" };

export default function BoothPage() {
  const [step, setStep] = useState(0);
  const [f, setF] = useState(EMPTY);
  const [rows, setRows] = useState(seed());
  const [pick, setPick] = useState("");
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState("");
  const [event, setEvent] = useState("");
  const [showQR, setShowQR] = useState(false);
  const [count, setCount] = useState(0);
  const paint = useRef({ active: false, val: 1, key: null });
  const upd = (k, v) => setF((s) => ({ ...s, [k]: v }));

  useEffect(() => {
    try { setEvent(localStorage.getItem("mpower_booth_event") || ""); setCount(+(localStorage.getItem("mpower_booth_count") || 0)); flushQueue(); } catch (e) {}
    const up = () => { paint.current.active = false; };
    window.addEventListener("pointerup", up); window.addEventListener("pointercancel", up);
    return () => { window.removeEventListener("pointerup", up); window.removeEventListener("pointercancel", up); };
  }, []);

  const setRow = (key, patch) => setRows((s) => s.map((r) => (r.key === key ? { ...r, ...patch } : r)));
  const delRow = (key) => setRows((s) => s.filter((r) => r.key !== key));
  const applyPaint = (key, i, val) => setRows((s) => s.map((r) => (r.key === key ? { ...r, hours: r.hours.map((v, idx) => (idx === i ? val : v)) } : r)));
  const addApp = () => { if (!pick) return; const it = CATALOG.find((c) => c.id === pick); if (it) setRows((s) => [...s, appRow(it)]); setPick(""); };

  async function postLead(obj) {
    const res = await fetch("/api/sheets", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "append", tab: "A-Card", obj, idField: "ACard_ID", required: ["Customer_Name"] }) });
    const d = await res.json(); if (!d.ok) throw new Error(d.error || "fail"); return d;
  }
  async function flushQueue() {
    let q = []; try { q = JSON.parse(localStorage.getItem("mpower_booth_queue") || "[]"); } catch (e) { q = []; }
    if (!q.length) return; const left = [];
    for (const obj of q) { try { await postLead(obj); } catch (e) { left.push(obj); } }
    try { localStorage.setItem("mpower_booth_queue", JSON.stringify(left)); } catch (e) {}
  }
  const saveEvent = (v) => { setEvent(v); try { localStorage.setItem("mpower_booth_event", v); } catch (e) {} };
  const bump = () => { const n = count + 1; setCount(n); try { localStorage.setItem("mpower_booth_count", String(n)); } catch (e) {} };

  // ===== ผลประเมิน 2 แบบ =====
  const recN = recommend(rows, "none");        // ไม่มีแบต
  const recB = recommend(rows, "off_night");    // มีแบต
  const pkgs = usePackages();
  const pkgN = suggestPackage(recN.kwp, pkgs);
  const pkgB = suggestPackage(recB.kwp, pkgs);
  const priceN = pkgN.price;
  const priceB = pkgB.price + recB.battModules * ADDON.battery;
  const sm = summarize(rows);
  const maxH = Math.max(0.001, ...sm.h);

  async function submit() {
    setBusy(true); setNote("");
    const src = event ? "บูธ · " + event : "บูธ";
    const obj = {
      ACard_ID: boothId(), Date: today(), Customer_Name: f.name, Phone_LINE: f.phone, Source: src, Type: f.type,
      Province: f.province, Monthly_Bill_THB: "", Est_kWp: recB.kwp, System_Type: "เสนอทั้งมี/ไม่มีแบต",
      Grade: GRADE[f.timeframe] || "", Status: "new", Next_Action: "นัดสำรวจ",
      Note: ["กรอกที่บูธ", "โหลด " + fmt(sm.total) + " kWh/วัน", "ไม่มีแบต: " + pkgN.name + " เซฟ~" + money(recN.monthlySave) + "฿/ด", "มีแบต: " + pkgB.name + " +แบต " + recB.battKwh + "kWh เซฟ~" + money(recB.monthlySave) + "฿/ด", f.timeframe].filter(Boolean).join(" · "),
    };
    try { await postLead(obj); bump(); setStep(3); }
    catch (e) {
      try { const q = JSON.parse(localStorage.getItem("mpower_booth_queue") || "[]"); q.push(obj); localStorage.setItem("mpower_booth_queue", JSON.stringify(q)); } catch (e2) {}
      bump(); setNote("บันทึกไว้ในเครื่องแล้ว จะซิงค์เมื่อเน็ตกลับมา"); setStep(3);
    }
    setBusy(false);
  }
  const reset = () => { setF(EMPTY); setRows(seed()); setNote(""); setStep(0); };

  const canStep0 = f.name.trim() && f.phone.trim() && f.consent;
  const canStep1 = rows.length > 0 && sm.total > 0 && f.timeframe;
  const inCls = "w-full px-3 py-2.5 border border-[#d2d2d7] rounded-xl text-base bg-white";
  const btnPick = (on) => "w-full text-left px-4 py-3 rounded-xl border text-base transition " + (on ? "border-[#F5821F] bg-[#fff5ec] font-semibold text-[#1d1d1f]" : "border-[#e2e2e7] bg-white text-[#1d1d1f]");

  function Timeline({ r }) {
    const onDown = (i) => (e) => { e.preventDefault(); const val = r.hours[i] ? 0 : 1; paint.current = { active: true, val, key: r.key }; applyPaint(r.key, i, val); };
    const onMove = (e) => { const p = paint.current; if (!p.active || p.key !== r.key) return; const t = e.touches ? e.touches[0] : e; const el = document.elementFromPoint(t.clientX, t.clientY); if (el && el.dataset && el.dataset.h != null) applyPaint(r.key, +el.dataset.h, p.val); };
    return (
      <div className="overflow-x-auto -mx-1 px-1">
        <div className="flex gap-[2px] select-none min-w-[560px]" style={{ touchAction: "none" }} onPointerMove={onMove} onTouchMove={onMove}>
          {r.hours.map((on, i) => (
            <div key={i} data-h={i} onPointerDown={onDown(i)} className={"flex-1 min-w-[22px] h-8 rounded-[3px] flex items-center justify-center text-[9px] cursor-pointer " + (on ? "bg-[#F5821F] text-white" : "bg-[#eef0f2] text-[#c7c9cd]")}>{i}</div>
          ))}
        </div>
      </div>
    );
  }
  const RowPresets = [
    { label: "ทั้งวัน", h: span(0, 24) }, { label: "9–16", h: span(9, 16) },
    { label: "18–23", h: span(18, 23) }, { label: "22–6", h: span(22, 6) }, { label: "ล้าง", h: new Array(24).fill(0) },
  ];
  function RowCard({ r }) {
    const isAc = r.kind === "ac"; const per = rowPower(r); const hrs = r.hours.reduce((a, b) => a + b, 0); const kwh = per * (r.qty || 1) * hrs;
    return (
      <div className="border border-[#ececed] rounded-xl p-3">
        <div className="flex flex-wrap items-center gap-2 mb-2">
          <span className="font-medium text-[#1d1d1f] text-sm">{r.name}</span>
          {isAc && (
            <span className="inline-flex rounded-lg overflow-hidden border border-[#e2e2e7] text-[12px]">
              {["inverter", "standard"].map((tp) => (
                <button key={tp} onClick={() => setRow(r.key, { acType: tp })} className={"px-2 py-1 " + (r.acType === tp ? "bg-[#1d1d1f] text-white" : "bg-white text-[#6e6e73]")}>{tp === "inverter" ? "Inverter" : "ธรรมดา"}</button>
              ))}
            </span>
          )}
          <label className="text-[11px] text-[#6e6e73] ml-auto">จำนวน</label>
          <input type="number" min="1" value={r.qty} onChange={(e) => setRow(r.key, { qty: Math.max(1, +e.target.value || 1) })} className="w-14 text-center px-2 py-1 border border-[#d2d2d7] rounded-lg text-sm" />
          {!isAc && <input type="number" step="0.05" value={r.kw} onChange={(e) => setRow(r.key, { kw: +e.target.value || 0 })} className="w-16 text-right px-2 py-1 border border-[#d2d2d7] rounded-lg text-sm" />}
          <button onClick={() => delRow(r.key)} className="text-[#c0392b] px-1">✕</button>
        </div>
        <div className="text-[11px] text-[#6e6e73] mb-2">{isAc ? "พิกัด " + fmt2(acRatedKw(r.btu)) + " kW · เฉลี่ย " + fmt2(per) + " kW" : "เฉลี่ย " + fmt2(per) + " kW"} · <b className="text-[#1d1d1f]">{hrs} ชม. · {fmt(kwh)} kWh</b></div>
        <Timeline r={r} />
        <div className="flex flex-wrap gap-1.5 mt-2">
          {RowPresets.map((p) => <button key={p.label} onClick={() => setRow(r.key, { hours: p.h.slice() })} className="text-[11px] px-2 py-0.5 rounded-md border border-[#e2e2e7] text-[#6e6e73]">{p.label}</button>)}
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 bg-[#f5f5f7] overflow-auto">
      <div className="bg-[#1d1d1f] text-white px-5 py-3 flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-[#F5821F] flex items-center justify-center font-bold">M</div>
        <div className="leading-tight">
          <div className="font-bold text-sm">M POWER NATURE ENERGY 168</div>
          <div className="text-[11px] text-[#a1a1a6]">ประเมินโซลาร์ฟรี · รู้ผลไว</div>
        </div>
        <button onClick={() => setShowQR(true)} className="ml-auto text-[11px] text-[#a1a1a6] border border-[#3a3a3c] rounded-lg px-2 py-1">เจ้าหน้าที่</button>
      </div>

      <div className={"mx-auto px-5 py-6 " + (step === 1 ? "max-w-3xl" : "max-w-md")}>
        {step < 3 && (
          <div className="flex items-center gap-2 mb-6">
            {[0, 1, 2].map((i) => <div key={i} className={"h-1.5 flex-1 rounded-full " + (i <= step ? "bg-[#F5821F]" : "bg-[#e2e2e7]")} />)}
          </div>
        )}

        {step === 0 && (
          <div className="space-y-4">
            <h1 className="text-2xl font-bold text-[#1d1d1f]">ข้อมูลของคุณ</h1>
            <p className="text-sm text-[#6e6e73] -mt-2">กรอกสั้นๆ เพื่อรับผลประเมินและให้ทีมติดต่อกลับ</p>
            <div><label className="block text-[13px] text-[#6e6e73] mb-1">ชื่อ *</label><input className={inCls} value={f.name} onChange={(e) => upd("name", e.target.value)} placeholder="ชื่อ-นามสกุล" /></div>
            <div><label className="block text-[13px] text-[#6e6e73] mb-1">เบอร์ / LINE *</label><input className={inCls} value={f.phone} onChange={(e) => upd("phone", e.target.value)} placeholder="08x-xxx-xxxx" inputMode="tel" /></div>
            <div><label className="block text-[13px] text-[#6e6e73] mb-1">จังหวัด</label><ProvinceInput className={inCls} value={f.province} onChange={(v) => upd("province", v)} /></div>
            <div>
              <label className="block text-[13px] text-[#6e6e73] mb-1">ประเภท</label>
              <div className="grid grid-cols-2 gap-2">{["บ้าน", "ร้านค้า"].map((t) => <button key={t} onClick={() => upd("type", t)} className={btnPick(f.type === t)}>{t}</button>)}</div>
            </div>
            <label className="flex items-start gap-2 text-[13px] text-[#6e6e73] pt-1">
              <input type="checkbox" checked={f.consent} onChange={(e) => upd("consent", e.target.checked)} className="mt-1 w-4 h-4" />
              <span>ยินยอมให้ M Power เก็บข้อมูลและติดต่อกลับเพื่อเสนอบริการ (PDPA)</span>
            </label>
            <button onClick={() => setStep(1)} disabled={!canStep0} className="w-full bg-[#F5821F] text-white rounded-xl py-3.5 text-base font-semibold disabled:opacity-40">ถัดไป — ทำ Load Profile</button>
          </div>
        )}

        {step === 1 && (
          <div className="space-y-4">
            <h1 className="text-2xl font-bold text-[#1d1d1f]">การใช้ไฟของคุณ</h1>
            <p className="text-sm text-[#6e6e73] -mt-2">เพิ่มเครื่องใช้ไฟฟ้า แล้วลากแถบเลือกช่วงเวลาที่เปิด — ยิ่งละเอียด ยิ่งประเมินแม่น</p>

            <div className="bg-white rounded-2xl p-3 border border-[#ececed] space-y-3">
              {rows.map((r) => <RowCard key={r.key} r={r} />)}
              {rows.length === 0 && <div className="text-center text-[#a1a1a6] py-4 text-sm">เพิ่มเครื่องใช้ไฟฟ้าด้านล่าง</div>}
            </div>

            <div className="bg-white rounded-2xl p-3 border border-[#ececed]">
              <div className="text-[12px] text-[#6e6e73] mb-2">+ เพิ่มแอร์ (BTU)</div>
              <div className="flex flex-wrap gap-2 mb-3">{AC_PRESETS.map((b) => <button key={b} onClick={() => setRows((s) => [...s, acRow(b)])} className="text-[13px] px-3 py-1.5 rounded-lg border border-[#ffd9b8] bg-[#fff8f1] text-[#F5821F] font-semibold">{b.toLocaleString()} BTU</button>)}</div>
              <div className="flex gap-2">
                <select value={pick} onChange={(e) => setPick(e.target.value)} className="flex-1 px-2 py-2 border border-[#d2d2d7] rounded-lg text-sm bg-white">
                  <option value="">เลือกเครื่องใช้ไฟฟ้า…</option>
                  {["ครัว", "ซักล้าง", "อื่นๆ", "ธุรกิจ"].map((g) => <optgroup key={g} label={g}>{CATALOG.filter((c) => c.grp === g).map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</optgroup>)}
                </select>
                <button onClick={addApp} className="bg-[#F5821F] text-white rounded-lg px-4 py-1.5 text-sm font-semibold shrink-0">เพิ่ม</button>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-4 border border-[#ececed]">
              <div className="text-[13px] font-semibold text-[#1d1d1f] mb-1">รวมการใช้ไฟ {fmt(sm.total)} kWh/วัน</div>
              <LoadProfileChart hours={sm.h} kwp={recB.kwp} height={110} />

            </div>

            <div>
              <div className="text-[13px] text-[#6e6e73] mb-2">คิดจะติดตั้งเมื่อไหร่? *</div>
              <div className="grid grid-cols-3 gap-2">{TIMEFRAMES.map((t) => <button key={t.v} onClick={() => upd("timeframe", t.v)} className={"px-2 py-2.5 rounded-xl border text-sm " + (f.timeframe === t.v ? "border-[#F5821F] bg-[#fff5ec] font-semibold" : "border-[#e2e2e7] bg-white text-[#6e6e73]")}>{t.v}</button>)}</div>
            </div>

            <div className="flex gap-2">
              <button onClick={() => setStep(0)} className="px-5 py-3.5 rounded-xl border border-[#d2d2d7] text-base text-[#6e6e73]">ย้อนกลับ</button>
              <button onClick={() => setStep(2)} disabled={!canStep1} className="flex-1 bg-[#F5821F] text-white rounded-xl py-3.5 text-base font-semibold disabled:opacity-40">ดูผลประเมิน</button>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4">
            <h1 className="text-2xl font-bold text-[#1d1d1f]">ผลประเมินของ {f.name || "คุณ"}</h1>

            <div className="bg-white rounded-2xl p-4 border border-[#ececed]">
              <div className="text-[13px] text-[#6e6e73]">Load Profile</div>
              <div className="text-2xl font-bold text-[#1d1d1f]">{fmt(sm.total)} <span className="text-sm font-normal text-[#6e6e73]">kWh/วัน</span></div>
              <LoadProfileChart hours={sm.h} kwp={recB.kwp} height={110} />
              <div className="text-[11px] text-[#6e6e73] mt-2">กลางวัน {fmt(sm.dayLoad)} · หัวค่ำ/คืน {fmt(sm.offLoad)} kWh</div>
            </div>

            <div className="text-[13px] font-semibold text-[#1d1d1f] mt-2">แพคเกจที่เหมาะกับคุณ</div>
            <div className="grid grid-cols-1 gap-3">
              <div className="bg-white rounded-2xl p-4 border border-[#ececed]">
                <div className="flex items-center gap-2"><span className="text-[11px] px-2 py-0.5 rounded-full bg-[#f5f5f7] text-[#6e6e73]">ไม่มีแบต (on-grid)</span></div>
                <div className="text-xl font-bold text-[#1d1d1f] mt-1">{pkgN.name}</div>
                <div className="text-[12px] text-[#6e6e73]">{pkgN.kwp} kWp · {pkgN.panels} แผง · {pkgN.inverter}</div>
                <div className="flex items-end justify-between mt-2">
                  <div><div className="text-[11px] text-[#6e6e73]">ราคาประมาณ</div><div className="font-bold text-[#1d1d1f]">{money(priceN)} ฿</div></div>
                  <div className="text-right"><div className="text-[11px] text-[#6e6e73]">ประหยัด</div><div className="font-bold text-[#1a7d3a]">~{money(recN.monthlySave)} ฿/ด</div></div>
                </div>
              </div>
              <div className="bg-white rounded-2xl p-4 border-2 border-[#F5821F]">
                <div className="flex items-center gap-2"><span className="text-[11px] px-2 py-0.5 rounded-full bg-[#fff5ec] text-[#F5821F] font-semibold">มีแบต (สำรองไฟ)</span></div>
                <div className="text-xl font-bold text-[#1d1d1f] mt-1">{pkgB.name} + แบต {recB.battKwh} kWh</div>
                <div className="text-[12px] text-[#6e6e73]">{pkgB.kwp} kWp · {pkgB.panels} แผง · มีไฟใช้ตอนไฟดับ</div>
                <div className="flex items-end justify-between mt-2">
                  <div><div className="text-[11px] text-[#6e6e73]">ราคาประมาณ</div><div className="font-bold text-[#1d1d1f]">{money(priceB)} ฿</div></div>
                  <div className="text-right"><div className="text-[11px] text-[#6e6e73]">ประหยัด</div><div className="font-bold text-[#1a7d3a]">~{money(recB.monthlySave)} ฿/ด</div></div>
                </div>
              </div>
            </div>

            <p className="text-[11px] text-[#a1a1a6]">ตัวเลขเป็นการประเมินเบื้องต้นจาก Load Profile · ราคา/ผลจริงต้องสำรวจหน้างานและออกแบบก่อน</p>
            <button onClick={submit} disabled={busy} className="w-full bg-[#F5821F] text-white rounded-xl py-3.5 text-base font-semibold disabled:opacity-50">{busy ? "กำลังบันทึก…" : "ให้ทีมติดต่อนัดสำรวจ (ฟรี)"}</button>
            <button onClick={() => setStep(1)} className="w-full text-[13px] text-[#6e6e73] py-1">ย้อนกลับแก้ Load Profile</button>
          </div>
        )}

        {step === 3 && (
          <div className="text-center py-10 space-y-4">
            <div className="w-16 h-16 rounded-full bg-[#e8f7ee] mx-auto flex items-center justify-center text-3xl">✓</div>
            <h1 className="text-2xl font-bold text-[#1d1d1f]">ขอบคุณครับ!</h1>
            <p className="text-sm text-[#6e6e73]">ทีม M Power จะติดต่อกลับเพื่อนัดสำรวจหน้างานฟรี 🙏</p>
            {note && <p className="text-[12px] text-[#F5821F]">{note}</p>}
            <button onClick={reset} className="w-full bg-[#1d1d1f] text-white rounded-xl py-3.5 text-base font-semibold mt-4">เริ่มคนถัดไป</button>
          </div>
        )}
      </div>

      {showQR && (
        <div className="fixed inset-0 z-[60] bg-black/60 flex items-center justify-center p-6" onClick={() => setShowQR(false)}>
          <div className="bg-white rounded-2xl p-5 max-w-xs w-full text-center" onClick={(e) => e.stopPropagation()}>
            <div className="font-bold text-[#1d1d1f] mb-1">โหมดเจ้าหน้าที่</div>
            <div className="text-[12px] text-[#6e6e73] mb-3">ให้ลูกค้าสแกนกรอกในมือถือตัวเอง</div>
            <img alt="QR" className="w-48 h-48 mx-auto rounded-lg border border-[#eee]" src={"https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=" + encodeURIComponent(BOOTH_URL)} />
            <div className="text-[11px] text-[#a1a1a6] mt-1 break-all">{BOOTH_URL}</div>
            <div className="text-left mt-4"><label className="block text-[12px] text-[#6e6e73] mb-1">ชื่องาน/บูธ (แท็กใน Source)</label><input className={inCls} value={event} onChange={(e) => saveEvent(e.target.value)} placeholder="เช่น รร.สาธิต 2568" /></div>
            <div className="text-[13px] text-[#1d1d1f] mt-3">เก็บได้วันนี้: <b>{count}</b> ราย</div>
            <button onClick={() => setShowQR(false)} className="w-full bg-[#1d1d1f] text-white rounded-xl py-2.5 text-sm font-semibold mt-3">ปิด</button>
          </div>
        </div>
      )}
    </div>
  );
}
