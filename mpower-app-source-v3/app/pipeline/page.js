import { PageHeader, Pill } from "@/components/ui";
import { JOBS } from "@/lib/data";

const COLS = ["ออกแบบ", "ใบเสนอ", "รอติดตั้ง", "เบิกของ", "ติดตั้ง", "หลังการขาย"];

export default function PipelinePage() {
  return (
    <div className="p-6 max-w-6xl mx-auto">
      <PageHeader title="Pipeline งาน" subtitle="งานทุกหลังไล่สถานะเป็นเส้นเดียว" />
      <div className="flex gap-3 overflow-x-auto pb-2">
        {COLS.map((col) => {
          const items = JOBS.filter((j) => j.stage === col);
          return (
            <div key={col} className="min-w-[200px] flex-1">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-sm font-semibold text-[#1a3c6e]">{col}</span>
                <span className="text-xs text-[#8593a8]">{items.length}</span>
              </div>
              <div className="space-y-2">
                {items.map((j) => (
                  <div key={j.id} className="card p-3">
                    <div className="text-xs text-[#8593a8]">{j.id}</div>
                    <div className="text-sm font-medium mt-0.5">{j.customer}</div>
                    <div className="mt-2"><Pill tone="mut">{j.kw} kW · {j.inverter}</Pill></div>
                  </div>
                ))}
                {items.length === 0 && <div className="text-xs text-[#b6c0d0] py-4 text-center">—</div>}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
