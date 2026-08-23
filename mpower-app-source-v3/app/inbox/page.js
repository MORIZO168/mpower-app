"use client";
import { useState } from "react";
import { LEADS, CHANNELS, STATUS_LABEL, CHANNEL_PERF, chTone, cpl, conv } from "@/lib/inbox";

const gradeTone = (g) => (g === "A" ? "ok" : g === "B" ? "warn" : "mut");

export default function InboxPage() {
  const [ch, setCh] = useState("all");
  const list = ch === "all" ? LEADS : LEADS.filter((l) => l.channel === ch);
  const chips = ["all", ...Object.keys(CHANNELS).filter((c) => LEADS.some((l) => l.channel === c))];
  const totalLeads = CHANNEL_PERF.reduce((s, p) => s + p.leads, 0);
  const totalClosed = CHANNEL_PERF.reduce((s, p) => s + p.closed, 0);

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="mb-4">
        <h1 className="text-xl font-bold text-[#1d1d1f]">A-Card Inbox — รวมทุกช่องทาง</h1>
        <p className="text-sm text-[#6e6e73] mt-0.5">
          ทุก lead จาก LINE · Facebook · Instagram · TikTok บันทึกลง Google Sheet พร้อมแท็กที่มา → วัด Performance ต่อช่องทางได้
        </p>
      </div>

      <div className="card p-5 mb-5">
        <div className="flex items-center mb-3">
          <div className="font-semibold text-[#1d1d1f]">Performance ต่อช่องทาง · เดือนนี้</div>
          <div className="ml-auto text-sm text-[#6e6e73]">
            รวม <b className="text-[#1d1d1f]">{totalLeads}</b> lead · ปิด <b className="text-[#F5821F]">{totalClosed}</b>
          </div>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {CHANNEL_PERF.map((p) => (
            <div key={p.channel} className="rounded-xl border border-[#ececed] p-3">
              <div className="flex items-center gap-2 mb-2">
                <span className="w-2.5 h-2.5 rounded-full" style={{ background: chTone(p.channel) }} />
                <span className="text-sm font-semibold text-[#1d1d1f]">{CHANNELS[p.channel]?.label || p.channel}</span>
              </div>
              <div className="text-2xl font-bold text-[#1d1d1f] leading-none">{p.leads}<span className="text-xs font-normal text-[#a1a1a6] ml-1">leads</span></div>
              <div className="grid grid-cols-2 gap-y-1 mt-2 text-[11px] text-[#6e6e73]">
                <div>ปิดการขาย</div><div className="text-right font-medium text-[#1d1d1f]">{p.closed}</div>
                <div>Conv%</div><div className="text-right font-medium text-[#1d1d1f]">{conv(p)}%</div>
                <div>ต้นทุน/lead</div><div className="text-right font-medium text-[#1d1d1f]">฿{cpl(p)}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="flex flex-wrap gap-2 mb-3">
        {chips.map((c) => {
          const on = ch === c;
          return (
            <button key={c} onClick={() => setCh(c)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${on ? "bg-[#1d1d1f] text-white border-[#1d1d1f]" : "bg-white text-[#6e6e73] border-[#e2e2e7] hover:text-[#1d1d1f]"}`}>
              {c === "all" ? "ทั้งหมด" : CHANNELS[c]?.label || c}
            </button>
          );
        })}
      </div>

      <div className="card divide-y divide-[#f2f2f4]">
        {list.map((l) => {
          const st = STATUS_LABEL[l.status] || STATUS_LABEL.new;
          return (
            <div key={l.id} className="p-4 flex gap-3">
              <span className="mt-1.5 w-2.5 h-2.5 rounded-full shrink-0" style={{ background: chTone(l.channel) }} title={l.channel} />
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-semibold text-[#1d1d1f]">{l.name}</span>
                  <span className={`pill pill-${gradeTone(l.grade)}`}>{l.grade}</span>
                  {l.handoff && <span className="pill pill-bad">ส่งต่อคน</span>}
                  <span className="text-[11px] text-[#a1a1a6]">· {CHANNELS[l.channel]?.label} · {l.campaign}</span>
                  <span className="ml-auto text-[11px] text-[#a1a1a6]">{l.at}</span>
                </div>
                <div className="text-sm text-[#1d1d1f] mt-1">💬 {l.msg}</div>
                <div className="text-[13px] text-[#6e6e73] mt-0.5">↳ บอท: {l.reply}</div>
                <div className="flex items-center gap-2 mt-2">
                  <span className={`pill pill-${st.tone}`}>{st.label}</span>
                  {l.acard && <span className="text-[11px] text-[#a1a1a6]">→ {l.acard}</span>}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <p className="text-[11px] text-[#a1a1a6] mt-4">
        * เฟสต่อไป: ต่อ webhook LINE/Meta → เข้าแท็บ Leads_Inbox อัตโนมัติ + บอท AI ตอบตามชีต Bot_Knowledge · เงื่อนไขคำ (ราคา/ต่อรอง/คุยกับคน) เด้งส่งต่อคนจริง
      </p>
    </div>
  );
}
