"use client";
import { useState } from "react";
import Link from "next/link";
import { JOBS, PIPELINE_STAGES, pricing, baht } from "@/lib/data";

// board columns (หลัง booking)
const COLS = ["ออกแบบ", "ใบเสนอ", "รอติดตั้ง", "เบิกของ", "ติดตั้ง", "หลังการขาย"];

// ขั้นตอน → หน้าที่ใช้ตรวจ/ทำงานต่อ
const STAGE_LINK = {
  "A-Card": { href: "/leads", label: "เปิดหน้า A-Card" },
  "สำรวจ": { href: "/survey", label: "เปิดหน้าสำรวจ" },
  "ออกแบบ": { href: "/design", label: "เปิดหน้าออกแบบหลังคา" },
  "ใบเสนอ": { href: "/quote", label: "เปิดใบเสนอ / BOQ" },
  "รอติดตั้ง": { href: "/workorder", label: "เปิดใบสั่งงาน + นัดติดตั้ง" },
  "เบิกของ": { href: "/supply", label: "เปิดหน้า Supply / สต็อก" },
  "ติดตั้ง": { href: "/workorder", label: "เปิดใบสั่งงาน" },
  "หลังการขาย": { href: "/service", label: "เปิดหน้าดูแลหลังการขาย" },
};

export default function PipelinePage() {
  const [sel, setSel] = useState(null);
  const job = JOBS.find((j) => j.id === sel);

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="mb-5">
        <h1 className="text-xl font-bold text-[#1d1d1f]">Pipeline งาน</h1>
        <p className="text-sm text-[#6e6e73] mt-0.5">งานทุกหลังในท่อ · แตะการ์ดเพื่อดูว่าติดอยู่ขั้นไหน และเข้าไปตรวจ/ทำงานต่อได้</p>
      </div>

      <div className="flex gap-3 overflow-x-auto pb-2">
        {COLS.map((col) => {
          const items = JOBS.filter((j) => j.stage === col);
          return (
            <div key={col} className="min-w-[210px] flex-1">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-sm font-semibold text-[#1d1d1f]">{col}</span>
                <span className="text-xs text-[#a1a1a6]">{items.length}</span>
              </div>
              <div className="space-y-2">
                {items.map((j) => (
                  <button key={j.id} onClick={() => setSel(j.id)} className="w-full text-left bg-white rounded-xl border border-[#ececed] p-3 hover:border-[#F5821F] transition">
                    <div className="text-[11px] text-[#a1a1a6]">{j.id}</div>
                    <div className="text-sm font-medium text-[#1d1d1f] mt-0.5">{j.customer}</div>
                    <div className="flex items-center justify-between mt-2">
                      <span className="text-[11px] px-2 py-0.5 rounded-full bg-[#f5f5f7] text-[#6e6e73]">{j.kw} kW · {j.inverter}</span>
                      <span className="text-[#c7c9cd] text-sm">›</span>
                    </div>
                  </button>
                ))}
                {items.length === 0 && <div className="text-xs text-[#c7c9cd] py-4 text-center">—</div>}
              </div>
            </div>
          );
        })}
      </div>

      {job && <JobDetail job={job} onClose={() => setSel(null)} />}
    </div>
  );
}

function JobDetail({ job, onClose }) {
  const cur = PIPELINE_STAGES.indexOf(job.stage);
  const p = pricing(job.kw);
  const link = STAGE_LINK[job.stage];

  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-end sm:items-center justify-center p-0 sm:p-6" onClick={onClose}>
      <div className="bg-white w-full sm:max-w-2xl rounded-t-2xl sm:rounded-2xl max-h-[90vh] overflow-auto" onClick={(e) => e.stopPropagation()}>
        <div className="p-5 border-b border-[#f0f0f2] flex items-center gap-3 sticky top-0 bg-white">
          <div>
            <div className="text-[11px] text-[#a1a1a6]">{job.id}</div>
            <div className="text-lg font-bold text-[#1d1d1f]">{job.customer}</div>
          </div>
          <span className="ml-auto text-[11px] px-2 py-0.5 rounded-full bg-[#fff5ec] text-[#F5821F] font-semibold">อยู่ขั้น: {job.stage}</span>
          <button onClick={onClose} className="text-[#a1a1a6] text-xl leading-none px-1">✕</button>
        </div>

        <div className="p-5 space-y-5">
          <div>
            <div className="text-[12px] font-semibold text-[#6e6e73] mb-3">ความคืบหน้า</div>
            <div className="space-y-0">
              {PIPELINE_STAGES.map((st, i) => {
                const done = i < cur, current = i === cur;
                return (
                  <div key={st} className="flex items-center gap-3">
                    <div className="flex flex-col items-center">
                      <div className={"w-5 h-5 rounded-full flex items-center justify-center text-[10px] " + (done ? "bg-[#1a7d3a] text-white" : current ? "bg-[#F5821F] text-white" : "bg-[#eef0f2] text-[#c7c9cd]")}>
                        {done ? "✓" : current ? "●" : i + 1}
                      </div>
                      {i < PIPELINE_STAGES.length - 1 && <div className={"w-0.5 h-6 " + (done ? "bg-[#1a7d3a]" : "bg-[#eef0f2]")} />}
                    </div>
                    <div className={"text-sm pb-6 " + (current ? "font-semibold text-[#1d1d1f]" : done ? "text-[#6e6e73]" : "text-[#c7c9cd]")}>
                      {st}
                      {current && <span className="ml-2 text-[11px] text-[#F5821F]">← ค้างอยู่ตรงนี้</span>}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {link && (
            <Link href={link.href} className="block w-full text-center bg-[#F5821F] text-white rounded-xl py-3 text-sm font-semibold">
              {link.label} →
            </Link>
          )}

          <div>
            <div className="text-[12px] font-semibold text-[#6e6e73] mb-2">สเปก / ราคา (ประเมิน)</div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {[
                { l: "ขนาดระบบ", v: job.kw + " kW" },
                { l: "อินเวอร์เตอร์", v: p.inverter.model },
                { l: "จำนวนแผง", v: p.panels + " แผง" },
                { l: "ราคาขาย (ประเมิน)", v: baht(p.sell) },
                { l: "ต้นทุนรวม", v: baht(p.cost) },
                { l: "กำไร", v: baht(p.profit) },
                { l: "มาร์จิน", v: p.marginPct + "%" },
                { l: "ค่าแรงช่าง", v: baht(p.labor) },
              ].map((x) => (
                <div key={x.l} className="bg-[#f5f5f7] rounded-lg p-2.5">
                  <div className="text-[10px] text-[#6e6e73]">{x.l}</div>
                  <div className="text-sm font-semibold text-[#1d1d1f] mt-0.5">{x.v}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
