"use client";
import { useState } from "react";

const SEED = [
  { id: "T-A", name: "ทีมA (ช่างเอก)", area: "กทม · สมุทรปราการ", rate: 6.0, tier: "A", contact: "081-000-1111", note: "ทีมหลัก งานเนี้ยบ" },
  { id: "T-B", name: "ทีมB (ช่างบี)", area: "ปทุมธานี · นนทบุรี", rate: 5.8, tier: "B", contact: "082-000-2222", note: "งานเร็ว" },
];

const tierTone = (t) => (t === "A" ? "ok" : t === "B" ? "warn" : "mut");

export default function SubsPage() {
  const [subs, setSubs] = useState(SEED);
  const [f, setF] = useState({ name: "", area: "", rate: 6, tier: "A", contact: "", note: "" });
  const upd = (k, v) => setF((s) => ({ ...s, [k]: v }));

  function add() {
    if (!f.name.trim()) return;
    setSubs((s) => [...s, { ...f, id: "T-" + (s.length + 1), rate: +f.rate || 0 }]);
    setF({ name: "", area: "", rate: 6, tier: "A", contact: "", note: "" });
  }

  const inCls = "w-full px-2.5 py-1.5 border border-[#d2d2d7] rounded-lg text-sm bg-white";

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-xl font-bold text-[#1d1d1f]">ซับคอนแทรค (ทีมติดตั้ง)</h1>
      <p className="text-sm text-[#6e6e73] mt-0.5 mb-4">เก็บเรตค่าติดตั้ง + tier ของแต่ละเจ้า · เวลาจ่ายงานเลือกเจ้า เรตจะเข้าต้นทุนงานอัตโนมัติ</p>

      <div className="card p-5 mb-4">
        <div className="font-semibold text-[#1d1d1f] mb-3">เพิ่มซับใหม่</div>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          <div><label className="block text-[11px] text-[#6e6e73] mb-1">ชื่อทีม/เจ้า</label><input className={inCls} value={f.name} onChange={(e) => upd("name", e.target.value)} placeholder="เช่น ทีมซี" /></div>
          <div><label className="block text-[11px] text-[#6e6e73] mb-1">พื้นที่ให้บริการ</label><input className={inCls} value={f.area} onChange={(e) => upd("area", e.target.value)} placeholder="เช่น ชลบุรี" /></div>
          <div><label className="block text-[11px] text-[#6e6e73] mb-1">เบอร์ติดต่อ</label><input className={inCls} value={f.contact} onChange={(e) => upd("contact", e.target.value)} placeholder="08x-xxx-xxxx" /></div>
          <div><label className="block text-[11px] text-[#6e6e73] mb-1">เรตค่าติดตั้ง (฿/W)</label><input type="number" step="0.1" className={inCls} value={f.rate} onChange={(e) => upd("rate", e.target.value)} /></div>
          <div><label className="block text-[11px] text-[#6e6e73] mb-1">Tier</label><select className={inCls} value={f.tier} onChange={(e) => upd("tier", e.target.value)}><option value="A">A</option><option value="B">B</option><option value="C">C</option></select></div>
          <div><label className="block text-[11px] text-[#6e6e73] mb-1">หมายเหตุ</label><input className={inCls} value={f.note} onChange={(e) => upd("note", e.target.value)} /></div>
        </div>
        <button onClick={add} className="mt-3 bg-[#1a3c6e] text-white rounded-lg px-5 py-2 text-sm font-semibold">+ เพิ่มซับ</button>
      </div>

      <div className="card p-5">
        <div className="font-semibold text-[#1d1d1f] mb-3">รายชื่อซับ ({subs.length})</div>
        <table className="w-full text-sm">
          <thead><tr className="text-[#a1a1a6] text-xs border-b border-[#eee]">
            <th className="text-left py-1.5">ชื่อ</th><th className="text-left">พื้นที่</th><th className="text-left">ติดต่อ</th><th className="text-right">เรต ฿/W</th><th className="text-center">Tier</th>
          </tr></thead>
          <tbody>
            {subs.map((s) => (
              <tr key={s.id} className="border-b border-[#f4f4f6]">
                <td className="py-2">{s.name}{s.note && <div className="text-[11px] text-[#a1a1a6]">{s.note}</div>}</td>
                <td className="text-[#6e6e73]">{s.area}</td>
                <td className="text-[#6e6e73]">{s.contact}</td>
                <td className="text-right">{Number(s.rate).toFixed(1)}</td>
                <td className="text-center"><span className={`pill pill-${tierTone(s.tier)}`}>{s.tier}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p className="text-[11px] text-[#a1a1a6] mt-4">* เฟสถัดไป: เก็บลง Google Sheets แท็บ Sub_Teams + ผูก KPI/Scorecard + เลือกซับตอนจ่ายงานในหน้าโครงการ</p>
    </div>
  );
}
