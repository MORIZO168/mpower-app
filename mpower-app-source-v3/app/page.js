"use client";
import { useState } from "react";
import Link from "next/link";
import { DEALS, STAGES, FUNNEL, money, pendingApprovals, upcomingInstalls, installStatus, brief } from "@/lib/pipeline";

const WD = ["อา", "จ", "อ", "พ", "พฤ", "ศ", "ส"];
const MONTH_TH = ["มกราคม", "กุมภาพันธ์", "มีนาคม", "เมษายน", "พฤษภาคม", "มิถุนายน", "กรกฎาคม", "สิงหาคม", "กันยายน", "ตุลาคม", "พฤศจิกายน", "ธันวาคม"];
const pad = (n) => String(n).padStart(2, "0");
const todayStr = () => { const d = new Date(); return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`; };

export default function Dashboard() {
  const [approvals, setApprovals] = useState(pendingApprovals());
  const [half, setHalf] = useState(new Date().getHours() < 14 ? "เช้า" : "เย็น");
  const items = brief();
  const installs = upcomingInstalls();

  const jobsByDate = {};
  installs.forEach((d) => { (jobsByDate[d.install.date] = jobsByDate[d.install.date] || []).push(d); });

  const first = installs[0]?.install.date || todayStr();
  const [ym, setYm] = useState({ y: +first.slice(0, 4), m: +first.slice(5, 7) - 1 });
  const [sel, setSel] = useState(first);

  const startWd = new Date(ym.y, ym.m, 1).getDay();
  const daysIn = new Date(ym.y, ym.m + 1, 0).getDate();
  const cells = [];
  for (let i = 0; i < startWd; i++) cells.push(null);
  for (let d = 1; d <= daysIn; d++) cells.push(d);
  const dstr = (d) => `${ym.y}-${pad(ym.m + 1)}-${pad(d)}`;
  const shift = (n) => { let m = ym.m + n, y = ym.y; if (m < 0) { m = 11; y--; } if (m > 11) { m = 0; y++; } setYm({ y, m }); };

  const selJobs = jobsByDate[sel] || [];
  const today = todayStr();

  function act(id) { setApprovals((s) => s.filter((d) => d.id !== id)); }

  return (
    <div className="p-4 md:p-6 max-w-7xl mx-auto">
      <div className="flex items-center gap-3 mb-4">
        <div>
          <h1 className="text-xl font-bold text-[#1d1d1f]">ภาพรวม</h1>
          <p className="text-sm text-[#6e6e73] mt-0.5">ปฏิทินงานติดตั้ง · รายการรออนุมัติ · สถานะโครงการ</p>
        </div>
        <span className="ml-auto pill pill-mut">ข้อมูลตัวอย่าง</span>
      </div>

      <div className="card p-4 mb-4" style={{ background: "linear-gradient(180deg,#fffaf4,#ffffff)" }}>
        <div className="flex items-center gap-2 mb-2">
          <span className="w-6 h-6 rounded-lg bg-[#F5821F] text-white flex items-center justify-center text-xs font-bold">AI</span>
          <div className="font-semibold text-[#1d1d1f] text-sm">สรุปรอบ{half}</div>
          <div className="ml-auto flex gap-1 p-0.5 bg-[#f0f0f2] rounded-lg">
            {["เช้า", "เย็น"].map((h) => (<button key={h} onClick={() => setHalf(h)} className={`px-2.5 py-0.5 rounded-md text-xs font-medium ${half === h ? "bg-white text-[#1d1d1f] shadow-sm" : "text-[#6e6e73]"}`}>{h}</button>))}
          </div>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-x-5 gap-y-1.5">
          {items.map((it, i) => (
            <div key={i} className="flex items-center gap-2 text-[13px]">
              <span className={`w-2 h-2 rounded-full shrink-0 ${it.tone === "bad" ? "bg-[#c0392b]" : it.tone === "warn" ? "bg-[#F5821F]" : "bg-[#1a7d3a]"}`} />
              <span className="text-[#1d1d1f]">{it.text}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
        {[
          ["ดีลที่กำลังทำ", DEALS.length, "mut"],
          ["รออนุมัติจากคุณ", approvals.length, approvals.length ? "bad" : "ok"],
          ["คิวติดตั้ง", installs.length, "ok"],
          ["มูลค่ารวมในไปป์", money(DEALS.reduce((a, d) => a + d.value, 0)), "mut"],
        ].map(([lab, val, tone]) => (
          <div key={lab} className="card p-3.5">
            <div className={`text-xl md:text-2xl font-bold ${tone === "bad" ? "text-[#c0392b]" : tone === "ok" ? "text-[#1a7d3a]" : "text-[#1d1d1f]"}`}>{val}</div>
            <div className="text-xs text-[#6e6e73] mt-0.5">{lab}</div>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-4 mb-4">
        <div className="lg:col-span-2 card p-5">
          <div className="flex items-center mb-3">
            <div className="font-semibold text-[#1d1d1f]">ปฏิทินงานติดตั้ง</div>
            <div className="ml-auto flex items-center gap-2">
              <button onClick={() => shift(-1)} className="w-7 h-7 rounded-lg border border-[#e2e2e7] text-[#6e6e73] hover:bg-[#f5f5f7]">‹</button>
              <span className="text-sm font-medium text-[#1d1d1f] w-32 text-center">{MONTH_TH[ym.m]} {ym.y + 543}</span>
              <button onClick={() => shift(1)} className="w-7 h-7 rounded-lg border border-[#e2e2e7] text-[#6e6e73] hover:bg-[#f5f5f7]">›</button>
            </div>
          </div>
          <div className="grid grid-cols-7 gap-1 text-center text-[11px] text-[#a1a1a6] mb-1">
            {WD.map((w) => <div key={w} className="py-1">{w}</div>)}
          </div>
          <div className="grid grid-cols-7 gap-1">
            {cells.map((d, i) => {
              if (!d) return <div key={i} />;
              const ds = dstr(d);
              const jobs = jobsByDate[ds] || [];
              const isSel = ds === sel;
              const isToday = ds === today;
              return (
                <button key={i} onClick={() => setSel(ds)}
                  className={`aspect-square rounded-lg border p-1 flex flex-col items-center justify-start transition-colors ${isSel ? "border-[#F5821F] bg-[#fff5ec]" : jobs.length ? "border-[#ffe4cc] bg-[#fffaf4] hover:bg-[#fff5ec]" : "border-[#f0f0f2] bg-white hover:bg-[#f5f5f7]"}`}>
                  <span className={`text-[12px] ${isToday ? "w-5 h-5 rounded-full bg-[#1d1d1f] text-white flex items-center justify-center" : "text-[#1d1d1f]"}`}>{d}</span>
                  {jobs.length > 0 && (
                    <div className="mt-auto flex gap-0.5 flex-wrap justify-center pb-0.5">
                      {jobs.slice(0, 3).map((j, k) => <span key={k} className="w-1.5 h-1.5 rounded-full" style={{ background: installStatus(j.install).tone === "ok" ? "#1a7d3a" : installStatus(j.install).tone === "bad" ? "#c0392b" : "#F5821F" }} />)}
                    </div>
                  )}
                </button>
              );
            })}
          </div>
          <div className="flex items-center gap-4 mt-3 text-[11px] text-[#a1a1a6]">
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-[#1a7d3a]" /> ครบ 3 ฝ่าย</span>
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-[#F5821F]" /> รอยืนยัน</span>
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-[#c0392b]" /> รอเราอนุมัติ</span>
          </div>
        </div>

        <div id="approvals" className="card p-5">
          <div className="font-semibold text-[#1d1d1f] mb-1">รออนุมัติจากคุณ ({approvals.length})</div>
          <p className="text-[11px] text-[#a1a1a6] mb-3">ส่วนลด/กำไรต่ำกว่าเกณฑ์</p>
          {approvals.length === 0 ? (
            <div className="text-sm text-[#6e6e73] py-6 text-center">ไม่มีค้าง ✓</div>
          ) : (
            <div className="space-y-2">
              {approvals.map((d) => (
                <div key={d.id} className="rounded-xl border border-[#f0e0d0] bg-[#fffaf4] p-3">
                  <div className="text-sm font-semibold text-[#1d1d1f]">{d.customer}</div>
                  <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                    <span className="pill pill-warn">{d.approval.type === "discount" ? "ส่วนลด " + money(d.approval.amount) : "กำไร " + d.approval.amount + "%"}</span>
                    <span className="text-[11px] text-[#a1a1a6]">{money(d.value)}</span>
                  </div>
                  <div className="text-[11px] text-[#6e6e73] mt-1">โดย {d.approval.by}</div>
                  <div className="flex gap-2 mt-2">
                    <button onClick={() => act(d.id)} className="flex-1 bg-[#1a7d3a] text-white rounded-lg py-1.5 text-xs font-semibold">อนุมัติ</button>
                    <button onClick={() => act(d.id)} className="flex-1 bg-white border border-[#e2e2e7] text-[#c0392b] rounded-lg py-1.5 text-xs font-semibold">ปฏิเสธ</button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 card p-5">
          <div className="font-semibold text-[#1d1d1f] mb-3">งานวันที่ {(+sel.slice(8)) + " " + MONTH_TH[+sel.slice(5, 7) - 1]}</div>
          {selJobs.length === 0 ? (
            <div className="text-sm text-[#6e6e73] py-6 text-center">ไม่มีงานติดตั้งในวันนี้ — เลือกวันที่มีจุดในปฏิทิน</div>
          ) : (
            <div className="space-y-2">
              {selJobs.map((d) => {
                const st = installStatus(d.install);
                return (
                  <Link key={d.id} href="/workorder" className="flex items-center gap-3 rounded-xl border border-[#eceef2] p-3 hover:bg-[#f5f5f7]">
                    <div className="w-1.5 self-stretch rounded-full" style={{ background: st.tone === "ok" ? "#1a7d3a" : st.tone === "bad" ? "#c0392b" : "#F5821F" }} />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-semibold text-[#1d1d1f]">{d.customer}</span>
                        <span className="text-[11px] text-[#a1a1a6]">{d.kwp} kWp · {d.inverter}{d.battery ? " · แบต " + d.battery + "kWh" : ""}</span>
                        <span className={`ml-auto pill pill-${st.tone}`}>{st.label}</span>
                      </div>
                      <div className="text-[11px] text-[#6e6e73] mt-1">👷 {d.install.team} · 📍 {d.area} · {d.nextAction}</div>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </div>

        <div className="card p-5">
          <div className="flex items-center mb-3">
            <div className="font-semibold text-[#1d1d1f]">ภาพรวมโครงการ</div>
            <Link href="/projects" className="ml-auto text-xs text-[#F5821F] font-semibold">ทั้งหมด →</Link>
          </div>
          <div className="space-y-1">
            {STAGES.map((s) => {
              const n = FUNNEL[s] || 0;
              const mx = Math.max(...Object.values(FUNNEL));
              return (
                <div key={s} className="flex items-center gap-2">
                  <span className="w-16 text-[11px] text-[#6e6e73] shrink-0 truncate">{s}</span>
                  <div className="flex-1 h-1.5 rounded-full bg-[#f0f0f2] overflow-hidden"><div className="h-full bg-[#F5821F]" style={{ width: (n / mx) * 100 + "%" }} /></div>
                  <span className="w-6 text-right text-[12px] font-semibold text-[#1d1d1f]">{n}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
