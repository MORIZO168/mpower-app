"use client";
import { useMemo, useState } from "react";
import ProvinceInput from "@/components/ProvinceInput";

const inCls = "w-full px-2.5 py-1.5 border border-[#d2d2d7] rounded-lg text-sm bg-white";
const JOB_TYPES = ["EPC", "Subcontract"];
const PHASES = ["1 เฟส", "3 เฟส"];
const PEA_STATUS = ["ยังไม่ยื่น", "ยื่นแล้ว", "อนุมัติ/ขนานไฟแล้ว"];
const HANDOVER_STATUS = ["ยังไม่ส่งมอบ", "ส่งมอบแล้ว"];
const baht = (n) => "฿" + Number(n || 0).toLocaleString("th-TH");

function nextId(rows) {
  const d = new Date();
  const ym = String(d.getFullYear()).slice(2) + String(d.getMonth() + 1).padStart(2, "0");
  const prefix = "S-" + ym + "-";
  let max = 0;
  rows.forEach((r) => {
    const id = r.Job_ID || "";
    if (id.startsWith(prefix)) { const n = +id.slice(prefix.length); if (n > max) max = n; }
  });
  return prefix + String(max + 1).padStart(3, "0");
}
const today = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};

export default function RecordClient({ jobs = [], teams = [], configured, error }) {
  const teamNames = useMemo(() => teams.map((t) => t.Team_Name).filter(Boolean), [teams]);
  const base = () => ({
    Job_ID: nextId(jobs), Job_Type: "EPC", Customer_Name: "", Province: "",
    kWp: "", Panel_Model: "AIKO-A665-MDE72Dw", Panel_Qty: "", Inverter_Model: "",
    Phase: "", Sub_Team: "", Actual_Install_Date: today(), Sell_Price_THB: "",
    PEA_Status: "", Handover_Status: "", Note: "",
  });
  const [f, setF] = useState(base);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState(null);
  const [open, setOpen] = useState(false);
  const [added, setAdded] = useState([]);
  const upd = (k, v) => setF((s) => ({ ...s, [k]: v }));

  async function submit() {
    if (!f.Customer_Name.trim()) { setMsg({ t: "bad", m: "กรอกชื่อลูกค้าก่อน" }); return; }
    setBusy(true); setMsg(null);
    const obj = { ...f, Job_ID: (f.Job_ID || "").trim() || nextId(jobs) };
    try {
      const res = await fetch("/api/sheets", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "append", tab: "Jobs", obj, idField: "Job_ID", required: ["Customer_Name"] }),
      });
      const d = await res.json();
      if (d.ok) {
        setMsg({ t: "ok", m: `บันทึกงานแล้ว → ${obj.Job_ID} · ${obj.Customer_Name}` });
        setAdded((a) => [{ ...obj }, ...a]);
        setF(base());
      } else {
        const dup = /duplicate|unique|already exists/i.test(d.error || "");
        setMsg({ t: "bad", m: dup ? `Job_ID นี้มีแล้ว: ${obj.Job_ID}` : (d.error || "บันทึกไม่สำเร็จ") });
      }
    } catch (e) { setMsg({ t: "bad", m: String(e).slice(0, 120) }); }
    setBusy(false);
  }

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="flex items-center gap-3 mb-4">
        <div>
          <h1 className="text-xl font-bold text-[#1d1d1f]">บันทึกงานติดตั้ง</h1>
          <p className="text-sm text-[#6e6e73] mt-0.5">
            ลงงานที่ติดตั้งไปแล้วเข้าระบบ (ตาราง jobs) · ผูก serial อุปกรณ์เข้างานได้ที่หน้า “รับของเข้าสต็อก (สแกน)”
          </p>
        </div>
        <span className={`ml-auto pill pill-${configured ? "ok" : "mut"}`}>{configured ? "เชื่อมฐานข้อมูลจริง" : "ยังไม่เชื่อม DB"}</span>
      </div>

      {error && <div className="card p-3 mb-4 text-sm text-[#c0392b]">อ่านข้อมูลไม่สำเร็จ: {error}</div>}

      <div className="card p-5 mb-4">
        <button onClick={() => setOpen((o) => !o)} className="bg-[#F5821F] text-white rounded-lg px-4 py-2 text-sm font-semibold">
          {open ? "ปิดฟอร์ม" : "+ เพิ่มงานติดตั้ง"}
        </button>
        {open && (
          <div className="mt-4">
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              <div><label className="block text-[11px] text-[#6e6e73] mb-1">Job ID</label><input className={inCls} value={f.Job_ID} onChange={(e) => upd("Job_ID", e.target.value)} /></div>
              <div><label className="block text-[11px] text-[#6e6e73] mb-1">ชื่อลูกค้า *</label><input className={inCls} value={f.Customer_Name} onChange={(e) => upd("Customer_Name", e.target.value)} /></div>
              <div>
                <label className="block text-[11px] text-[#6e6e73] mb-1">ประเภทงาน</label>
                <select className={inCls} value={f.Job_Type} onChange={(e) => upd("Job_Type", e.target.value)}>
                  {JOB_TYPES.map((s) => <option key={s}>{s}</option>)}
                </select>
              </div>
              <div><label className="block text-[11px] text-[#6e6e73] mb-1">จังหวัด</label><ProvinceInput className={inCls} value={f.Province} onChange={(v) => upd("Province", v)} /></div>
              <div><label className="block text-[11px] text-[#6e6e73] mb-1">ขนาด (kWp)</label><input type="number" className={inCls} value={f.kWp} onChange={(e) => upd("kWp", e.target.value)} /></div>
              <div>
                <label className="block text-[11px] text-[#6e6e73] mb-1">เฟส</label>
                <select className={inCls} value={f.Phase} onChange={(e) => upd("Phase", e.target.value)}>
                  <option value="">เลือก…</option>{PHASES.map((s) => <option key={s}>{s}</option>)}
                </select>
              </div>
              <div><label className="block text-[11px] text-[#6e6e73] mb-1">รุ่นแผง</label><input className={inCls} value={f.Panel_Model} onChange={(e) => upd("Panel_Model", e.target.value)} /></div>
              <div><label className="block text-[11px] text-[#6e6e73] mb-1">จำนวนแผง</label><input type="number" className={inCls} value={f.Panel_Qty} onChange={(e) => upd("Panel_Qty", e.target.value)} /></div>
              <div><label className="block text-[11px] text-[#6e6e73] mb-1">รุ่นอินเวอร์เตอร์</label><input className={inCls} value={f.Inverter_Model} onChange={(e) => upd("Inverter_Model", e.target.value)} placeholder="เช่น Atmoce 10kW" /></div>
              <div>
                <label className="block text-[11px] text-[#6e6e73] mb-1">ทีมช่าง</label>
                <input className={inCls} value={f.Sub_Team} onChange={(e) => upd("Sub_Team", e.target.value)} list="team-list" placeholder="เลือก/พิมพ์ทีม" />
                <datalist id="team-list">{teamNames.map((t) => <option key={t} value={t} />)}</datalist>
              </div>
              <div><label className="block text-[11px] text-[#6e6e73] mb-1">วันที่ติดตั้งจริง</label><input type="date" className={inCls} value={f.Actual_Install_Date} onChange={(e) => upd("Actual_Install_Date", e.target.value)} /></div>
              <div><label className="block text-[11px] text-[#6e6e73] mb-1">ราคาขาย (บาท)</label><input type="number" className={inCls} value={f.Sell_Price_THB} onChange={(e) => upd("Sell_Price_THB", e.target.value)} /></div>
              <div>
                <label className="block text-[11px] text-[#6e6e73] mb-1">สถานะ PEA/ขนานไฟ</label>
                <select className={inCls} value={f.PEA_Status} onChange={(e) => upd("PEA_Status", e.target.value)}>
                  <option value="">เลือก…</option>{PEA_STATUS.map((s) => <option key={s}>{s}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-[11px] text-[#6e6e73] mb-1">สถานะส่งมอบ</label>
                <select className={inCls} value={f.Handover_Status} onChange={(e) => upd("Handover_Status", e.target.value)}>
                  <option value="">เลือก…</option>{HANDOVER_STATUS.map((s) => <option key={s}>{s}</option>)}
                </select>
              </div>
              <div className="md:col-span-3"><label className="block text-[11px] text-[#6e6e73] mb-1">หมายเหตุ</label><input className={inCls} value={f.Note} onChange={(e) => upd("Note", e.target.value)} /></div>
            </div>
            <div className="flex items-center gap-3 mt-3">
              <button onClick={submit} disabled={busy} className="bg-[#1d1d1f] text-white rounded-lg px-5 py-2 text-sm font-semibold disabled:opacity-50">{busy ? "กำลังบันทึก…" : "บันทึกงาน"}</button>
              {msg && <span className={`text-sm ${msg.t === "ok" ? "text-[#1a7d3a]" : "text-[#c0392b]"}`}>{msg.m}</span>}
              <span className="text-[11px] text-[#a1a1a6] ml-auto">Job ID ออกอัตโนมัติ · แก้ได้</span>
            </div>
            {added.length > 0 && (
              <div className="mt-4 border-t border-[#f0f0f2] pt-3">
                <div className="text-[12px] text-[#6e6e73] mb-2">เพิ่งบันทึกรอบนี้ ({added.length})</div>
                <div className="flex flex-wrap gap-2">
                  {added.map((a, i) => <span key={i} className="pill pill-ok">{a.Job_ID} · {a.Customer_Name}</span>)}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      <div className="card p-5">
        <div className="font-semibold text-[#1d1d1f] mb-3">งานติดตั้งในระบบ ({jobs.length})</div>
        <div className="overflow-x-auto">
          <table className="w-full text-[13px] min-w-[760px]">
            <thead><tr className="text-[#a1a1a6] text-[11px] text-left border-b border-[#eee]">
              <th className="py-1.5">Job ID</th><th>ลูกค้า</th><th>จังหวัด</th><th className="text-right">kWp</th><th>อินเวอร์เตอร์</th><th>ทีม</th><th>ติดตั้ง</th><th className="text-right">ราคาขาย</th><th>PEA</th>
            </tr></thead>
            <tbody>
              {jobs.map((r) => (
                <tr key={r.Job_ID || r._row} className="border-b border-[#f4f4f6]">
                  <td className="py-2 text-[#6e6e73]">{r.Job_ID}</td>
                  <td className="font-medium text-[#1d1d1f]">{r.Customer_Name}</td>
                  <td className="text-[#6e6e73]">{r.Province}</td>
                  <td className="text-right text-[#6e6e73]">{r.kWp}</td>
                  <td className="text-[#6e6e73]">{r.Inverter_Model}</td>
                  <td className="text-[#6e6e73]">{r.Sub_Team}</td>
                  <td className="text-[#6e6e73]">{String(r.Actual_Install_Date || "").slice(0, 10)}</td>
                  <td className="text-right text-[#6e6e73]">{r.Sell_Price_THB ? baht(r.Sell_Price_THB) : "—"}</td>
                  <td className="text-[#6e6e73]">{r.PEA_Status}</td>
                </tr>
              ))}
              {jobs.length === 0 && <tr><td colSpan={9} className="py-6 text-center text-[#a1a1a6]">ยังไม่มีงาน — กด “เพิ่มงานติดตั้ง” เพื่อเริ่มบันทึก</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
