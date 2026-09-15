"use client";
import { useState } from "react";

// ฟอร์มบันทึกรายรับ (Sales) / รายจ่าย (Purchases) เข้า Supabase → หน้า P&L จะคำนวณให้อัตโนมัติ
const inCls = "w-full px-2.5 py-1.5 border border-[#d2d2d7] rounded-lg text-sm bg-white";
const today = () => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`; };
const num = (v) => { const n = Number(String(v ?? "").replace(/[^0-9.-]/g, "")); return Number.isFinite(n) ? n : 0; };

function seq(prefix) {
  const d = new Date();
  const t = String(d.getFullYear()).slice(2) + String(d.getMonth() + 1).padStart(2, "0") + String(d.getDate()).padStart(2, "0") +
    String(d.getHours()).padStart(2, "0") + String(d.getMinutes()).padStart(2, "0") + String(d.getSeconds()).padStart(2, "0");
  return prefix + "-" + t;
}

export default function FinanceEntry() {
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState("sale");
  const [f, setF] = useState({ Date: today(), Job_ID: "", who: "", ref: "", Amount_ExVAT: "", Paid: "no", Note: "" });
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState(null);
  const upd = (k, v) => setF((s) => ({ ...s, [k]: v }));

  const ex = num(f.Amount_ExVAT);
  const vat = Math.round(ex * 0.07 * 100) / 100;
  const inc = Math.round((ex + vat) * 100) / 100;

  async function submit() {
    if (!ex) { setMsg({ t: "bad", m: "ใส่จำนวนเงิน (ก่อน VAT)" }); return; }
    setBusy(true); setMsg(null);
    const isSale = tab === "sale";
    const tabName = isSale ? "Sales" : "Purchases";
    const obj = isSale
      ? { Sale_ID: seq("S"), Date: f.Date, Job_ID: f.Job_ID, Customer_Name: f.who, Milestone: f.ref, Amount_ExVAT: ex, "VAT_7%": vat, Amount_IncVAT: inc, Paid: f.Paid, Note: f.Note }
      : { Purchase_ID: seq("P"), Date: f.Date, Supplier: f.who, Category: f.ref, Job_ID: f.Job_ID, Amount_ExVAT: ex, "VAT_7%": vat, Amount_IncVAT: inc, Paid: f.Paid, Note: f.Note };
    try {
      const res = await fetch("/api/sheets", { method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "append", tab: tabName, obj, idField: isSale ? "Sale_ID" : "Purchase_ID" }) });
      const d = await res.json();
      if (d.ok) { setMsg({ t: "ok", m: `บันทึก${isSale ? "รายรับ" : "รายจ่าย"} ${inc.toLocaleString()} บาทแล้ว — รีเฟรชหน้าเพื่อดู P&L` }); setF({ Date: today(), Job_ID: "", who: "", ref: "", Amount_ExVAT: "", Paid: "no", Note: "" }); }
      else setMsg({ t: "bad", m: d.error || "บันทึกไม่สำเร็จ" });
    } catch (e) { setMsg({ t: "bad", m: String(e).slice(0, 120) }); }
    setBusy(false);
  }

  return (
    <div className="card p-4 mb-4">
      <button onClick={() => setOpen((o) => !o)} className="bg-[#1d1d1f] text-white rounded-lg px-4 py-2 text-sm font-semibold">
        {open ? "ปิดฟอร์ม" : "+ บันทึกรายรับ / รายจ่าย"}
      </button>
      {open && (
        <div className="mt-4">
          <div className="flex gap-2 mb-3">
            {[["sale", "รายรับ (ขาย)"], ["purchase", "รายจ่าย (ซื้อ)"]].map(([v, l]) => (
              <button key={v} onClick={() => setTab(v)} className={`text-[13px] px-3 py-1.5 rounded-lg border ${tab === v ? "bg-[#F5821F] text-white border-[#F5821F]" : "bg-white text-[#6e6e73] border-[#d2d2d7]"}`}>{l}</button>
            ))}
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            <div><label className="block text-[11px] text-[#6e6e73] mb-1">วันที่</label><input type="date" className={inCls} value={f.Date} onChange={(e) => upd("Date", e.target.value)} /></div>
            <div><label className="block text-[11px] text-[#6e6e73] mb-1">{tab === "sale" ? "ลูกค้า" : "ผู้ขาย/ซัพพลายเออร์"}</label><input className={inCls} value={f.who} onChange={(e) => upd("who", e.target.value)} /></div>
            <div><label className="block text-[11px] text-[#6e6e73] mb-1">Job ID (ถ้ามี)</label><input className={inCls} value={f.Job_ID} onChange={(e) => upd("Job_ID", e.target.value)} placeholder="S-2509-001" /></div>
            <div><label className="block text-[11px] text-[#6e6e73] mb-1">{tab === "sale" ? "งวด/รายการ" : "หมวด"}</label><input className={inCls} value={f.ref} onChange={(e) => upd("ref", e.target.value)} placeholder={tab === "sale" ? "มัดจำ / งวด 2" : "อุปกรณ์ / ค่าแรง"} /></div>
            <div><label className="block text-[11px] text-[#6e6e73] mb-1">จำนวนเงิน (ก่อน VAT)</label><input type="number" className={inCls} value={f.Amount_ExVAT} onChange={(e) => upd("Amount_ExVAT", e.target.value)} /></div>
            <div>
              <label className="block text-[11px] text-[#6e6e73] mb-1">{tab === "sale" ? "รับเงินแล้ว?" : "จ่ายแล้ว?"}</label>
              <select className={inCls} value={f.Paid} onChange={(e) => upd("Paid", e.target.value)}><option value="no">ยัง</option><option value="yes">แล้ว</option></select>
            </div>
          </div>
          <div className="flex items-center gap-4 mt-3 text-[13px] text-[#6e6e73]">
            <span>VAT 7%: <b className="text-[#1d1d1f]">{vat.toLocaleString()}</b></span>
            <span>รวม VAT: <b className="text-[#F5821F]">{inc.toLocaleString()}</b></span>
          </div>
          <div className="flex items-center gap-3 mt-3">
            <button onClick={submit} disabled={busy} className="bg-[#F5821F] text-white rounded-lg px-5 py-2 text-sm font-semibold disabled:opacity-50">{busy ? "กำลังบันทึก…" : "บันทึก"}</button>
            {msg && <span className={`text-sm ${msg.t === "ok" ? "text-[#1a7d3a]" : "text-[#c0392b]"}`}>{msg.m}</span>}
          </div>
        </div>
      )}
    </div>
  );
}
