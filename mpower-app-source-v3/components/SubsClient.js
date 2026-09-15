"use client";
import { useState } from "react";

const inCls = "w-full px-2.5 py-1.5 border border-[#d2d2d7] rounded-lg text-sm bg-white";
const GRADES = ["A", "B", "C"];
const tierTone = (t) => (t === "A" ? "ok" : t === "B" ? "warn" : "mut");

function nextId(teams) {
  let max = 0;
  teams.forEach((t) => { const m = /T-?(\d+)/.exec(t.Team_ID || ""); if (m && +m[1] > max) max = +m[1]; });
  return "T-" + String(max + 1).padStart(2, "0");
}

export default function SubsClient({ teams: initial = [], configured, error }) {
  const [teams, setTeams] = useState(initial);
  const [f, setF] = useState({ Team_Name: "", Lead_Name: "", Contact: "", Rate_THB_per_W: "6", Grade: "A", User_Email: "", Note: "" });
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState(null);
  const [editId, setEditId] = useState("");
  const [editVal, setEditVal] = useState("");
  const upd = (k, v) => setF((s) => ({ ...s, [k]: v }));

  async function add() {
    if (!f.Team_Name.trim()) { setMsg({ t: "bad", m: "ใส่ชื่อทีมก่อน" }); return; }
    setBusy(true); setMsg(null);
    const obj = { ...f, Team_ID: nextId(teams), Active: "yes" };
    try {
      const res = await fetch("/api/sheets", { method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "append", tab: "Sub_Teams", obj, idField: "Team_ID", required: ["Team_Name"] }) });
      const d = await res.json();
      if (d.ok) { setTeams((s) => [...s, d.row || obj]); setF({ Team_Name: "", Lead_Name: "", Contact: "", Rate_THB_per_W: "6", Grade: "A", User_Email: "", Note: "" }); setMsg({ t: "ok", m: "เพิ่มทีมแล้ว" }); }
      else setMsg({ t: "bad", m: d.error || "เพิ่มไม่สำเร็จ" });
    } catch (e) { setMsg({ t: "bad", m: String(e).slice(0, 120) }); }
    setBusy(false);
  }

  async function saveEmail(team) {
    setBusy(true); setMsg(null);
    try {
      const res = await fetch("/api/sheets", { method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "update", tab: "Sub_Teams", idField: "Team_ID", idValue: team.Team_ID, patch: { User_Email: editVal } }) });
      const d = await res.json();
      if (d.ok) { setTeams((s) => s.map((x) => (x.Team_ID === team.Team_ID ? { ...x, User_Email: editVal } : x))); setEditId(""); setMsg({ t: "ok", m: `ผูกอีเมลทีม ${team.Team_ID} แล้ว` }); }
      else setMsg({ t: "bad", m: d.error || "บันทึกไม่สำเร็จ" });
    } catch (e) { setMsg({ t: "bad", m: String(e).slice(0, 120) }); }
    setBusy(false);
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="flex items-center gap-3 mb-1">
        <h1 className="text-xl font-bold text-[#1d1d1f]">ซับคอนแทรค (ทีมติดตั้ง)</h1>
        <span className={`ml-auto pill pill-${configured ? "ok" : "mut"}`}>{configured ? "เชื่อมฐานข้อมูลจริง" : "ยังไม่เชื่อม DB"}</span>
      </div>
      <p className="text-sm text-[#6e6e73] mb-4">เก็บเรตค่าติดตั้ง + tier · <b>ผูกอีเมลช่าง</b> เพื่อให้เข้าพอร์ทัลเห็นเฉพาะงานของทีมตัวเอง</p>

      {error && <div className="card p-3 mb-4 text-sm text-[#c0392b]">อ่านข้อมูลไม่สำเร็จ: {error}</div>}

      <div className="card p-5 mb-4">
        <div className="font-semibold text-[#1d1d1f] mb-3">เพิ่มทีมใหม่</div>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          <div><label className="block text-[11px] text-[#6e6e73] mb-1">ชื่อทีม *</label><input className={inCls} value={f.Team_Name} onChange={(e) => upd("Team_Name", e.target.value)} /></div>
          <div><label className="block text-[11px] text-[#6e6e73] mb-1">หัวหน้าทีม</label><input className={inCls} value={f.Lead_Name} onChange={(e) => upd("Lead_Name", e.target.value)} /></div>
          <div><label className="block text-[11px] text-[#6e6e73] mb-1">ติดต่อ</label><input className={inCls} value={f.Contact} onChange={(e) => upd("Contact", e.target.value)} /></div>
          <div><label className="block text-[11px] text-[#6e6e73] mb-1">เรต (บาท/วัตต์)</label><input type="number" className={inCls} value={f.Rate_THB_per_W} onChange={(e) => upd("Rate_THB_per_W", e.target.value)} /></div>
          <div>
            <label className="block text-[11px] text-[#6e6e73] mb-1">Grade</label>
            <select className={inCls} value={f.Grade} onChange={(e) => upd("Grade", e.target.value)}>{GRADES.map((g) => <option key={g}>{g}</option>)}</select>
          </div>
          <div><label className="block text-[11px] text-[#6e6e73] mb-1">อีเมลช่าง (สำหรับพอร์ทัล)</label><input className={inCls} value={f.User_Email} onChange={(e) => upd("User_Email", e.target.value)} placeholder="chang@mpower.co" /></div>
          <div className="md:col-span-3"><label className="block text-[11px] text-[#6e6e73] mb-1">หมายเหตุ</label><input className={inCls} value={f.Note} onChange={(e) => upd("Note", e.target.value)} /></div>
        </div>
        <div className="flex items-center gap-3 mt-3">
          <button onClick={add} disabled={busy} className="bg-[#F5821F] text-white rounded-lg px-5 py-2 text-sm font-semibold disabled:opacity-50">{busy ? "กำลังบันทึก…" : "+ เพิ่มทีม"}</button>
          {msg && <span className={`text-sm ${msg.t === "ok" ? "text-[#1a7d3a]" : "text-[#c0392b]"}`}>{msg.m}</span>}
        </div>
      </div>

      <div className="card p-5">
        <div className="font-semibold text-[#1d1d1f] mb-3">ทีมในระบบ ({teams.length})</div>
        <div className="overflow-x-auto">
          <table className="w-full text-[13px] min-w-[720px]">
            <thead><tr className="text-[#a1a1a6] text-[11px] text-left border-b border-[#eee]">
              <th className="py-1.5">รหัส</th><th>ทีม</th><th>หัวหน้า</th><th>ติดต่อ</th><th className="text-right">เรต</th><th>Grade</th><th>อีเมลช่าง (พอร์ทัล)</th>
            </tr></thead>
            <tbody>
              {teams.map((t) => (
                <tr key={t.Team_ID} className="border-b border-[#f4f4f6]">
                  <td className="py-2 text-[#6e6e73] font-mono">{t.Team_ID}</td>
                  <td className="font-medium text-[#1d1d1f]">{t.Team_Name}</td>
                  <td className="text-[#6e6e73]">{t.Lead_Name}</td>
                  <td className="text-[#6e6e73]">{t.Contact}</td>
                  <td className="text-right text-[#6e6e73]">{t.Rate_THB_per_W}</td>
                  <td><span className={`pill pill-${tierTone(t.Grade)}`}>{t.Grade || "-"}</span></td>
                  <td>
                    {editId === t.Team_ID ? (
                      <div className="flex gap-1">
                        <input className="px-2 py-1 border border-[#d2d2d7] rounded text-[12px] w-40" value={editVal} onChange={(e) => setEditVal(e.target.value)} placeholder="อีเมล" />
                        <button onClick={() => saveEmail(t)} disabled={busy} className="text-[12px] bg-[#1a7d3a] text-white rounded px-2">✓</button>
                        <button onClick={() => setEditId("")} className="text-[12px] text-[#6e6e73] px-1">✕</button>
                      </div>
                    ) : (
                      <button onClick={() => { setEditId(t.Team_ID); setEditVal(t.User_Email || ""); }} className="text-left">
                        {t.User_Email ? <span className="text-[#1a7d3a]">{t.User_Email}</span> : <span className="text-[#F5821F] underline">+ ผูกอีเมล</span>}
                      </button>
                    )}
                  </td>
                </tr>
              ))}
              {teams.length === 0 && <tr><td colSpan={7} className="py-6 text-center text-[#a1a1a6]">ยังไม่มีทีม — เพิ่มด้านบน</td></tr>}
            </tbody>
          </table>
        </div>
        <p className="text-[11px] text-[#a1a1a6] mt-3">* อีเมลช่างต้องตรงกับบัญชีที่ช่างสมัคร/แอดมินสร้างใน Supabase Auth แล้วช่างจะเห็นเฉพาะงานที่ Sub_Team = ทีมนี้</p>
      </div>
    </div>
  );
}
