"use client";
import { useState } from "react";
import ProvinceInput from "@/components/ProvinceInput";

const SOURCES = ["Facebook", "Instagram", "TikTok", "LINE", "Google", "แนะนำต่อ", "Walk-in", "อื่นๆ"];
const TYPES = ["บ้าน", "ร้านค้า", "โรงงาน", "อื่นๆ"];
const TIMEFRAMES = [
  { v: "ภายใน 3 เดือน", g: "Hot" },
  { v: "3-6 เดือน", g: "Warm" },
  { v: "6 เดือนขึ้นไป", g: "Cool" },
];
const inCls = "w-full px-2.5 py-1.5 border border-[#d2d2d7] rounded-lg text-sm bg-white";
const gradeTone = (g) => (g === "Hot" ? "bad" : g === "Warm" ? "warn" : g === "Cool" ? "mut" : "mut");
const gradeFromTf = (tf) => (TIMEFRAMES.find((t) => t.v === tf) || {}).g || "";

// 3 สเต็ปการไหลของลูกค้า: Lead (Hot/Warm/Cool) → รอติดตั้ง (นัดแล้ว) → ลูกค้า CRM (ติดตั้งเสร็จ)
const STAGES = [
  { key: "lead", label: "Lead", sub: "ยังไม่นัดติดตั้ง", tone: "bg-[#eef2ff] text-[#3730a3]" },
  { key: "booked", label: "รอติดตั้ง", sub: "นัดติดตั้งแล้ว", tone: "bg-[#fff4e0] text-[#b7791f]" },
  { key: "customer", label: "ลูกค้า CRM", sub: "ติดตั้งเสร็จแล้ว", tone: "bg-[#e8f7ee] text-[#1a7d3a]" },
];
const stageOf = (r) => {
  const s = (r.Status || "").toLowerCase();
  return s === "customer" ? "customer" : s === "booked" ? "booked" : "lead";
};
const stageMeta = (k) => STAGES.find((s) => s.key === k) || STAGES[0];

function nextId(rows) {
  const d = new Date();
  const ym = String(d.getFullYear()).slice(2) + String(d.getMonth() + 1).padStart(2, "0");
  const prefix = "AC-" + ym + "-";
  let max = 0;
  rows.forEach((r) => { const id = r.ACard_ID || ""; if (id.startsWith(prefix)) { const n = +id.slice(prefix.length); if (n > max) max = n; } });
  return prefix + String(max + 1).padStart(3, "0");
}
const today = () => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`; };

export default function LeadsClient({ rows = [], configured, error }) {
  const empty = { Customer_Name: "", Phone_LINE: "", Source: "", Type: "", Province: "", Monthly_Bill_THB: "", Est_kWp: "", timeframe: "", battery: "", Next_Action: "", Note: "" };
  const [f, setF] = useState(empty);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState(null);
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState("all");
  const [busyId, setBusyId] = useState(null);
  const [flowMsg, setFlowMsg] = useState(null);
  const upd = (k, v) => setF((s) => ({ ...s, [k]: v }));

  const counts = {
    all: rows.length,
    lead: rows.filter((r) => stageOf(r) === "lead").length,
    booked: rows.filter((r) => stageOf(r) === "booked").length,
    customer: rows.filter((r) => stageOf(r) === "customer").length,
  };
  const shown = tab === "all" ? rows : rows.filter((r) => stageOf(r) === tab);

  async function api(body) {
    const res = await fetch("/api/sheets", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    return res.json();
  }

  async function submit() {
    if (!f.Customer_Name.trim()) { setMsg({ t: "bad", m: "กรอกชื่อลูกค้าก่อน" }); return; }
    setBusy(true); setMsg(null);
    const obj = {
      ACard_ID: nextId(rows), Date: today(),
      Customer_Name: f.Customer_Name, Phone_LINE: f.Phone_LINE, Source: f.Source, Type: f.Type,
      Province: f.Province, Monthly_Bill_THB: f.Monthly_Bill_THB, Est_kWp: f.Est_kWp,
      System_Type: f.battery === "สนใจ" ? "hybrid (มีแบต)" : f.battery === "ไม่สนใจ" ? "on-grid" : "",
      Grade: gradeFromTf(f.timeframe),
      Status: "lead",
      Next_Action: f.Next_Action,
      Note: [f.timeframe && `ติดตั้ง: ${f.timeframe}`, f.battery && `แบต: ${f.battery}`, f.Note].filter(Boolean).join(" · "),
    };
    const d = await api({ action: "append", tab: "A-Card", obj, idField: "ACard_ID", required: ["Customer_Name"] });
    if (d.ok) { setMsg({ t: "ok", m: `บันทึกแล้ว → ${obj.ACard_ID} (${obj.Grade})` }); setF(empty); setTimeout(() => window.location.reload(), 900); }
    else { setMsg({ t: "bad", m: d.error || "บันทึกไม่สำเร็จ" }); setBusy(false); }
  }

  // Lead → รอติดตั้ง
  async function book(r) {
    if (!configured) return;
    setBusyId(r.ACard_ID); setFlowMsg(null);
    const d = await api({ action: "update", tab: "A-Card", idField: "ACard_ID", idValue: r.ACard_ID, patch: { Status: "booked" } });
    if (d.ok) window.location.reload();
    else { setFlowMsg({ t: "bad", m: d.error || "อัปเดตไม่สำเร็จ" }); setBusyId(null); }
  }
  // รอติดตั้ง → ลูกค้า CRM (ติดตั้งเสร็จ + ดันเข้าฐาน O&M)
  async function complete(r) {
    if (!configured) return;
    setBusyId(r.ACard_ID); setFlowMsg(null);
    const site = {
      Site_ID: r.ACard_ID, Customer_Name: r.Customer_Name, Area: r.Province || "", Brand: "Atmoce",
      kWp: r.Est_kWp || "", Battery_kWh: "", Install_Date: today(), Last_Service_Date: today(),
      Ticket_Issue: "", Ticket_Status: "",
    };
    const a = await api({ action: "append", tab: "Installed_Base", obj: site, idField: "Site_ID", required: ["Customer_Name"] });
    if (!a.ok) { setFlowMsg({ t: "bad", m: "สร้างงานติดตั้งไม่สำเร็จ: " + (a.error || "") }); setBusyId(null); return; }
    const d = await api({ action: "update", tab: "A-Card", idField: "ACard_ID", idValue: r.ACard_ID, patch: { Status: "customer" } });
    if (d.ok) window.location.reload();
    else { setFlowMsg({ t: "bad", m: d.error || "อัปเดตสถานะไม่สำเร็จ" }); setBusyId(null); }
  }

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="flex items-center gap-3 mb-4">
        <div>
          <h1 className="text-xl font-bold text-[#1d1d1f]">ลูกค้า / A-Card</h1>
          <p className="text-sm text-[#6e6e73] mt-0.5">Lead (Hot/Warm/Cool) → รอติดตั้ง → ลูกค้า CRM · เลื่อนสถานะทีละสเต็ป</p>
        </div>
        <span className={`ml-auto pill pill-${configured ? "ok" : "mut"}`}>{configured ? "เชื่อมข้อมูลแล้ว" : "ยังไม่เชื่อม"}</span>
      </div>

      {error && <div className="card p-3 mb-4 text-sm text-[#c0392b]">อ่านข้อมูลไม่สำเร็จ: {error}</div>}
      {!configured && <div className="card p-3 mb-4 text-sm text-[#6e6e73]">ยังไม่ได้ตั้งค่า env — ตั้งค่าตามคู่มือก่อน</div>}

      {/* funnel สรุป 3 สเต็ป */}
      <div className="grid grid-cols-3 gap-3 mb-4">
        {STAGES.map((s) => (
          <div key={s.key} className="card p-4">
            <div className="text-2xl font-bold text-[#1d1d1f]">{counts[s.key]}</div>
            <div className="text-[13px] text-[#1d1d1f] font-medium mt-0.5">{s.label}</div>
            <div className="text-[11px] text-[#a1a1a6]">{s.sub}</div>
          </div>
        ))}
      </div>

      <div className="card p-5 mb-4">
        <button onClick={() => setOpen((o) => !o)} className="bg-[#F5821F] text-white rounded-lg px-4 py-2 text-sm font-semibold">
          {open ? "ปิดฟอร์ม" : "+ เพิ่ม A-Card ใหม่"}
        </button>
        {open && (
          <div className="mt-4">
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              <div><label className="block text-[11px] text-[#6e6e73] mb-1">ชื่อลูกค้า *</label><input className={inCls} value={f.Customer_Name} onChange={(e) => upd("Customer_Name", e.target.value)} /></div>
              <div><label className="block text-[11px] text-[#6e6e73] mb-1">เบอร์ / LINE</label><input className={inCls} value={f.Phone_LINE} onChange={(e) => upd("Phone_LINE", e.target.value)} placeholder="08x-xxx-xxxx" /></div>
              <div><label className="block text-[11px] text-[#6e6e73] mb-1">ช่องทาง</label><select className={inCls} value={f.Source} onChange={(e) => upd("Source", e.target.value)}><option value="">เลือก…</option>{SOURCES.map((s) => <option key={s}>{s}</option>)}</select></div>
              <div><label className="block text-[11px] text-[#6e6e73] mb-1">ประเภท</label><select className={inCls} value={f.Type} onChange={(e) => upd("Type", e.target.value)}><option value="">เลือก…</option>{TYPES.map((s) => <option key={s}>{s}</option>)}</select></div>
              <div><label className="block text-[11px] text-[#6e6e73] mb-1">จังหวัด</label><ProvinceInput className={inCls} value={f.Province} onChange={(v) => upd("Province", v)} /></div>
              <div><label className="block text-[11px] text-[#6e6e73] mb-1">ค่าไฟ/เดือน (บาท)</label><input type="number" className={inCls} value={f.Monthly_Bill_THB} onChange={(e) => upd("Monthly_Bill_THB", e.target.value)} /></div>
              <div>
                <label className="block text-[11px] text-[#6e6e73] mb-1">สนใจติดตั้งเมื่อไหร่ → เกรด</label>
                <select className={inCls} value={f.timeframe} onChange={(e) => upd("timeframe", e.target.value)}>
                  <option value="">เลือก…</option>
                  {TIMEFRAMES.map((t) => <option key={t.v} value={t.v}>{t.v} ({t.g})</option>)}
                </select>
              </div>
              <div>
                <label className="block text-[11px] text-[#6e6e73] mb-1">สนใจแบตเตอรี่?</label>
                <select className={inCls} value={f.battery} onChange={(e) => upd("battery", e.target.value)}>
                  <option value="">เลือก…</option><option value="สนใจ">สนใจ (hybrid)</option><option value="ไม่สนใจ">ไม่สนใจ (on-grid)</option>
                </select>
              </div>
              <div><label className="block text-[11px] text-[#6e6e73] mb-1">ขนาดโดยประมาณ (kWp)</label><input type="number" className={inCls} value={f.Est_kWp} onChange={(e) => upd("Est_kWp", e.target.value)} /></div>
              <div className="md:col-span-2"><label className="block text-[11px] text-[#6e6e73] mb-1">ขั้นถัดไป</label><input className={inCls} value={f.Next_Action} onChange={(e) => upd("Next_Action", e.target.value)} placeholder="เช่น นัดสำรวจ / โทรกลับ" /></div>
              <div><label className="block text-[11px] text-[#6e6e73] mb-1">หมายเหตุ</label><input className={inCls} value={f.Note} onChange={(e) => upd("Note", e.target.value)} /></div>
            </div>
            {f.timeframe && <div className="mt-2 text-[12px] text-[#6e6e73]">เกรดอัตโนมัติ: <span className={`pill pill-${gradeTone(gradeFromTf(f.timeframe))}`}>{gradeFromTf(f.timeframe)}</span></div>}
            <div className="flex items-center gap-3 mt-3">
              <button onClick={submit} disabled={busy} className="bg-[#1d1d1f] text-white rounded-lg px-5 py-2 text-sm font-semibold disabled:opacity-50">{busy ? "กำลังบันทึก…" : "บันทึก A-Card"}</button>
              {msg && <span className={`text-sm ${msg.t === "ok" ? "text-[#1a7d3a]" : "text-[#c0392b]"}`}>{msg.m}</span>}
              <span className="text-[11px] text-[#a1a1a6] ml-auto">ID ออกอัตโนมัติ · Date = วันนี้</span>
            </div>
          </div>
        )}
      </div>

      <div className="card p-5">
        {/* แท็บกรองตามสเต็ป */}
        <div className="flex items-center gap-2 mb-3 flex-wrap">
          {[{ key: "all", label: "ทั้งหมด" }, ...STAGES].map((t) => (
            <button key={t.key} onClick={() => setTab(t.key)}
              className={`text-[13px] px-3 py-1.5 rounded-full border ${tab === t.key ? "bg-[#1d1d1f] text-white border-[#1d1d1f]" : "bg-white text-[#6e6e73] border-[#e2e2e7]"}`}>
              {t.label} ({counts[t.key]})
            </button>
          ))}
          {flowMsg && <span className={`text-[13px] ml-auto ${flowMsg.t === "ok" ? "text-[#1a7d3a]" : "text-[#c0392b]"}`}>{flowMsg.m}</span>}
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-[13px] min-w-[720px]">
            <thead><tr className="text-[#a1a1a6] text-[11px] text-left border-b border-[#eee]">
              <th className="py-1.5">ID</th><th>ลูกค้า</th><th>ช่องทาง</th><th>จังหวัด</th><th className="text-right">ค่าไฟ</th><th className="text-center">เกรด</th><th>สถานะ</th><th className="text-right">เลื่อนสเต็ป</th>
            </tr></thead>
            <tbody>
              {shown.map((r) => {
                const st = stageOf(r);
                const meta = stageMeta(st);
                const rowBusy = busyId === r.ACard_ID;
                return (
                  <tr key={r.ACard_ID || r._row} className="border-b border-[#f4f4f6]">
                    <td className="py-2 text-[#6e6e73]">{r.ACard_ID}</td>
                    <td className="font-medium text-[#1d1d1f]">{r.Customer_Name}<div className="text-[11px] text-[#a1a1a6]">{r.Phone_LINE}</div></td>
                    <td className="text-[#6e6e73]">{r.Source}</td>
                    <td className="text-[#6e6e73]">{r.Province}</td>
                    <td className="text-right text-[#6e6e73]">{r.Monthly_Bill_THB}</td>
                    <td className="text-center">{r.Grade && <span className={`pill pill-${gradeTone(r.Grade)}`}>{r.Grade}</span>}</td>
                    <td><span className={`text-[11px] px-2 py-0.5 rounded-full ${meta.tone}`}>{meta.label}</span></td>
                    <td className="text-right">
                      {st === "lead" && <button onClick={() => book(r)} disabled={!configured || rowBusy} className="text-[12px] px-3 py-1.5 rounded-lg bg-[#F5821F] text-white disabled:opacity-40">{rowBusy ? "…" : "นัดติดตั้งแล้ว →"}</button>}
                      {st === "booked" && <button onClick={() => complete(r)} disabled={!configured || rowBusy} className="text-[12px] px-3 py-1.5 rounded-lg bg-[#1a7d3a] text-white disabled:opacity-40">{rowBusy ? "…" : "ติดตั้งเสร็จ → CRM"}</button>}
                      {st === "customer" && <span className="text-[12px] text-[#1a7d3a]">✓ เข้าระบบแล้ว</span>}
                    </td>
                  </tr>
                );
              })}
              {shown.length === 0 && <tr><td colSpan={8} className="py-6 text-center text-[#a1a1a6]">ยังไม่มีรายการในสเต็ปนี้</td></tr>}
            </tbody>
          </table>
        </div>
        <p className="text-[11px] text-[#a1a1a6] mt-3">กด “นัดติดตั้งแล้ว” เมื่อ booking · กด “ติดตั้งเสร็จ → CRM” เมื่อจบงาน ระบบจะย้ายลูกค้าเข้าฐานดูแลหลังติดตั้ง (O&M) และเริ่มนับรอบล้างแผงให้อัตโนมัติ</p>
      </div>
    </div>
  );
}
