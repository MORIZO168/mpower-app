"use client";
import { useState } from "react";
import { INSTALLED, warranties, maintenance, overview, BRAND_TONE, MA_INTERVAL_MONTHS } from "@/lib/service";

const TONE = {
  bad: "text-[#c0392b] bg-[#fdece9]",
  warn: "text-[#b7791f] bg-[#fff4e0]",
  ok: "text-[#1a7d3a] bg-[#e8f7ee]",
};
const wPill = (st) => (st === "expired" ? TONE.bad : st === "expiring" ? TONE.warn : TONE.ok);
const wLabel = (st, dl) => (st === "expired" ? "หมดแล้ว" : st === "expiring" ? "เหลือ " + dl + " วัน" : "ปกติ");
const maPill = (st) => (st === "overdue" ? TONE.bad : st === "due" ? TONE.warn : TONE.ok);

function Stat({ label, value, tone }) {
  return (
    <div className="bg-white rounded-2xl p-5 border border-[#ececed]">
      <div className="text-[13px] text-[#6e6e73]">{label}</div>
      <div className={"text-3xl font-bold tracking-tight mt-1 " + (tone || "text-[#1d1d1f]")}>{value}</div>
    </div>
  );
}

export default function ServicePage() {
  const now = new Date();
  const [sel, setSel] = useState(null);
  const o = overview(INSTALLED, now);

  return (
    <div className="min-h-screen bg-[#f5f5f7]">
      <div className="max-w-5xl mx-auto px-6 py-10">
        {/* Hero */}
        <div className="mb-8">
          <div className="text-[13px] text-[#F5821F] font-semibold tracking-wide">M POWER · บริการหลังการขาย</div>
          <h1 className="text-4xl md:text-5xl font-bold text-[#1d1d1f] tracking-tight mt-2 leading-tight">ดูแลลูกค้า {o.count} ไซต์</h1>
          <p className="text-[#6e6e73] mt-3 text-lg">ทะเบียนงานที่ติดตั้งไปแล้ว · ประกัน · รอบบำรุงรักษา · เคสแจ้งซ่อม</p>
        </div>

        {/* KPI */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-12">
          <Stat label="ไซต์ในการดูแล" value={o.count} />
          <Stat label="ประกันใกล้หมด/หมด" value={o.expiring} tone={o.expiring ? "text-[#c0392b]" : "text-[#1d1d1f]"} />
          <Stat label="ถึงกำหนดล้าง/เช็ก" value={o.maDue} tone={o.maDue ? "text-[#b7791f]" : "text-[#1d1d1f]"} />
          <Stat label="เคสเปิดอยู่" value={o.tickets} tone={o.tickets ? "text-[#c0392b]" : "text-[#1d1d1f]"} />
        </div>

        {/* Alerts */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold text-[#1d1d1f] tracking-tight mb-1">สิ่งที่ต้องจัดการ</h2>
          <p className="text-[#6e6e73] mb-5">เรียงตามความเร่งด่วน · แตะเพื่อไปที่ไซต์</p>
          <div className="space-y-2">
            {o.alerts.length === 0 && <div className="bg-white rounded-2xl p-6 border border-[#ececed] text-center text-[#6e6e73]">ไม่มีรายการค้าง 🎉</div>}
            {o.alerts.map((a, i) => (
              <button key={i} onClick={() => setSel(a.site.id)} className="w-full text-left bg-white rounded-xl border border-[#ececed] p-4 flex items-center gap-3">
                <span className={"text-[11px] px-2 py-0.5 rounded-full shrink-0 " + TONE[a.tone]}>
                  {a.type === "warranty" ? "ประกัน" : a.type === "ma" ? "บำรุงรักษา" : "แจ้งซ่อม"}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="font-medium text-[#1d1d1f] text-sm">{a.site.name} <span className="text-[#a1a1a6] text-[12px]">· {a.site.area}</span></div>
                  <div className="text-[13px] text-[#6e6e73]">{a.label} — {a.detail}</div>
                </div>
                <span className="text-[#c7c9cd] shrink-0">›</span>
              </button>
            ))}
          </div>
        </div>

        {/* Installed base */}
        <div>
          <h2 className="text-2xl font-bold text-[#1d1d1f] tracking-tight mb-1">ทะเบียนไซต์ที่ติดตั้ง</h2>
          <p className="text-[#6e6e73] mb-5">แตะเพื่อดูประกันแต่ละชิ้นส่วนและประวัติดูแล</p>
          <div className="space-y-3">
            {INSTALLED.map((s) => {
              const m = maintenance(s, now);
              const flags = warranties(s, now).filter((w) => w.status !== "ok").length;
              const open = sel === s.id;
              return (
                <div key={s.id} className="bg-white rounded-2xl border border-[#ececed] overflow-hidden">
                  <button onClick={() => setSel(open ? null : s.id)} className="w-full text-left p-5 flex items-center gap-4">
                    <div className="w-2.5 h-10 rounded-full shrink-0" style={{ background: BRAND_TONE[s.brand] || "#999" }} />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-semibold text-[#1d1d1f] text-lg">{s.name}</span>
                        <span className="text-[11px] px-2 py-0.5 rounded-full text-white" style={{ background: BRAND_TONE[s.brand] || "#999" }}>{s.brand}</span>
                        {s.ticket && s.ticket.status === "open" && <span className={"text-[11px] px-2 py-0.5 rounded-full " + TONE.bad}>มีเคสเปิด</span>}
                      </div>
                      <div className="text-[13px] text-[#6e6e73] mt-0.5">{s.id} · {s.area} · {s.kwp} kWp · ติดตั้ง {s.installDate}</div>
                    </div>
                    <div className="text-right shrink-0">
                      <span className={"text-[11px] px-2 py-0.5 rounded-full " + maPill(m.status)}>
                        {m.status === "overdue" ? "MA เกินกำหนด" : m.status === "due" ? "ใกล้ถึง MA" : "MA ปกติ"}
                      </span>
                      {flags > 0 && <div className="text-[11px] text-[#c0392b] mt-1">ประกัน {flags} รายการต้องดู</div>}
                    </div>
                  </button>
                  {open && (
                    <div className="px-5 pb-5 pt-1 border-t border-[#f4f4f6] space-y-4">
                      <div>
                        <div className="text-[12px] font-semibold text-[#6e6e73] mb-2 mt-3">ประกันแต่ละชิ้นส่วน</div>
                        <div className="space-y-1.5">
                          {warranties(s, now).map((w) => (
                            <div key={w.label} className="flex items-center gap-2 text-[13px]">
                              <span className="text-[#1d1d1f] flex-1">{w.label} <span className="text-[#a1a1a6]">({w.years} ปี)</span></span>
                              <span className="text-[#6e6e73]">ถึง {w.end}</span>
                              <span className={"text-[11px] px-2 py-0.5 rounded-full " + wPill(w.status)}>{wLabel(w.status, w.daysLeft)}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                        <div className="bg-[#f5f5f7] rounded-xl p-3"><div className="text-[11px] text-[#6e6e73]">แบตเตอรี่</div><div className="font-semibold text-[#1d1d1f] mt-0.5">{s.battKwh ? s.battKwh + " kWh" : "ไม่มี"}</div></div>
                        <div className="bg-[#f5f5f7] rounded-xl p-3"><div className="text-[11px] text-[#6e6e73]">ล้าง/เช็กล่าสุด</div><div className="font-semibold text-[#1d1d1f] mt-0.5">{s.lastServiceDate}</div></div>
                        <div className="bg-[#f5f5f7] rounded-xl p-3"><div className="text-[11px] text-[#6e6e73]">รอบถัดไป</div><div className="font-semibold text-[#1d1d1f] mt-0.5">{m.next}</div></div>
                        <div className="bg-[#f5f5f7] rounded-xl p-3"><div className="text-[11px] text-[#6e6e73]">เคส</div><div className="font-semibold text-[#1d1d1f] mt-0.5">{s.ticket ? s.ticket.status : "ไม่มี"}</div></div>
                      </div>
                      {s.ticket && <div className="text-[13px] text-[#c0392b] bg-[#fdece9] rounded-xl p-3">เคสแจ้งซ่อม: {s.ticket.issue}</div>}
                      <div className="flex flex-wrap gap-2">
                        <span className="text-[12px] px-3 py-1.5 rounded-lg bg-[#1d1d1f] text-white">บันทึกการดูแล</span>
                        <span className="text-[12px] px-3 py-1.5 rounded-lg border border-[#e2e2e7] text-[#6e6e73]">เปิดเคสแจ้งซ่อม</span>
                        <span className="text-[12px] px-3 py-1.5 rounded-lg border border-[#e2e2e7] text-[#6e6e73]">เสนอแพคเกจ MA รายปี</span>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        <p className="text-[11px] text-[#a1a1a6] text-center mt-10">
          ข้อมูลตัวอย่าง · รอบบำรุงรักษาทุก {MA_INTERVAL_MONTHS} เดือน · เชื่อมทะเบียนจริง (27 หลัง + งานใหม่) เข้า Google Sheet ได้ในสเต็ปถัดไป
        </p>
      </div>
    </div>
  );
}
