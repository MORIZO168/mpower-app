"use client";
import { useState } from "react";
import Link from "next/link";
import { DEALS, STAGES, FUNNEL, money, pendingApprovals, upcomingInstalls, installStatus, brief } from "@/lib/pipeline";

const WD = ["อา", "จ", "อ", "พ", "พฤ", "ศ", "ส"];
function relDay(dstr) {
  const d = new Date(dstr + "T00:00:00");
  const now = new Date(); now.setHours(0, 0, 0, 0);
  const diff = Math.round((d - now) / 86400000);
  const tag = diff === 0 ? "วันนี้" : diff === 1 ? "พรุ่งนี้" : diff < 0 ? `เลยมา ${-diff} วัน` : `อีก ${diff} วัน`;
  return { tag, wd: WD[d.getDay()], overdue: diff < 0 };
}

export default function Dashboard() {
  const [approvals, setApprovals] = useState(pendingApprovals());
  const [half, setHalf] = useState(new Date().getHours() < 14 ? "เช้า" : "เย็น");
  const items = brief();
  const installs = upcomingInstalls();

  function act(id, decision) {
    setApprovals((s) => s.filter((d) => d.id !== id));
  }

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="flex items-center gap-3 mb-4">
        <div>
          <h1 className="text-xl font-bold text-[#1d1d1f]">ภาพรวม</h1>
          <p className="text-sm text-[#6e6e73] mt-0.5">มอนิเตอร์งาน · ตารางติดตั้ง · รายการรออนุมัติ</p>
        </div>
        <span className="ml-auto pill pill-mut">ข้อมูลตัวอย่าง · ยังไม่ต่อ Google Sheets</span>
      </div>

      {/* AI brief */}
      <div className="card p-5 mb-5" style={{ background: "linear-gradient(180deg,#fffaf4,#ffffff)" }}>
        <div className="flex items-center gap-2 mb-3">
          <span className="w-7 h-7 rounded-lg bg-[#F5821F] text-white flex items-center justify-center text-sm font-bold">AI</span>
          <div className="font-semibold text-[#1d1d1f]">สรุปรอบ{half} — ผู้ช่วย M Power</div>
          <div className="ml-auto flex gap-1 p-0.5 bg-[#f0f0f2] rounded-lg">
            {["เช้า", "เย็น"].map((h) => (
              <button key={h} onClick={() => setHalf(h)} className={`px-3 py-1 rounded-md text-xs font-medium ${half === h ? "bg-white text-[#1d1d1f] shadow-sm" : "text-[#6e6e73]"}`}>{h}</button>
            ))}
          </div>
        </div>
        <div className="space-y-2">
          {items.map((it, i) => (
            <div key={i} className="flex items-center gap-2.5 text-sm">
              <span className={`w-2 h-2 rounded-full ${it.tone === "bad" ? "bg-[#c0392b]" : it.tone === "warn" ? "bg-[#F5821F]" : "bg-[#1a7d3a]"}`} />
              <span className="text-[#1d1d1f]">{it.text}</span>
              {it.href && <a href={it.href} className="text-[11px] text-[#F5821F] font-medium ml-auto">ดู →</a>}
            </div>
          ))}
        </div>
        <div className="text-[11px] text-[#a1a1a6] mt-3">* เฟสจริง: ตั้ง scheduled task ให้สรุปนี้เด้งทุกเช้า 08:00 + เย็น 17:00 และเตือน real-time เมื่อมีคำขออนุมัติ</div>
      </div>

      {/* KPI */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
        {[
          ["ดีลที่กำลังทำ", DEALS.length, "mut"],
          ["รออนุมัติจากคุณ", approvals.length, approvals.length ? "bad" : "ok"],
          ["คิวติดตั้ง", installs.length, "ok"],
          ["มูลค่ารวมในไปป์", money(DEALS.reduce((a, d) => a + d.value, 0)), "mut"],
        ].map(([lab, val, tone]) => (
          <div key={lab} className="card p-4">
            <div className={`text-2xl font-bold ${tone === "bad" ? "text-[#c0392b]" : tone === "ok" ? "text-[#1a7d3a]" : "text-[#1d1d1f]"}`}>{val}</div>
            <div className="text-xs text-[#6e6e73] mt-0.5">{lab}</div>
          </div>
        ))}
      </div>

      {/* รออนุมัติ */}
      <div id="approvals" className="card p-5 mb-5">
        <div className="font-semibold text-[#1d1d1f] mb-1">รออนุมัติจากคุณ ({approvals.length})</div>
        <p className="text-xs text-[#a1a1a6] mb-3">กดเสนอที่กำไรต่ำกว่าเกณฑ์ หรือขอส่วนลดพิเศษ ต้องให้คุณอนุมัติก่อน</p>
        {approvals.length === 0 ? (
          <div className="text-sm text-[#6e6e73] py-3 text-center">ไม่มีรายการค้าง ✓</div>
        ) : (
          <div className="space-y-2">
            {approvals.map((d) => (
              <div key={d.id} className="flex flex-col sm:flex-row sm:items-center gap-3 rounded-xl border border-[#f0e0d0] bg-[#fffaf4] p-3">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-semibold text-[#1d1d1f]">{d.customer}</span>
                    <span className="pill pill-warn">{d.approval.type === "discount" ? "ขอส่วนลด " + money(d.approval.amount) : "ขอกำไร " + d.approval.amount + "%"}</span>
                    <span className="text-[11px] text-[#a1a1a6]">· {d.id} · {d.kwp} kWp · {money(d.value)}</span>
                  </div>
                  <div className="text-[13px] text-[#6e6e73] mt-0.5">โดย {d.approval.by} — “{d.approval.reason}”</div>
                </div>
                <div className="flex gap-2 shrink-0">
                  <button onClick={() => act(d.id, "ok")} className="bg-[#1a7d3a] text-white rounded-lg px-4 py-1.5 text-sm font-semibold">อนุมัติ</button>
                  <button onClick={() => act(d.id, "no")} className="bg-white border border-[#e2e2e7] text-[#c0392b] rounded-lg px-4 py-1.5 text-sm font-semibold">ปฏิเสธ</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ตารางงาน / schedule */}
      <div id="schedule" className="card p-5 mb-5">
        <div className="flex items-center mb-3">
          <div className="font-semibold text-[#1d1d1f]">ตารางงานติดตั้ง</div>
          <div className="ml-auto text-xs text-[#a1a1a6]">นัดวันติดตั้งต้องยืนยัน 3 ฝ่าย: ลูกค้า → ช่าง → เราอนุมัติ</div>
        </div>
        <div className="space-y-2">
          {installs.map((d) => {
            const st = installStatus(d.install);
            const rd = relDay(d.install.date);
            return (
              <div key={d.id} className="flex items-center gap-3 rounded-xl border border-[#eceef2] p-3">
                <div className={`w-14 shrink-0 text-center rounded-lg py-1.5 ${rd.overdue ? "bg-[#fdecea]" : "bg-[#f5f5f7]"}`}>
                  <div className="text-[10px] text-[#a1a1a6]">{rd.wd}</div>
                  <div className="text-sm font-bold text-[#1d1d1f]">{d.install.date.slice(8)}</div>
                  <div className="text-[9px] text-[#a1a1a6]">{d.install.date.slice(5, 7)}</div>
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-semibold text-[#1d1d1f]">{d.customer}</span>
                    <span className="text-[11px] text-[#a1a1a6]">· {d.kwp} kWp · {d.inverter}{d.battery ? " · แบต " + d.battery + "kWh" : ""}</span>
                    <span className={`ml-auto text-[11px] ${rd.overdue ? "text-[#c0392b] font-semibold" : "text-[#6e6e73]"}`}>{rd.tag}</span>
                  </div>
                  <div className="flex items-center gap-2 mt-1 flex-wrap">
                    <span className="text-[11px] text-[#6e6e73]">👷 {d.install.team}</span>
                    <span className={`pill pill-${st.tone}`}>{st.label}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* funnel + pipeline */}
      <div className="grid md:grid-cols-2 gap-4">
        <div className="card p-5">
          <div className="font-semibold text-[#1d1d1f] mb-3">Pipeline (จำนวนงานต่อขั้น)</div>
          <div className="space-y-1.5">
            {STAGES.map((s) => {
              const n = FUNNEL[s] || 0;
              const mx = Math.max(...Object.values(FUNNEL));
              return (
                <div key={s} className="flex items-center gap-3">
                  <span className="w-20 text-[12px] text-[#6e6e73] shrink-0">{s}</span>
                  <div className="flex-1 h-2 rounded-full bg-[#f0f0f2] overflow-hidden"><div className="h-full bg-[#F5821F]" style={{ width: (n / mx) * 100 + "%" }} /></div>
                  <span className="w-8 text-right text-sm font-semibold text-[#1d1d1f]">{n}</span>
                </div>
              );
            })}
          </div>
        </div>

        <div className="card p-5">
          <div className="flex items-center mb-3">
            <div className="font-semibold text-[#1d1d1f]">ดีลล่าสุด</div>
            <Link href="/projects" className="ml-auto text-sm text-[#F5821F] font-semibold">โครงการทั้งหมด →</Link>
          </div>
          <div className="space-y-2">
            {DEALS.slice(0, 5).map((d) => (
              <div key={d.id} className="flex items-center gap-2 text-sm">
                <span className="w-2 h-2 rounded-full bg-[#F5821F] shrink-0" />
                <span className="text-[#1d1d1f] truncate">{d.customer}</span>
                <span className="text-[11px] text-[#a1a1a6] ml-auto shrink-0">{d.stage}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
