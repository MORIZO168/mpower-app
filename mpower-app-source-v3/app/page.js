import { PageHeader, Stat, RatioBar, Pill } from "@/components/ui";
import { FUNNEL, STD, PIPELINE_STAGES, PIPELINE_COUNT, ratio, supplyDemand } from "@/lib/data";
import Link from "next/link";

export default function Dashboard() {
  const m = FUNNEL[FUNNEL.length - 1];
  const conv = ratio(m.booking, m.acard);
  const del = ratio(m.delivery, m.booking);
  const bor = ratio(m.backorder, m.booking + m.backorder);
  const sup = supplyDemand();

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <PageHeader title="ภาพรวม" subtitle={`เดือน ${m.month} · ข้อมูลตัวอย่าง`}
        right={<Pill tone="mut">ยังไม่ต่อ Google Sheets</Pill>} />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
        <Stat label="A-Card (lead)" value={m.acard} />
        <Stat label="Booking" value={m.booking} />
        <Stat label="Delivery" value={m.delivery} />
        <Stat label="Back order" value={m.backorder} tone="warn" />
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <div className="card p-5">
          <div className="font-semibold mb-1 text-[#1a3c6e]">Performance ratio</div>
          <p className="text-xs text-[#8593a8] mb-2">สัดส่วนแต่ละขาเทียบมาตรฐาน</p>
          <RatioBar label="A-Card → Booking" val={conv} std={STD.acard_booking} />
          <RatioBar label="Booking → Delivery" val={del} std={STD.booking_delivery} />
          <RatioBar label="Back order rate" val={bor} std={STD.backorder_rate} lowerBetter />
          <Link href="/forecast" className="inline-block mt-2 text-sm text-[#1a3c6e] font-semibold">ไปหน้า Forecast →</Link>
        </div>

        <div className="card p-5">
          <div className="font-semibold mb-1 text-[#1a3c6e]">Pipeline งาน</div>
          <p className="text-xs text-[#8593a8] mb-3">จำนวนงานในแต่ละสถานะ</p>
          <div className="space-y-2">
            {PIPELINE_STAGES.map((s) => (
              <div key={s} className="flex items-center gap-3">
                <span className="w-20 text-sm text-[#5a6a86]">{s}</span>
                <div className="flex-1 h-2 rounded-full bg-[#e6ebf3] overflow-hidden">
                  <div className="h-full bg-[#4da3ff]" style={{ width: Math.min(100, PIPELINE_COUNT[s]) + "%" }} />
                </div>
                <span className="w-8 text-right text-sm font-semibold">{PIPELINE_COUNT[s]}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="card p-5 mt-4">
        <div className="flex items-center gap-2">
          <div className="font-semibold text-[#1a3c6e]">Supply — ของที่ต้องเตรียม</div>
          <Link href="/supply" className="ml-auto text-sm text-[#1a3c6e] font-semibold">ดูทั้งหมด →</Link>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mt-3">
          <Stat label="แผงที่ต้องใช้" value={sup.panelsNeeded} sub={`สต็อก ${sup.panelStock} แผ่น`} tone={sup.panelShort ? "bad" : "ok"} />
          <Stat label="แผงขาด" value={sup.panelShort} tone={sup.panelShort ? "bad" : "ok"} />
          <Stat label="อินเวอร์เตอร์ขาด" value={sup.inverters.reduce((a, i) => a + i.short, 0)} tone="warn" />
        </div>
      </div>
    </div>
  );
}
