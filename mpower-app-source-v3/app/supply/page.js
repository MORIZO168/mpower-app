import { PageHeader, Stat, Pill } from "@/components/ui";
import { supplyDemand, pricing, JOBS, baht } from "@/lib/data";

export default function SupplyPage() {
  const sup = supplyDemand();
  const p = pricing(10);

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <PageHeader title="Supply / สต็อก" subtitle="M Power เตรียมแค่ 2 อย่าง — แผง + อินเวอร์เตอร์"
        right={<Pill tone="mut">งาน booking {JOBS.length} หลัง</Pill>} />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
        <Stat label="แผงที่ต้องใช้" value={sup.panelsNeeded} sub={`สต็อก ${sup.panelStock}`} />
        <Stat label="แผงขาด" value={sup.panelShort} tone={sup.panelShort ? "bad" : "ok"} />
        <Stat label="อินเวอร์เตอร์ต้องใช้" value={sup.inverters.reduce((a, i) => a + i.need, 0)} />
        <Stat label="อินเวอร์เตอร์ขาด" value={sup.inverters.reduce((a, i) => a + i.short, 0)} tone="warn" />
      </div>

      <div className="card p-5 mb-4">
        <div className="font-semibold mb-3 text-[#1a3c6e]">อินเวอร์เตอร์ — matching งานกับสต็อก</div>
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-[#5a6a86] border-b border-[#e6ebf3]">
              <th className="py-2">รุ่น</th><th>ต้องใช้</th><th>สต็อก</th><th>ขาด</th><th>สถานะ</th>
            </tr>
          </thead>
          <tbody>
            {sup.inverters.map((i) => (
              <tr key={i.model} className="border-b border-[#f0f3f8]">
                <td className="py-2 font-medium">{i.model}</td>
                <td>{i.need}</td>
                <td>{i.stock}</td>
                <td>{i.short}</td>
                <td>{i.short > 0 ? <Pill tone="bad">สั่งเพิ่ม {i.short}</Pill> : <Pill tone="ok">พอ</Pill>}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="mt-3 flex items-center gap-2 text-xs text-[#8593a8]">
          <Pill tone="mut">supply matching</Pill>
          booking → คำนวณอัตโนมัติ → เทียบสต็อก → ขาด = back order → เปิด PO ไป VeroLink
        </div>
      </div>

      <div className="card p-5">
        <div className="font-semibold mb-1 text-[#1a3c6e]">โครงสร้างราคา · ตัวอย่างระบบ 10 kW</div>
        <p className="text-xs text-[#8593a8] mb-3">M Power เตรียม 2 อย่าง · ที่เหลือช่างซับเหมา all-in</p>
        <table className="w-full text-sm">
          <tbody>
            <tr className="border-b border-[#f0f3f8]"><td className="py-2">แผงโซลาร์ ({p.panels} แผ่น · 5฿/W)</td><td className="text-right font-medium">{baht(p.panelCost)}</td></tr>
            <tr className="border-b border-[#f0f3f8]"><td className="py-2">อินเวอร์เตอร์ {p.inverter.model}</td><td className="text-right font-medium">{baht(p.inverter.cost)}</td></tr>
            <tr className="border-b border-[#f0f3f8]"><td className="py-2 text-[#5a6a86]">ช่างซับเหมา all-in (6฿/W)</td><td className="text-right font-medium">{baht(p.labor)}</td></tr>
            <tr className="border-b border-[#f0f3f8]"><td className="py-2 text-[#5a6a86]">ต้นทุนรวม</td><td className="text-right font-medium">{baht(p.cost)}</td></tr>
            <tr className="border-b border-[#f0f3f8]"><td className="py-2 text-[#5a6a86]">กำไรเป้า ≥30%</td><td className="text-right font-medium text-[#1a7d3a]">+{baht(p.profit)}</td></tr>
            <tr><td className="py-2 font-semibold">ราคาขาย</td><td className="text-right font-bold text-[#1a3c6e]">{baht(p.sell)}</td></tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
