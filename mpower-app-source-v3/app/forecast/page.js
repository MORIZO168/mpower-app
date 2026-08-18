"use client";
import { useState } from "react";
import { PageHeader, RatioBar, Pill } from "@/components/ui";
import { FUNNEL, STD, ratio, forecast, baht } from "@/lib/data";

export default function ForecastPage() {
  const [leads, setLeads] = useState(130);
  const f = forecast(leads);
  const m = FUNNEL[FUNNEL.length - 1];
  const conv = ratio(m.booking, m.acard);
  const del = ratio(m.delivery, m.booking);
  const maxA = Math.max(...FUNNEL.map((x) => x.acard));

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <PageHeader title="Forecast" subtitle="จับ performance ratio → พยากรณ์ยอดขายล่วงหน้า"
        right={<Pill tone="ok">แต้มต่อ M Power</Pill>} />

      <div className="grid md:grid-cols-2 gap-4">
        <div className="card p-5">
          <div className="font-semibold mb-1 text-[#1a3c6e]">กรวยขายเดือนนี้ ({m.month})</div>
          <div className="flex items-center gap-3 my-3">
            <span className="w-20 text-sm text-[#5a6a86]">A-Card</span>
            <div className="h-6 rounded-md bg-[#378ADD]" style={{ width: "100%" }} />
            <span className="w-8 text-right text-sm font-semibold">{m.acard}</span>
          </div>
          <div className="text-xs text-[#5a6a86] ml-20 mb-2">↳ A→Booking <b className="text-[#1a7d3a]">{conv}%</b></div>
          <div className="flex items-center gap-3 my-3">
            <span className="w-20 text-sm text-[#5a6a86]">Booking</span>
            <div className="h-6 rounded-md bg-[#185FA5]" style={{ width: (m.booking / m.acard * 100) + "%" }} />
            <span className="flex-1" /><span className="w-8 text-right text-sm font-semibold">{m.booking}</span>
          </div>
          <div className="text-xs text-[#5a6a86] ml-20 mb-2">↳ Booking→Delivery <b className="text-[#b5651d]">{del}%</b></div>
          <div className="flex items-center gap-3 my-3">
            <span className="w-20 text-sm text-[#5a6a86]">Delivery</span>
            <div className="h-6 rounded-md bg-[#0C447C]" style={{ width: (m.delivery / m.acard * 100) + "%" }} />
            <span className="flex-1" /><span className="w-8 text-right text-sm font-semibold">{m.delivery}</span>
          </div>
          <div className="mt-4 pt-3 border-t border-[#e6ebf3]">
            <RatioBar label="A-Card → Booking" val={conv} std={STD.acard_booking} />
            <RatioBar label="Booking → Delivery" val={del} std={STD.booking_delivery} />
          </div>
        </div>

        <div className="card p-5">
          <div className="font-semibold mb-1 text-[#1a3c6e]">พยากรณ์เดือนหน้า</div>
          <p className="text-xs text-[#8593a8] mb-3">เลื่อนจำนวน lead ที่คาดว่าจะเข้า</p>

          <div className="flex items-center gap-3 mb-4">
            <label className="text-sm text-[#5a6a86] w-28">A-Card คาดการณ์</label>
            <input type="range" min="60" max="220" step="1" value={leads}
              onChange={(e) => setLeads(+e.target.value)} className="flex-1 accent-[#1a3c6e]" />
            <span className="w-10 text-right font-semibold">{leads}</span>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="bg-[#f6f8fc] rounded-xl p-4"><div className="text-xs text-[#5a6a86]">Booking</div><div className="text-2xl font-bold">{f.booking}</div></div>
            <div className="bg-[#f6f8fc] rounded-xl p-4"><div className="text-xs text-[#5a6a86]">Delivery</div><div className="text-2xl font-bold">{f.delivery}</div></div>
            <div className="bg-[#f6f8fc] rounded-xl p-4"><div className="text-xs text-[#5a6a86]">รายได้คาด</div><div className="text-2xl font-bold text-[#1a7d3a]">฿{(f.revenue / 1e6).toFixed(1)}M</div></div>
          </div>
          <p className="text-[11px] text-[#8593a8] mt-3">อิงสัดส่วน A→B {STD.acard_booking}% · B→Del {STD.booking_delivery}% · มูลค่าเฉลี่ย {baht(165000)}/หลัง</p>
        </div>
      </div>

      <div className="card p-5 mt-4">
        <div className="font-semibold mb-3 text-[#1a3c6e]">A-Card ย้อนหลัง 6 เดือน</div>
        <div className="flex items-end gap-3 h-40">
          {FUNNEL.map((x) => (
            <div key={x.month} className="flex-1 flex flex-col items-center gap-1">
              <div className="w-full bg-[#4da3ff] rounded-t" style={{ height: (x.acard / maxA * 130) + "px" }} title={x.acard} />
              <span className="text-[11px] text-[#8593a8]">{x.month.slice(5)}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
