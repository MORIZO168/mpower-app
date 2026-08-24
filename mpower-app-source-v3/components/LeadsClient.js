"use client";
import { useState } from "react";

const SOURCES = ["Facebook", "Instagram", "TikTok", "LINE", "Google", "แนะนำต่อ", "Walk-in", "อื่นๆ"];
const TYPES = ["บ้าน", "ร้านค้า", "โรงงาน", "อื่นๆ"];
const SYSTYPES = ["on-grid", "hybrid", "off-grid"];
const GRADES = ["A", "B", "C"];
const inCls = "w-full px-2.5 py-1.5 border border-[#d2d2d7] rounded-lg text-sm bg-white";
const gradeTone = (g) => (g === "A" ? "ok" : g === "B" ? "warn" : "mut");

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
  const empty = { Customer_Name: "", Phone_LINE: "", Source: "", Type: "", Province: "", Monthly_Bill_THB: "", Est_kWp: "", System_Type: "", Grade: "", Next_Action: "", Note: "" };
  const [f, setF] = useState(empty);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState(null);
  const [open, setOpen] = useState(false);
  const upd = (k, v) => setF((s) => ({ ...s, [k]: v }));

  async function submit() {
    if (!f.Customer_Name.trim()) { setMsg({ t: "bad", m: "กรอกชื่อลูกค้าก่อน" }); return; }
    setBusy(true); setMsg(null);
    const obj = { ACard_ID: nextId(rows), Date: today(), ...f, Status: "new" };
    try {
      const res = await fetch("/api/sheets", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "append", tab: "A-Card", obj, idField: "ACard_ID", required: ["Customer_Name"] }),
      });
      const d = await res.json();
      if (d.ok) { setMsg({ t: "ok", m: `บันทึกแล้ว → ${obj.ACard_ID}` }); setF(empty); setTimeout(() => window.location.reload(), 900); }
      else setMsg({ t: "bad", m: d.error || "บันทึกไม่สำเร็จ" });
    } catch (e) { setMsg({ t: "bad", m: String(e).slice(0, 120) }); }
    setBusy(false);
  }

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="flex items-center gap-3 mb-4">
        <div>
          <h1 className="text-xl font-bold text-[#1d1d1f]">ลูกค้า / A-Card</h1>
          <p className="text-sm text-[#6e6e73] mt-0.5">รับ lead ทุกช่องทาง + เกรด · เชื่อม Google Sheet แท็บ A-Card</p>
        </div>
        <span className={`ml-auto pill pill-${configured ? "ok" : "mut"}`}>{configured ? "เชื่อม Sheet แล้ว" : "ยังไม่เชื่อม Sheet"}</span>
      </div>

      {error && <div className="card p-3 mb-4 text-sm text-[#c0392b]">อ่านชีตไม่สำเร็จ: {error}</div>}
      {!configured && <div className="card p-3 mb-4 text-sm text-[#6e6e73]">ยังไม่ได้ตั้งค่า env — ตั้งค่าตามคู่มือก่อน ระบบจะดึงข้อมูลจริงอัตโนมัติ</div>}

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
              <div><label className="block text-[11px] text-[#6e6e73] mb-1">จังหวัด</label><input className={inCls} value={f.Province} onChange={(e) => upd("Province", e.target.value)} /></div>
              <div><label className="block text-[11px] text-[#6e6e73] mb-1">ค่าไฟ/เดือน (บาท)</label><input type="number" className={inCls} value={f.Monthly_Bill_THB} onChange={(e) => upd("Monthly_Bill_THB", e.target.value)} /></div>
              <div><label className="block text-[11px] text-[#6e6e73] mb-1">ขนาดโดยประมาณ (kWp)</label><input type="number" className={inCls} value={f.Est_kWp} onChange={(e) => upd("Est_kWp", e.target.value)} /></div>
              <div><label className="block text-[11px] text-[#6e6e73] mb-1">ประเภทระบบ</label><select className={inCls} value={f.System_Type} onChange={(e) => upd("System_Type", e.target.value)}><option value="">เลือก…</option>{SYSTYPES.map((s) => <option key={s}>{s}</option>)}</select></div>
              <div><label className="block text-[11px] text-[#6e6e73] mb-1">เกรด</label><select className={inCls} value={f.Grade} onChange={(e) => upd("Grade", e.target.value)}><option value="">เลือก…</option>{GRADES.map((s) => <option key={s}>{s}</option>)}</select></div>
              <div className="md:col-span-2"><label className="block text-[11px] text-[#6e6e73] mb-1">ขั้นถัดไป</label><input className={inCls} value={f.Next_Action} onChange={(e) => upd("Next_Action", e.target.value)} placeholder="เช่น นัดสำรวจ / โทรกลับ" /></div>
              <div><label className="block text-[11px] text-[#6e6e73] mb-1">หมายเหตุ</label><input className={inCls} value={f.Note} onChange={(e) => upd("Note", e.target.value)} /></div>
            </div>
            <div className="flex items-center gap-3 mt-3">
              <button onClick={submit} disabled={busy} className="bg-[#1d1d1f] text-white rounded-lg px-5 py-2 text-sm font-semibold disabled:opacity-50">{busy ? "กำลังบันทึก…" : "บันทึกเข้า Sheet"}</button>
              {msg && <span className={`text-sm ${msg.t === "ok" ? "text-[#1a7d3a]" : "text-[#c0392b]"}`}>{msg.m}</span>}
              <span className="text-[11px] text-[#a1a1a6] ml-auto">ID ออกอัตโนมัติ · Date = วันนี้</span>
            </div>
          </div>
        )}
      </div>

      <div className="card p-5">
        <div className="font-semibold text-[#1d1d1f] mb-3">รายการ A-Card ({rows.length})</div>
        <div className="overflow-x-auto">
          <table className="w-full text-[13px] min-w-[640px]">
            <thead><tr className="text-[#a1a1a6] text-[11px] text-left border-b border-[#eee]">
              <th className="py-1.5">ID</th><th>ลูกค้า</th><th>ช่องทาง</th><th>ประเภท</th><th>จังหวัด</th><th className="text-right">ค่าไฟ</th><th className="text-center">เกรด</th><th>สถานะ</th><th>ถัดไป</th>
            </tr></thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.ACard_ID || r._row} className="border-b border-[#f4f4f6]">
                  <td className="py-2 text-[#6e6e73]">{r.ACard_ID}</td>
                  <td className="font-medium text-[#1d1d1f]">{r.Customer_Name}<div className="text-[11px] text-[#a1a1a6]">{r.Phone_LINE}</div></td>
                  <td className="text-[#6e6e73]">{r.Source}</td>
                  <td className="text-[#6e6e73]">{r.Type}</td>
                  <td className="text-[#6e6e73]">{r.Province}</td>
                  <td className="text-right text-[#6e6e73]">{r.Monthly_Bill_THB}</td>
                  <td className="text-center">{r.Grade && <span className={`pill pill-${gradeTone(r.Grade)}`}>{r.Grade}</span>}</td>
                  <td className="text-[#6e6e73]">{r.Status}</td>
                  <td className="text-[#6e6e73]">{r.Next_Action}</td>
                </tr>
              ))}
              {rows.length === 0 && <tr><td colSpan={9} className="py-6 text-center text-[#a1a1a6]">ยังไม่มีข้อมูล — กด "เพิ่ม A-Card ใหม่" เพื่อเริ่ม</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
