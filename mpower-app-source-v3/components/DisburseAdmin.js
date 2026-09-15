"use client";
import { useState } from "react";

const baht = (n) => "฿" + Number(n || 0).toLocaleString("th-TH");
const FILTERS = ["รออนุมัติ", "อนุมัติ", "ปฏิเสธ", "ทั้งหมด"];

function badge(s) {
  if (s === "อนุมัติ") return "bg-[#eaf7ee] text-[#1a7d3a]";
  if (s === "ปฏิเสธ") return "bg-[#fdecec] text-[#c0392b]";
  return "bg-[#fff5ec] text-[#F5821F]";
}

export default function DisburseAdmin({ rows: initial = [], configured, error }) {
  const [rows, setRows] = useState(initial);
  const [filter, setFilter] = useState("รออนุมัติ");
  const [busy, setBusy] = useState("");
  const [msg, setMsg] = useState("");

  const pending = rows.filter((r) => (r.Status || "รออนุมัติ") === "รออนุมัติ");
  const pendingSum = pending.reduce((s, r) => s + Number(r.Amount || 0), 0);
  const view = filter === "ทั้งหมด" ? rows : rows.filter((r) => (r.Status || "รออนุมัติ") === filter);

  async function decide(r, status) {
    setBusy(r.ID); setMsg("");
    try {
      const res = await fetch("/api/sheets", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "update", tab: "Disbursement_Requests", idField: "ID", idValue: r.ID,
          patch: { Status: status, Approved_By: "office", Approved_At: new Date().toISOString() },
        }),
      });
      const d = await res.json();
      if (d.ok) {
        setRows((rs) => rs.map((x) => (x.ID === r.ID ? { ...x, Status: status } : x)));
      } else setMsg(d.error || "อัปเดตไม่สำเร็จ");
    } catch (e) { setMsg(String(e).slice(0, 120)); }
    setBusy("");
  }

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="flex items-center gap-3 mb-4">
        <div>
          <h1 className="text-xl font-bold text-[#1d1d1f]">อนุมัติเบิก — ช่างซับ</h1>
          <p className="text-sm text-[#6e6e73] mt-0.5">คำขอเบิกเงินจากช่างในพอร์ทัล · ตรวจรูปติดตั้งก่อนอนุมัติ</p>
        </div>
        <span className={`ml-auto pill pill-${configured ? "ok" : "mut"}`}>{configured ? "เชื่อมฐานข้อมูลจริง" : "ยังไม่เชื่อม DB"}</span>
      </div>

      {error && <div className="card p-3 mb-4 text-sm text-[#c0392b]">อ่านข้อมูลไม่สำเร็จ: {error}</div>}
      {msg && <div className="card p-3 mb-4 text-sm text-[#c0392b]">{msg}</div>}

      <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-4">
        <div className="card p-4"><div className="text-2xl font-bold text-[#F5821F]">{pending.length}</div><div className="text-xs text-[#6e6e73] mt-0.5">คำขอรออนุมัติ</div></div>
        <div className="card p-4"><div className="text-2xl font-bold text-[#1d1d1f]">{baht(pendingSum)}</div><div className="text-xs text-[#6e6e73] mt-0.5">ยอดรออนุมัติรวม</div></div>
        <div className="card p-4"><div className="text-2xl font-bold text-[#1a7d3a]">{rows.filter((r) => r.Status === "อนุมัติ").length}</div><div className="text-xs text-[#6e6e73] mt-0.5">อนุมัติแล้ว</div></div>
      </div>

      <div className="flex gap-2 mb-3">
        {FILTERS.map((f) => (
          <button key={f} onClick={() => setFilter(f)}
            className={`text-[13px] px-3 py-1.5 rounded-lg border ${filter === f ? "bg-[#1d1d1f] text-white border-[#1d1d1f]" : "bg-white text-[#6e6e73] border-[#d2d2d7]"}`}>
            {f}
          </button>
        ))}
      </div>

      <div className="card p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-[13px] min-w-[720px]">
            <thead><tr className="text-[#a1a1a6] text-[11px] text-left border-b border-[#eee] bg-[#fafafa]">
              <th className="py-2 px-3">งาน / ลูกค้า</th><th>ทีม</th><th className="text-right">จำนวน</th><th>หมายเหตุ</th><th className="text-center">รูป</th><th>สถานะ</th><th className="text-right px-3">จัดการ</th>
            </tr></thead>
            <tbody>
              {view.map((r) => {
                const st = r.Status || "รออนุมัติ";
                return (
                  <tr key={r.ID} className="border-b border-[#f4f4f6]">
                    <td className="py-2.5 px-3">
                      <div className="font-medium text-[#1d1d1f]">{r.customer || "—"}</div>
                      <div className="text-[11px] text-[#a1a1a6] font-mono">{r.Job_ID}</div>
                    </td>
                    <td className="text-[#6e6e73]">{r.Sub_Team || "—"}</td>
                    <td className="text-right font-semibold text-[#1d1d1f]">{baht(r.Amount)}</td>
                    <td className="text-[#6e6e73] max-w-[180px] truncate">{r.Note}</td>
                    <td className="text-center text-[#6e6e73]">{r.photos}</td>
                    <td><span className={`text-[11px] px-2 py-0.5 rounded-full ${badge(st)}`}>{st}</span></td>
                    <td className="text-right px-3">
                      {st === "รออนุมัติ" ? (
                        <div className="flex gap-1.5 justify-end">
                          <button disabled={busy === r.ID} onClick={() => decide(r, "อนุมัติ")}
                            className="text-[12px] bg-[#1a7d3a] text-white rounded-lg px-2.5 py-1 disabled:opacity-50">อนุมัติ</button>
                          <button disabled={busy === r.ID} onClick={() => decide(r, "ปฏิเสธ")}
                            className="text-[12px] bg-white text-[#c0392b] border border-[#e6b0b0] rounded-lg px-2.5 py-1 disabled:opacity-50">ปฏิเสธ</button>
                        </div>
                      ) : <span className="text-[11px] text-[#a1a1a6]">—</span>}
                    </td>
                  </tr>
                );
              })}
              {view.length === 0 && <tr><td colSpan={7} className="py-8 text-center text-[#a1a1a6]">ไม่มีรายการ</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
      <p className="text-[11px] text-[#a1a1a6] mt-3">* ช่างส่งคำขอผ่านพอร์ทัล /portal · จำนวนรูป = รูปติดตั้งที่ช่างอัปโหลดของงานนั้น</p>
    </div>
  );
}
